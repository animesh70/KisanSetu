import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { createAdvisorRouter } from '../routes/advisorRoutes.js';
import { analyzeCropImage, CropVisionError, normalizeCropVisionAnalysis } from '../services/cropVisionService.js';

const validPng = (size = 256) => Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(Math.max(0, size - 8), 1)
]);
const prediction = (overrides = {}) => ({
  imageType: 'living_crop', crop: 'Tomato', assessment: 'possibly_diseased',
  condition: 'Early blight', confidence: null, messageCode: 'POSSIBLE_DISEASE',
  model: { gate: 'internal-model-name' }, ...overrides
});
const mockFetch = (result, capture) => async (url, options) => {
  if (capture) Object.assign(capture, { url, options });
  return new Response(JSON.stringify(result), { status: 200, headers: { 'content-type': 'application/json' } });
};
const analyze = (result, hint = 'Onion', capture) => analyzeCropImage({
  imageBuffer: validPng(), mimeType: 'image/png', cropHint: hint,
  serviceUrl: 'https://example.invalid/', apiKey: 'private-test-key',
  fetchImpl: mockFetch(result, capture)
});

test('anime/poster classified non-crop has no disease, crop, confidence or provider details', async () => {
  const result = await analyze(prediction({
    imageType: 'non_crop', crop: null, assessment: 'not_applicable',
    condition: null, messageCode: 'NON_CROP'
  }));
  assert.equal(result.imageType, 'not_crop');
  assert.equal(result.crop, null);
  assert.equal(result.result, null);
  assert.equal(result.confidence, null);
  assert.equal(result.messageCode, 'NON_CROP');
  assert.doesNotMatch(JSON.stringify(result), /Early blight|private-test-key|internal-model-name/);
});

test('harvested onion stays produce without living-plant diagnosis', async () => {
  const result = await analyze(prediction({
    imageType: 'harvested_produce', crop: 'Onion', assessment: 'not_applicable',
    condition: null, messageCode: 'HARVESTED_PRODUCE'
  }));
  assert.equal(result.imageType, 'harvested_produce');
  assert.equal(result.crop, 'Onion');
  assert.equal(result.healthStatus, null);
  assert.equal(result.result, null);
  assert.equal(result.confidence, null);
});

test('healthy living crop does not force disease', async () => {
  const result = await analyze(prediction({
    assessment: 'healthy', condition: null, messageCode: 'HEALTHY'
  }));
  assert.equal(result.imageType, 'crop_or_plant');
  assert.equal(result.healthStatus, 'healthy');
  assert.equal(result.possibleCondition, null);
  assert.equal(result.confidence, null);
});

test('possible disease uses only service condition and no fabricated percentage', async () => {
  const result = await analyze(prediction());
  assert.equal(result.crop, 'Tomato');
  assert.equal(result.healthStatus, 'possibly_diseased');
  assert.equal(result.possibleCondition, 'Early blight');
  assert.equal(result.conditionConfidence, null);
});

test('unclear image does not guess crop or disease', async () => {
  const result = await analyze(prediction({
    imageType: 'crop_related_unclear', crop: null,
    assessment: 'condition_unclear', condition: null, messageCode: 'UNCLEAR'
  }));
  assert.equal(result.imageType, 'unclear');
  assert.equal(result.isCropImage, null);
  assert.equal(result.crop, null);
  assert.equal(result.result, null);
});

test('unclear living crop does not guess disease', async () => {
  const result = await analyze(prediction({
    assessment: 'condition_unclear', condition: null, messageCode: 'UNCLEAR'
  }));
  assert.equal(result.healthStatus, 'unclear');
  assert.equal(result.result, null);
});

test('unsupported onion model never borrows a different disease classifier', async () => {
  const result = await analyze(prediction({
    crop: 'Onion', assessment: 'condition_unclear',
    condition: null, messageCode: 'UNSUPPORTED_CROP'
  }));
  assert.equal(result.crop, 'Onion');
  assert.equal(result.messageCode, 'UNSUPPORTED_CROP');
  assert.equal(result.healthStatus, 'unclear');
  assert.equal(result.possibleCondition, null);
});

test('untrusted dashboard crop hint cannot override non-crop, actual bytes sent with multipart and private header', async () => {
  const capture = {};
  const result = await analyze(prediction({
    imageType: 'non_crop', crop: null, assessment: 'not_applicable',
    condition: null, messageCode: 'NON_CROP'
  }), 'Onion', capture);
  assert.equal(result.crop, null);
  assert.equal(capture.url, 'https://example.invalid/predict');
  assert.equal(capture.options.method, 'POST');
  assert.equal(capture.options.headers['X-KisanSetu-Key'], 'private-test-key');
  assert.equal(capture.options.headers['Content-Type'], undefined);
  assert.equal(capture.options.body instanceof FormData, true);
  assert.equal(capture.options.body.get('cropHint'), 'Onion');
  const image = capture.options.body.get('image');
  assert.equal(image.type, 'image/png');
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), validPng());
});

test('missing key or URL fails safely', async () => {
  for (const config of [{ apiKey: '' }, { serviceUrl: '' }]) {
    await assert.rejects(
      analyzeCropImage({ imageBuffer: validPng(), mimeType: 'image/png', serviceUrl: 'https://example.invalid', apiKey: 'key', ...config }),
      (error) => error instanceof CropVisionError && error.code === 'VISION_NOT_CONFIGURED' && error.status === 503
    );
  }
});

test('crop hint is omitted when unavailable and network failure is safe', async () => {
  const capture = {};
  await analyze(prediction(), '', capture);
  assert.equal(capture.options.body.has('cropHint'), false);
  await assert.rejects(
    analyzeCropImage({ imageBuffer: validPng(), mimeType: 'image/png', serviceUrl: 'https://example.invalid', apiKey: 'key', fetchImpl: async () => { throw new TypeError('internal network diagnostic'); } }),
    (error) => error instanceof CropVisionError && error.code === 'VISION_UNAVAILABLE' && !error.message.includes('internal')
  );
});

for (const status of [401, 422, 500]) {
  test(`ML HTTP ${status} is a safe temporary failure`, async () => {
    await assert.rejects(
      analyzeCropImage({
        imageBuffer: validPng(), mimeType: 'image/png', serviceUrl: 'https://example.invalid', apiKey: 'private-test-key',
        fetchImpl: async () => new Response('upstream secret and stack trace', { status })
      }),
      (error) => error instanceof CropVisionError && error.code === 'VISION_UNAVAILABLE' && error.status === 502
        && !error.message.includes('secret')
    );
  });
}

test('timeout and aborted upstream request are safe', async () => {
  await assert.rejects(
    analyzeCropImage({
      imageBuffer: validPng(), mimeType: 'image/png', serviceUrl: 'https://example.invalid', apiKey: 'key', timeoutMs: 5,
      fetchImpl: (_, options) => new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))))
    }),
    (error) => error instanceof CropVisionError && error.code === 'VISION_TIMEOUT' && error.status === 504
  );
});

test('malformed JSON and unexpected schema fail without diagnosis', async () => {
  for (const fetchImpl of [
    async () => new Response('{bad json', { status: 200 }),
    mockFetch(prediction({ messageCode: 'HEALTHY', condition: 'Early blight' })),
    mockFetch(prediction({ confidence: 98 })),
    mockFetch(prediction({ imageType: 'non_crop', crop: 'Onion' })),
    mockFetch({ imageType: 'non_crop', assessment: 'not_applicable', condition: null, confidence: null, messageCode: 'NON_CROP' })
  ]) {
    await assert.rejects(
      analyzeCropImage({
        imageBuffer: validPng(), mimeType: 'image/png', serviceUrl: 'https://example.invalid', apiKey: 'key', fetchImpl
      }),
      (error) => error instanceof CropVisionError && error.code === 'VISION_INVALID_RESPONSE' && error.status === 502
    );
  }
});

async function withAdvisorServer(analyzeImage, callback) {
  const app = express();
  app.use('/api/advisor', createAdvisorRouter({ analyzeImage }));
  const server = await new Promise((resolve) => {
    const listeningServer = app.listen(0, '127.0.0.1', () => resolve(listeningServer));
  });
  try {
    await callback(`http://127.0.0.1:${server.address().port}/api/advisor`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('route gives safe non-crop HTTP 200 and never returns key', async () => {
  await withAdvisorServer(async () => normalizeCropVisionAnalysis(prediction({
    imageType: 'non_crop', crop: null, assessment: 'not_applicable',
    condition: null, messageCode: 'NON_CROP'
  })), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/disease?crop=Onion`, {
      method: 'POST', headers: { 'content-type': 'image/png' }, body: validPng()
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.imageType, 'not_crop');
    assert.equal(body.result, null);
    assert.equal(body.confidence, null);
    assert.doesNotMatch(JSON.stringify(body), /private-test-key/);
  });
});

test('route missing configuration returns safe 503', async () => {
  await withAdvisorServer(async () => { throw new CropVisionError('VISION_NOT_CONFIGURED', 503, 'private details'); }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/disease`, { method: 'POST', headers: { 'content-type': 'image/png' }, body: validPng() });
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), /private details/);
  });
});

test('malformed upload remains 400', async () => {
  await withAdvisorServer(async () => prediction(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/disease`, { method: 'POST', headers: { 'content-type': 'image/png' }, body: Buffer.alloc(256, 7) });
    assert.equal(response.status, 400);
  });
});

test('upload larger than 6 MB remains 413', async () => {
  await withAdvisorServer(async () => prediction(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/disease`, { method: 'POST', headers: { 'content-type': 'image/png' }, body: validPng(6 * 1024 * 1024 + 1) });
    assert.equal(response.status, 413);
  });
});

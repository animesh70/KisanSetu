import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { createAdvisorRouter } from '../routes/advisorRoutes.js';
import { analyzeCropImage, CropVisionError, normalizeCropVisionAnalysis } from '../services/cropVisionService.js';

const validPng = (size = 256) => Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(Math.max(0, size - 8), 1)
]);

const candidate = (overrides = {}) => ({
  imageType: 'crop_or_plant',
  crop: 'Onion',
  cropConfidence: null,
  healthStatus: 'possibly_diseased',
  possibleCondition: 'Purple blotch',
  conditionConfidence: null,
  observations: ['Purple-brown lesions are visible on the leaf'],
  nextStep: 'Ask a qualified agriculture expert to inspect the crop before treatment.',
  requiresExpertConfirmation: true,
  ...overrides
});

function providerFetch(providerResult, requestCapture = null) {
  return async (url, options) => {
    if (requestCapture) Object.assign(requestCapture, { url, options, body: JSON.parse(options.body) });
    return new Response(JSON.stringify({ output_text: JSON.stringify(providerResult) }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  };
}

async function analyzeProviderResult(providerResult, cropHint = 'Onion', requestCapture = null) {
  return analyzeCropImage({
    imageBuffer: validPng(),
    mimeType: 'image/png',
    cropHint,
    apiKey: 'test-key',
    model: 'test-vision-model',
    fetchImpl: providerFetch(providerResult, requestCapture)
  });
}

test('anime or poster classification returns not_crop with no disease or confidence', async () => {
  const result = await analyzeProviderResult(candidate({
    imageType: 'not_crop', crop: null, healthStatus: null, possibleCondition: null,
    observations: ['Illustrated human characters and poster text are visible'],
    nextStep: 'Upload a clear crop photo.'
  }));

  assert.equal(result.imageType, 'not_crop');
  assert.equal(result.isCropImage, false);
  assert.equal(result.result, null);
  assert.equal(result.confidence, null);
  assert.equal(JSON.stringify(result).includes('Purple blotch'), false);
});

for (const subject of ['person photo', 'UI screenshot']) {
  test(`${subject} classification returns not_crop without a disease`, async () => {
    const result = await analyzeProviderResult(candidate({
      imageType: 'not_crop', crop: null, healthStatus: null, possibleCondition: null,
      observations: [`The image is a ${subject}`], nextStep: 'Upload a crop photo.'
    }));

    assert.equal(result.imageType, 'not_crop');
    assert.equal(result.result, null);
    assert.equal(result.conditionConfidence, null);
  });
}

test('clear crop image can continue to possible-condition screening', async () => {
  const result = await analyzeProviderResult(candidate());

  assert.equal(result.imageType, 'crop_or_plant');
  assert.equal(result.isCropImage, true);
  assert.equal(result.crop, 'Onion');
  assert.equal(result.healthStatus, 'possibly_diseased');
  assert.equal(result.possibleCondition, 'Purple blotch');
  assert.equal(result.conditionConfidence, null);
});

test('healthy plant does not force a disease', async () => {
  const result = await analyzeProviderResult(candidate({
    healthStatus: 'healthy', possibleCondition: 'Purple blotch',
    observations: ['Leaves appear evenly green'], nextStep: 'Continue monitoring.'
  }));

  assert.equal(result.healthStatus, 'healthy');
  assert.equal(result.possibleCondition, null);
  assert.equal(result.result, null);
  assert.equal(result.confidence, null);
});

test('blurry or unclear image does not guess a crop or disease', async () => {
  const result = await analyzeProviderResult(candidate({
    imageType: 'unclear', crop: 'Onion', healthStatus: 'possibly_diseased',
    possibleCondition: 'Purple blotch', observations: ['The subject is too blurry'],
    nextStep: 'Retake the image in good lighting.'
  }));

  assert.equal(result.imageType, 'unclear');
  assert.equal(result.isCropImage, null);
  assert.equal(result.crop, null);
  assert.equal(result.result, null);
  assert.equal(result.confidence, null);
});

test('dashboard crop is sent only as a weak hint and cannot override not_crop', async () => {
  const request = {};
  const result = await analyzeProviderResult(candidate({
    imageType: 'not_crop', crop: null, healthStatus: null, possibleCondition: null,
    observations: ['Anime poster'], nextStep: 'Upload a crop photo.'
  }), 'Onion', request);

  assert.equal(result.imageType, 'not_crop');
  assert.equal(result.crop, null);
  assert.match(request.body.instructions, /only a weak hint/i);
  assert.match(request.body.instructions, /must never override what is visible/i);
  assert.match(request.body.input[0].content[1].image_url, /^data:image\/png;base64,/);
  assert.equal(request.body.text.format.type, 'json_schema');
  assert.equal(request.body.text.format.strict, true);
  assert.equal(request.body.store, false);
});

test('server normalization discards uncalibrated confidence values', () => {
  const result = normalizeCropVisionAnalysis(candidate({ cropConfidence: 94, conditionConfidence: 78 }));
  assert.equal(result.cropConfidence, null);
  assert.equal(result.conditionConfidence, null);
  assert.equal(result.confidence, null);
});

test('missing vision configuration fails safely instead of returning a diagnosis', async () => {
  await assert.rejects(
    analyzeCropImage({ imageBuffer: validPng(), mimeType: 'image/png', apiKey: '', model: '' }),
    (error) => error instanceof CropVisionError && error.code === 'VISION_NOT_CONFIGURED' && error.status === 503
  );
});

async function withAdvisorServer(analyzeImage, callback) {
  const app = express();
  app.use('/api/advisor', createAdvisorRouter({ analyzeImage }));
  const server = await new Promise((resolve) => {
    const listeningServer = app.listen(0, '127.0.0.1', () => resolve(listeningServer));
  });
  try {
    const address = server.address();
    await callback(`http://127.0.0.1:${address.port}/api/advisor`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('disease endpoint returns normalized non-crop response with HTTP 200', async () => {
  const nonCrop = normalizeCropVisionAnalysis(candidate({
    imageType: 'not_crop', crop: null, healthStatus: null, possibleCondition: null,
    observations: ['Anime poster'], nextStep: 'Upload a crop photo.'
  }));
  await withAdvisorServer(async () => nonCrop, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/disease?crop=Onion`, {
      method: 'POST', headers: { 'content-type': 'image/png', 'x-file-name': 'one-piece.png' }, body: validPng()
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.imageType, 'not_crop');
    assert.equal(body.result, null);
    assert.equal(body.confidence, null);
  });
});

test('malformed image keeps HTTP 400 validation behavior', async () => {
  await withAdvisorServer(async () => candidate(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/disease`, {
      method: 'POST', headers: { 'content-type': 'image/png' }, body: Buffer.alloc(256, 7)
    });
    assert.equal(response.status, 400);
  });
});

test('image larger than 6 MB keeps HTTP 413 protection', async () => {
  await withAdvisorServer(async () => candidate(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/disease`, {
      method: 'POST', headers: { 'content-type': 'image/png' }, body: validPng((6 * 1024 * 1024) + 1)
    });
    assert.equal(response.status, 413);
  });
});

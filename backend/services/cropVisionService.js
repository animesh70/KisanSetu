const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_VISION_MODEL = 'gpt-5.6-luna';
const DEFAULT_TIMEOUT_MS = 20_000;

const IMAGE_ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    imageType: { type: 'string', enum: ['crop_or_plant', 'not_crop', 'unclear'] },
    crop: { type: ['string', 'null'] },
    cropConfidence: { type: 'null' },
    healthStatus: { type: ['string', 'null'], enum: ['healthy', 'possibly_diseased', 'unclear', null] },
    possibleCondition: { type: ['string', 'null'] },
    conditionConfidence: { type: 'null' },
    observations: { type: 'array', items: { type: 'string' }, maxItems: 6 },
    nextStep: { type: 'string' },
    requiresExpertConfirmation: { type: 'boolean' }
  },
  required: [
    'imageType',
    'crop',
    'cropConfidence',
    'healthStatus',
    'possibleCondition',
    'conditionConfidence',
    'observations',
    'nextStep',
    'requiresExpertConfirmation'
  ]
};

const NON_CROP_MESSAGE = 'This image does not appear to contain a crop or plant. Please upload a clear photo of the affected crop or leaf.';
const UNCLEAR_MESSAGE = 'I could not clearly identify a crop in this image. Try another photo in good lighting with the affected leaf or crop visible.';

export class CropVisionError extends Error {
  constructor(code, status, message) {
    super(message);
    this.name = 'CropVisionError';
    this.code = code;
    this.status = status;
  }
}

function cleanNullableText(value, maxLength = 160) {
  if (typeof value !== 'string') return null;
  const clean = value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
  return clean || null;
}

function cleanObservations(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanNullableText(item, 220))
    .filter(Boolean)
    .slice(0, 6);
}

export function normalizeCropVisionAnalysis(candidate) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    throw new CropVisionError('VISION_INVALID_RESPONSE', 502, 'Crop-image analysis returned an invalid response.');
  }

  const imageType = candidate.imageType;
  if (!['crop_or_plant', 'not_crop', 'unclear'].includes(imageType)) {
    throw new CropVisionError('VISION_INVALID_RESPONSE', 502, 'Crop-image analysis returned an invalid response.');
  }

  const observations = cleanObservations(candidate.observations);
  if (imageType === 'not_crop') {
    return {
      imageType,
      isCropImage: false,
      crop: null,
      cropConfidence: null,
      healthStatus: null,
      possibleCondition: null,
      conditionConfidence: null,
      result: null,
      confidence: null,
      observations,
      nextStep: cleanNullableText(candidate.nextStep, 500) || NON_CROP_MESSAGE,
      message: NON_CROP_MESSAGE,
      requiresExpertConfirmation: true,
      analysisMode: 'openai-vision'
    };
  }

  if (imageType === 'unclear') {
    return {
      imageType,
      isCropImage: null,
      crop: null,
      cropConfidence: null,
      healthStatus: null,
      possibleCondition: null,
      conditionConfidence: null,
      result: null,
      confidence: null,
      observations,
      nextStep: cleanNullableText(candidate.nextStep, 500) || UNCLEAR_MESSAGE,
      message: UNCLEAR_MESSAGE,
      requiresExpertConfirmation: true,
      analysisMode: 'openai-vision'
    };
  }

  const healthStatus = candidate.healthStatus;
  if (!['healthy', 'possibly_diseased', 'unclear'].includes(healthStatus)) {
    throw new CropVisionError('VISION_INVALID_RESPONSE', 502, 'Crop-image analysis returned an invalid response.');
  }

  const crop = cleanNullableText(candidate.crop, 80);
  const possibleCondition = healthStatus === 'possibly_diseased'
    ? cleanNullableText(candidate.possibleCondition, 160)
    : null;
  const normalizedHealthStatus = healthStatus === 'possibly_diseased' && !possibleCondition ? 'unclear' : healthStatus;
  const nextStep = cleanNullableText(candidate.nextStep, 500) || 'Take a clear close-up in daylight and consult a qualified agriculture expert if symptoms persist.';

  return {
    imageType,
    isCropImage: true,
    crop,
    // A general vision model does not provide calibrated crop-disease probabilities.
    cropConfidence: null,
    healthStatus: normalizedHealthStatus,
    possibleCondition: normalizedHealthStatus === 'possibly_diseased' ? possibleCondition : null,
    conditionConfidence: null,
    result: normalizedHealthStatus === 'possibly_diseased' ? possibleCondition : null,
    confidence: null,
    observations,
    nextStep,
    requiresExpertConfirmation: true,
    analysisMode: 'openai-vision'
  };
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === 'string') return payload.output_text;
  for (const outputItem of payload?.output || []) {
    for (const contentItem of outputItem?.content || []) {
      if (contentItem?.type === 'output_text' && typeof contentItem.text === 'string') return contentItem.text;
    }
  }
  return null;
}

function visionInstructions() {
  return [
    'Inspect the actual image pixels for crop-photo screening. First decide whether a crop or plant is visibly the main relevant subject.',
    'Classify anime, posters, people, vehicles, buildings, documents, screenshots, logos, memes, animals, and scenery without a visible plant subject as not_crop.',
    'Use unclear when the image is too dark, blurry, distant, heavily cropped, or otherwise insufficient to verify a plant subject.',
    'The untrusted dashboard crop hint in the user input is only a weak hint. It must never override what is visible in the image.',
    'Only for crop_or_plant, assess whether the visible plant appears healthy, possibly_diseased, or unclear. Do not force a disease.',
    'Name a possible condition only when supported by visible symptoms. Keep both confidence fields null because no calibrated classifier score is available.',
    'Give concise visible observations and a safe next step. Do not prescribe pesticide dosage. Always require expert confirmation.'
  ].join(' ');
}

export async function analyzeCropImage({
  imageBuffer,
  mimeType,
  cropHint,
  apiKey = process.env.OPENAI_API_KEY,
  model = process.env.OPENAI_VISION_MODEL || DEFAULT_VISION_MODEL,
  timeoutMs = Number(process.env.OPENAI_VISION_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
  fetchImpl = globalThis.fetch
}) {
  if (!apiKey || !model) {
    throw new CropVisionError('VISION_NOT_CONFIGURED', 503, 'Crop-image analysis is not configured.');
  }
  if (!Buffer.isBuffer(imageBuffer) || !mimeType) {
    throw new CropVisionError('VISION_INVALID_IMAGE', 400, 'The uploaded image could not be read.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS);
  let response;
  try {
    const hint = cleanNullableText(cropHint, 40);
    response = await fetchImpl(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        store: false,
        instructions: visionInstructions(),
        input: [{
          role: 'user',
          content: [
            { type: 'input_text', text: `Classify this uploaded image and, only if it is a crop or plant, screen its visible health. Untrusted dashboard crop hint: ${JSON.stringify(hint)}.` },
            { type: 'input_image', image_url: `data:${mimeType};base64,${imageBuffer.toString('base64')}`, detail: 'high' }
          ]
        }],
        text: {
          format: {
            type: 'json_schema',
            name: 'crop_image_analysis',
            strict: true,
            schema: IMAGE_ANALYSIS_SCHEMA
          }
        }
      }),
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw new CropVisionError('VISION_TIMEOUT', 504, 'Crop-image analysis timed out.');
    throw new CropVisionError('VISION_UNAVAILABLE', 502, 'Crop-image analysis is temporarily unavailable.');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new CropVisionError('VISION_UNAVAILABLE', 502, 'Crop-image analysis is temporarily unavailable.');
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new CropVisionError('VISION_INVALID_RESPONSE', 502, 'Crop-image analysis returned an invalid response.');
  }

  const outputText = extractOutputText(payload);
  if (!outputText) throw new CropVisionError('VISION_INVALID_RESPONSE', 502, 'Crop-image analysis returned an invalid response.');

  let candidate;
  try {
    candidate = JSON.parse(outputText);
  } catch {
    throw new CropVisionError('VISION_INVALID_RESPONSE', 502, 'Crop-image analysis returned an invalid response.');
  }

  return normalizeCropVisionAnalysis(candidate);
}

export function detectSupportedImageMime(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

const DEFAULT_TIMEOUT_MS = 60_000;
const INVALID_RESPONSE = 'Crop-image analysis returned an invalid response.';

export class CropVisionError extends Error {
  constructor(code, status, message) {
    super(message);
    this.name = 'CropVisionError';
    this.code = code;
    this.status = status;
  }
}

function invalidResponse() {
  throw new CropVisionError('VISION_INVALID_RESPONSE', 502, INVALID_RESPONSE);
}

function cleanNullableText(value, maxLength = 160) {
  if (typeof value !== 'string') return null;
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength) || null;
}

// Validate the ML service contract before publishing a provider-neutral result.
export function normalizeCropVisionAnalysis(candidate) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate) || candidate.confidence !== null) invalidResponse();
  if (!['imageType', 'crop', 'assessment', 'condition', 'confidence', 'messageCode'].every((field) => Object.hasOwn(candidate, field))) invalidResponse();
  const { imageType, assessment, messageCode } = candidate;
  const crop = candidate.crop === null ? null : cleanNullableText(candidate.crop, 80);
  const condition = candidate.condition === null ? null : cleanNullableText(candidate.condition, 160);
  if ((candidate.crop !== null && !crop) || (candidate.condition !== null && !condition)) invalidResponse();

  let publicType;
  let healthStatus = null;
  if (imageType === 'non_crop' && assessment === 'not_applicable' && messageCode === 'NON_CROP' && !crop && !condition) {
    publicType = 'not_crop';
  } else if (imageType === 'crop_related_unclear' && assessment === 'condition_unclear' && messageCode === 'UNCLEAR' && !condition) {
    publicType = 'unclear';
  } else if (imageType === 'harvested_produce' && ['not_applicable', 'condition_unclear'].includes(assessment) && messageCode === 'HARVESTED_PRODUCE' && !condition) {
    publicType = 'harvested_produce';
  } else if (imageType === 'living_crop') {
    publicType = 'crop_or_plant';
    if (assessment === 'healthy' && messageCode === 'HEALTHY' && !condition) healthStatus = 'healthy';
    else if (assessment === 'possibly_diseased' && messageCode === 'POSSIBLE_DISEASE' && condition) healthStatus = 'possibly_diseased';
    else if (assessment === 'condition_unclear' && ['UNCLEAR', 'UNSUPPORTED_CROP'].includes(messageCode) && !condition) healthStatus = 'unclear';
    else invalidResponse();
  } else invalidResponse();

  return {
    imageType: publicType,
    isCropImage: publicType === 'not_crop' ? false : publicType === 'unclear' ? null : true,
    crop: publicType === 'not_crop' || publicType === 'unclear' ? null : crop,
    cropConfidence: null,
    healthStatus,
    possibleCondition: healthStatus === 'possibly_diseased' ? condition : null,
    conditionConfidence: null,
    result: healthStatus === 'possibly_diseased' ? condition : null,
    confidence: null,
    messageCode,
    observations: [],
    nextStep: null,
    requiresExpertConfirmation: true,
    analysisMode: 'crop-image-screening'
  };
}

export async function analyzeCropImage({
  imageBuffer,
  mimeType,
  cropHint,
  serviceUrl = process.env.CROP_VISION_URL,
  apiKey = process.env.CROP_VISION_API_KEY,
  timeoutMs = Number(process.env.CROP_VISION_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
  fetchImpl = globalThis.fetch
}) {
  if (!serviceUrl || !apiKey) throw new CropVisionError('VISION_NOT_CONFIGURED', 503, 'Crop-image analysis is not configured.');
  if (!Buffer.isBuffer(imageBuffer) || !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    throw new CropVisionError('VISION_INVALID_IMAGE', 400, 'The uploaded image could not be read.');
  }

  let endpoint;
  try {
    const base = new URL(serviceUrl);
    if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error('Invalid URL');
    endpoint = `${base.toString().replace(/\/+$/, '')}/predict`;
  } catch {
    throw new CropVisionError('VISION_NOT_CONFIGURED', 503, 'Crop-image analysis is not configured.');
  }

  const form = new FormData();
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[mimeType];
  form.append('image', new Blob([imageBuffer], { type: mimeType }), `crop-image.${extension}`);
  const hint = cleanNullableText(cropHint, 40);
  if (hint) form.append('cropHint', hint);

  const controller = new AbortController();
  const duration = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), duration);
  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'X-KisanSetu-Key': apiKey },
      body: form,
      signal: controller.signal
    });
    if (!response.ok) throw new CropVisionError('VISION_UNAVAILABLE', 502, 'Crop-image analysis is temporarily unavailable.');
    let payload;
    try {
      payload = await response.json();
    } catch {
      invalidResponse();
    }
    return normalizeCropVisionAnalysis(payload);
  } catch (error) {
    if (controller.signal.aborted || error?.name === 'AbortError') {
      throw new CropVisionError('VISION_TIMEOUT', 504, 'Crop-image analysis timed out.');
    }
    if (error instanceof CropVisionError) throw error;
    throw new CropVisionError('VISION_UNAVAILABLE', 502, 'Crop-image analysis is temporarily unavailable.');
  } finally {
    clearTimeout(timer);
  }
}

export function detectSupportedImageMime(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

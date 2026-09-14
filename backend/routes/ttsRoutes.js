import { Router } from 'express';
import { getTtsLanguage } from '../config/ttsLanguages.js';
import { SpeechServiceError, synthesizeSpeech } from '../services/azureSpeechService.js';

export const MAX_TTS_TEXT_LENGTH = 1_200;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const requestWindows = new Map();

export function validateTtsRequest(body) {
  if (!body || typeof body.text !== 'string' || !body.text.trim()) {
    return { error: { status: 400, code: 'EMPTY_TEXT', message: 'Text is required for speech playback.' } };
  }
  if (body.text.length > MAX_TTS_TEXT_LENGTH) {
    return { error: { status: 413, code: 'TEXT_TOO_LONG', message: `Text must be ${MAX_TTS_TEXT_LENGTH} characters or fewer.` } };
  }
  if (typeof body.language !== 'string' || !getTtsLanguage(body.language)) {
    return { error: { status: 400, code: 'UNSUPPORTED_LANGUAGE', message: 'The selected speech language is not supported.' } };
  }
  return { value: { text: body.text, language: body.language } };
}

function ttsRateLimit(req, res, next) {
  const now = Date.now();
  const identity = req.ip || req.socket?.remoteAddress || 'unknown';
  const current = requestWindows.get(identity);
  if (!current || current.resetAt <= now) {
    requestWindows.set(identity, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    if (requestWindows.size > 500) {
      for (const [key, value] of requestWindows) if (value.resetAt <= now) requestWindows.delete(key);
    }
    return next();
  }
  current.count += 1;
  if (current.count > RATE_LIMIT_MAX_REQUESTS) {
    res.set('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
    return res.status(429).json({ error: { code: 'TTS_RATE_LIMITED', message: 'Too many speech requests. Please try again shortly.' } });
  }
  return next();
}

const router = Router();

router.post('/', ttsRateLimit, async (req, res) => {
  const validation = validateTtsRequest(req.body);
  if (validation.error) return res.status(validation.error.status).json({ error: { code: validation.error.code, message: validation.error.message } });

  try {
    const result = await synthesizeSpeech(validation.value);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(result.audio.length),
      'Cache-Control': 'private, max-age=300',
      'X-KisanSetu-TTS-Language': validation.value.language,
      'X-KisanSetu-TTS-Cache': result.cached ? 'HIT' : 'MISS'
    });
    return res.status(200).send(result.audio);
  } catch (error) {
    if (error instanceof SpeechServiceError) {
      return res.status(error.status).json({ error: { code: error.code, message: error.message } });
    }
    console.error('Azure Speech request failed without a recognized error code.');
    return res.status(500).json({ error: { code: 'TTS_INTERNAL_ERROR', message: 'Speech playback is temporarily unavailable.' } });
  }
});

export default router;

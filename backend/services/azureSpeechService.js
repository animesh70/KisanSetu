import { createHash } from 'node:crypto';
import { getTtsLanguage } from '../config/ttsLanguages.js';

const AZURE_OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3';
const REQUEST_TIMEOUT_MS = 12_000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_ITEMS = 200;
const IN_FLIGHT_MAX_ITEMS = 200;
const audioCache = new Map();
const inFlight = new Map();

const SPOKEN_PRICE_LABELS = Object.freeze({
  en: Object.freeze({ currency: 'rupees', perQuintal: 'rupees per quintal', decimal: 'point' }),
  hi: Object.freeze({ currency: 'रुपये', perQuintal: 'रुपये प्रति क्विंटल', decimal: 'दशमलव' }),
  mr: Object.freeze({ currency: 'रुपये', perQuintal: 'रुपये प्रति क्विंटल', decimal: 'दशांश' }),
  ur: Object.freeze({ currency: 'روپے', perQuintal: 'روپے فی کوئنٹل', decimal: 'اعشاریہ' }),
  tr: Object.freeze({ currency: 'Hindistan rupisi', perQuintal: 'Hindistan rupisi, kental başına', decimal: 'virgül' }),
  es: Object.freeze({ currency: 'rupias', perQuintal: 'rupias por quintal', decimal: 'coma' }),
  pa: Object.freeze({ currency: 'ਰੁਪਏ', perQuintal: 'ਰੁਪਏ ਪ੍ਰਤੀ ਕੁਇੰਟਲ', decimal: 'ਦਸ਼ਮਲਵ' }),
  or: Object.freeze({ currency: 'ଟଙ୍କା', perQuintal: 'ଟଙ୍କା ପ୍ରତି କ୍ୱିଣ୍ଟାଲ', decimal: 'ଦଶମିକ' }),
  bn: Object.freeze({ currency: 'রুপি', perQuintal: 'রুপি প্রতি কুইন্টাল', decimal: 'দশমিক' }),
  gu: Object.freeze({ currency: 'રૂપિયા', perQuintal: 'રૂપિયા પ્રતિ ક્વિન્ટલ', decimal: 'દશાંશ' }),
  te: Object.freeze({ currency: 'రూపాయలు', perQuintal: 'రూపాయలు ప్రతి క్వింటాల్', decimal: 'దశాంశం' }),
  ta: Object.freeze({ currency: 'ரூபாய்', perQuintal: 'ரூபாய் ஒரு குவிண்டாலுக்கு', decimal: 'புள்ளி' })
});

const COMPACT_PRICE_PATTERN = /₹\s*([\d,]+(?:\.\d+)?)(?:\s*\/\s*(q|quintal))?/gi;

export class SpeechServiceError extends Error {
  constructor(code, status, message) {
    super(message);
    this.name = 'SpeechServiceError';
    this.code = code;
    this.status = status;
  }
}

export function escapeSsml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function numberAsSsml(value, decimalWord) {
  const [integer, fraction] = String(value).replaceAll(',', '').split('.');
  const integerSsml = `<say-as interpret-as="cardinal">${integer}</say-as>`;
  if (!fraction) return integerSsml;
  const fractionSsml = [...fraction].map((digit) => `<say-as interpret-as="cardinal">${digit}</say-as>`).join(' ');
  return `${integerSsml} ${escapeSsml(decimalWord)} ${fractionSsml}`;
}

export function prepareSpeechContent(text, language) {
  const labels = SPOKEN_PRICE_LABELS[language];
  if (!labels) throw new SpeechServiceError('UNSUPPORTED_LANGUAGE', 400, 'The selected speech language is not supported.');

  let content = '';
  let cursor = 0;
  for (const match of String(text).matchAll(COMPACT_PRICE_PATTERN)) {
    content += escapeSsml(String(text).slice(cursor, match.index));
    content += `${numberAsSsml(match[1], labels.decimal)} ${escapeSsml(match[2] ? labels.perQuintal : labels.currency)}`;
    cursor = match.index + match[0].length;
  }
  content += escapeSsml(String(text).slice(cursor));
  return content;
}

export function buildSsml(text, language) {
  const config = getTtsLanguage(language);
  if (!config) throw new SpeechServiceError('UNSUPPORTED_LANGUAGE', 400, 'The selected speech language is not supported.');
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${config.locale}"><voice name="${config.voice}">${prepareSpeechContent(text, language)}</voice></speak>`;
}

export function createSpeechCacheKey(language, voice, text) {
  return createHash('sha256').update(language).update('|').update(voice).update('|').update(text).digest('hex');
}

function readCache(key, now = Date.now()) {
  const cached = audioCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= now) {
    audioCache.delete(key);
    return null;
  }
  audioCache.delete(key);
  audioCache.set(key, cached);
  return cached.audio;
}

function writeCache(key, audio, now = Date.now()) {
  audioCache.set(key, { audio, expiresAt: now + CACHE_TTL_MS });
  while (audioCache.size > CACHE_MAX_ITEMS) audioCache.delete(audioCache.keys().next().value);
}

export function clearSpeechCache() {
  audioCache.clear();
  inFlight.clear();
}

async function requestAzureSpeech({ text, language, config, fetchImpl, key, region, timeoutMs, keyHash }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetchImpl(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': AZURE_OUTPUT_FORMAT,
        'User-Agent': 'KisanSetu'
      },
      body: buildSsml(text, language),
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw new SpeechServiceError('AZURE_TIMEOUT', 504, 'Speech generation timed out. Please try again.');
    throw new SpeechServiceError('TTS_NETWORK_ERROR', 503, 'Speech playback is temporarily unavailable.');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new SpeechServiceError('AZURE_AUTH_FAILED', 502, 'Speech playback is temporarily unavailable.');
    if (response.status === 429) throw new SpeechServiceError('AZURE_RATE_LIMITED', 503, 'Speech service is busy. Please try again shortly.');
    throw new SpeechServiceError('AZURE_REQUEST_FAILED', 502, 'Speech playback is temporarily unavailable.');
  }

  const contentType = response.headers.get('content-type') || '';
  const audio = Buffer.from(await response.arrayBuffer());
  if (!contentType.toLowerCase().startsWith('audio/') || audio.length === 0) {
    throw new SpeechServiceError('INVALID_AZURE_RESPONSE', 502, 'Speech playback is temporarily unavailable.');
  }

  writeCache(keyHash, audio);
  return { audio, cached: false, config };
}

export async function synthesizeSpeech({
  text,
  language,
  fetchImpl = globalThis.fetch,
  key = process.env.AZURE_SPEECH_KEY,
  region = process.env.AZURE_SPEECH_REGION,
  timeoutMs = REQUEST_TIMEOUT_MS
}) {
  if (!key || !region || !/^[a-z0-9-]+$/i.test(region)) throw new SpeechServiceError('TTS_NOT_CONFIGURED', 503, 'Speech playback is temporarily unavailable.');
  if (typeof fetchImpl !== 'function') throw new SpeechServiceError('TTS_NETWORK_ERROR', 503, 'Speech playback is temporarily unavailable.');

  const config = getTtsLanguage(language);
  if (!config) throw new SpeechServiceError('UNSUPPORTED_LANGUAGE', 400, 'The selected speech language is not supported.');
  const keyHash = createSpeechCacheKey(language, config.voice, text);
  const cached = readCache(keyHash);
  if (cached) return { audio: cached, cached: true, config };

  const existingRequest = inFlight.get(keyHash);
  if (existingRequest) return existingRequest;
  if (inFlight.size >= IN_FLIGHT_MAX_ITEMS) throw new SpeechServiceError('TTS_BUSY', 503, 'Speech service is busy. Please try again shortly.');

  const request = requestAzureSpeech({ text, language, config, fetchImpl, key, region, timeoutMs, keyHash });
  inFlight.set(keyHash, request);
  try {
    return await request;
  } finally {
    if (inFlight.get(keyHash) === request) inFlight.delete(keyHash);
  }
}

export const FRONTEND_TTS_CACHE_MAX_ITEMS = 75;

const audioBlobCache = new Map();

function cacheKey(language, text) {
  return `${language}\0${text}`;
}

export function readTtsBlob(language, text) {
  const key = cacheKey(language, text);
  const blob = audioBlobCache.get(key);
  if (!blob) return null;
  audioBlobCache.delete(key);
  audioBlobCache.set(key, blob);
  return blob;
}

export function writeTtsBlob(language, text, blob) {
  const key = cacheKey(language, text);
  audioBlobCache.delete(key);
  audioBlobCache.set(key, blob);
  while (audioBlobCache.size > FRONTEND_TTS_CACHE_MAX_ITEMS) {
    audioBlobCache.delete(audioBlobCache.keys().next().value);
  }
}

export async function getOrFetchTtsBlob(language, text, fetchBlob) {
  const cached = readTtsBlob(language, text);
  if (cached) return cached;
  const blob = await fetchBlob();
  writeTtsBlob(language, text, blob);
  return blob;
}

export function clearTtsBlobCache() {
  audioBlobCache.clear();
}

export function getTtsBlobCacheSize() {
  return audioBlobCache.size;
}

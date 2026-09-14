import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearTtsBlobCache,
  FRONTEND_TTS_CACHE_MAX_ITEMS,
  getOrFetchTtsBlob,
  getTtsBlobCacheSize,
  readTtsBlob,
  writeTtsBlob
} from '../src/services/ttsCache.js';

test('ten sequential requests for the same language and exact text fetch one Blob', async () => {
  clearTtsBlobCache();
  let calls = 0;
  const expected = new Blob(['odia-audio'], { type: 'audio/mpeg' });
  const fetchBlob = async () => { calls += 1; return expected; };
  const results = [];
  for (let index = 0; index < 10; index += 1) {
    results.push(await getOrFetchTtsBlob('or', 'ମୁଁ ଜଣେ ପୁଅ', fetchBlob));
  }
  assert.equal(calls, 1);
  assert.ok(results.every((blob) => blob === expected));
  assert.equal(getTtsBlobCacheSize(), 1);
});

test('language and exact text are independent frontend cache-key parts', async () => {
  clearTtsBlobCache();
  let calls = 0;
  const fetchBlob = async () => new Blob([String(++calls)], { type: 'audio/mpeg' });
  const english = await getOrFetchTtsBlob('en', 'I am a boy', fetchBlob);
  const odia = await getOrFetchTtsBlob('or', 'ମୁଁ ଜଣେ ପୁଅ', fetchBlob);
  const otherEnglish = await getOrFetchTtsBlob('en', 'I am a farmer', fetchBlob);
  assert.equal(calls, 3);
  assert.notEqual(english, odia);
  assert.notEqual(english, otherEnglish);
  assert.equal(await getOrFetchTtsBlob('en', 'I am a boy', fetchBlob), english);
  assert.equal(calls, 3);
});

test('frontend Blob cache is LRU-bounded', () => {
  clearTtsBlobCache();
  const first = new Blob(['first'], { type: 'audio/mpeg' });
  writeTtsBlob('en', 'entry-0', first);
  for (let index = 1; index <= FRONTEND_TTS_CACHE_MAX_ITEMS; index += 1) {
    writeTtsBlob('en', `entry-${index}`, new Blob([String(index)], { type: 'audio/mpeg' }));
  }
  assert.equal(getTtsBlobCacheSize(), FRONTEND_TTS_CACHE_MAX_ITEMS);
  assert.equal(readTtsBlob('en', 'entry-0'), null);
  assert.ok(readTtsBlob('en', `entry-${FRONTEND_TTS_CACHE_MAX_ITEMS}`) instanceof Blob);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { TTS_LANGUAGES } from '../config/ttsLanguages.js';
import { buildSsml, clearSpeechCache, escapeSsml, prepareSpeechContent, SpeechServiceError, synthesizeSpeech } from '../services/azureSpeechService.js';
import { MAX_TTS_TEXT_LENGTH, validateTtsRequest } from '../routes/ttsRoutes.js';

const expectedLanguages = {
  en: ['en-IN', 'en-IN-NeerjaNeural'], hi: ['hi-IN', 'hi-IN-SwaraNeural'], mr: ['mr-IN', 'mr-IN-AarohiNeural'],
  ur: ['ur-IN', 'ur-IN-GulNeural'], tr: ['tr-TR', 'tr-TR-EmelNeural'], es: ['es-ES', 'es-ES-AbrilNeural'],
  pa: ['pa-IN', 'pa-IN-VaaniNeural'], or: ['or-IN', 'or-IN-SubhasiniNeural'], bn: ['bn-IN', 'bn-IN-TanishaaNeural'],
  gu: ['gu-IN', 'gu-IN-DhwaniNeural'], te: ['te-IN', 'te-IN-ShrutiNeural'], ta: ['ta-IN', 'ta-IN-PallaviNeural']
};

test('all 12 UI languages map to the requested Azure neural voices', () => {
  assert.deepEqual(Object.keys(TTS_LANGUAGES), Object.keys(expectedLanguages));
  for (const [language, [locale, voice]] of Object.entries(expectedLanguages)) assert.deepEqual(TTS_LANGUAGES[language], { locale, voice });
});

test('SSML escapes XML characters and expands compact Odia price notation', () => {
  const text = `ଆଜି ପିଆଜର ଦର ₹2,520/q & <ବଜାର> "ଠିକ୍" 'ହଁ'।`;
  const ssml = buildSsml(text, 'or');
  assert.match(ssml, /xml:lang="or-IN"/);
  assert.match(ssml, /voice name="or-IN-SubhasiniNeural"/);
  assert.ok(ssml.includes('<say-as interpret-as="cardinal">2520</say-as> ଟଙ୍କା ପ୍ରତି କ୍ୱିଣ୍ଟାଲ'));
  assert.ok(!ssml.includes('₹2,520/q'));
  assert.ok(ssml.includes('&amp; &lt;ବଜାର&gt; &quot;ଠିକ୍&quot; &apos;ହଁ&apos;'));
  assert.equal(escapeSsml('A&B<C>'), 'A&amp;B&lt;C&gt;');
});

test('all 12 languages turn rupee and q symbols into natural spoken labels', () => {
  const expectedLabels = {
    en: 'rupees per quintal', hi: 'रुपये प्रति क्विंटल', mr: 'रुपये प्रति क्विंटल', ur: 'روپے فی کوئنٹل',
    tr: 'Hindistan rupisi, kental başına', es: 'rupias por quintal', pa: 'ਰੁਪਏ ਪ੍ਰਤੀ ਕੁਇੰਟਲ',
    or: 'ଟଙ୍କା ପ୍ରତି କ୍ୱିଣ୍ଟାଲ', bn: 'রুপি প্রতি কুইন্টাল', gu: 'રૂપિયા પ્રતિ ક્વિન્ટલ',
    te: 'రూపాయలు ప్రతి క్వింటాల్', ta: 'ரூபாய் ஒரு குவிண்டாலுக்கு'
  };
  for (const [language, label] of Object.entries(expectedLabels)) {
    const spoken = prepareSpeechContent('₹2,450/q', language);
    assert.ok(spoken.includes('<say-as interpret-as="cardinal">2450</say-as>'));
    assert.ok(spoken.includes(label));
    assert.ok(!spoken.includes('₹'));
    assert.ok(!spoken.includes('/q'));
  }
});

test('decimal prices preserve their full numeric value in speech SSML', () => {
  const spoken = prepareSpeechContent('₹2,677.8/q', 'or');
  assert.ok(spoken.includes('<say-as interpret-as="cardinal">2677</say-as>'));
  assert.ok(spoken.includes('ଦଶମିକ <say-as interpret-as="characters">8</say-as>'));
});

test('request validation rejects empty, long, and unsupported input', () => {
  assert.equal(validateTtsRequest({ text: '', language: 'en' }).error.code, 'EMPTY_TEXT');
  assert.equal(validateTtsRequest({ text: 'x'.repeat(MAX_TTS_TEXT_LENGTH + 1), language: 'en' }).error.code, 'TEXT_TOO_LONG');
  assert.equal(validateTtsRequest({ text: 'hello', language: 'xx' }).error.code, 'UNSUPPORTED_LANGUAGE');
  assert.deepEqual(validateTtsRequest({ text: 'اردو ₹2,450', language: 'ur' }).value, { text: 'اردو ₹2,450', language: 'ur' });
});

test('missing Azure configuration returns a safe structured error', async () => {
  await assert.rejects(() => synthesizeSpeech({ text: 'hello', language: 'en', key: '', region: '' }), (error) => error instanceof SpeechServiceError && error.code === 'TTS_NOT_CONFIGURED' && error.status === 503);
});

test('Azure request preserves localized prose while expanding compact prices', async () => {
  clearSpeechCache();
  const text = 'ଆଜି ପିଆଜର ସର୍ବୋତ୍ତମ ବଜାର ଦର ₹2,520 ଅଟେ।';
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'audio/mpeg' } });
  };
  const result = await synthesizeSpeech({ text, language: 'or', key: 'test-key', region: 'centralindia', fetchImpl });
  assert.equal(result.cached, false);
  assert.equal(request.url, 'https://centralindia.tts.speech.microsoft.com/cognitiveservices/v1');
  assert.ok(request.options.body.includes('ଆଜି ପିଆଜର ସର୍ବୋତ୍ତମ ବଜାର ଦର'));
  assert.ok(request.options.body.includes('<say-as interpret-as="cardinal">2520</say-as> ଟଙ୍କା'));
  assert.equal(request.options.headers['Ocp-Apim-Subscription-Key'], 'test-key');
  assert.equal(request.options.headers['X-Microsoft-OutputFormat'], 'audio-24khz-48kbitrate-mono-mp3');
  assert.deepEqual([...result.audio], [1, 2, 3]);
});

test('Azure authentication, rate limit, and malformed responses are normalized', async () => {
  clearSpeechCache();
  const attempt = (status, contentType = 'application/json', body = '{}') => synthesizeSpeech({
    text: `unique-${status}-${contentType}`,
    language: 'en', key: 'test-key', region: 'centralindia',
    fetchImpl: async () => new Response(body, { status, headers: { 'content-type': contentType } })
  });
  await assert.rejects(() => attempt(401), (error) => error.code === 'AZURE_AUTH_FAILED');
  await assert.rejects(() => attempt(429), (error) => error.code === 'AZURE_RATE_LIMITED');
  await assert.rejects(() => attempt(200), (error) => error.code === 'INVALID_AZURE_RESPONSE');
});

test('identical language and text reuse the bounded in-memory audio cache', async () => {
  clearSpeechCache();
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return new Response(new Uint8Array([7, 8, 9]), { status: 200, headers: { 'content-type': 'audio/mpeg' } });
  };
  const request = { text: 'தமிழ் விலை ₹2,450', language: 'ta', key: 'test-key', region: 'centralindia', fetchImpl };
  const first = await synthesizeSpeech(request);
  const second = await synthesizeSpeech(request);
  assert.equal(first.cached, false);
  assert.equal(second.cached, true);
  assert.equal(calls, 1);
});

test('Azure timeouts and unsafe region configuration return normalized errors', async () => {
  clearSpeechCache();
  await assert.rejects(() => synthesizeSpeech({ text: 'hello', language: 'en', key: 'test-key', region: 'bad/region' }), (error) => error.code === 'TTS_NOT_CONFIGURED');
  const fetchImpl = (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
  });
  await assert.rejects(() => synthesizeSpeech({ text: 'timeout', language: 'en', key: 'test-key', region: 'centralindia', fetchImpl, timeoutMs: 5 }), (error) => error.code === 'AZURE_TIMEOUT' && error.status === 504);
});

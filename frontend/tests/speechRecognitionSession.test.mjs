import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createSpeechRecognitionSession,
  speechRecognitionErrorKey,
  startRecognitionAfterStoppingPlayback
} from '../src/services/speechRecognitionSession.js';

globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {}
};
globalThis.document = { documentElement: {} };

const { getSpeechLocale, LANGUAGE_OPTIONS } = await import('../src/i18n.js');

class MockRecognition {
  constructor(activeCounter = null) {
    this.activeCounter = activeCounter;
    this.startCalls = 0;
    this.stopCalls = 0;
    this.abortCalls = 0;
  }

  start() {
    this.startCalls += 1;
    if (this.activeCounter) {
      this.activeCounter.active += 1;
      this.activeCounter.maximum = Math.max(this.activeCounter.maximum, this.activeCounter.active);
    }
    this.onstart?.();
  }

  stop() {
    this.stopCalls += 1;
  }

  abort() {
    this.abortCalls += 1;
    if (this.activeCounter?.active) this.activeCounter.active -= 1;
    this.onerror?.({ error: 'aborted' });
    this.onend?.();
  }

  emitResult(results, resultIndex = 0) {
    this.onresult?.({ results, resultIndex });
  }

  emitError(error) {
    this.onerror?.({ error });
  }

  emitEnd() {
    if (this.activeCounter?.active) this.activeCounter.active -= 1;
    this.onend?.();
  }
}

const result = (transcript, isFinal) => Object.assign([{ transcript }], { isFinal });

function createHarness({ recognition = new MockRecognition(), submissionRef = { current: false }, initialText = '' } = {}) {
  const submitted = [];
  const composerValues = [];
  const errors = [];
  const listeningStates = [];
  const processingStates = [];
  let activeSession = null;
  let session;

  session = createSpeechRecognitionSession({
    recognition,
    submissionRef,
    initialText,
    isCurrent: () => activeSession === session,
    onListeningChange: (value) => listeningStates.push(value),
    onProcessing: () => processingStates.push('processing'),
    onComposerChange: (value) => composerValues.push(value),
    onSubmit: (message) => submitted.push(message),
    onError: (error) => errors.push(error),
    onComplete: () => {
      if (activeSession === session) activeSession = null;
    }
  });
  activeSession = session;

  return { recognition, session, submissionRef, submitted, composerValues, errors, listeningStates, processingStates, isActive: () => activeSession === session };
}

test('interim transcript appears in the composer but is not submitted', () => {
  const harness = createHarness();
  harness.session.start();
  harness.recognition.emitResult([result('what is onion', false)]);

  assert.equal(harness.composerValues.at(-1), 'what is onion');
  assert.deepEqual(harness.submitted, []);
});

test('final transcript appears in the composer and is submitted exactly once on end', () => {
  const harness = createHarness();
  harness.session.start();
  harness.recognition.emitResult([result('predict my crop price', true)]);

  assert.equal(harness.composerValues.at(-1), 'predict my crop price');
  assert.deepEqual(harness.processingStates, ['processing']);
  assert.equal(harness.recognition.stopCalls, 1);
  assert.deepEqual(harness.submitted, []);
  harness.recognition.emitEnd();

  assert.deepEqual(harness.submitted, ['predict my crop price']);
  assert.equal(harness.submissionRef.current, true);
  assert.equal(harness.isActive(), false);
});

test('empty or interim-only recognition is never submitted', () => {
  const harness = createHarness();
  harness.session.start();
  harness.recognition.emitResult([result('   ', true)]);
  harness.recognition.emitEnd();

  assert.deepEqual(harness.submitted, []);
});

test('microphone permission error restores idle state and does not submit', () => {
  const harness = createHarness();
  harness.session.start();
  harness.recognition.emitResult([result('partial words', false)]);
  harness.recognition.emitError('not-allowed');
  harness.recognition.emitEnd();

  assert.deepEqual(harness.submitted, []);
  assert.equal(harness.listeningStates.at(-1), false);
  assert.equal(speechRecognitionErrorKey(harness.errors[0]), 'assistant.voicePermission');
});

test('multiple finalized SpeechRecognition segments are joined with spaces', () => {
  const harness = createHarness();
  harness.session.start();
  harness.recognition.emitResult([result('I want to know', true)]);
  harness.recognition.emitResult([
    result('I want to know', true),
    result("today's onion price", true)
  ], 1);
  harness.recognition.emitEnd();

  assert.deepEqual(harness.submitted, ["I want to know today's onion price"]);
});

test('repeated onend callbacks cannot duplicate an already submitted message', () => {
  const harness = createHarness();
  harness.session.start();
  harness.recognition.emitResult([result('predict my crop price', true)]);
  harness.recognition.emitEnd();
  harness.recognition.emitEnd();

  assert.deepEqual(harness.submitted, ['predict my crop price']);
});

test('starting a second voice session resets transcript and submission state', () => {
  const submissionRef = { current: false };
  const first = createHarness({ submissionRef });
  first.session.start();
  first.recognition.emitResult([result('first command', true)]);
  first.recognition.emitEnd();

  submissionRef.current = false;
  const second = createHarness({ submissionRef });
  second.session.start();
  second.recognition.emitResult([result('second command', false)]);

  assert.equal(second.composerValues.at(-1), 'second command');
  assert.deepEqual(second.submitted, []);
  second.recognition.emitResult([result('second command', true)]);
  second.recognition.emitEnd();
  assert.deepEqual(second.submitted, ['second command']);
});

test('existing typed text is preserved and combined with spoken text', () => {
  const harness = createHarness({ initialText: 'Tell me' });
  harness.session.start();
  harness.recognition.emitResult([result('the onion price today', false)]);
  assert.equal(harness.composerValues.at(-1), 'Tell me the onion price today');

  harness.recognition.emitResult([result('the onion price today', true)]);
  harness.recognition.emitEnd();
  assert.deepEqual(harness.submitted, ['Tell me the onion price today']);
});

test('manual Stop finalizes valid speech but does not send interim-only speech', () => {
  const finalized = createHarness();
  finalized.session.start();
  finalized.recognition.emitResult([result('sell my onions today', true)]);
  finalized.session.stop();
  finalized.recognition.emitEnd();
  assert.deepEqual(finalized.submitted, ['sell my onions today']);

  const interimOnly = createHarness();
  interimOnly.session.start();
  interimOnly.recognition.emitResult([result('sell my', false)]);
  interimOnly.session.stop();
  interimOnly.recognition.emitEnd();
  assert.deepEqual(interimOnly.submitted, []);
});

test('late result from an aborted old session is ignored', () => {
  const oldSession = createHarness();
  oldSession.session.start();
  oldSession.session.abort();
  oldSession.recognition.emitResult([result('stale command', true)]);
  oldSession.recognition.emitEnd();

  assert.deepEqual(oldSession.submitted, []);
  assert.deepEqual(oldSession.errors, []);
});

test('rapid microphone toggles never create overlapping active recognition', () => {
  const activeCounter = { active: 0, maximum: 0 };
  const recognition = new MockRecognition(activeCounter);
  const harness = createHarness({ recognition });
  harness.session.start();
  harness.session.stop();
  harness.session.stop();
  recognition.emitEnd();

  assert.equal(activeCounter.maximum, 1);
  assert.equal(activeCounter.active, 0);
});

test('all 12 selected UI languages map to the required STT locales', () => {
  const expected = {
    en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', ur: 'ur-IN', tr: 'tr-TR', es: 'es-ES',
    pa: 'pa-IN', or: 'or-IN', bn: 'bn-IN', gu: 'gu-IN', te: 'te-IN', ta: 'ta-IN'
  };

  assert.equal(LANGUAGE_OPTIONS.length, 12);
  for (const [language, locale] of Object.entries(expected)) assert.equal(getSpeechLocale(language), locale);
});

test('assistant playback is stopped before recognition capture starts', () => {
  const calls = [];
  startRecognitionAfterStoppingPlayback(
    () => calls.push('stop-tts'),
    { start: () => calls.push('start-stt') }
  );
  assert.deepEqual(calls, ['stop-tts', 'start-stt']);
});

test('voice submission hands exact Unicode text to the shared submit callback', () => {
  const harness = createHarness();
  const odia = 'ଆଜି ପିଆଜ ବିକ୍ରି କରିବା ଭଲ କି?';
  harness.session.start();
  harness.recognition.emitResult([result(odia, true)]);
  harness.recognition.emitEnd();

  assert.deepEqual(harness.submitted, [odia]);
  assert.equal(harness.composerValues.at(-1), odia);
});

test('STT error codes remain distinct from TTS playback errors', () => {
  assert.equal(speechRecognitionErrorKey('permission-denied'), 'assistant.voicePermission');
  assert.equal(speechRecognitionErrorKey('service-not-allowed'), 'assistant.voicePermission');
  assert.equal(speechRecognitionErrorKey('audio-capture'), 'assistant.voiceAudioCapture');
  assert.equal(speechRecognitionErrorKey('no-speech'), 'assistant.voiceNoSpeech');
  assert.equal(speechRecognitionErrorKey('network'), 'assistant.voiceNetwork');
  assert.equal(speechRecognitionErrorKey('aborted'), 'assistant.voiceUnavailable');
});

import { api } from './api';
import { getOrFetchTtsBlob } from './ttsCache';

let activeSpeech = null;

function release(state) {
  if (!state || state.released) return;
  state.released = true;
  if (state.audio) {
    state.audio.pause();
    state.audio.removeAttribute('src');
    state.audio.load();
  }
  if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
  state.onStateChange?.('idle');
  if (activeSpeech === state) activeSpeech = null;
}

export function stopSpeech() {
  const state = activeSpeech;
  if (!state) return;
  state.cancelled = true;
  state.controller.abort();
  state.resolvePlayback?.(false);
  release(state);
}

export async function speakText(text, language, { onStateChange } = {}) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('EMPTY_SPEECH_TEXT');
  stopSpeech();

  const state = { controller: new AbortController(), onStateChange, cancelled: false, released: false };
  activeSpeech = state;
  onStateChange?.('loading');

  try {
    const audioBlob = await getOrFetchTtsBlob(
      language,
      text,
      () => api.synthesizeSpeech(text, language, state.controller.signal)
    );
    if (state.cancelled || activeSpeech !== state) return false;
    state.objectUrl = URL.createObjectURL(audioBlob);
    state.audio = new Audio(state.objectUrl);
    state.audio.preload = 'auto';
    onStateChange?.('speaking');

    return await new Promise((resolve, reject) => {
      state.resolvePlayback = resolve;
      state.audio.onended = () => resolve(true);
      state.audio.onerror = () => reject(new Error('AUDIO_PLAYBACK_FAILED'));
      state.audio.play().catch(() => reject(new Error('AUDIO_PLAYBACK_REJECTED')));
    });
  } catch (error) {
    if (state.cancelled || error?.name === 'AbortError') return false;
    throw error;
  } finally {
    release(state);
  }
}

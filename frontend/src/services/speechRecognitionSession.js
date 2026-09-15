function cleanTranscript(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

export function joinTranscriptParts(...parts) {
  return parts.flat().map(cleanTranscript).filter(Boolean).join(' ');
}

export function speechRecognitionErrorKey(error) {
  const code = typeof error === 'string' ? error : error?.error || error?.code || error?.name;
  if (code === 'not-allowed' || code === 'permission-denied' || code === 'service-not-allowed') return 'assistant.voicePermission';
  if (code === 'audio-capture') return 'assistant.voiceAudioCapture';
  if (code === 'no-speech') return 'assistant.voiceNoSpeech';
  if (code === 'network') return 'assistant.voiceNetwork';
  return 'assistant.voiceUnavailable';
}

export function startRecognitionAfterStoppingPlayback(stopPlayback, session) {
  stopPlayback();
  session.start();
}

export function createSpeechRecognitionSession({
  recognition,
  submissionRef,
  isCurrent,
  initialText = '',
  onListeningChange,
  onProcessing,
  onComposerChange,
  onSubmit,
  onError,
  onComplete
}) {
  let closed = false;
  let cancelled = false;
  let stopRequested = false;
  const finalSegments = new Map();

  const isActive = () => !closed && isCurrent();
  const finalizedSpeech = () => [...finalSegments.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, transcript]) => transcript);
  const finalMessage = () => joinTranscriptParts(initialText, finalizedSpeech());

  const close = ({ submit = false, notifyListening = true, notifyComposer = true } = {}) => {
    if (closed) return;
    closed = true;
    if (notifyListening) onListeningChange(false);

    const speech = joinTranscriptParts(finalizedSpeech());
    const message = finalMessage();
    if (submit && !cancelled && speech && !submissionRef.current) {
      // Lock before the async chat pipeline is invoked. onend cannot submit twice.
      submissionRef.current = true;
      onComposerChange(message);
      onComplete();
      onSubmit(message);
      return;
    }

    if (notifyComposer) onComposerChange(cleanTranscript(initialText));
    onComplete();
  };

  const requestStop = () => {
    if (!isActive() || stopRequested) return;
    stopRequested = true;
    onProcessing?.();
    try {
      // A graceful stop preserves any final segments the browser emits before onend.
      recognition.stop();
    } catch (error) {
      cancelled = true;
      submissionRef.current = true;
      close();
      onError(error);
    }
  };

  recognition.onstart = () => {
    if (isActive()) onListeningChange(true);
  };

  recognition.onresult = (event) => {
    if (!isActive() || submissionRef.current) return;
    const results = event?.results;
    if (!results || typeof results.length !== 'number') return;

    const startIndex = Number.isInteger(event.resultIndex) ? Math.max(0, event.resultIndex) : 0;
    for (let index = startIndex; index < results.length; index += 1) {
      const result = results[index];
      if (!result?.isFinal) continue;
      const transcript = cleanTranscript(result[0]?.transcript);
      if (transcript) finalSegments.set(index, transcript);
    }

    const interimSegments = [];
    for (let index = 0; index < results.length; index += 1) {
      const result = results[index];
      if (result?.isFinal || finalSegments.has(index)) continue;
      const transcript = cleanTranscript(result?.[0]?.transcript);
      if (transcript) interimSegments.push(transcript);
    }

    onComposerChange(joinTranscriptParts(initialText, finalizedSpeech(), interimSegments));
    // A complete final result ends capture immediately; onend remains the sole submitter.
    if (finalSegments.size && !interimSegments.length) requestStop();
  };

  // onend is the single owner of successful voice submission.
  recognition.onend = () => {
    if (isActive()) close({ submit: true });
  };

  recognition.onerror = (event) => {
    if (!isActive()) return;
    const expectedAbort = cancelled && event?.error === 'aborted';
    cancelled = true;
    submissionRef.current = true;
    close();
    if (!expectedAbort) onError(event);
  };

  const abort = (notifyListening = true, notifyComposer = true) => {
    if (closed) return;
    cancelled = true;
    submissionRef.current = true;
    close({ notifyListening, notifyComposer });
    try {
      recognition.abort();
    } catch {
      // An already-ended browser recognition instance needs no cleanup.
    }
  };

  return {
    start() {
      if (!isActive()) return;
      try {
        recognition.start();
      } catch (error) {
        cancelled = true;
        submissionRef.current = true;
        close();
        onError(error);
      }
    },
    stop() {
      requestStop();
    },
    abort,
    dispose() {
      abort(false, false);
    }
  };
}

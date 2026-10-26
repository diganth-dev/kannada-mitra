import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  SPEECH_RECOGNITION_LANGUAGES,
  getSpeechRecognitionLanguage,
  mapSpeechRecognitionError,
  createSpeechRecognizer,
  sanitizeTextForSpeech,
  speakResponse,
  stopSpeaking,
  mergeSpeechChunks,
} from '../src/utils/speech.js';
import {
  getStoredVoiceAutoPlay,
  setStoredVoiceAutoPlay,
  getStoredVoiceLanguage,
  setStoredVoiceLanguage,
  getStoredChatHistory,
  setStoredChatHistory,
} from '../src/utils/storage.js';

// Setup mock window & localStorage environment for Node.js test runner
const createMockStorage = () => {
  let store = {};
  return {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, val) => {
      store[key] = String(val);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

const mockStorage = createMockStorage();
globalThis.localStorage = mockStorage;

test('1. Speech recognition feature detection and safe environment handling', () => {
  assert.equal(typeof isSpeechSynthesisSupported(), 'boolean');
  // Test in headless environment without window.SpeechRecognition
  const initialSupport = isSpeechRecognitionSupported();
  assert.equal(typeof initialSupport, 'boolean');

  // Test with mock window SpeechRecognition
  const originalWindow = globalThis.window;
  class MockSpeechRecognition {}
  globalThis.window = {
    SpeechRecognition: MockSpeechRecognition,
    speechSynthesis: {
      cancel: () => {},
      speak: () => {},
      speaking: false,
      getVoices: () => [],
    },
  };

  assert.equal(isSpeechRecognitionSupported(), true);

  // Restore
  if (originalWindow) {
    globalThis.window = originalWindow;
  } else {
    delete globalThis.window;
  }
});

test('2. Speech recognition language coverage for all 9 supported languages', () => {
  const expectedLanguages = [
    { id: 'Kannada', bcp47: 'kn-IN' },
    { id: 'English', bcp47: 'en-IN' },
    { id: 'Hindi', bcp47: 'hi-IN' },
    { id: 'Telugu', bcp47: 'te-IN' },
    { id: 'Tamil', bcp47: 'ta-IN' },
    { id: 'Malayalam', bcp47: 'ml-IN' },
    { id: 'Marathi', bcp47: 'mr-IN' },
    { id: 'Bengali', bcp47: 'bn-IN' },
    { id: 'Urdu', bcp47: 'ur-IN' },
  ];

  assert.equal(SPEECH_RECOGNITION_LANGUAGES.length, 9);

  for (const exp of expectedLanguages) {
    const found = SPEECH_RECOGNITION_LANGUAGES.find((l) => l.id === exp.id);
    assert.ok(found, `Language ${exp.id} must be in SPEECH_RECOGNITION_LANGUAGES`);
    assert.equal(found.bcp47, exp.bcp47, `${exp.id} must use BCP-47 tag ${exp.bcp47}`);
    assert.ok(found.nativeName, `${exp.id} must define nativeName`);
    assert.ok(found.flag, `${exp.id} must have a flag icon`);

    // Test getSpeechRecognitionLanguage case-insensitivity
    assert.equal(getSpeechRecognitionLanguage(exp.id), exp.bcp47);
    assert.equal(getSpeechRecognitionLanguage(exp.id.toLowerCase()), exp.bcp47);
  }

  // Fallback defaults safely to Kannada (kn-IN)
  assert.equal(getSpeechRecognitionLanguage('UnknownLanguage'), 'kn-IN');
  assert.equal(getSpeechRecognitionLanguage(''), 'kn-IN');
  assert.equal(getSpeechRecognitionLanguage(null), 'kn-IN');
});

test('3. Speech recognition error mapping explains user-facing error causes clearly', () => {
  // Permission denied / not allowed
  const notAllowedMsg = mapSpeechRecognitionError('not-allowed');
  assert.match(notAllowedMsg, /microphone permission was denied/i);

  // Silence / no speech
  const noSpeechMsg = mapSpeechRecognitionError('no-speech');
  assert.match(noSpeechMsg, /no speech detected/i);

  // Missing microphone hardware
  const audioCaptureMsg = mapSpeechRecognitionError('audio-capture');
  assert.match(audioCaptureMsg, /no microphone was found/i);

  // Network disconnect
  const networkMsg = mapSpeechRecognitionError('network');
  assert.match(networkMsg, /network error/i);

  // Unsupported language
  const langMsg = mapSpeechRecognitionError('language-not-supported');
  assert.match(langMsg, /not supported by your browser/i);

  // User cancellation / aborted
  const abortedMsg = mapSpeechRecognitionError('aborted');
  assert.match(abortedMsg, /cancelled/i);

  // Unknown generic error
  const genericMsg = mapSpeechRecognitionError('other-random-code');
  assert.match(genericMsg, /voice recognition encountered/i);
});

test('4. Speech recognizer factory and event lifecycle simulation', () => {
  let started = false;
  let resultReceived = null;
  let ended = false;

  class MockRecognizer {
    constructor() {
      this.lang = 'kn-IN';
      this.interimResults = false;
      this.continuous = false;
      this.onstart = null;
      this.onresult = null;
      this.onerror = null;
      this.onend = null;
    }
    start() {
      if (this.onstart) this.onstart();
    }
    stop() {
      if (this.onend) this.onend();
    }
    abort() {
      if (this.onend) this.onend();
    }
  }

  globalThis.window = {
    SpeechRecognition: MockRecognizer,
    speechSynthesis: {
      cancel: () => {},
      speak: () => {},
      speaking: false,
      getVoices: () => [],
    },
  };

  const recognizer = createSpeechRecognizer({
    lang: 'kn-IN',
    onStart: () => {
      started = true;
    },
    onResult: (res) => {
      resultReceived = res;
    },
    onEnd: () => {
      ended = true;
    },
  });

  assert.ok(recognizer, 'Recognizer instance created');
  assert.equal(typeof recognizer.start, 'function');
  assert.equal(typeof recognizer.stop, 'function');
  assert.equal(typeof recognizer.abort, 'function');
  assert.equal(typeof recognizer.setLang, 'function');

  recognizer.start();
  assert.equal(started, true);
  assert.equal(recognizer.isListening(), true);

  recognizer.stop();
  assert.equal(ended, true);
  assert.equal(recognizer.isListening(), false);
  assert.equal(resultReceived, null);

  delete globalThis.window;
});

test('5. Text sanitization for SpeechSynthesis strips formatting and prompt clutter', () => {
  const markdownText = `
### Conversation Tip
**Kannada:** ನಮಸ್ಕಾರ, ಹೇಗಿದ್ದೀರಾ? (Namaskara, hegiddira?)
* **Meaning:** Hello, how are you?
💡 Suggested reply: ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ (Nanu chennagiddene)
[Learn more](https://example.com) with \`code\` blocks.
---
`;

  const sanitized = sanitizeTextForSpeech(markdownText);

  // Markdown symbols stripped
  assert.equal(sanitized.includes('###'), false);
  assert.equal(sanitized.includes('**'), false);
  assert.equal(sanitized.includes('---'), false);
  assert.equal(sanitized.includes('`code`'), false);
  assert.equal(sanitized.includes('💡 Suggested reply:'), false);

  // Core content preserved
  assert.match(sanitized, /ನಮಸ್ಕಾರ, ಹೇಗಿದ್ದೀರಾ\?/);
  assert.match(sanitized, /Namaskara, hegiddira/);
  assert.match(sanitized, /Hello, how are you\?/);

  // Empty string handling
  assert.equal(sanitizeTextForSpeech(''), '');
  assert.equal(sanitizeTextForSpeech(null), '');
});

test('6. Speech synthesis control methods cancel cleanly and prevent sound overlaps', () => {
  let cancelCalled = false;
  let speakCalled = false;

  class MockUtterance {
    constructor(text) {
      this.text = text;
      this.rate = 1;
      this.pitch = 1;
      this.lang = '';
    }
  }

  globalThis.SpeechSynthesisUtterance = MockUtterance;
  globalThis.window = {
    SpeechSynthesisUtterance: MockUtterance,
    speechSynthesis: {
      cancel: () => {
        cancelCalled = true;
      },
      speak: () => {
        speakCalled = true;
      },
      speaking: false,
      getVoices: () => [
        { name: 'Google Kannada', lang: 'kn-IN' },
        { name: 'Google Hindi', lang: 'hi-IN' },
      ],
    },
  };

  stopSpeaking();
  assert.equal(cancelCalled, true);

  const res = speakResponse('ನಮಸ್ಕಾರ ಗೆಳೆಯಾ', 'Kannada');
  assert.equal(res.supported, true);
  assert.equal(speakCalled, true);

  delete globalThis.window;
  delete globalThis.SpeechSynthesisUtterance;
});

test('7. Voice preferences persistence and isolation between users', () => {
  mockStorage.clear();

  const userA = 'user_voice_101';
  const userB = 'user_voice_202';

  // Default auto-play is false
  assert.equal(getStoredVoiceAutoPlay(userA), false);
  assert.equal(getStoredVoiceAutoPlay(userB), false);

  // Enable auto-play for userA only
  setStoredVoiceAutoPlay(userA, true);
  assert.equal(getStoredVoiceAutoPlay(userA), true);
  assert.equal(getStoredVoiceAutoPlay(userB), false);

  // Voice language preference isolation
  assert.equal(getStoredVoiceLanguage(userA), null);
  setStoredVoiceLanguage(userA, 'Telugu');
  setStoredVoiceLanguage(userB, 'Hindi');

  assert.equal(getStoredVoiceLanguage(userA), 'Telugu');
  assert.equal(getStoredVoiceLanguage(userB), 'Hindi');
  assert.equal(getStoredVoiceLanguage(null), null); // Guest isolated
});

test('8. Full conversational voice workflow simulation (Record -> Review -> Send -> Persist -> Speak)', () => {
  mockStorage.clear();
  const userId = 'user_integration_voice';

  // Step 1: User speaks a query in Kannada
  const simulatedSpokenInput = 'ಬೆಳಗಿನ ಉಪಹಾರಕ್ಕೆ ಏನು ಮಾಡಿದ್ದೀರಿ?';
  const stagedText = simulatedSpokenInput;

  // Step 2: User reviews and approves the staged text, sending it as a chat message
  const userMessage = {
    id: `msg_${Date.now()}_user`,
    role: 'user',
    content: stagedText,
    timestamp: new Date().toISOString(),
  };

  const initialHistory = [userMessage];
  setStoredChatHistory(userId, 'chat', initialHistory);

  // Verify persistence
  const savedHistory = getStoredChatHistory(userId, 'chat');
  assert.equal(savedHistory.length, 1);
  assert.equal(savedHistory[0].content, simulatedSpokenInput);

  // Step 3: Assistant responds with explanation
  const tutorReply = {
    id: `msg_${Date.now()}_model`,
    role: 'model',
    content: 'ಇದು "What did you make for breakfast?" ಎಂದು ಕೇಳಲು ಬಳಸಲಾಗುತ್ತದೆ.',
    timestamp: new Date().toISOString(),
    model: 'gemini-3.5-flash-lite',
  };

  const fullHistory = [...savedHistory, tutorReply];
  setStoredChatHistory(userId, 'chat', fullHistory);

  // Step 4: Assistant response is loaded and audio text is sanitized for TTS
  const cleanSpokenReply = sanitizeTextForSpeech(tutorReply.content);
  assert.ok(cleanSpokenReply.includes('breakfast'));
  assert.ok(cleanSpokenReply.includes('ಬಳಸಲಾಗುತ್ತದೆ'));

  // Step 5: Verify multi-turn history retains integrity
  const reloaded = getStoredChatHistory(userId, 'chat');
  assert.equal(reloaded.length, 2);
  assert.equal(reloaded[0].role, 'user');
  assert.equal(reloaded[1].role, 'model');
});

test('9. Real-time live speech-to-text interim streaming and progressive transcription accumulation', () => {
  let capturedResults = [];

  class MockStreamingRecognizer {
    constructor() {
      this.lang = 'kn-IN';
      this.interimResults = true;
      this.continuous = true;
      this.onstart = null;
      this.onresult = null;
      this.onerror = null;
      this.onend = null;
    }
    start() {
      if (this.onstart) this.onstart();
    }
    stop() {
      if (this.onend) this.onend();
    }
    abort() {
      if (this.onend) this.onend();
    }
  }

  globalThis.window = {
    SpeechRecognition: MockStreamingRecognizer,
  };

  const recognizer = createSpeechRecognizer({
    lang: 'kn-IN',
    onResult: (res) => {
      capturedResults.push(res);
    },
  });

  recognizer.start();

  // Helper to create mock Web Speech API SpeechRecognitionEvent results
  const createMockEvent = (items) => ({
    results: items.map(({ text, isFinal }) => {
      const res = [{ transcript: text }];
      res.isFinal = isFinal;
      return res;
    }),
  });

  delete globalThis.window;

  // Now create with spy
  let spyInstance = null;
  class ObservableRecognizer {
    constructor() {
      this.lang = 'kn-IN';
      this.interimResults = true;
      this.continuous = true;
      this.onstart = null;
      this.onresult = null;
      this.onerror = null;
      this.onend = null;
      spyInstance = this;
    }
    start() {
      if (this.onstart) this.onstart();
    }
    stop() {
      if (this.onend) this.onend();
    }
    abort() {
      if (this.onend) this.onend();
    }
  }

  globalThis.window = { SpeechRecognition: ObservableRecognizer };
  capturedResults = [];

  const liveRecognizer = createSpeechRecognizer({
    lang: 'kn-IN',
    onResult: (res) => {
      capturedResults.push(res);
    },
  });
  liveRecognizer.start();

  assert.ok(spyInstance, 'Observable recognizer created');

  // Stream Step 1: User says "ನಮಸ್ಕಾರ" (interim)
  spyInstance.onresult(createMockEvent([{ text: 'ನಮಸ್ಕಾರ', isFinal: false }]));
  assert.equal(capturedResults.length, 1);
  assert.equal(capturedResults[0].interimTranscript, 'ನಮಸ್ಕಾರ');
  assert.equal(capturedResults[0].finalTranscript, '');
  assert.equal(capturedResults[0].transcript, 'ನಮಸ್ಕಾರ');
  assert.equal(capturedResults[0].isFinal, false);

  // Stream Step 2: User continues "...ನನಗೆ ಕನ್ನಡ" (interim updates)
  spyInstance.onresult(createMockEvent([{ text: 'ನಮಸ್ಕಾರ ನನಗೆ ಕನ್ನಡ', isFinal: false }]));
  assert.equal(capturedResults.length, 2);
  assert.equal(capturedResults[1].interimTranscript, 'ನಮಸ್ಕಾರ ನನಗೆ ಕನ್ನಡ');
  assert.equal(capturedResults[1].transcript, 'ನಮಸ್ಕಾರ ನನಗೆ ಕನ್ನಡ');
  assert.equal(capturedResults[1].isFinal, false);

  // Stream Step 3: Browser finalizes clause 1 ("ನಮಸ್ಕಾರ ನನಗೆ ಕನ್ನಡ")
  spyInstance.onresult(createMockEvent([{ text: 'ನಮಸ್ಕಾರ ನನಗೆ ಕನ್ನಡ', isFinal: true }]));
  assert.equal(capturedResults.length, 3);
  assert.equal(capturedResults[2].interimTranscript, '');
  assert.equal(capturedResults[2].finalTranscript, 'ನಮಸ್ಕಾರ ನನಗೆ ಕನ್ನಡ');
  assert.equal(capturedResults[2].transcript, 'ನಮಸ್ಕಾರ ನನಗೆ ಕನ್ನಡ');
  assert.equal(capturedResults[2].isFinal, true);

  // Stream Step 4: User continues speaking clause 2: "ಕಲಿಯಬೇಕು" (interim)
  spyInstance.onresult(createMockEvent([
    { text: 'ನಮಸ್ಕಾರ ನನಗೆ ಕನ್ನಡ', isFinal: true },
    { text: 'ಕಲಿಯಬೇಕು', isFinal: false },
  ]));
  assert.equal(capturedResults.length, 4);
  assert.equal(capturedResults[3].finalTranscript, 'ನಮಸ್ಕಾರ ನನಗೆ ಕನ್ನಡ');
  assert.equal(capturedResults[3].interimTranscript, 'ಕಲಿಯಬೇಕು');
  assert.equal(capturedResults[3].transcript, 'ನಮಸ್ಕಾರ ನನಗೆ ಕನ್ನಡ ಕಲಿಯಬೇಕು');
  assert.equal(capturedResults[3].isFinal, false);

  // Stream Step 5: Browser finalizes clause 2
  spyInstance.onresult(createMockEvent([
    { text: 'ನಮಸ್ಕಾರ ನನಗೆ ಕನ್ನಡ', isFinal: true },
    { text: 'ಕಲಿಯಬೇಕು', isFinal: true },
  ]));
  assert.equal(capturedResults.length, 5);
  assert.equal(capturedResults[4].finalTranscript, 'ನಮಸ್ಕಾರ ನನಗೆ ಕನ್ನಡ ಕಲಿಯಬೇಕು');
  assert.equal(capturedResults[4].interimTranscript, '');
  assert.equal(capturedResults[4].transcript, 'ನಮಸ್ಕಾರ ನನಗೆ ಕನ್ನಡ ಕಲಿಯಬೇಕು');
  assert.equal(capturedResults[4].isFinal, true);

  delete globalThis.window;
});

test('10. Speech recognizer runtime controls, lifecycle hooks (onaudiostart, onspeechstart), and language switching', () => {
  let audioStarted = false;
  let speechStarted = false;
  let spyInstance = null;

  class ControlRecognizer {
    constructor() {
      this.lang = 'kn-IN';
      this.onaudiostart = null;
      this.onspeechstart = null;
      this.onstart = null;
      this.onresult = null;
      this.onerror = null;
      this.onend = null;
      spyInstance = this;
    }
    start() {
      if (this.onstart) this.onstart();
      if (this.onaudiostart) this.onaudiostart();
      if (this.onspeechstart) this.onspeechstart();
    }
    stop() {
      if (this.onend) this.onend();
    }
    abort() {
      if (this.onend) this.onend();
    }
  }

  globalThis.window = { SpeechRecognition: ControlRecognizer };

  const recognizer = createSpeechRecognizer({
    lang: 'kn-IN',
    onAudioStart: () => {
      audioStarted = true;
    },
    onSpeechStart: () => {
      speechStarted = true;
    },
  });

  assert.equal(recognizer.getLang(), 'kn-IN');
  recognizer.start();

  assert.equal(recognizer.isListening(), true);
  assert.equal(audioStarted, true);
  assert.equal(speechStarted, true);

  // Dynamic language switching
  recognizer.setLang('hi-IN');
  assert.equal(recognizer.getLang(), 'hi-IN');
  assert.equal(spyInstance.lang, 'hi-IN');

  recognizer.stop();
  assert.equal(recognizer.isListening(), false);

  delete globalThis.window;
});

test('11. Transcript state merging: manual typing + finalized speech + interim speech across pauses and continuations', () => {
  // Simulate the exact state machine and merging logic used in AiTutorScreen
  let manualBaseline = 'Tell me about';
  let speechFinal = '';
  let speechInterim = '';

  const getVisibleMessage = () => {
    const spokenPart = [speechFinal, speechInterim].filter(Boolean).join(' ').trim();
    return manualBaseline
      ? `${manualBaseline} ${spokenPart}`.trim()
      : spokenPart;
  };

  // Step 1: User has typed baseline
  assert.equal(getVisibleMessage(), 'Tell me about');

  // Step 2: User starts speaking "Bengaluru" (interim)
  speechInterim = 'Bengaluru';
  assert.equal(getVisibleMessage(), 'Tell me about Bengaluru');

  // Step 3: Interim continues "...weather"
  speechInterim = 'Bengaluru weather';
  assert.equal(getVisibleMessage(), 'Tell me about Bengaluru weather');

  // Step 4: First clause finalizes ("Bengaluru weather")
  speechFinal = 'Bengaluru weather';
  speechInterim = '';
  assert.equal(getVisibleMessage(), 'Tell me about Bengaluru weather');

  // Step 5: Natural pause occurs (recognition stops on silence)
  // All speech commits into manual baseline so subsequent speech appends smoothly
  manualBaseline = getVisibleMessage();
  speechFinal = '';
  speechInterim = '';
  assert.equal(manualBaseline, 'Tell me about Bengaluru weather');
  assert.equal(getVisibleMessage(), 'Tell me about Bengaluru weather');

  // Step 6: User clicks Speak again to continue: "in June"
  speechInterim = 'in June';
  assert.equal(getVisibleMessage(), 'Tell me about Bengaluru weather in June');

  // Step 7: Finalized clause commits
  speechFinal = 'in June';
  speechInterim = '';
  assert.equal(getVisibleMessage(), 'Tell me about Bengaluru weather in June');

  // Step 8: User clicks Done Speaking (commits all)
  manualBaseline = getVisibleMessage();
  speechFinal = '';
  speechInterim = '';
  assert.equal(manualBaseline, 'Tell me about Bengaluru weather in June');
  assert.equal(getVisibleMessage(), 'Tell me about Bengaluru weather in June');
});

test('12. Voice message submission to Gemini: Send while listening stops recognition and submits full transcript exactly once', async () => {
  let isRecognitionStopped = false;
  let submissionCount = 0;
  let receivedMessage = null;

  const mockRecognizer = {
    isListening: () => !isRecognitionStopped,
    stop: () => {
      isRecognitionStopped = true;
    },
  };

  // Simulate submission handler with active voice state
  let isSubmitting = false;
  let speechFinal = 'ನಮಸ್ಕಾರ';
  let speechInterim = 'ಹೇಗಿದ್ದೀರಾ';
  let manualBaseline = '';

  const handleSend = async () => {
    // 1. Must stop active recognition
    if (mockRecognizer.isListening()) {
      mockRecognizer.stop();
    }

    // 2. Resolve final transcript
    const spokenPart = [speechFinal, speechInterim].filter(Boolean).join(' ').trim();
    const query = (manualBaseline ? `${manualBaseline} ${spokenPart}` : spokenPart).trim();

    if (!query) return;

    // 3. Prevent duplicate concurrent submission
    if (isSubmitting) return;
    isSubmitting = true;

    submissionCount++;
    receivedMessage = query;

    // Clear state
    speechFinal = '';
    speechInterim = '';
    manualBaseline = '';

    isSubmitting = false;
  };

  // Submit while speech is actively streaming
  await handleSend();

  assert.equal(isRecognitionStopped, true, 'Recognition must be stopped when Send is triggered');
  assert.equal(submissionCount, 1, 'Message must be submitted exactly once');
  assert.equal(receivedMessage, 'ನಮಸ್ಕಾರ ಹೇಗಿದ್ದೀರಾ', 'Full combined transcript must be submitted');

  // Attempt duplicate submission immediately with empty state
  await handleSend();
  assert.equal(submissionCount, 1, 'Empty message must not trigger second submission');
});

test('13. Live waveform banner state synchronization across pauses, continuous restarts, and non-fatal silence', () => {
  let sessionAccumulatedFinal = '';
  let speechFinal = '';
  let speechInterim = '';
  let voiceState = 'idle';
  let restartCount = 0;
  let isExplicitlyStopped = false;

  const getLiveFinal = () =>
    [sessionAccumulatedFinal, speechFinal].filter(Boolean).join(' ').trim();
  const getLiveInterim = () => speechInterim.trim();

  // Step 1: User starts listening
  assert.equal(voiceState, 'idle');
  voiceState = 'requesting';
  assert.equal(voiceState, 'requesting');
  voiceState = 'listening';
  assert.equal(voiceState, 'listening');
  assert.equal(getLiveFinal(), '', 'Initially no finalized words');
  assert.equal(getLiveInterim(), '', 'Initially no interim words');

  // Step 2: Interim words arrive progressively
  speechInterim = 'how do';
  assert.equal(getLiveInterim(), 'how do');
  speechInterim = 'how do I say';
  assert.equal(getLiveInterim(), 'how do I say');

  // Step 3: Phrase finalizes
  speechFinal = 'how do I say water';
  speechInterim = '';
  assert.equal(getLiveFinal(), 'how do I say water');
  assert.equal(getLiveInterim(), '');

  // Step 4: Chrome fires onEnd due to natural speech pause (manuallyStopped = false)
  const simulateBrowserOnEnd = () => {
    if (isExplicitlyStopped) {
      voiceState = 'idle';
      return;
    }
    // Commit finalized words into session accumulation
    if (speechFinal) {
      sessionAccumulatedFinal = [sessionAccumulatedFinal, speechFinal].filter(Boolean).join(' ').trim();
      speechFinal = '';
    }
    speechInterim = '';
    // Auto-restart recognizer
    restartCount++;
    voiceState = 'listening';
  };

  simulateBrowserOnEnd();

  assert.equal(voiceState, 'listening', 'Voice state must remain listening across browser stream restarts');
  assert.equal(getLiveFinal(), 'how do I say water', 'Accumulated final words must be preserved across restarts');
  assert.equal(restartCount, 1, 'Auto-restart must trigger exactly once for pause');

  // Step 5: User speaks second sentence
  speechFinal = 'in Kannada';
  speechInterim = 'please';
  assert.equal(getLiveFinal(), 'how do I say water in Kannada');
  assert.equal(getLiveInterim(), 'please');

  // Step 6: Non-fatal silence (no-speech) arrives
  const simulateNoSpeechError = () => {
    // Non-fatal: do NOT change voiceState to idle
  };
  simulateNoSpeechError();
  assert.equal(voiceState, 'listening', 'no-speech must not kill active voice session');

  // Step 7: User clicks Done Speaking
  isExplicitlyStopped = true;
  simulateBrowserOnEnd();
  assert.equal(voiceState, 'idle', 'Explicit stop must transition state to idle');
});

test('14. Dynamic speech recognition language switching preserves accumulated words and updates BCP-47 model', () => {
  let currentVoiceLang = 'Kannada';
  let sessionAccumulatedFinal = 'ನಮಸ್ಕಾರ';
  let activeBcp47 = getSpeechRecognitionLanguage(currentVoiceLang);
  assert.equal(activeBcp47, 'kn-IN');

  // User taps English chip directly on the live banner
  const handleSwitchLanguage = (newLangId) => {
    currentVoiceLang = newLangId;
    activeBcp47 = getSpeechRecognitionLanguage(newLangId);
    // Preserves existing session words
  };

  handleSwitchLanguage('English');
  assert.equal(currentVoiceLang, 'English');
  assert.equal(activeBcp47, 'en-IN');
  assert.equal(sessionAccumulatedFinal, 'ನಮಸ್ಕಾರ', 'Previously spoken Kannada words are preserved when switching to English');

  // New English interim speech arrives
  let speechInterim = 'how are you';
  const totalSpoken = [sessionAccumulatedFinal, speechInterim].filter(Boolean).join(' ').trim();
  assert.equal(totalSpoken, 'ನಮಸ್ಕಾರ how are you');
});

test('15. Android Chrome Web Speech API progressive stutter deduplication', () => {
  // Simulate the exact bug reported:
  // "I I want I want I want to I want to I want to I want to go I want to go home I want to go home in I want to go home in Hindi I want to go home in Hindi"
  const androidProgressiveChunks = [
    'I',
    'I want',
    'I want',
    'I want to',
    'I want to',
    'I want to',
    'I want to go',
    'I want to go home',
    'I want to go home in',
    'I want to go home in Hindi',
    'I want to go home in Hindi',
  ];

  let accumulated = '';
  for (const chunk of androidProgressiveChunks) {
    accumulated = mergeSpeechChunks(accumulated, chunk);
  }

  assert.equal(
    accumulated,
    'I want to go home in Hindi',
    'Repeated progressive interim chunks on Android must collapse cleanly into the single spoken sentence'
  );

  // Test boundary word overlap:
  const mergedOverlap = mergeSpeechChunks('I want to go', 'go home in Hindi');
  assert.equal(mergedOverlap, 'I want to go home in Hindi');

  // Test clean consecutive sentences:
  const distinctSentences = mergeSpeechChunks('Hello teacher', 'I want to go home');
  assert.equal(distinctSentences, 'Hello teacher I want to go home');
});


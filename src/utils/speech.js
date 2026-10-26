/**
 * Speech synthesis & recognition utility for Kannada Mitra.
 * Supports multilingual pronunciation and Web Speech API voice input with graceful fallbacks.
 */

export const isSpeechSynthesisSupported = () => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
};

export const getAvailableVoices = () => {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices() || [];
};

/**
 * Stops any active speech synthesis playback.
 */
export const stopSpeaking = () => {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Graceful catch for unsupported or restricted environments
  }
};

/**
 * Checks if speech synthesis is currently speaking.
 */
export const isCurrentlySpeaking = () => {
  if (!isSpeechSynthesisSupported()) return false;
  return Boolean(window.speechSynthesis.speaking);
};

/**
 * Attempts to speak Kannada text.
 * Returns an object with { supported: boolean, hasKannadaVoice: boolean, message?: string }
 */
export const speakKannada = (text, onEnd, onError) => {
  if (!isSpeechSynthesisSupported()) {
    if (onError) onError('Speech synthesis is not supported on this browser.');
    return {
      supported: false,
      hasKannadaVoice: false,
      message: 'Speech synthesis is not supported in this browser. Please use the pronunciation guide above!',
    };
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending utterances

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.82; // Slightly slowed down for clear learning
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    // Look for exact Kannada voice
    const kannadaVoice = voices.find(
      (v) => (v.lang && v.lang.toLowerCase().includes('kn')) || (v.name && v.name.toLowerCase().includes('kannada'))
    );

    // Secondary fallback: Indian English or Hindi if no Kannada voice installed
    const fallbackVoice =
      kannadaVoice ||
      voices.find((v) => v.lang === 'en-IN' || v.lang === 'hi-IN' || (v.lang && v.lang.startsWith('kn')));

    if (kannadaVoice) {
      utterance.voice = kannadaVoice;
      utterance.lang = kannadaVoice.lang || 'kn-IN';
    } else if (fallbackVoice) {
      utterance.voice = fallbackVoice;
      utterance.lang = 'kn-IN';
    } else {
      utterance.lang = 'kn-IN';
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (event) => {
      if (onError) onError(event?.error || 'Speech synthesis error');
    };

    window.speechSynthesis.speak(utterance);

    return {
      supported: true,
      hasKannadaVoice: Boolean(kannadaVoice),
      message: kannadaVoice
        ? 'Playing native Kannada pronunciation.'
        : 'Playing with system voice synthesis (Kannada phonetic guide available).',
    };
  } catch (err) {
    if (onError) onError(err);
    return {
      supported: true,
      hasKannadaVoice: false,
      message: 'Audio could not be played. Please use the phonetic guide!',
    };
  }
};

/**
 * Attempts to speak Hindi text.
 * Returns an object with { supported: boolean, hasHindiVoice: boolean, message?: string }
 */
export const speakHindi = (text, onEnd, onError) => {
  if (!isSpeechSynthesisSupported()) {
    if (onError) onError('Speech synthesis is not supported on this browser.');
    return {
      supported: false,
      hasHindiVoice: false,
      message: 'Speech synthesis is not supported in this browser. Please use the pronunciation guide above!',
    };
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(
      (v) => (v.lang && v.lang.toLowerCase().includes('hi')) || (v.name && v.name.toLowerCase().includes('hindi'))
    );
    const fallbackVoice = hindiVoice || voices.find((v) => v.lang === 'en-IN');

    if (hindiVoice) {
      utterance.voice = hindiVoice;
      utterance.lang = hindiVoice.lang || 'hi-IN';
    } else if (fallbackVoice) {
      utterance.voice = fallbackVoice;
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'hi-IN';
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (event) => {
      if (onError) onError(event?.error || 'Speech synthesis error');
    };

    window.speechSynthesis.speak(utterance);

    return {
      supported: true,
      hasHindiVoice: Boolean(hindiVoice),
      message: hindiVoice
        ? 'Playing native Hindi pronunciation.'
        : 'Playing with system voice synthesis (Hindi phonetic guide available).',
    };
  } catch (err) {
    if (onError) onError(err);
    return {
      supported: true,
      hasHindiVoice: false,
      message: 'Audio could not be played. Please use the phonetic guide!',
    };
  }
};

export const LANGUAGE_SPEECH_MAP = {
  Kannada: { lang: 'kn-IN', matches: ['kn', 'kannada'] },
  Hindi: { lang: 'hi-IN', matches: ['hi', 'hindi'] },
  Telugu: { lang: 'te-IN', matches: ['te', 'telugu'] },
  Tamil: { lang: 'ta-IN', matches: ['ta', 'tamil'] },
  Malayalam: { lang: 'ml-IN', matches: ['ml', 'malayalam'] },
  Marathi: { lang: 'mr-IN', matches: ['mr', 'marathi'] },
  English: { lang: 'en-IN', matches: ['en', 'english'] },
  Bengali: { lang: 'bn-IN', matches: ['bn', 'bengali', 'bangla'] },
  Urdu: { lang: 'ur-IN', matches: ['ur', 'urdu'] },
};

/**
 * Speaks text in any specified target language with graceful browser synthesis fallback.
 */
export const speakTargetLanguage = (text, targetLanguage = 'Kannada', onEnd, onError) => {
  if (targetLanguage === 'Kannada') {
    return speakKannada(text, onEnd, onError);
  }
  if (targetLanguage === 'Hindi') {
    return speakHindi(text, onEnd, onError);
  }

  if (!isSpeechSynthesisSupported()) {
    if (onError) onError('Speech synthesis is not supported on this browser.');
    return {
      supported: false,
      hasVoice: false,
      message: 'Speech synthesis is not supported in this browser. Please use the pronunciation guide above!',
    };
  }

  try {
    window.speechSynthesis.cancel();

    const config = LANGUAGE_SPEECH_MAP[targetLanguage] || { lang: 'en-IN', matches: ['en'] };
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find((v) => {
      const vLang = (v.lang || '').toLowerCase();
      const vName = (v.name || '').toLowerCase();
      return config.matches.some((m) => vLang.includes(m) || vName.includes(m));
    });

    const fallbackVoice = matchedVoice || voices.find((v) => v.lang === 'en-IN' || (v.lang && v.lang.startsWith('en')));

    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang || config.lang;
    } else if (fallbackVoice) {
      utterance.voice = fallbackVoice;
      utterance.lang = config.lang;
    } else {
      utterance.lang = config.lang;
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (event) => {
      if (onError) onError(event?.error || 'Speech synthesis error');
    };

    window.speechSynthesis.speak(utterance);

    return {
      supported: true,
      hasVoice: Boolean(matchedVoice),
      message: matchedVoice
        ? `Playing native ${targetLanguage} pronunciation.`
        : `Playing with system voice synthesis (${targetLanguage} phonetic guide available).`,
    };
  } catch (err) {
    if (onError) onError(err);
    return {
      supported: true,
      hasVoice: false,
      message: 'Audio could not be played. Please use the phonetic guide!',
    };
  }
};

/**
 * Strips markdown symbols, prompt labels, emojis, and formatting so speech synthesis reads naturally.
 */
export const sanitizeTextForSpeech = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, ' ')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove markdown headings
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold and italics markers
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove bullet points and blockquotes
    .replace(/^[\s*->•]+\s+/gm, '')
    // Remove suggested reply or tip tags
    .replace(/💡\s*Suggested reply:?/gi, '')
    .replace(/ℹ️\s*Note:?/gi, '')
    // Normalize extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Speaks an AI response, prioritizing Kannada voice when reading predominantly Kannada script
 * or using the user's preferred explanation language for multilingual explanations.
 */
export const speakResponse = (text, preferredLanguage = 'Kannada', onEnd, onError) => {
  const sanitized = sanitizeTextForSpeech(text);
  if (!sanitized) {
    if (onEnd) onEnd();
    return { supported: true, hasVoice: false, message: 'No spoken text available.' };
  }

  // Count Kannada Unicode characters (\u0C80-\u0CFF)
  const kannadaChars = (sanitized.match(/[\u0C80-\u0CFF]/g) || []).length;
  // Non-whitespace character count
  const nonSpaceChars = sanitized.replace(/\s+/g, '').length;

  // Predominantly Kannada if:
  // 1. preferredLanguage is explicitly Kannada, OR
  // 2. Kannada characters make up a substantial portion (>35%) of the non-whitespace text
  const isPredominantlyKannada =
    preferredLanguage === 'Kannada' ||
    (nonSpaceChars > 0 && kannadaChars / nonSpaceChars > 0.35);

  if (isPredominantlyKannada) {
    return speakKannada(sanitized, onEnd, onError);
  }

  // Otherwise, read the explanation in the learner's chosen explanation language (Hindi, English, Telugu, etc.)
  return speakTargetLanguage(sanitized, preferredLanguage, onEnd, onError);
};

// ==========================================
// Speech Recognition (Web Speech API)
// ==========================================

export const isSpeechRecognitionSupported = () => {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
};

/**
 * List of speech-recognition languages supported by browser engines
 */
export const SPEECH_RECOGNITION_LANGUAGES = [
  { id: 'Kannada', name: 'Kannada', nativeName: 'ಕನ್ನಡ', bcp47: 'kn-IN', flag: '💛❤️' },
  { id: 'English', name: 'English', nativeName: 'English', bcp47: 'en-IN', flag: '🌐' },
  { id: 'Hindi', name: 'Hindi', nativeName: 'हिन्दी', bcp47: 'hi-IN', flag: '🇮🇳' },
  { id: 'Telugu', name: 'Telugu', nativeName: 'తెలుగు', bcp47: 'te-IN', flag: '🇮🇳' },
  { id: 'Tamil', name: 'Tamil', nativeName: 'தமிழ்', bcp47: 'ta-IN', flag: '🇮🇳' },
  { id: 'Malayalam', name: 'Malayalam', nativeName: 'മലയാളം', bcp47: 'ml-IN', flag: '🇮🇳' },
  { id: 'Marathi', name: 'Marathi', nativeName: 'मराठी', bcp47: 'mr-IN', flag: '🇮🇳' },
  { id: 'Bengali', name: 'Bengali', nativeName: 'বাংলা', bcp47: 'bn-IN', flag: '🇮🇳' },
  { id: 'Urdu', name: 'Urdu', nativeName: 'اردو', bcp47: 'ur-IN', flag: '🇮🇳' },
];

/**
 * Returns BCP-47 language tag for speech recognition based on language name or ID
 */
export const getSpeechRecognitionLanguage = (languageNameOrId) => {
  if (!languageNameOrId) return 'kn-IN';
  const query = String(languageNameOrId).toLowerCase().trim();
  const found = SPEECH_RECOGNITION_LANGUAGES.find(
    (l) => l.id.toLowerCase() === query || l.name.toLowerCase() === query || l.bcp47.toLowerCase() === query
  );
  return found ? found.bcp47 : 'kn-IN';
};

/**
 * Maps Web Speech API recognition errors to clear, friendly user explanations
 */
export const mapSpeechRecognitionError = (errorCode) => {
  switch (errorCode) {
    case 'not-allowed':
    case 'permission-denied':
      return 'Microphone permission was denied. Please allow microphone access in your browser settings to speak.';
    case 'no-speech':
      return 'No speech detected. Please tap the microphone and speak clearly into your mic.';
    case 'audio-capture':
      return 'No microphone was found or your audio input device is currently busy.';
    case 'network':
      return 'Speech recognition network error. Please check your internet connection.';
    case 'language-not-supported':
      return 'The selected voice language is not supported by your browser’s speech engine.';
    case 'aborted':
      return 'Voice input was cancelled.';
    default:
      return 'Voice recognition encountered an issue. You can try again or type your question below.';
  }
};

/**
 * Creates and wraps a Web Speech API SpeechRecognition instance with safe lifecycle management
 * and real-time streaming of interim and final speech recognition results.
 */
export const createSpeechRecognizer = ({
  lang = 'kn-IN',
  onStart,
  onAudioStart,
  onSpeechStart,
  onResult,
  onError,
  onEnd,
} = {}) => {
  if (!isSpeechRecognitionSupported()) {
    if (onError) onError('Speech recognition is not supported on this browser.');
    return null;
  }

  const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let active = false;
  let manuallyStopped = false;

  try {
    recognition = new SpeechRecognitionClass();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true; // Continuous listening across pauses
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      active = true;
      manuallyStopped = false;
      if (onStart) onStart();
    };

    if ('onaudiostart' in recognition) {
      recognition.onaudiostart = () => {
        if (onAudioStart) onAudioStart();
      };
    }

    if ('onspeechstart' in recognition) {
      recognition.onspeechstart = () => {
        if (onSpeechStart) onSpeechStart();
      };
    }

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      if (event?.results) {
        // Iterate through all results to build final and interim streams
        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          const piece = (item[0]?.transcript || '').trim();
          if (!piece) continue;

          if (item.isFinal) {
            finalTranscript += (finalTranscript ? ' ' : '') + piece;
          } else {
            interimTranscript += (interimTranscript ? ' ' : '') + piece;
          }
        }
      }

      finalTranscript = finalTranscript.trim();
      interimTranscript = interimTranscript.trim();

      const combined = [finalTranscript, interimTranscript].filter(Boolean).join(' ').trim();

      const lastResult = event?.results ? event.results[event.results.length - 1] : null;
      const isLastFinal = Boolean(lastResult?.isFinal);

      if (onResult) {
        onResult({
          finalTranscript,
          interimTranscript,
          transcript: combined,
          isFinal: isLastFinal,
          resultIndex: typeof event?.resultIndex === 'number' ? event.resultIndex : 0,
          rawEvent: event,
        });
      }
    };

    recognition.onerror = (event) => {
      active = false;
      const errorCode = event?.error || 'unknown';

      // Suppress expected abort errors when stopped by the user or script
      if (manuallyStopped && (errorCode === 'aborted' || errorCode === 'no-speech')) {
        return;
      }

      const message = mapSpeechRecognitionError(errorCode);
      if (onError) onError(message, errorCode, event);
    };

    recognition.onend = () => {
      active = false;
      if (onEnd) onEnd({ manuallyStopped });
    };

    return {
      start: () => {
        try {
          if (!active) {
            manuallyStopped = false;
            recognition.start();
          }
        } catch (err) {
          // If already started, mark active without reporting fatal error
          if (err?.name === 'InvalidStateError' || (err?.message && err.message.includes('already started'))) {
            active = true;
            return;
          }
          active = false;
          if (onError) onError(mapSpeechRecognitionError(err?.message || 'unknown'), err?.name || 'StartError', err);
        }
      },
      stop: () => {
        manuallyStopped = true;
        try {
          recognition.stop();
        } catch {
          // Graceful catch
        }
        active = false;
      },
      abort: () => {
        manuallyStopped = true;
        try {
          recognition.abort();
        } catch {
          // Graceful catch
        }
        active = false;
      },
      isListening: () => active,
      setLang: (newLang) => {
        if (recognition && newLang) {
          const wasActive = active;
          recognition.lang = newLang;
          if (wasActive) {
            try {
              recognition.abort();
            } catch {
              // Graceful catch
            }
            setTimeout(() => {
              try {
                if (!manuallyStopped) {
                  recognition.start();
                }
              } catch {
                // Graceful catch
              }
            }, 60);
          }
        }
      },
      restart: (newLang) => {
        manuallyStopped = false;
        if (newLang && recognition) {
          recognition.lang = newLang;
        }
        try {
          if (active) {
            recognition.abort();
          }
        } catch {
          // Graceful catch
        }
        setTimeout(() => {
          try {
            recognition.start();
          } catch {
            // Graceful catch
          }
        }, 50);
      },
      getLang: () => (recognition ? recognition.lang : lang),
    };
  } catch (err) {
    if (onError) onError(mapSpeechRecognitionError('unknown'), err);
    return null;
  }
};

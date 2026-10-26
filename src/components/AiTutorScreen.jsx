import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Send,
  Volume2,
  Square,
  Mic,
  RotateCcw,
  MessageSquare,
  Compass,
  AlertTriangle,
  Loader2,
  Languages,
  ChevronDown,
  Check,
  ExternalLink,
  Info,
  Radio,
} from 'lucide-react';
import {
  checkTutorStatus,
  sendTutorQuestion,
  PRACTICE_SCENARIOS,
  SUGGESTED_QUESTIONS,
  AI_DISCLAIMER_NOTICE,
} from '../services/aiTutorClient';
import { ONBOARDING_PREFERENCE_LANGUAGES, getLanguageMetadata } from '../data/languages';
import {
  speakKannada,
  speakResponse,
  stopSpeaking,
  isSpeechRecognitionSupported,
  SPEECH_RECOGNITION_LANGUAGES,
  getSpeechRecognitionLanguage,
  createSpeechRecognizer,
} from '../utils/speech';
import {
  getStoredChatHistory,
  setStoredChatHistory,
  clearStoredChatHistory,
  getStoredPracticeScenario,
  setStoredPracticeScenario,
  getStoredAuthSession,
  getStoredVoiceAutoPlay,
  setStoredVoiceAutoPlay,
  getStoredVoiceLanguage,
  setStoredVoiceLanguage,
} from '../utils/storage';

let messageSeq = 1;
function createMessage(role, content, extra = {}) {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${messageSeq++}`,
    role,
    content,
    timestamp: new Date().toISOString(),
    ...extra,
  };
}

/**
 * Cleanly renders markdown text, bullet lists, and Kannada script spans without raw asterisks
 */
function renderFormattedContent(text) {
  if (!text || typeof text !== 'string') return null;
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ');
        const cleanLine = isBullet ? trimmed.replace(/^[*•-]\s+/, '') : trimmed;

        // Parse inline **bold**
        const parts = [];
        const regex = /\*\*(.*?)\*\*/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(cleanLine)) !== null) {
          if (match.index > lastIndex) {
            parts.push(cleanLine.substring(lastIndex, match.index));
          }
          const boldText = match[1];
          const isKannada = /[\u0C80-\u0CFF]/.test(boldText);
          parts.push(
            <strong
              key={`${idx}-${match.index}`}
              className={
                isKannada
                  ? 'font-kannada font-bold text-red-700 text-sm sm:text-base inline-block px-0.5'
                  : 'font-bold text-stone-900'
              }
            >
              {boldText}
            </strong>
          );
          lastIndex = regex.lastIndex;
        }

        if (lastIndex < cleanLine.length) {
          parts.push(cleanLine.substring(lastIndex));
        }

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 py-0.5">
              <span className="text-amber-600 font-bold text-xs select-none mt-0.5">•</span>
              <div className="flex-1">{parts.length > 0 ? parts : cleanLine}</div>
            </div>
          );
        }

        return (
          <p key={idx} className="my-0.5">
            {parts.length > 0 ? parts : cleanLine}
          </p>
        );
      })}
    </div>
  );
}

export function AiTutorScreen({
  currentLanguage = 'Telugu',
  targetLanguage = 'Kannada',
  onSelectLanguage = null,
  userId = null,
}) {
  const effectiveUserId = userId || getStoredAuthSession()?.uid || null;

  // 1. Conversation & Mode State (Separated persistent histories)
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'practice'
  const [selectedScenario, setSelectedScenario] = useState(() => {
    const savedId = getStoredPracticeScenario(effectiveUserId);
    return PRACTICE_SCENARIOS.find((s) => s.id === savedId) || PRACTICE_SCENARIOS[0];
  });
  const [chatMessages, setChatMessages] = useState(() =>
    getStoredChatHistory(effectiveUserId, 'chat')
  );
  const [practiceMessages, setPracticeMessages] = useState(() =>
    getStoredChatHistory(effectiveUserId, 'practice')
  );
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Active messages based on current mode
  const messages = activeTab === 'practice' ? practiceMessages : chatMessages;

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastFailedPayload, setLastFailedPayload] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // 2. Server Configuration State
  const [serverStatus, setServerStatus] = useState({
    checked: false,
    configured: true,
    model: 'gemini-3.5-flash-lite',
    error: null,
  });
  const [isCheckingServer, setIsCheckingServer] = useState(false);

  // 3. Language Selector Dropdown State
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [voiceLangDropdownOpen, setVoiceLangDropdownOpen] = useState(false);

  // 4. Voice Input (Speech-to-Text) State
  const isVoiceSupported = useMemo(() => isSpeechRecognitionSupported(), []);
  const [voiceLang, setVoiceLang] = useState(() => {
    return getStoredVoiceLanguage(effectiveUserId) || 'Kannada';
  });
  const [voiceState, setVoiceState] = useState('idle'); // 'idle' | 'requesting' | 'listening' | 'processing' | 'error'
  const [voiceError, setVoiceError] = useState(null);
  const [voiceNotice, setVoiceNotice] = useState(null);
  const [liveFinal, setLiveFinal] = useState('');
  const [liveInterim, setLiveInterim] = useState('');

  // 5. Voice Output (Text-to-Speech) State
  const [speakingText, setSpeakingText] = useState(null);
  const [currentlySpeakingMessageId, setCurrentlySpeakingMessageId] = useState(null);
  const [playedMessageIds, setPlayedMessageIds] = useState({});
  const [autoPlayVoice, setAutoPlayVoice] = useState(() => getStoredVoiceAutoPlay(effectiveUserId));

  // DOM & Execution Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const requestIdRef = useRef(0);
  const recognizerRef = useRef(null);

  // Distinct speech & manual text states
  const manualTextRef = useRef(''); // Baseline text typed manually by user
  const speechFinalRef = useRef(''); // Finalized speech chunks in current recognition cycle
  const speechInterimRef = useRef(''); // Current uncommitted interim speech
  const sessionAccumulatedFinalRef = useRef(''); // Finalized speech preserved across pauses/auto-restarts
  const restartTimerRef = useRef(null); // Seamless auto-restart timer
  const isVoiceActiveRef = useRef(false);
  const isExplicitlyStoppedRef = useRef(false);
  const hasVoiceErrorRef = useRef(false);

  const motherTongueObj = getLanguageMetadata(currentLanguage);
  const voiceLangObj =
    SPEECH_RECOGNITION_LANGUAGES.find((l) => l.id === voiceLang) ||
    SPEECH_RECOGNITION_LANGUAGES[0];

  const handleSelectVoiceLang = (langId) => {
    handleSwitchVoiceLangLive(langId);
  };

  // Automatic localStorage persistence for Ask Tutor messages
  useEffect(() => {
    setStoredChatHistory(effectiveUserId, 'chat', chatMessages);
  }, [chatMessages, effectiveUserId]);

  // Automatic localStorage persistence for Conversation Practice messages
  useEffect(() => {
    setStoredChatHistory(effectiveUserId, 'practice', practiceMessages);
  }, [practiceMessages, effectiveUserId]);

  // Persist selected scenario
  useEffect(() => {
    if (selectedScenario?.id) {
      setStoredPracticeScenario(effectiveUserId, selectedScenario.id);
    }
  }, [selectedScenario, effectiveUserId]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Elapsed seconds timer during active loading
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
      setElapsedSeconds(0);
    };
  }, [isLoading]);

  // Check server configuration status on mount
  useEffect(() => {
    let isMounted = true;
    checkTutorStatus().then((status) => {
      if (isMounted) {
        setServerStatus({
          checked: true,
          configured: status.configured,
          model: status.model || 'gemini-3.5-flash-lite',
          error: status.ok ? null : status.message,
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleManualCheckSetup = async () => {
    setIsCheckingServer(true);
    const status = await checkTutorStatus();
    setServerStatus({
      checked: true,
      configured: status.configured,
      model: status.model || 'gemini-3.5-flash-lite',
      error: status.ok ? null : status.message,
    });
    setIsCheckingServer(false);
  };

  // Clean up any ongoing fetch, speech synthesis, and recognition on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      clearTimeout(restartTimerRef.current);
      if (recognizerRef.current) {
        recognizerRef.current.abort();
        recognizerRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Switch active conversation tab with clean audio and voice cancellation
  const handleSwitchTab = (tab) => {
    if (tab === activeTab) return;
    stopSpeaking();
    clearTimeout(restartTimerRef.current);
    setCurrentlySpeakingMessageId(null);
    setSpeakingText(null);
    if (recognizerRef.current && recognizerRef.current.isListening()) {
      isExplicitlyStoppedRef.current = true;
      recognizerRef.current.abort();
      setVoiceState('idle');
      setLiveInterim('');
      setLiveFinal('');
      sessionAccumulatedFinalRef.current = '';
      speechFinalRef.current = '';
      speechInterimRef.current = '';
      isVoiceActiveRef.current = false;
    }
    setActiveTab(tab);
    setErrorMessage(null);
    if (tab === 'practice' && practiceMessages.length === 0 && selectedScenario) {
      handleSendMessage(selectedScenario.initialPrompt, 'practice', selectedScenario.title, []);
    }
  };

  // Persist autoPlayVoice preference
  useEffect(() => {
    setStoredVoiceAutoPlay(effectiveUserId, autoPlayVoice);
  }, [autoPlayVoice, effectiveUserId]);

  // Text-to-speech handler for Kannada phrases in tutor messages
  const handlePlayAudio = (kannadaSnippet) => {
    if (!kannadaSnippet || speakingText) return;
    stopSpeaking();
    setCurrentlySpeakingMessageId(null);
    setSpeakingText(kannadaSnippet);
    speakKannada(
      kannadaSnippet,
      () => setSpeakingText(null),
      () => setSpeakingText(null)
    );
  };

  // Full response text-to-speech player with Stop & Replay support
  const handleSpeakResponse = (messageId, messageContent) => {
    if (currentlySpeakingMessageId === messageId) {
      stopSpeaking();
      setCurrentlySpeakingMessageId(null);
      return;
    }

    stopSpeaking();
    setSpeakingText(null);
    setCurrentlySpeakingMessageId(messageId);
    setPlayedMessageIds((prev) => ({ ...prev, [messageId]: true }));

    speakResponse(
      messageContent,
      currentLanguage,
      () => {
        setCurrentlySpeakingMessageId((curr) => (curr === messageId ? null : curr));
      },
      () => {
        setCurrentlySpeakingMessageId((curr) => (curr === messageId ? null : curr));
      }
    );
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    setCurrentlySpeakingMessageId(null);
    setSpeakingText(null);
  };

  // Manual typing handler: keeps manual baseline in sync
  const handleInputChange = (e) => {
    const newVal = e.target.value.slice(0, 1000);
    setInputText(newVal);
    // When user types manually, commit as baseline
    if (!isVoiceActiveRef.current) {
      manualTextRef.current = newVal;
      speechFinalRef.current = '';
      speechInterimRef.current = '';
    }
  };

  // Speech Recognition (Web Speech API) Handlers with Real-Time Progressive Updates
  const startRecognitionWithLang = (langId) => {
    if (!isVoiceSupported) {
      setVoiceError(
        'Voice input is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.'
      );
      setVoiceState('error');
      hasVoiceErrorRef.current = true;
      return;
    }

    if (recognizerRef.current) {
      try {
        recognizerRef.current.abort();
      } catch {
        // Ignore
      }
      recognizerRef.current = null;
    }

    const bcp47 = getSpeechRecognitionLanguage(langId);

    const recognizer = createSpeechRecognizer({
      lang: bcp47,
      onStart: () => {
        isVoiceActiveRef.current = true;
        setVoiceState('listening');
        setVoiceNotice(null);
        hasVoiceErrorRef.current = false;
      },
      onAudioStart: () => {
        isVoiceActiveRef.current = true;
        setVoiceState('listening');
      },
      onSpeechStart: () => {
        isVoiceActiveRef.current = true;
        setVoiceState('listening');
      },
      onResult: ({ finalTranscript, interimTranscript }) => {
        isVoiceActiveRef.current = true;
        setVoiceState('listening');

        speechFinalRef.current = finalTranscript || '';
        speechInterimRef.current = interimTranscript || '';

        // Combine all finalized speech across this voice session
        const totalFinal = [
          sessionAccumulatedFinalRef.current,
          speechFinalRef.current,
        ].filter(Boolean).join(' ').trim();

        const totalInterim = speechInterimRef.current.trim();

        setLiveFinal(totalFinal);
        setLiveInterim(totalInterim);

        // Progressive real-time live update into visible input:
        // [manually typed baseline] + [total finalized speech] + [interim speech]
        const totalSpoken = [totalFinal, totalInterim].filter(Boolean).join(' ').trim();
        const fullMessage = manualTextRef.current
          ? `${manualTextRef.current} ${totalSpoken}`.trim()
          : totalSpoken;

        if (fullMessage) {
          setInputText(fullMessage);
        }
      },
      onError: (message, rawCode) => {
        if (rawCode === 'no-speech') {
          // Silence or brief pause before speech starts.
          // Keep listening state active so user can speak whenever ready.
          return;
        }

        // Terminal error (not-allowed, network, audio-capture, etc.)
        hasVoiceErrorRef.current = true;
        isVoiceActiveRef.current = false;
        setVoiceState('error');
        setVoiceError(message);
      },
      onEnd: ({ manuallyStopped } = {}) => {
        // If explicitly stopped by user, sent, cancelled, or encountered fatal error:
        if (isExplicitlyStoppedRef.current || manuallyStopped || hasVoiceErrorRef.current) {
          isVoiceActiveRef.current = false;
          setVoiceState('idle');
          return;
        }

        // Natural pause or browser continuous-stream refresh:
        // Commit whatever speech was finalized into session accumulation
        if (speechFinalRef.current) {
          sessionAccumulatedFinalRef.current = [
            sessionAccumulatedFinalRef.current,
            speechFinalRef.current,
          ].filter(Boolean).join(' ').trim();
          speechFinalRef.current = '';
        }
        speechInterimRef.current = '';
        setLiveInterim('');

        // Live display continues showing accumulated final text
        setLiveFinal(sessionAccumulatedFinalRef.current);

        // Auto-restart recognizer to seamlessly continue listening
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => {
          if (!isExplicitlyStoppedRef.current && !hasVoiceErrorRef.current && recognizerRef.current) {
            try {
              recognizerRef.current.start();
            } catch {
              // Ignore
            }
          }
        }, 100);
      },
    });

    if (recognizer) {
      recognizerRef.current = recognizer;
      recognizer.start();
    } else {
      setVoiceState('idle');
    }
  };

  const handleStartListening = () => {
    if (!isVoiceSupported) {
      setVoiceError(
        'Voice input is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.'
      );
      setVoiceState('error');
      hasVoiceErrorRef.current = true;
      return;
    }

    // Stop active audio playback before listening
    stopSpeaking();
    clearTimeout(restartTimerRef.current);
    setCurrentlySpeakingMessageId(null);
    setSpeakingText(null);

    // Save existing text as manual baseline so newly spoken words append cleanly without wiping
    manualTextRef.current = inputText.trim();
    sessionAccumulatedFinalRef.current = '';
    speechFinalRef.current = '';
    speechInterimRef.current = '';
    setLiveFinal('');
    setLiveInterim('');

    setVoiceError(null);
    setVoiceNotice(null);
    hasVoiceErrorRef.current = false;
    isExplicitlyStoppedRef.current = false;

    // Transition immediately to requesting state for instant UI feedback
    setVoiceState('requesting');
    startRecognitionWithLang(voiceLang);
  };

  const handleSwitchVoiceLangLive = (newLangId) => {
    setVoiceLang(newLangId);
    setStoredVoiceLanguage(effectiveUserId, newLangId);
    setVoiceLangDropdownOpen(false);

    // If currently listening, seamlessly switch recognition language!
    if (isVoiceActiveRef.current || voiceState === 'listening' || voiceState === 'requesting') {
      // Commit any speech accumulated so far
      if (speechFinalRef.current) {
        sessionAccumulatedFinalRef.current = [
          sessionAccumulatedFinalRef.current,
          speechFinalRef.current,
        ].filter(Boolean).join(' ').trim();
        speechFinalRef.current = '';
      }
      speechInterimRef.current = '';
      setLiveInterim('');

      if (recognizerRef.current) {
        try {
          recognizerRef.current.abort();
        } catch {
          // Ignore
        }
        recognizerRef.current = null;
      }

      startRecognitionWithLang(newLangId);
    }
  };

  const handleStopListening = () => {
    isExplicitlyStoppedRef.current = true;
    isVoiceActiveRef.current = false;
    clearTimeout(restartTimerRef.current);
    setVoiceState('processing');

    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }

    // Commit all recognized speech into baseline
    const totalSpoken = [
      sessionAccumulatedFinalRef.current,
      speechFinalRef.current,
      speechInterimRef.current,
    ].filter(Boolean).join(' ').trim();

    const fullMessage = manualTextRef.current
      ? `${manualTextRef.current} ${totalSpoken}`.trim()
      : totalSpoken;

    if (fullMessage) {
      manualTextRef.current = fullMessage;
      sessionAccumulatedFinalRef.current = '';
      speechFinalRef.current = '';
      speechInterimRef.current = '';
      setInputText(fullMessage);
    }

    setLiveInterim('');
    setLiveFinal('');

    setTimeout(() => {
      setVoiceState('idle');
      inputRef.current?.focus();
    }, 120);
  };

  const handleCancelVoiceInput = () => {
    isExplicitlyStoppedRef.current = true;
    isVoiceActiveRef.current = false;
    clearTimeout(restartTimerRef.current);

    if (recognizerRef.current) {
      try {
        recognizerRef.current.abort();
      } catch {
        // Ignore
      }
      recognizerRef.current = null;
    }

    // Restore original baseline text
    sessionAccumulatedFinalRef.current = '';
    speechFinalRef.current = '';
    speechInterimRef.current = '';
    setInputText(manualTextRef.current || '');
    setLiveInterim('');
    setLiveFinal('');
    setVoiceState('idle');
    setVoiceError(null);
    setVoiceNotice(null);
  };

  // Extract Kannada script portions (Unicode \u0C80-\u0CFF) for quick audio playback
  const extractKannadaSnippet = (text) => {
    if (!text) return null;
    const match = text.match(/[\u0C80-\u0CFF][\u0C80-\u0CFF\s.,!?]{2,}/);
    return match ? match[0].trim() : null;
  };

  // Extract suggested reply from model response if present
  const extractSuggestedReply = (text) => {
    if (!text) return null;
    const match = text.match(/(?:💡|Suggested reply:?)\s*(.+?)(?:\n|$)/i);
    return match ? match[1].trim() : null;
  };

  // Core send message logic with strict loading state recovery & duplicate prevention
  const handleSendMessage = async (
    textToSend = null,
    customMode = null,
    customScenario = null,
    customHistory = null
  ) => {
    // If voice recognition is active, stop it safely immediately
    if (recognizerRef.current && (isVoiceActiveRef.current || voiceState === 'listening' || voiceState === 'requesting')) {
      isExplicitlyStoppedRef.current = true;
      isVoiceActiveRef.current = false;
      clearTimeout(restartTimerRef.current);
      try {
        recognizerRef.current.stop();
      } catch {
        // Ignore
      }
      setVoiceState('idle');
    }

    // Resolve final text to send
    let query;
    if (textToSend !== null) {
      query = String(textToSend).trim();
    } else {
      const totalSpoken = [
        sessionAccumulatedFinalRef.current,
        speechFinalRef.current,
        speechInterimRef.current,
      ].filter(Boolean).join(' ').trim();

      const fullMessage = manualTextRef.current
        ? `${manualTextRef.current} ${totalSpoken}`.trim()
        : totalSpoken;

      query = (fullMessage || inputText).trim();
    }

    if (!query) return;

    // Synchronous duplicate submission check
    if (isSubmittingRef.current || isLoading) return;
    isSubmittingRef.current = true;

    // Abort previous in-flight request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    const currentRequestId = ++requestIdRef.current;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setErrorMessage(null);
    setLastFailedPayload(null);
    setInputText('');
    manualTextRef.current = '';
    sessionAccumulatedFinalRef.current = '';
    speechFinalRef.current = '';
    speechInterimRef.current = '';
    setLiveFinal('');
    setLiveInterim('');

    const mode = customMode || activeTab;
    const scenario = customScenario || (mode === 'practice' ? selectedScenario?.title : null);

    // Create user message
    const userMessage = createMessage('user', query);

    const baseMessages = customHistory !== null
      ? customHistory
      : (mode === 'practice' ? practiceMessages : chatMessages);

    const updatedMessages = [...baseMessages, userMessage];
    if (mode === 'practice') {
      setPracticeMessages(updatedMessages);
    } else {
      setChatMessages(updatedMessages);
    }
    setIsLoading(true);

    // Prepare API history snapshot
    const apiHistory = baseMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const result = await sendTutorQuestion({
        message: query,
        history: apiHistory,
        preferredLanguage: currentLanguage,
        targetLanguage,
        mode,
        scenario,
        signal: controller.signal,
      });

      // Stale request guard: if newer request was dispatched while this was running, ignore
      if (requestIdRef.current !== currentRequestId) {
        return;
      }

      if (result.ok) {
        const tutorMessage = createMessage('model', result.text, { model: result.model });
        if (mode === 'practice') {
          setPracticeMessages((prev) => [...prev, tutorMessage]);
        } else {
          setChatMessages((prev) => [...prev, tutorMessage]);
        }
        if (autoPlayVoice) {
          setTimeout(() => {
            handleSpeakResponse(tutorMessage.id, result.text);
          }, 150);
        }
      } else if (result.error !== 'REQUEST_ABORTED' || !controller.signal.aborted) {
        setErrorMessage(result.message || 'An error occurred while contacting the AI tutor.');
        setLastFailedPayload({
          message: query,
          mode,
          scenario,
          historySnapshot: baseMessages,
        });

        if (result.error === 'CONFIG_REQUIRED') {
          setServerStatus((prev) => ({ ...prev, configured: false }));
        }
      }
    } catch (err) {
      if (requestIdRef.current === currentRequestId && err?.name !== 'AbortError') {
        setErrorMessage('An unexpected error occurred. Please click Retry.');
        setLastFailedPayload({
          message: query,
          mode,
          scenario,
          historySnapshot: baseMessages,
        });
      }
    } finally {
      // Guaranteed loading state recovery
      if (requestIdRef.current === currentRequestId) {
        setIsLoading(false);
        isSubmittingRef.current = false;
        abortControllerRef.current = null;
      }
    }
  };

  // Explicit user cancellation
  const handleCancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isSubmittingRef.current = false;
    setIsLoading(false);
    setErrorMessage('Request was cancelled.');
  };

  // Retry last failed submission
  const handleRetry = () => {
    if (!lastFailedPayload) return;
    const { message, mode, scenario, historySnapshot } = lastFailedPayload;
    // Remove the trailing failed user message from display to avoid duplicates
    if (mode === 'practice') {
      setPracticeMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'user' && last.content === message) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } else {
      setChatMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'user' && last.content === message) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    }
    handleSendMessage(message, mode, scenario, historySnapshot);
  };

  // Start a new conversation practice scenario
  const handleSelectScenario = (scenario) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isSubmittingRef.current = false;
    setIsLoading(false);

    setSelectedScenario(scenario);
    setPracticeMessages([]);
    clearStoredChatHistory(effectiveUserId, 'practice');
    setStoredPracticeScenario(effectiveUserId, scenario.id);
    setErrorMessage(null);
    setLastFailedPayload(null);

    // Automatically send initial prompt with empty history to seed the roleplay
    handleSendMessage(scenario.initialPrompt, 'practice', scenario.title, []);
  };

  // Open confirmation modal for clearing chat
  const handleClearChat = () => {
    setShowClearConfirm(true);
  };

  // Confirmed permanent deletion of current mode's chat history
  const handleConfirmClearChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isSubmittingRef.current = false;
    setIsLoading(false);
    setErrorMessage(null);
    setLastFailedPayload(null);
    setShowClearConfirm(false);

    if (activeTab === 'chat') {
      setChatMessages([]);
      clearStoredChatHistory(effectiveUserId, 'chat');
    } else {
      setPracticeMessages([]);
      clearStoredChatHistory(effectiveUserId, 'practice');
      if (selectedScenario) {
        handleSendMessage(selectedScenario.initialPrompt, 'practice', selectedScenario.title, []);
      }
    }
  };

  // Keyboard navigation: Enter to submit, Shift+Enter for newline
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="py-4 sm:py-8 px-3 sm:px-6 max-w-5xl mx-auto flex flex-col flex-1 min-h-[calc(100vh-140px)]">
      {/* 1. Header Banner & Cultural Badge */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-amber-200/90 shadow-xs mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-red-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  AI Kannada Tutor
                </h1>
                <span className="font-kannada font-bold text-red-700 text-sm sm:text-base">
                  (ಕನ್ನಡ ಮಿತ್ರ AI)
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                  {serverStatus.model || 'gemini-3.5-flash-lite'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Ask questions, explore grammar, or practice real conversational Kannada with instant explanations in your mother tongue.
              </p>
            </div>
          </div>

          {/* Language Pair Indicators & Quick Switcher */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all shadow-2xs cursor-pointer"
                title="Change explanation language"
              >
                <Languages className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="text-stone-500 font-normal">Explanations:</span>
                <span className="font-bold text-amber-900">{motherTongueObj.nativeName}</span>
                <span className="text-[10px] text-stone-600">({motherTongueObj.name})</span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
              </button>

              {langDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setLangDropdownOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 text-xs font-semibold text-stone-500 uppercase tracking-wider border-b border-stone-100 mb-1">
                      <span>Select Explanation Language</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {ONBOARDING_PREFERENCE_LANGUAGES.map((lang) => {
                        const isSelected = lang.id === currentLanguage;
                        return (
                          <button
                            key={lang.id}
                            type="button"
                            onClick={() => {
                              if (onSelectLanguage) onSelectLanguage(lang.id);
                              setLangDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-sm transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/15 text-stone-900 font-bold border border-amber-300'
                                : 'text-stone-700 hover:bg-stone-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{lang.nativeName}</span>
                              <span className="text-xs text-stone-500 font-normal">({lang.name})</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-amber-700" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <span className="px-2.5 py-1 text-xs font-bold rounded-xl bg-red-50 text-red-900 border border-red-200">
              Teaching: Kannada (ಕನ್ನಡ)
            </span>
          </div>
        </div>

        {/* AI Disclaimer Alert */}
        <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-start gap-2 text-[11px] sm:text-xs text-stone-500">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{AI_DISCLAIMER_NOTICE.text}</span>
        </div>
      </div>

      {/* 2. Unconfigured Server Setup Banner (Shown when AI_API_KEY is missing) */}
      {!serverStatus.configured && (
        <div className="bg-amber-50 border border-amber-300 rounded-3xl p-5 mb-4 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <h2 className="text-sm font-bold text-amber-950">
                Setup Required: Add your Google Gemini API Key
              </h2>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                The AI Tutor is ready, but requires a Gemini API key to generate live responses. Keys are kept strictly on your local server and are never exposed to browser users.
              </p>
              <div className="bg-white/80 rounded-xl p-3 border border-amber-200 text-xs text-stone-700 font-mono space-y-1">
                <div>1. Get a key at: <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-red-700 font-bold underline inline-flex items-center gap-0.5">Google AI Studio <ExternalLink className="w-3 h-3" /></a></div>
                <div>2. Add to your server <code>.env</code> file:</div>
                <div className="text-amber-900 font-bold bg-amber-100/60 p-1.5 rounded-md">
                  AI_API_KEY=your_private_gemini_api_key_here
                </div>
                <div>3. Free Tier Quota: 15 requests/min, 1,500 requests/day.</div>
              </div>
              <div className="pt-1 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleManualCheckSetup}
                  disabled={isCheckingServer}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  {isCheckingServer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  <span>Check Setup Again</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Mode Navigation Tabs */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1 bg-stone-100/90 p-1 rounded-2xl border border-stone-200">
          <button
            type="button"
            onClick={() => handleSwitchTab('chat')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-white text-stone-900 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-red-600" />
            <span>Ask Tutor</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchTab('practice')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'practice'
                ? 'bg-white text-stone-900 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Compass className="w-4 h-4 text-amber-600" />
            <span>Conversation Practice</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Speaking Language Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setVoiceLangDropdownOpen(!voiceLangDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer bg-white hover:bg-amber-50/50 border-stone-200 text-stone-700 hover:text-stone-900 shadow-2xs"
              title="Select speech recognition language"
            >
              <Mic className="w-3.5 h-3.5 text-red-600" />
              <span>
                Speak: <strong className="text-stone-900">{voiceLangObj.name}</strong>
              </span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {voiceLangDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setVoiceLangDropdownOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-56 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 text-[11px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-100 mb-1">
                    Speech Input Language
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {SPEECH_RECOGNITION_LANGUAGES.map((lang) => {
                      const isSelected = lang.id === voiceLang;
                      return (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => handleSelectVoiceLang(lang.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-red-50 text-red-900 font-bold border border-red-200'
                              : 'text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                            <span className="text-stone-400 font-normal">({lang.nativeName})</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-red-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Voice Auto-Read Toggle */}
          <button
            type="button"
            onClick={() => setAutoPlayVoice(!autoPlayVoice)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              autoPlayVoice
                ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900 bg-stone-100/70 hover:bg-stone-100 border-stone-200'
            }`}
            title="Automatically read AI responses aloud when received"
          >
            <Radio className={`w-3.5 h-3.5 ${autoPlayVoice ? 'text-amber-700 animate-pulse' : 'text-stone-400'}`} />
            <span>Voice Replies: {autoPlayVoice ? 'Auto-play ON' : 'Auto-play OFF'}</span>
          </button>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-red-200"
              title="Clear active conversation history"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* 4A. Conversation Practice Scenario Selector (Visible in Practice Mode) */}
      {activeTab === 'practice' && (
        <div className="bg-amber-50/60 rounded-2xl p-2.5 sm:p-3 border border-amber-200/80 mb-3">
          <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-2 px-1">
            Select Practice Scenario:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {PRACTICE_SCENARIOS.map((sc) => {
              const isSelected = selectedScenario.id === sc.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleSelectScenario(sc)}
                  className={`flex flex-col items-start p-2 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-stone-900 font-bold border border-red-400 shadow-xs ring-1 ring-red-400'
                      : 'bg-white/60 hover:bg-white text-stone-700 border border-stone-200/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-base">{sc.icon}</span>
                    <span className="text-xs truncate">{sc.title}</span>
                  </div>
                  <span className="font-kannada text-[11px] text-red-700 truncate font-semibold">
                    {sc.nativeTitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4B. Suggested Question Chips (Visible in Chat Mode when conversation is young) */}
      {activeTab === 'chat' && messages.length < 3 && (
        <div className="mb-3">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1.5 px-1">
            Starter Questions:
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SUGGESTED_QUESTIONS.map((sq) => (
              <button
                key={sq.id}
                type="button"
                onClick={() => handleSendMessage(sq.query)}
                disabled={isLoading}
                className="shrink-0 text-xs px-3 py-1.5 bg-white hover:bg-amber-50 hover:border-amber-300 text-stone-700 rounded-xl border border-stone-200 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {sq.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Chat Stream Area */}
      <div className="flex-1 bg-white rounded-3xl p-4 sm:p-6 border border-amber-100 shadow-xs overflow-y-auto mb-3 min-h-[320px] max-h-[60vh] flex flex-col space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-100/70 text-amber-800 flex items-center justify-center border border-amber-200">
              <Sparkles className="w-7 h-7 text-red-600" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="font-bold text-stone-900 text-base">
                Welcome to your AI Kannada Tutor!
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Ask any question about Kannada vocabulary, grammar, or Karnataka daily culture. Explanations will be provided in <span className="font-semibold text-stone-800">{motherTongueObj.name} ({motherTongueObj.nativeName})</span>.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleSendMessage('How do I introduce myself in Kannada?')}
                className="text-xs px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-amber-100 text-stone-700 font-medium transition-colors cursor-pointer border border-stone-200"
              >
                "How do I introduce myself in Kannada?"
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('What does "Hegiddira" mean?')}
                className="text-xs px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-amber-100 text-stone-700 font-medium transition-colors cursor-pointer border border-stone-200"
              >
                "What does 'Hegiddira' mean?"
              </button>
            </div>
          </div>
        )}

        {messages.map((m) => {
          const isUser = m.role === 'user';
          const kannadaSnippet = !isUser ? extractKannadaSnippet(m.content) : null;
          const suggestedReply = !isUser ? extractSuggestedReply(m.content) : null;

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
            >
              <div className="flex items-center gap-2 px-1 text-[11px] text-stone-400">
                <span>{isUser ? 'You' : 'Kannada Mitra AI'}</span>
              </div>

              <div
                className={`max-w-[92%] sm:max-w-[80%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-xs rounded-tr-xs'
                    : 'bg-stone-50 text-stone-900 border border-stone-200/90 shadow-2xs rounded-tl-xs'
                }`}
              >
                {/* Message Body with Linebreak Preservation & Markdown Formatting */}
                {isUser ? (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                ) : (
                  renderFormattedContent(m.content)
                )}

                {/* Helper action pills for model responses */}
                {!isUser && (
                  <div className="mt-3 pt-2.5 border-t border-stone-200/70 flex flex-wrap items-center gap-2">
                    {/* Full Response Text-to-Speech Controls */}
                    {currentlySpeakingMessageId === m.id ? (
                      <button
                        type="button"
                        onClick={handleStopSpeaking}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-900 border border-red-300 animate-pulse transition-all cursor-pointer shadow-2xs"
                        title="Stop speaking"
                      >
                        <Square className="w-3 h-3 fill-red-700 text-red-700" />
                        <span>Stop Speaking</span>
                      </button>
                    ) : playedMessageIds[m.id] ? (
                      <button
                        type="button"
                        onClick={() => handleSpeakResponse(m.id, m.content)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-amber-50 text-stone-700 hover:text-stone-900 border border-stone-200 transition-all cursor-pointer shadow-2xs"
                        title="Replay full response audio"
                      >
                        <RotateCcw className="w-3 h-3 text-amber-700" />
                        <span>Replay</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSpeakResponse(m.id, m.content)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-amber-50 text-stone-700 hover:text-stone-900 border border-stone-200 transition-all cursor-pointer shadow-2xs"
                        title="Listen to full answer read aloud"
                      >
                        <Volume2 className="w-3 h-3 text-amber-700" />
                        <span>Listen to Answer</span>
                      </button>
                    )}

                    {kannadaSnippet && (
                      <button
                        type="button"
                        onClick={() => handlePlayAudio(kannadaSnippet)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          speakingText === kannadaSnippet
                            ? 'bg-red-100 text-red-800 border-red-300 animate-pulse'
                            : 'bg-white hover:bg-stone-50 text-stone-600 border-stone-200'
                        }`}
                        title="Listen to Kannada phrase snippet only"
                      >
                        <Volume2 className="w-3 h-3 text-red-600" />
                        <span>{speakingText === kannadaSnippet ? 'Speaking...' : 'Kannada Phrase'}</span>
                      </button>
                    )}

                    {suggestedReply && activeTab === 'practice' && (
                      <button
                        type="button"
                        onClick={() => {
                          // Extract plain text for suggested response
                          const plain = suggestedReply.replace(/💡\s*Suggested reply:?\s*/i, '').trim();
                          setInputText(plain);
                          inputRef.current?.focus();
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100/70 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-all cursor-pointer"
                        title="Use suggested reply"
                      >
                        <span>💡 Use Suggested Reply</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Bubble with live elapsed seconds & Cancel button */}
        {isLoading && (
          <div className="flex flex-col items-start space-y-1 animate-in fade-in duration-150">
            <div className="px-1 text-[11px] text-stone-400">Kannada Mitra AI is thinking...</div>
            <div className="bg-stone-50 border border-stone-200 rounded-2xl rounded-tl-xs p-3.5 flex items-center justify-between gap-3 text-xs text-stone-600 shadow-2xs w-full max-w-md">
              <div className="flex items-center gap-2 min-w-0">
                <Loader2 className="w-4 h-4 animate-spin text-red-600 shrink-0" />
                <span className="truncate">
                  Explaining in {motherTongueObj.name}... {elapsedSeconds > 0 ? `(${elapsedSeconds}s)` : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCancelRequest}
                className="px-2.5 py-1 text-xs font-semibold text-stone-600 hover:text-red-700 bg-white hover:bg-red-50 border border-stone-200 hover:border-red-300 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Error Banner with Retry Button */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-red-800 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            {lastFailedPayload && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={isLoading}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 6. Input Control Bar */}
      <div className="bg-white rounded-3xl p-2.5 sm:p-3 border border-amber-200/90 shadow-sm">
        {/* 6A. Voice Recognition Active Live Streaming Banner */}
        {(voiceState === 'requesting' || voiceState === 'listening' || voiceState === 'processing') && (
          <div className="mb-2.5 bg-gradient-to-r from-red-50 via-amber-50 to-orange-50 border border-red-300 rounded-2xl p-3 flex flex-col gap-2.5 shadow-xs animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-9 h-9 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  {voiceState === 'listening' ? (
                    <>
                      <span className="absolute inset-0 rounded-2xl bg-red-500 animate-ping opacity-35" />
                      <Mic className="w-4 h-4 animate-pulse relative z-10" />
                    </>
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-950">
                      {voiceState === 'requesting'
                        ? `Connecting mic in ${voiceLangObj.name} (${voiceLangObj.nativeName})...`
                        : voiceState === 'processing'
                        ? 'Finishing transcription...'
                        : `Listening in ${voiceLangObj.name} (${voiceLangObj.nativeName})`}
                    </span>
                    {/* Animated Waveform Bars when listening */}
                    {voiceState === 'listening' && (
                      <div className="flex items-center gap-1 h-4">
                        <span className="w-1 h-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1 h-3.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1 h-4.5 bg-red-600 rounded-full animate-bounce" />
                        <span className="w-1 h-3 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.2s]" />
                        <span className="w-1 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.35s]" />
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] text-stone-500 font-medium">
                    {voiceState === 'requesting'
                      ? 'Please allow microphone access if prompted...'
                      : 'Speak naturally — your words will appear below in real-time.'}
                  </div>
                </div>
              </div>

              {/* Action buttons while listening */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {voiceState === 'listening' && (
                  <button
                    type="button"
                    onClick={handleStopListening}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>Done Speaking</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCancelVoiceInput}
                  className="px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* LIVE STREAMING SPEECH DISPLAY: Words appear here immediately while speaking */}
            <div className="bg-white/95 rounded-xl p-3 border border-amber-200/90 shadow-2xs min-h-[48px] flex items-center">
              {liveFinal || liveInterim ? (
                <div className="text-xs sm:text-sm text-stone-900 font-medium leading-relaxed break-words w-full">
                  {liveFinal && <span className="font-bold text-stone-900">{liveFinal} </span>}
                  {liveInterim && <span className="text-red-700 italic font-semibold">{liveInterim}</span>}
                  <span className="inline-block w-1.5 h-3.5 bg-red-600 ml-1 animate-pulse align-middle" />
                </div>
              ) : (
                <div className="text-xs text-stone-500 italic flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                  <span>
                    Listening in <strong>{voiceLangObj.name}</strong> ({voiceLangObj.nativeName})... Start speaking now, words appear here live.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6B. Voice Notification Hint (Non-blocking gentle toast) */}
        {voiceNotice && (
          <div className="mb-2.5 bg-amber-50 border border-amber-300/80 rounded-2xl p-2.5 flex items-center justify-between gap-2 text-xs text-amber-950 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{voiceNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setVoiceNotice(null)}
              className="text-amber-800 hover:text-amber-950 font-bold px-1.5 py-0.5 rounded-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 6C. Voice Recognition Error Banner */}
        {voiceError && (
          <div className="mb-2.5 bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center justify-between gap-2.5 text-xs text-red-900 animate-in fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="truncate sm:whitespace-normal">{voiceError}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleStartListening}
                className="px-2.5 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => setVoiceError(null)}
                className="px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2"
        >
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={2}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading || !serverStatus.configured}
              placeholder={
                !serverStatus.configured
                  ? 'Add your AI_API_KEY in .env to unlock the AI tutor...'
                  : activeTab === 'practice'
                  ? 'Reply in Kannada, speak with mic, or ask for help...'
                  : 'Ask about a Kannada word, phrase, or tap Speak (Enter to send)...'
              }
              className="w-full resize-none p-3 text-xs sm:text-sm text-stone-800 placeholder-stone-400 bg-stone-50 focus:bg-white rounded-2xl border border-stone-200 focus:border-amber-400 focus:outline-hidden transition-all disabled:opacity-50 disabled:bg-stone-100"
            />
            <div className="absolute bottom-2.5 right-3 text-[10px] text-stone-400 font-mono pointer-events-none">
              {inputText.length}/1000
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* Prominent Microphone Voice Button with All State Machine Stages */}
            {voiceState === 'requesting' ? (
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-amber-500 text-white font-bold text-xs sm:text-sm shadow-xs shrink-0 cursor-wait animate-pulse"
                aria-label="Connecting microphone"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting...</span>
              </button>
            ) : voiceState === 'listening' ? (
              <button
                type="button"
                onClick={handleStopListening}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer animate-pulse shrink-0 ring-2 ring-red-400"
                aria-label="Stop recording voice question"
                title="Stop recording voice question"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Stop</span>
              </button>
            ) : voiceState === 'processing' ? (
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-xs shrink-0 cursor-wait"
                aria-label="Processing speech transcription"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </button>
            ) : voiceState === 'error' ? (
              <button
                type="button"
                onClick={handleStartListening}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer shrink-0"
                aria-label="Retry microphone input"
                title="Voice recognition encountered an issue. Click to retry."
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Retry Mic</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartListening}
                disabled={isLoading || !isVoiceSupported}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                aria-label="Speak your question using microphone"
                title={
                  !isVoiceSupported
                    ? 'Voice input is not supported in this browser (use Chrome or Edge)'
                    : `Speak in ${voiceLangObj.name} (${voiceLangObj.nativeName})`
                }
              >
                <Mic className="w-4 h-4" />
                <span>Speak</span>
              </button>
            )}

            {/* Send Message Button */}
            <button
              type="submit"
              disabled={isLoading || !inputText.trim() || !serverStatus.configured}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
              aria-label="Send message to AI Tutor"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* 7. Privacy & Storage Notice with Voice Notice */}
        <div className="mt-2.5 pt-2 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between text-[10px] text-stone-500 gap-1 px-1">
          <div>
            🔒 Voice is processed locally in your browser (no audio recordings are stored). Conversations are saved on this device only.
          </div>
          <div>
            Gemini 3.5 Flash-Lite AI Tutor • Speech Recognition & Synthesis Web APIs
          </div>
        </div>
      </div>

      {/* 8. Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-modal-title"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 id="clear-modal-title" className="font-bold text-stone-900 text-base">
                  Clear {activeTab === 'practice' ? 'Practice' : 'Chat'} History?
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Are you sure you want to permanently clear your saved {activeTab === 'practice' ? 'Conversation Practice' : 'Ask Tutor'} messages on this device? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearChat}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

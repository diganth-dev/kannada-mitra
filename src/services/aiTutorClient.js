/**
 * Kannada Mitra — AI Tutor Browser-Side Client
 *
 * Communicates with the server-side /api/ai-tutor endpoint.
 *
 * CRITICAL SECURITY ARCHITECTURE:
 * - NO API keys are stored or referenced in this file or any client code.
 * - All AI requests are handled server-side to prevent credential leakage.
 * - Responses are unverified dynamically generated content.
 */

export const AI_TUTOR_ENDPOINT = '/api/ai-tutor';

export const AI_DISCLAIMER_NOTICE = {
  badge: '✨ AI-Generated Tutor',
  text: 'Explanations and conversations are generated dynamically by AI for learning practice. They are not part of the verified human-reviewed vocabulary dataset. Verify local idioms with native speakers.',
};

export const PRACTICE_SCENARIOS = [
  {
    id: 'first_meeting',
    title: 'Meeting Someone',
    nativeTitle: 'ಹೊಸ ಪರಿಚಯ',
    icon: '🤝',
    description: 'Introduce yourself, exchange pleasantries, and ask how someone is doing.',
    initialPrompt: 'Hello! I am meeting someone for the first time in Bengaluru. Please start the conversation politely in Kannada.',
  },
  {
    id: 'shopping',
    title: 'At a Local Shop',
    nativeTitle: 'ಅಂಗಡಿಯಲ್ಲಿ',
    icon: '🛍️',
    description: 'Ask for grocery prices, check availability, and negotiate politely.',
    initialPrompt: 'I just walked into a local provisions store in Karnataka. Please act as the shopkeeper and greet me in Kannada.',
  },
  {
    id: 'restaurant',
    title: 'Ordering Food',
    nativeTitle: 'ಹೋಟೆಲ್‌ನಲ್ಲಿ ಊಟ',
    icon: '🍛',
    description: 'Order breakfast items, filter coffee, and ask for the bill at a darshini.',
    initialPrompt: 'I am at a popular darshini restaurant in Bengaluru. Please act as the server taking my order in Kannada.',
  },
  {
    id: 'directions',
    title: 'Asking for Directions',
    nativeTitle: 'ದಾರಿ ಕೇಳುವುದು',
    icon: '🧭',
    description: 'Ask an auto driver or passerby how to reach a bus stand or metro station.',
    initialPrompt: 'I am trying to find the nearest Namma Metro station. Please act as a local passerby who can guide me in Kannada.',
  },
  {
    id: 'friend',
    title: 'Talking to a Friend',
    nativeTitle: 'ಸ್ನೇಹಿತರೊಂದಿಗೆ',
    icon: '☕',
    description: 'Casual catch-up over tea, talking about your day, and making weekend plans.',
    initialPrompt: 'We are friends meeting at a tea stall. Greet me casually in everyday conversational Kannada.',
  },
];

export const SUGGESTED_QUESTIONS = [
  {
    id: 'q1',
    label: 'Introduce Myself',
    query: 'How do I introduce myself politely in Kannada? Give me script, pronunciation, and meaning.',
  },
  {
    id: 'q2',
    label: 'Meaning of "Hēgiddīrā?"',
    query: 'What does "Hēgiddīrā?" mean, and what are the best natural ways to reply?',
  },
  {
    id: 'q3',
    label: 'Ordering Food',
    query: 'How do I order masala dosa and filter coffee in a Bengaluru darshini hotel?',
  },
  {
    id: 'q4',
    label: '5 Common Sentences',
    query: 'Teach me five practical Kannada sentences I can use every single day in Karnataka.',
  },
  {
    id: 'q5',
    label: 'Nīvu vs Nīnu',
    query: 'What is the difference between formal "Nīvu" and informal "Nīnu" in Kannada?',
  },
  {
    id: 'q6',
    label: 'Auto Driver Phrases',
    query: 'What are the most common phrases to communicate with an auto driver in Bengaluru?',
  },
];

/**
 * Checks server endpoint connectivity and whether the AI API key is configured
 */
export async function checkTutorStatus(endpoint = AI_TUTOR_ENDPOINT) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        ok: false,
        configured: false,
        error: 'ENDPOINT_UNAVAILABLE',
        message: `Tutor endpoint returned HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    return {
      ok: true,
      configured: Boolean(data.configured),
      model: data.model || 'gemini-3.5-flash-lite',
      provider: data.provider || 'gemini',
      quotas: data.quotas,
    };
  } catch (err) {
    return {
      ok: false,
      configured: false,
      error: 'SERVER_UNREACHABLE',
      message: err.name === 'AbortError' ? 'Endpoint check timed out' : 'Could not reach server endpoint',
    };
  }
}

export const DEFAULT_CLIENT_TIMEOUT_MS = 125000;

/**
 * Sends a user query or conversation turn to the server-side AI tutor
 */
export async function sendTutorQuestion({
  message,
  history = [],
  preferredLanguage = 'English',
  targetLanguage = 'Kannada',
  mode = 'chat',
  scenario = null,
  endpoint = AI_TUTOR_ENDPOINT,
  signal = null,
  timeoutMs = DEFAULT_CLIENT_TIMEOUT_MS,
}) {
  const startTime = Date.now();
  let timedOut = false;

  const internalController = new AbortController();
  const timeoutId = setTimeout(() => {
    timedOut = true;
    internalController.abort();
  }, timeoutMs);

  const onExternalAbort = () => {
    internalController.abort();
  };

  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      return {
        ok: false,
        status: 499,
        error: 'REQUEST_ABORTED',
        message: 'The request was cancelled.',
        origin: 'client',
        durationMs: 0,
      };
    }
    signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        message,
        history,
        preferredLanguage,
        targetLanguage,
        mode,
        scenario,
      }),
      signal: internalController.signal,
    });

    const data = await res.json().catch(() => ({}));
    const durationMs = Date.now() - startTime;

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: data.error || 'SERVER_ERROR',
        message: data.message || `Server returned error (${res.status}).`,
        setupGuide: data.setupGuide || null,
        origin: data.origin || 'backend',
        durationMs,
      };
    }

    return {
      ok: true,
      status: 200,
      text: data.text,
      model: data.model,
      provider: data.provider,
      usage: data.usage,
      origin: data.origin || 'gemini',
      durationMs,
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;

    if (timedOut) {
      return {
        ok: false,
        status: 408,
        error: 'TIMEOUT',
        message: `The AI Tutor request timed out after ${Math.round(timeoutMs / 1000)} seconds. Please check your network and click Retry.`,
        origin: 'client',
        durationMs,
      };
    }

    if (signal?.aborted || err.name === 'AbortError') {
      return {
        ok: false,
        status: 499,
        error: 'REQUEST_ABORTED',
        message: 'The request was cancelled.',
        origin: 'client',
        durationMs,
      };
    }

    return {
      ok: false,
      status: 503,
      error: 'NETWORK_FAILURE',
      message: 'Failed to connect to the Kannada Mitra server. Please verify your network and check that the server is running.',
      origin: 'client',
      durationMs,
    };
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', onExternalAbort);
    }
  }
}

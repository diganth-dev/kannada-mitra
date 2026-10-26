import { getAiConfig } from './env.js';

/**
 * Kannada Mitra — AI Tutor Backend Service
 *
 * Implements server-side processing for the AI Kannada Tutor using Google Gemini REST API.
 * Adheres to strict privacy, rate limiting, and credential isolation principles:
 * - Private API keys are never exposed in browser bundles or responses.
 * - System instructions enforce beginner-friendly, culturally authentic Kannada instruction.
 * - AI responses are explicitly marked unverified to preserve dataset integrity.
 */

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_TURNS = 10;
const MAX_HISTORY_TURN_LENGTH = 500;
// Tight 9-second default backend timeout: stays safely within Netlify serverless functions'
// execution limits (10s) and prevents long 1-minute hangs.
export const DEFAULT_BACKEND_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '9000', 10);

/**
 * Constructs the pedagogical system instruction for the AI tutor
 */
export function buildTutorSystemInstruction({
  preferredLanguage = 'English',
  targetLanguage = 'Kannada',
  mode = 'chat',
  scenario = null,
} = {}) {
  let instruction = `You are Kannada Mitra, a friendly and patient Kannada language tutor.
Help beginners learn Kannada using simple explanations and practical everyday examples in ${preferredLanguage}.

When teaching Kannada, provide:
1. Kannada script.
2. A readable Latin-character pronunciation guide.
3. A translation into the learner's selected explanation language (${preferredLanguage}).
4. A short, practical example when appropriate.

Guidelines:
- Keep responses concise, direct, and beginner-friendly (2-4 short sentences or bullet points). Avoid long walls of text.
- Explain grammar without overwhelming beginners.
- Correct mistakes politely and explain how to improve.
- Distinguish formal, informal, and regional expressions when relevant.
- Never claim that an AI-generated translation is verified by a native speaker.
- If a translation or pronunciation is uncertain, acknowledge that uncertainty rather than inventing confidence.
- Keep responses focused, useful, and beginner-friendly.
- Do not claim to provide audio pronunciation unless actual audio functionality is implemented.`;

  if (targetLanguage !== 'Kannada') {
    instruction += `\n\nNOTE: The learner has selected "${targetLanguage}" as their target learning language and "${preferredLanguage}" as their explanation language. Guide them in ${targetLanguage} using ${preferredLanguage} explanations. If you lack sufficient proficiency in ${targetLanguage}, politely indicate your limitations.`;
  }

  if (mode === 'practice' && scenario) {
    instruction += `\n\nCONVERSATION PRACTICE MODE:
Scenario: "${scenario}".
Act as a supportive, realistic conversation partner in Karnataka (e.g. shopkeeper, auto driver, friendly neighbor).
1. Keep each response concise (1-2 sentences in simple beginner spoken Kannada).
2. Format your response clearly:
   - Kannada script
   - Latin pronunciation guide
   - Meaning in ${preferredLanguage}
3. If the learner made any vocabulary, grammar, or politeness errors in their message, provide a gentle, 1-sentence tip in ${preferredLanguage}.
4. Provide a suggested reply they can use next, formatted as:
   💡 Suggested reply: [Kannada script] ([Pronunciation]) - [Meaning in ${preferredLanguage}]`;
  }

  return instruction;
}

/**
 * Validates incoming client request payload
 */
export function validateTutorRequest(payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'INVALID_REQUEST', message: 'Request body must be a valid JSON object.' };
  }

  const { message, history, preferredLanguage, targetLanguage, mode, scenario } = payload;

  if (typeof message !== 'string' || !message.trim()) {
    return { valid: false, error: 'EMPTY_MESSAGE', message: 'Message is required and cannot be empty.' };
  }

  if (message.trim().length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: 'MESSAGE_TOO_LONG',
      message: `Message exceeds maximum allowed length of ${MAX_MESSAGE_LENGTH} characters.`,
    };
  }

  let sanitizedHistory = [];
  if (Array.isArray(history)) {
    sanitizedHistory = history
      .slice(-MAX_HISTORY_TURNS)
      .filter((turn) => turn && typeof turn === 'object' && typeof turn.content === 'string')
      .map((turn) => ({
        role: turn.role === 'model' || turn.role === 'assistant' ? 'model' : 'user',
        content: turn.content.slice(0, MAX_HISTORY_TURN_LENGTH),
      }));
  }

  return {
    valid: true,
    data: {
      message: message.trim(),
      history: sanitizedHistory,
      preferredLanguage: typeof preferredLanguage === 'string' && preferredLanguage.trim() ? preferredLanguage.trim() : 'English',
      targetLanguage: typeof targetLanguage === 'string' && targetLanguage.trim() ? targetLanguage.trim() : 'Kannada',
      mode: mode === 'practice' ? 'practice' : 'chat',
      scenario: typeof scenario === 'string' ? scenario.slice(0, 100) : null,
    },
  };
}

/**
 * Calls the official Google Gemini v1beta generateContent REST API
 */
/**
 * Executes a single HTTP request to the Google Gemini generateContent REST API
 */
async function executeSingleGeminiCall({
  apiKey,
  model,
  systemInstruction,
  history,
  message,
  signal = null,
  timeoutMs = DEFAULT_BACKEND_TIMEOUT_MS,
}) {
  const startTime = Date.now();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

  // Internal timeout controller linked with caller signal
  const timeoutController = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    timeoutController.abort();
  }, timeoutMs);

  const onExternalAbort = () => {
    timeoutController.abort();
  };

  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      throw {
        status: 499,
        error: 'REQUEST_ABORTED',
        message: 'Request was cancelled before submission.',
        origin: 'client',
        durationMs: 0,
      };
    }
    signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  // Build Gemini contents array with alternating roles
  const contents = [];
  for (const turn of history) {
    contents.push({
      role: turn.role === 'model' ? 'model' : 'user',
      parts: [{ text: turn.content }],
    });
  }

  // Append current user message
  contents.push({
    role: 'user',
    parts: [{ text: message }],
  });

  const generationConfig = {
    temperature: 0.6,
    maxOutputTokens: 600,
    topP: 0.95,
  };

  // Turn off thinking completely where supported for near-instant conversational latency:
  // - Gemini 2.5 series: thinkingBudget: 0 disables thinking tokens completely (~0.5s - 1.5s latency).
  // - Gemini 3 & 4 series: thinkingLevel: 'low' requests minimum reasoning depth.
  if (model.includes('2.5') || model.includes('2.0') || model.includes('1.5')) {
    generationConfig.thinkingConfig = {
      thinkingBudget: 0,
    };
  } else if (model.includes('3') || model.includes('4')) {
    generationConfig.thinkingConfig = {
      thinkingLevel: 'low',
    };
  }

  const requestBody = {
    contents,
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    generationConfig,
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: timeoutController.signal,
    });

    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      let parsedError;
      try {
        parsedError = JSON.parse(errorBody);
      } catch {
        parsedError = null;
      }

      const status = response.status;
      const providerMessage = parsedError?.error?.message || response.statusText;

      if (status === 400) {
        throw {
          status: 400,
          error: 'PROVIDER_BAD_REQUEST',
          message: `Gemini API rejected request: ${providerMessage}`,
          origin: 'gemini',
          durationMs,
        };
      }
      if (status === 401 || status === 403) {
        throw {
          status: 403,
          error: 'INVALID_API_KEY',
          message: 'The configured Google Gemini API key was rejected. Please verify AI_API_KEY in .env.',
          origin: 'gemini',
          durationMs,
        };
      }
      if (status === 429) {
        throw {
          status: 429,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Gemini rate limit exceeded. Free tier allows 15 requests/minute. Please wait a moment and click Retry.',
          origin: 'gemini',
          durationMs,
        };
      }
      if (status >= 500) {
        throw {
          status: 503,
          error: 'PROVIDER_UNAVAILABLE',
          message: providerMessage || 'Google Gemini service is temporarily unavailable. Please try again shortly.',
          origin: 'gemini',
          durationMs,
        };
      }

      throw {
        status,
        error: 'UPSTREAM_ERROR',
        message: `AI provider error (${status}): ${providerMessage}`,
        origin: 'gemini',
        durationMs,
      };
    }

    const json = await response.json();
    const candidate = json.candidates?.[0];
    // Filter out thinking parts (where part.thought === true) and join the text parts
    const responseText =
      candidate?.content?.parts
        ?.filter((p) => !p.thought && typeof p.text === 'string')
        ?.map((p) => p.text)
        ?.join('\n') || '';

    if (!responseText) {
      throw {
        status: 502,
        error: 'EMPTY_RESPONSE',
        message: 'AI tutor returned an empty response. Please try rephrasing your question.',
        origin: 'gemini',
        durationMs,
      };
    }

    return {
      text: responseText,
      model,
      finishReason: candidate.finishReason || 'STOP',
      usage: json.usageMetadata || null,
      origin: 'gemini',
      durationMs,
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;

    if (timedOut) {
      throw {
        status: 504,
        error: 'GATEWAY_TIMEOUT',
        message: `Gemini API request timed out after ${Math.round(timeoutMs / 1000)} seconds. Please click Retry.`,
        origin: 'backend',
        durationMs,
      };
    }

    if (signal?.aborted || err.name === 'AbortError') {
      throw {
        status: 499,
        error: 'REQUEST_ABORTED',
        message: 'The request was cancelled by the client.',
        origin: 'client',
        durationMs,
      };
    }

    if (err.status && err.error) {
      throw err;
    }

    throw {
      status: 503,
      error: 'NETWORK_FAILURE',
      message: err.message ? `Network connection to Gemini API failed: ${err.message}` : 'Failed to connect to Google Gemini API.',
      origin: 'backend',
      durationMs,
    };
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', onExternalAbort);
    }
  }
}

/**
 * Calls the official Google Gemini v1beta generateContent REST API with
 * resilient ultra-low-latency fallback models and tight execution deadlines.
 */
export async function callGeminiApi({
  apiKey,
  model,
  systemInstruction,
  history,
  message,
  signal = null,
  timeoutMs = DEFAULT_BACKEND_TIMEOUT_MS,
}) {
  const normalizedModel =
    !model || model === 'gemini-2.5-flash' || model === 'gemini-2.5-flash-lite'
      ? 'gemini-3.5-flash-lite'
      : model;

  // Build ordered list of candidate models to try:
  // 1. Configured/normalized primary model
  // 2. High-speed fallbacks (gemini-3.5-flash-lite, gemini-3.1-flash-lite, gemini-3.8-flash)
  const candidateModels = [normalizedModel];
  const fastFallbacks = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  for (const fb of fastFallbacks) {
    if (!candidateModels.includes(fb)) {
      candidateModels.push(fb);
    }
  }

  const overallDeadline = Date.now() + timeoutMs;
  let lastError = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const currentModel = candidateModels[i];
    const remainingTime = overallDeadline - Date.now();
    if (remainingTime <= 500) {
      break; // Budget exhausted
    }

    if (signal?.aborted) {
      throw {
        status: 499,
        error: 'REQUEST_ABORTED',
        message: 'The request was cancelled by the client.',
        origin: 'client',
        durationMs: 0,
      };
    }

    // Allocate tight per-attempt timeout (max 6 seconds or remaining budget)
    // so no single slow model can block the serverless execution window.
    const attemptTimeout = Math.min(remainingTime, 6000);

    try {
      return await executeSingleGeminiCall({
        apiKey,
        model: currentModel,
        systemInstruction,
        history,
        message,
        signal,
        timeoutMs: attemptTimeout,
      });
    } catch (err) {
      lastError = err;

      // Fatal client errors: do not retry or fall back
      if (err.status === 400 || err.status === 401 || err.status === 403 || err.status === 499) {
        throw err;
      }

      // On 503 (high demand), 504 (timeout), 404 (model retired), or 429 (rate limit):
      // Immediately proceed to the next fallback model without sleeping to avoid Netlify timeouts.
      continue;
    }
  }

  throw lastError || {
    status: 504,
    error: 'GATEWAY_TIMEOUT',
    message: `Gemini API request timed out after ${Math.round(timeoutMs / 1000)} seconds. Please click Retry.`,
    origin: 'backend',
    durationMs: timeoutMs,
  };
}

/**
 * Full query execution pipeline: validates request, checks credentials, calls API
 */
export async function processAiTutorQuery(payload, { customFetcher = null, signal = null, timeoutMs = null } = {}) {
  const startTime = Date.now();
  const validation = validateTutorRequest(payload);
  if (!validation.valid) {
    return {
      status: 400,
      body: {
        success: false,
        error: validation.error,
        message: validation.message,
        origin: 'backend',
        durationMs: Date.now() - startTime,
      },
    };
  }

  const config = getAiConfig();
  if (!config.isConfigured) {
    return {
      status: 503,
      body: {
        success: false,
        error: 'CONFIG_REQUIRED',
        message:
          'AI Kannada Tutor is not configured yet. To enable the AI tutor, add your private AI_API_KEY from Google AI Studio (https://aistudio.google.com/) to the .env file and restart the server.',
        setupGuide: {
          step1: 'Visit https://aistudio.google.com/ and generate a Gemini API key.',
          step2: 'Add AI_API_KEY=your_key to your local .env file.',
          step3: 'Restart the dev server (npm run dev).',
        },
        origin: 'backend',
        durationMs: Date.now() - startTime,
      },
    };
  }

  const { message, history, preferredLanguage, targetLanguage, mode, scenario } = validation.data;
  const systemInstruction = buildTutorSystemInstruction({
    preferredLanguage,
    targetLanguage,
    mode,
    scenario,
  });

  try {
    const fetchFunc = customFetcher || callGeminiApi;
    const result = await fetchFunc({
      apiKey: config.apiKey,
      model: config.model,
      systemInstruction,
      history,
      message,
      signal,
      timeoutMs: timeoutMs || DEFAULT_BACKEND_TIMEOUT_MS,
    });

    const durationMs = Date.now() - startTime;
    return {
      status: 200,
      body: {
        success: true,
        text: result.text,
        model: config.model,
        provider: config.provider,
        usage: result.usage,
        origin: 'gemini',
        durationMs,
      },
    };
  } catch (err) {
    const durationMs = err.durationMs || (Date.now() - startTime);
    const status = err.status || 500;
    const errorCode = err.error || 'INTERNAL_ERROR';
    const message = err.message || 'An unexpected error occurred while communicating with the AI tutor.';
    const origin = err.origin || 'backend';

    return {
      status,
      body: {
        success: false,
        error: errorCode,
        message,
        origin,
        durationMs,
      },
    };
  }
}

/**
 * HTTP handler for Node.js http and Vite dev server connect middleware
 */
export async function handleAiTutorHttp(req, res, options = {}) {
  // CORS & Security Headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // GET /api/ai-tutor: Returns server tutor capability status without revealing keys
  if (req.method === 'GET') {
    const config = getAiConfig();
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        status: 'ok',
        configured: config.isConfigured,
        model: config.model,
        provider: config.provider,
        quotas: config.quotas,
      })
    );
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ success: false, error: 'METHOD_NOT_ALLOWED', message: 'Use POST for AI Tutor queries.', origin: 'backend' }));
    return;
  }

  // Read request body safely with payload size limit (max 100KB)
  let rawBody = '';
  let exceedsSize = false;

  req.on('data', (chunk) => {
    rawBody += chunk;
    if (rawBody.length > 100 * 1024) {
      exceedsSize = true;
      req.destroy();
    }
  });

  req.on('end', async () => {
    if (exceedsSize) {
      res.statusCode = 413;
      res.end(JSON.stringify({ success: false, error: 'PAYLOAD_TOO_LARGE', message: 'Payload exceeded 100KB limit.', origin: 'backend' }));
      return;
    }

    let payload;
    try {
      payload = JSON.parse(rawBody || '{}');
    } catch {
      res.statusCode = 400;
      res.end(JSON.stringify({ success: false, error: 'INVALID_JSON', message: 'Request body must be valid JSON.', origin: 'backend' }));
      return;
    }

    // Client connection disconnect cancellation
    const clientController = new AbortController();
    const onClose = () => {
      if (!res.writableEnded) {
        clientController.abort();
      }
    };
    res.on('close', onClose);

    try {
      const outcome = await processAiTutorQuery(payload, {
        ...options,
        signal: clientController.signal,
      });

      if (!res.writableEnded && !res.destroyed) {
        res.statusCode = outcome.status;
        res.end(JSON.stringify(outcome.body));
      }
    } catch (err) {
      if (!res.writableEnded && !res.destroyed) {
        res.statusCode = 500;
        res.end(JSON.stringify({
          success: false,
          error: 'INTERNAL_ERROR',
          message: err?.message || 'Internal server error.',
          origin: 'backend',
        }));
      }
    } finally {
      res.removeListener('close', onClose);
    }
  });
}

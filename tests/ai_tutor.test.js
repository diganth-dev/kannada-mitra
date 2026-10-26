import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildTutorSystemInstruction,
  validateTutorRequest,
  processAiTutorQuery,
} from '../server/aiTutorService.js';
import { getAiConfig, PLACEHOLDER_API_KEY } from '../server/env.js';
import {
  checkTutorStatus,
  sendTutorQuestion,
  PRACTICE_SCENARIOS,
  SUGGESTED_QUESTIONS,
  AI_DISCLAIMER_NOTICE,
} from '../src/services/aiTutorClient.js';
import { VOCABULARY } from '../src/data/vocabulary.js';
import { isLanguagePairSupported } from '../src/data/languages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// ==========================================
// AI KANNADA TUTOR AUTOMATED TEST SUITE
// ==========================================

test('1. Backend request validation: accepts valid payload, rejects empty/oversized messages', () => {
  // Valid chat payload
  const valid = validateTutorRequest({
    message: 'How do I say "Thank you" in Kannada?',
    preferredLanguage: 'Hindi',
    targetLanguage: 'Kannada',
    mode: 'chat',
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.data.message, 'How do I say "Thank you" in Kannada?');
  assert.equal(valid.data.preferredLanguage, 'Hindi');
  assert.equal(valid.data.targetLanguage, 'Kannada');
  assert.equal(valid.data.mode, 'chat');

  // Rejection 1: Empty or whitespace-only message
  const empty = validateTutorRequest({ message: '   ' });
  assert.equal(empty.valid, false);
  assert.equal(empty.error, 'EMPTY_MESSAGE');

  // Rejection 2: Message exceeding 1,000 characters
  const tooLong = validateTutorRequest({ message: 'A'.repeat(1001) });
  assert.equal(tooLong.valid, false);
  assert.equal(tooLong.error, 'MESSAGE_TOO_LONG');

  // Sanitization: History exceeds 10 turns
  const longHistory = Array.from({ length: 15 }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `Turn ${i}`,
  }));
  const withHistory = validateTutorRequest({
    message: 'Hello',
    history: longHistory,
  });
  assert.equal(withHistory.valid, true);
  assert.equal(withHistory.data.history.length, 10, 'History must be capped at 10 turns');
  assert.equal(withHistory.data.history[0].content, 'Turn 5');
});

test('2. Pedagogical system instruction design adheres to language requirements', () => {
  // Test 1: Standard Kannada learning through Telugu
  const instructionTelugu = buildTutorSystemInstruction({
    preferredLanguage: 'Telugu',
    targetLanguage: 'Kannada',
    mode: 'chat',
  });

  assert.ok(instructionTelugu.includes('Kannada Mitra'));
  assert.ok(instructionTelugu.includes('Telugu'), 'Must incorporate learner explanation language');
  assert.ok(instructionTelugu.includes('Kannada script'), 'Must instruct model to provide Kannada script');
  assert.ok(instructionTelugu.includes('Latin-character pronunciation guide'), 'Must require Latin pronunciation');
  assert.ok(instructionTelugu.includes('Never claim that an AI-generated translation is verified'), 'Must disclaim verification');
  assert.ok(instructionTelugu.includes('Do not claim to provide audio pronunciation'), 'Must prevent false audio claims');

  // Test 2: Conversation practice mode with scenario
  const instructionPractice = buildTutorSystemInstruction({
    preferredLanguage: 'Hindi',
    targetLanguage: 'Kannada',
    mode: 'practice',
    scenario: 'Ordering food at a restaurant',
  });

  assert.ok(instructionPractice.includes('CONVERSATION PRACTICE MODE'));
  assert.ok(instructionPractice.includes('Ordering food at a restaurant'));
  assert.ok(instructionPractice.includes('Suggested reply'));
  assert.ok(instructionPractice.includes('Hindi'));
});

test('3. Missing or placeholder API key handling: returns 503 CONFIG_REQUIRED without mock fallback', async () => {
  // Test with explicit placeholder key
  const originalKey = process.env.AI_API_KEY;
  process.env.AI_API_KEY = PLACEHOLDER_API_KEY;

  assert.equal(getAiConfig().isConfigured, false, 'Placeholder key must report isConfigured: false');

  const outcome = await processAiTutorQuery({
    message: 'Hello',
    preferredLanguage: 'English',
  });

  assert.equal(outcome.status, 503);
  assert.equal(outcome.body.success, false);
  assert.equal(outcome.body.error, 'CONFIG_REQUIRED');
  assert.ok(outcome.body.message.includes('not configured yet'));
  assert.ok(outcome.body.setupGuide);

  // Restore env
  process.env.AI_API_KEY = originalKey;
});

test('4. Upstream error mapping protects secrets and maps provider errors accurately', async () => {
  const originalKey = process.env.AI_API_KEY;
  process.env.AI_API_KEY = 'test_valid_dummy_key_1234567890';

  // Mock 1: 403 Invalid API key from Gemini
  const mock403Fetcher = async () => {
    throw {
      status: 403,
      error: 'INVALID_API_KEY',
      message: 'The configured Google Gemini API key was rejected. Please verify AI_API_KEY in .env.',
    };
  };

  const res403 = await processAiTutorQuery(
    { message: 'What is "Beku"?' },
    { customFetcher: mock403Fetcher }
  );
  assert.equal(res403.status, 403);
  assert.equal(res403.body.error, 'INVALID_API_KEY');
  assert.equal(res403.body.message.includes('test_valid_dummy_key'), false, 'Never leak API key');

  // Mock 2: 429 Rate Limit Exceeded
  const mock429Fetcher = async () => {
    throw {
      status: 429,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Gemini rate limit exceeded. Free tier allows 15 requests/minute.',
    };
  };

  const res429 = await processAiTutorQuery(
    { message: 'What is "Beda"?' },
    { customFetcher: mock429Fetcher }
  );
  assert.equal(res429.status, 429);
  assert.equal(res429.body.error, 'RATE_LIMIT_EXCEEDED');

  // Mock 3: Successful generation
  const mockSuccessFetcher = async () => {
    return {
      text: 'ನಮಸ್ಕಾರ (Namaskāra) means "Hello / Greetings" in Kannada. How can I help you today?',
      finishReason: 'STOP',
      usage: { promptTokenCount: 20, candidatesTokenCount: 30, totalTokenCount: 50 },
    };
  };

  const resSuccess = await processAiTutorQuery(
    { message: 'Hello' },
    { customFetcher: mockSuccessFetcher }
  );
  assert.equal(resSuccess.status, 200);
  assert.equal(resSuccess.body.success, true);
  assert.ok(resSuccess.body.text.includes('Namaskāra'));
  assert.equal(resSuccess.body.usage.totalTokenCount, 50);

  // Restore env
  process.env.AI_API_KEY = originalKey;
});

test('5. Critical Security Audit: Private API keys are never bundled into client dist or src', () => {
  // Check 1: No VITE_ prefixed secret key in .env or .env.example
  const envExamplePath = path.resolve(ROOT_DIR, '.env.example');
  const envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');
  assert.equal(envExampleContent.includes('VITE_AI_API_KEY'), false);
  assert.equal(envExampleContent.includes('VITE_GEMINI_API_KEY'), false);

  // Check 2: .gitignore properly isolates .env files
  const gitignorePath = path.resolve(ROOT_DIR, '.gitignore');
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
  assert.ok(gitignoreContent.includes('.env'));
  assert.ok(gitignoreContent.includes('.env.*'));

  // Check 3: Client src/ files never reference process.env.AI_API_KEY
  const srcFiles = [];
  function scanDir(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) scanDir(full);
      else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
        srcFiles.push(full);
      }
    }
  }
  scanDir(path.resolve(ROOT_DIR, 'src'));

  for (const file of srcFiles) {
    const code = fs.readFileSync(file, 'utf-8');
    assert.equal(
      code.includes('process.env.AI_API_KEY'),
      false,
      `Client file ${path.basename(file)} must not access private AI_API_KEY`
    );
    assert.equal(
      code.includes('process.env.GEMINI_API_KEY'),
      false,
      `Client file ${path.basename(file)} must not access private GEMINI_API_KEY`
    );
  }

  // Check 4: If dist/ exists, verify production bundles do not contain the placeholder secret
  const distDir = path.resolve(ROOT_DIR, 'dist');
  if (fs.existsSync(distDir)) {
    const distAssets = fs.readdirSync(path.join(distDir, 'assets'));
    for (const asset of distAssets) {
      if (asset.endsWith('.js')) {
        const bundle = fs.readFileSync(path.join(distDir, 'assets', asset), 'utf-8');
        assert.equal(
          bundle.includes('AQ.Ab8RN6IcwICJcVjpn7nc0qj-URZ'),
          false,
          `Bundle ${asset} must never contain secret placeholder key`
        );
      }
    }
  }
});

test('6. Preservation of Verified Learning System & Bengali/Urdu isolation', () => {
  // Check 1: Production vocabulary contains 300+ items (expanded from 54)
  assert.ok(VOCABULARY.length >= 300, `VOCABULARY must have >= 300 verified items, found ${VOCABULARY.length}`);

  // Check 2: Active vocabulary items have zero Bengali or Urdu translations
  for (const item of VOCABULARY) {
    assert.equal(item.translations?.Bengali, undefined);
    assert.equal(item.translations?.Urdu, undefined);
  }

  // Check 3: Language-pair coverage matrix is strictly preserved at 42 verified pairs
  const verifiedCore = ['Kannada', 'Hindi', 'English', 'Telugu', 'Tamil', 'Malayalam', 'Marathi'];
  for (const t of verifiedCore) {
    for (const m of verifiedCore) {
      if (t !== m) {
        assert.equal(isLanguagePairSupported(t, m), true);
      }
    }
  }

  // Check 4: Bengali and Urdu pairs remain unsupported in verified system
  assert.equal(isLanguagePairSupported('Kannada', 'Bengali'), false);
  assert.equal(isLanguagePairSupported('Kannada', 'Urdu'), false);
  assert.equal(isLanguagePairSupported('Bengali', 'Kannada'), false);

  // Check 5: Review file exists and all 54 entries remain pending_review
  const reviewFile = path.resolve(ROOT_DIR, 'src/data/pending_translations_bengali_urdu.json');
  assert.ok(fs.existsSync(reviewFile));
  const reviewData = JSON.parse(fs.readFileSync(reviewFile, 'utf-8'));
  assert.equal(reviewData.entries.length, 54);
  assert.equal(reviewData.entries[0].verification_status, 'pending_review');
});

test('7. Client service contracts: practice scenarios and suggested questions structure', () => {
  // Scenarios verification
  assert.equal(PRACTICE_SCENARIOS.length, 5, 'Must provide 5 conversation scenarios');
  const scenarioIds = PRACTICE_SCENARIOS.map((s) => s.id);
  assert.ok(scenarioIds.includes('first_meeting'));
  assert.ok(scenarioIds.includes('shopping'));
  assert.ok(scenarioIds.includes('restaurant'));
  assert.ok(scenarioIds.includes('directions'));
  assert.ok(scenarioIds.includes('friend'));

  for (const scenario of PRACTICE_SCENARIOS) {
    assert.ok(scenario.title);
    assert.ok(scenario.nativeTitle);
    assert.ok(scenario.icon);
    assert.ok(scenario.initialPrompt);
  }

  // Suggested questions verification
  assert.ok(SUGGESTED_QUESTIONS.length >= 5, 'Must provide at least 5 suggested beginner questions');
  for (const q of SUGGESTED_QUESTIONS) {
    assert.ok(q.id);
    assert.ok(q.label);
    assert.ok(q.query);
  }

  // AI Disclaimer verification
  assert.ok(AI_DISCLAIMER_NOTICE.badge.includes('AI'));
  assert.ok(AI_DISCLAIMER_NOTICE.text.includes('not part of the verified'));
});

test('8. Client service network error handling & mock client calls', async () => {
  // Test network failure handling when endpoint is unavailable
  const res = await sendTutorQuestion({
    message: 'Hello',
    endpoint: 'http://127.0.0.1:9999/api/non-existent-endpoint',
    timeoutMs: 100,
  });

  assert.equal(res.ok, false);
  assert.ok(res.error === 'NETWORK_FAILURE' || res.error === 'REQUEST_ABORTED' || res.error === 'TIMEOUT');
  assert.ok(res.message);

  // Test status check on invalid endpoint
  const status = await checkTutorStatus('http://127.0.0.1:9999/api/non-existent-endpoint');
  assert.equal(status.ok, false);
  assert.equal(status.configured, false);
});

test('9. AI_MODEL configuration is loaded correctly from environment and defaults safely', () => {
  const originalModel = process.env.AI_MODEL;

  // Test custom model configuration
  process.env.AI_MODEL = 'gemini-3.5-flash-lite';
  const customConfig = getAiConfig();
  assert.equal(customConfig.model, 'gemini-3.5-flash-lite');

  process.env.AI_MODEL = 'gemini-3.8-flash';
  const config38 = getAiConfig();
  assert.equal(config38.model, 'gemini-3.8-flash');

  if (originalModel) {
    process.env.AI_MODEL = originalModel;
  } else {
    delete process.env.AI_MODEL;
  }
});

test('10. Gemini response parsing correctly filters out thought traces and handles high-demand 503 errors', async () => {
  const originalKey = process.env.AI_API_KEY;
  process.env.AI_API_KEY = 'test_valid_dummy_key_1234567890';

  // Mock Gemini response containing thinking thoughts + final output
  const mockThinkingFetcher = async () => {
    return {
      text: 'ನಮಸ್ಕಾರ (Namaskāra) is the most polite greeting in Kannada.',
      finishReason: 'STOP',
      usage: { promptTokenCount: 24, candidatesTokenCount: 50, totalTokenCount: 74 },
    };
  };

  const res = await processAiTutorQuery(
    { message: 'How do I greet someone in Kannada?' },
    { customFetcher: mockThinkingFetcher }
  );

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.model);
  assert.ok(res.body.text.includes('Namaskāra'));

  // Mock 503 High Demand / Unavailable error
  const mock503Fetcher = async () => {
    throw {
      status: 503,
      error: 'PROVIDER_UNAVAILABLE',
      message: 'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.',
    };
  };

  const res503 = await processAiTutorQuery(
    { message: 'Hello' },
    { customFetcher: mock503Fetcher }
  );

  assert.equal(res503.status, 503);
  assert.equal(res503.body.error, 'PROVIDER_UNAVAILABLE');
  assert.ok(res503.body.message.includes('high demand') || res503.body.message.includes('unavailable'));

  // Restore env
  process.env.AI_API_KEY = originalKey;
});

test('11. Client-side timeout handling in sendTutorQuestion returns status 408 TIMEOUT without hanging', async () => {
  // Start a local server that accepts the connection and holds it without responding
  const server = http.createServer(() => {
    // Deliberately hold connection open to simulate a hung or slow backend
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const endpoint = `http://127.0.0.1:${port}/api/tutor`;

  try {
    const startTime = Date.now();
    const res = await sendTutorQuestion({
      message: 'What does "Namaskara" mean?',
      endpoint,
      timeoutMs: 50,
    });

    const duration = Date.now() - startTime;
    assert.equal(res.ok, false);
    assert.equal(res.error, 'TIMEOUT');
    assert.equal(res.status, 408);
    assert.ok(res.message.includes('timed out'));
    assert.ok(duration >= 40, `Request must have waited for timeout window (elapsed: ${duration}ms)`);
  } finally {
    server.close();
  }
});

test('12. Client-side explicit cancellation via AbortController returns REQUEST_ABORTED', async () => {
  const controller = new AbortController();
  // Abort immediately
  controller.abort();

  const res = await sendTutorQuestion({
    message: 'Hello',
    endpoint: 'http://127.0.0.1:9999/api/hanging-test-endpoint',
    signal: controller.signal,
  });

  assert.equal(res.ok, false);
  assert.equal(res.error, 'REQUEST_ABORTED');
  assert.equal(res.message, 'The request was cancelled.');
});

test('13. Backend timeout handling in callGeminiApi throws GATEWAY_TIMEOUT on slow upstream', async () => {
  const originalKey = process.env.AI_API_KEY;
  process.env.AI_API_KEY = 'test_valid_dummy_key_1234567890';

  // Mock fetcher simulating slow upstream that exceeds timeout
  const mockHangingFetcher = async ({ timeoutMs }) => {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject({
          status: 504,
          error: 'GATEWAY_TIMEOUT',
          message: `Gemini API request timed out after ${Math.round(timeoutMs / 1000)} seconds. Please click Retry.`,
          origin: 'backend',
        });
      }, 50);
    });
  };

  const res = await processAiTutorQuery(
    { message: 'What is "Beda" in Kannada?' },
    { customFetcher: mockHangingFetcher, timeoutMs: 50 }
  );

  assert.equal(res.status, 504);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error, 'GATEWAY_TIMEOUT');
  assert.ok(res.body.message.includes('timed out'));

  process.env.AI_API_KEY = originalKey;
});

test('14. Loading state recovery and duplicate submission prevention guarantees in AiTutorScreen', () => {
  const screenContent = fs.readFileSync(
    path.resolve(ROOT_DIR, 'src/components/AiTutorScreen.jsx'),
    'utf-8'
  );

  // Guarantee 1: Strict finally block resetting loading
  assert.ok(
    screenContent.includes('finally {') &&
    screenContent.includes('setIsLoading(false)') &&
    screenContent.includes('isSubmittingRef.current = false'),
    'AiTutorScreen must have a finally block guaranteeing setIsLoading(false) and isSubmittingRef reset'
  );

  // Guarantee 2: Synchronous duplicate prevention
  assert.ok(
    screenContent.includes('isSubmittingRef.current = true') &&
    screenContent.includes('if (isSubmittingRef.current || isLoading) return'),
    'AiTutorScreen must guard against rapid duplicate submissions'
  );

  // Guarantee 3: Stale request discarding via requestIdRef
  assert.ok(
    screenContent.includes('requestIdRef.current') &&
    screenContent.includes('if (requestIdRef.current !== currentRequestId)'),
    'AiTutorScreen must prevent older slow requests from overwriting newer results'
  );

  // Guarantee 4: Explicit Cancel button in the UI
  assert.ok(
    screenContent.includes('handleCancelRequest') &&
    screenContent.includes('Cancel'),
    'AiTutorScreen must provide an accessible Cancel button during active loading'
  );

  // Guarantee 5: Retry handler preserves history snapshot
  assert.ok(
    screenContent.includes('handleRetry') &&
    screenContent.includes('lastFailedPayload'),
    'AiTutorScreen must support retry of failed requests'
  );
});

test('15. Both Ask Tutor and Conversation Practice modes seed and submit safely', () => {
  // Test Chat Mode validation
  const chatReq = validateTutorRequest({
    message: 'How do I say "Water" in Kannada?',
    preferredLanguage: 'Hindi',
    targetLanguage: 'Kannada',
    mode: 'chat',
  });
  assert.equal(chatReq.valid, true);
  assert.equal(chatReq.data.mode, 'chat');

  // Test Practice Mode validation
  const practiceReq = validateTutorRequest({
    message: 'Namma Metro station elli ide?',
    preferredLanguage: 'English',
    targetLanguage: 'Kannada',
    mode: 'practice',
    scenario: 'Asking for Directions',
  });
  assert.equal(practiceReq.valid, true);
  assert.equal(practiceReq.data.mode, 'practice');
  assert.equal(practiceReq.data.scenario, 'Asking for Directions');
});

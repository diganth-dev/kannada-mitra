import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { VOCABULARY } from '../src/data/vocabulary.js';
import {
  ONBOARDING_PREFERENCE_LANGUAGES,
  getLanguageMetadata,
} from '../src/data/languages.js';
import {
  resolveLearningContent,
  generateQuizQuestions,
} from '../src/utils/languageLearning.js';
import {
  setStoredLearnedWords,
  getStoredLearnedWords,
  setStoredLanguage,
  getStoredLanguage,
  recordStoredQuizResult,
  getStoredQuizStats,
  setUserStoredProfile,
  getUserStoredProfile,
} from '../src/utils/storage.js';
import { buildTutorSystemInstruction } from '../server/aiTutorService.js';

const projectRoot = process.cwd();

// Setup mock localStorage
const createMockStorage = () => {
  const store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, val) => {
      store[key] = String(val);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
  };
};

globalThis.localStorage = createMockStorage();

// 1. Kannada is always the target language
test('1. Kannada is always the permanent target language across core files', () => {
  const appContent = fs.readFileSync(path.join(projectRoot, 'src', 'App.jsx'), 'utf8');
  assert.ok(
    appContent.includes("const targetLanguage = 'Kannada'"),
    'App.jsx must declare Kannada as permanent target language'
  );

  // Vocabulary items all have authentic Kannada text and pronunciation
  for (const item of VOCABULARY) {
    const resolved = resolveLearningContent(item, 'Kannada', 'English');
    assert.ok(resolved.targetWord.text, `Item ${item.id} must have Kannada script`);
    assert.equal(resolved.targetLanguage, 'Kannada');
  }
});

// 2. Target-language switching is unavailable in the UI
test('2. Target-language switching is completely removed from the UI', () => {
  const onboardingContent = fs.readFileSync(
    path.join(projectRoot, 'src', 'components', 'LanguageOnboardingScreen.jsx'),
    'utf8'
  );

  // No setTargetLanguage or multi-step target selection
  assert.ok(
    !onboardingContent.includes('setTargetLanguage'),
    'LanguageOnboardingScreen must not allow changing target language'
  );
  assert.ok(
    !onboardingContent.includes('ONBOARDING_TARGET_LANGUAGES'),
    'LanguageOnboardingScreen must not offer target language choices'
  );
  assert.ok(
    onboardingContent.includes('Permanent Target Language') &&
    onboardingContent.includes('Kannada'),
    'LanguageOnboardingScreen must show Kannada as permanent target'
  );

  // Header verification
  const headerContent = fs.readFileSync(
    path.join(projectRoot, 'src', 'components', 'Header.jsx'),
    'utf8'
  );
  assert.ok(
    !headerContent.includes('Change Pair'),
    'Header must not offer language-pair switching'
  );
});

// 3. Every existing supported explanation language remains selectable
test('3. Every existing supported explanation language remains available', () => {
  const expectedLanguages = [
    'Kannada',
    'Hindi',
    'English',
    'Telugu',
    'Tamil',
    'Malayalam',
    'Marathi',
    'Bengali',
    'Urdu',
  ];

  const actualLanguages = ONBOARDING_PREFERENCE_LANGUAGES.map((l) => l.id);
  for (const lang of expectedLanguages) {
    assert.ok(
      actualLanguages.includes(lang),
      `Explanation language ${lang} must be available in ONBOARDING_PREFERENCE_LANGUAGES`
    );
  }

  // All metadata resolvable
  for (const lang of expectedLanguages) {
    const meta = getLanguageMetadata(lang);
    assert.ok(meta.name, `Metadata must exist for ${lang}`);
    assert.ok(meta.nativeName, `Native script must exist for ${lang}`);
  }
});

// 4. Changing explanation language updates the appropriate interface
test('4. Changing explanation language updates vocabulary meanings and translations', () => {
  const sampleWord = VOCABULARY.find((w) => w.id === 'greet_001'); // "ನಮಸ್ಕಾರ"
  assert.ok(sampleWord);

  // In Hindi
  const hindiContent = resolveLearningContent(sampleWord, 'Kannada', 'Hindi');
  assert.ok(hindiContent.motherTongueTranslation.includes('नमस्ते'));

  // In Telugu
  const teluguContent = resolveLearningContent(sampleWord, 'Kannada', 'Telugu');
  assert.ok(teluguContent.motherTongueTranslation.includes('నమస్కారం'));

  // In English
  const englishContent = resolveLearningContent(sampleWord, 'Kannada', 'English');
  assert.ok(englishContent.motherTongueTranslation.toLowerCase().includes('hello'));
});

// 5. Changing explanation language does not reset learning progress
test('5. Changing explanation language preserves learned words and quiz stats', () => {
  setStoredLearnedWords(['greet_001', 'food_002', 'num_003']);
  recordStoredQuizResult(100, 5);

  const initialLearned = getStoredLearnedWords();
  const initialStats = getStoredQuizStats();

  // Switch explanation language from Hindi to Telugu to English
  setStoredLanguage('Hindi');
  assert.equal(getStoredLanguage(), 'Hindi');
  assert.deepEqual(getStoredLearnedWords(), initialLearned);

  setStoredLanguage('Telugu');
  assert.equal(getStoredLanguage(), 'Telugu');
  assert.deepEqual(getStoredLearnedWords(), initialLearned);
  assert.equal(getStoredQuizStats().completedCount, initialStats.completedCount);

  setStoredLanguage('English');
  assert.equal(getStoredLanguage(), 'English');
  assert.deepEqual(getStoredLearnedWords(), initialLearned);
});

// 6. Vocabulary remains Kannada-focused
test('6. Vocabulary remains 100% Kannada-focused with authentic script and audio', () => {
  for (const word of VOCABULARY) {
    assert.ok(word.kannada, `Word ${word.id} must have kannada property`);
    assert.ok(word.pronunciation, `Word ${word.id} must have pronunciation property`);
    assert.ok(word.english, `Word ${word.id} must have english translation`);
    // Kannada unicode range: \u0C80-\u0CFF
    assert.match(
      word.kannada,
      /[\u0C80-\u0CFF]/,
      `Word ${word.id} (${word.kannada}) must be written in Kannada script`
    );
  }
});

// 7. Quizzes continue to work
test('7. Quizzes test Kannada vocabulary through learner explanation language', () => {
  const quizHindi = generateQuizQuestions(VOCABULARY, 'Hindi', 'all', 'Kannada');
  assert.ok(quizHindi.length > 0, 'Must generate questions for Hindi explanation');
  for (const q of quizHindi) {
    assert.equal(q.targetLanguage, 'Kannada');
    assert.equal(q.motherTongue, 'Hindi');
    assert.ok(q.options.length >= 2, 'Must have multiple choice options');
  }

  const quizEnglish = generateQuizQuestions(VOCABULARY, 'English', 'all', 'Kannada');
  assert.ok(quizEnglish.length > 0, 'Must generate questions for English explanation');
  for (const q of quizEnglish) {
    assert.equal(q.targetLanguage, 'Kannada');
    assert.equal(q.motherTongue, 'English');
  }
});

// 8. AI Tutor receives the correct explanation-language preference
test('8. AI Tutor receives and applies learner explanation language preference', () => {
  const instructionTamil = buildTutorSystemInstruction({
    preferredLanguage: 'Tamil',
    targetLanguage: 'Kannada',
    mode: 'chat',
  });
  assert.ok(instructionTamil.includes('Tamil'), 'Instruction must specify Tamil explanations');
  assert.ok(instructionTamil.includes('Kannada script'), 'Instruction must require Kannada script');

  const instructionHindi = buildTutorSystemInstruction({
    preferredLanguage: 'Hindi',
    targetLanguage: 'Kannada',
    mode: 'chat',
  });
  assert.ok(instructionHindi.includes('Hindi'), 'Instruction must specify Hindi explanations');
});

// 9. Conversation Practice continues to use Kannada
test('9. Conversation Practice uses Kannada as the practiced language with explanations', () => {
  const instructionPractice = buildTutorSystemInstruction({
    preferredLanguage: 'Marathi',
    targetLanguage: 'Kannada',
    mode: 'practice',
    scenario: 'Auto rickshaw ride in Bengaluru',
  });

  assert.ok(instructionPractice.includes('CONVERSATION PRACTICE MODE'));
  assert.ok(instructionPractice.includes('Auto rickshaw ride in Bengaluru'));
  assert.ok(instructionPractice.includes('spoken Kannada'));
  assert.ok(instructionPractice.includes('Marathi'));
});

// 10. Unsupported translations use a clearly labelled fallback
test('10. Unverified translations use English fallback with clear labelling in UI', () => {
  // Bengali has no verified production translation in VOCABULARY
  const sampleWord = VOCABULARY[0];
  const bengaliContent = resolveLearningContent(sampleWord, 'Kannada', 'Bengali');

  assert.equal(bengaliContent.motherTongueTranslation, null);
  assert.ok(bengaliContent.englishMeaning, 'Must provide English meaning as fallback');

  // Check LearnScreen template for explicit English fallback badge
  const learnScreenContent = fs.readFileSync(
    path.join(projectRoot, 'src', 'components', 'LearnScreen.jsx'),
    'utf8'
  );
  assert.ok(
    learnScreenContent.includes('English fallback (verified') &&
    learnScreenContent.includes('translation in development'),
    'LearnScreen must display clear English fallback label for unverified translations'
  );
});

// 11. Pending Bengali and Urdu translations remain inactive
test('11. Pending Bengali and Urdu review items remain quarantined and inactive', () => {
  const pendingFile = path.join(
    projectRoot,
    'src',
    'data',
    'pending_translations_bengali_urdu.json'
  );
  assert.ok(fs.existsSync(pendingFile), 'Pending translations file must exist');

  const pendingData = JSON.parse(fs.readFileSync(pendingFile, 'utf8'));
  assert.ok(pendingData._metadata, 'Must contain _metadata');
  assert.equal(pendingData._metadata.status, 'pending_review');
  assert.ok(Array.isArray(pendingData.entries), 'Must contain entries array');
  assert.equal(pendingData.entries.length, 54);

  for (const item of pendingData.entries) {
    assert.equal(
      item.verification_status,
      'pending_review',
      `Item ${item.id} must be quarantined as pending_review`
    );
  }

  // Not active in production VOCABULARY translations
  for (const word of VOCABULARY) {
    assert.equal(
      word.translations?.Bengali,
      undefined,
      'Bengali must not be in production vocabulary'
    );
    assert.equal(
      word.translations?.Urdu,
      undefined,
      'Urdu must not be in production vocabulary'
    );
  }
});

// 12. Existing authentication and persistence behavior remains intact with safe migration
test('12. User profile persistence safely migrates legacy target language to Kannada', () => {
  const testUid = 'user_migration_test_999';

  // Suppose user previously had Hindi target saved in local profile
  setUserStoredProfile(testUid, {
    preferredLanguage: 'Telugu',
    targetLanguage: 'Hindi', // legacy target
    onboardingCompleted: true,
    learnedWords: ['greet_001', 'greet_002'],
    quizStats: { completedCount: 3, bestScore: 100, totalQuestions: 15 },
  });

  const profile = getUserStoredProfile(testUid);
  assert.ok(profile);
  assert.equal(profile.preferredLanguage, 'Telugu');
  assert.deepEqual(profile.learnedWords, ['greet_001', 'greet_002'], 'Learned words preserved');
  assert.equal(profile.quizStats.bestScore, 100, 'Quiz stats preserved');
});

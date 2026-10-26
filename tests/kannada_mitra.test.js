import test from 'node:test';
import assert from 'node:assert/strict';

import { VOCABULARY } from '../src/data/vocabulary.js';
import { SUPPORTED_LANGUAGES, CATEGORIES } from '../src/data/languages.js';
import {
  recordStoredQuizResult,
  getStoredQuizStats,
  setStoredLearnedWords,
  getStoredLearnedWords,
  setStoredLanguage,
  getStoredLanguage,
  getStoredCategory,
  setStoredCategory,
  clearAllProgress,
} from '../src/utils/storage.js';

// Setup isolated mock localStorage for testing
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

// Test 1: Vocabulary dataset completeness and integrity
test('1. Vocabulary dataset completeness and integrity', () => {
  assert.ok(VOCABULARY.length >= 40, `Dataset should have at least 40 words, found ${VOCABULARY.length}`);

  const languageIds = SUPPORTED_LANGUAGES.map((l) => l.id);
  const validCategoryIds = CATEGORIES.map((c) => c.id).filter((c) => c !== 'all');
  const seenIds = new Set();

  for (const item of VOCABULARY) {
    // Unique ID
    assert.ok(!seenIds.has(item.id), `Duplicate ID found: ${item.id}`);
    seenIds.add(item.id);

    // Required fields
    assert.ok(item.kannada && item.kannada.trim().length > 0, `Missing kannada script for ${item.id}`);
    assert.ok(item.pronunciation && item.pronunciation.trim().length > 0, `Missing pronunciation for ${item.id}`);
    assert.ok(item.english && item.english.trim().length > 0, `Missing english meaning for ${item.id}`);
    assert.ok(validCategoryIds.includes(item.category), `Invalid category "${item.category}" for ${item.id}`);

    // Check translations for every supported language
    assert.ok(item.translations, `Missing translations object for ${item.id}`);
    for (const lang of languageIds) {
      assert.ok(
        item.translations[lang] && item.translations[lang].trim().length > 0,
        `Missing ${lang} translation for ${item.id}`
      );
    }

    // Check examples if present
    if (item.example) {
      assert.ok(item.example.kannada, `Missing example kannada for ${item.id}`);
      assert.ok(item.example.english, `Missing example english for ${item.id}`);
    }
  }
});

// Test 2: Category distribution
test('2. Categories distribution across 8 foundation domains', () => {
  const expectedCategories = [
    'Greetings',
    'Everyday Words',
    'Numbers',
    'Food',
    'Travel',
    'Shopping',
    'Common Questions',
    'Useful Sentences',
  ];

  for (const cat of expectedCategories) {
    const itemsInCat = VOCABULARY.filter((w) => w.category === cat);
    assert.ok(
      itemsInCat.length >= 5,
      `Category "${cat}" should have at least 5 words, found ${itemsInCat.length}`
    );
  }
});

// Test 3: Supported languages configuration
test('3. Supported languages configuration and metadata', () => {
  assert.equal(SUPPORTED_LANGUAGES.length, 7);
  const langIds = SUPPORTED_LANGUAGES.map((l) => l.id);
  assert.deepEqual(langIds.sort(), ['English', 'Hindi', 'Malayalam', 'Marathi', 'Tamil', 'Telugu', 'Tulu'].sort());

  for (const lang of SUPPORTED_LANGUAGES) {
    assert.ok(lang.name && lang.name.length > 0);
    assert.ok(lang.nativeName && lang.nativeName.length > 0);
    assert.ok(lang.script && lang.script.length > 0);
    assert.ok(lang.relation && lang.relation.length > 0);
  }
});

// Helper question generation algorithm (same as QuizScreen.jsx)
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const generateTestQuestions = (vocabulary, motherTongue, categoryFilter) => {
  if (!Array.isArray(vocabulary) || vocabulary.length === 0) return [];
  const pool =
    categoryFilter === 'all'
      ? vocabulary
      : vocabulary.filter((w) => w.category === categoryFilter);

  const validPool = pool.length > 0 ? (pool.length >= 4 ? pool : vocabulary) : vocabulary;
  if (!validPool || validPool.length === 0) return [];

  const shuffledItems = shuffleArray(validPool);
  const targetQuestions = shuffledItems.slice(0, Math.min(5, shuffledItems.length));

  return targetQuestions.map((word, qIndex) => {
    const questionType = qIndex % 2 === 0 ? 'kannada_to_native' : 'native_to_kannada';
    const nativeMeaning = word.translations[motherTongue] || word.english;

    if (questionType === 'kannada_to_native') {
      const correctAnswer = nativeMeaning;
      const seen = new Set([correctAnswer]);
      const wrongAnswers = [];
      const candidateOthers = shuffleArray(vocabulary.filter((w) => w.id !== word.id));

      for (const other of candidateOthers) {
        const optionText = other.translations[motherTongue] || other.english;
        if (!seen.has(optionText)) {
          seen.add(optionText);
          wrongAnswers.push(optionText);
          if (wrongAnswers.length === 3) break;
        }
      }

      const options = shuffleArray([correctAnswer, ...wrongAnswers]);
      return { correctAnswer, options };
    } else {
      const correctAnswer = `${word.kannada} (${word.pronunciation})`;
      const seen = new Set([correctAnswer]);
      const wrongAnswers = [];
      const candidateOthers = shuffleArray(vocabulary.filter((w) => w.id !== word.id));

      for (const other of candidateOthers) {
        const optionText = `${other.kannada} (${other.pronunciation})`;
        if (!seen.has(optionText)) {
          seen.add(optionText);
          wrongAnswers.push(optionText);
          if (wrongAnswers.length === 3) break;
        }
      }

      const options = shuffleArray([correctAnswer, ...wrongAnswers]);
      return { correctAnswer, options };
    }
  });
};

// Test 4: Quiz Option Uniqueness and Accuracy across all languages
test('4. Quiz question options uniqueness and answer accuracy across all languages and categories', () => {
  for (const lang of SUPPORTED_LANGUAGES) {
    for (const cat of CATEGORIES) {
      const questions = generateTestQuestions(VOCABULARY, lang.id, cat.id);
      assert.ok(questions.length > 0, `Should generate questions for ${lang.id} in ${cat.id}`);

      for (const q of questions) {
        // Exactly 4 choices
        assert.equal(q.options.length, 4, `Question must have exactly 4 choices`);
        // Strictly unique options (no duplicates)
        const uniqueSet = new Set(q.options);
        assert.equal(uniqueSet.size, 4, `Question choices must be completely unique: ${JSON.stringify(q.options)}`);
        // Correct answer MUST be in choices
        assert.ok(q.options.includes(q.correctAnswer), `Options must contain correctAnswer`);
      }
    }
  }
});

// Test 5: Quiz Boundary Cases
test('5. Quiz boundary cases: small pool, single item, and empty dataset', () => {
  // Empty vocabulary
  const emptyRes = generateTestQuestions([], 'Telugu', 'all');
  assert.deepEqual(emptyRes, []);

  // 1 vocabulary item
  const singleItem = [VOCABULARY[0]];
  const singleRes = generateTestQuestions(singleItem, 'Telugu', 'all');
  assert.equal(singleRes.length, 1);
  assert.equal(singleRes[0].options.length, 1); // 1 option, no fake distractors
  assert.equal(singleRes[0].correctAnswer, singleRes[0].options[0]);

  // 2 vocabulary items
  const twoItems = [VOCABULARY[0], VOCABULARY[1]];
  const twoRes = generateTestQuestions(twoItems, 'Telugu', 'all');
  assert.equal(twoRes.length, 2);
  for (const q of twoRes) {
    assert.equal(q.options.length, 2);
    assert.ok(q.options.includes(q.correctAnswer));
    assert.equal(new Set(q.options).size, 2); // 2 distinct options
  }
});

// Test 6: Storage Persistence, Corruption Recovery, and Deduplication
test('6. Storage persistence, safe validation, and corruption recovery', () => {
  // 1. Language persistence & corruption recovery
  setStoredLanguage('Telugu');
  assert.equal(getStoredLanguage(), 'Telugu');

  // Attempt to set invalid/corrupted language
  setStoredLanguage('Spanish');
  assert.equal(getStoredLanguage(), 'Telugu'); // Remains valid Telugu

  // Simulate corrupted string in raw localStorage
  localStorage.setItem('kannada_mitra_selected_language', 'French');
  assert.equal(getStoredLanguage(), null); // Safely returns null fallback

  // 2. Category persistence & corruption recovery
  setStoredCategory('Food');
  assert.equal(getStoredCategory(), 'Food');
  setStoredCategory('InvalidCategory');
  assert.equal(getStoredCategory(), 'Food'); // Remains valid Food

  localStorage.setItem('kannada_mitra_active_category', 'CorruptedCategory');
  assert.equal(getStoredCategory(), 'all'); // Safely returns 'all' fallback

  // 3. Learned words deduplication and corruption handling
  setStoredLearnedWords(['greet_001', 'greet_001', 'food_002', '']);
  const words = getStoredLearnedWords();
  assert.deepEqual(words, ['greet_001', 'food_002']); // Deduplicated, empty filtered

  localStorage.setItem('kannada_mitra_learned_words', '{"not": "an array"}');
  assert.deepEqual(getStoredLearnedWords(), []); // Non-array returns []

  localStorage.setItem('kannada_mitra_learned_words', 'invalid json');
  assert.deepEqual(getStoredLearnedWords(), []); // Malformed returns []

  // 4. Quiz stats calculations and corruption recovery
  localStorage.setItem('kannada_mitra_quiz_stats', JSON.stringify({ completedCount: 2, bestScore: 60, totalQuestions: 10 }));
  const stats = getStoredQuizStats();
  assert.equal(stats.completedCount, 2);
  assert.equal(stats.bestScore, 60);

  const res1 = recordStoredQuizResult(40, 5);
  assert.equal(res1.completedCount, 3);
  assert.equal(res1.bestScore, 60); // Best score stays 60

  const res2 = recordStoredQuizResult(100, 5);
  assert.equal(res2.completedCount, 4);
  assert.equal(res2.bestScore, 100); // Best score updates to 100

  // Corrupted quiz stats
  localStorage.setItem('kannada_mitra_quiz_stats', 'null');
  const safeNullStats = getStoredQuizStats();
  assert.deepEqual(safeNullStats, { completedCount: 0, bestScore: 0, totalQuestions: 0 });

  // 5. Clear progress preserves language
  setStoredLanguage('Tamil');
  setStoredLearnedWords(['greet_001']);
  recordStoredQuizResult(80, 5);

  clearAllProgress();

  assert.equal(getStoredLanguage(), 'Tamil'); // Preserved!
  assert.deepEqual(getStoredLearnedWords(), []); // Cleared!
  assert.deepEqual(getStoredQuizStats(), { completedCount: 0, bestScore: 0, totalQuestions: 0 }); // Cleared!
});

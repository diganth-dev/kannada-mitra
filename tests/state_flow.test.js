import test from 'node:test';
import assert from 'node:assert/strict';

import { VOCABULARY } from '../src/data/vocabulary.js';
import {
  setStoredLanguage,
  getStoredLanguage,
  setStoredCategory,
  getStoredCategory,
  setStoredLearnedWords,
  getStoredLearnedWords,
  recordStoredQuizResult,
  getStoredQuizStats,
  clearAllProgress,
} from '../src/utils/storage.js';

test('End-to-End User Journey State Machine Simulation', () => {
  // Mock localStorage store
  const store = {};
  globalThis.localStorage = {
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

  // Step 1: Open website fresh (no language set)
  assert.equal(getStoredLanguage(), null);
  let activeScreen = getStoredLanguage() ? 'learn' : 'welcome';
  assert.equal(activeScreen, 'welcome');

  // Step 2: Select Telugu as Mother Tongue
  const chosenLang = 'Telugu';
  setStoredLanguage(chosenLang);
  assert.equal(getStoredLanguage(), 'Telugu');
  activeScreen = 'learn';
  assert.equal(activeScreen, 'learn');

  // Step 3: Open learning dashboard & verify translation
  const foodWord = VOCABULARY.find((w) => w.category === 'Food');
  assert.ok(foodWord);
  assert.equal(foodWord.translations[chosenLang], 'భోజనం (Bhōjanam)');

  // Step 4: Change category to 'Food'
  setStoredCategory('Food');
  assert.equal(getStoredCategory(), 'Food');
  const foodWords = VOCABULARY.filter((w) => w.category === 'Food');
  assert.ok(foodWords.length >= 5);

  // Step 5: Mark word as learned
  let learned = getStoredLearnedWords();
  assert.deepEqual(learned, []);
  learned = [...learned, foodWord.id];
  setStoredLearnedWords(learned);
  assert.deepEqual(getStoredLearnedWords(), [foodWord.id]);

  // Step 6: Start Quiz and record completion
  const score = 80;
  const questionsAnswered = 5;
  const quizResult = recordStoredQuizResult(score, questionsAnswered);
  assert.equal(quizResult.completedCount, 1);
  assert.equal(quizResult.bestScore, 80);
  assert.equal(quizResult.totalQuestions, 5);

  // Step 7: Open Progress and verify
  activeScreen = 'progress';
  assert.equal(activeScreen, 'progress');
  const progressLearned = getStoredLearnedWords();
  const progressStats = getStoredQuizStats();
  assert.equal(progressLearned.length, 1);
  assert.equal(progressStats.completedCount, 1);
  assert.equal(progressStats.bestScore, 80);

  // Step 8: Simulate Page Refresh
  const restoredLang = getStoredLanguage();
  const restoredCategory = getStoredCategory();
  const restoredLearned = getStoredLearnedWords();
  const restoredStats = getStoredQuizStats();

  assert.equal(restoredLang, 'Telugu');
  assert.equal(restoredCategory, 'Food');
  assert.deepEqual(restoredLearned, [foodWord.id]);
  assert.equal(restoredStats.completedCount, 1);
  assert.equal(restoredStats.bestScore, 80);

  // Step 9: Change Language to Tamil
  const newLang = 'Tamil';
  setStoredLanguage(newLang);
  assert.equal(getStoredLanguage(), 'Tamil');
  assert.equal(foodWord.translations[newLang], 'சாப்பாடு (Sāppāḍu)');

  // Step 10: Reset Progress flow
  clearAllProgress();
  assert.equal(getStoredLanguage(), 'Tamil', 'Language must be preserved upon progress reset');
  assert.deepEqual(getStoredLearnedWords(), [], 'Learned words must be cleared');
  assert.deepEqual(getStoredQuizStats(), { completedCount: 0, bestScore: 0, totalQuestions: 0 }, 'Stats must be reset');
});

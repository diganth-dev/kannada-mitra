import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { VOCABULARY } from '../src/data/vocabulary.js';
import { CATEGORIES } from '../src/data/languages.js';
import { isLanguageContentComplete, resolveLearningContent, generateQuizQuestions } from '../src/utils/languageLearning.js';

const original54Path = path.resolve('src/data/vocab/original_54.json');
const original54Grouped = JSON.parse(fs.readFileSync(original54Path, 'utf8'));
const original54 = Object.values(original54Grouped).flat();

test('1. Vocabulary expansion count and uniqueness (exactly 750 unique entries)', () => {
  assert.ok(VOCABULARY.length >= 750, `Expected at least 750 vocabulary items, got ${VOCABULARY.length}`);
  assert.equal(VOCABULARY.length, 750, `Target dataset size is exactly 750, got ${VOCABULARY.length}`);

  const idSet = new Set();
  for (const item of VOCABULARY) {
    assert.ok(item.id, `Item must have an id: ${JSON.stringify(item)}`);
    assert.ok(!idSet.has(item.id), `Duplicate ID found: ${item.id}`);
    idSet.add(item.id);

    // Basic structure check
    assert.ok(item.kannada && item.kannada.trim().length > 0, `Item ${item.id} missing kannada`);
    assert.ok(item.pronunciation && item.pronunciation.trim().length > 0, `Item ${item.id} missing pronunciation`);
    assert.ok(item.english && item.english.trim().length > 0, `Item ${item.id} missing english`);
    assert.ok(item.category && item.category.trim().length > 0, `Item ${item.id} missing category`);
    assert.ok(item.example?.kannada, `Item ${item.id} missing example kannada`);
    assert.ok(item.example?.pronunciation, `Item ${item.id} missing example pronunciation`);
    assert.ok(item.example?.english, `Item ${item.id} missing example english`);
  }
});

test('2. Complete preservation of original 54 vocabulary items and IDs', () => {
  assert.equal(original54.length, 54, 'Original dataset should have exactly 54 items');

  for (const orig of original54) {
    const found = VOCABULARY.find((item) => item.id === orig.id);
    assert.ok(found, `Original word ID ${orig.id} not found in expanded VOCABULARY`);
    assert.equal(found.kannada, orig.kannada, `Kannada word mismatch for ${orig.id}`);
    assert.equal(found.english, orig.english, `English meaning mismatch for ${orig.id}`);
    assert.equal(found.category, orig.category, `Category mismatch for ${orig.id}`);
    assert.equal(found.example.kannada, orig.example.kannada, `Example kannada mismatch for ${orig.id}`);
  }
});

test('3. Distribution across 15 categories with exactly 50 items each', () => {
  const categoryIds = CATEGORIES.map((c) => c.id).filter((id) => id !== 'all');
  assert.equal(categoryIds.length, 15, `Expected 15 categories in CATEGORIES, found ${categoryIds.length}`);

  const counts = {};
  for (const item of VOCABULARY) {
    counts[item.category] = (counts[item.category] || 0) + 1;
  }

  for (const cat of categoryIds) {
    const count = counts[cat] || 0;
    assert.equal(
      count,
      50,
      `Category "${cat}" must have exactly 50 vocabulary items, found ${count}`
    );
  }
});

test('4. Complete multilingual translations in 7 verified languages for all 750 items', () => {
  const verifiedCore = ['Kannada', 'Hindi', 'English', 'Telugu', 'Tamil', 'Malayalam', 'Marathi'];

  for (const lang of verifiedCore) {
    for (const item of VOCABULARY) {
      const isComplete = isLanguageContentComplete(item, lang);
      assert.ok(
        isComplete,
        `Item ${item.id} in category "${item.category}" is incomplete for verified language "${lang}"`
      );

      const resolved = resolveLearningContent(item, 'Kannada', lang);
      assert.equal(
        resolved.hasMissingData,
        false,
        `Item ${item.id} has missing data when explained in "${lang}": ${resolved.missingFields?.join(', ')}`
      );
    }
  }
});

test('5. Bengali and Urdu content isolation from active production vocabulary', () => {
  for (const item of VOCABULARY) {
    assert.equal(
      item.translations?.Bengali,
      undefined,
      `Item ${item.id} has unverified Bengali translation in active vocabulary`
    );
    assert.equal(
      item.translations?.Urdu,
      undefined,
      `Item ${item.id} has unverified Urdu translation in active vocabulary`
    );
    assert.equal(
      item.example?.translations?.Bengali,
      undefined,
      `Item ${item.id} has unverified Bengali example translation in active vocabulary`
    );
    assert.equal(
      item.example?.translations?.Urdu,
      undefined,
      `Item ${item.id} has unverified Urdu example translation in active vocabulary`
    );
  }

  // Pending review file remains intact
  const reviewFile = path.resolve('src/data/pending_translations_bengali_urdu.json');
  assert.ok(fs.existsSync(reviewFile), 'pending_translations_bengali_urdu.json must exist');
  const reviewData = JSON.parse(fs.readFileSync(reviewFile, 'utf8'));
  assert.equal(reviewData.entries.length, 54, 'Review file retains 54 pending entries');
});

test('6. Quiz generation across all 15 categories with learner explanation languages', () => {
  const categoryIds = CATEGORIES.map((c) => c.id).filter((id) => id !== 'all');
  const testLanguages = ['English', 'Hindi', 'Telugu', 'Tamil'];

  for (const cat of categoryIds) {
    for (const lang of testLanguages) {
      const questions = generateQuizQuestions(VOCABULARY, lang, cat, 'Kannada');
      assert.ok(
        questions.length > 0,
        `Quiz generator should generate questions for category "${cat}" in "${lang}"`
      );

      for (const q of questions) {
        assert.ok(q.prompt, 'Prompt text must be defined');
        assert.equal(q.options.length, 4, 'Quiz questions must have exactly 4 options');
        assert.ok(q.options.includes(q.correctAnswer), 'Options must include correct answer');
      }
    }
  }
});

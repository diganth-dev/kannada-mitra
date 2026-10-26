import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { VOCABULARY } from '../src/data/vocabulary.js';
import {
  ONBOARDING_PREFERENCE_LANGUAGES,
  ONBOARDING_TARGET_LANGUAGES,
  VERIFIED_DATASET_LANGUAGES,
  isLanguagePairSupported,
} from '../src/data/languages.js';
import {
  parseLanguageWord,
  resolveLearningContent,
  generateQuizQuestions,
  isLanguageContentComplete,
} from '../src/utils/languageLearning.js';

// ==========================================
// BENGALI & URDU CONTENT INVESTIGATION TEST SUITE
// ==========================================

test('1. Exact inventory of missing vocabulary and example fields for Bengali and Urdu', () => {
  assert.ok(VOCABULARY.length >= 300, `Total vocabulary pool must be at least 300 items, found ${VOCABULARY.length}`);

  // Verify that neither Bengali nor Urdu are in the verified dataset list
  assert.equal(VERIFIED_DATASET_LANGUAGES.includes('Bengali'), false);
  assert.equal(VERIFIED_DATASET_LANGUAGES.includes('Urdu'), false);

  // Verify that parseLanguageWord returns isMissing: true for all items
  for (const item of VOCABULARY) {
    assert.equal(parseLanguageWord(item, 'Bengali').isMissing, true);
    assert.equal(parseLanguageWord(item, 'Urdu').isMissing, true);
  }

  const missingReport = {
    bengaliTranslations: 0,
    bengaliExamples: 0,
    urduTranslations: 0,
    urduExamples: 0,
  };

  for (const item of VOCABULARY) {
    if (!item.translations?.Bengali || !item.translations.Bengali.trim()) {
      missingReport.bengaliTranslations++;
    }
    if (!item.example?.translations?.Bengali || !item.example.translations.Bengali.trim()) {
      missingReport.bengaliExamples++;
    }
    if (!item.translations?.Urdu || !item.translations.Urdu.trim()) {
      missingReport.urduTranslations++;
    }
    if (!item.example?.translations?.Urdu || !item.example.translations.Urdu.trim()) {
      missingReport.urduExamples++;
    }
  }

  // All items lack Bengali & Urdu vocabulary translations and examples in active VOCABULARY
  assert.equal(missingReport.bengaliTranslations, VOCABULARY.length, 'All items lack Bengali vocabulary translations');
  assert.equal(missingReport.bengaliExamples, VOCABULARY.length, 'All items lack Bengali example sentences');
  assert.equal(missingReport.urduTranslations, VOCABULARY.length, 'All items lack Urdu vocabulary translations');
  assert.equal(missingReport.urduExamples, VOCABULARY.length, 'All items lack Urdu example sentences');

  const totalMissingFields =
    missingReport.bengaliTranslations +
    missingReport.bengaliExamples +
    missingReport.urduTranslations +
    missingReport.urduExamples;
  assert.equal(totalMissingFields, VOCABULARY.length * 4, 'Total missing data fields across Bengali and Urdu must be exactly 4x VOCABULARY length');
});

test('2. isLanguageContentComplete validation across all supported and unsupported languages', () => {
  const verifiedLanguages = ['Kannada', 'Hindi', 'English', 'Telugu', 'Tamil', 'Malayalam', 'Marathi'];

  for (const lang of verifiedLanguages) {
    for (const item of VOCABULARY) {
      assert.equal(
        isLanguageContentComplete(item, lang),
        true,
        `Item ${item.id} must be 100% complete for verified language ${lang}`
      );
    }
  }

  // Bengali and Urdu must consistently report incomplete (false) for all 54 items
  for (const item of VOCABULARY) {
    assert.equal(
      isLanguageContentComplete(item, 'Bengali'),
      false,
      `Item ${item.id} must return false for Bengali content completeness`
    );
    assert.equal(
      isLanguageContentComplete(item, 'Urdu'),
      false,
      `Item ${item.id} must return false for Urdu content completeness`
    );
  }
});

test('3. Non-fabrication guarantee: missing content returns null, never mock strings', () => {
  for (const item of VOCABULARY) {
    // Bengali as Target Language
    const bengaliTarget = resolveLearningContent(item, 'Bengali', 'Kannada');
    assert.equal(bengaliTarget.hasMissingData, true);
    assert.ok(bengaliTarget.missingFields.includes('targetWord'));
    assert.equal(bengaliTarget.targetWord.text, null, 'Must never invent Bengali target word text');
    assert.equal(bengaliTarget.targetWord.isMissing, true);
    assert.equal(bengaliTarget.example.targetExample, null, 'Must never invent Bengali example');

    // Urdu as Mother Tongue
    const urduMotherTongue = resolveLearningContent(item, 'Kannada', 'Urdu');
    assert.equal(urduMotherTongue.hasMissingData, true);
    assert.ok(urduMotherTongue.missingFields.includes('motherTongueTranslation'));
    assert.equal(urduMotherTongue.motherTongueTranslation, null, 'Must never invent Urdu translation');
    assert.equal(urduMotherTongue.example.motherTongueExample, null, 'Must never invent Urdu example');

    // Bengali as Mother Tongue
    const bengaliMotherTongue = resolveLearningContent(item, 'Kannada', 'Bengali');
    assert.equal(bengaliMotherTongue.hasMissingData, true);
    assert.ok(bengaliMotherTongue.missingFields.includes('motherTongueTranslation'));
    assert.equal(bengaliMotherTongue.motherTongueTranslation, null, 'Must never invent Bengali translation');

    // Bengali through Urdu
    const bengaliUrdu = resolveLearningContent(item, 'Bengali', 'Urdu');
    assert.equal(bengaliUrdu.hasMissingData, true);
    assert.ok(bengaliUrdu.missingFields.includes('targetWord'));
    assert.ok(bengaliUrdu.missingFields.includes('motherTongueTranslation'));
  }
});

test('4. Quiz generator non-fabrication: zero quiz questions generated for incomplete content', () => {
  // Bengali target through any mother tongue
  const bengaliTargetQuestions = generateQuizQuestions(VOCABULARY, 'Kannada', 'all', 'Bengali');
  assert.deepEqual(
    bengaliTargetQuestions,
    [],
    'Quiz generator must return empty list for Bengali target to avoid fabricated questions'
  );

  // Any target through Bengali mother tongue
  const bengaliNativeQuestions = generateQuizQuestions(VOCABULARY, 'Bengali', 'all', 'Kannada');
  assert.deepEqual(
    bengaliNativeQuestions,
    [],
    'Quiz generator must return empty list for Bengali mother tongue to avoid fabricated answers'
  );

  // Any target through Urdu mother tongue
  const urduNativeQuestions = generateQuizQuestions(VOCABULARY, 'Urdu', 'all', 'Hindi');
  assert.deepEqual(
    urduNativeQuestions,
    [],
    'Quiz generator must return empty list for Urdu mother tongue to avoid fabricated answers'
  );
});

test('5. Language-pair coverage matrix integrity (42 verified vs 22 in-development)', () => {
  const motherTongueIds = ONBOARDING_PREFERENCE_LANGUAGES.map((l) => l.id);
  const targetLanguageIds = ONBOARDING_TARGET_LANGUAGES.map((l) => l.id);

  const coverageMatrix = {
    verifiedComplete: [],
    lacksContent: [],
  };

  for (const t of targetLanguageIds) {
    for (const m of motherTongueIds) {
      if (t === m) continue;
      const isSupported = isLanguagePairSupported(t, m);
      const pairName = `${t} through ${m}`;
      if (isSupported) {
        coverageMatrix.verifiedComplete.push(pairName);
      } else {
        coverageMatrix.lacksContent.push(pairName);
      }
    }
  }

  assert.equal(coverageMatrix.verifiedComplete.length, 42, 'Must have exactly 42 verified complete pairs');
  assert.equal(coverageMatrix.lacksContent.length, 22, 'Must have exactly 22 pairs lacking content');

  // Verify that all 22 lacking content pairs involve Bengali or Urdu
  for (const pair of coverageMatrix.lacksContent) {
    assert.ok(
      pair.includes('Bengali') || pair.includes('Urdu'),
      `Incomplete pair "${pair}" must involve Bengali or Urdu`
    );
  }
});

test('6. Ingestion schema validation rule specification for Bengali and Urdu', () => {
  // Sample schema test: checks that any proposed verified entry meets standard format
  const validateProposedEntry = (entry, lang) => {
    if (!entry || typeof entry.translation !== 'string' || typeof entry.example !== 'string') {
      return { valid: false, reason: 'Missing translation or example string' };
    }

    // Must match format: "NativeScript (RomanizedPronunciation)"
    const match = entry.translation.match(/^(.*?)\s*\((.*?)\)$/);
    if (!match || !match[1].trim() || !match[2].trim()) {
      return { valid: false, reason: 'Translation must follow "NativeScript (Pronunciation)" format' };
    }

    const scriptText = match[1].trim();
    if (lang === 'Bengali') {
      // Must contain Bengali Unicode range \u0980-\u09FF
      if (!/[\u0980-\u09FF]/.test(scriptText)) {
        return { valid: false, reason: 'Bengali script must contain Bengali Unicode characters' };
      }
      if (!/[\u0980-\u09FF]/.test(entry.example)) {
        return { valid: false, reason: 'Bengali example must contain Bengali Unicode characters' };
      }
    } else if (lang === 'Urdu') {
      // Must contain Arabic/Urdu Unicode range \u0600-\u06FF
      if (!/[\u0600-\u06FF]/.test(scriptText)) {
        return { valid: false, reason: 'Urdu script must contain Urdu/Perso-Arabic Unicode characters' };
      }
      if (!/[\u0600-\u06FF]/.test(entry.example)) {
        return { valid: false, reason: 'Urdu example must contain Urdu/Perso-Arabic Unicode characters' };
      }
    }

    return { valid: true };
  };

  // Test with authentic Bengali entry
  const validBengali = {
    translation: 'নমস্কার (Nomoshkar)',
    example: 'সবাইকে নমস্কার।',
  };
  assert.equal(validateProposedEntry(validBengali, 'Bengali').valid, true);

  // Test with authentic Urdu entry
  const validUrdu = {
    translation: 'شکریہ (Shukriya)',
    example: 'آپ کی مدد کا شکریہ۔',
  };
  assert.equal(validateProposedEntry(validUrdu, 'Urdu').valid, true);

  // Reject malformed entry without pronunciation
  const missingPronunciation = {
    translation: 'নমস্কার',
    example: 'সবাইকে নমস্কার।',
  };
  assert.equal(validateProposedEntry(missingPronunciation, 'Bengali').valid, false);

  // Reject wrong script
  const wrongScript = {
    translation: 'Namaste (Namaste)',
    example: 'Namaste sabko.',
  };
  assert.equal(validateProposedEntry(wrongScript, 'Bengali').valid, false);
});

test('7. Structured review file pending_translations_bengali_urdu.json integrity and schema verification', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const reviewFilePath = path.resolve(__dirname, '../src/data/pending_translations_bengali_urdu.json');

  assert.ok(fs.existsSync(reviewFilePath), 'Review file pending_translations_bengali_urdu.json must exist');

  const raw = fs.readFileSync(reviewFilePath, 'utf-8');
  const parsed = JSON.parse(raw);

  // Metadata checks
  assert.ok(parsed._metadata, 'Must contain _metadata object');
  assert.equal(parsed._metadata.status, 'pending_review');
  assert.equal(parsed._metadata.totalEntries, 54);
  assert.ok(Array.isArray(parsed.entries), 'Must contain entries array');
  assert.equal(parsed.entries.length, 54, 'Must have exactly 54 entries corresponding to VOCABULARY');

  // Verify all 54 entries conform to required review schema
  const vocabularyIds = VOCABULARY.map((v) => v.id);

  for (const entry of parsed.entries) {
    assert.ok(vocabularyIds.includes(entry.id), `Entry ID ${entry.id} must match active vocabulary ID`);
    assert.ok(entry.category, `Entry ${entry.id} must include category`);
    assert.ok(entry.english, `Entry ${entry.id} must include english meaning`);
    assert.ok(entry.kannada, `Entry ${entry.id} must include kannada word`);
    assert.ok(entry.kannada_example, `Entry ${entry.id} must include kannada example`);

    // Separate review fields for Bengali
    assert.ok(entry.bengali, `Entry ${entry.id} must include bengali object`);
    assert.ok(typeof entry.bengali.vocabulary_translation === 'string' && entry.bengali.vocabulary_translation.length > 0);
    assert.ok(typeof entry.bengali.romanization === 'string' && entry.bengali.romanization.length > 0);
    assert.ok(typeof entry.bengali.example_sentence === 'string' && entry.bengali.example_sentence.length > 0);
    assert.ok(typeof entry.bengali.example_romanization === 'string' && entry.bengali.example_romanization.length > 0);

    // Separate review fields for Urdu
    assert.ok(entry.urdu, `Entry ${entry.id} must include urdu object`);
    assert.ok(typeof entry.urdu.vocabulary_translation === 'string' && entry.urdu.vocabulary_translation.length > 0);
    assert.ok(typeof entry.urdu.romanization === 'string' && entry.urdu.romanization.length > 0);
    assert.ok(typeof entry.urdu.example_sentence === 'string' && entry.urdu.example_sentence.length > 0);
    assert.ok(typeof entry.urdu.example_romanization === 'string' && entry.urdu.example_romanization.length > 0);

    // Review status and notes
    assert.equal(entry.verification_status, 'pending_review', `Entry ${entry.id} must be marked pending_review`);
    assert.ok(typeof entry.reviewer_notes === 'string' && entry.reviewer_notes.length > 0);
  }
});

test('8. Strict data isolation: pending translations cannot enter active vocabulary or quizzes', () => {
  // 1. Verify active VOCABULARY dataset has zero Bengali or Urdu translations
  for (const item of VOCABULARY) {
    assert.equal(item.translations?.Bengali, undefined, `Item ${item.id} must not have active Bengali translation`);
    assert.equal(item.translations?.Urdu, undefined, `Item ${item.id} must not have active Urdu translation`);
    assert.equal(item.example?.translations?.Bengali, undefined, `Item ${item.id} must not have active Bengali example`);
    assert.equal(item.example?.translations?.Urdu, undefined, `Item ${item.id} must not have active Urdu example`);
  }

  // 2. Verify isLanguagePairSupported strictly returns false for all pairs involving Bengali or Urdu
  const allMotherTongues = ONBOARDING_PREFERENCE_LANGUAGES.map((l) => l.id);
  const allTargets = ONBOARDING_TARGET_LANGUAGES.map((l) => l.id);

  for (const t of allTargets) {
    for (const m of allMotherTongues) {
      if (t === 'Bengali' || m === 'Bengali' || m === 'Urdu') {
        assert.equal(
          isLanguagePairSupported(t, m),
          false,
          `Pair (${t}, ${m}) must remain unsupported until verified and ingested`
        );
      }
    }
  }

  // 3. Verify active quiz generation produces zero questions for Bengali or Urdu
  assert.deepEqual(generateQuizQuestions(VOCABULARY, 'Bengali', 'all', 'Kannada'), []);
  assert.deepEqual(generateQuizQuestions(VOCABULARY, 'Urdu', 'all', 'Kannada'), []);
  assert.deepEqual(generateQuizQuestions(VOCABULARY, 'Kannada', 'all', 'Bengali'), []);
});

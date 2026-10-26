import test from 'node:test';
import assert from 'node:assert/strict';

import { VOCABULARY } from '../src/data/vocabulary.js';
import {
  ONBOARDING_PREFERENCE_LANGUAGES,
  ONBOARDING_TARGET_LANGUAGES,
  VERIFIED_DATASET_LANGUAGES,
  isLanguagePairSupported,
  getSupportedAlternatives,
  getLanguageMetadata,
} from '../src/data/languages.js';
import {
  parseLanguageWord,
  resolveLearningContent,
  generateQuizQuestions,
} from '../src/utils/languageLearning.js';
import { speakTargetLanguage } from '../src/utils/speech.js';

// Setup mock window/speechSynthesis for headless node testing
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    speechSynthesis: {
      getVoices: () => [
        { name: 'Kannada Female', lang: 'kn-IN' },
        { name: 'Hindi Male', lang: 'hi-IN' },
        { name: 'Telugu Female', lang: 'te-IN' },
        { name: 'Tamil Female', lang: 'ta-IN' },
        { name: 'Malayalam Male', lang: 'ml-IN' },
        { name: 'Marathi Female', lang: 'mr-IN' },
        { name: 'English India', lang: 'en-IN' },
      ],
      cancel: () => {},
      speak: (u) => {
        if (u && typeof u.onend === 'function') u.onend();
      },
    },
  };
  globalThis.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
      this.rate = 1.0;
      this.pitch = 1.0;
      this.lang = '';
      this.voice = null;
      this.onend = null;
      this.onerror = null;
    }
  };
  globalThis.window.SpeechSynthesisUtterance = globalThis.SpeechSynthesisUtterance;
}

// ==========================================
// COMPREHENSIVE LANGUAGE-PAIR AUDIT TEST SUITE
// ==========================================

test('1. Onboarding selector options audit and counts', () => {
  const motherTongueIds = ONBOARDING_PREFERENCE_LANGUAGES.map((l) => l.id);
  const targetLanguageIds = ONBOARDING_TARGET_LANGUAGES.map((l) => l.id);

  // Selector 1: 9 Spoken / Mother Tongue languages
  assert.equal(motherTongueIds.length, 9, 'Must offer 9 mother tongue options');
  assert.deepEqual(
    motherTongueIds.sort(),
    ['Bengali', 'English', 'Hindi', 'Kannada', 'Malayalam', 'Marathi', 'Tamil', 'Telugu', 'Urdu'].sort()
  );

  // Selector 2: 8 Target Learning languages
  assert.equal(targetLanguageIds.length, 8, 'Must offer 8 target learning languages');
  assert.deepEqual(
    targetLanguageIds.sort(),
    ['Bengali', 'English', 'Hindi', 'Kannada', 'Malayalam', 'Marathi', 'Tamil', 'Telugu'].sort()
  );

  // Metadata verification
  assert.equal(getLanguageMetadata('Telugu').name, 'Telugu');
  assert.equal(getLanguageMetadata('Kannada').nativeName, 'ಕನ್ನಡ');

  // Alternative recommendations verification
  const alternatives = getSupportedAlternatives('Telugu');
  assert.ok(alternatives.includes('Kannada'));
  assert.ok(alternatives.includes('Hindi'));
  assert.equal(alternatives.includes('Telugu'), false);

  // Parsing verification
  const parsed = parseLanguageWord(VOCABULARY[0], 'Telugu');
  assert.equal(parsed.isMissing, false);
  assert.ok(parsed.text.length > 0);
  const missingParsed = parseLanguageWord(VOCABULARY[0], 'Bengali');
  assert.equal(missingParsed.isMissing, true);

  // Total possible cross pairs where target !== motherTongue:
  // 1 target (Kannada) * 8 mother tongues + 7 other targets * 8 other mother tongues = 64
  let totalValidCombinations = 0;
  for (const t of targetLanguageIds) {
    for (const m of motherTongueIds) {
      if (t !== m) totalValidCombinations++;
    }
  }
  assert.equal(totalValidCombinations, 64, 'Exactly 64 cross-language pairs are selectable');
});

test('2. Exhaustive language-pair support classification (42 verified vs 22 lacking content)', () => {
  const motherTongueIds = ONBOARDING_PREFERENCE_LANGUAGES.map((l) => l.id);
  const targetLanguageIds = ONBOARDING_TARGET_LANGUAGES.map((l) => l.id);

  let verifiedCount = 0;
  let lackingContentCount = 0;

  for (const t of targetLanguageIds) {
    for (const m of motherTongueIds) {
      if (t === m) {
        // Disallow learning identical language
        assert.equal(isLanguagePairSupported(t, m), false, `Same-language pair (${t}, ${m}) must not be supported`);
        continue;
      }

      const supported = isLanguagePairSupported(t, m);
      if (supported) {
        verifiedCount++;
        // Must belong to verified dataset languages
        assert.ok(VERIFIED_DATASET_LANGUAGES.includes(t), `Target ${t} must be in verified dataset`);
        assert.ok(VERIFIED_DATASET_LANGUAGES.includes(m), `Mother tongue ${m} must be in verified dataset`);
      } else {
        lackingContentCount++;
        // Must involve Bengali or Urdu
        assert.ok(
          t === 'Bengali' || m === 'Bengali' || t === 'Urdu' || m === 'Urdu',
          `Unsupported pair (${t}, ${m}) must involve Bengali or Urdu`
        );
      }
    }
  }

  assert.equal(verifiedCount, 42, 'Exactly 42 selectable pairs have verified complete content');
  assert.equal(lackingContentCount, 22, 'Exactly 22 selectable pairs lack content (Bengali or Urdu)');
});

test('3. Bidirectional and reverse pairs support verification', () => {
  const verifiedCore = ['Kannada', 'Hindi', 'English', 'Telugu', 'Tamil', 'Malayalam', 'Marathi'];

  for (let i = 0; i < verifiedCore.length; i++) {
    for (let j = i + 1; j < verifiedCore.length; j++) {
      const langA = verifiedCore[i];
      const langB = verifiedCore[j];

      // Forward pair
      assert.equal(
        isLanguagePairSupported(langA, langB),
        true,
        `Forward pair (${langA} through ${langB}) must be supported`
      );

      // Reverse pair
      assert.equal(
        isLanguagePairSupported(langB, langA),
        true,
        `Reverse pair (${langB} through ${langA}) must be supported`
      );
    }
  }
});

test('4. Complete vocabulary and example resolution for all 42 verified pairs', () => {
  const verifiedLanguages = ['Kannada', 'Hindi', 'English', 'Telugu', 'Tamil', 'Malayalam', 'Marathi'];

  assert.ok(VOCABULARY.length >= 300, `Vocabulary has 300+ items, found ${VOCABULARY.length}`);

  for (const target of verifiedLanguages) {
    for (const motherTongue of verifiedLanguages) {
      if (target === motherTongue) continue;

      for (const item of VOCABULARY) {
        const content = resolveLearningContent(item, target, motherTongue);

        assert.equal(
          content.hasMissingData,
          false,
          `Item ${item.id} should have complete data for ${target} through ${motherTongue}: missing ${content.missingFields?.join(', ')}`
        );
        assert.equal(content.missingFields.length, 0);

        // Target word text
        assert.ok(content.targetWord.text, `Item ${item.id} must have target word text for ${target}`);
        assert.equal(content.targetWord.isMissing, false);

        // Mother tongue translation
        assert.ok(
          content.motherTongueTranslation,
          `Item ${item.id} must have mother tongue translation for ${motherTongue}`
        );

        // Conversational examples
        assert.ok(
          content.example.targetExample,
          `Item ${item.id} must have target example for ${target}`
        );
        assert.ok(
          content.example.motherTongueExample,
          `Item ${item.id} must have mother tongue example for ${motherTongue}`
        );
      }
    }
  }
});

test('5. Non-fabrication guarantee for unverified language pairs', () => {
  const unverified = ['Bengali', 'Urdu'];
  const anyTarget = 'Kannada';

  for (const item of VOCABULARY) {
    for (const uv of unverified) {
      // 1. Unverified mother tongue (e.g. Kannada through Bengali or Urdu)
      const contentMotherTongue = resolveLearningContent(item, anyTarget, uv);
      assert.equal(contentMotherTongue.hasMissingData, true);
      assert.ok(contentMotherTongue.missingFields.includes('motherTongueTranslation'));
      assert.equal(contentMotherTongue.motherTongueTranslation, null, 'Must not fabricate mother tongue translation');

      // 2. Unverified target (e.g. Bengali through Kannada)
      if (uv === 'Bengali') {
        const contentTarget = resolveLearningContent(item, 'Bengali', 'Kannada');
        assert.equal(contentTarget.hasMissingData, true);
        assert.ok(contentTarget.missingFields.includes('targetWord'));
        assert.equal(contentTarget.targetWord.text, null, 'Must not fabricate target word text');
        assert.equal(contentTarget.targetWord.isMissing, true);
      }
    }
  }
});

test('6. Dynamic quiz generation across multiple language pairs and reverse pairs', () => {
  const testPairs = [
    { target: 'Telugu', motherTongue: 'Kannada' }, // Reverse pair
    { target: 'Kannada', motherTongue: 'Telugu' }, // Standard Kannada target
    { target: 'Tamil', motherTongue: 'Hindi' },    // Dravidian through Indo-Aryan
    { target: 'Hindi', motherTongue: 'Tamil' },    // Reverse of above
    { target: 'English', motherTongue: 'Kannada' },// English target through Kannada
    { target: 'Marathi', motherTongue: 'Malayalam' }, // West to South regional pair
  ];

  for (const { target, motherTongue } of testPairs) {
    const questions = generateQuizQuestions(VOCABULARY, motherTongue, 'all', target);
    assert.ok(questions.length > 0, `Quiz questions must be generated for ${target} via ${motherTongue}`);
    assert.equal(questions.length, 5, 'Standard quiz must generate 5 questions');

    for (const q of questions) {
      assert.equal(q.targetLanguage, target);
      assert.equal(q.motherTongue, motherTongue);

      // Verify prompt and audio
      assert.ok(q.prompt, 'Question must have a prompt');
      assert.equal(q.audioLanguage, target);

      // Verify choices
      assert.equal(q.options.length, 4, 'Quiz question must have 4 choices');
      assert.ok(q.options.includes(q.correctAnswer), 'Options must contain correct answer');
      assert.equal(new Set(q.options).size, 4, 'Options must be 4 distinct choices');
    }
  }
});

test('7. Quiz generator handles unverified language pairs gracefully without throwing', () => {
  // Bengali target lacks vocabulary -> should safely return empty array []
  const questions = generateQuizQuestions(VOCABULARY, 'Kannada', 'all', 'Bengali');
  assert.deepEqual(questions, [], 'Quiz generator must return empty array when language has no dataset');

  // Bengali mother tongue -> should safely return empty array []
  const questions2 = generateQuizQuestions(VOCABULARY, 'Bengali', 'all', 'Kannada');
  assert.deepEqual(questions2, [], 'Quiz generator must return empty array when mother tongue has no dataset');
});

test('8. Speech synthesis utility supports multiple target languages', () => {
  const targets = ['Kannada', 'Hindi', 'Telugu', 'Tamil', 'Malayalam', 'Marathi', 'English'];

  for (const t of targets) {
    const result = speakTargetLanguage('Test audio text', t);
    assert.ok(result);
    assert.equal(result.supported, true);
    assert.ok(result.message);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';

import { VOCABULARY } from '../src/data/vocabulary.js';
import {
  isLanguagePairSupported,
  getSupportedAlternatives,
  getLanguageMetadata,
} from '../src/data/languages.js';
import {
  parseLanguageWord,
  resolveLearningContent,
  generateQuizQuestions,
} from '../src/utils/languageLearning.js';

// Test 1: Language pair support check for Kannada mother tongue and Hindi target
test('1. Kannada mother tongue to Hindi target language combination is supported', () => {
  assert.equal(
    isLanguagePairSupported('Hindi', 'Kannada'),
    true,
    'Learning Hindi through Kannada mother tongue must be supported'
  );

  const alternatives = getSupportedAlternatives('Hindi');
  assert.ok(alternatives.includes('Kannada'), 'Alternatives for Hindi must include Kannada');
});

// Test 2: Preservation of all existing supported language pairs
test('2. All existing Kannada target language pairs remain fully supported', () => {
  const existingBridgeLanguages = [
    'Telugu',
    'Tamil',
    'Hindi',
    'Malayalam',
    'Marathi',
    'Tulu',
    'English',
  ];

  for (const bridge of existingBridgeLanguages) {
    assert.equal(
      isLanguagePairSupported('Kannada', bridge),
      true,
      `Kannada through ${bridge} must remain supported`
    );
  }

  // Unsupported pairs lacking dataset content or identical pairs must remain false
  assert.equal(isLanguagePairSupported('Kannada', 'Bengali'), false);
  assert.equal(isLanguagePairSupported('Kannada', 'Urdu'), false);
  assert.equal(isLanguagePairSupported('Hindi', 'Bengali'), false);
  assert.equal(isLanguagePairSupported('Hindi', 'Urdu'), false);
  assert.equal(isLanguagePairSupported('Tamil', 'Bengali'), false);
  assert.equal(isLanguagePairSupported('Kannada', 'Kannada'), false);

  // Cross pairs between languages with complete verified datasets are supported
  assert.equal(isLanguagePairSupported('Hindi', 'Telugu'), true);
  assert.equal(isLanguagePairSupported('Hindi', 'English'), true);
  assert.equal(isLanguagePairSupported('Tamil', 'Hindi'), true);
});

// Test 3: Data completeness across entire vocabulary for Kannada -> Hindi
test('3. Entire vocabulary dataset has authentic Hindi translations, pronunciations, and examples', () => {
  assert.ok(VOCABULARY.length >= 50, 'Vocabulary pool should have 50+ items');

  for (const item of VOCABULARY) {
    const content = resolveLearningContent(item, 'Hindi', 'Kannada');

    // Content must not have missing data
    assert.equal(
      content.hasMissingData,
      false,
      `Item ${item.id} has missing data for Hindi through Kannada: ${content.missingFields?.join(', ')}`
    );

    // Target word must be in Devanagari script
    assert.ok(content.targetWord.text, `Item ${item.id} must have Hindi text`);
    assert.ok(
      /[\u0900-\u097F]/.test(content.targetWord.text),
      `Item ${item.id} Hindi text must be in Devanagari script: ${content.targetWord.text}`
    );

    // Target word must have pronunciation
    assert.ok(
      content.targetWord.pronunciation.length > 0,
      `Item ${item.id} must have Hindi pronunciation`
    );

    // Mother tongue translation must be Kannada
    assert.ok(
      content.motherTongueTranslation.includes(item.kannada),
      `Item ${item.id} mother tongue translation must include Kannada script ${item.kannada}`
    );

    // Example sentence in Hindi
    assert.ok(
      content.example.targetExample,
      `Item ${item.id} must have Hindi conversation example`
    );
    assert.ok(
      /[\u0900-\u097F]/.test(content.example.targetExample),
      `Item ${item.id} Hindi example must be in Devanagari script`
    );

    // Example sentence in Kannada (mother tongue)
    assert.ok(
      content.example.motherTongueExample.includes(item.example.kannada),
      `Item ${item.id} mother tongue example must include Kannada example`
    );
  }
});

// Test 4: Missing data detection rather than displaying incorrect translations
test('4. Missing translations are explicitly detected without mock fallbacks', () => {
  // Test item with missing Hindi translation
  const itemWithoutHindi = {
    id: 'test_incomplete_001',
    category: 'Greetings',
    kannada: 'ಬೆಳಕು',
    pronunciation: 'Belaku',
    english: 'Light',
    translations: {
      Telugu: 'వెలుగు (Velugu)',
    },
    example: {
      kannada: 'ಕೋಣೆಯಲ್ಲಿ ಬೆಳಕಿದೆ.',
      pronunciation: 'Kōṇeyalli belakide.',
      english: 'There is light in the room.',
    },
  };

  const resolved = resolveLearningContent(itemWithoutHindi, 'Hindi', 'Kannada');
  assert.equal(resolved.hasMissingData, true);
  assert.ok(resolved.missingFields.includes('targetWord'));
  assert.equal(resolved.targetWord.text, null);
  assert.equal(resolved.targetWord.isMissing, true);

  // Test item with missing example
  const itemWithoutExample = {
    id: 'test_incomplete_002',
    category: 'Food',
    kannada: 'ಹಾಲು',
    pronunciation: 'Hālu',
    english: 'Milk',
    translations: {
      Hindi: 'दूध (Doodh)',
    },
  };

  const parsedWord = parseLanguageWord(itemWithoutExample, 'Hindi');
  assert.equal(parsedWord.text, 'दूध');
  assert.equal(parsedWord.pronunciation, 'Doodh');
  assert.equal(parsedWord.isMissing, false);
});

// Test 5: Quiz question generation for Kannada mother tongue and Hindi target
test('5. Multi-language quiz questions generated correctly for Hindi through Kannada', () => {
  const questions = generateQuizQuestions(VOCABULARY, 'Kannada', 'all', 'Hindi');
  assert.ok(questions.length > 0 && questions.length <= 5);

  for (const q of questions) {
    assert.ok(['hindi_to_kannada', 'kannada_to_hindi'].includes(q.questionType));
    assert.equal(q.targetLanguage, 'Hindi');
    assert.equal(q.motherTongue, 'Kannada');

    // Prompt and subPrompt
    assert.ok(q.prompt && q.prompt.length > 0);
    assert.ok(q.subPrompt && q.subPrompt.length > 0);

    // Exactly 4 options
    assert.equal(q.options.length, 4, 'Quiz question must have 4 options');

    // Options must be unique
    const uniqueOptions = new Set(q.options);
    assert.equal(uniqueOptions.size, 4, 'All 4 options must be distinct');

    // Correct answer must be among options
    assert.ok(
      q.options.includes(q.correctAnswer),
      `Correct answer "${q.correctAnswer}" must be in options: ${q.options.join(', ')}`
    );

    if (q.questionType === 'hindi_to_kannada') {
      // Prompt should be in Devanagari, answer should be in Kannada
      assert.ok(/[\u0900-\u097F]/.test(q.prompt), 'Prompt should be Hindi Devanagari text');
      assert.ok(/[\u0C80-\u0CFF]/.test(q.correctAnswer), 'Answer should be Kannada text');
    } else {
      // Prompt asks for Kannada word in Hindi, answer should be Hindi
      assert.ok(/[\u0C80-\u0CFF]/.test(q.prompt), 'Prompt should contain Kannada word');
      assert.ok(/[\u0900-\u097F]/.test(q.correctAnswer), 'Answer should be Hindi text');
    }
  }
});

// Test 6: Preservation of quiz questions for Kannada target (e.g. Kannada via Telugu or Hindi)
test('6. Quiz questions for Kannada target remain accurate for all mother tongues', () => {
  for (const bridge of ['Telugu', 'Hindi', 'English']) {
    const questions = generateQuizQuestions(VOCABULARY, bridge, 'all', 'Kannada');
    assert.ok(questions.length > 0);

    for (const q of questions) {
      assert.equal(q.targetLanguage, 'Kannada');
      assert.equal(q.motherTongue, bridge);
      assert.equal(q.options.length, 4);
      assert.ok(q.options.includes(q.correctAnswer));
    }
  }
});

// Test 7: Language metadata consistency
test('7. Language metadata returns proper native script and descriptors', () => {
  const kn = getLanguageMetadata('Kannada');
  assert.equal(kn.id, 'Kannada');
  assert.equal(kn.nativeName, 'ಕನ್ನಡ');

  const hi = getLanguageMetadata('Hindi');
  assert.equal(hi.id, 'Hindi');
  assert.equal(hi.nativeName, 'हिन्दी');
});

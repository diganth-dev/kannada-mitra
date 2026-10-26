/**
 * Multi-Language Learning Logic for Kannada Mitra
 * Resolves learning content, pronunciations, examples, and quiz questions
 * for supported language combinations (Kannada target or Hindi target).
 *
 * Strictly avoids mock translations or invented vocabulary.
 * If translations or examples are missing in the dataset, missing data is explicitly flagged.
 */

/**
 * Parses a word representation for a specific language.
 * E.g., for Hindi: "नमस्ते (Namaste)" -> { text: "नमस्ते", pronunciation: "Namaste", full: "नमस्ते (Namaste)" }
 * E.g., for Kannada: "ನಮಸ್ಕಾರ", pronunciation: "Namaskāra" -> { text: "ನಮಸ್ಕಾರ", pronunciation: "Namaskāra", full: "ನಮಸ್ಕಾರ (Namaskāra)" }
 */
export const parseLanguageWord = (word, language) => {
  if (!word) {
    return { text: null, pronunciation: null, full: null, isMissing: true };
  }

  if (language === 'Kannada') {
    const text = word.kannada?.trim() || null;
    const pronunciation = word.pronunciation?.trim() || '';
    if (!text) {
      return { text: null, pronunciation: null, full: null, isMissing: true };
    }
    return {
      text,
      pronunciation,
      full: pronunciation ? `${text} (${pronunciation})` : text,
      isMissing: false,
    };
  }

  if (language === 'Hindi') {
    const raw = word.translations?.Hindi?.trim();
    if (!raw) {
      return { text: null, pronunciation: null, full: null, isMissing: true };
    }
    const match = raw.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      return {
        text: match[1].trim(),
        pronunciation: match[2].trim(),
        full: raw,
        isMissing: false,
      };
    }
    return {
      text: raw,
      pronunciation: '',
      full: raw,
      isMissing: false,
    };
  }

  if (language === 'English') {
    const text = word.english?.trim() || null;
    return {
      text,
      pronunciation: '',
      full: text,
      isMissing: !text,
    };
  }

  // Other regional bridge languages (Telugu, Tamil, Malayalam, Marathi, Tulu)
  const raw = word.translations?.[language]?.trim() || null;
  if (!raw) {
    return { text: null, pronunciation: null, full: null, isMissing: true };
  }
  const match = raw.match(/^(.*?)\s*\((.*?)\)$/);
  if (match) {
    return {
      text: match[1].trim(),
      pronunciation: match[2].trim(),
      full: raw,
      isMissing: false,
    };
  }
  return {
    text: raw,
    pronunciation: '',
    full: raw,
    isMissing: false,
  };
};

/**
 * Validates whether a vocabulary item has complete, verified translations and examples for a language.
 */
export const isLanguageContentComplete = (word, language) => {
  if (!word || !language) return false;
  const parsed = parseLanguageWord(word, language);
  if (parsed.isMissing || !parsed.text) return false;

  if (language === 'Kannada') {
    return Boolean(word.example?.kannada?.trim());
  }
  if (language === 'English') {
    return Boolean(word.example?.english?.trim());
  }
  return Boolean(word.example?.translations?.[language]?.trim());
};

/**
 * Resolves learning flashcard content based on target language and mother tongue.
 * Supports any valid language pair, extracting authentic script, pronunciation,
 * translations, and conversational examples.
 *
 * Strictly flags missing fields and avoids invented/fabricated vocabulary.
 */
export const resolveLearningContent = (word, targetLanguage = 'Kannada', motherTongue = 'English') => {
  if (!word) return null;

  const missingFields = [];

  // 1. Resolve Target Word
  const targetWord = parseLanguageWord(word, targetLanguage);
  if (targetWord.isMissing || !targetWord.text) {
    missingFields.push('targetWord');
  }

  // 2. Resolve Mother Tongue Translation
  let motherTongueTranslation;
  if (motherTongue === 'Kannada') {
    motherTongueTranslation = word.kannada
      ? `${word.kannada}${word.pronunciation ? ' (' + word.pronunciation + ')' : ''}`
      : null;
  } else if (motherTongue === 'English') {
    motherTongueTranslation = word.english?.trim() || null;
  } else {
    motherTongueTranslation = word.translations?.[motherTongue]?.trim() || null;
  }
  if (!motherTongueTranslation) {
    missingFields.push('motherTongueTranslation');
  }

  // 3. Resolve Target Example Sentence
  let targetExample;
  let targetExamplePronunciation;
  if (targetLanguage === 'Kannada') {
    targetExample = word.example?.kannada?.trim() || null;
    targetExamplePronunciation = word.example?.pronunciation?.trim() || null;
  } else if (targetLanguage === 'English') {
    targetExample = word.example?.english?.trim() || null;
    targetExamplePronunciation = null;
  } else {
    targetExample = word.example?.translations?.[targetLanguage]?.trim() || null;
    targetExamplePronunciation = null;
  }
  if (word.example && !targetExample) {
    missingFields.push('targetExample');
  }

  // 4. Resolve Mother Tongue Example Sentence
  let motherTongueExample;
  if (motherTongue === 'Kannada') {
    motherTongueExample = word.example?.kannada
      ? `${word.example.kannada}${word.example.pronunciation ? ' (' + word.example.pronunciation + ')' : ''}`
      : null;
  } else if (motherTongue === 'English') {
    motherTongueExample = word.example?.english?.trim() || null;
  } else {
    motherTongueExample = word.example?.translations?.[motherTongue]?.trim() || null;
  }
  if (word.example && !motherTongueExample) {
    missingFields.push('motherTongueExample');
  }

  return {
    targetLanguage,
    motherTongue,
    targetWord,
    motherTongueTranslation,
    englishMeaning: word.english?.trim() || null,
    example: {
      targetExample,
      targetExamplePronunciation,
      englishExample: word.example?.english?.trim() || null,
      motherTongueExample,
    },
    culturalNote: word.culturalNote?.trim() || null,
    hasMissingData: missingFields.length > 0,
    missingFields,
  };
};

/**
 * Array shuffling utility.
 */
export const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Generates quiz questions for any supported target language and mother tongue combination.
 * Filters strictly for verified items and creates balanced, distinct distractors.
 */
export const generateQuizQuestions = (
  vocabulary,
  motherTongue,
  categoryFilter = 'all',
  targetLanguage = 'Kannada'
) => {
  if (!Array.isArray(vocabulary) || vocabulary.length === 0) return [];

  const categoryPool =
    categoryFilter === 'all'
      ? vocabulary
      : vocabulary.filter((w) => w.category === categoryFilter);

  const rawPool = categoryPool.length > 0 ? (categoryPool.length >= 4 ? categoryPool : vocabulary) : vocabulary;
  if (!rawPool || rawPool.length === 0) return [];

  // Strictly filter for items that have verified translations in BOTH target and mother tongue
  const validPool = rawPool.filter((w) => {
    const targetParsed = parseLanguageWord(w, targetLanguage);
    const nativeParsed = parseLanguageWord(w, motherTongue);
    return !targetParsed.isMissing && Boolean(targetParsed.text) && !nativeParsed.isMissing && Boolean(nativeParsed.text);
  });

  if (validPool.length === 0) return [];

  const shuffledItems = shuffleArray(validPool);
  const targetQuestions = shuffledItems.slice(0, Math.min(5, shuffledItems.length));

  // Determine distractor pool from entire vocabulary that also have verified entries
  const validDistractorPool = vocabulary.filter((w) => {
    const targetParsed = parseLanguageWord(w, targetLanguage);
    const nativeParsed = parseLanguageWord(w, motherTongue);
    return !targetParsed.isMissing && Boolean(targetParsed.text) && !nativeParsed.isMissing && Boolean(nativeParsed.text);
  });

  return targetQuestions.map((word, qIndex) => {
    const isFormatTargetToNative = qIndex % 2 === 0;

    const targetParsed = parseLanguageWord(word, targetLanguage);
    const nativeParsed = parseLanguageWord(word, motherTongue);

    const targetDisplay = targetParsed.full || targetParsed.text;
    const nativeDisplay = nativeParsed.full || nativeParsed.text;

    // Preserve specialized questionType strings for backward compatibility
    let questionType;
    if (targetLanguage === 'Hindi' && motherTongue === 'Kannada') {
      questionType = isFormatTargetToNative ? 'hindi_to_kannada' : 'kannada_to_hindi';
    } else if (targetLanguage === 'Kannada') {
      questionType = isFormatTargetToNative ? 'kannada_to_native' : 'native_to_kannada';
    } else {
      questionType = isFormatTargetToNative
        ? `${targetLanguage.toLowerCase()}_to_${motherTongue.toLowerCase()}`
        : `${motherTongue.toLowerCase()}_to_${targetLanguage.toLowerCase()}`;
    }

    if (isFormatTargetToNative) {
      // Question: Given Target Word, ask what it means in Mother Tongue
      const prompt = targetParsed.text;
      const subPrompt = targetParsed.pronunciation
        ? `Pronounced "${targetParsed.pronunciation}". What does this mean in ${motherTongue}?`
        : `What does this mean in ${motherTongue}?`;
      const correctAnswer = nativeDisplay;

      const seen = new Set([correctAnswer]);
      const wrongAnswers = [];
      const candidateOthers = shuffleArray(validDistractorPool.filter((w) => w.id !== word.id));

      for (const other of candidateOthers) {
        const otherNative = parseLanguageWord(other, motherTongue);
        const opt = otherNative.full || otherNative.text;
        if (opt && !seen.has(opt)) {
          seen.add(opt);
          wrongAnswers.push(opt);
          if (wrongAnswers.length === 3) break;
        }
      }

      const options = shuffleArray([correctAnswer, ...wrongAnswers]);

      return {
        id: `q_${word.id}_${qIndex}`,
        word,
        targetLanguage,
        motherTongue,
        questionType,
        format: 'target_to_native',
        prompt,
        subPrompt,
        audioText: targetParsed.text,
        audioLanguage: targetLanguage,
        correctAnswer,
        options,
      };
    } else {
      // Question: Given Mother Tongue meaning, ask how to say it in Target Language
      const prompt = `How do you say "${nativeDisplay}" in ${targetLanguage}?`;
      const subPrompt = `Select the correct ${targetLanguage} word:`;
      const correctAnswer = targetDisplay;

      const seen = new Set([correctAnswer]);
      const wrongAnswers = [];
      const candidateOthers = shuffleArray(validDistractorPool.filter((w) => w.id !== word.id));

      for (const other of candidateOthers) {
        const otherTarget = parseLanguageWord(other, targetLanguage);
        const opt = otherTarget.full || otherTarget.text;
        if (opt && !seen.has(opt)) {
          seen.add(opt);
          wrongAnswers.push(opt);
          if (wrongAnswers.length === 3) break;
        }
      }

      const options = shuffleArray([correctAnswer, ...wrongAnswers]);

      return {
        id: `q_${word.id}_${qIndex}`,
        word,
        targetLanguage,
        motherTongue,
        questionType,
        format: 'native_to_target',
        prompt,
        subPrompt,
        audioText: targetParsed.text,
        audioLanguage: targetLanguage,
        correctAnswer,
        options,
      };
    }
  });
};

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Volume2,
  Trophy,
} from 'lucide-react';
import { speakTargetLanguage } from '../utils/speech';
import { SUPPORTED_LANGUAGES, getLanguageMetadata } from '../data/languages';
import { generateQuizQuestions } from '../utils/languageLearning';

const getResultFeedback = (percentage, targetLanguage = 'Kannada') => {
  if (targetLanguage === 'Telugu') {
    if (percentage === 100) {
      return {
        resultHeading: 'అద్భుతం! (Adbhutam!) Perfect Score!',
        resultMessage: 'You have mastered these Telugu words flawlessly! Keep up the brilliant momentum.',
      };
    }
    if (percentage >= 60) {
      return {
        resultHeading: 'చాలా బాగుంది! (Chālā Bāgundi!)',
        resultMessage: 'Great work! You are building solid practical knowledge of everyday Telugu.',
      };
    }
    return {
      resultHeading: 'మళ్లీ ప్రయత్నించండి! (Mallī Prayatninchaṇḍi!)',
      resultMessage: 'Good try! Language learning happens one step at a time. Review the cards and test again!',
    };
  }

  if (targetLanguage === 'Tamil') {
    if (percentage === 100) {
      return {
        resultHeading: 'அற்புதம்! (Arputham!) Perfect Score!',
        resultMessage: 'You have mastered these Tamil words flawlessly! Keep up the brilliant momentum.',
      };
    }
    if (percentage >= 60) {
      return {
        resultHeading: 'மிகவும் நன்று! (Migavum Nandru!)',
        resultMessage: 'Great work! You are building solid practical knowledge of everyday Tamil.',
      };
    }
    return {
      resultHeading: 'மீண்டும் முயற்சி செய்யுங்கள்! (Meendum Muyarchi Seyyungal!)',
      resultMessage: 'Good try! Language learning happens one step at a time. Review the cards and test again!',
    };
  }

  if (targetLanguage === 'Malayalam') {
    if (percentage === 100) {
      return {
        resultHeading: 'അത്ഭുതം! (Adbhutham!) Perfect Score!',
        resultMessage: 'You have mastered these Malayalam words flawlessly! Keep up the brilliant momentum.',
      };
    }
    if (percentage >= 60) {
      return {
        resultHeading: 'വളരെ നല്ലത്! (Valare Nallathu!)',
        resultMessage: 'Great work! You are building solid practical knowledge of everyday Malayalam.',
      };
    }
    return {
      resultHeading: 'വീണ്ടും ശ്രമിക്കുക! (Veendum Shramikkuka!)',
      resultMessage: 'Good try! Language learning happens one step at a time. Review the cards and test again!',
    };
  }

  if (targetLanguage === 'Marathi') {
    if (percentage === 100) {
      return {
        resultHeading: 'उत्कृष्ट! (Utkrushṭa!) Perfect Score!',
        resultMessage: 'You have mastered these Marathi words flawlessly! Keep up the brilliant momentum.',
      };
    }
    if (percentage >= 60) {
      return {
        resultHeading: 'खूप छान! (Khūp Chhān!)',
        resultMessage: 'Great work! You are building solid practical knowledge of everyday Marathi.',
      };
    }
    return {
      resultHeading: 'पुन्हा प्रयत्न करा! (Punhā Prayatna Karā!)',
      resultMessage: 'Good try! Language learning happens one step at a time. Review the cards and test again!',
    };
  }

  if (targetLanguage === 'English') {
    if (percentage === 100) {
      return {
        resultHeading: 'Excellent! Perfect Score!',
        resultMessage: 'You have mastered these English words flawlessly! Keep up the brilliant momentum.',
      };
    }
    if (percentage >= 60) {
      return {
        resultHeading: 'Great Job! Well Done!',
        resultMessage: 'Great work! You are building solid practical knowledge of everyday English.',
      };
    }
    return {
      resultHeading: 'Keep Practicing!',
      resultMessage: 'Good try! Language learning happens one step at a time. Review the cards and test again!',
    };
  }

  if (targetLanguage === 'Hindi') {
    if (percentage === 100) {
      return {
        resultHeading: 'अद्भुत! (Adbhut!) Perfect Score!',
        resultMessage:
          'You have mastered these Hindi words flawlessly! Keep up the brilliant momentum.',
      };
    }
    if (percentage >= 60) {
      return {
        resultHeading: 'बहुत अच्छा! (Bahut Accha!)',
        resultMessage:
          'Great work! You are building solid practical knowledge of everyday Hindi.',
      };
    }
    return {
      resultHeading: 'फिर कोशिश कीजिए! (Phir Koshish Kijiye!)',
      resultMessage:
        'Good try! Language learning happens one step at a time. Review the cards and test again!',
    };
  }

  if (percentage === 100) {
    return {
      resultHeading: 'ಅದ್ಭುತ! (Adbhutha!) Perfect Score!',
      resultMessage:
        'You have mastered these Kannada words flawlessly! Keep up the brilliant momentum.',
    };
  }
  if (percentage >= 60) {
    return {
      resultHeading: 'ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ! (Thumba Chennagide!)',
      resultMessage:
        'Great work! You are building solid practical knowledge of everyday Kannada.',
    };
  }
  return {
    resultHeading: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ! (Matthe Prayatnisi!)',
    resultMessage:
      'Good try! Language learning happens one step at a time. Review the cards and test again!',
  };
};

export const QuizScreen = ({
  vocabulary,
  currentLanguage,
  targetLanguage = 'Kannada',
  selectedCategory,
  onFinishQuiz,
  onContinueLearning,
}) => {
  const [questions, setQuestions] = useState(() =>
    generateQuizQuestions(vocabulary, currentLanguage, selectedCategory, targetLanguage)
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioTimerRef = useRef(null);

  // Unmount cleanup: cancel speech synthesis and active timers
  useEffect(() => {
    return () => {
      if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Restart quiz with fresh random questions
  const startNewQuiz = useCallback(() => {
    const newQuestions = generateQuizQuestions(
      vocabulary,
      currentLanguage,
      selectedCategory,
      targetLanguage
    );
    setQuestions(newQuestions);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);
  }, [vocabulary, currentLanguage, selectedCategory, targetLanguage]);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  const currentLangObj = useMemo(
    () =>
      SUPPORTED_LANGUAGES.find((l) => l.id === currentLanguage) ||
      getLanguageMetadata(currentLanguage) ||
      SUPPORTED_LANGUAGES[0],
    [currentLanguage]
  );

  const handleSelectOption = (option) => {
    if (selectedOption !== null || !currentQuestion) return; // Prevent changing after answer

    setSelectedOption(option);
    const isCorrect = option === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex + 1 < totalQuestions) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      // Quiz finished
      const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
      onFinishQuiz(percentage, totalQuestions);
      setIsFinished(true);
    }
  };

  const handlePlayAudio = (text, audioLang) => {
    if (!text) return;
    setIsPlayingAudio(true);
    if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
    audioTimerRef.current = setTimeout(() => setIsPlayingAudio(false), 3500);

    speakTargetLanguage(
      text,
      audioLang || targetLanguage,
      () => {
        if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
        setIsPlayingAudio(false);
      },
      () => {
        if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
        setIsPlayingAudio(false);
      }
    );
  };

  // ==========================================
  // RESULTS SCREEN
  // ==========================================
  if (isFinished) {
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const { resultHeading, resultMessage } = getResultFeedback(percentage, targetLanguage);

    return (
      <div className="py-10 sm:py-16 px-4 max-w-xl mx-auto text-center space-y-6">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border-2 border-amber-200 shadow-xl relative overflow-hidden">
          {/* Trophy Header */}
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 border border-amber-300 shadow-inner">
            <Trophy className="w-10 h-10" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 mb-3 border border-amber-200">
            Quiz Completed
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mb-2">
            {resultHeading}
          </h2>

          <p className="text-stone-600 text-sm max-w-md mx-auto mb-6">
            {resultMessage}
          </p>

          {/* Score Card Display */}
          <div className="bg-amber-50/70 rounded-2xl p-6 border border-amber-200 mb-8 max-w-sm mx-auto space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Your Final Score
            </div>
            <div className="text-5xl font-black text-red-700">
              {score} <span className="text-stone-400 text-2xl font-bold">/ {totalQuestions}</span>
            </div>
            <div className="text-xs font-semibold text-stone-500">
              {percentage}% accuracy
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={startNewQuiz}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Quiz Again</span>
            </button>

            <button
              onClick={onContinueLearning}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Back to Learning</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // EMPTY STATE (Pool has 0 words)
  // ==========================================
  if (!currentQuestion) {
    return (
      <div className="py-12 px-4 max-w-md mx-auto text-center space-y-4">
        <h3 className="text-xl font-bold text-stone-800">
          No questions available
        </h3>
        <p className="text-sm text-stone-600">
          Select another category or explore all words to start a quiz.
        </p>
        <button
          onClick={onContinueLearning}
          className="px-6 py-2.5 rounded-xl bg-red-700 text-white font-bold text-sm shadow-xs cursor-pointer"
        >
          Return to Learning
        </button>
      </div>
    );
  }

  const hasAnswered = selectedOption !== null;
  const isCorrect = selectedOption === currentQuestion.correctAnswer;

  return (
    <div className="py-6 sm:py-10 px-4 max-w-3xl mx-auto space-y-6">
      {/* Quiz Progress & Score Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
            Question Progress
          </span>
          <span className="text-base sm:text-lg font-black text-stone-900">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Visual progress bar */}
          <div className="hidden sm:block w-32 bg-stone-100 h-2.5 rounded-full overflow-hidden border border-stone-200">
            <div
              className="bg-gradient-to-r from-red-600 to-amber-500 h-full rounded-full transition-all duration-300"
              style={{
                width: `${totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0}%`,
              }}
            ></div>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs sm:text-sm">
            Score: <span className="text-red-700">{score}</span> / {totalQuestions}
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl border-2 border-amber-200 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Question Header */}
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
            {currentQuestion.word.category} • Kannada Quiz via {currentLangObj.name}
          </span>

          <div className="pt-2">
            {currentQuestion.format === 'target_to_native' ||
            currentQuestion.questionType === 'kannada_to_native' ||
            currentQuestion.questionType === 'hindi_to_kannada' ? (
              <div className="space-y-1">
                <div
                  className={`text-5xl sm:text-6xl font-black text-stone-900 ${
                    currentQuestion.targetLanguage === 'Kannada' ? 'font-kannada' : ''
                  }`}
                >
                  {currentQuestion.prompt}
                </div>
                <p className="text-sm font-medium text-stone-600">
                  {currentQuestion.subPrompt}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-bold text-stone-900">
                  {currentQuestion.prompt}
                </h3>
                <p className="text-xs text-stone-500 font-medium">
                  {currentQuestion.subPrompt}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Multiple Choice Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {currentQuestion.options.map((option, idx) => {
            const isOptionSelected = selectedOption === option;
            const isOptionCorrect = option === currentQuestion.correctAnswer;

            let buttonStyle = 'bg-stone-50 hover:bg-amber-50/80 border-stone-200 text-stone-800';

            if (hasAnswered) {
              if (isOptionCorrect) {
                // Correct answer highlighted green with checkmark
                buttonStyle = 'bg-green-100 border-green-500 text-green-950 font-bold shadow-xs';
              } else if (isOptionSelected && !isOptionCorrect) {
                // Incorrect chosen answer highlighted red with X
                buttonStyle = 'bg-red-100 border-red-500 text-red-950 font-bold';
              } else {
                // Other options muted
                buttonStyle = 'bg-stone-50 border-stone-200 text-stone-400 opacity-60';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(option)}
                disabled={hasAnswered}
                className={`p-4 rounded-2xl border-2 text-left font-semibold text-sm sm:text-base transition-all flex items-center justify-between gap-2 ${buttonStyle} ${
                  !hasAnswered ? 'cursor-pointer hover:border-amber-400 hover:scale-[1.01]' : 'cursor-default'
                }`}
                aria-pressed={isOptionSelected}
              >
                <span>{option}</span>

                {hasAnswered && isOptionCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0" />
                )}

                {hasAnswered && isOptionSelected && !isOptionCorrect && (
                  <XCircle className="w-5 h-5 text-red-700 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Immediate Explanation Card after answering */}
        {hasAnswered && (
          <div
            className={`rounded-2xl p-5 border text-left space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
              isCorrect
                ? 'bg-green-50/80 border-green-300 text-green-950'
                : 'bg-red-50/80 border-red-300 text-red-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-700" />
                    <span className="font-extrabold text-sm text-green-900">
                      {targetLanguage === 'Hindi' ? 'सही उत्तर! (Sahi Uttar!) Correct!' : 'ಸರಿ! (Sari!) Correct Answer!'}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-700" />
                    <span className="font-extrabold text-sm text-red-900">
                      Not quite! Here is the correct answer:
                    </span>
                  </>
                )}
              </div>

              {/* Speaker audio button in explanation */}
              <button
                onClick={() =>
                  handlePlayAudio(
                    currentQuestion.audioText || currentQuestion.word.kannada,
                    currentQuestion.audioLanguage || targetLanguage
                  )
                }
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/80 border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-white cursor-pointer"
                title={`Hear ${currentQuestion.audioLanguage || targetLanguage} pronunciation`}
                aria-label="Listen to pronunciation"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-bounce text-red-600' : ''}`} />
                <span>Listen</span>
              </button>
            </div>

            {/* Word breakdown summary */}
            <div className="bg-white/90 rounded-xl p-3 border border-stone-200/80 text-xs text-stone-700 space-y-1">
              <div>
                <strong
                  className={`text-stone-900 text-base ${
                    targetLanguage === 'Kannada' ? 'font-kannada' : ''
                  }`}
                >
                  {targetLanguage === 'Hindi'
                    ? currentQuestion.word.translations?.Hindi || currentQuestion.word.kannada
                    : currentQuestion.word.kannada}
                </strong>{' '}
                {targetLanguage === 'Kannada' && (
                  <span className="font-mono text-red-800">
                    ({currentQuestion.word.pronunciation})
                  </span>
                )}{' '}
                means{' '}
                <strong className="text-stone-900">
                  "{targetLanguage === 'Hindi'
                    ? `${currentQuestion.word.kannada} (${currentQuestion.word.pronunciation})`
                    : currentQuestion.word.english}"
                </strong>
              </div>

              {currentQuestion.word.translations?.[currentLanguage] &&
                currentLanguage !== 'Kannada' && (
                  <div className="text-stone-500">
                    In {currentLangObj.name}:{' '}
                    <span className="font-semibold text-stone-800">
                      {currentQuestion.word.translations[currentLanguage]}
                    </span>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Action Button: Next Question or View Results */}
        {hasAnswered && (
          <div className="pt-2 text-right">
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <span>{currentQuestionIndex + 1 < totalQuestions ? 'Next Question' : 'View Results'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizScreen;

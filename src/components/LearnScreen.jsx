import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Volume2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Lightbulb,
  Award,
} from 'lucide-react';
import {
  CATEGORIES,
  SUPPORTED_LANGUAGES,
  isLanguagePairSupported,
  getLanguageMetadata,
} from '../data/languages';
import { speakTargetLanguage } from '../utils/speech';
import { resolveLearningContent } from '../utils/languageLearning';

export const LearnScreen = ({
  vocabulary,
  currentLanguage,
  targetLanguage = 'Kannada',
  onChangeLanguagePair,
  selectedCategory,
  onCategoryChange,
  learnedWords,
  onToggleLearned,
  onStartQuiz,
  targetWordId = null,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechFeedback, setSpeechFeedback] = useState(null);
  const [showCulturalTip, setShowCulturalTip] = useState(false);
  const audioTimerRef = useRef(null);

  // Filter vocabulary by current category
  const filteredWords = useMemo(() => {
    if (selectedCategory === 'all') {
      return vocabulary;
    }
    return vocabulary.filter((w) => w.category === selectedCategory);
  }, [vocabulary, selectedCategory]);

  // Adjust state during render when selectedCategory changes
  const [prevCategory, setPrevCategory] = useState(selectedCategory);
  if (selectedCategory !== prevCategory) {
    setPrevCategory(selectedCategory);
    setCurrentIndex(0);
    setSpeechFeedback(null);
    setShowCulturalTip(false);
  }

  // Adjust index if a specific targetWordId is requested
  const [prevTargetWordId, setPrevTargetWordId] = useState(targetWordId);
  if (targetWordId && targetWordId !== prevTargetWordId) {
    setPrevTargetWordId(targetWordId);
    const targetIdx = filteredWords.findIndex((w) => w.id === targetWordId);
    if (targetIdx !== -1) {
      setCurrentIndex(targetIdx);
    }
  }

  const handleSelectCategory = (catId) => {
    setCurrentIndex(0);
    setSpeechFeedback(null);
    setShowCulturalTip(false);
    onCategoryChange(catId);
  };

  const safeIndex = currentIndex >= filteredWords.length ? 0 : currentIndex;
  const currentWord = filteredWords[safeIndex] || filteredWords[0];

  const isLearned = currentWord ? learnedWords.includes(currentWord.id) : false;

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.id === currentLanguage) ||
    getLanguageMetadata(currentLanguage) ||
    SUPPORTED_LANGUAGES[0];

  const targetLangObj = getLanguageMetadata(targetLanguage);
  const isPairSupported = isLanguagePairSupported(targetLanguage, currentLanguage);

  // Authoritative learning content resolver for Kannada or Hindi targets
  const learningContent = useMemo(() => {
    return resolveLearningContent(currentWord, targetLanguage, currentLanguage);
  }, [currentWord, targetLanguage, currentLanguage]);

  const handleNext = useCallback(() => {
    if (filteredWords.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % filteredWords.length);
    setSpeechFeedback(null);
    setShowCulturalTip(false);
  }, [filteredWords.length]);

  const handlePrev = useCallback(() => {
    if (filteredWords.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + filteredWords.length) % filteredWords.length);
    setSpeechFeedback(null);
    setShowCulturalTip(false);
  }, [filteredWords.length]);

  // Unmount cleanup: cancel pending speech synthesis and clear timers
  useEffect(() => {
    return () => {
      if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Keyboard navigation for accessible learning (kept active for power users)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.ctrlKey ||
        e.altKey ||
        e.metaKey ||
        e.target?.isContentEditable ||
        ['input', 'textarea', 'select'].includes(e.target?.tagName?.toLowerCase())
      ) {
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'l' || e.key === 'L') {
        if (currentWord) onToggleLearned(currentWord.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, currentWord, onToggleLearned]);

  const handlePlayAudio = () => {
    if (!learningContent?.targetWord?.text) return;
    setIsSpeaking(true);

    if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
    audioTimerRef.current = setTimeout(() => setIsSpeaking(false), 3500);

    const result = speakTargetLanguage(
      learningContent.targetWord.text,
      targetLanguage,
      () => {
        if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
        setIsSpeaking(false);
      },
      () => {
        if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
        setIsSpeaking(false);
      }
    );

    if (result?.message) {
      setSpeechFeedback(result.message);
      setTimeout(() => setSpeechFeedback(null), 3500);
    }
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 max-w-4xl mx-auto space-y-5 sm:space-y-7">
      {/* Explanation Language In-Development Notice (Only shown when active explanation language lacks verified translations) */}
      {!isPairSupported && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              <strong className="text-stone-900">
                Verified {currentLangObj.name} translations are currently in development.
              </strong>{' '}
              Lessons are displayed with English explanations as fallback. You can also switch to a supported explanation language below:
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pl-7.5">
            {['English', 'Hindi', 'Telugu', 'Tamil', 'Malayalam', 'Marathi'].map((altLang) => (
              <button
                key={altLang}
                type="button"
                onClick={() => onChangeLanguagePair && onChangeLanguagePair(altLang)}
                className="px-3 py-1.5 bg-white hover:bg-amber-100 text-stone-800 text-xs sm:text-sm font-semibold rounded-lg border border-amber-300 shadow-2xs transition-colors cursor-pointer"
              >
                Explain in {altLang}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Navigation Chips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 text-xs sm:text-sm text-stone-500">
          <span className="font-bold text-stone-700">Categories</span>
          <span className="font-medium">{filteredWords.length} words</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const countInCat =
              cat.id === 'all'
                ? vocabulary.length
                : vocabulary.filter((w) => w.category === cat.id).length;
            const learnedInCat =
              cat.id === 'all'
                ? learnedWords.length
                : vocabulary.filter((w) => w.category === cat.id && learnedWords.includes(w.id))
                    .length;

            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-red-700 text-white border-red-700 shadow-xs'
                    : 'bg-white hover:bg-amber-50 text-stone-700 border-stone-200 hover:border-amber-300'
                }`}
                aria-pressed={isSelected}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[11px] sm:text-xs px-2 py-0.5 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {learnedInCat > 0 ? `${learnedInCat}/${countInCat}` : countInCat}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Vocabulary Card */}
      {currentWord && (
        <div className="bg-white rounded-3xl border border-amber-200/90 shadow-lg overflow-hidden transition-all">
          {/* 1. Category and Current Position Header */}
          <div className="px-6 py-3.5 sm:py-4 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-amber-950 text-sm sm:text-base">{currentWord.category}</span>
              <span className="text-stone-300">•</span>
              <span className="text-stone-600 font-semibold">
                Word {safeIndex + 1} of {filteredWords.length}
              </span>
            </div>

            {isLearned && (
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Learned
              </span>
            )}
          </div>

          {/* Card Body */}
          <div className="p-7 sm:p-10 lg:p-12 space-y-7 sm:space-y-8 text-center">
            {/* 2. Large Vocabulary Word in Original Script */}
            <div
              className={`text-6xl sm:text-7xl lg:text-8xl font-black text-stone-900 tracking-normal drop-shadow-xs py-2 sm:py-4 leading-tight ${
                targetLanguage === 'Kannada' ? 'font-kannada' : ''
              }`}
            >
              {learningContent?.targetWord?.text || (
                <span className="text-amber-800 italic text-2xl font-bold">
                  Translation not available
                </span>
              )}
            </div>

            {/* 3. Latin Pronunciation with Accessible Listen Button */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {learningContent?.targetWord?.pronunciation && (
                <span className="font-mono text-lg sm:text-xl lg:text-2xl font-bold text-red-800 bg-amber-50/90 px-5 py-1.5 sm:py-2 rounded-full border border-amber-300 shadow-2xs">
                  {learningContent.targetWord.pronunciation}
                </span>
              )}

              {learningContent?.targetWord?.text && (
                <button
                  onClick={handlePlayAudio}
                  disabled={isSpeaking}
                  className={`inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isSpeaking
                      ? 'bg-red-600 text-white border-red-600 scale-95 shadow-inner'
                      : 'bg-white hover:bg-amber-100 text-stone-800 border-amber-300 shadow-2xs hover:border-amber-400'
                  }`}
                  aria-label={`Listen to ${targetLangObj.name} pronunciation`}
                  title="Listen to audio"
                >
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse text-white' : 'text-red-700'}`} />
                  <span>{isSpeaking ? 'Playing...' : 'Listen'}</span>
                </button>
              )}
            </div>

            {speechFeedback && (
              <p className="text-xs sm:text-sm text-amber-800 font-medium" role="status">
                {speechFeedback}
              </p>
            )}

            {/* 4 & 5. Meanings: Explanation Language & English */}
            <div className="pt-4 pb-2 space-y-3 border-t border-stone-100">
              <div className="space-y-1">
                <div className="text-xs sm:text-sm font-bold text-stone-500 uppercase tracking-wider">
                  Meaning in {currentLangObj.name}
                </div>
                {learningContent?.motherTongueTranslation ? (
                  <div
                    className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 ${
                      currentLanguage === 'Kannada' ? 'font-kannada' : ''
                    }`}
                  >
                    {learningContent.motherTongueTranslation}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-800">
                      {learningContent?.englishMeaning}
                    </div>
                    <span className="inline-block text-xs font-semibold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-md border border-amber-300">
                      English fallback (verified {currentLangObj.name} translation in development)
                    </span>
                  </div>
                )}
              </div>

              {currentLanguage !== 'English' && learningContent?.englishMeaning && learningContent?.motherTongueTranslation && (
                <div className="text-sm sm:text-base text-stone-600 font-medium">
                  <span className="font-bold text-stone-800">English:</span> {learningContent.englishMeaning}
                </div>
              )}
            </div>

            {/* 6. One Useful Example Sentence */}
            {currentWord.example && (
              <div className="bg-amber-50/60 rounded-2xl p-5 sm:p-7 border border-amber-200/80 text-left space-y-2.5 shadow-2xs">
                <div className="text-xs sm:text-sm font-extrabold text-amber-900 uppercase tracking-wider">
                  Example
                </div>

                {learningContent?.example?.targetExample && (
                  <div
                    className={`text-xl sm:text-2xl lg:text-3xl font-extrabold text-stone-900 leading-snug ${
                      targetLanguage === 'Kannada' ? 'font-kannada' : ''
                    }`}
                  >
                    {learningContent.example.targetExample}
                  </div>
                )}

                {learningContent?.example?.targetExamplePronunciation && (
                  <div className="text-sm sm:text-base font-mono font-bold text-red-800">
                    {learningContent.example.targetExamplePronunciation}
                  </div>
                )}

                <div className="pt-2 text-sm sm:text-base text-stone-700 space-y-1 border-t border-amber-200/70">
                  {learningContent?.example?.motherTongueExample ? (
                    <p className="font-semibold text-stone-900">
                      <strong className="text-amber-950 font-bold">{currentLangObj.name}:</strong> {learningContent.example.motherTongueExample}
                    </p>
                  ) : currentLanguage !== 'English' && (
                    <p className="text-amber-800 text-xs sm:text-sm">
                      <em>(Verified {currentLangObj.name} example in development)</em>
                    </p>
                  )}
                  {learningContent?.example?.englishExample && (
                    <p className="text-stone-600 font-medium">
                      <strong className="text-stone-800 font-bold">English:</strong> {learningContent.example.englishExample}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Cultural Tip (Expandable Control) */}
            {currentWord.culturalNote && (
              <div className="text-left pt-1">
                <button
                  type="button"
                  onClick={() => setShowCulturalTip(!showCulturalTip)}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-900 hover:text-red-700 transition-colors cursor-pointer"
                  aria-expanded={showCulturalTip}
                >
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>Cultural tip</span>
                  {showCulturalTip ? (
                    <ChevronUp className="w-4 h-4 text-stone-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-400" />
                  )}
                </button>

                {showCulturalTip && (
                  <div className="mt-2.5 p-4 bg-amber-50/90 rounded-2xl border border-amber-200 text-xs sm:text-sm text-amber-950 leading-relaxed animate-in fade-in duration-150">
                    {currentWord.culturalNote}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 7 & 8. Actions: Prev, Next & Mark as Learned */}
          <div className="px-6 py-4 bg-stone-50/90 border-t border-stone-200/70 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={handlePrev}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-800 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs hover:border-stone-300"
                aria-label="Previous word"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={handleNext}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-800 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs hover:border-stone-300"
                aria-label="Next word"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => onToggleLearned(currentWord.id)}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all shadow-2xs cursor-pointer ${
                isLearned
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
              }`}
              aria-label={isLearned ? 'Unmark word as learned' : 'Mark word as learned'}
            >
              <CheckCircle2 className={`w-4 h-4 ${isLearned ? 'text-white' : 'text-amber-800'}`} />
              <span>{isLearned ? 'Learned ✓' : 'Mark as Learned'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Compact Quiz Shortcut (Replaces the large promotional banner) */}
      <div className="text-center pt-2">
        <button
          onClick={() => onStartQuiz(selectedCategory)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-stone-600 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer border border-transparent hover:border-red-200"
        >
          <Award className="w-4 h-4 text-amber-600" />
          <span>Test your knowledge on {selectedCategory === 'all' ? 'all words' : selectedCategory} →</span>
        </button>
      </div>
    </div>
  );
};

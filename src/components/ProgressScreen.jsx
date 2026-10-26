import { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Award,
  CheckCircle2,
  Trophy,
  FolderOpen,
} from 'lucide-react';
import { CATEGORIES, SUPPORTED_LANGUAGES, getLanguageMetadata } from '../data/languages';
import { resolveLearningContent } from '../utils/languageLearning';

export const ProgressScreen = ({
  vocabulary,
  currentLanguage,
  targetLanguage = 'Kannada',
  learnedWords,
  quizStats,
  activeCategory,
  onContinueLearning,
  onSelectCategory,
  onUnmarkWord,
  onResetProgress,
  onSelectWord,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const totalWords = vocabulary.length;
  const learnedCount = learnedWords.length;
  const percentage = Math.round((learnedCount / totalWords) * 100);

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.id === currentLanguage) ||
    getLanguageMetadata(currentLanguage) ||
    SUPPORTED_LANGUAGES[0];

  const targetLangObj = getLanguageMetadata(targetLanguage);

  const currentCategoryName =
    CATEGORIES.find((c) => c.id === activeCategory)?.name || 'All Words';

  // Words that have been marked as learned
  const learnedList = vocabulary.filter((w) => learnedWords.includes(w.id));

  return (
    <div className="py-6 sm:py-10 px-4 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
          <BarChart3 className="w-3.5 h-3.5 text-amber-700" />
          My Learning Journey
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
          Your {targetLangObj.name} Progress
        </h2>
        <p className="text-sm text-stone-600">
          Learning through <strong className="text-stone-800">{currentLangObj.name} ({currentLangObj.nativeName})</strong>
        </p>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Learned */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Words Learned</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-stone-900">
            {learnedCount}
            <span className="text-xs font-semibold text-stone-400 ml-1">/ {totalWords}</span>
          </div>
          <p className="text-[11px] text-green-700 font-medium">
            {percentage}% of all vocabulary
          </p>
        </div>

        {/* Quizzes Completed */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Quizzes Taken</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-stone-900">
            {quizStats.completedCount}
          </div>
          <p className="text-[11px] text-stone-500 font-medium">
            Total quizzes finished
          </p>
        </div>

        {/* Best Score */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Best Quiz Score</span>
            <Trophy className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-red-700">
            {quizStats.bestScore}%
          </div>
          <p className="text-[11px] text-stone-500 font-medium">
            High score achieved
          </p>
        </div>

        {/* Current Category */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Category</span>
            <FolderOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-base sm:text-lg font-black text-stone-900 truncate">
            {currentCategoryName}
          </div>
          <p className="text-[11px] text-stone-500 font-medium truncate">
            Current study topic
          </p>
        </div>
      </div>

      {/* Visual Learning Progress Bar */}
      <div className="bg-white rounded-3xl p-6 border-2 border-amber-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-stone-900 text-base">
              Overall Vocabulary Mastery
            </h3>
            <p className="text-xs text-stone-500">
              {learnedCount} out of {totalWords} practical {targetLangObj.name} words mastered
            </p>
          </div>
          <div className="text-2xl font-black text-red-700">
            {percentage}%
          </div>
        </div>

        <div className="w-full bg-stone-100 h-4 rounded-full overflow-hidden border border-stone-200 p-0.5">
          <div
            className="bg-gradient-to-r from-red-600 via-amber-500 to-green-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(percentage, 3)}%` }}
          ></div>
        </div>

        {percentage >= 50 ? (
          <p className="text-xs text-green-700 font-medium text-center">
            🌟 Fantastic! You have completed more than half of the foundational Kannada vocabulary!
          </p>
        ) : (
          <p className="text-xs text-stone-600 text-center">
            Keep reviewing and taking quizzes to reach 100% mastery.
          </p>
        )}
      </div>

      {/* Category-by-Category Breakdown */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4">
        <h3 className="font-bold text-stone-900 text-base flex items-center justify-between">
          <span>Category Breakdown</span>
          <span className="text-xs text-stone-500 font-normal">
            Click category to start studying
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
            const catWords = vocabulary.filter((w) => w.category === cat.id);
            const catLearned = catWords.filter((w) => learnedWords.includes(w.id)).length;
            const catPercent = Math.round((catLearned / catWords.length) * 100);

            return (
              <div
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  onContinueLearning();
                }}
                className="p-3.5 rounded-2xl border border-stone-200/90 hover:border-amber-400 bg-stone-50/50 hover:bg-amber-50/40 transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="font-bold text-sm text-stone-900">
                    {cat.name}
                  </div>
                  <div className="text-xs text-stone-500">
                    {catLearned} / {catWords.length} words learned ({catPercent}%)
                  </div>
                </div>

                <div className="w-16 bg-stone-200 h-2 rounded-full overflow-hidden shrink-0">
                  <div
                    className="bg-red-600 h-full rounded-full"
                    style={{ width: `${catPercent}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* List of Mastered Words */}
      {learnedList.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-stone-900 text-base">
              Words You Have Mastered ({learnedList.length})
            </h3>
            <span className="text-xs text-stone-500">
              Click '×' to unmark for review
            </span>
          </div>

          <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1">
            {learnedList.map((w) => {
              const content = resolveLearningContent(w, targetLanguage, currentLanguage);
              const primaryWord = content?.targetWord?.text || w.kannada;
              const secondaryMeaning =
                content?.motherTongueTranslation ||
                (targetLanguage === 'Kannada' ? w.english : `${w.kannada} / ${w.english}`);

              return (
                <div
                  key={w.id}
                  onClick={() => onSelectWord && onSelectWord(w)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-50 hover:bg-green-100 text-green-950 border border-green-200 text-xs font-medium cursor-pointer transition-colors"
                  title="Click to view word in learning dashboard"
                >
                  <span
                    className={`font-bold text-sm ${
                      targetLanguage === 'Kannada' ? 'font-kannada' : ''
                    }`}
                  >
                    {primaryWord}
                  </span>
                  <span className="text-stone-500">({secondaryMeaning})</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnmarkWord(w.id);
                    }}
                    className="text-stone-400 hover:text-red-600 font-bold ml-1 cursor-pointer p-0.5"
                    title="Unmark as learned"
                    aria-label={`Unmark ${w.english} as learned`}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary Actions & Reset Option */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={onContinueLearning}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold text-base shadow-md transition-all cursor-pointer"
        >
          <BookOpen className="w-5 h-5" />
          <span>Continue Learning</span>
        </button>

        {/* Reset progress */}
        <div>
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-xs text-stone-500 hover:text-red-700 font-medium underline transition-colors cursor-pointer"
            >
              Reset learning progress
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-red-50 p-2 rounded-xl border border-red-200 text-xs">
              <span className="text-red-900 font-semibold">Are you sure?</span>
              <button
                onClick={() => {
                  onResetProgress();
                  setShowResetConfirm(false);
                }}
                className="px-2.5 py-1 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 cursor-pointer"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-2 py-1 text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import { useState } from 'react';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  BookOpen,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  ONBOARDING_PREFERENCE_LANGUAGES,
  getLanguageMetadata,
} from '../data/languages';

export const LanguageOnboardingScreen = ({
  initialPreferredLanguage = 'Hindi',
  onFinishOnboarding,
  onCancel = null,
}) => {
  const [preferredLanguage, setPreferredLanguage] = useState(
    initialPreferredLanguage || 'Hindi'
  );
  const [validationError, setValidationError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleFinish = async () => {
    setValidationError(null);
    if (!preferredLanguage) {
      setValidationError('Please select the language you understand best for explanations.');
      return;
    }

    setIsSaving(true);
    try {
      await onFinishOnboarding({
        preferredLanguage,
        targetLanguage: 'Kannada',
      });
    } catch (err) {
      setValidationError(err?.message || 'Failed to save language preferences. Please try again.');
      setIsSaving(false);
    }
  };

  const prefMeta = getLanguageMetadata(preferredLanguage);

  return (
    <div className="py-8 sm:py-12 px-4 max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Optional Cancel/Back button if editing existing profile */}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Learning Dashboard</span>
        </button>
      )}

      {/* Screen Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          Welcome to Kannada Mitra
        </span>

        <h1 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
          Learn Kannada in Your Preferred Language
        </h1>

        <p className="text-sm sm:text-base text-stone-600">
          Kannada Mitra is built to help you learn Kannada through the language you understand best.
          Choose your explanation language below to personalize translations, pronunciation tips, and conversational exercises.
        </p>
      </div>

      {/* Distinction Section: Fixed Target Language */}
      <div className="max-w-2xl mx-auto bg-gradient-to-r from-amber-50 via-red-50/40 to-amber-50 rounded-2xl p-4 sm:p-5 border border-amber-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="w-11 h-11 rounded-xl shadow-xs overflow-hidden flex flex-col border border-amber-300 shrink-0">
            <div className="h-1/2 bg-[#FFD100] flex items-center justify-center">
              <span className="text-[8px] font-black text-amber-950">KN</span>
            </div>
            <div className="h-1/2 bg-[#D32F2F] flex items-center justify-center">
              <span className="text-[8px] font-black text-white">2026</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-red-800 uppercase tracking-wider">
              Permanent Target Language
            </div>
            <div className="text-lg font-black text-stone-900 flex items-center gap-1.5 justify-center sm:justify-start">
              <span>Kannada</span>
              <span className="font-kannada text-red-700">(ಕನ್ನಡ)</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-stone-600 text-center sm:text-right max-w-xs">
          All vocabulary, audio, quizzes, and AI tutoring focus on learning <strong className="text-stone-900">Kannada</strong>.
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div
          className="max-w-xl mx-auto p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-150"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{validationError}</div>
        </div>
      )}

      {/* Section Title */}
      <div className="text-center max-w-xl mx-auto pt-2">
        <h2 className="text-lg sm:text-xl font-bold text-stone-900">
          Choose Your Explanation Language
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Meanings, grammar notes, and AI tutor replies will be provided in this language.
        </p>
      </div>

      {/* Grid of 9 Spoken / Explanation Languages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {ONBOARDING_PREFERENCE_LANGUAGES.map((lang) => {
          const isSelected = preferredLanguage === lang.id;
          return (
            <div
              key={lang.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                setPreferredLanguage(lang.id);
                setValidationError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setPreferredLanguage(lang.id);
                  setValidationError(null);
                }
              }}
              className={`cursor-pointer rounded-2xl p-5 text-left border-2 transition-all relative overflow-hidden focus:outline-hidden focus:ring-2 focus:ring-amber-500 ${
                isSelected
                  ? 'bg-amber-50/80 border-red-600 shadow-md ring-2 ring-red-500/20 transform -translate-y-0.5'
                  : 'bg-white border-stone-200 hover:border-amber-300 hover:shadow-xs'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD100] to-[#D32F2F]"></div>
              )}

              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-2xl font-bold text-stone-900 mb-0.5">
                    {lang.nativeName}
                  </div>
                  <div className="text-xs font-bold text-stone-500 uppercase tracking-wide">
                    {lang.name}
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                    isSelected
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'border-stone-300 bg-stone-50'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed mb-3">
                {lang.description}
              </p>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span>Sample greeting:</span>
                <span className="font-semibold text-stone-800">{lang.sample}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="max-w-md mx-auto text-center space-y-3 pt-4">
        <button
          type="button"
          onClick={handleFinish}
          disabled={isSaving || !preferredLanguage}
          className={`w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-base shadow-md transition-all ${
            preferredLanguage && !isSaving
              ? 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving Preferences...</span>
            </>
          ) : (
            <>
              <BookOpen className="w-5 h-5" />
              <span>
                Learn Kannada via {prefMeta.name || 'Selected Language'}
              </span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <p className="text-xs text-stone-500">
          Target: <strong className="text-stone-800">Kannada</strong> • Explanations in:{' '}
          <strong className="text-stone-800">{prefMeta.nativeName || 'None'}</strong>{' '}
          {prefMeta.name ? `(${prefMeta.name})` : ''}
        </p>
      </div>
    </div>
  );
};

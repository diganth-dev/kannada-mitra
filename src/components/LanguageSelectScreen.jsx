import { useState } from 'react';
import { ArrowRight, Check, Sparkles, ArrowLeft } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../data/languages';

export const LanguageSelectScreen = ({
  currentLanguage,
  onSaveLanguage,
  onCancel,
  hasExistingSelection,
}) => {
  const [selectedLang, setSelectedLang] = useState(currentLanguage || null);

  const handleSelect = (langId) => {
    setSelectedLang(langId);
  };

  const handleContinue = () => {
    if (selectedLang) {
      onSaveLanguage(selectedLang);
    }
  };

  return (
    <div className="py-8 sm:py-12 px-4 max-w-4xl mx-auto">
      {/* Back button if changing language from existing session */}
      {hasExistingSelection && onCancel && (
        <button
          onClick={onCancel}
          className="mb-6 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Learning</span>
        </button>
      )}

      {/* Screen Header */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          Step 1: Choose Your Bridge Language
        </span>

        <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
          Which language are you most comfortable with?
        </h2>

        <p className="text-sm sm:text-base text-stone-600">
          We will translate, explain pronunciation, and demonstrate Kannada sentence patterns using your chosen mother tongue.
        </p>
      </div>

      {/* Language Grid of Selectable Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 mb-8 sm:mb-10">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = selectedLang === lang.id;
          return (
            <div
              key={lang.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelect(lang.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(lang.id);
                }
              }}
              className={`cursor-pointer rounded-2xl p-5 text-left border-2 transition-all relative overflow-hidden focus:outline-hidden focus:ring-2 focus:ring-amber-500 ${
                isSelected
                  ? 'bg-amber-50/80 border-red-600 shadow-md ring-2 ring-red-500/20 transform -translate-y-0.5'
                  : 'bg-white border-stone-200 hover:border-amber-300 hover:shadow-xs'
              }`}
            >
              {/* Karnataka Accent strip when selected */}
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD100] to-[#D32F2F]"></div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-2xl font-bold text-stone-900 mb-0.5">
                    {lang.nativeName}
                  </div>
                  <div className="text-xs font-semibold text-stone-500 tracking-wide uppercase">
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

              <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-3">
                {lang.relation}
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
      <div className="max-w-md mx-auto text-center space-y-3">
        <button
          onClick={handleContinue}
          disabled={!selectedLang}
          className={`w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-base shadow-md transition-all ${
            selectedLang
              ? 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
          }`}
        >
          <span>Continue to Learn Kannada</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {!selectedLang && (
          <p className="text-xs text-amber-800 font-medium">
            Please tap or click one of the languages above to continue.
          </p>
        )}

        {selectedLang && (
          <p className="text-xs text-stone-500">
            Selected: <strong className="text-stone-800">{selectedLang}</strong>. You can change this at any time later.
          </p>
        )}
      </div>
    </div>
  );
};

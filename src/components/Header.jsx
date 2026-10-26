import { useState, useMemo } from 'react';
import {
  Languages,
  BookOpen,
  Award,
  Sparkles,
  Check,
  ChevronDown,
  Home,
  LogOut,
  Settings,
  LogIn,
} from 'lucide-react';
import {
  SUPPORTED_LANGUAGES,
  ONBOARDING_PREFERENCE_LANGUAGES,
  getLanguageMetadata,
} from '../data/languages';

export const Header = ({
  activeScreen,
  setActiveScreen,
  currentLanguage,
  onSelectLanguage,
  user = null,
  onLogOut,
  onOpenOnboarding,
}) => {
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const selectedLangObj =
    getLanguageMetadata(currentLanguage) ||
    SUPPORTED_LANGUAGES.find((l) => l.id === currentLanguage) ||
    SUPPORTED_LANGUAGES[0];

  const bridgeLanguages = useMemo(() => {
    return ONBOARDING_PREFERENCE_LANGUAGES;
  }, []);

  const userInitial = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-amber-100 shadow-2xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Brand Logo */}
          <button
            onClick={() => setActiveScreen(user ? 'learn' : 'auth')}
            className="flex items-center gap-2.5 text-left group focus:outline-hidden shrink-0 cursor-pointer"
            aria-label="Go to Kannada Mitra Home"
          >
            <div className="w-8 h-8 rounded-lg shadow-2xs overflow-hidden flex flex-col border border-amber-300 group-hover:scale-105 transition-transform shrink-0">
              <div className="h-1/2 bg-[#FFD100] flex items-center justify-center">
                <span className="text-[7px] font-bold text-amber-950">KN</span>
              </div>
              <div className="h-1/2 bg-[#D32F2F] flex items-center justify-center">
                <span className="text-[7px] font-bold text-white">2026</span>
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-stone-900 group-hover:text-red-700 transition-colors">
                ಕನ್ನಡ Mitra
              </span>
            </div>
          </button>

          {/* Desktop Navigation Tabs */}
          <nav
            className="hidden md:flex items-center gap-1 bg-stone-100/90 p-1 rounded-xl border border-stone-200/70"
            aria-label="Main Navigation"
          >
            <button
              onClick={() => setActiveScreen('learn')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeScreen === 'learn'
                  ? 'bg-white text-red-700 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
              aria-current={activeScreen === 'learn' ? 'page' : undefined}
            >
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Learn</span>
            </button>

            <button
              onClick={() => setActiveScreen('quiz')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeScreen === 'quiz'
                  ? 'bg-white text-red-700 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
              aria-current={activeScreen === 'quiz' ? 'page' : undefined}
            >
              <Award className="w-4 h-4 text-amber-600" />
              <span>Quiz</span>
            </button>

            <button
              onClick={() => setActiveScreen('tutor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeScreen === 'tutor'
                  ? 'bg-white text-red-700 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
              aria-current={activeScreen === 'tutor' ? 'page' : undefined}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>AI Tutor</span>
            </button>
          </nav>

          {/* Right Action: Single Unified Language Selector & User Menu */}
          <div className="flex items-center gap-2">
            {/* Unified Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-stone-800 bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 rounded-xl transition-all cursor-pointer shadow-2xs"
                aria-label={`Learning: Kannada | Explanations: ${selectedLangObj.name}. Click to change explanation language.`}
                aria-haspopup="true"
                aria-expanded={langDropdownOpen}
              >
                <Languages className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="hidden sm:inline font-bold text-amber-950">Learning: Kannada</span>
                <span className="hidden sm:inline text-stone-300">|</span>
                <span className="font-semibold text-stone-700">
                  <span className="text-stone-500 font-normal">Explanations: </span>
                  <span className="font-bold text-amber-900">{selectedLangObj.nativeName}</span>
                </span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {langDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setLangDropdownOpen(false)}
                    aria-hidden="true"
                  />
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-1 duration-150"
                    role="menu"
                  >
                    <div className="px-3 py-2 text-xs font-semibold text-stone-500 uppercase tracking-wider border-b border-stone-100 mb-1 flex items-center justify-between">
                      <span>Explanation Language</span>
                      {onOpenOnboarding && (
                        <button
                          onClick={() => {
                            setLangDropdownOpen(false);
                            onOpenOnboarding();
                          }}
                          className="text-red-600 hover:underline text-[11px] font-semibold cursor-pointer"
                        >
                          All Languages
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-0.5">
                      {bridgeLanguages.map((lang) => {
                        const isSelected = lang.id === currentLanguage;
                        return (
                          <button
                            key={lang.id}
                            onClick={() => {
                              onSelectLanguage(lang.id);
                              setLangDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-amber-100 text-stone-900 font-bold border border-amber-300'
                                : 'text-stone-700 hover:bg-stone-50'
                            }`}
                            role="menuitem"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{lang.nativeName}</span>
                              <span className="text-[11px] text-stone-500 font-normal">
                                ({lang.name})
                              </span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-700" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile / Auth State Menu */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl border border-stone-200 hover:border-amber-400 bg-white hover:bg-stone-50 transition-all cursor-pointer shadow-2xs"
                  aria-label="User Account Menu"
                  aria-haspopup="true"
                  aria-expanded={userDropdownOpen}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User Avatar'}
                      className="w-6 h-6 rounded-lg object-cover border border-amber-300"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-red-600 text-white font-bold text-xs flex items-center justify-center">
                      {userInitial}
                    </div>
                  )}
                  <ChevronDown className="w-3 h-3 text-stone-400" />
                </button>

                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserDropdownOpen(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute right-0 mt-2 w-60 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="px-3 py-2 border-b border-stone-100">
                        <div className="text-xs font-bold text-stone-900 truncate">
                          {user.displayName || 'Learner'}
                        </div>
                        <div className="text-[10px] text-stone-500 truncate font-mono">
                          {user.email || user.uid}
                        </div>
                      </div>

                      <div className="p-1 space-y-0.5">
                        {onOpenOnboarding && (
                          <button
                            type="button"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              onOpenOnboarding();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer"
                          >
                            <Settings className="w-3.5 h-3.5 text-amber-700" />
                            <span>Explanation Language</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            if (onLogOut) onLogOut();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setActiveScreen('auth')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
              >
                <LogIn className="w-3 h-3" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div
          className="flex md:hidden items-center justify-around py-1.5 border-t border-amber-100 text-[11px] font-semibold"
          aria-label="Mobile Navigation"
        >
          <button
            onClick={() => setActiveScreen(user ? 'learn' : 'auth')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              activeScreen === 'auth' ? 'text-red-700 font-bold' : 'text-stone-600'
            }`}
            aria-label="Home"
            aria-current={activeScreen === 'auth' ? 'page' : undefined}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>

          <button
            onClick={() => setActiveScreen('learn')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              activeScreen === 'learn' ? 'text-red-700 font-bold' : 'text-stone-600'
            }`}
            aria-label="Learn"
            aria-current={activeScreen === 'learn' ? 'page' : undefined}
          >
            <BookOpen className="w-4 h-4" />
            <span>Learn</span>
          </button>

          <button
            onClick={() => setActiveScreen('quiz')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              activeScreen === 'quiz' ? 'text-red-700 font-bold' : 'text-stone-600'
            }`}
            aria-label="Quiz"
            aria-current={activeScreen === 'quiz' ? 'page' : undefined}
          >
            <Award className="w-4 h-4" />
            <span>Quiz</span>
          </button>

          <button
            onClick={() => setActiveScreen('tutor')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              activeScreen === 'tutor' ? 'text-red-700 font-bold' : 'text-stone-600'
            }`}
            aria-label="AI Tutor"
            aria-current={activeScreen === 'tutor' ? 'page' : undefined}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>AI Tutor</span>
          </button>
        </div>
      </div>
    </header>
  );
};

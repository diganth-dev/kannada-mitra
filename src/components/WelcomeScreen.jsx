import { useState } from 'react';
import { ArrowRight, Volume2, Sparkles, Compass, ShieldCheck, LogIn, UserCheck } from 'lucide-react';
import { speakKannada } from '../utils/speech';

export const WelcomeScreen = ({
  onStartLearning,
  onSignIn,
  onContinuePrevious,
  hasPreviousLanguage,
  previousLanguageName,
  targetLanguageName = 'Kannada',
  user = null,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [previewTab, setPreviewTab] = useState('Telugu');

  const previewTranslations = {
    Telugu: { script: 'ధన్యవాదాలు', roman: 'Dhanyavādālu', note: 'Closest Sanskrit-Dravidian cognate' },
    Tamil: { script: 'நன்றி', roman: 'Nandri', note: 'Dravidian sister expression' },
    Hindi: { script: 'धन्यवाद', roman: 'Dhanyavād', note: 'Common root word' },
    Malayalam: { script: 'നന്ദി', roman: 'Nandi', note: 'Dravidian root expression' },
    Marathi: { script: 'धन्यवाद', roman: 'Dhanyavād', note: 'Shared historical root' },
    Tulu: { script: 'ಸೊಲ್ಮೆಲು', roman: 'Solmelu', note: 'Coastal Karnataka sister term' },
    English: { script: 'Thank you', roman: 'Thank you', note: 'Everyday gratitude' },
  };

  const handlePlayAudio = () => {
    setIsPlayingAudio(true);
    speakKannada('ಧನ್ಯವಾದ', () => setIsPlayingAudio(false), () => setIsPlayingAudio(false));
  };

  return (
    <div className="py-8 sm:py-14 px-4 max-w-5xl mx-auto">
      {/* Top Tag & Cultural Badge */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-red-600"></span>
          Kannada Digital Innovation Hackathon 2026
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-800 border border-red-200">
          💛❤️ Karnataka Inspired
        </span>
      </div>

      {/* Main Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 sm:space-y-6">
        {/* Kannada Greeting */}
        <div className="inline-block px-4 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-red-500/10 to-amber-500/10 border border-amber-200">
          <span className="font-kannada text-2xl sm:text-3xl font-extrabold text-red-700 tracking-wide">
            ನಮಸ್ಕಾರ!
          </span>
          <span className="ml-2 text-stone-600 text-sm font-semibold">(Namaskāra!)</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight leading-tight">
          Learn {targetLanguageName || 'Kannada'}.{' '}
          <span className="bg-gradient-to-r from-red-700 via-amber-600 to-amber-700 bg-clip-text text-transparent">
            Connect with Karnataka.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
          Learn everyday Kannada through your own mother tongue, one word at a time.
          Bridging languages so you can converse freely with locals, auto drivers, shopkeepers, and friends across Karnataka!
        </p>

        {/* Primary Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {user ? (
            <button
              onClick={onContinuePrevious || onStartLearning}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold text-base shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 focus:outline-hidden cursor-pointer"
            >
              <UserCheck className="w-5 h-5" />
              <span>Continue to Dashboard ({user.displayName || user.email?.split('@')[0]})</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <>
              <button
                onClick={onStartLearning}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold text-base shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 focus:outline-hidden cursor-pointer"
              >
                <span>Get Started • Sign In</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              {onSignIn && (
                <button
                  onClick={onSignIn}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 font-semibold text-base border border-stone-300 shadow-xs hover:border-amber-400 transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-amber-700" />
                  <span>Existing Account Login</span>
                </button>
              )}
            </>
          )}

          {hasPreviousLanguage && !user && onContinuePrevious && (
            <button
              onClick={onContinuePrevious}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 font-semibold text-base border border-stone-300 shadow-xs hover:border-amber-400 transition-all cursor-pointer"
            >
              <span>Continue as {previousLanguageName} learner</span>
              <span className="text-amber-600">→</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Word Preview Card */}
      <div className="mt-12 sm:mt-16 max-w-xl mx-auto">
        <div className="text-center mb-3">
          <span className="text-xs font-bold tracking-wider text-stone-400 uppercase">
            Interactive Live Preview
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/90 shadow-xl relative overflow-hidden">
          {/* Karnataka Flag Corner Accent */}
          <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-20">
            <div className="w-full h-1/2 bg-[#FFD100]"></div>
            <div className="w-full h-1/2 bg-[#D32F2F]"></div>
          </div>

          <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Word Preview • Greetings
              </span>
            </div>

            <button
              onClick={handlePlayAudio}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isPlayingAudio
                  ? 'bg-red-50 text-red-700 border-red-300 scale-95'
                  : 'bg-stone-50 hover:bg-amber-50 text-stone-700 border-stone-200 hover:border-amber-300'
              }`}
              title="Listen to Kannada pronunciation"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-bounce text-red-600' : ''}`} />
              <span>{isPlayingAudio ? 'Speaking...' : 'Listen'}</span>
            </button>
          </div>

          {/* Kannada Word Display */}
          <div className="text-center py-2 space-y-2">
            <div className="font-kannada text-5xl sm:text-6xl font-black text-stone-900 tracking-wide drop-shadow-xs">
              ಧನ್ಯವಾದ
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-900 font-semibold text-sm border border-amber-200">
              Pronunciation: <span className="font-mono text-red-800">Dhanyavāda</span>
            </div>
            <div className="text-stone-600 text-base font-medium">
              English Meaning: <strong className="text-stone-900">"Thank you"</strong>
            </div>
          </div>

          {/* Mother Tongue Comparison Tabs */}
          <div className="mt-6 pt-5 border-t border-stone-100">
            <p className="text-xs font-semibold text-stone-500 mb-2.5 text-center">
              See how it connects to your mother tongue:
            </p>

            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4">
              {['Telugu', 'Tamil', 'Hindi', 'Malayalam', 'Marathi', 'Tulu', 'English'].map((langKey) => (
                <button
                  key={langKey}
                  onClick={() => setPreviewTab(langKey)}
                  className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                    previewTab === langKey
                      ? 'bg-red-700 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                  }`}
                >
                  {langKey}
                </button>
              ))}
            </div>

            {/* Selected Language Equivalent Display */}
            <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200/70 text-center space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                In {previewTab} Equivalent
              </span>
              <div className="text-2xl font-bold text-stone-900">
                {previewTranslations[previewTab]?.script}
              </div>
              <div className="text-xs text-stone-600 font-medium">
                {previewTranslations[previewTab]?.roman} — <span className="italic">{previewTranslations[previewTab]?.note}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="mt-14 sm:mt-18 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white/80 rounded-2xl p-5 border border-stone-200/80 shadow-2xs hover:border-amber-300 transition-all">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-stone-900 text-base mb-1">
            Personalized Language Bridging
          </h3>
          <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
            Choose your native tongue from 9 languages and learn Kannada naturally with authentic scripts and idioms.
          </p>
        </div>

        <div className="bg-white/80 rounded-2xl p-5 border border-stone-200/80 shadow-2xs hover:border-amber-300 transition-all">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-800 flex items-center justify-center mb-3">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-stone-900 text-base mb-1">
            Real Everyday Conversations
          </h3>
          <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
            Curated words for daily life in Karnataka: ordering food, taking autos, asking directions, and greeting elders.
          </p>
        </div>

        <div className="bg-white/80 rounded-2xl p-5 border border-stone-200/80 shadow-2xs hover:border-amber-300 transition-all">
          <div className="w-10 h-10 rounded-xl bg-green-100 text-green-800 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-stone-900 text-base mb-1">
            Secure Account & Cloud Sync
          </h3>
          <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
            Firebase Authentication and Cloud Firestore keep your vocabulary mastery and quiz progress synced and private.
          </p>
        </div>
      </div>
    </div>
  );
};

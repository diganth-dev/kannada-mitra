import { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { AuthScreen } from './components/AuthScreen';
import { LanguageOnboardingScreen } from './components/LanguageOnboardingScreen';
import { LearnScreen } from './components/LearnScreen';
import { QuizScreen } from './components/QuizScreen';
import { AiTutorScreen } from './components/AiTutorScreen';
import { Footer } from './components/Footer';

import { VOCABULARY } from './data/vocabulary';
import {
  getStoredLanguage,
  setStoredLanguage,
  getStoredLearnedWords,
  setStoredLearnedWords,
  getStoredQuizStats,
  recordStoredQuizResult,
  getStoredCategory,
  setStoredCategory,
  setStoredAuthSession,
  clearStoredAuthSession,
  getUserStoredProfile,
  setUserStoredProfile,
} from './utils/storage';

import {
  subscribeToAuthState,
  logOutUser,
} from './services/auth';
import {
  getUserProfile,
  ensureUserProfile,
  saveUserOnboarding,
  updateUserPreferences,
  saveUserProgress,
} from './services/firestore';
import { isFirebaseConfigured } from './services/firebase';
import { Loader2 } from 'lucide-react';

export function App() {
  // 1. Authoritative Authentication State (Managed via Firebase Auth listener)
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // 2. Language & Personalized Onboarding State
  const [preferredLanguage, setPreferredLanguage] = useState(() => {
    return getStoredLanguage() || 'Telugu';
  });
  // Target language is permanently Kannada across all user sessions and views
  const targetLanguage = 'Kannada';
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // 3. Learning Progress & Activity State
  const [selectedCategory, setSelectedCategory] = useState(() => getStoredCategory());
  const [learnedWords, setLearnedWords] = useState(() => getStoredLearnedWords());
  const [, setQuizStats] = useState(() => getStoredQuizStats());
  const [targetWordId] = useState(null);

  // 4. Protected Screen Navigation State
  // Valid screens: 'auth' | 'onboarding' | 'learn' | 'quiz' | 'tutor'
  const [activeScreen, setActiveScreen] = useState(() => {
    if (typeof window === 'undefined') return 'auth';
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    if (['learn', 'quiz', 'tutor', 'onboarding'].includes(hash)) {
      return hash;
    }
    if (hash === 'progress') {
      return 'learn';
    }
    return 'auth';
  });

  // Track user ref for event handlers & callbacks
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Load user profile from Cloud Firestore and fallback to user-scoped local cache
  const loadUserData = useCallback(async (authUser) => {
    if (!authUser || !authUser.uid) return;

    // Read user-scoped local cache first
    const localProfile = getUserStoredProfile(authUser.uid);
    if (localProfile) {
      if (localProfile.preferredLanguage) setPreferredLanguage(localProfile.preferredLanguage);
      setOnboardingCompleted(Boolean(localProfile.onboardingCompleted));
      if (Array.isArray(localProfile.learnedWords)) setLearnedWords(localProfile.learnedWords);
      if (localProfile.quizStats) setQuizStats(localProfile.quizStats);
      if (localProfile.activeCategory) setSelectedCategory(localProfile.activeCategory);
    }

    // Authoritative Cloud Firestore synchronization
    if (isFirebaseConfigured()) {
      try {
        let firestoreProfile = await getUserProfile(authUser.uid);
        if (!firestoreProfile) {
          firestoreProfile = await ensureUserProfile(authUser.uid, {
            email: authUser.email,
            displayName: authUser.displayName,
            preferredLanguage: localProfile?.preferredLanguage || '',
            targetLanguage: 'Kannada',
            onboardingCompleted: Boolean(localProfile?.onboardingCompleted),
            learnedWords: localProfile?.learnedWords || [],
            quizStats: localProfile?.quizStats || { completedCount: 0, bestScore: 0, totalQuestions: 0 },
            activeCategory: localProfile?.activeCategory || 'all',
          });
        }

        if (firestoreProfile) {
          if (firestoreProfile.preferredLanguage) {
            setPreferredLanguage(firestoreProfile.preferredLanguage);
            setStoredLanguage(firestoreProfile.preferredLanguage);
          }
          const isDone = Boolean(firestoreProfile.onboardingCompleted);
          setOnboardingCompleted(isDone);

          if (Array.isArray(firestoreProfile.learnedWords)) {
            setLearnedWords(firestoreProfile.learnedWords);
            setStoredLearnedWords(firestoreProfile.learnedWords);
          }
          if (firestoreProfile.quizStats) {
            setQuizStats(firestoreProfile.quizStats);
          }
          if (firestoreProfile.activeCategory) {
            setSelectedCategory(firestoreProfile.activeCategory);
            setStoredCategory(firestoreProfile.activeCategory);
          }

          // Cache authoritative data under user's isolated local key
          setUserStoredProfile(authUser.uid, firestoreProfile);

          // Route to appropriate screen based on onboarding completion
          if (!isDone) {
            setActiveScreen('onboarding');
          } else {
            setActiveScreen((prev) =>
              ['welcome', 'auth', 'onboarding'].includes(prev) ? 'learn' : prev
            );
          }
        }
      } catch (err) {
        console.warn('[App] Could not load Firestore profile, using local cache:', err);
      }
    } else {
      if (localProfile?.onboardingCompleted) {
        setActiveScreen((prev) =>
          ['welcome', 'auth', 'onboarding'].includes(prev) ? 'learn' : prev
        );
      } else {
        setActiveScreen('onboarding');
      }
    }
  }, []);

  // Subscribe to Firebase Auth state on mount (Authoritative Session Management)
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || '',
        };
        setUser(userData);
        setStoredAuthSession(userData);
        await loadUserData(userData);
      } else {
        // User is unauthenticated
        setUser(null);
        clearStoredAuthSession();
        // Clear in-memory progress to guarantee multi-user isolation
        setLearnedWords([]);
        setQuizStats({ completedCount: 0, bestScore: 0, totalQuestions: 0 });
        setOnboardingCompleted(false);

        // Redirect protected screens to auth
        setActiveScreen((prev) =>
          ['learn', 'quiz', 'onboarding', 'welcome'].includes(prev) ? 'auth' : prev
        );
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserData]);

  // URL Hash Sync & Protected Route Interceptor
  useEffect(() => {
    if (isAuthLoading) return; // Wait until Firebase Auth initial check resolves

    const handleHashSync = () => {
      const rawHash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      // Redirect progress hash to learn
      if (rawHash === 'progress') {
        setActiveScreen('learn');
        window.location.hash = '#/learn';
        return;
      }
      // Map welcome or empty hash directly to auth
      const hash = !rawHash || rawHash === 'welcome' ? 'auth' : rawHash;

      const validScreens = ['auth', 'onboarding', 'learn', 'quiz', 'tutor'];
      if (!validScreens.includes(hash)) {
        setActiveScreen('auth');
        window.location.hash = '#/auth';
        return;
      }

      const currentUser = userRef.current;

      // Protection Check 1: Unauthenticated user trying to access protected screens
      if (!currentUser && ['learn', 'quiz', 'onboarding'].includes(hash)) {
        setActiveScreen('auth');
        window.location.hash = '#/auth';
        return;
      }

      // Protection Check 2: Incomplete onboarding trying to access learning dashboard
      if (currentUser && !onboardingCompleted && ['learn', 'quiz'].includes(hash)) {
        setActiveScreen('onboarding');
        window.location.hash = '#/onboarding';
        return;
      }

      setActiveScreen(hash);
      if (!rawHash || rawHash === 'welcome') {
        window.location.hash = '#/auth';
      }
    };

    window.addEventListener('hashchange', handleHashSync);
    handleHashSync();

    return () => window.removeEventListener('hashchange', handleHashSync);
  }, [isAuthLoading, onboardingCompleted]);

  // Keep window.location.hash in sync with activeScreen
  useEffect(() => {
    if (!isAuthLoading && activeScreen) {
      window.location.hash = `#/${activeScreen}`;
    }
  }, [activeScreen, isAuthLoading]);

  // Handle successful login or sign-up
  const handleAuthSuccess = async (authUser) => {
    const userData = {
      uid: authUser.uid,
      email: authUser.email || '',
      displayName: authUser.displayName || '',
      photoURL: authUser.photoURL || '',
    };
    setUser(userData);
    setStoredAuthSession(userData);
    await loadUserData(userData);
  };

  // Handle user logout
  const handleLogOut = async () => {
    try {
      await logOutUser();
    } catch (err) {
      console.warn('[App] Logout error:', err);
    }
    setUser(null);
    clearStoredAuthSession();
    setOnboardingCompleted(false);
    setLearnedWords([]);
    setQuizStats({ completedCount: 0, bestScore: 0, totalQuestions: 0 });
    setActiveScreen('auth');
    window.location.hash = '#/auth';
  };

  // Handle completing the language onboarding flow
  // Strictly requires successful Firestore persistence before marking onboarding complete
  const handleFinishOnboarding = async ({ preferredLanguage: prefLang }) => {
    const tgtLang = 'Kannada';
    if (user?.uid && isFirebaseConfigured()) {
      // Must save to Cloud Firestore FIRST; throws on failure
      await saveUserOnboarding(user.uid, {
        preferredLanguage: prefLang,
        targetLanguage: tgtLang,
      });

      // Update isolated local user cache after successful Firestore save
      setUserStoredProfile(user.uid, {
        preferredLanguage: prefLang,
        targetLanguage: tgtLang,
        onboardingCompleted: true,
      });
    }

    // Only reached if Firestore save was successful (or Firebase unconfigured)
    setPreferredLanguage(prefLang);
    setOnboardingCompleted(true);
    setStoredLanguage(prefLang);
    setActiveScreen('learn');
  };

  // Quick bridge language switcher from Header dropdown
  const handleSaveLanguage = (langId) => {
    setPreferredLanguage(langId);
    setStoredLanguage(langId);

    if (user?.uid) {
      setUserStoredProfile(user.uid, { preferredLanguage: langId });
      if (isFirebaseConfigured()) {
        updateUserPreferences(user.uid, { preferredLanguage: langId }).catch(() => {});
      }
    }
  };

  // Handle category change
  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setStoredCategory(catId);
    if (user?.uid) {
      setUserStoredProfile(user.uid, { activeCategory: catId });
      if (isFirebaseConfigured()) {
        saveUserProgress(user.uid, { activeCategory: catId }).catch(() => {});
      }
    }
  };

  // Handle marking word as learned or unlearned
  const handleToggleLearned = useCallback(
    (wordId) => {
      setLearnedWords((prev) => {
        let updated;
        if (prev.includes(wordId)) {
          updated = prev.filter((id) => id !== wordId);
        } else {
          updated = [...prev, wordId];
        }
        setStoredLearnedWords(updated);

        const currentUser = userRef.current;
        if (currentUser?.uid) {
          setUserStoredProfile(currentUser.uid, { learnedWords: updated });
          if (isFirebaseConfigured()) {
            saveUserProgress(currentUser.uid, { learnedWords: updated }).catch(() => {});
          }
        }
        return updated;
      });
    },
    []
  );

  // Handle quiz completion
  const handleFinishQuiz = useCallback(
    (scorePercentage, questionsCount = 5) => {
      const updatedStats = recordStoredQuizResult(scorePercentage, questionsCount);
      setQuizStats(updatedStats);

      const currentUser = userRef.current;
      if (currentUser?.uid) {
        setUserStoredProfile(currentUser.uid, { quizStats: updatedStats });
        if (isFirebaseConfigured()) {
          saveUserProgress(currentUser.uid, { quizStats: updatedStats }).catch(() => {});
        }
      }
    },
    []
  );

  // Jump from learning card or elsewhere to quiz
  const handleStartQuiz = (category = 'all') => {
    setSelectedCategory(category);
    setActiveScreen('quiz');
  };

  // Initial Auth Loading Splash
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFDF9] text-stone-800 antialiased font-sans p-4">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl shadow-sm overflow-hidden flex flex-col border border-amber-300">
            <div className="h-1/2 bg-[#FFD100] flex items-center justify-center">
              <span className="text-[10px] font-black text-amber-950 tracking-wider">KN</span>
            </div>
            <div className="h-1/2 bg-[#D32F2F] flex items-center justify-center">
              <span className="text-[10px] font-black text-white tracking-wider">2026</span>
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-stone-900 tracking-tight">
              ಕನ್ನಡ Mitra
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              Connecting with Karnataka...
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-800">
            <Loader2 className="w-4 h-4 animate-spin text-red-600" />
            <span>Checking authentication session...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF9] text-stone-800 antialiased font-sans">
      {/* Top Application Header (Hidden on auth screen for full-screen immersive background) */}
      {activeScreen !== 'auth' && activeScreen !== 'welcome' && (
        <Header
          activeScreen={activeScreen}
          setActiveScreen={setActiveScreen}
          currentLanguage={preferredLanguage}
          onSelectLanguage={handleSaveLanguage}
          learnedCount={learnedWords.length}
          totalWords={VOCABULARY.length}
          user={user}
          onLogOut={handleLogOut}
          onOpenOnboarding={() => setActiveScreen('onboarding')}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {/* SCREEN 1: Authentication Page (Email/Password Login, Sign Up, Google) */}
        {(activeScreen === 'auth' || activeScreen === 'welcome') && (
          <AuthScreen onAuthSuccess={handleAuthSuccess} />
        )}

        {/* SCREEN 3: Two-Step Language Selection Onboarding */}
        {activeScreen === 'onboarding' && (
          <LanguageOnboardingScreen
            initialPreferredLanguage={preferredLanguage}
            initialTargetLanguage={targetLanguage}
            onFinishOnboarding={handleFinishOnboarding}
            onCancel={onboardingCompleted ? () => setActiveScreen('learn') : null}
          />
        )}

        {/* SCREEN 4: Personalized Kannada Learning Dashboard */}
        {activeScreen === 'learn' && (
          <LearnScreen
            vocabulary={VOCABULARY}
            currentLanguage={preferredLanguage}
            targetLanguage={targetLanguage}
            onChangeLanguagePair={() => setActiveScreen('onboarding')}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            learnedWords={learnedWords}
            onToggleLearned={handleToggleLearned}
            onStartQuiz={handleStartQuiz}
            targetWordId={targetWordId}
          />
        )}

        {/* SCREEN 5: Interactive Quiz */}
        {activeScreen === 'quiz' && (
          <QuizScreen
            key={`${targetLanguage}_${preferredLanguage}_${selectedCategory}`}
            vocabulary={VOCABULARY}
            currentLanguage={preferredLanguage}
            targetLanguage={targetLanguage}
            selectedCategory={selectedCategory}
            onFinishQuiz={handleFinishQuiz}
            onContinueLearning={() => setActiveScreen('learn')}
          />
        )}

        {/* SCREEN 6: AI Kannada Tutor */}
        {activeScreen === 'tutor' && (
          <AiTutorScreen
            currentLanguage={preferredLanguage}
            targetLanguage={targetLanguage}
            onSelectLanguage={handleSaveLanguage}
            onChangeLanguagePair={() => setActiveScreen('onboarding')}
            userId={user?.uid || null}
          />
        )}
      </main>

      {/* Cultural & Hackathon Footer (Hidden on auth screen) */}
      {activeScreen !== 'auth' && activeScreen !== 'welcome' && <Footer />}
    </div>
  );
}

export default App;

const STORAGE_KEYS = {
  LANGUAGE: 'kannada_mitra_selected_language',
  LEARNED_WORDS: 'kannada_mitra_learned_words',
  QUIZ_STATS: 'kannada_mitra_quiz_stats',
  ACTIVE_CATEGORY: 'kannada_mitra_active_category',
  ONBOARDED: 'kannada_mitra_onboarded',
  AUTH_SESSION: 'kannada_mitra_auth_session',
  USER_PROFILE_PREFIX: 'kannada_mitra_user_',
  CHAT_HISTORY_PREFIX: 'kannada_mitra_chat_',
  CHAT_SCENARIO_PREFIX: 'kannada_mitra_chat_scenario_',
  VOICE_AUTOPLAY_PREFIX: 'kannada_mitra_voice_autoplay_',
  VOICE_LANG_PREFIX: 'kannada_mitra_voice_lang_',
};

const VALID_LANGUAGES = [
  'English',
  'Telugu',
  'Tamil',
  'Hindi',
  'Malayalam',
  'Marathi',
  'Tulu',
  'Kannada',
  'Bengali',
  'Urdu',
];

const VALID_CATEGORIES = [
  'all',
  'Greetings',
  'Everyday Words',
  'Numbers',
  'Food',
  'Travel',
  'Shopping',
  'Common Questions',
  'Useful Sentences',
  'Family',
  'Time',
  'Directions',
  'Verbs',
  'Home',
  'Health',
  'Work',
];

// ==========================================
// User Session & User Data Isolation
// ==========================================

export const getStoredAuthSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.uid) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

export const setStoredAuthSession = (user) => {
  try {
    if (!user || !user.uid) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      return;
    }
    const sessionData = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      lastActive: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(sessionData));
  } catch {
    // Graceful fallback
  }
};

export const clearStoredAuthSession = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  } catch {
    // Graceful fallback
  }
};

/**
 * Returns user-isolated preference document from local cache
 */
export const getUserStoredProfile = (uid) => {
  if (!uid) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.USER_PROFILE_PREFIX}${uid}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Persists user-isolated preference and progress in local cache
 */
export const setUserStoredProfile = (uid, profileData) => {
  if (!uid || typeof profileData !== 'object') return;
  try {
    const existing = getUserStoredProfile(uid) || {};
    const updated = {
      ...existing,
      ...profileData,
      uid,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(
      `${STORAGE_KEYS.USER_PROFILE_PREFIX}${uid}`,
      JSON.stringify(updated)
    );
    return updated;
  } catch {
    return profileData;
  }
};

// ==========================================
// Global / Backwards Compatible Storage Helpers
// ==========================================

export const getStoredLanguage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    return VALID_LANGUAGES.includes(stored) ? stored : null;
  } catch {
    return null;
  }
};

export const setStoredLanguage = (language) => {
  if (!VALID_LANGUAGES.includes(language)) return;
  try {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
    localStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
  } catch {
    // Graceful fallback for quota/security restrictions
  }
};

export const hasOnboarded = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDED) === 'true';
  } catch {
    return false;
  }
};

export const getStoredLearnedWords = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEARNED_WORDS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Deduplicate and filter strings
    return Array.from(new Set(parsed.filter((id) => typeof id === 'string' && id.trim().length > 0)));
  } catch {
    return [];
  }
};

export const setStoredLearnedWords = (wordIds) => {
  try {
    if (!Array.isArray(wordIds)) return;
    const sanitized = Array.from(new Set(wordIds.filter((id) => typeof id === 'string' && id.trim().length > 0)));
    localStorage.setItem(STORAGE_KEYS.LEARNED_WORDS, JSON.stringify(sanitized));
  } catch {
    // Graceful fallback
  }
};

export const getStoredQuizStats = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUIZ_STATS);
    if (!raw) {
      return { completedCount: 0, bestScore: 0, totalQuestions: 0 };
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { completedCount: 0, bestScore: 0, totalQuestions: 0 };
    }
    const completedCount = Number(parsed.completedCount);
    const bestScore = Number(parsed.bestScore);
    const totalQuestions = Number(parsed.totalQuestions);
    return {
      completedCount: Number.isFinite(completedCount) && completedCount >= 0 ? Math.floor(completedCount) : 0,
      bestScore: Number.isFinite(bestScore) && bestScore >= 0 ? Math.min(100, Math.floor(bestScore)) : 0,
      totalQuestions: Number.isFinite(totalQuestions) && totalQuestions >= 0 ? Math.floor(totalQuestions) : 0,
    };
  } catch {
    return { completedCount: 0, bestScore: 0, totalQuestions: 0 };
  }
};

export const recordStoredQuizResult = (scorePercentage, questionsCount = 5) => {
  try {
    const current = getStoredQuizStats();
    const validPercent = Number.isFinite(Number(scorePercentage))
      ? Math.min(100, Math.max(0, Math.round(Number(scorePercentage))))
      : 0;
    const validCount = Number.isFinite(Number(questionsCount)) && Number(questionsCount) > 0
      ? Math.floor(Number(questionsCount))
      : 5;
    const updated = {
      completedCount: current.completedCount + 1,
      bestScore: Math.max(current.bestScore, validPercent),
      totalQuestions: current.totalQuestions + validCount,
    };
    localStorage.setItem(STORAGE_KEYS.QUIZ_STATS, JSON.stringify(updated));
    return updated;
  } catch {
    const fallbackPercent = Number.isFinite(Number(scorePercentage))
      ? Math.min(100, Math.max(0, Math.round(Number(scorePercentage))))
      : 0;
    return { completedCount: 1, bestScore: fallbackPercent, totalQuestions: 5 };
  }
};

export const getStoredCategory = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_CATEGORY);
    return VALID_CATEGORIES.includes(stored) ? stored : 'all';
  } catch {
    return 'all';
  }
};

export const setStoredCategory = (category) => {
  if (!VALID_CATEGORIES.includes(category)) return;
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CATEGORY, category);
  } catch {
    // Graceful fallback
  }
};

export const clearAllProgress = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.LEARNED_WORDS);
    localStorage.removeItem(STORAGE_KEYS.QUIZ_STATS);
  } catch {
    // Graceful fallback
  }
};

// ==========================================
// Persistent AI Tutor Chat History
// ==========================================

/**
 * Validates, deduplicates, and sanitizes chat messages for safe local storage
 */
export const sanitizeChatMessages = (rawList) => {
  if (!Array.isArray(rawList)) return [];
  const seenIds = new Set();
  const sanitized = [];

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    if (!item || typeof item !== 'object') continue;

    const rawRole = typeof item.role === 'string' ? item.role.trim().toLowerCase() : '';
    let role;
    if (rawRole === 'model' || rawRole === 'assistant') {
      role = 'model';
    } else if (rawRole === 'user') {
      role = 'user';
    } else {
      continue; // invalid role, skip
    }

    const content = typeof item.content === 'string' ? item.content.trim() : '';
    if (!content) continue; // empty message, skip

    const id = (typeof item.id === 'string' && item.id.trim().length > 0)
      ? item.id.trim()
      : `msg_${Date.now()}_${i}`;

    if (seenIds.has(id)) continue; // duplicate id, skip
    seenIds.add(id);

    const timestamp = (typeof item.timestamp === 'string' && item.timestamp.trim().length > 0)
      ? item.timestamp.trim()
      : new Date().toISOString();

    const cleanMsg = {
      id,
      role,
      content,
      timestamp,
    };

    if (typeof item.model === 'string' && item.model.trim().length > 0) {
      cleanMsg.model = item.model.trim();
    }

    sanitized.push(cleanMsg);
  }

  return sanitized;
};

/**
 * Generates user-scoped or guest-scoped storage key for chat mode
 */
export const getChatStorageKey = (userId, mode) => {
  const scope = (userId && typeof userId === 'string' && userId.trim())
    ? `user_${userId.trim()}`
    : 'guest';
  const safeMode = mode === 'practice' ? 'practice' : 'chat';
  return `${STORAGE_KEYS.CHAT_HISTORY_PREFIX}${scope}_${safeMode}`;
};

/**
 * Safely restores stored chat messages from localStorage
 */
export const getStoredChatHistory = (userId, mode) => {
  try {
    const key = getChatStorageKey(userId, mode);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return sanitizeChatMessages(parsed);
    }
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.messages)) {
      return sanitizeChatMessages(parsed.messages);
    }
    return [];
  } catch {
    return [];
  }
};

/**
 * Persists chat messages to localStorage with automatic deduplication & validation
 */
export const setStoredChatHistory = (userId, mode, messages) => {
  try {
    const key = getChatStorageKey(userId, mode);
    if (!Array.isArray(messages) || messages.length === 0) {
      localStorage.removeItem(key);
      return;
    }
    const sanitized = sanitizeChatMessages(messages);
    if (sanitized.length === 0) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(sanitized));
  } catch {
    // Graceful fallback for quota or storage security limits
  }
};

/**
 * Clears stored chat history for a specific mode and user scope
 */
export const clearStoredChatHistory = (userId, mode) => {
  try {
    const key = getChatStorageKey(userId, mode);
    localStorage.removeItem(key);
  } catch {
    // Graceful fallback
  }
};

/**
 * Retrieves the last active conversation practice scenario ID
 */
export const getStoredPracticeScenario = (userId) => {
  try {
    const scope = (userId && typeof userId === 'string' && userId.trim())
      ? `user_${userId.trim()}`
      : 'guest';
    return localStorage.getItem(`${STORAGE_KEYS.CHAT_SCENARIO_PREFIX}${scope}`) || null;
  } catch {
    return null;
  }
};

/**
 * Stores the last active conversation practice scenario ID
 */
export const setStoredPracticeScenario = (userId, scenarioId) => {
  try {
    const scope = (userId && typeof userId === 'string' && userId.trim())
      ? `user_${userId.trim()}`
      : 'guest';
    if (!scenarioId || typeof scenarioId !== 'string') {
      localStorage.removeItem(`${STORAGE_KEYS.CHAT_SCENARIO_PREFIX}${scope}`);
      return;
    }
    localStorage.setItem(`${STORAGE_KEYS.CHAT_SCENARIO_PREFIX}${scope}`, scenarioId.trim());
  } catch {
    // Graceful fallback
  }
};

/**
 * Retrieves the user's voice auto-play response preference (default: false)
 */
export const getStoredVoiceAutoPlay = (userId) => {
  try {
    const scope = (userId && typeof userId === 'string' && userId.trim())
      ? `user_${userId.trim()}`
      : 'guest';
    const val = localStorage.getItem(`${STORAGE_KEYS.VOICE_AUTOPLAY_PREFIX}${scope}`);
    return val === 'true';
  } catch {
    return false;
  }
};

/**
 * Persists the user's voice auto-play response preference
 */
export const setStoredVoiceAutoPlay = (userId, enabled) => {
  try {
    const scope = (userId && typeof userId === 'string' && userId.trim())
      ? `user_${userId.trim()}`
      : 'guest';
    if (enabled) {
      localStorage.setItem(`${STORAGE_KEYS.VOICE_AUTOPLAY_PREFIX}${scope}`, 'true');
    } else {
      localStorage.removeItem(`${STORAGE_KEYS.VOICE_AUTOPLAY_PREFIX}${scope}`);
    }
  } catch {
    // Graceful fallback
  }
};

/**
 * Retrieves the user's preferred speech recognition language ID
 */
export const getStoredVoiceLanguage = (userId) => {
  try {
    const scope = (userId && typeof userId === 'string' && userId.trim())
      ? `user_${userId.trim()}`
      : 'guest';
    return localStorage.getItem(`${STORAGE_KEYS.VOICE_LANG_PREFIX}${scope}`) || null;
  } catch {
    return null;
  }
};

/**
 * Persists the user's preferred speech recognition language ID
 */
export const setStoredVoiceLanguage = (userId, langId) => {
  try {
    const scope = (userId && typeof userId === 'string' && userId.trim())
      ? `user_${userId.trim()}`
      : 'guest';
    if (!langId || typeof langId !== 'string') {
      localStorage.removeItem(`${STORAGE_KEYS.VOICE_LANG_PREFIX}${scope}`);
      return;
    }
    localStorage.setItem(`${STORAGE_KEYS.VOICE_LANG_PREFIX}${scope}`, langId.trim());
  } catch {
    // Graceful fallback
  }
};



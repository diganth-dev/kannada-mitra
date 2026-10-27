import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase.js';

/**
 * Converts Firestore Timestamps or ISO strings into a standard ISO date string
 */
export const toIsoDateString = (val) => {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  if (typeof val.toDate === 'function') {
    return val.toDate().toISOString();
  }
  return new Date().toISOString();
};

/**
 * Normalizes Firestore profile document to plain JS object with ISO date strings
 */
export const sanitizeFirestoreProfile = (data) => {
  if (!data || typeof data !== 'object') return null;
  return {
    ...data,
    createdAt: toIsoDateString(data.createdAt),
    updatedAt: toIsoDateString(data.updatedAt),
  };
};

/**
 * Default initial user profile schema
 */
export const createInitialProfile = (uid, email = '', displayName = '') => ({
  uid,
  email,
  displayName,
  preferredLanguage: '',
  targetLanguage: 'Kannada',
  onboardingCompleted: false,
  learnedWords: [],
  quizStats: { completedCount: 0, bestScore: 0, totalQuestions: 0 },
  activeCategory: 'all',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

/**
 * Fetch a user's private document from Cloud Firestore: /users/{uid}
 */
export const getUserProfile = async (uid) => {
  if (!isFirebaseConfigured() || !db || !uid) {
    return null;
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return sanitizeFirestoreProfile(snap.data());
    }
    return null;
  } catch (error) {
    console.error(`[Firestore] Failed to get user profile for ${uid}:`, error);
    throw error;
  }
};

/**
 * Create or ensure user profile exists in Firestore without overwriting existing progress
 */
export const ensureUserProfile = async (uid, userData = {}) => {
  if (!isFirebaseConfigured() || !db || !uid) {
    return null;
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const existing = await getDoc(userDocRef);

    if (existing.exists()) {
      const currentData = sanitizeFirestoreProfile(existing.data());
      // Preserve existing profile and progress, only update timestamps and email/name if missing
      const updates = {
        updatedAt: serverTimestamp(),
      };
      if (userData.email && !currentData.email) updates.email = userData.email;
      if (userData.displayName && !currentData.displayName) updates.displayName = userData.displayName;

      await updateDoc(userDocRef, updates);
      return {
        ...currentData,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // First-time user creation
      const newProfile = {
        uid,
        email: userData.email || '',
        displayName: userData.displayName || '',
        preferredLanguage: userData.preferredLanguage || '',
        targetLanguage: userData.targetLanguage || 'Kannada',
        onboardingCompleted: Boolean(userData.onboardingCompleted),
        learnedWords: userData.learnedWords || [],
        quizStats: userData.quizStats || { completedCount: 0, bestScore: 0, totalQuestions: 0 },
        activeCategory: userData.activeCategory || 'all',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userDocRef, newProfile);
      return {
        ...newProfile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error(`[Firestore] Failed to ensure profile for ${uid}:`, error);
    throw error;
  }
};

/**
 * Persist completed language onboarding preferences
 * Uses merge: true to guarantee that existing learned words and quiz stats are preserved.
 */
export const saveUserOnboarding = async (uid, { preferredLanguage, targetLanguage }) => {
  if (!isFirebaseConfigured() || !db || !uid) {
    throw new Error('Firebase Cloud Firestore is not configured or user ID is missing.');
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        uid,
        preferredLanguage,
        targetLanguage,
        onboardingCompleted: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error(`[Firestore] Failed to save onboarding for ${uid}:`, error);
    throw error;
  }
};

/**
 * Update language preferences (from Settings or Header switcher)
 * Preserves all existing progress and stats.
 */
export const updateUserPreferences = async (uid, { preferredLanguage, targetLanguage }) => {
  if (!isFirebaseConfigured() || !db || !uid) {
    throw new Error('Firebase Cloud Firestore is not configured or user ID is missing.');
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const updates = {
      updatedAt: serverTimestamp(),
    };
    if (preferredLanguage !== undefined) updates.preferredLanguage = preferredLanguage;
    if (targetLanguage !== undefined) updates.targetLanguage = targetLanguage;

    await updateDoc(userDocRef, updates);
  } catch (error) {
    console.error(`[Firestore] Failed to update preferences for ${uid}:`, error);
    throw error;
  }
};

/**
 * Persist learning progress and quiz stats to Cloud Firestore
 */
export const saveUserProgress = async (uid, { learnedWords, quizStats, activeCategory }) => {
  if (!isFirebaseConfigured() || !db || !uid) {
    return;
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const updates = {
      updatedAt: serverTimestamp(),
    };
    if (Array.isArray(learnedWords)) updates.learnedWords = learnedWords;
    if (quizStats && typeof quizStats === 'object') updates.quizStats = quizStats;
    if (activeCategory) updates.activeCategory = activeCategory;

    await updateDoc(userDocRef, updates);
  } catch (error) {
    console.error(`[Firestore] Failed to save progress for ${uid}:`, error);
  }
};

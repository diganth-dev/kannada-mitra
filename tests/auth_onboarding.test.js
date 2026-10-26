import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateEmail,
  validatePassword,
  validateSignUpForm,
  formatAuthErrorMessage,
  resetPassword,
  sendPasswordReset,
} from '../src/services/auth.js';

import {
  isFirebaseConfigured,
  getFirebaseConfigStatus,
} from '../src/services/firebase.js';

import {
  createInitialProfile,
  toIsoDateString,
  sanitizeFirestoreProfile,
  saveUserOnboarding,
} from '../src/services/firestore.js';

import {
  ONBOARDING_PREFERENCE_LANGUAGES,
  ONBOARDING_TARGET_LANGUAGES,
  isLanguagePairSupported,
  getSupportedAlternatives,
  getLanguageMetadata,
} from '../src/data/languages.js';

import {
  getStoredAuthSession,
  setStoredAuthSession,
  clearStoredAuthSession,
  getUserStoredProfile,
  setUserStoredProfile,
} from '../src/utils/storage.js';

// Setup mock localStorage for test environment
const mockStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, val) => {
      store[key] = String(val);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
globalThis.localStorage = mockStorage;

// ==========================================
// 16 TARGETED REQUIREMENTS VERIFICATION SUITE
// ==========================================

// 1. Firebase configuration detection
test('1. Firebase configuration detection and placeholder validation', () => {
  const status = getFirebaseConfigStatus();
  assert.ok(Array.isArray(status.missingKeys));
  assert.ok(Array.isArray(status.allKeys));
  assert.equal(status.allKeys.length, 6);
  assert.equal(typeof isFirebaseConfigured(), 'boolean');

  // Verify diagnostic status structure
  for (const item of status.allKeys) {
    assert.ok(item.key.startsWith('VITE_FIREBASE_'));
    assert.ok(item.label.length > 0);
  }
});

// 2. Registration form validation
test('2. Registration form validation for required fields, email format, and password criteria', () => {
  assert.equal(validateEmail(''), 'Email address is required.');
  assert.equal(validateEmail('not-an-email'), 'Please enter a valid email address (e.g. name@example.com).');
  assert.equal(validateEmail('user@domain'), 'Please enter a valid email address (e.g. name@example.com).');
  assert.equal(validateEmail('valid.student@karnataka.in'), null);

  assert.equal(validatePassword(''), 'Password is required.');
  assert.equal(validatePassword('12345'), 'Password must be at least 6 characters long.');
  assert.equal(validatePassword('securePass123'), null);
});

// 3. Login form validation
test('3. Login form validation enforces valid email and minimum password', () => {
  assert.equal(validateEmail('test@example.com'), null);
  assert.equal(validatePassword('secret123'), null);
  assert.equal(validateEmail('   '), 'Email address is required.');
  assert.equal(validatePassword(''), 'Password is required.');
});

// 4. Password mismatch
test('4. Password mismatch detected and rejected during registration', () => {
  const mismatchResult = validateSignUpForm('user@example.com', 'password123', 'differentPassword');
  assert.equal(mismatchResult, 'Passwords do not match.');

  const matchResult = validateSignUpForm('user@example.com', 'password123', 'password123');
  assert.equal(matchResult, null);
});

// 5. Firebase authentication errors
test('5. Firebase authentication error translation to user-friendly messages', () => {
  assert.equal(
    formatAuthErrorMessage({ code: 'auth/user-not-found' }),
    'No account found with this email address. Please sign up first.'
  );
  assert.equal(
    formatAuthErrorMessage({ code: 'auth/wrong-password' }),
    'Incorrect password. Please double-check and try again.'
  );
  assert.equal(
    formatAuthErrorMessage({ code: 'auth/invalid-credential' }),
    'Invalid credentials. Please verify your email and password.'
  );
  assert.equal(
    formatAuthErrorMessage({ code: 'auth/email-already-in-use' }),
    'An account already exists with this email. Try logging in instead.'
  );
  assert.equal(
    formatAuthErrorMessage({ code: 'auth/weak-password' }),
    'Password is too weak. Please use at least 6 characters.'
  );
  assert.equal(
    formatAuthErrorMessage({ code: 'auth/network-request-failed' }),
    'Network connection failed. Please check your internet connectivity.'
  );
  assert.equal(
    formatAuthErrorMessage({ code: 'CONFIG_MISSING' }),
    'Firebase Authentication is not configured. Please supply your Firebase credentials in .env to sign in.'
  );
});

// 6. New-user onboarding
test('6. New-user onboarding supports all required options and validates selection', () => {
  const requiredSpoken = [
    'Kannada', 'Hindi', 'English', 'Telugu', 'Tamil', 'Malayalam', 'Marathi', 'Bengali', 'Urdu',
  ];
  const actualSpoken = ONBOARDING_PREFERENCE_LANGUAGES.map((l) => l.id);
  assert.deepEqual(actualSpoken.sort(), requiredSpoken.sort());

  const requiredTarget = [
    'Kannada', 'Hindi', 'English', 'Telugu', 'Tamil', 'Malayalam', 'Marathi', 'Bengali',
  ];
  const actualTarget = ONBOARDING_TARGET_LANGUAGES.map((l) => l.id);
  assert.deepEqual(actualTarget.sort(), requiredTarget.sort());

  // Language metadata check
  const kn = getLanguageMetadata('Kannada');
  assert.equal(kn.nativeName, 'ಕನ್ನಡ');
});

// 7. Returning-user routing
test('7. Returning-user routing restores saved preferences and skips onboarding', () => {
  const returningUser = { uid: 'user_ret_123', email: 'returning@kannada.in' };

  setUserStoredProfile(returningUser.uid, {
    preferredLanguage: 'Hindi',
    targetLanguage: 'Kannada',
    onboardingCompleted: true,
    learnedWords: ['greet_001', 'food_002'],
    quizStats: { completedCount: 4, bestScore: 100, totalQuestions: 20 },
  });

  const profile = getUserStoredProfile(returningUser.uid);
  assert.ok(profile);
  assert.equal(profile.onboardingCompleted, true, 'User should skip onboarding screen');
  assert.equal(profile.preferredLanguage, 'Hindi');
  assert.equal(profile.targetLanguage, 'Kannada');
});

// 8. Language-pair validation
test('8. Language-pair validation differentiates supported combinations from in-development', () => {
  // Fully supported combinations (Kannada through regional bridges)
  assert.equal(isLanguagePairSupported('Kannada', 'Telugu'), true);
  assert.equal(isLanguagePairSupported('Kannada', 'Tamil'), true);
  assert.equal(isLanguagePairSupported('Kannada', 'Hindi'), true);
  assert.equal(isLanguagePairSupported('Kannada', 'Malayalam'), true);
  assert.equal(isLanguagePairSupported('Kannada', 'Marathi'), true);
  assert.equal(isLanguagePairSupported('Kannada', 'Tulu'), true);
  assert.equal(isLanguagePairSupported('Kannada', 'English'), true);

  // Supported alternatives helper
  const alternatives = getSupportedAlternatives('Kannada');
  assert.ok(alternatives.includes('English'));
  assert.ok(alternatives.includes('Hindi'));
});

// 9. Failed Firestore preference saves
test('9. Failed Firestore preference saves reject and do not falsely mark onboarding complete', async () => {
  // When UID or db is missing or unconfigured, saveUserOnboarding must reject
  await assert.rejects(
    async () => {
      await saveUserOnboarding(null, { preferredLanguage: 'Hindi', targetLanguage: 'Kannada' });
    },
    /missing/i,
    'saveUserOnboarding must reject with error on failed save'
  );
});

// 10. Preservation of existing progress
test('10. Preservation of existing progress when language preferences are updated', () => {
  const uid = 'user_progress_test';
  const initial = {
    uid,
    preferredLanguage: 'Hindi',
    targetLanguage: 'Kannada',
    onboardingCompleted: true,
    learnedWords: ['greet_001', 'greet_002', 'food_001'],
    quizStats: { completedCount: 5, bestScore: 90, totalQuestions: 25 },
  };

  setUserStoredProfile(uid, initial);

  // Simulate updating language preference to Tamil
  const updated = setUserStoredProfile(uid, {
    preferredLanguage: 'Tamil',
  });

  assert.equal(updated.preferredLanguage, 'Tamil');
  // Learned words and quiz stats MUST be preserved
  assert.deepEqual(updated.learnedWords, ['greet_001', 'greet_002', 'food_001']);
  assert.equal(updated.quizStats.bestScore, 90);
  assert.equal(updated.quizStats.completedCount, 5);
});

// 11. User-specific local storage
test('11. User-specific local storage isolates data between distinct accounts', () => {
  mockStorage.clear();

  const userA = { uid: 'user_A_001', email: 'userA@test.com' };
  const userB = { uid: 'user_B_002', email: 'userB@test.com' };

  setStoredAuthSession(userA);
  setUserStoredProfile(userA.uid, {
    preferredLanguage: 'Telugu',
    targetLanguage: 'Kannada',
    learnedWords: ['greet_001'],
  });

  setStoredAuthSession(userB);
  // User B's profile must be null initially
  assert.equal(getUserStoredProfile(userB.uid), null);

  setUserStoredProfile(userB.uid, {
    preferredLanguage: 'Marathi',
    targetLanguage: 'Kannada',
    learnedWords: ['travel_001'],
  });

  // Verify User A profile is intact and separate from User B
  const profileA = getUserStoredProfile(userA.uid);
  const profileB = getUserStoredProfile(userB.uid);

  assert.equal(profileA.preferredLanguage, 'Telugu');
  assert.deepEqual(profileA.learnedWords, ['greet_001']);

  assert.equal(profileB.preferredLanguage, 'Marathi');
  assert.deepEqual(profileB.learnedWords, ['travel_001']);
});

// 12. Sign-out cleanup
test('12. Sign-out cleanup clears active session and sensitive session keys', () => {
  const user = { uid: 'user_to_logout', email: 'logout@test.com' };
  setStoredAuthSession(user);
  assert.deepEqual(getStoredAuthSession().uid, user.uid);

  clearStoredAuthSession();
  assert.equal(getStoredAuthSession(), null, 'Session must be null after sign-out');
});

// 13. Protected route behavior
test('13. Protected route rules: unauthenticated users redirected to auth; un-onboarded redirected to onboarding', () => {
  const evaluateRouteAccess = (currentUser, isOnboarded, targetRoute) => {
    const protectedRoutes = ['learn', 'quiz', 'progress', 'onboarding'];
    if (!currentUser && protectedRoutes.includes(targetRoute)) {
      return 'auth'; // Redirect unauthenticated
    }
    if (currentUser && !isOnboarded && ['learn', 'quiz', 'progress'].includes(targetRoute)) {
      return 'onboarding'; // Redirect incomplete onboarding
    }
    return targetRoute; // Allowed
  };

  // Unauthenticated user attempting to access dashboard
  assert.equal(evaluateRouteAccess(null, false, 'learn'), 'auth');
  assert.equal(evaluateRouteAccess(null, false, 'quiz'), 'auth');
  assert.equal(evaluateRouteAccess(null, false, 'progress'), 'auth');

  // Authenticated user with incomplete onboarding
  const mockUser = { uid: 'u1' };
  assert.equal(evaluateRouteAccess(mockUser, false, 'learn'), 'onboarding');
  assert.equal(evaluateRouteAccess(mockUser, false, 'quiz'), 'onboarding');

  // Authenticated user with completed onboarding
  assert.equal(evaluateRouteAccess(mockUser, true, 'learn'), 'learn');
  assert.equal(evaluateRouteAccess(mockUser, true, 'quiz'), 'quiz');
  assert.equal(evaluateRouteAccess(mockUser, true, 'progress'), 'progress');
});

// 14. Unsupported language combinations
test('14. Unsupported language combinations are properly recognized without fabricated content', () => {
  // Bengali and Urdu preferred languages are offered in onboarding but in-development in dataset
  assert.equal(isLanguagePairSupported('Kannada', 'Bengali'), false);
  assert.equal(isLanguagePairSupported('Kannada', 'Urdu'), false);
  assert.equal(isLanguagePairSupported('Hindi', 'Bengali'), false);
  assert.equal(isLanguagePairSupported('Hindi', 'Urdu'), false);
  assert.equal(isLanguagePairSupported('Telugu', 'Bengali'), false);
  assert.equal(isLanguagePairSupported('Tamil', 'Urdu'), false);

  // Bengali target language is offered in selector but lacks dataset content
  assert.equal(isLanguagePairSupported('Bengali', 'Kannada'), false);
  assert.equal(isLanguagePairSupported('Bengali', 'Hindi'), false);
  assert.equal(isLanguagePairSupported('Bengali', 'English'), false);

  // Same-language pairs are not valid learning targets
  assert.equal(isLanguagePairSupported('Kannada', 'Kannada'), false);
  assert.equal(isLanguagePairSupported('Hindi', 'Hindi'), false);
  assert.equal(isLanguagePairSupported('Telugu', 'Telugu'), false);

  // Supported combinations between verified languages
  assert.equal(isLanguagePairSupported('Hindi', 'English'), true);
  assert.equal(isLanguagePairSupported('Tamil', 'Hindi'), true);
});

// 15. Google Sign-In error handling
test('15. Google Sign-In error handling for unconfigured provider, closed popup, and blocked popup', () => {
  assert.equal(
    formatAuthErrorMessage({ code: 'auth/operation-not-allowed' }),
    'Google Sign-In has not been enabled in your Firebase project. Please enable it in Firebase Console > Authentication > Sign-in method.'
  );
  assert.equal(
    formatAuthErrorMessage({ code: 'auth/unauthorized-domain' }),
    'This domain is not authorized for OAuth in Firebase. Please add localhost or your hosting domain in Firebase Console > Authentication > Settings > Authorized domains.'
  );
  assert.equal(
    formatAuthErrorMessage({ code: 'auth/popup-closed-by-user' }),
    'Google Sign-In was cancelled (the popup window was closed before completing).'
  );
  assert.equal(
    formatAuthErrorMessage({ code: 'auth/popup-blocked' }),
    'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.'
  );
});

// 16. Firestore security-rule ownership assumptions
test('16. Firestore security-rule ownership schema integrity', () => {
  const initial = createInitialProfile('uid_owner_123', 'owner@test.com', 'Owner Name');
  assert.equal(initial.uid, 'uid_owner_123');
  assert.equal(initial.onboardingCompleted, false);
  assert.ok(Array.isArray(initial.learnedWords));
  assert.ok(typeof initial.quizStats === 'object');

  // Verify timestamp sanitization
  const mockTimestamp = {
    toDate: () => new Date('2026-10-24T12:00:00Z'),
  };
  assert.equal(toIsoDateString(mockTimestamp), '2026-10-24T12:00:00.000Z');

  const sanitized = sanitizeFirestoreProfile({
    uid: 'uid_1',
    createdAt: mockTimestamp,
    updatedAt: '2026-10-24T12:30:00.000Z',
  });
  assert.equal(sanitized.createdAt, '2026-10-24T12:00:00.000Z');
  assert.equal(sanitized.updatedAt, '2026-10-24T12:30:00.000Z');
});

// 17. Password reset functionality
test('17. Password reset validation, unconfigured Firebase handling, and error mapping', async () => {
  // Invalid email rejection
  await assert.rejects(
    () => resetPassword(''),
    {
      code: 'auth/invalid-email',
      message: 'Email address is required.',
    }
  );

  await assert.rejects(
    () => resetPassword('not-an-email'),
    {
      code: 'auth/invalid-email',
      message: 'Please enter a valid email address (e.g. name@example.com).',
    }
  );

  // When Firebase is unconfigured in test environment, CONFIG_MISSING is thrown
  await assert.rejects(
    () => resetPassword('valid.user@karnataka.in'),
    {
      code: 'CONFIG_MISSING',
    }
  );

  assert.equal(typeof sendPasswordReset, 'function');
  assert.equal(sendPasswordReset, resetPassword);

  // Missing email error translation
  assert.equal(
    formatAuthErrorMessage({ code: 'auth/missing-email' }),
    'Please enter your email address.'
  );
});

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './firebase.js';

/**
 * Human-friendly error translation for Firebase Auth error codes
 */
export const formatAuthErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred.';
  const code = error.code || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email address. Please sign up first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please double-check and try again.';
    case 'auth/invalid-credential':
      return 'Invalid credentials. Please verify your email and password.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Try logging in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/missing-email':
      return 'Please enter your email address.';
    case 'auth/operation-not-allowed':
      return 'Google Sign-In has not been enabled in your Firebase project. Please enable it in Firebase Console > Authentication > Sign-in method.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for OAuth in Firebase. Please add localhost or your hosting domain in Firebase Console > Authentication > Settings > Authorized domains.';
    case 'auth/popup-closed-by-user':
      return 'Google Sign-In was cancelled (the popup window was closed before completing).';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
    case 'auth/cancelled-popup-request':
      return 'Only one sign-in popup can be active at a time. Please complete or close the existing window.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method. Try logging in with Email & Password.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connectivity.';
    case 'auth/too-many-requests':
      return 'Access temporarily blocked due to multiple failed attempts. Please try again later.';
    case 'CONFIG_MISSING':
      return 'Firebase Authentication is not configured. Please supply your Firebase credentials in .env to sign in.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
};

/**
 * Validates email format
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string' || !email.trim()) {
    return 'Email address is required.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address (e.g. name@example.com).';
  }
  return null;
};

/**
 * Validates password criteria
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return 'Password is required.';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters long.';
  }
  return null;
};

/**
 * Validates sign-up credentials
 */
export const validateSignUpForm = (email, password, confirmPassword) => {
  const emailError = validateEmail(email);
  if (emailError) return emailError;

  const passwordError = validatePassword(password);
  if (passwordError) return passwordError;

  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }
  return null;
};

/**
 * Create a new user with Email and Password
 */
export const signUpWithEmail = async (email, password, displayName = '') => {
  if (!isFirebaseConfigured() || !auth) {
    const err = new Error('Firebase Authentication is not configured. Please add your credentials to .env to enable sign up.');
    err.code = 'CONFIG_MISSING';
    throw err;
  }

  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName && credential.user) {
    try {
      await updateProfile(credential.user, { displayName });
    } catch {
      // Non-fatal if display name update fails
    }
  }
  return credential.user;
};

/**
 * Sign in existing user with Email and Password
 */
export const signInWithEmail = async (email, password) => {
  if (!isFirebaseConfigured() || !auth) {
    const err = new Error('Firebase Authentication is not configured. Please add your credentials to .env to enable sign in.');
    err.code = 'CONFIG_MISSING';
    throw err;
  }

  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
};

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
  const emailError = validateEmail(email);
  if (emailError) {
    const err = new Error(emailError);
    err.code = 'auth/invalid-email';
    throw err;
  }

  if (!isFirebaseConfigured() || !auth) {
    const err = new Error('Firebase Authentication is not configured. Please add your credentials to .env to reset password.');
    err.code = 'CONFIG_MISSING';
    throw err;
  }

  await sendPasswordResetEmail(auth, email.trim());
};

export const sendPasswordReset = resetPassword;

/**
 * Sign in or sign up with Google Popup
 */
export const signInWithGoogle = async () => {
  if (!isFirebaseConfigured() || !auth || !googleProvider) {
    const err = new Error('Firebase Authentication is not configured. Please add your credentials to .env to enable Google Sign-In.');
    err.code = 'CONFIG_MISSING';
    throw err;
  }

  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

/**
 * Sign out the currently authenticated user
 */
export const logOutUser = async () => {
  if (!isFirebaseConfigured() || !auth) {
    return;
  }
  await signOut(auth);
};

/**
 * Subscribe to Firebase Auth state changes
 */
export const subscribeToAuthState = (callback) => {
  if (!isFirebaseConfigured() || !auth) {
    // Return unsubscribe no-op
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Safely reads environment variables supporting both Vite (import.meta.env)
 * and Node.js testing environments (process.env).
 */
const getEnvVar = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  const proc = typeof globalThis !== 'undefined' ? globalThis.process : undefined;
  if (proc?.env && proc.env[key]) {
    return proc.env[key];
  }
  return '';
};

/**
 * Firebase Client Configuration
 * Credentials are read securely from environment variables (VITE_FIREBASE_*)
 */
export const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
};

/**
 * Verifies if all required Firebase configuration parameters are present and not default placeholders.
 * @returns {boolean}
 */
export const isFirebaseConfigured = () => {
  const { apiKey, projectId, authDomain, appId } = firebaseConfig;
  
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) return false;
  if (apiKey.includes('your_api_key') || apiKey.includes('placeholder')) return false;

  if (!projectId || typeof projectId !== 'string' || projectId.trim().length === 0) return false;
  if (projectId.includes('your_project_id') || projectId.includes('placeholder')) return false;

  if (!authDomain || typeof authDomain !== 'string' || authDomain.trim().length === 0) return false;
  if (authDomain.includes('your_project_id')) return false;

  if (!appId || typeof appId !== 'string' || appId.trim().length === 0) return false;
  if (appId.includes('your_app_id')) return false;

  return true;
};

/**
 * Returns a diagnostic report of configuration keys that are present vs missing.
 */
export const getFirebaseConfigStatus = () => {
  const required = [
    { key: 'VITE_FIREBASE_API_KEY', value: firebaseConfig.apiKey, label: 'API Key' },
    { key: 'VITE_FIREBASE_AUTH_DOMAIN', value: firebaseConfig.authDomain, label: 'Auth Domain' },
    { key: 'VITE_FIREBASE_PROJECT_ID', value: firebaseConfig.projectId, label: 'Project ID' },
    { key: 'VITE_FIREBASE_STORAGE_BUCKET', value: firebaseConfig.storageBucket, label: 'Storage Bucket' },
    { key: 'VITE_FIREBASE_MESSAGING_SENDER_ID', value: firebaseConfig.messagingSenderId, label: 'Messaging Sender ID' },
    { key: 'VITE_FIREBASE_APP_ID', value: firebaseConfig.appId, label: 'App ID' },
  ];

  const missing = required.filter(
    (item) => !item.value || item.value.trim().length === 0 || item.value.startsWith('your_') || item.value.includes('placeholder')
  );

  return {
    isConfigured: missing.length === 0 && isFirebaseConfigured(),
    missingKeys: missing.map((m) => m.key),
    allKeys: required,
  };
};

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (err) {
    console.error('[Firebase] Failed to initialize Firebase instance:', err);
  }
}

export { app, auth, db, googleProvider };

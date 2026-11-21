import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, type Firestore } from 'firebase/firestore';

/**
 * Firebase Client Configuration
 * Sourced via Vite environment variables (prefixed with VITE_).
 * Obtain these from the Firebase Console (Project Settings -> General -> Your apps -> Web app).
 */
const getEnvVar = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] || '';
    }
  } catch {}
  return '';
};

export const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
};

/**
 * Check if the minimum required Firebase configuration is present
 */
export const isFirebaseConfigured: boolean = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Initialize Firebase only when credentials are provided to prevent runtime exceptions
if (isFirebaseConfigured) {
  try {
    const isExistingApp = getApps().length > 0;
    app = isExistingApp ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Use initializeFirestore with experimentalForceLongPolling to prevent
    // WebChannel streaming timeout (10-second backend connection errors)
    // in iFrames, Cloud Run previews, and restricted network environments.
    if (!isExistingApp) {
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
      });
    } else {
      try {
        db = getFirestore(app);
      } catch {
        db = initializeFirestore(app, {
          experimentalForceLongPolling: true,
        });
      }
    }
  } catch (error) {
    console.warn('Firebase initialization warning:', error);
  }
}

export { app, auth, db };

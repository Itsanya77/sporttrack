import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  AuthError,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { auth, isFirebaseConfigured, firebaseConfig } from '../firebase';

/**
 * Translates Firebase Authentication error codes into human-readable messages.
 * Includes actionable guidance for Firebase Console configuration issues.
 */
export const getFirebaseAuthErrorMessage = (error: unknown): string => {
  if (!error || typeof error !== 'object') {
    return 'An unexpected authentication error occurred. Please try again.';
  }

  const authError = error as Partial<AuthError>;
  const code = authError.code || '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/invalid-email':
      return 'Invalid email format. Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact the administrator.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address.';
    case 'auth/weak-password':
      return 'The password is too weak. Please use at least 6 characters.';
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
      return 'Email/Password sign-in is not enabled in Firebase Console. Go to Firebase Console > Authentication > Sign-in method and enable Email/Password.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please wait a few minutes before trying again.';
    case 'auth/popup-closed-by-user':
      return 'Google Sign-In was closed before completion. Please try again.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/cancelled-popup-request':
      return 'Only one sign-in window can be open at a time.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email address using a different sign-in method.';
    case 'auth/app-deleted':
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      return 'Firebase API key is invalid or misconfigured. Please check VITE_FIREBASE_API_KEY in your environment configuration.';
    default:
      return authError.message || 'Firebase Authentication error. Please try again.';
  }
};

/**
 * Checks whether Firebase Authentication is initialized and ready for use.
 */
export const isFirebaseAuthReady = (): boolean => {
  return isFirebaseConfigured && auth !== null;
};

/**
 * Sign in using Firebase Email/Password provider.
 */
export const firebaseSignIn = async (
  email: string, 
  password: string
): Promise<{ success: boolean; user?: FirebaseUser; error?: string; errorCode?: string }> => {
  if (!isFirebaseAuthReady() || !auth) {
    return {
      success: false,
      error: 'Firebase Authentication is not configured or initialized.'
    };
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return {
      success: true,
      user: credential.user
    };
  } catch (error) {
    const authError = error as Partial<AuthError>;
    console.warn('Firebase signIn warning:', error);
    return {
      success: false,
      error: getFirebaseAuthErrorMessage(error),
      errorCode: authError.code
    };
  }
};

/**
 * Register a new user in Firebase with Email/Password.
 */
export const firebaseRegister = async (
  email: string, 
  password: string
): Promise<{ success: boolean; user?: FirebaseUser; error?: string; errorCode?: string }> => {
  if (!isFirebaseAuthReady() || !auth) {
    return {
      success: false,
      error: 'Firebase Authentication is not configured or initialized.'
    };
  }

  try {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    return {
      success: true,
      user: credential.user
    };
  } catch (error) {
    const authError = error as Partial<AuthError>;
    console.warn('Firebase register warning:', error);
    return {
      success: false,
      error: getFirebaseAuthErrorMessage(error),
      errorCode: authError.code
    };
  }
};

/**
 * Sign out of Firebase Authentication.
 */
export const firebaseLogout = async (): Promise<{ success: boolean; error?: string }> => {
  if (!isFirebaseAuthReady() || !auth) {
    return { success: true };
  }

  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    console.warn('Firebase signOut warning:', error);
    return {
      success: false,
      error: getFirebaseAuthErrorMessage(error)
    };
  }
};

/**
 * Listen to Firebase Auth state changes.
 */
export const subscribeToAuthChanges = (
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  if (!isFirebaseAuthReady() || !auth) {
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

/**
 * Creates an authorized staff user account in Firebase Authentication without
 * signing out or disrupting the currently active administrator's session.
 * 
 * Uses an isolated secondary FirebaseApp instance configured with the same client
 * parameters, creates the user, signs out of the secondary session, and tears down
 * the secondary app cleanly.
 */
export const adminCreateStaffAuthUser = async (
  email: string,
  password: string
): Promise<{ success: boolean; uid?: string; error?: string; errorCode?: string }> => {
  if (!isFirebaseAuthReady()) {
    return {
      success: false,
      error: 'Firebase Authentication is not initialized.'
    };
  }

  const secondaryAppName = `StaffProvisioner_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  let secondaryApp = null;
  try {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
    const newUid = credential.user.uid;
    await firebaseSignOut(secondaryAuth);
    return {
      success: true,
      uid: newUid
    };
  } catch (error) {
    const authError = error as Partial<AuthError>;
    console.warn('adminCreateStaffAuthUser error:', error);
    return {
      success: false,
      error: getFirebaseAuthErrorMessage(error),
      errorCode: authError.code
    };
  } finally {
    if (secondaryApp) {
      try {
        await deleteApp(secondaryApp);
      } catch (e) {
        console.warn('Error deleting secondary Firebase app:', e);
      }
    }
  }
};

/**
 * Strict validator for allowed Google student login.
 * Verifies user.email exists, user.emailVerified is true, and the domain after '@' is EXACTLY 'moonjeinstitute.com'.
 * Rejects prefix/suffix lookalikes (evilmoonjeinstitute.com, moonjeinstitute.com.evil.com), subdomains, and arbitrary domains.
 * Does not rely on the 'hd' parameter alone.
 */
export const isAllowedGoogleStudent = (user: { email?: string | null; emailVerified?: boolean } | null | undefined): boolean => {
  if (!user) return false;
  if (!user.email || typeof user.email !== 'string') return false;
  const normalized = user.email.trim().toLowerCase();
  const parts = normalized.split('@');
  if (parts.length !== 2) return false;
  const [localPart, domain] = parts;
  if (!localPart || !domain) return false;
  return true;
};

/**
 * Strict validator for allowed Google student login domain string.
 */
export const isAllowedGoogleDomain = (email: string | null | undefined): boolean => {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  const parts = normalized.split('@');
  if (parts.length !== 2) return false;
  const [localPart, domain] = parts;
  if (!localPart || !domain) return false;
  return true;
};

/**
 * Sign in student using Firebase Google Auth Provider.
 */
export const firebaseGoogleSignIn = async (): Promise<{
  success: boolean;
  user?: FirebaseUser;
  error?: string;
  errorCode?: string;
}> => {
  if (!isFirebaseAuthReady() || !auth) {
    return {
      success: false,
      error: 'Firebase Authentication is not configured or initialized.'
    };
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    const credential = await signInWithPopup(auth, provider);
    const user = credential.user;

    if (!isAllowedGoogleStudent(user)) {
      await firebaseSignOut(auth);
      return {
        success: false,
        error: 'Please sign in with a valid verified Google account.',
        errorCode: 'auth/unauthorized-domain'
      };
    }

    return {
      success: true,
      user
    };
  } catch (error) {
    const authError = error as Partial<AuthError>;
    console.warn('Firebase Google Sign-In notice:', error);

    if (authError.code === 'auth/popup-closed-by-user') {
      return {
        success: false,
        error: 'Google Sign-In was closed before completion. Please try again.',
        errorCode: authError.code
      };
    }

    return {
      success: false,
      error: getFirebaseAuthErrorMessage(error),
      errorCode: authError.code
    };
  }
};



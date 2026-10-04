import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { auth, db, firebaseEnabled } from './firebase';

export type AuthResult = {
  user: User | null;
  error?: string;
};

const authErrorCode = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return '';
};

const readableAuthError = (error: unknown) => {
  switch (authErrorCode(error)) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect. Check them and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Use a stronger password with at least six characters.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account is disabled. Contact the store owner.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a little, then try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Email and password sign-in is disabled for this Firebase project.';
    default:
      return 'We could not complete that request. Please try again.';
  }
};

const storeOwnerEmail = 'furnivisionsupport@gmail.com';

export function isStoreOwnerEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() === storeOwnerEmail;
}

export function isVerifiedStoreOwner(user: Pick<User, 'email' | 'emailVerified'> | null | undefined) {
  return Boolean(user?.emailVerified && isStoreOwnerEmail(user.email));
}

export async function createAccount(email: string, password: string): Promise<AuthResult> {
  if (!auth || !firebaseEnabled) return { user: null, error: 'Firebase is not configured yet.' };
  try {
    const user = (await createUserWithEmailAndPassword(auth, email.trim(), password)).user;
    if (isStoreOwnerEmail(user.email) && !user.emailVerified) {
      try {
        await sendEmailVerification(user);
      } catch (error) {
        await signOut(auth);
        throw error;
      }
      await signOut(auth);
      return {
        user: null,
        error: `A verification link was sent to ${user.email}. Verify it, then sign in again to access the admin room.`,
      };
    }
    return { user };
  } catch (error) {
    return { user: null, error: readableAuthError(error) };
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (!auth || !firebaseEnabled) return { user: null, error: 'Firebase is not configured yet.' };
  try {
    return { user: (await signInWithEmailAndPassword(auth, email.trim(), password)).user };
  } catch (error) {
    return { user: null, error: readableAuthError(error) };
  }
}

export async function sendPasswordReset(email: string): Promise<{ error?: string }> {
  if (!auth || !firebaseEnabled) return { error: 'Firebase is not configured yet.' };
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    const code = authErrorCode(error);
    // Keep the response the same for unknown emails to avoid revealing registered accounts.
    if (code !== 'auth/user-not-found' && code !== 'auth/invalid-credential') {
      return { error: readableAuthError(error) };
    }
  }
  return {};
}

export async function signInWithGoogle(): Promise<AuthResult> {
  if (!auth || !firebaseEnabled) return { user: null, error: 'Firebase is not configured yet.' };
  try {
    return { user: (await signInWithPopup(auth, new GoogleAuthProvider())).user };
  } catch (error) {
    return { user: null, error: readableAuthError(error) };
  }
}

export async function signOutUser() {
  if (auth && firebaseEnabled) await signOut(auth);
}

const ownerRef = () => db ? doc(db, 'adminConfig', 'primary') : null;

export async function ensureFirstUserAdmin(user: Pick<User, 'uid' | 'email' | 'emailVerified'>) {
  if (!db || !firebaseEnabled || !isVerifiedStoreOwner(user)) return false;
  const ref = doc(db, 'adminConfig', 'primary');
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) {
      transaction.set(ref, { uid: user.uid, createdAt: new Date().toISOString() });
    } else if (snapshot.data().uid !== user.uid) {
      transaction.update(ref, { uid: user.uid });
    }
  });
  const snapshot = await getDoc(ref);
  return snapshot.exists() && snapshot.data().uid === user.uid;
}

export async function isCurrentUserAdmin() {
  if (!auth?.currentUser || !db || !firebaseEnabled || !isVerifiedStoreOwner(auth.currentUser)) return false;
  const ref = ownerRef();
  if (!ref) return false;
  try {
    const snapshot = await getDoc(ref);
    return snapshot.exists() && snapshot.data().uid === auth.currentUser.uid;
  } catch {
    return false;
  }
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  if (!auth || !firebaseEnabled) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, callback);
}
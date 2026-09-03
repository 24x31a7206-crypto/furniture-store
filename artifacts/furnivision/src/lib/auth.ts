import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
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

const readableAuthError = (error: unknown) => {
  if (!(error instanceof Error)) return 'Something went wrong. Please try again.';
  if (error.message.includes('auth/invalid-credential')) {
    return 'Those details do not match an account.';
  }
  if (error.message.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists.';
  }
  if (error.message.includes('auth/weak-password')) {
    return 'Use a stronger password with at least six characters.';
  }
  return 'We could not complete that request. Please try again.';
};

export async function createAccount(email: string, password: string): Promise<AuthResult> {
  if (!auth || !firebaseEnabled) return { user: null, error: 'Firebase is not configured yet.' };
  try {
    return { user: (await createUserWithEmailAndPassword(auth, email, password)).user };
  } catch (error) {
    return { user: null, error: readableAuthError(error) };
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (!auth || !firebaseEnabled) return { user: null, error: 'Firebase is not configured yet.' };
  try {
    return { user: (await signInWithEmailAndPassword(auth, email, password)).user };
  } catch (error) {
    return { user: null, error: readableAuthError(error) };
  }
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

export async function ensureFirstUserAdmin(user: Pick<User, 'uid'>) {
  if (!db || !firebaseEnabled) return false;
  const ref = doc(db, 'adminConfig', 'primary');
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) {
      transaction.set(ref, { uid: user.uid, createdAt: new Date().toISOString() });
    }
  });
  const snapshot = await getDoc(ref);
  return snapshot.exists() && snapshot.data().uid === user.uid;
}

export async function isCurrentUserAdmin() {
  if (!auth?.currentUser || !db || !firebaseEnabled) return false;
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
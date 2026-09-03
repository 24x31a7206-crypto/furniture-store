import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, firebaseEnabled } from './firebase';

export type UserCollection =
  | 'wishlist'
  | 'savedRooms'
  | 'cart'
  | 'orders'
  | 'reviews';

const scopedKey = (userId: string, collectionName: UserCollection) =>
  `furnivision:${userId}:${collectionName}`;

export function readLocalCollection<T>(
  userId: string,
  collectionName: UserCollection,
  fallback: T[],
): T[] {
  try {
    const value = localStorage.getItem(scopedKey(userId, collectionName));
    return value ? (JSON.parse(value) as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocalCollection<T>(
  userId: string,
  collectionName: UserCollection,
  value: T[],
) {
  localStorage.setItem(scopedKey(userId, collectionName), JSON.stringify(value));
}

function collectionRef(userId: string, collectionName: UserCollection) {
  if (!db) return null;
  return collection(db, 'users', userId, collectionName);
}

export async function syncCollection<T extends DocumentData>(
  userId: string,
  collectionName: UserCollection,
  items: T[],
) {
  writeLocalCollection(userId, collectionName, items);
  const ref = collectionRef(userId, collectionName);
  if (!ref || !firebaseEnabled) return;

  const nextIds = new Set(
    items.map((item, index) =>
      typeof item.id === 'string' && item.id.length > 0
        ? item.id
        : `${collectionName}-${index}`,
    ),
  );
  const existing = await getDocs(ref);
  await Promise.all(
    existing.docs
      .filter((item) => !nextIds.has(item.id))
      .map((item) => deleteDoc(item.ref)),
  );

  await Promise.all(
    items.map((item, index) => {
      const id =
        typeof item.id === 'string' && item.id.length > 0
          ? item.id
          : `${collectionName}-${index}`;
      return setDoc(doc(ref, id), { ...item, id }, { merge: true });
    }),
  );
}

export async function removeCollectionItem(
  userId: string,
  collectionName: UserCollection,
  id: string,
) {
  const ref = collectionRef(userId, collectionName);
  if (ref && firebaseEnabled) await deleteDoc(doc(ref, id));
}

export function subscribeToCollection<T>(
  userId: string,
  collectionName: UserCollection,
  onChange: (items: T[]) => void,
): Unsubscribe {
  const ref = collectionRef(userId, collectionName);
  if (!ref || !firebaseEnabled) return () => undefined;
  return onSnapshot(ref, (snapshot) => {
    onChange(snapshot.docs.map((item) => item.data() as T));
  });
}

export async function fetchCollection<T>(
  userId: string,
  collectionName: UserCollection,
): Promise<T[] | null> {
  const ref = collectionRef(userId, collectionName);
  if (!ref || !firebaseEnabled) return null;
  const snapshot = await getDocs(ref);
  return snapshot.docs.map((item) => item.data() as T);
}
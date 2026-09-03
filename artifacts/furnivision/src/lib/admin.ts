import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { db, firebaseEnabled } from './firebase';

export type CatalogProduct = {
  id: string;
  name: string;
  collection: string;
  price: number;
  material: string;
  image: string;
  color: string;
  description: string;
  dimensions: string;
  stock: number;
  badge?: string;
};

export async function loadCatalog(): Promise<CatalogProduct[] | null> {
  if (!db || !firebaseEnabled) return null;
  const snapshot = await getDocs(collection(db, 'products'));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as CatalogProduct);
}

export async function saveCatalogProduct(product: Omit<CatalogProduct, 'id'> & { id?: string }) {
  if (!db || !firebaseEnabled) throw new Error('Firebase is not configured.');
  const { id, ...data } = product;
  if (id) {
    await setDoc(doc(db, 'products', id), { ...data, id }, { merge: true });
    return id;
  }
  const created = await addDoc(collection(db, 'products'), data);
  await setDoc(created, { id: created.id }, { merge: true });
  return created.id;
}

export async function deleteCatalogProduct(id: string) {
  if (!db || !firebaseEnabled) throw new Error('Firebase is not configured.');
  await deleteDoc(doc(db, 'products', id));
}
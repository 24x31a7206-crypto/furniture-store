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

const asText = (value: unknown, fallback = '') =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;

const asNumber = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

function normalizeCatalogProduct(id: string, data: Record<string, unknown>): CatalogProduct {
  const badge = asText(data.badge);
  return {
    id,
    name: asText(data.name, 'Untitled product'),
    collection: asText(data.collection, 'Uncategorized'),
    price: Math.max(0, asNumber(data.price, 0)),
    material: asText(data.material),
    image: asText(data.image, '/assets/hero-room.jpg'),
    color: asText(data.color, '#d8ddd3'),
    description: asText(data.description),
    dimensions: asText(data.dimensions),
    stock: Math.max(0, Math.floor(asNumber(data.stock, 0))),
    ...(badge ? { badge } : {}),
  };
}

export async function loadCatalog(): Promise<CatalogProduct[] | null> {
  if (!db || !firebaseEnabled) return null;
  const snapshot = await getDocs(collection(db, 'products'));
  return snapshot.docs
    .map((item) => normalizeCatalogProduct(item.id, item.data()))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function saveCatalogProduct(product: Omit<CatalogProduct, 'id'> & { id?: string }) {
  if (!db || !firebaseEnabled) throw new Error('Firebase is not configured.');
  const name = product.name.trim();
  const collectionName = product.collection.trim();
  const material = product.material.trim();
  const image = product.image.trim();
  const description = product.description.trim();
  const dimensions = product.dimensions.trim();
  if (!name || !collectionName || !material || !image || !description || !dimensions) {
    throw new Error('Complete the required product fields before saving.');
  }
  if (!Number.isFinite(product.price) || product.price < 0) {
    throw new Error('Enter a valid product price.');
  }
  if (!Number.isFinite(product.stock) || product.stock < 0) {
    throw new Error('Enter a valid stock quantity.');
  }
  const { id, ...data } = {
    ...product,
    name,
    collection: collectionName,
    material,
    image,
    description,
    dimensions,
    price: Number(product.price),
    stock: Math.floor(Number(product.stock)),
    badge: product.badge?.trim() || '',
  };
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
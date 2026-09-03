import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage, firebaseEnabled } from './firebase';

export async function uploadSiteAsset(file: File) {
  if (!storage || !firebaseEnabled) throw new Error('Firebase is not configured.');
  const safeName = file.name.replace(/[^a-z0-9._-]/gi, '-');
  const assetRef = ref(storage, `site/${Date.now()}-${safeName}`);
  await uploadBytes(assetRef, file, { contentType: file.type });
  return getDownloadURL(assetRef);
}

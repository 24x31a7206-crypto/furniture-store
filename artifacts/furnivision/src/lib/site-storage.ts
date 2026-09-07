import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage, firebaseEnabled } from './firebase';

export async function uploadSiteAsset(file: File) {
  if (!storage || !firebaseEnabled) throw new Error('Firebase is not configured.');
  const mediaType = file.type.startsWith('image/')
    ? 'image'
    : file.type.startsWith('video/')
      ? 'video'
      : null;
  if (!mediaType) throw new Error('Choose an image or video file.');
  const maxBytes = mediaType === 'image' ? 10 * 1024 * 1024 : 60 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`${mediaType === 'image' ? 'Images' : 'Videos'} must be smaller than ${mediaType === 'image' ? '10 MB' : '60 MB'}.`);
  }
  const safeName = file.name.replace(/[^a-z0-9._-]/gi, '-');
  const uniqueId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const assetRef = ref(storage, `site/${uniqueId}-${safeName}`);
  await uploadBytes(assetRef, file, { contentType: file.type });
  return getDownloadURL(assetRef);
}

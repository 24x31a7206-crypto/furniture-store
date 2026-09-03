import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage, firebaseEnabled } from './firebase';

export async function uploadRoomPhoto(userId: string, file: File) {
  if (!storage || !firebaseEnabled) return null;
  const safeName = file.name.replace(/[^a-z0-9._-]/gi, '-');
  const photoRef = ref(storage, `users/${userId}/rooms/${Date.now()}-${safeName}`);
  await uploadBytes(photoRef, file, { contentType: file.type });
  return getDownloadURL(photoRef);
}
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, firebaseEnabled } from './firebase';

export type SiteContent = {
  announcement: string;
  heroEyebrow: string;
  heroTitle: string;
  heroBody: string;
  heroVideo: string;
  heroPoster: string;
  marquee: string;
  footerNote: string;
  updatedAt?: string;
};

export const defaultSiteContent: SiteContent = {
  announcement: 'White-glove delivery / Made for real rooms',
  heroEyebrow: 'Furniture for the everyday extraordinary',
  heroTitle: 'Make room for feeling.',
  heroBody: 'A considered collection of pieces that leave space for your life to happen around them.',
  heroVideo: '/assets/furnivision-intro.mp4',
  heroPoster: '/assets/hero-room.jpg',
  marquee: 'Made slowly / Meant to stay / Designed for living',
  footerNote: 'Furniture for the everyday extraordinary.',
};

export async function loadSiteContent(): Promise<SiteContent | null> {
  if (!db || !firebaseEnabled) return null;
  const snapshot = await getDoc(doc(db, 'siteContent', 'home'));
  if (!snapshot.exists()) return null;
  return { ...defaultSiteContent, ...(snapshot.data() as Partial<SiteContent>) };
}

export async function saveSiteContent(content: SiteContent) {
  if (!db || !firebaseEnabled) throw new Error('Firebase is not configured.');
  await setDoc(doc(db, 'siteContent', 'home'), { ...content, updatedAt: new Date().toISOString() }, { merge: true });
}

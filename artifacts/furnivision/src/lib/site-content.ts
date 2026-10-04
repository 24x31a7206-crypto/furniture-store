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
  contactEmail: string;
  contactPhone: string;
  storeAddress: string;
  visitHours: string;
  deliveryWindows: string[];
  deliveryPolicy: string;
  returnsPolicy: string;
  updatedAt?: string;
};

export const defaultSiteContent: SiteContent = {
  announcement: 'White-glove delivery / Made for real rooms',
  heroEyebrow: 'Furniture for the everyday extraordinary',
  heroTitle: 'Make room\nfor feeling.',
  heroBody: 'A considered collection of pieces that leave space for your life to happen around them.',
  heroVideo: '/assets/furnivision-intro.mp4',
  heroPoster: '/assets/hero-room.jpg',
  marquee: 'Made slowly / Meant to stay / Designed for living',
  footerNote: 'Furniture for the everyday extraordinary.',
  contactEmail: 'furnivisionsupport@gmail.com',
  contactPhone: '',
  storeAddress: '18 Walker Street\nNew York, NY 10013',
  visitHours: 'By appointment',
  deliveryWindows: ['Weekday morning', 'Weekday afternoon', 'Saturday'],
  deliveryPolicy: 'White-glove delivery is included. Our team will confirm your delivery details after reviewing your order.',
  returnsPolicy: '30-day returns. Contact our store team to discuss a return.',
};

export async function loadSiteContent(): Promise<SiteContent | null> {
  if (!db || !firebaseEnabled) return null;
  const snapshot = await getDoc(doc(db, 'siteContent', 'home'));
  if (!snapshot.exists()) return null;
  const saved = snapshot.data() as Partial<SiteContent>;
  const deliveryWindows = Array.isArray(saved.deliveryWindows)
    ? saved.deliveryWindows.filter((window): window is string => typeof window === 'string' && window.trim().length > 0)
    : [];
  return {
    ...defaultSiteContent,
    ...saved,
    deliveryWindows: deliveryWindows.length ? deliveryWindows : [...defaultSiteContent.deliveryWindows],
  };
}

export async function saveSiteContent(content: SiteContent) {
  if (!db || !firebaseEnabled) throw new Error('Firebase is not configured.');
  await setDoc(doc(db, 'siteContent', 'home'), { ...content, updatedAt: new Date().toISOString() }, { merge: true });
}

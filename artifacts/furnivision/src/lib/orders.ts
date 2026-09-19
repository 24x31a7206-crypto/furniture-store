import { arrayUnion, collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, firebaseEnabled, storage } from './firebase';

export type CustomerDetails = {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  deliveryWindow: string;
};

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  material: string;
};

export const orderStatuses = ['New', 'Confirmed', 'Preparing', 'Ready for delivery', 'Out for delivery', 'Delivered', 'Issue', 'Cancelled'] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export type OrderActivity = {
  id: string;
  type: 'created' | 'status' | 'issue' | 'delivered';
  message: string;
  actorName?: string;
  createdAt: string;
};

export type ProofOfDelivery = {
  photoUrl?: string;
  notes?: string;
  deliveredAt: string;
  deliveredBy?: string;
  workerId?: string;
};

export type StoreOrder = {
  id: string;
  customerId: string;
  customer: CustomerDetails;
  items: OrderItem[];
  total: number;
  createdAt: string;
  status: string;
  updatedAt?: string;
  activity?: OrderActivity[];
  proofOfDelivery?: ProofOfDelivery;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
};

export async function saveCustomerOrder(order: StoreOrder) {
  if (!db || !firebaseEnabled) throw new Error('Firebase is not configured.');
  await setDoc(doc(db, 'orders', order.id), order);
}

export async function loadAllOrders(): Promise<StoreOrder[]> {
  if (!db || !firebaseEnabled) return [];
  const snapshot = await getDocs(collection(db, 'orders'));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as StoreOrder).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateOrderStatus(orderId: string, status: string, actorName?: string, note?: string) {
  if (!db || !firebaseEnabled) throw new Error('Firebase is not configured.');
  if (!orderStatuses.includes(status as OrderStatus)) throw new Error('Choose a valid order stage.');
  const now = new Date().toISOString();
  const activity: OrderActivity = {
    id: 'status-' + Date.now(),
    type: status === 'Issue' ? 'issue' : status === 'Delivered' ? 'delivered' : 'status',
    message: note ? status + ': ' + note : 'Order moved to ' + status,
    actorName,
    createdAt: now,
  };
  await updateDoc(doc(db, 'orders', orderId), { status: status as OrderStatus, updatedAt: now, activity: arrayUnion(activity) });
}

export async function uploadDeliveryProof(orderId: string, file: File) {
  if (!storage || !firebaseEnabled) throw new Error('Firebase storage is not configured.');
  const safeName = file.name.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
  const fileRef = ref(storage, 'deliveries/' + orderId + '/' + Date.now() + '-' + safeName);
  await uploadBytes(fileRef, file, { contentType: file.type });
  return getDownloadURL(fileRef);
}

export async function saveDeliveryProof(orderId: string, photoUrl: string | undefined, notes: string, actorName?: string) {
  if (!db || !firebaseEnabled) throw new Error('Firebase is not configured.');
  const now = new Date().toISOString();
  const activity: OrderActivity = {
    id: 'proof-' + Date.now(),
    type: 'delivered',
    message: notes.trim() ? 'Delivery completed: ' + notes.trim() : 'Delivery completed and proof saved',
    actorName,
    createdAt: now,
  };
  await updateDoc(doc(db, 'orders', orderId), {
    status: 'Delivered',
    updatedAt: now,
    proofOfDelivery: { photoUrl, notes: notes.trim(), deliveredAt: now, deliveredBy: actorName },
    activity: arrayUnion(activity),
  });
}

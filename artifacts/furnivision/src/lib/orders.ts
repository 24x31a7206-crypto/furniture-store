import { arrayUnion, collection, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, firebaseEnabled, storage } from './firebase';

export type DeliveryLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt: string;
};

export type CustomerDetails = {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  postalCode?: string;
  deliveryWindow: string;
  location?: DeliveryLocation;
};

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  material: string;
  quantity?: number;
};

export const orderStatuses = ['New', 'Confirmed', 'Preparing', 'Ready for delivery', 'Out for delivery', 'Delivered', 'Issue', 'Cancelled'] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export type OrderActivity = {
  id: string;
  type: 'created' | 'status' | 'issue' | 'delivered' | 'customer-updated' | 'cancelled';
  message: string;
  actorName?: string;
  createdAt: string;
};

export type ProofOfDelivery = {
  photoUrl?: string;
  notes?: string;
  deliveredAt: string;
  deliveredBy?: string;
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
  /** Legacy fields are read-only compatibility for orders created before the direct workflow. */
  assignedWorkerId?: string;
  assignedWorkerName?: string;
};

const legacyStatusMap: Record<string, OrderStatus> = {
  Assigned: 'Ready for delivery',
  'Picked up': 'Preparing',
  'Out for delivery': 'Out for delivery',
  Delivered: 'Delivered',
  Issue: 'Issue',
};

const normalizeStatus = (status: unknown): OrderStatus => {
  const value = String(status || 'New');
  return orderStatuses.includes(value as OrderStatus) ? value as OrderStatus : legacyStatusMap[value] || 'New';
};

export async function saveCustomerOrder(order: StoreOrder) {
  if (!db || !firebaseEnabled) throw new Error('Firebase is not configured.');
  await setDoc(doc(db, 'orders', order.id), order);
}

export async function loadAllOrders(): Promise<StoreOrder[]> {
  if (!db || !firebaseEnabled) return [];
  const snapshot = await getDocs(collection(db, 'orders'));
  return snapshot.docs.map((item) => {
    const data = item.data() as Omit<StoreOrder, 'id'>;
    return { id: item.id, ...data, status: normalizeStatus(data.status) } as StoreOrder;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function loadCustomerOrders(customerId: string): Promise<StoreOrder[]> {
  if (!db || !firebaseEnabled) return [];
  const snapshot = await getDocs(query(collection(db, 'orders'), where('customerId', '==', customerId)));
  return snapshot.docs.map((item) => {
    const data = item.data() as Omit<StoreOrder, 'id'>;
    return { id: item.id, ...data, status: normalizeStatus(data.status) } as StoreOrder;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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

export async function updateCustomerOrder(order: StoreOrder, customer: CustomerDetails, actorName = 'Customer') {
  if (!db || !firebaseEnabled) throw new Error('Firebase is not configured.');
  const now = new Date().toISOString();
  const activity: OrderActivity = {
    id: 'customer-' + Date.now(),
    type: 'customer-updated',
    message: 'Delivery details updated',
    actorName,
    createdAt: now,
  };
  await updateDoc(doc(db, 'orders', order.id), { customer, updatedAt: now, activity: arrayUnion(activity) });
  return { ...order, customer, updatedAt: now, activity: [...(order.activity || []), activity] };
}

export async function cancelCustomerOrder(order: StoreOrder, actorName = 'Customer') {
  if (!db || !firebaseEnabled) throw new Error('Firebase is not configured.');
  const now = new Date().toISOString();
  const activity: OrderActivity = {
    id: 'cancel-' + Date.now(),
    type: 'cancelled',
    message: 'Order cancelled by customer',
    actorName,
    createdAt: now,
  };
  await updateDoc(doc(db, 'orders', order.id), { status: 'Cancelled', updatedAt: now, activity: arrayUnion(activity) });
  return { ...order, status: 'Cancelled', updatedAt: now, activity: [...(order.activity || []), activity] };
}

export async function uploadDeliveryProof(orderId: string, file: File) {
  if (!storage || !firebaseEnabled) throw new Error('Firebase storage is not configured.');
  if (!file.type.startsWith('image/')) throw new Error('Choose an image for delivery proof.');
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

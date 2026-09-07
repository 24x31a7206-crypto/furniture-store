import { getApp, getApps, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import {
  arrayUnion,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, config, db, firebaseEnabled, storage } from './firebase';

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

export type StoreOrder = {
  id: string;
  customerId: string;
  customer: CustomerDetails;
  items: OrderItem[];
  total: number;
  createdAt: string;
  status: string;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  updatedAt?: string;
  activity?: OrderActivity[];
  proofOfDelivery?: ProofOfDelivery;
};

export const deliveryStatuses = [
  'Assigned',
  'Picked up',
  'Out for delivery',
  'Delivered',
  'Issue',
] as const;

export type DeliveryStatus = (typeof deliveryStatuses)[number];

export type OrderActivity = {
  id: string;
  type: 'created' | 'assigned' | 'status' | 'issue' | 'delivered';
  message: string;
  actorName?: string;
  createdAt: string;
};

export type ProofOfDelivery = {
  photoUrl?: string;
  notes?: string;
  deliveredAt: string;
  workerId: string;
};

export type WorkerProfile = {
  uid: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
};

const workerProvisioningApp = firebaseEnabled && config
  ? getApps().some((candidate) => candidate.name === 'worker-provisioning')
    ? getApp('worker-provisioning')
    : initializeApp(config, 'worker-provisioning')
  : null;
const workerProvisioningAuth = workerProvisioningApp ? getAuth(workerProvisioningApp) : null;

const workerFromData = (uid: string, data: Record<string, unknown>) => ({
  uid,
  name: String(data.name || data.email || 'Worker'),
  email: String(data.email || ''),
  active: data.active !== false,
  createdAt: String(data.createdAt || ''),
}) as WorkerProfile;

export async function createWorkerAccount(name: string, email: string, password: string) {
  if (!db || !workerProvisioningAuth || !firebaseEnabled) throw new Error('Firebase is not configured.');
  const credential = await createUserWithEmailAndPassword(workerProvisioningAuth, email.trim(), password);
  const profile: WorkerProfile = {
    uid: credential.user.uid,
    name: name.trim() || email.trim(),
    email: email.trim(),
    active: true,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'workers', profile.uid), profile);
  await signOut(workerProvisioningAuth);
  return profile;
}

export async function loadWorkers(): Promise<WorkerProfile[]> {
  if (!db || !firebaseEnabled) return [];
  const snapshot = await getDocs(collection(db, 'workers'));
  return snapshot.docs.map((item) => workerFromData(item.id, item.data()));
}

export async function loadCurrentWorker(): Promise<WorkerProfile | null> {
  if (!db || !auth?.currentUser || !firebaseEnabled) return null;
  try {
    const snapshot = await getDoc(doc(db, 'workers', auth.currentUser.uid));
    return snapshot.exists() ? workerFromData(snapshot.id, snapshot.data()) : null;
  } catch {
    return null;
  }
}

export async function isCurrentUserWorker() {
  const worker = await loadCurrentWorker();
  return Boolean(worker?.active);
}

export async function saveCustomerOrder(order: StoreOrder) {
  if (!db || !firebaseEnabled) throw new Error('Firebase is not configured.');
  await setDoc(doc(db, 'orders', order.id), order);
}

export async function loadAllOrders(): Promise<StoreOrder[]> {
  if (!db || !firebaseEnabled) return [];
  const snapshot = await getDocs(collection(db, 'orders'));
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }) as StoreOrder)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function loadAssignedOrders(workerId: string): Promise<StoreOrder[]> {
  if (!db || !firebaseEnabled) return [];
  const snapshot = await getDocs(query(collection(db, 'orders'), where('assignedWorkerId', '==', workerId)));
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }) as StoreOrder)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function assignOrder(orderId: string, worker: WorkerProfile | null) {
  if (!db || !firebaseEnabled) throw new Error('Firebase is not configured.');
  if (!orderId.trim()) throw new Error('This order is missing its ID.');
  if (worker && !worker.active) throw new Error('Choose an active worker.');
  const now = new Date().toISOString();
  const activity: OrderActivity = {
    id: `assignment-${Date.now()}`,
    type: 'assigned',
    message: worker ? `Assigned to ${worker.name}` : 'Returned to the unassigned queue',
    createdAt: now,
  };
  await setDoc(doc(db, 'orders', orderId), worker
    ? { assignedWorkerId: worker.uid, assignedWorkerName: worker.name, status: 'Assigned', updatedAt: now, activity: arrayUnion(activity) }
    : { assignedWorkerId: deleteField(), assignedWorkerName: deleteField(), status: 'New', updatedAt: now, activity: arrayUnion(activity) }, { merge: true });
}

export async function updateAssignedOrderStatus(orderId: string, status: string, actorName?: string, note?: string) {
  if (!db || !firebaseEnabled) throw new Error('Firebase is not configured.');
  if (!deliveryStatuses.includes(status as DeliveryStatus)) {
    throw new Error('Choose a valid delivery status.');
  }
  const now = new Date().toISOString();
  const activity: OrderActivity = {
    id: `status-${Date.now()}`,
    type: status === 'Issue' ? 'issue' : status === 'Delivered' ? 'delivered' : 'status',
    message: note ? `${status}: ${note}` : `Status changed to ${status}`,
    actorName,
    createdAt: now,
  };
  await updateDoc(doc(db, 'orders', orderId), {
    status: status as DeliveryStatus,
    updatedAt: now,
    activity: arrayUnion(activity),
  });
}

export async function uploadProofOfDelivery(workerId: string, orderId: string, file: File) {
  if (!storage || !firebaseEnabled) throw new Error('Firebase storage is not configured.');
  const safeName = file.name.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
  const fileRef = ref(storage, `deliveries/${workerId}/${orderId}-${Date.now()}-${safeName}`);
  await uploadBytes(fileRef, file, { contentType: file.type });
  return getDownloadURL(fileRef);
}

export async function saveProofOfDelivery(orderId: string, workerId: string, photoUrl: string | undefined, notes: string) {
  if (!db || !firebaseEnabled) throw new Error('Firebase is not configured.');
  const now = new Date().toISOString();
  const activity: OrderActivity = {
    id: `proof-${Date.now()}`,
    type: 'delivered',
    message: notes ? `Proof of delivery saved: ${notes}` : 'Proof of delivery saved',
    createdAt: now,
  };
  await updateDoc(doc(db, 'orders', orderId), {
    status: 'Delivered',
    updatedAt: now,
    proofOfDelivery: { photoUrl, notes: notes.trim(), deliveredAt: now, workerId },
    activity: arrayUnion(activity),
  });
}

export async function updateWorkerActive(workerId: string, active: boolean) {
  if (!db || !firebaseEnabled) throw new Error('Firebase is not configured.');
  await updateDoc(doc(db, 'workers', workerId), {
    active,
    updatedAt: new Date().toISOString(),
  });
}

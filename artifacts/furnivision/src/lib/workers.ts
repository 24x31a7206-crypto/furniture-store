import { getApp, getApps, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, config, db, firebaseEnabled } from './firebase';

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
};

export type WorkerProfile = {
  uid: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
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
  await updateDoc(doc(db, 'orders', orderId), worker
    ? { assignedWorkerId: worker.uid, assignedWorkerName: worker.name, status: 'Assigned', updatedAt: new Date().toISOString() }
    : { assignedWorkerId: null, assignedWorkerName: null, status: 'New', updatedAt: new Date().toISOString() });
}

export async function updateAssignedOrderStatus(orderId: string, status: string) {
  if (!db || !firebaseEnabled) throw new Error('Firebase is not configured.');
  await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: new Date().toISOString() });
}

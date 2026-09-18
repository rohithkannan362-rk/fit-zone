import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { type Payment, type PaymentStatus, COLLECTIONS } from '../lib/firestore-schema';

const paymentsRef = collection(db, COLLECTIONS.PAYMENTS);

/**
 * Creates a new payment record (status = 'created').
 */
export async function createPaymentRecord(data: {
  memberId: string;
  membershipId: string;
  amount: number;
  packageId: string;
  packageName: string;
  provider: string;
  providerOrderId: string;
  method?: string;
  createdBy?: string;
}): Promise<string> {
  const now = Timestamp.now();

  const payment: Omit<Payment, 'id'> = {
    memberId: data.memberId,
    membershipId: data.membershipId,
    amount: data.amount,
    currency: 'INR',
    packageId: data.packageId,
    packageName: data.packageName,
    provider: data.provider,
    providerOrderId: data.providerOrderId,
    providerPaymentId: '',
    status: 'created',
    method: (data.method as any) || 'upi',
    paymentDate: now,
    createdAt: now,
    updatedAt: now,
    createdBy: data.createdBy,
  };

  const docRef = await addDoc(paymentsRef, payment);
  return docRef.id;
}

/**
 * Creates a manual payment record (for admin cash/offline payments).
 */
export async function createManualPayment(data: {
  memberId: string;
  membershipId: string;
  amount: number;
  packageId: string;
  packageName: string;
  method: string;
  reference?: string;
  paymentDate?: Date;
  createdBy?: string;
}): Promise<string> {
  const now = Timestamp.now();
  const paymentDate = data.paymentDate ? Timestamp.fromDate(data.paymentDate) : now;

  const payment: Omit<Payment, 'id'> = {
    memberId: data.memberId,
    membershipId: data.membershipId,
    amount: data.amount,
    currency: 'INR',
    packageId: data.packageId,
    packageName: data.packageName,
    provider: 'manual',
    providerOrderId: `manual_${Date.now()}`,
    providerPaymentId: data.reference || `manual_${Date.now()}`,
    providerReference: data.reference,
    status: 'success',
    method: data.method as any,
    paymentDate,
    createdAt: now,
    updatedAt: now,
    createdBy: data.createdBy,
  };

  const docRef = await addDoc(paymentsRef, payment);
  return docRef.id;
}

/**
 * Gets a payment by its Firestore document ID.
 */
export async function getPaymentById(paymentId: string): Promise<Payment | null> {
  const docRef = doc(paymentsRef, paymentId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { ...snap.data() as Payment, id: snap.id };
}

/**
 * Gets a payment by provider order ID (for webhook idempotency).
 */
export async function getPaymentByOrderId(providerOrderId: string): Promise<Payment | null> {
  const q = query(paymentsRef, where('providerOrderId', '==', providerOrderId), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { ...snap.docs[0].data() as Payment, id: snap.docs[0].id };
}

/**
 * Gets a payment by provider payment ID (for webhook idempotency).
 */
export async function getPaymentByProviderPaymentId(providerPaymentId: string): Promise<Payment | null> {
  const q = query(paymentsRef, where('providerPaymentId', '==', providerPaymentId), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { ...snap.docs[0].data() as Payment, id: snap.docs[0].id };
}

/**
 * Updates a payment record.
 */
export async function updatePayment(paymentId: string, data: Partial<Payment>): Promise<void> {
  const docRef = doc(paymentsRef, paymentId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Gets payment history for a specific member.
 */
export async function getMemberPayments(memberId: string): Promise<Payment[]> {
  const q = query(
    paymentsRef,
    where('memberId', '==', memberId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data() as Payment, id: d.id }));
}

/**
 * Gets all payments (for admin).
 */
export async function getAllPayments(filters?: {
  status?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
}): Promise<Payment[]> {
  let constraints: any[] = [];

  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }

  constraints.push(orderBy('createdAt', 'desc'));

  const q = query(paymentsRef, ...constraints);
  const snap = await getDocs(q);

  let payments = snap.docs.map(d => ({ ...d.data() as Payment, id: d.id }));

  // Client-side date filtering since Firestore has compound query limitations
  if (filters?.startDate) {
    const start = Timestamp.fromDate(filters.startDate);
    payments = payments.filter(p => p.createdAt >= start);
  }
  if (filters?.endDate) {
    const end = Timestamp.fromDate(filters.endDate);
    payments = payments.filter(p => p.createdAt <= end);
  }

  return payments;
}

/**
 * Gets total revenue for successful payments.
 */
export async function getTotalRevenue(period?: { startDate: Date; endDate: Date }): Promise<number> {
  const q = query(
    paymentsRef,
    where('status', '==', 'success'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  let payments = snap.docs.map(d => d.data() as Payment);

  if (period) {
    const start = Timestamp.fromDate(period.startDate);
    const end = Timestamp.fromDate(period.endDate);
    payments = payments.filter(p => p.createdAt >= start && p.createdAt <= end);
  }

  return payments.reduce((sum, p) => sum + p.amount, 0);
}

/**
 * Gets payments for the current month.
 */
export async function getMonthlyPayments(): Promise<Payment[]> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  return getAllPayments({
    status: 'success',
    startDate: startOfMonth,
    endDate: endOfMonth,
  });
}

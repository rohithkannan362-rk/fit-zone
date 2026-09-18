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
import { type Membership, type MembershipStatus, COLLECTIONS } from '../lib/firestore-schema';
import { calculateEndDate, calculateNextDueDate } from '../utils/dateUtils';

const membershipsRef = collection(db, COLLECTIONS.MEMBERSHIPS);

/**
 * Creates a new membership for a member.
 */
export async function createMembership(data: {
  memberId: string;
  packageId: string;
  packageName: string;
  amount: number;
  startDate?: Date;
  durationMonths: number;
  createdBy?: string;
}): Promise<string> {
  const now = Timestamp.now();
  const start = data.startDate || new Date();
  const endDate = calculateEndDate(start, data.durationMonths);
  const nextDueDate = calculateNextDueDate(endDate);

  const membership: Omit<Membership, 'id'> = {
    memberId: data.memberId,
    packageId: data.packageId,
    packageName: data.packageName,
    amount: data.amount,
    startDate: Timestamp.fromDate(start),
    endDate: Timestamp.fromDate(endDate),
    nextDueDate: Timestamp.fromDate(nextDueDate),
    status: 'active',
    reminderStatus: 'active',
    reminderPausedUntil: null,
    createdAt: now,
    updatedAt: now,
    createdBy: data.createdBy,
  };

  const docRef = await addDoc(membershipsRef, membership);
  return docRef.id;
}

/**
 * Gets the current (most recent) membership for a member.
 */
export async function getCurrentMembership(memberId: string): Promise<Membership | null> {
  const q = query(
    membershipsRef,
    where('memberId', '==', memberId),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { ...docSnap.data() as Membership, id: docSnap.id };
}

/**
 * Gets all memberships for a member, ordered by creation date.
 */
export async function getMembershipHistory(memberId: string): Promise<Membership[]> {
  const q = query(
    membershipsRef,
    where('memberId', '==', memberId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data() as Membership, id: d.id }));
}

/**
 * Updates a membership.
 */
export async function updateMembership(membershipId: string, data: Partial<Membership>): Promise<void> {
  const docRef = doc(membershipsRef, membershipId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Activates a membership after successful payment.
 */
export async function activateMembership(membershipId: string): Promise<void> {
  await updateMembership(membershipId, {
    status: 'active',
    reminderStatus: 'active',
  });
}

/**
 * Renews a membership: creates a new billing cycle.
 */
export async function renewMembership(data: {
  memberId: string;
  packageId: string;
  packageName: string;
  amount: number;
  durationMonths: number;
  previousMembershipId?: string;
  createdBy?: string;
}): Promise<string> {
  // Close the previous membership if provided
  if (data.previousMembershipId) {
    await updateMembership(data.previousMembershipId, {
      status: 'expired',
    });
  }

  // Determine start date: if previous membership exists, start after its end
  let startDate = new Date();
  if (data.previousMembershipId) {
    const prev = await getMembershipById(data.previousMembershipId);
    if (prev) {
      const prevEnd = prev.endDate.toDate();
      const today = new Date();
      // If the previous membership hasn't ended yet, start from its end + 1
      // Otherwise, start from today
      if (prevEnd > today) {
        startDate = new Date(prevEnd);
        startDate.setDate(startDate.getDate() + 1);
      }
    }
  }

  return createMembership({
    memberId: data.memberId,
    packageId: data.packageId,
    packageName: data.packageName,
    amount: data.amount,
    startDate,
    durationMonths: data.durationMonths,
    createdBy: data.createdBy,
  });
}

/**
 * Gets a membership by its ID.
 */
export async function getMembershipById(membershipId: string): Promise<Membership | null> {
  const docRef = doc(membershipsRef, membershipId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { ...snap.data() as Membership, id: snap.id };
}

/**
 * Pauses reminders for a membership.
 */
export async function pauseReminders(
  membershipId: string,
  pauseUntil: Date,
  reason?: string
): Promise<void> {
  await updateMembership(membershipId, {
    reminderStatus: 'paused',
    reminderPausedUntil: Timestamp.fromDate(pauseUntil),
    reminderPauseReason: reason || 'Admin paused',
  });
}

/**
 * Resumes reminders for a membership.
 */
export async function resumeReminders(membershipId: string): Promise<void> {
  await updateMembership(membershipId, {
    reminderStatus: 'active',
    reminderPausedUntil: null,
    reminderPauseReason: undefined,
  });
}

/**
 * Gets all active memberships (for admin dashboard).
 */
export async function getAllActiveMemberships(): Promise<Membership[]> {
  const q = query(
    membershipsRef,
    where('status', 'in', ['active', 'due_soon', 'due_today', 'overdue']),
    orderBy('nextDueDate', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data() as Membership, id: d.id }));
}

/**
 * Gets all memberships (for admin reports).
 */
export async function getAllMemberships(): Promise<Membership[]> {
  const q = query(membershipsRef, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data() as Membership, id: d.id }));
}

/**
 * Gets memberships by status filter.
 */
export async function getMembershipsByStatus(status: MembershipStatus): Promise<Membership[]> {
  const q = query(
    membershipsRef,
    where('status', '==', status),
    orderBy('nextDueDate', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data() as Membership, id: d.id }));
}

/**
 * Gets memberships with paused reminders.
 */
export async function getPausedMemberships(): Promise<Membership[]> {
  const q = query(
    membershipsRef,
    where('reminderStatus', '==', 'paused'),
    orderBy('reminderPausedUntil', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data() as Membership, id: d.id }));
}

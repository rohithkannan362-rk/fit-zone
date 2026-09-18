import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  runTransaction,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { type Member, COLLECTIONS } from '../lib/firestore-schema';

const membersRef = collection(db, COLLECTIONS.MEMBERS);
const countersRef = collection(db, COLLECTIONS.COUNTERS);

/**
 * Generates the next unique member code (FZ000001, FZ000002, etc.)
 * Uses a Firestore transaction to ensure atomicity.
 */
export async function generateMemberCode(): Promise<string> {
  const counterDoc = doc(countersRef, 'memberCode');

  const newValue = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterDoc);
    let current = 0;
    if (counterSnap.exists()) {
      current = counterSnap.data().currentValue || 0;
    }
    const next = current + 1;
    transaction.set(counterDoc, { currentValue: next }, { merge: true });
    return next;
  });

  return `FZ${String(newValue).padStart(6, '0')}`;
}

/**
 * Creates a new member profile in Firestore.
 */
export async function createMember(data: {
  uid: string;
  name: string;
  email: string;
  mobile: string;
}): Promise<Member> {
  const memberCode = await generateMemberCode();
  const now = Timestamp.now();

  const member: Member = {
    uid: data.uid,
    memberCode,
    name: data.name,
    email: data.email.toLowerCase(),
    mobile: data.mobile,
    role: 'member',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  // Use uid as the document ID for easy lookup
  const memberDoc = doc(membersRef, data.uid);
  await setDoc(memberDoc, member);

  return { ...member, id: data.uid };
}

/**
 * Gets a member by their Firebase Auth UID.
 */
export async function getMemberByUid(uid: string): Promise<Member | null> {
  const memberDoc = doc(membersRef, uid);
  const snap = await getDoc(memberDoc);
  if (!snap.exists()) return null;
  return { ...snap.data() as Member, id: snap.id };
}

/**
 * Gets a member by their member code (e.g., FZ000001).
 */
export async function getMemberByCode(code: string): Promise<Member | null> {
  const q = query(membersRef, where('memberCode', '==', code), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { ...docSnap.data() as Member, id: docSnap.id };
}

/**
 * Updates a member profile.
 */
export async function updateMember(memberId: string, data: Partial<Member>): Promise<void> {
  const memberDoc = doc(membersRef, memberId);
  await updateDoc(memberDoc, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Searches members by name, mobile, member code, or email.
 */
export async function searchMembers(
  searchQuery: string,
  filters?: { status?: string },
  pageSize: number = 50,
  lastDoc?: DocumentSnapshot
): Promise<{ members: Member[]; lastDoc: DocumentSnapshot | null }> {
  let q;
  const constraints: any[] = [];

  if (filters?.status && filters.status !== 'all') {
    constraints.push(where('status', '==', filters.status));
  }

  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(limit(pageSize));

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  q = query(membersRef, ...constraints);
  const snap = await getDocs(q);

  let members = snap.docs.map(d => ({ ...d.data() as Member, id: d.id }));

  // Client-side search filtering (Firestore doesn't support full-text search)
  if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase();
    members = members.filter(
      m =>
        m.name.toLowerCase().includes(lowerQuery) ||
        m.mobile.includes(searchQuery) ||
        m.memberCode.toLowerCase().includes(lowerQuery) ||
        m.email.toLowerCase().includes(lowerQuery)
    );
  }

  const newLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

  return { members, lastDoc: newLastDoc };
}

/**
 * Gets all members (for admin dashboard counts).
 */
export async function getAllMembers(): Promise<Member[]> {
  const q = query(membersRef, where('role', '==', 'member'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data() as Member, id: d.id }));
}

/**
 * Checks if a member with the given email already exists.
 */
export async function memberExistsByEmail(email: string): Promise<boolean> {
  const q = query(membersRef, where('email', '==', email.toLowerCase()), limit(1));
  const snap = await getDocs(q);
  return !snap.empty;
}

/**
 * Checks if a member with the given mobile already exists.
 */
export async function memberExistsByMobile(mobile: string): Promise<boolean> {
  const q = query(membersRef, where('mobile', '==', mobile), limit(1));
  const snap = await getDocs(q);
  return !snap.empty;
}

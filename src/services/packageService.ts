import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { type Package, COLLECTIONS } from '../lib/firestore-schema';

const packagesRef = collection(db, COLLECTIONS.PACKAGES);

/**
 * Gets all active packages, sorted by price ascending.
 */
export async function getActivePackages(): Promise<Package[]> {
  const q = query(packagesRef, where('active', '==', true), orderBy('price', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data() as Package, id: d.id }));
}

/**
 * Gets all packages (including inactive), for admin management.
 */
export async function getAllPackages(): Promise<Package[]> {
  const q = query(packagesRef, orderBy('price', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data() as Package, id: d.id }));
}

/**
 * Gets a single package by ID.
 */
export async function getPackageById(packageId: string): Promise<Package | null> {
  const docRef = doc(packagesRef, packageId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { ...snap.data() as Package, id: snap.id };
}

/**
 * Creates a new package.
 */
export async function createPackage(data: {
  name: string;
  durationMonths: number;
  price: number;
  features: string[];
  popular?: boolean;
  offer?: string;
}): Promise<string> {
  const now = Timestamp.now();
  const docRef = await addDoc(packagesRef, {
    ...data,
    active: true,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

/**
 * Updates a package.
 */
export async function updatePackage(packageId: string, data: Partial<Package>): Promise<void> {
  const docRef = doc(packagesRef, packageId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Deactivates a package (soft delete).
 */
export async function deactivatePackage(packageId: string): Promise<void> {
  const docRef = doc(packagesRef, packageId);
  await updateDoc(docRef, {
    active: false,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Seeds default packages if none exist.
 */
export async function seedDefaultPackages(): Promise<void> {
  const existing = await getDocs(packagesRef);
  if (!existing.empty) return;

  const defaults = [
    {
      name: 'Monthly',
      durationMonths: 1,
      price: 1000,
      features: ['1 Month Membership', 'Access to all facilities', 'Guidance from trainers'],
      popular: false,
      offer: null,
    },
    {
      name: '3 Months',
      durationMonths: 3,
      price: 2700,
      features: ['3 Months Membership', 'Access to all facilities', 'Priority trainer support'],
      popular: false,
      offer: 'Save ₹300',
    },
    {
      name: '6 Months',
      durationMonths: 6,
      price: 5000,
      features: ['6 Months Membership', 'Access to all facilities', 'Best value for results'],
      popular: true,
      offer: 'Save ₹1,000',
    },
    {
      name: '12 Months',
      durationMonths: 12,
      price: 9000,
      features: ['12 Months Membership', 'Access to all facilities', 'Maximum savings', 'Long-term transformation'],
      popular: false,
      offer: 'Save ₹3,000',
    },
  ];

  const now = Timestamp.now();
  for (const pkg of defaults) {
    await addDoc(packagesRef, {
      ...pkg,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  }
}

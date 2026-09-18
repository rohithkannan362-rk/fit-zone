import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getMemberByUid, createMember } from '../services/memberService';
import { type Member } from '../lib/firestore-schema';

export type UserRole = 'admin' | 'member';

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  member: Member | null;
}

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    mobile: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin emails — configure these in your environment or Firestore settings
const ADMIN_EMAILS = ['admin@fitzone.com'];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          // Fetch member profile from Firestore
          const member = await getMemberByUid(fbUser.uid);
          const role: UserRole = member?.role === 'admin' || ADMIN_EMAILS.includes(fbUser.email || '')
            ? 'admin'
            : 'member';

          setUser({
            uid: fbUser.uid,
            email: fbUser.email || '',
            role,
            member,
          });
        } catch (error) {
          console.error('Error fetching member profile:', error);
          // Still set user with basic info
          setUser({
            uid: fbUser.uid,
            email: fbUser.email || '',
            role: ADMIN_EMAILS.includes(fbUser.email || '') ? 'admin' : 'member',
            member: null,
          });
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the rest
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    mobile: string;
    password: string;
  }): Promise<void> => {
    setIsLoading(true);
    try {
      // 1. Create Firebase Auth account
      const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);

      // 2. Create Firestore member profile
      const newMember = await createMember({
        uid: credential.user.uid,
        name: data.name,
        email: data.email,
        mobile: data.mobile,
      });

      // Fix Race condition: explicitly set the user state immediately
      // so we don't have to wait for onAuthStateChanged to fetch the newly created doc.
      setUser({
        uid: credential.user.uid,
        email: credential.user.email,
        role: 'member',
        member: newMember,
      });
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, isLoading, login, register, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

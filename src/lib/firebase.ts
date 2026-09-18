import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCOR3KvhGscMpCMgQ8h6JUaDzpH-l-XtZE",
  authDomain: "fit-zone-c8840.firebaseapp.com",
  projectId: "fit-zone-c8840",
  storageBucket: "fit-zone-c8840.firebasestorage.app",
  messagingSenderId: "478675529631",
  appId: "1:478675529631:web:da4caf9a1f80f1e6c957aa",
  measurementId: "G-0VXZXEN7JE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;


'use client';

import { useEffect, useState } from 'react';
import { useFirestore, useAuth } from '../provider';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export interface AppUser {
  uid: string;
  displayName: string;
  email?: string;
  role?: 'USER' | 'ADMIN';
}

export function useUser() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !firestore) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(firestore, "users", firebaseUser.uid);
        try {
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            setUser({
              uid: firebaseUser.uid,
              displayName: data.displayName || 'Fan',
              email: firebaseUser.email || undefined,
              role: data.role || 'USER'
            });
          } else {
            // Profile missing in Firestore, create a default one
            const defaultData = {
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Fan',
              role: firebaseUser.email === 'admin@game.com' ? 'ADMIN' : 'USER',
              points: 0,
              streak: 0
            };
            await setDoc(userRef, defaultData);
            setUser({
              uid: firebaseUser.uid,
              displayName: defaultData.displayName,
              email: firebaseUser.email || undefined,
              role: defaultData.role as any
            });
          }
        } catch (e) {
          console.error("Profile Fetch Error:", e);
          setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Fan',
            email: firebaseUser.email || undefined,
            role: 'USER'
          });
        }
      } else {
        const savedGuest = localStorage.getItem('gg_guest_user');
        if (savedGuest) {
          setUser(JSON.parse(savedGuest));
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  const login = async (email: string, pass: string) => {
    if (!auth || !firestore) throw new Error("Firebase services not available");
    
    // Normalize 'admin' username to email
    const targetEmail = email.trim().toLowerCase() === 'admin' ? 'admin@game.com' : email.trim();

    try {
      await signInWithEmailAndPassword(auth, targetEmail, pass);
    } catch (err: any) {
      // Auto-seed admin if it's the requested default and doesn't exist
      if (targetEmail === 'admin@game.com' && pass === 'password' && (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential')) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, targetEmail, pass);
          await setDoc(doc(firestore, "users", cred.user.uid), {
            displayName: "Official Admin",
            role: "ADMIN",
            points: 0,
            streak: 0
          });
          return; 
        } catch (createErr: any) {
          // If creation fails (e.g. email in use), throw the original error or the new one
          if (createErr.code === 'auth/email-already-in-use') throw err;
          throw createErr;
        }
      }
      throw err;
    }
  };

  const register = async (email: string, pass: string, name: string) => {
    if (!auth || !firestore) return;
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const userRef = doc(firestore, "users", cred.user.uid);
    await setDoc(userRef, {
      displayName: name,
      role: "USER",
      points: 0,
      streak: 0
    });
  };

  const guestLogin = async (name: string) => {
    if (!name.trim() || !firestore) return;
    const cleanName = name.trim();
    const guestUser: AppUser = {
      uid: `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      displayName: cleanName,
      role: 'USER'
    };
    
    const userRef = doc(firestore, "users", guestUser.uid);
    setDoc(userRef, {
      displayName: cleanName,
      role: "USER",
      points: 0,
      streak: 0,
      isGuest: true
    }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'write'
      }));
    });

    localStorage.setItem('gg_guest_user', JSON.stringify(guestUser));
    setUser(guestUser);
  };

  const logout = async () => {
    if (auth) await signOut(auth);
    localStorage.removeItem('gg_guest_user');
    setUser(null);
  };

  return { user, loading, login, register, guestLogin, logout };
}

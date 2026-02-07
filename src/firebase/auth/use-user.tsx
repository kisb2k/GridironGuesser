
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
          const data = snap.data();
          
          setUser({
            uid: firebaseUser.uid,
            displayName: data?.displayName || firebaseUser.displayName || 'Fan',
            email: firebaseUser.email || undefined,
            role: data?.role || 'USER'
          });
        } catch (e) {
          // If doc doesn't exist or permission issue, still set basic auth user
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
    if (!auth || !firestore) return;
    
    // Normalize username-only inputs to email format if they look like the admin username
    const targetEmail = email === 'admin' ? 'admin@game.com' : email;

    try {
      const cred = await signInWithEmailAndPassword(auth, targetEmail, pass);
      
      // Post-login check: ensure profile exists for special admin account
      if (targetEmail === 'admin@game.com') {
        const userRef = doc(firestore, "users", cred.user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            displayName: "Official Admin",
            role: "ADMIN",
            points: 0,
            streak: 0
          });
        }
      }
    } catch (err: any) {
      // Auto-seed admin if it's the default request and doesn't exist in Auth
      if (targetEmail === 'admin@game.com' && pass === 'password') {
        try {
          const cred = await createUserWithEmailAndPassword(auth, targetEmail, pass);
          await setDoc(doc(firestore, "users", cred.user.uid), {
            displayName: "Official Admin",
            role: "ADMIN",
            points: 0,
            streak: 0
          });
          return; 
        } catch (createErr) {
          // If creation fails (user probably exists but password wrong), throw original error
          throw err;
        }
      }
      throw err;
    }
  };

  const register = async (email: string, pass: string, name: string) => {
    if (!auth || !firestore) return;
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
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

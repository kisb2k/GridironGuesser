
'use client';

import { useEffect, useState } from 'react';
import { useFirestore } from '../provider';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export interface AppUser {
  uid: string;
  displayName: string;
  role?: 'USER' | 'ADMIN';
  username: string;
}

export function useUser() {
  const firestore = useFirestore();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const savedUserId = localStorage.getItem('gg_user_id');
    if (savedUserId) {
      const userRef = doc(firestore, "users", savedUserId);
      getDoc(userRef).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setUser({
            uid: snap.id,
            username: snap.id,
            displayName: data.displayName || 'Fan',
            role: data.role || 'USER'
          });
        } else {
          localStorage.removeItem('gg_user_id');
          setUser(null);
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [firestore]);

  const login = async (username: string, pass: string) => {
    if (!firestore) throw new Error("Database not initialized");
    
    const cleanUsername = username.trim().toLowerCase();
    const userRef = doc(firestore, "users", cleanUsername);
    
    // Default Admin Seed
    if (cleanUsername === 'admin' && pass === 'password') {
      const adminSnap = await getDoc(userRef);
      if (!adminSnap.exists()) {
        await setDoc(userRef, {
          displayName: "Official Admin",
          password: "password",
          role: "ADMIN",
          points: 0,
          streak: 0
        });
      }
    }

    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      throw new Error("User not found");
    }

    const data = snap.data();
    if (data.password !== pass) {
      throw new Error("Invalid password");
    }

    const appUser: AppUser = {
      uid: cleanUsername,
      username: cleanUsername,
      displayName: data.displayName || 'Fan',
      role: data.role || 'USER'
    };

    localStorage.setItem('gg_user_id', cleanUsername);
    setUser(appUser);
  };

  const register = async (email: string, pass: string, name: string) => {
    if (!firestore) return;
    const username = email.trim().toLowerCase();
    const userRef = doc(firestore, "users", username);
    
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      throw new Error("User already exists");
    }

    const userData = {
      displayName: name,
      password: pass,
      role: "USER",
      points: 0,
      streak: 0
    };

    await setDoc(userRef, userData);
    
    const appUser: AppUser = {
      uid: username,
      username: username,
      displayName: name,
      role: "USER"
    };

    localStorage.setItem('gg_user_id', username);
    setUser(appUser);
  };

  const guestLogin = async (name: string) => {
    if (!name.trim() || !firestore) return;
    const cleanName = name.trim();
    const guestId = `guest_${Date.now()}`;
    const appUser: AppUser = {
      uid: guestId,
      username: guestId,
      displayName: cleanName,
      role: 'USER'
    };
    
    const userRef = doc(firestore, "users", guestId);
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

    localStorage.setItem('gg_user_id', guestId);
    setUser(appUser);
  };

  const logout = async () => {
    localStorage.removeItem('gg_user_id');
    setUser(null);
  };

  return { user, loading, login, register, guestLogin, logout };
}

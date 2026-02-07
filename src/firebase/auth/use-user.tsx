
'use client';

import { useEffect, useState } from 'react';
import { useFirestore } from '../provider';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface AppUser {
  uid: string;
  displayName: string;
}

export function useUser() {
  const firestore = useFirestore();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('gg_app_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('gg_app_user');
      }
    }
    setLoading(false);
  }, []);

  const signInWithName = async (name: string) => {
    if (!name.trim() || !firestore) return;

    // Check if we have an existing UID for this name in local storage
    // or generate a new one for this "session"
    let uid = '';
    const savedUser = localStorage.getItem('gg_app_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed.displayName === name.trim()) {
        uid = parsed.uid;
      }
    }

    if (!uid) {
      uid = `u_${Math.random().toString(36).substring(2, 9)}`;
    }

    const newUser: AppUser = {
      uid,
      displayName: name.trim()
    };

    // Save/Update in Firestore (our "Database for user logins")
    const userRef = doc(firestore, "users", uid);
    const snap = await getDoc(userRef);
    
    if (!snap.exists()) {
      await setDoc(userRef, {
        displayName: newUser.displayName,
        points: 0,
        streak: 0,
        lastUpdatedPlayId: ""
      });
    }

    localStorage.setItem('gg_app_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('gg_app_user');
    setUser(null);
  };

  return { user, loading, signInWithName, logout };
}

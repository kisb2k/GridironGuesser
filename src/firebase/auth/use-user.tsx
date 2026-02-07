
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

    const cleanName = name.trim();
    // In a real app, you'd use a better way to generate UIDs, 
    // but for this prototype, we'll hash the name or use a unique string.
    const uid = `u_${cleanName.toLowerCase().replace(/\s+/g, '_')}`;

    const newUser: AppUser = {
      uid,
      displayName: cleanName
    };

    try {
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
    } catch (error: any) {
      // If offline, we still "sign in" locally to allow the app to function
      // with cached data, but we warn in console.
      if (error.code === 'unavailable') {
        console.warn("Firestore unavailable, signing in with local cache.");
        localStorage.setItem('gg_app_user', JSON.stringify(newUser));
        setUser(newUser);
      } else {
        throw error;
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('gg_app_user');
    setUser(null);
  };

  return { user, loading, signInWithName, logout };
}

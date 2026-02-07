
'use client';

import { useEffect, useState } from 'react';
import { useFirestore } from '../provider';
import { doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

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
    const uid = `u_${cleanName.toLowerCase().replace(/\s+/g, '_')}`;

    const newUser: AppUser = {
      uid,
      displayName: cleanName
    };

    const userRef = doc(firestore, "users", uid);
    const userData = {
      displayName: newUser.displayName,
      points: 0,
      streak: 0,
      lastUpdatedPlayId: ""
    };

    // Use setDoc with merge instead of getDoc to be more resilient to offline status
    setDoc(userRef, userData, { merge: true })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'write',
          requestResourceData: userData
        });
        errorEmitter.emit('permission-error', permissionError);
      });

    localStorage.setItem('gg_app_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('gg_app_user');
    setUser(null);
  };

  return { user, loading, signInWithName, logout };
}

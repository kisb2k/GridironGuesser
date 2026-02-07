
'use client';

import { useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  AuthError
} from 'firebase/auth';
import { useAuth } from '../provider';
import { useToast } from '@/hooks/use-toast';

export interface GuestUser {
  uid: string;
  displayName: string;
  isGuest: true;
}

export function useUser() {
  const auth = useAuth();
  const { toast } = useToast();
  const [user, setUser] = useState<User | GuestUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for guest user in localStorage first
    const savedGuest = localStorage.getItem('gg_guest_user');
    if (savedGuest) {
      try {
        setUser(JSON.parse(savedGuest));
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('gg_guest_user');
      }
    }

    return onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, [auth]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      localStorage.removeItem('gg_guest_user'); // Clear guest if signing in with Google
      await signInWithPopup(auth, provider);
    } catch (error) {
      const authError = error as AuthError;
      
      let message = "Failed to sign in. Please try again.";
      if (authError.code === 'auth/configuration-not-found') {
        message = "Firebase Auth is not fully configured.";
      } else if (authError.code === 'auth/unauthorized-domain') {
        message = "This domain is not authorized for Google Sign-In.";
      }
      
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: message,
      });
    }
  };

  const signInAsGuest = (name: string) => {
    if (!name.trim()) return;
    const guest: GuestUser = {
      uid: `guest_${Math.random().toString(36).substring(2, 9)}`,
      displayName: name.trim(),
      isGuest: true
    };
    localStorage.setItem('gg_guest_user', JSON.stringify(guest));
    setUser(guest);
  };

  const logout = () => {
    localStorage.removeItem('gg_guest_user');
    return signOut(auth);
  };

  return { user, loading, signInWithGoogle, signInAsGuest, logout };
}

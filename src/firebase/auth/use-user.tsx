
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

export function useUser() {
  const auth = useAuth();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
  }, [auth]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      const authError = error as AuthError;
      
      let message = "Failed to sign in. Please try again.";
      if (authError.code === 'auth/configuration-not-found') {
        message = "Firebase Auth is not fully configured. Please check the Firebase Console.";
      } else if (authError.code === 'auth/unauthorized-domain') {
        message = "This domain is not authorized for Google Sign-In. Add it in Firebase Console.";
      } else if (authError.code === 'auth/api-key-not-valid') {
        message = "The Firebase API key is invalid. Please check your configuration.";
      }
      
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: message,
      });
    }
  };

  const logout = () => signOut(auth);

  return { user, loading, signInWithGoogle, logout };
}


'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { LogIn, Trophy, Play, Loader2 } from "lucide-react";

export default function LandingPage() {
  const { user, loading, signInWithGoogle } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (user && firestore) {
      const userRef = doc(firestore, "users", user.uid);
      getDoc(userRef).then((snap) => {
        if (!snap.exists()) {
          setDoc(userRef, {
            displayName: user.displayName,
            points: 0,
            streak: 0,
            lastUpdatedPlayId: ""
          });
        }
      });
    }
  }, [user, firestore]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mb-8 glow-primary rotate-3">
        <Trophy className="w-12 h-12 text-background" />
      </div>
      
      <h1 className="text-6xl font-black italic tracking-tighter mb-4 uppercase">
        Gridiron <span className="text-primary">Guesser</span>
      </h1>
      <p className="text-muted-foreground font-bold mb-12 max-w-md text-lg">
        The real-time NFL prediction game. Join a group, sync with the broadcast, and prove you're the ultimate fan.
      </p>

      {user ? (
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <Button 
            size="lg" 
            className="h-16 text-xl font-black italic"
            onClick={() => router.push('/lobby')}
          >
            <Play className="w-6 h-6 mr-2 fill-current" />
            ENTER LOBBY
          </Button>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold text-muted-foreground uppercase">
              Signed in as {user.displayName}
            </p>
            <button 
              onClick={() => router.push('/lobby')}
              className="text-[10px] text-primary hover:underline uppercase font-bold"
            >
              Go to Game Lobby
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Button 
            size="lg" 
            onClick={() => signInWithGoogle()}
            className="h-16 text-xl font-black italic w-full max-w-sm"
          >
            <LogIn className="w-6 h-6 mr-2" />
            SIGN IN WITH GOOGLE
          </Button>
          <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      )}
    </main>
  );
}

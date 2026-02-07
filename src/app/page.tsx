
"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { LogIn, Trophy, Play } from "lucide-react";

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

  if (loading) return null;

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
          <p className="text-xs font-bold text-muted-foreground uppercase">
            Signed in as {user.displayName}
          </p>
        </div>
      ) : (
        <Button 
          size="lg" 
          onClick={() => signInWithGoogle()}
          className="h-16 text-xl font-black italic"
        >
          <LogIn className="w-6 h-6 mr-2" />
          SIGN IN TO PLAY
        </Button>
      )}
    </main>
  );
}

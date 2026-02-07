
'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, Trophy, Play, Loader2, User as UserIcon } from "lucide-react";

export default function LandingPage() {
  const { user, loading, signInWithGoogle, signInAsGuest, logout } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [guestName, setGuestName] = useState("");

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
          <div className="flex flex-col gap-2 p-4 bg-card/30 rounded-xl border border-white/5">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
              Playing as: <span className="text-primary">{user.displayName}</span>
            </p>
            <button 
              onClick={() => logout()}
              className="text-[10px] text-destructive hover:underline uppercase font-bold"
            >
              Sign Out / Switch Account
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground text-left block ml-1">Quick Start</label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter Display Name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="h-14 font-bold text-lg"
                />
                <Button 
                  size="lg" 
                  onClick={() => signInAsGuest(guestName)}
                  disabled={!guestName.trim()}
                  className="h-14 font-black italic"
                >
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5"></span></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black"><span className="bg-background px-4 text-muted-foreground">Or Use Permanent Account</span></div>
            </div>

            <Button 
              variant="outline"
              size="lg" 
              onClick={() => signInWithGoogle()}
              className="h-14 text-sm font-black italic w-full border-white/10 hover:bg-white/5"
            >
              <LogIn className="w-4 h-4 mr-2" />
              SIGN IN WITH GOOGLE
            </Button>
          </div>
          
          <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
            Guest accounts are saved locally on this device. Sign in with Google to sync stats across all platforms.
          </p>
        </div>
      )}
    </main>
  );
}

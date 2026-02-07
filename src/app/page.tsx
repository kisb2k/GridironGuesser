
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Play, Loader2, User, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const { user, loading, guestLogin, logout } = useUser();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGuestEntry = async () => {
    if (!displayName.trim()) return;
    setIsSigningIn(true);
    await guestLogin(displayName);
    setIsSigningIn(false);
  };

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
        The real-time NFL prediction game. Join a group, sync with the broadcast, and win big.
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
              Log Out
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground text-left block ml-1">Quick Play (Guest)</label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-14 font-bold text-lg"
                  disabled={isSigningIn}
                />
                <Button 
                  size="lg" 
                  onClick={handleGuestEntry}
                  disabled={!displayName.trim() || isSigningIn}
                  className="h-14 font-black italic"
                >
                  {isSigningIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Link href="/login" className="block">
              <Button variant="outline" className="w-full h-12 font-black uppercase text-[10px]">
                <User className="w-4 h-4 mr-2" /> Player Login
              </Button>
            </Link>
            <Link href="/admin/login" className="block">
              <Button variant="outline" className="w-full h-12 font-black uppercase text-[10px] border-primary/30 text-primary">
                <ShieldCheck className="w-4 h-4 mr-2" /> Admin Login
              </Button>
            </Link>
          </div>
          
          <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
            Log in to save your lifetime stats and streaks.
          </p>
        </div>
      )}
    </main>
  );
}

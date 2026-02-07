
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Plus, Users, ArrowRight, Loader2 } from "lucide-react";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function LobbyPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [gameIdInput, setGameIdInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const createGame = () => {
    if (!user || !firestore || isCreating) return;
    
    setIsCreating(true);
    const newGameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const gameRef = doc(firestore, "gameSessions", newGameId);
    
    const gameData = {
      adminUid: user.uid,
      status: "PREDICTING",
      situation: "Waiting for Admin to Start",
      scoreAway: 0,
      scoreHome: 0,
      timeRemaining: "15:00 1ST",
      currentPlayId: "p1",
      syncOffset: 0
    };

    // Non-blocking write for immediate navigation and robustness
    setDoc(gameRef, gameData).catch(async (err) => {
      const permissionError = new FirestorePermissionError({
        path: gameRef.path,
        operation: 'create',
        requestResourceData: gameData
      });
      errorEmitter.emit('permission-error', permissionError);
    });

    router.push(`/game/${newGameId}`);
  };

  const joinGame = () => {
    if (gameIdInput.trim()) {
      router.push(`/game/${gameIdInput.trim().toUpperCase()}`);
    }
  };

  if (userLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </main>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <main className="min-h-screen bg-background p-6 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase">
            Play <span className="text-primary">Live</span>
          </h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Logged in as: <span className="text-primary">{user.displayName}</span>
          </p>
        </div>

        <Card className="bg-card/50 border-white/5 glow-primary">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest">Create New Group</CardTitle>
            <CardDescription className="text-xs font-bold">Start a session and share the code with friends.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={createGame} 
              disabled={isCreating}
              className="w-full h-12 font-black italic"
            >
              {isCreating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  CREATE SESSION
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest">Join Session</CardTitle>
            <CardDescription className="text-xs font-bold">Enter a 6-character game code.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              placeholder="ENTER CODE (e.g. AX72B)" 
              value={gameIdInput}
              onChange={(e) => setGameIdInput(e.target.value)}
              className="h-12 text-center text-xl font-black uppercase"
            />
            <Button onClick={joinGame} variant="secondary" className="w-full h-12 font-black italic">
              <Users className="w-5 h-5 mr-2" />
              JOIN GROUP
              <ArrowRight className="w-5 h-5 ml-auto" />
            </Button>
          </CardContent>
        </Card>

        <Button 
          variant="ghost" 
          onClick={() => router.push('/')}
          className="w-full text-[10px] font-bold uppercase opacity-50 hover:opacity-100"
        >
          Return to Start Screen
        </Button>
      </div>
    </main>
  );
}

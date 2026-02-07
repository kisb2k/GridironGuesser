
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Plus, Users, ArrowRight } from "lucide-react";

export default function LobbyPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [gameIdInput, setGameIdInput] = useState("");

  const createGame = async () => {
    if (!user || !firestore) return;
    const newGameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const gameRef = doc(firestore, "gameSessions", newGameId);
    
    await setDoc(gameRef, {
      adminUid: user.uid,
      status: "PREDICTING",
      situation: "Waiting for Admin to Start",
      scoreAway: 0,
      scoreHome: 0,
      timeRemaining: "15:00 1ST",
      currentPlayId: "p1",
      syncOffset: 0
    });

    router.push(`/game/${newGameId}`);
  };

  const joinGame = () => {
    if (gameIdInput.trim()) {
      router.push(`/game/${gameIdInput.trim().toUpperCase()}`);
    }
  };

  return (
    <main className="min-h-screen bg-background p-6 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase text-center mb-8">
          Play <span className="text-primary">Live</span>
        </h2>

        <Card className="bg-card/50 border-white/5 glow-primary">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest">Create New Group</CardTitle>
            <CardDescription className="text-xs font-bold">Start a session and share the code with friends.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={createGame} className="w-full h-12 font-black italic">
              <Plus className="w-5 h-5 mr-2" />
              CREATE SESSION
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
      </div>
    </main>
  );
}

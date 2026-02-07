
"use client"

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFirestore, useDoc, useUser } from "@/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PlayType, OutcomeType } from "@/lib/types";
import { ArrowLeft, Send, Lock, Zap, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function AdminPage() {
  const { gameId } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const gameRef = doc(firestore!, 'gameSessions', gameId as string);
  const { data: game, loading } = useDoc<any>(gameRef);

  const [situation, setSituation] = useState("");
  const [scoreAway, setScoreAway] = useState(0);
  const [scoreHome, setScoreHome] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [lastPlayType, setLastPlayType] = useState<PlayType>("RUN");
  const [lastOutcome, setLastOutcome] = useState<OutcomeType>("NONE");

  useEffect(() => {
    if (game) {
      setSituation(game.situation || "");
      setScoreAway(game.scoreAway || 0);
      setScoreHome(game.scoreHome || 0);
      setTimeRemaining(game.timeRemaining || "");
    }
  }, [game]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  if (!game || (game.adminUid !== user?.uid)) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center p-8 space-y-4">
        <h1 className="text-xl font-black uppercase italic">Unauthorized Access</h1>
        <Button onClick={() => router.push(`/game/${gameId}`)}>BACK TO GAME</Button>
      </div>
    </div>
  );

  const updateStatus = (status: string) => {
    const update: any = { status };
    if (status === 'PREDICTING') {
      update.currentPlayId = `p_${Date.now()}`;
      update.lastResult = null;
    }
    if (status === 'RESOLVING') {
      update.lastResult = {
        type: lastPlayType,
        outcome: lastOutcome,
        description: `${lastPlayType} resulted in ${lastOutcome.replace(/_/g, ' ')}`,
        yards: Math.floor(Math.random() * 20)
      };
    }
    
    updateDoc(gameRef, update).catch(async (err) => {
      const permissionError = new FirestorePermissionError({
        path: gameRef.path,
        operation: 'update',
        requestResourceData: update
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  const updateGameInfo = () => {
    const update = {
      situation,
      scoreAway,
      scoreHome,
      timeRemaining
    };
    updateDoc(gameRef, update).catch(async (err) => {
      const permissionError = new FirestorePermissionError({
        path: gameRef.path,
        operation: 'update',
        requestResourceData: update
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  const endGame = async () => {
    if (confirm("End this session?")) {
      deleteDoc(gameRef).catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: gameRef.path,
          operation: 'delete'
        });
        errorEmitter.emit('permission-error', permissionError);
      });
      router.push('/lobby');
    }
  };

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push(`/game/${gameId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> EXIT ADMIN
          </Button>
          <h1 className="text-xl font-black uppercase italic">Admin Panel: {gameId}</h1>
          <Button variant="destructive" size="sm" onClick={endGame}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Game State Control */}
          <Card className="bg-card/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase">Current Flow</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Button 
                variant={game.status === 'PREDICTING' ? 'default' : 'secondary'}
                onClick={() => updateStatus('PREDICTING')}
                className="h-20 flex-col font-black italic"
              >
                <RefreshCw className="w-6 h-6 mb-1" />
                NEW PLAY
              </Button>
              <Button 
                variant={game.status === 'LOCKDOWN' ? 'default' : 'secondary'}
                onClick={() => updateStatus('LOCKDOWN')}
                className="h-20 flex-col font-black italic"
              >
                <Lock className="w-6 h-6 mb-1" />
                LOCK SNAPS
              </Button>
              <Button 
                variant={game.status === 'RESOLVING' ? 'default' : 'secondary'}
                onClick={() => updateStatus('RESOLVING')}
                className="h-20 flex-col font-black italic col-span-2"
              >
                <Zap className="w-6 h-6 mb-1" />
                RESOLVE & REVEAL
              </Button>
            </CardContent>
          </Card>

          {/* Result Setting */}
          <Card className="bg-card/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase">Set Last Play Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase opacity-50">Play Type</label>
                 <Select value={lastPlayType} onValueChange={(v) => setLastPlayType(v as PlayType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RUN">RUN</SelectItem>
                      <SelectItem value="PASS">PASS</SelectItem>
                      <SelectItem value="FG">FIELD GOAL</SelectItem>
                      <SelectItem value="PUNT">PUNT</SelectItem>
                    </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase opacity-50">Outcome</label>
                 <Select value={lastOutcome} onValueChange={(v) => setLastOutcome(v as OutcomeType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">NORMAL GAIN</SelectItem>
                      <SelectItem value="TD">TOUCHDOWN</SelectItem>
                      <SelectItem value="FIRST_DOWN">FIRST DOWN</SelectItem>
                      <SelectItem value="SACK">SACK / TFL</SelectItem>
                    </SelectContent>
                 </Select>
               </div>
            </CardContent>
          </Card>

          {/* Game Details */}
          <Card className="bg-card/50 border-white/5 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase">Broadcast Details</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase opacity-50">Situation</label>
                  <Input value={situation} onChange={e => setSituation(e.target.value)} placeholder="3rd & 2 at PHI 45" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase opacity-50">Time Remaining</label>
                  <Input value={timeRemaining} onChange={e => setTimeRemaining(e.target.value)} placeholder="02:45 4TH" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase opacity-50">Away Score</label>
                    <Input type="number" value={scoreAway} onChange={e => setScoreAway(parseInt(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase opacity-50">Home Score</label>
                    <Input type="number" value={scoreHome} onChange={e => setScoreHome(parseInt(e.target.value))} />
                  </div>
                </div>
                <Button onClick={updateGameInfo} className="w-full h-10 font-black italic">
                   <Send className="w-4 h-4 mr-2" /> SYNC BROADCAST INFO
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

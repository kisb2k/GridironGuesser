
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { doc, setDoc, collection, query, where, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Plus, Users, ArrowRight, Loader2, Activity, History, Settings, ExternalLink, Power, Trophy } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { SportType } from "@/lib/types";

export default function LobbyPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [gameIdInput, setGameIdInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedSport, setSelectedSport] = useState<SportType>("FOOTBALL");

  const isAdmin = user?.role === 'ADMIN';

  const adminGamesQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isAdmin) return null;
    return query(
      collection(firestore, "gameSessions"),
      where("adminUid", "==", user.uid)
    );
  }, [firestore, user, isAdmin]);

  const { data: adminGames } = useCollection(adminGamesQuery);

  const activeGames = adminGames?.filter(g => g.status !== 'COMPLETED') || [];
  const historicalGames = adminGames?.filter(g => g.status === 'COMPLETED') || [];

  const createGame = () => {
    if (!user || !firestore || isCreating) return;
    
    setIsCreating(true);
    const newGameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const gameRef = doc(firestore, "gameSessions", newGameId);
    
    const gameData = {
      adminUid: user.uid,
      sport: selectedSport,
      controlMode: "MANUAL",
      status: "PREDICTING",
      situation: selectedSport === 'CRICKET' ? "Start of Over" : "Game Ready",
      scoreAway: 0,
      scoreHome: 0,
      timeRemaining: selectedSport === 'FOOTBALL' ? "15:00 1ST" : selectedSport === 'SOCCER' ? "0:00 1H" : "0:00",
      currentPlayId: `p_${Date.now()}`,
      syncOffset: 0
    };

    setDoc(gameRef, gameData)
      .then(() => {
        router.push(`/admin/${newGameId}`);
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: gameRef.path,
          operation: 'create',
          requestResourceData: gameData
        });
        errorEmitter.emit('permission-error', permissionError);
        setIsCreating(false);
      });
  };

  const joinGame = () => {
    if (gameIdInput.trim()) {
      router.push(`/game/${gameIdInput.trim().toUpperCase()}`);
    }
  };

  if (userLoading) return <main className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></main>;
  if (!user) { router.push('/'); return null; }

  return (
    <main className="min-h-screen bg-background p-6 pb-24 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-black italic tracking-tighter uppercase">Gridiron <span className="text-primary">Lobby</span></h2>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-white/5 px-2 py-1 rounded">Logged in: <span className="text-primary">{user.displayName}</span></span>
            {isAdmin && <span className="text-[10px] font-black bg-primary/20 text-primary px-2 py-1 rounded border border-primary/30">ADMIN PRIVILEGES</span>}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="bg-card/50 border-white/5 glow-primary overflow-hidden">
              <div className="h-1 bg-primary w-full" />
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest">New Session</CardTitle>
                <CardDescription className="text-xs font-bold text-muted-foreground">Host a live prediction game.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase opacity-50">Select Sport</label>
                  <Select value={selectedSport} onValueChange={(v) => setSelectedSport(v as SportType)}>
                    <SelectTrigger className="bg-black/20 border-white/10 h-12 font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOOTBALL">AMERICAN FOOTBALL</SelectItem>
                      <SelectItem value="CRICKET">CRICKET (OVERS)</SelectItem>
                      <SelectItem value="BASEBALL">BASEBALL</SelectItem>
                      <SelectItem value="SOCCER">SOCCER (INTERVALS)</SelectItem>
                      <SelectItem value="HOCKEY">ICE HOCKEY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createGame} disabled={isCreating} className="w-full h-14 font-black italic text-lg shadow-xl">
                  {isCreating ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Plus className="w-6 h-6 mr-2" /> CREATE & MANAGE</>}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-white/5">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest">Join Game</CardTitle>
                <CardDescription className="text-xs font-bold text-muted-foreground">Enter code to play.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="CODE" value={gameIdInput} onChange={(e) => setGameIdInput(e.target.value)} className="h-14 text-center text-2xl font-black uppercase tracking-[4px] bg-black/20" />
                <Button onClick={joinGame} variant="secondary" className="w-full h-12 font-black italic">
                  <Users className="w-5 h-5 mr-2" /> JOIN SQUAD <ArrowRight className="w-5 h-5 ml-auto" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {isAdmin && (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Active Controls</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)} className="text-[10px] font-black uppercase">
                  <History className="w-3 h-3 mr-1" /> {showHistory ? "HIDE HISTORY" : "VIEW HISTORY"}
                </Button>
              </div>

              <div className="space-y-3">
                {activeGames.map((game) => (
                  <Card key={game.id} className="bg-card/30 border-primary/20 hover:bg-card/50 transition-colors">
                    <div className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black italic text-primary">{game.id}</span>
                          <span className="text-[8px] px-1.5 py-0.5 bg-secondary/20 text-secondary rounded-full font-black uppercase">{game.sport}</span>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{game.situation}</p>
                      </div>
                      <Button size="sm" className="h-8 font-black text-[10px] italic" onClick={() => router.push(`/admin/${game.id}`)}>
                        <Settings className="w-3.5 h-3.5 mr-1" /> MANAGE
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

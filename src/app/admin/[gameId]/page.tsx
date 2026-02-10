
"use client"

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFirestore, useDoc, useUser, useMemoFirebase, useCollection } from "@/firebase";
import { doc, updateDoc, collection } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SportType, ControlMode } from "@/lib/types";
import { ArrowLeft, Send, Lock, Zap, Loader2, Play, Activity, Radio, PowerOff, Users, CheckCircle2, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function AdminPage() {
  const { gameId } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const gameRef = useMemoFirebase(() => 
    firestore && gameId ? doc(firestore, 'gameSessions', gameId as string) : null
  , [firestore, gameId]);

  const { data: game, loading } = useDoc<any>(gameRef);

  // Predictions listener for roster tracking
  const predictionsRef = useMemoFirebase(() => 
    firestore && gameId ? collection(firestore, 'gameSessions', gameId as string, 'predictions') : null
  , [firestore, gameId]);

  const { data: predictionsData } = useCollection<any>(predictionsRef);

  const [situation, setSituation] = useState("");
  const [scoreAway, setScoreAway] = useState(0);
  const [scoreHome, setScoreHome] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [lastPlayType, setLastPlayType] = useState<string>("");
  const [lastOutcome, setLastOutcome] = useState<string>("");
  const [controlMode, setControlMode] = useState<ControlMode>("MANUAL");

  useEffect(() => {
    if (game) {
      setSituation(game.situation || "");
      setScoreAway(game.scoreAway || 0);
      setScoreHome(game.scoreHome || 0);
      setTimeRemaining(game.timeRemaining || "");
      setControlMode(game.controlMode || "MANUAL");
      
      if (!lastPlayType) {
        if (game.sport === 'FOOTBALL') setLastPlayType('RUN');
        if (game.sport === 'CRICKET') setLastPlayType('RUNS');
        if (game.sport === 'BASEBALL') setLastPlayType('IN_PLAY');
        if (game.sport === 'SOCCER' || game.sport === 'HOCKEY') setLastPlayType('INTERVAL_CLEAN');
      }
    }
  }, [game]);

  // Derived participant roster
  const participants = useMemo(() => {
    if (!predictionsData || !game) return [];
    const usersMap = new Map();
    
    // Track everyone who has ever predicted in this session
    predictionsData.forEach(p => {
      if (!usersMap.has(p.userId)) {
        usersMap.set(p.userId, { 
          userId: p.userId, 
          username: p.username, 
          hasVotedCurrent: false 
        });
      }
      if (p.playId === game.currentPlayId) {
        usersMap.get(p.userId).hasVotedCurrent = true;
      }
    });
    
    return Array.from(usersMap.values());
  }, [predictionsData, game?.currentPlayId]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  if (!game || (game.adminUid !== user?.uid)) return <div className="min-h-screen bg-background flex items-center justify-center">Unauthorized</div>;

  const updateStatus = (status: string) => {
    if (!gameRef) return;
    const update: any = { status };
    if (status === 'PREDICTING') {
      update.currentPlayId = `p_${Date.now()}`;
      update.lastResult = null;
    }
    if (status === 'RESOLVING') {
      update.lastResult = {
        type: lastPlayType,
        outcome: lastOutcome,
        description: `Resolution: ${lastPlayType} resulted in ${lastOutcome || 'N/A'}`,
      };
    }
    
    updateDoc(gameRef, update).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: gameRef.path, operation: 'update', requestResourceData: update }));
    });

    if (status === 'COMPLETED') {
        router.push('/lobby');
    }
  };

  const updateGameInfo = () => {
    if (!gameRef) return;
    const update = { situation, scoreAway, scoreHome, timeRemaining, controlMode };
    updateDoc(gameRef, update).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: gameRef.path, operation: 'update', requestResourceData: update }));
    });
  };

  const sportOptions = {
    FOOTBALL: { plays: ['RUN', 'PASS', 'FG', 'PUNT'], outcomes: ['TD', 'FIRST_DOWN', 'SACK', 'INCOMPLETE', 'NONE'] },
    CRICKET: { plays: ['DOT', 'RUNS', 'WICKET', 'BOUNDARY'], outcomes: ['WICKET', 'SIX', 'FOUR', 'SINGLE'] },
    BASEBALL: { plays: ['STRIKE', 'BALL', 'IN_PLAY'], outcomes: ['HOME_RUN', 'STRIKEOUT', 'WALK', 'HIT'] },
    SOCCER: { plays: ['INTERVAL_GOAL', 'INTERVAL_CLEAN'], outcomes: ['GOAL', 'SAVE', 'PENALTY'] },
    HOCKEY: { plays: ['INTERVAL_GOAL', 'INTERVAL_CLEAN'], outcomes: ['GOAL', 'SAVE', 'PENALTY'] },
  }[game.sport as SportType] || { plays: [], outcomes: [] };

  return (
    <main className="min-h-screen bg-background p-6 pb-32">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push(`/lobby`)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> LOBBY
          </Button>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-black uppercase italic tracking-tighter">{game.sport} Command Center</h1>
          </div>
          <div className="flex items-center gap-2 bg-card/50 px-3 py-1.5 rounded-full border border-white/5">
             <Radio className={cn("w-3 h-3", controlMode === 'LIVE' ? "text-primary animate-pulse" : "text-muted-foreground")} />
             <span className="text-[10px] font-black uppercase">{controlMode} MODE</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Main Flow Control */}
              <Card className="bg-card/50 border-primary/20 shadow-xl overflow-hidden relative">
                <div className={cn(
                    "absolute top-0 left-0 w-full h-1", 
                    game.status === 'PREDICTING' ? 'bg-primary' : 
                    game.status === 'LOCKDOWN' ? 'bg-destructive' :
                    game.status === 'RESOLVING' ? 'bg-secondary' : 'bg-muted'
                )} />
                <CardHeader className="flex flex-row items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Status: {game.status}</span>
                  <div className="flex items-center space-x-2">
                    <Switch id="live-mode" checked={controlMode === 'LIVE'} onCheckedChange={(v) => setControlMode(v ? 'LIVE' : 'MANUAL')} />
                    <Label htmlFor="live-mode" className="text-[10px] font-bold uppercase">Live Sync</Label>
                  </div>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-2 gap-4">
                  <Button variant={game.status === 'PREDICTING' ? 'default' : 'secondary'} onClick={() => updateStatus('PREDICTING')} className="h-24 flex-col font-black italic text-lg">
                    <Play className="w-8 h-8 mb-2 fill-current" /> {game.sport === 'SOCCER' || game.sport === 'HOCKEY' ? 'START INTERVAL' : 'START PLAY'}
                  </Button>
                  <Button variant={game.status === 'LOCKDOWN' ? 'default' : 'secondary'} onClick={() => updateStatus('LOCKDOWN')} className="h-24 flex-col font-black italic text-lg">
                    <Lock className="w-8 h-8 mb-2" /> LOCK
                  </Button>
                  <Button variant={game.status === 'RESOLVING' ? 'default' : 'secondary'} onClick={() => updateStatus('RESOLVING')} className="h-20 flex-col font-black italic col-span-2 border-primary/20">
                    <Zap className="w-6 h-6 mb-1 fill-current" /> RESOLVE & REVEAL
                  </Button>
                </CardContent>
              </Card>

              {/* Preset Controls */}
              <Card className="bg-card/50 border-white/5">
                <CardHeader><CardTitle className="text-sm font-black uppercase">Result Presets</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase opacity-50">Call Type</label>
                    <Select value={lastPlayType} onValueChange={setLastPlayType}>
                        <SelectTrigger className="bg-black/20 h-12 font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {sportOptions.plays.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase opacity-50">Outcome</label>
                    <Select value={lastOutcome} onValueChange={setLastOutcome}>
                        <SelectTrigger className="bg-black/20 h-12 font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {sportOptions.outcomes.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Broadcast Info Dashboard */}
            <Card className="bg-card/50 border-white/5">
              <CardHeader><CardTitle className="text-sm font-black uppercase">Broadcast Dashboard</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase opacity-50">Situation</label>
                    <Input value={situation} onChange={e => setSituation(e.target.value)} className="bg-black/20 h-12 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase opacity-50">Game Clock / Period</label>
                    <Input value={timeRemaining} onChange={e => setTimeRemaining(e.target.value)} className="bg-black/20 h-12 font-bold" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase opacity-50">Away Score</label>
                      <Input type="number" value={scoreAway} onChange={e => setScoreAway(parseInt(e.target.value))} className="bg-black/20 h-12 text-center font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase opacity-50">Home Score</label>
                      <Input type="number" value={scoreHome} onChange={e => setScoreHome(parseInt(e.target.value))} className="bg-black/20 h-12 text-center font-bold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <Button onClick={updateGameInfo} className="h-12 font-black italic shadow-lg">
                        <Send className="w-4 h-4 mr-2" /> PUSH UPDATES
                      </Button>
                      <Button variant="destructive" onClick={() => updateStatus('COMPLETED')} className="h-12 font-black italic border-2 border-white/10">
                        <PowerOff className="w-4 h-4 mr-2" /> END SESSION
                      </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Roster Sidebar - Made Sticky */}
          <aside className="lg:sticky lg:top-6 space-y-6">
            <Card className="bg-card/50 border-white/5 flex flex-col h-fit max-h-[calc(100vh-8rem)]">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4 shrink-0">
                <div>
                  <CardTitle className="text-sm font-black uppercase">Live Roster</CardTitle>
                  <div className="flex items-center gap-1 mt-1">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] font-bold text-muted-foreground">{participants.length} PLAYING</span>
                  </div>
                </div>
                <div className="bg-primary/10 px-2 py-1 rounded text-[10px] font-black text-primary uppercase">
                  {participants.filter(p => p.hasVotedCurrent).length}/{participants.length} READY
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto">
                <div className="divide-y divide-white/5">
                  {participants.map((player) => (
                    <div key={player.userId} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          player.hasVotedCurrent ? "bg-primary animate-pulse" : "bg-muted"
                        )} />
                        <span className="text-xs font-bold uppercase">{player.username}</span>
                      </div>
                      {player.hasVotedCurrent ? (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      ) : (
                        <Clock className="w-4 h-4 text-muted-foreground animate-pulse" />
                      )}
                    </div>
                  ))}
                  {participants.length === 0 && (
                    <div className="p-8 text-center">
                      <Users className="w-8 h-8 text-muted mx-auto mb-2" />
                      <p className="text-[10px] font-black text-muted-foreground uppercase">Waiting for players...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
      
      <div className="fixed bottom-8 right-8 z-50">
        <Button onClick={() => updateStatus('PREDICTING')} className="w-16 h-16 rounded-full shadow-2xl glow-primary border-2 border-white/20" size="icon">
          <Play className="w-8 h-8 fill-current" />
        </Button>
      </div>
    </main>
  );
}

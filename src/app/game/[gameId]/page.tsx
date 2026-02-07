
'use client';

import { useParams, useRouter } from "next/navigation";
import { useGameState } from "@/hooks/useGameState";
import { useUser } from "@/firebase";
import { StatsBar } from "@/components/game/StatsBar";
import { PredictionCard } from "@/components/game/PredictionCard";
import { Leaderboard } from "@/components/game/Leaderboard";
import { SyncControl } from "@/components/game/SyncControl";
import { Play, AlertCircle, Settings, ArrowLeft, Trophy, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { announcerVoice } from "@/ai/flows/announcer-flow";

export default function GamePage() {
  const { gameId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { game, stats, makePrediction, loading, syncOffset, updateSyncOffset } = useGameState(gameId as string);
  const [delayedPlayState, setDelayedPlayState] = useState<'PREDICTING' | 'LOCKDOWN' | 'RESOLVING' | 'COMPLETED' | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastAnnouncedId = useRef<string>("");

  useEffect(() => {
    if (!game) return;
    
    const timeout = setTimeout(() => {
      setDelayedPlayState(game.playState);
      
      // AI Announcer logic: Announce new situations
      if (game.currentPlayId !== lastAnnouncedId.current && game.playState === 'PREDICTING') {
        lastAnnouncedId.current = game.currentPlayId;
        announcerVoice({ 
          situation: game.situation, 
          lastResult: game.lastResult?.description 
        }).then(res => {
          setAudioUrl(res.audioData);
        }).catch(err => console.error("Announcer Error:", err));
      }
    }, syncOffset * 1000);

    return () => clearTimeout(timeout);
  }, [game?.playState, game?.currentPlayId, syncOffset, game?.situation]);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Autoplay might be blocked until user interaction
        console.log("Audio autoplay blocked - waiting for interaction");
      });
    }
  }, [audioUrl]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <span className="text-primary font-black animate-pulse">SYNCING WITH BROADCAST...</span>
    </div>
  );

  if (!game) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-black mb-4 uppercase">Game Not Found</h1>
      <Button onClick={() => router.push('/lobby')}>BACK TO LOBBY</Button>
    </div>
  );

  const isAdmin = user?.uid === game.adminUid;
  const activeGameState = { ...game, playState: delayedPlayState || game.playState };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <StatsBar stats={stats} game={activeGameState} />
      
      {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" />}

      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
        <aside className="hidden lg:flex flex-col gap-6 w-80 shrink-0">
          <div className="bg-card/30 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.push('/lobby')} className="text-[10px] font-black uppercase">
               <ArrowLeft className="w-3 h-3 mr-1" /> Lobby
            </Button>
            <span className="text-[10px] font-black text-primary px-2 py-1 bg-primary/10 rounded">ID: {gameId}</span>
          </div>

          <SyncControl value={syncOffset} onChange={updateSyncOffset} />

          {isAdmin && (
            <Button 
              variant="outline" 
              className="border-primary text-primary hover:bg-primary/10 h-12 font-black italic uppercase"
              onClick={() => router.push(`/admin/${gameId}`)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Admin Controls
            </Button>
          )}

          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
             <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-4 h-4 text-primary" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Audio Feed</h3>
             </div>
             <p className="text-xs font-bold leading-relaxed">
               The AI Stadium Announcer is synced to your broadcast delay.
             </p>
          </div>
        </aside>

        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pb-24 lg:pb-0">
          <PredictionCard 
            game={activeGameState} 
            stats={stats} 
            onPredict={makePrediction} 
          />

          {activeGameState.playState === 'RESOLVING' && activeGameState.lastResult && (
            <div className="max-w-lg mx-auto w-full animate-in slide-in-from-bottom-4 duration-500">
              <div className={cn(
                "p-4 rounded-xl border flex items-center justify-between shadow-xl",
                stats.prediction?.playType === activeGameState.lastResult.type 
                  ? "bg-secondary/20 border-secondary/50 text-secondary glow-secondary" 
                  : "bg-destructive/10 border-destructive/30 text-destructive"
              )}>
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center shrink-0">
                      <Play className="w-5 h-5 fill-current" />
                   </div>
                   <div>
                     <span className="block text-xs font-black uppercase tracking-widest">
                       {stats.prediction?.playType === activeGameState.lastResult.type ? "BOOM! CORRECT" : "PLAY MISSED"}
                     </span>
                     <p className="text-[10px] font-bold opacity-80">{activeGameState.lastResult.description}</p>
                   </div>
                </div>
                <div className="text-right">
                   <span className="text-lg font-black italic">
                     {stats.prediction?.playType === activeGameState.lastResult.type ? `+${10 * (stats.streak + 1)}` : "0"}
                   </span>
                   <span className="block text-[8px] font-bold">PTS</span>
                </div>
              </div>
            </div>
          )}

          <div className="lg:hidden">
            <Leaderboard currentUserRank={stats.rank} />
          </div>
        </div>

        <aside className="hidden lg:block w-96 shrink-0">
          <Leaderboard currentUserRank={stats.rank} />
        </aside>
      </div>

      <footer className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-white/5 p-4 z-50">
        <div className="flex items-center justify-around gap-4 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase text-primary">Group: {gameId}</span>
          </div>
          {isAdmin && (
            <Button size="sm" variant="outline" className="text-[10px]" onClick={() => router.push(`/admin/${gameId}`)}>ADMIN</Button>
          )}
        </div>
      </footer>
    </main>
  );
}

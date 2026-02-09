
'use client';

import { useParams, useRouter } from "next/navigation";
import { useGameState } from "@/hooks/useGameState";
import { useUser } from "@/firebase";
import { StatsBar } from "@/components/game/StatsBar";
import { SyncControl } from "@/components/game/SyncControl";
import { Settings, ArrowLeft, Volume2, Loader2, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { announcerVoice } from "@/ai/flows/announcer-flow";

export default function GamePage() {
  const { gameId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { game, stats, loading, syncOffset, updateSyncOffset } = useGameState(gameId as string);
  const [delayedPlayState, setDelayedPlayState] = useState<'PREDICTING' | 'LOCKDOWN' | 'RESOLVING' | 'COMPLETED' | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastAnnouncedId = useRef<string>("");

  useEffect(() => {
    if (!game) return;
    
    const timeout = setTimeout(() => {
      setDelayedPlayState(game.playState);
      
      if (game.currentPlayId !== lastAnnouncedId.current && game.playState === 'PREDICTING') {
        lastAnnouncedId.current = game.currentPlayId;
        announcerVoice({ 
          situation: game.situation, 
          lastResult: game.lastResult?.description 
        }).then(res => {
          if (res && res.audioData) {
            setAudioUrl(res.audioData);
          }
        }).catch(err => {
          console.warn("Announcer flow failed:", err);
        });
      }
    }, syncOffset * 1000);

    return () => clearTimeout(timeout);
  }, [game?.playState, game?.currentPlayId, syncOffset, game?.situation]);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch(() => {
        console.log("Audio autoplay blocked");
      });
    }
  }, [audioUrl]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
        <span className="text-primary font-black block uppercase tracking-tighter">Syncing with Gridiron...</span>
      </div>
    </div>
  );

  if (!game) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
      <h1 className="text-2xl font-black mb-2 uppercase">Game Session Not Found</h1>
      <p className="text-muted-foreground mb-8 text-sm">The ID "{gameId}" does not exist or has ended.</p>
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
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Live Audio</h3>
             </div>
             <p className="text-xs font-bold leading-relaxed">
               Announcer is synced to your delay.
             </p>
          </div>
        </aside>

        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="bg-card/50 border border-white/5 rounded-3xl p-12 text-center space-y-4 max-w-md w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
            <h2 className="text-primary text-xs font-black uppercase tracking-[0.2em]">Game Feed Active</h2>
            <h1 className="text-4xl font-black italic uppercase italic leading-tight">
              {activeGameState.situation}
            </h1>
            
            <div className="pt-12 space-y-4">
              <div className="bg-primary/10 rounded-xl p-4 flex items-start gap-3 text-left">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[10px] font-black uppercase text-primary mb-1">Observation Mode</h4>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">
                    Interactive predictions are temporarily offline while we optimize the sync feed. You can still watch the live situation and listen to the announcer.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 opacity-50">
                <div className="bg-white/5 rounded-xl p-4">
                  <span className="block text-[8px] font-black text-muted-foreground uppercase">Current State</span>
                  <span className="text-xs font-bold uppercase">{activeGameState.playState}</span>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <span className="block text-[8px] font-black text-muted-foreground uppercase">Play ID</span>
                  <span className="text-xs font-bold uppercase">{activeGameState.currentPlayId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

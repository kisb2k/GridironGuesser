
'use client';

import { useParams, useRouter } from "next/navigation";
import { useGameState } from "@/hooks/useGameState";
import { useUser } from "@/firebase";
import { StatsBar } from "@/components/game/StatsBar";
import { SyncControl } from "@/components/game/SyncControl";
import { Settings, ArrowLeft, Volume2, Loader2, AlertTriangle, Info, Menu, Lock, Play, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { announcerVoice } from "@/ai/flows/announcer-flow";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  const activePlayState = delayedPlayState || game.playState;
  const activeGameState = { ...game, playState: activePlayState };

  const SidebarContent = () => (
    <div className="flex flex-col gap-6">
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
          className="border-primary text-primary hover:bg-primary/10 h-12 font-black italic uppercase w-full"
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
    </div>
  );

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <StatsBar stats={stats} game={activeGameState} />
      
      {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" />}

      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-8 max-w-[1600px] mx-auto w-full">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col gap-6 w-80 shrink-0">
          <SidebarContent />
        </aside>

        {/* Mobile Header / Settings */}
        <div className="lg:hidden flex justify-between items-center mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/lobby')} className="text-[10px] font-black uppercase">
            <ArrowLeft className="w-3 h-3 mr-1" /> Lobby
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="bg-card/30 border-white/5 font-black uppercase text-[10px]">
                <Menu className="w-4 h-4 mr-2" /> Settings
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background border-white/10 w-[300px]">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-left font-black italic uppercase">Session Settings</SheetTitle>
              </SheetHeader>
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-4">
          <div className="bg-card/50 border border-white/5 rounded-3xl p-8 md:p-12 text-center space-y-4 max-w-xl w-full relative overflow-hidden">
            <div className={cn(
              "absolute top-0 left-0 w-full h-1.5 transition-colors duration-500",
              activePlayState === 'PREDICTING' ? "bg-primary" : 
              activePlayState === 'LOCKDOWN' ? "bg-destructive" : 
              "bg-secondary"
            )} />
            
            <div className="flex flex-col items-center gap-2">
               {activePlayState === 'PREDICTING' && (
                 <div className="flex items-center gap-2 text-primary animate-pulse">
                   <Play className="w-4 h-4 fill-current" />
                   <span className="text-xs font-black uppercase tracking-widest">Live: Taking Snaps</span>
                 </div>
               )}
               {activePlayState === 'LOCKDOWN' && (
                 <div className="flex items-center gap-2 text-destructive">
                   <Lock className="w-4 h-4" />
                   <span className="text-xs font-black uppercase tracking-widest">Locked: Play in Progress</span>
                 </div>
               )}
               {activePlayState === 'RESOLVING' && (
                 <div className="flex items-center gap-2 text-secondary">
                   <Zap className="w-4 h-4 fill-current" />
                   <span className="text-xs font-black uppercase tracking-widest">Revealing Result</span>
                 </div>
               )}
            </div>

            <h1 className="text-3xl md:text-5xl font-black italic uppercase leading-tight mt-4">
              {activeGameState.situation}
            </h1>
            
            <div className="pt-8 md:pt-12 space-y-4">
              <div className="bg-primary/10 rounded-xl p-4 flex items-start gap-3 text-left border border-primary/10">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[10px] font-black uppercase text-primary mb-1">Broadcast Mode</h4>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">
                    Follow the game live. Sync your delay in settings to match your TV broadcast.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <span className="block text-[8px] font-black text-muted-foreground uppercase mb-1">Status</span>
                  <span className={cn(
                    "text-[10px] md:text-xs font-black uppercase",
                    activePlayState === 'PREDICTING' ? "text-primary" : "text-foreground"
                  )}>
                    {activePlayState === 'PREDICTING' ? 'READY' : activePlayState}
                  </span>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <span className="block text-[8px] font-black text-muted-foreground uppercase mb-1">Play ID</span>
                  <span className="text-[10px] md:text-xs font-bold uppercase tabular-nums">
                    {activeGameState.currentPlayId.slice(-4)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

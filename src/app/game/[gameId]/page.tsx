
'use client';

import { useParams, useRouter } from "next/navigation";
import { useGameState } from "@/hooks/useGameState";
import { useUser } from "@/firebase";
import { StatsBar } from "@/components/game/StatsBar";
import { SyncControl } from "@/components/game/SyncControl";
import { Leaderboard } from "@/components/game/Leaderboard";
import { ActivityBoard } from "@/components/game/ActivityBoard";
import { Settings, ArrowLeft, Volume2, Loader2, AlertTriangle, Menu, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { announcerVoice } from "@/ai/flows/announcer-flow";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PredictionCard } from "@/components/game/PredictionCard";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function GamePage() {
  const { gameId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { game, stats, makePrediction, loading, syncOffset, updateSyncOffset } = useGameState(gameId as string);
  const [delayedPlayState, setDelayedPlayState] = useState<any>(null);
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
          if (res && res.audioData) setAudioUrl(res.audioData);
        }).catch(err => console.warn("Announcer flow failed:", err));
      }
    }, syncOffset * 1000);

    return () => clearTimeout(timeout);
  }, [game?.playState, game?.currentPlayId, syncOffset, game?.situation]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;
  if (!game) return <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6"><AlertTriangle className="w-16 h-16 text-destructive mb-4" /><h1 className="text-2xl font-black mb-2 uppercase">Game Not Found</h1><Button onClick={() => router.push('/lobby')}>BACK TO LOBBY</Button></div>;

  const isAdmin = user?.role === 'ADMIN';
  const activePlayState = delayedPlayState || game.playState;
  const activeGameState = { ...game, playState: activePlayState };

  const SidebarContent = () => (
    <div className="flex flex-col gap-6 h-full">
      <div className="bg-card/30 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push('/lobby')} className="text-[10px] font-black uppercase">
          <ArrowLeft className="w-3 h-3 mr-1" /> Lobby
        </Button>
        <span className="text-[10px] font-black text-primary px-2 py-1 bg-primary/10 rounded">ID: {gameId}</span>
      </div>

      <ScrollArea className="flex-1 pr-4 -mr-4">
        <div className="space-y-8 pb-8">
          <SyncControl value={syncOffset} onChange={updateSyncOffset} />
          
          <ActivityBoard gameId={gameId as string} currentPlayId={game.currentPlayId} />
          
          <Leaderboard gameId={gameId as string} />

          {isAdmin && (
            <Button variant="outline" className="border-primary text-primary h-12 font-black italic uppercase w-full" onClick={() => router.push(`/admin/${gameId}`)}>
              <Settings className="w-4 h-4 mr-2" /> Admin Controls
            </Button>
          )}

          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
             <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-4 h-4 text-primary" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Live Audio</h3>
             </div>
             <p className="text-xs font-bold leading-relaxed">AI Announcer is active for this session.</p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <StatsBar stats={stats} game={activeGameState} />
      {audioUrl && <audio ref={audioRef} src={audioUrl} autoPlay className="hidden" />}

      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-8 max-w-[1600px] mx-auto w-full overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col gap-6 w-80 shrink-0 h-[calc(100vh-10rem)]">
          <SidebarContent />
        </aside>
        
        {/* Mobile Header/Settings */}
        <div className="lg:hidden flex justify-between items-center mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/lobby')} className="text-[10px] font-black uppercase">
            <ArrowLeft className="w-3 h-3 mr-1" /> Lobby
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="bg-card/30 border-white/5 font-black uppercase text-[10px]">
                <Menu className="w-4 h-4 mr-2" /> Info & Settings
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background border-white/10 w-full sm:w-[400px]">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-left font-black uppercase italic tracking-tight">Game Center</SheetTitle>
              </SheetHeader>
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Interaction Area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 min-h-[400px]">
          {activePlayState === 'RESOLVING' && activeGameState.lastResult ? (
            <div className="bg-card/50 border border-white/5 rounded-3xl p-8 text-center space-y-6 animate-in zoom-in duration-500 w-full max-w-xl shadow-2xl">
               <Zap className="w-12 h-12 text-secondary mx-auto animate-bounce fill-current" />
               <h1 className="text-5xl font-black italic uppercase text-secondary tracking-tighter">PLAY RESULT</h1>
               <div className="space-y-2">
                 <p className="text-3xl font-black uppercase tracking-tight">{activeGameState.lastResult.outcome}</p>
                 <p className="text-lg font-bold italic opacity-80">{activeGameState.lastResult.description}</p>
               </div>
            </div>
          ) : (
            <PredictionCard game={activeGameState} stats={stats} onPredict={makePrediction} />
          )}
        </div>
      </div>
    </main>
  );
}

"use client"

import { PlayType, GameState, UserStats, OutcomeType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Flame, Lock, ChevronRight } from "lucide-react";

interface PredictionCardProps {
  game: GameState;
  stats: UserStats;
  onPredict: (playType: PlayType, outcome?: OutcomeType) => void;
}

export function PredictionCard({ game, stats, onPredict }: PredictionCardProps) {
  const [timeLeft, setTimeLeft] = useState(20);
  const [deepCutActive, setDeepCutActive] = useState(false);

  useEffect(() => {
    if (game.playState !== 'PREDICTING') return;
    
    setTimeLeft(20);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [game.playState, game.currentPlayId]);

  const progress = (timeLeft / 20) * 100;
  const isLocked = game.playState === 'LOCKDOWN' || game.playState === 'RESOLVING' || timeLeft <= 0;

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto w-full px-4 py-8">
      <div className="space-y-2 text-center">
        <h2 className="text-primary text-sm font-black tracking-widest uppercase">Next Play</h2>
        <h1 className="text-4xl font-black italic tracking-tighter leading-none">
          {game.situation}
        </h1>
      </div>

      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000"></div>
        <div className="relative bg-card border border-white/10 rounded-2xl p-6 glow-primary">
          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-1">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  timeLeft < 5 ? "text-destructive animate-pulse-intense" : "text-muted-foreground"
                )}>
                  {isLocked ? "SNAP LOCKED" : "LOCKING IN..."}
                </span>
                <span className="text-xs font-mono font-bold">{Math.ceil(timeLeft)}s</span>
              </div>
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden relative">
                <div 
                  className={cn(
                    "h-full transition-all duration-100 burning-fuse rounded-full",
                    timeLeft < 5 && "brightness-125"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                size="lg"
                disabled={isLocked}
                onClick={() => onPredict('RUN')}
                className={cn(
                  "h-32 text-2xl font-black uppercase rounded-xl transition-all relative overflow-hidden",
                  stats.prediction?.playType === 'RUN' 
                    ? "bg-secondary text-background hover:bg-secondary/90 scale-95" 
                    : "bg-white/5 hover:bg-white/10 text-foreground"
                )}
              >
                RUN
                {stats.prediction?.playType === 'RUN' && (
                  <div className="absolute top-2 right-2">
                    <Flame className="w-5 h-5 fill-background" />
                  </div>
                )}
              </Button>

              <Button
                size="lg"
                disabled={isLocked}
                onClick={() => onPredict('PASS')}
                className={cn(
                  "h-32 text-2xl font-black uppercase rounded-xl transition-all relative overflow-hidden",
                  stats.prediction?.playType === 'PASS' 
                    ? "bg-primary text-background hover:bg-primary/90 scale-95" 
                    : "bg-white/5 hover:bg-white/10 text-foreground"
                )}
              >
                PASS
                {stats.prediction?.playType === 'PASS' && (
                  <div className="absolute top-2 right-2">
                    <Flame className="w-5 h-5 fill-background" />
                  </div>
                )}
              </Button>
            </div>

            <div className="flex flex-col gap-3">
               <div className="flex items-center justify-between px-2">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase">Social Feed</span>
                 <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                    <span className="text-[10px] font-bold text-secondary">72% FANS SELECT PASS</span>
                 </div>
               </div>

               <Button 
                variant="outline" 
                size="sm"
                disabled={isLocked || !stats.prediction}
                onClick={() => setDeepCutActive(!deepCutActive)}
                className={cn(
                  "w-full border-dashed transition-all",
                  deepCutActive ? "bg-secondary/10 border-secondary text-secondary" : "hover:border-primary/50"
                )}
               >
                 {deepCutActive ? "DEEP CUT ACTIVE: TOUCHDOWN" : "+ ADD DEEP CUT (+50 PTS)"}
               </Button>
            </div>
          </div>

          {isLocked && game.playState !== 'PREDICTING' && (
            <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center backdrop-blur-[2px] z-10">
              <Lock className="w-12 h-12 text-primary mb-2" />
              <span className="text-xl font-black italic uppercase text-primary">Live Lockdown</span>
              <p className="text-xs text-white/70 font-bold">THE BALL HAS BEEN SNAPPED</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
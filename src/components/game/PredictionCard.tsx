
"use client"

import { GameState, UserStats } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Flame, Lock, Zap, Clock, Trophy } from "lucide-react";

interface PredictionCardProps {
  game: GameState;
  stats: UserStats;
  onPredict: (playType: string, outcome?: string) => void;
}

export function PredictionCard({ game, stats, onPredict }: PredictionCardProps) {
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedPlay, setSelectedPlay] = useState<string | null>(null);

  useEffect(() => {
    if (game.playState !== 'PREDICTING') return;
    setTimeLeft(20);
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev <= 0 ? 0 : prev - 0.1);
    }, 100);
    return () => clearInterval(interval);
  }, [game.playState, game.currentPlayId]);

  const isLocked = game.playState === 'LOCKDOWN' || game.playState === 'RESOLVING' || timeLeft <= 0;

  const sportConfig = {
    FOOTBALL: { labels: ['RUN', 'PASS', 'FIELD GOAL', 'PUNT'], types: ['RUN', 'PASS', 'FG', 'PUNT'] },
    CRICKET: { labels: ['DOT', 'RUNS', 'WICKET', 'BOUNDARY'], types: ['DOT', 'RUNS', 'WICKET', 'BOUNDARY'] },
    BASEBALL: { labels: ['STRIKE', 'BALL', 'IN PLAY'], types: ['STRIKE', 'BALL', 'IN_PLAY'] },
    SOCCER: { labels: ['GOAL NEXT 5m', 'CLEAN SHEET 5m'], types: ['INTERVAL_GOAL', 'INTERVAL_CLEAN'] },
    HOCKEY: { labels: ['GOAL NEXT 5m', 'POWER PLAY'], types: ['INTERVAL_GOAL', 'POWER_PLAY'] },
  }[game.sport] || { labels: [], types: [] };

  const handleSelect = (type: string) => {
    setSelectedPlay(type);
    onPredict(type);
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto w-full px-4 py-8">
      <div className="space-y-2 text-center">
        <h2 className="text-primary text-[10px] font-black tracking-widest uppercase">
          {game.sport === 'CRICKET' ? 'NEXT OVER OUTCOME' : game.sport === 'BASEBALL' ? 'NEXT PITCH' : 'NEXT PLAY'}
        </h2>
        <h1 className="text-4xl font-black italic tracking-tighter leading-none uppercase">
          {game.situation}
        </h1>
      </div>

      <div className="relative bg-card border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden">
        <div className={cn(
          "absolute top-0 left-0 h-1 transition-all duration-100 bg-primary",
          timeLeft < 5 && "bg-destructive animate-pulse"
        )} style={{ width: `${(timeLeft / 20) * 100}%` }} />

        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] font-black uppercase text-muted-foreground">
            {isLocked ? 'WINDOW CLOSED' : 'VOTES OPEN'}
          </span>
          <div className="flex items-center gap-1 font-mono font-bold text-xs">
            <Clock className="w-3 h-3" /> {Math.ceil(timeLeft)}s
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {sportConfig.types.map((type, idx) => (
            <Button
              key={type}
              disabled={isLocked}
              onClick={() => handleSelect(type)}
              className={cn(
                "h-28 text-xl font-black uppercase rounded-2xl transition-all flex-col",
                selectedPlay === type ? "bg-primary text-background" : "bg-white/5 hover:bg-white/10"
              )}
            >
              {sportConfig.labels[idx]}
              {selectedPlay === type && <Flame className="w-4 h-4 mt-2 fill-current" />}
            </Button>
          ))}
        </div>

        {isLocked && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm z-20 animate-in fade-in duration-300">
            <Lock className="w-10 h-10 text-primary mb-2" />
            <span className="text-xl font-black italic uppercase text-primary">Live Lockdown</span>
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1">Sync your feed</p>
          </div>
        )}
      </div>

      <div className="bg-primary/5 rounded-2xl p-4 border border-primary/20 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase">Your Streak</span>
         </div>
         <span className="text-lg font-black italic text-primary">x{stats.streak}</span>
      </div>
    </div>
  );
}

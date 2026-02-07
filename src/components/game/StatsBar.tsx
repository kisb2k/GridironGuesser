
'use client';

import { UserStats, GameState } from "@/lib/types";
import { Trophy, Flame } from "lucide-react";

export function StatsBar({ stats, game }: { stats: UserStats, game: GameState }) {
  return (
    <div className="w-full bg-card/50 backdrop-blur-md border-b border-white/5 p-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex flex-col">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Current Score</span>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary tabular-nums">{stats.points.toLocaleString()}</span>
          <span className="text-[10px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded font-bold">PTS</span>
        </div>
      </div>

      <div className="flex flex-col items-center bg-black/40 px-6 py-2 rounded-xl border border-white/5">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <span className="block text-[10px] text-muted-foreground font-bold">AWAY</span>
            <span className="text-xl font-black">{game.score.away}</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <span className="block text-[10px] text-muted-foreground font-bold">HOME</span>
            <span className="text-xl font-black">{game.score.home}</span>
          </div>
        </div>
        <span className="text-[10px] text-primary/80 font-bold mt-1">{game.timeRemaining}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end">
          <div className="flex items-center gap-1 text-secondary">
            <Flame className="w-4 h-4 fill-current" />
            <span className="text-sm font-bold">x{stats.streak}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">STREAK</span>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-primary">
            <Trophy className="w-4 h-4" />
            <span className="text-sm font-bold">#{stats.rank.toLocaleString()}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">RANK</span>
        </div>
      </div>
    </div>
  );
}

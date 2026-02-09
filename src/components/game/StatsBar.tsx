'use client';

import { UserStats, GameState } from "@/lib/types";
import { Trophy, Flame } from "lucide-react";

export function StatsBar({ stats, game }: { stats: UserStats, game: GameState }) {
  return (
    <div className="w-full bg-card/80 backdrop-blur-lg border-b border-white/5 p-3 md:p-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex flex-col">
        <span className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Points</span>
        <div className="flex items-center gap-1 md:gap-2">
          <span className="text-lg md:text-xl font-bold text-primary tabular-nums">{stats.points.toLocaleString()}</span>
          <span className="text-[8px] bg-secondary/20 text-secondary px-1 py-0.5 rounded font-bold">PTS</span>
        </div>
      </div>

      <div className="flex flex-col items-center bg-black/40 px-4 md:px-6 py-1.5 md:py-2 rounded-xl border border-white/5">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="text-center">
            <span className="block text-[8px] md:text-[10px] text-muted-foreground font-bold">AWAY</span>
            <span className="text-lg md:text-xl font-black">{game.score.away}</span>
          </div>
          <div className="w-px h-6 md:h-8 bg-white/10" />
          <div className="text-center">
            <span className="block text-[8px] md:text-[10px] text-muted-foreground font-bold">HOME</span>
            <span className="text-lg md:text-xl font-black">{game.score.home}</span>
          </div>
        </div>
        <span className="text-[8px] md:text-[10px] text-primary/80 font-bold mt-0.5 md:mt-1">{game.timeRemaining}</span>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-secondary">
            <Flame className="w-3 h-3 md:w-4 md:h-4 fill-current" />
            <span className="text-xs md:text-sm font-bold">x{stats.streak}</span>
          </div>
          <span className="text-[8px] md:text-[10px] text-muted-foreground">STREAK</span>
        </div>
        <div className="hidden sm:flex flex-col items-end border-l border-white/10 pl-2 md:pl-4">
          <div className="flex items-center gap-1 text-primary">
            <Trophy className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-xs md:text-sm font-bold">#{stats.rank.toLocaleString()}</span>
          </div>
          <span className="text-[8px] md:text-[10px] text-muted-foreground">RANK</span>
        </div>
      </div>
    </div>
  );
}
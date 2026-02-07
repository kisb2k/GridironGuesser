"use client"

import { LeaderboardEntry } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Medal, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', username: 'BlitzKing', points: 12450, streak: 12 },
  { id: '2', username: 'DeepPass99', points: 11200, streak: 8 },
  { id: '3', username: 'EndzoneRider', points: 9800, streak: 5 },
  { id: '4', username: 'User7782', points: 8900, streak: 14 },
  { id: '5', username: 'TouchdownTomy', points: 8750, streak: 3 },
  { id: '6', username: 'YardsGainer', points: 7200, streak: 2 },
  { id: '7', username: 'FieldGoalPhil', points: 6800, streak: 0 },
];

export function Leaderboard({ currentUserRank }: { currentUserRank: number }) {
  return (
    <div className="w-full bg-card/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          Top 500k Fans
        </h3>
        <span className="text-[10px] font-bold text-muted-foreground">LIVE</span>
      </div>

      <ScrollArea className="h-64">
        <div className="space-y-2 pr-4">
          {MOCK_LEADERBOARD.map((user, idx) => (
            <div 
              key={user.id} 
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border transition-all",
                idx === 0 ? "bg-primary/10 border-primary/20" : "bg-white/5 border-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  "w-6 text-center font-black",
                  idx === 0 && "text-primary text-lg",
                  idx === 1 && "text-gray-400",
                  idx === 2 && "text-orange-400"
                )}>
                  {idx + 1}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">{user.username}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-secondary fill-current" />
                    <span className="text-[10px] text-muted-foreground">Streak: {user.streak}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-sm font-black italic">{user.points.toLocaleString()}</span>
                <span className="text-[10px] text-muted-foreground uppercase">Points</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
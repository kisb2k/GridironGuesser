"use client"

import { useGameState } from "@/hooks/useGameState";
import { StatsBar } from "@/components/game/StatsBar";
import { PredictionCard } from "@/components/game/PredictionCard";
import { Leaderboard } from "@/components/game/Leaderboard";
import { SyncControl } from "@/components/game/SyncControl";
import { Play, TrendingUp, AlertCircle, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GamePage() {
  const { game, stats, makePrediction } = useGameState();

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <StatsBar stats={stats} game={game} />
      
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
        {/* Left Sidebar - Social & Sync */}
        <aside className="hidden lg:flex flex-col gap-6 w-80 shrink-0">
          <SyncControl />
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
             <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-primary" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Live Tip</h3>
             </div>
             <p className="text-xs font-bold leading-relaxed">
               The Eagles have run on 64% of 3rd downs this season. Check the social ghost to see what others think!
             </p>
          </div>
        </aside>

        {/* Center - Main Gameplay */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pb-24 lg:pb-0">
          <PredictionCard 
            game={game} 
            stats={stats} 
            onPredict={makePrediction} 
          />

          {/* Recent Result Notification */}
          {game.playState === 'RESOLVING' && game.lastResult && (
            <div className="max-w-lg mx-auto w-full animate-in slide-in-from-bottom-4 duration-500">
              <div className={cn(
                "p-4 rounded-xl border flex items-center justify-between",
                stats.prediction?.playType === game.lastResult.type 
                  ? "bg-secondary/10 border-secondary/30 text-secondary" 
                  : "bg-destructive/10 border-destructive/30 text-destructive"
              )}>
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center shrink-0">
                      <Play className="w-5 h-5 fill-current" />
                   </div>
                   <div>
                     <span className="block text-xs font-black uppercase tracking-widest">
                       {stats.prediction?.playType === game.lastResult.type ? "BOOM! CORRECT" : "PLAY MISSED"}
                     </span>
                     <p className="text-[10px] font-bold opacity-80">{game.lastResult.description}</p>
                   </div>
                </div>
                <div className="text-right">
                   <span className="text-lg font-black italic">
                     {stats.prediction?.playType === game.lastResult.type ? `+${10 * (stats.streak)}` : "0"}
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

        {/* Right Sidebar - Leaderboard */}
        <aside className="hidden lg:block w-96 shrink-0">
          <Leaderboard currentUserRank={stats.rank} />
        </aside>
      </div>

      {/* Mobile Footer Interaction */}
      <footer className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-white/5 p-4 z-50">
        <div className="flex items-center justify-around gap-4 max-w-lg mx-auto">
          <button className="flex flex-col items-center gap-1 group">
             <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
               <Play className="w-5 h-5 text-primary" />
             </div>
             <span className="text-[9px] font-black uppercase tracking-widest text-primary">Play</span>
          </button>
          <button className="flex flex-col items-center gap-1 group opacity-50">
             <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
               <TrendingUp className="w-5 h-5" />
             </div>
             <span className="text-[9px] font-black uppercase tracking-widest">Trends</span>
          </button>
          <button className="flex flex-col items-center gap-1 group opacity-50">
             <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
               <Trophy className="w-5 h-5" />
             </div>
             <span className="text-[9px] font-black uppercase tracking-widest">Rank</span>
          </button>
        </div>
      </footer>
    </main>
  );
}

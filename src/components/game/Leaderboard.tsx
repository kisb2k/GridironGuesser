
"use client"

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, limit, orderBy } from "firebase/firestore";
import { Trophy, Medal, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardProps {
  gameId: string;
}

export function Leaderboard({ gameId }: LeaderboardProps) {
  const firestore = useFirestore();

  // Fetching global top players as a proxy for the leaderboard
  // In a production app, we would fetch session-specific scores
  const topPlayersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "users"),
      orderBy("points", "desc"),
      limit(10)
    );
  }, [firestore]);

  const { data: players, isLoading } = useCollection(topPlayersQuery);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2 px-1">
        <Trophy className="w-4 h-4 text-primary" />
        <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Global Leaderboard</h3>
      </div>
      
      <div className="bg-card/30 border border-white/5 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {players?.map((player, idx) => (
              <div key={player.id} className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-[10px] font-black w-4 text-center",
                    idx === 0 ? "text-primary" : "text-muted-foreground"
                  )}>
                    {idx + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase">{player.displayName}</span>
                    <span className="text-[8px] font-black text-muted-foreground uppercase">{player.isGuest ? 'GUEST' : 'PRO'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tabular-nums">{player.points.toLocaleString()}</span>
                  {idx < 3 && <Medal className={cn(
                    "w-3 h-3",
                    idx === 0 ? "text-primary" : idx === 1 ? "text-slate-400" : "text-orange-400"
                  )} />}
                </div>
              </div>
            ))}
            {(!players || players.length === 0) && (
              <div className="p-8 text-center">
                <Users className="w-8 h-8 text-muted mx-auto mb-2 opacity-20" />
                <p className="text-[10px] font-black text-muted-foreground uppercase">No data found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

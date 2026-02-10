
"use client"

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, limit, orderBy, where } from "firebase/firestore";
import { Trophy, Medal, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface LeaderboardProps {
  gameId: string;
}

export function Leaderboard({ gameId }: LeaderboardProps) {
  const firestore = useFirestore();

  // Listen to predictions for this game to identify participants
  const predictionsRef = useMemoFirebase(() => 
    firestore && gameId ? collection(firestore, 'gameSessions', gameId, 'predictions') : null
  , [firestore, gameId]);

  const { data: predictions } = useCollection(predictionsRef);

  // Get unique user IDs of players in this session
  const sessionUserIds = useMemo(() => {
    if (!predictions) return [];
    return Array.from(new Set(predictions.map(p => p.userId)));
  }, [predictions]);

  // Fetch all users - in a prototype, we'll fetch global users and filter
  // For production, you'd use a more targeted query
  const playersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "users"),
      orderBy("points", "desc")
    );
  }, [firestore]);

  const { data: allPlayers, isLoading } = useCollection(playersQuery);

  // Filter to only show players who have participated in this session
  const sessionPlayers = useMemo(() => {
    if (!allPlayers) return [];
    if (sessionUserIds.length === 0) return [];
    
    return allPlayers
      .filter(p => sessionUserIds.includes(p.id))
      .sort((a, b) => (b.points || 0) - (a.points || 0));
  }, [allPlayers, sessionUserIds]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2 px-1">
        <Trophy className="w-4 h-4 text-primary" />
        <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Session Leaderboard</h3>
      </div>
      
      <div className="bg-card/30 border border-white/5 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {sessionPlayers.map((player, idx) => (
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
                  <span className="text-xs font-black tabular-nums">{(player.points || 0).toLocaleString()}</span>
                  {idx < 3 && <Medal className={cn(
                    "w-3 h-3",
                    idx === 0 ? "text-primary" : idx === 1 ? "text-slate-400" : "text-orange-400"
                  )} />}
                </div>
              </div>
            ))}
            {sessionPlayers.length === 0 && !isLoading && (
              <div className="p-8 text-center">
                <Users className="w-8 h-8 text-muted mx-auto mb-2 opacity-20" />
                <p className="text-[10px] font-black text-muted-foreground uppercase">Waiting for plays...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

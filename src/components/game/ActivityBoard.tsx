
"use client"

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { Users, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface ActivityBoardProps {
  gameId: string;
  currentPlayId: string;
}

export function ActivityBoard({ gameId, currentPlayId }: ActivityBoardProps) {
  const firestore = useFirestore();

  const predictionsRef = useMemoFirebase(() => 
    firestore && gameId ? collection(firestore, 'gameSessions', gameId, 'predictions') : null
  , [firestore, gameId]);

  const { data: predictions, isLoading } = useCollection(predictionsRef);

  const activeRoster = useMemo(() => {
    if (!predictions) return [];
    const usersMap = new Map();
    
    predictions.forEach(p => {
      if (!usersMap.has(p.userId)) {
        usersMap.set(p.userId, { 
          userId: p.userId, 
          username: p.username, 
          hasVoted: false 
        });
      }
      if (p.playId === currentPlayId) {
        usersMap.get(p.userId).hasVoted = true;
      }
    });
    
    return Array.from(usersMap.values());
  }, [predictions, currentPlayId]);

  const votedCount = activeRoster.filter(p => p.hasVoted).length;

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-secondary" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-secondary">Squad Status</h3>
        </div>
        <span className="text-[10px] font-black bg-secondary/10 text-secondary px-2 py-0.5 rounded border border-secondary/20">
          {votedCount}/{activeRoster.length} READY
        </span>
      </div>
      
      <div className="bg-card/30 border border-white/5 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-white/5 max-h-[240px] overflow-y-auto">
            {activeRoster.map((player) => (
              <div key={player.userId} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    player.hasVoted ? "bg-secondary" : "bg-muted animate-pulse"
                  )} />
                  <span className="text-xs font-bold uppercase truncate max-w-[120px]">{player.username}</span>
                </div>
                {player.hasVoted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>
            ))}
            {activeRoster.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-[10px] font-black text-muted-foreground uppercase">Waiting for players...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

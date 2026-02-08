
"use client"

import { useParams } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Leaderboard({ currentUserRank }: { currentUserRank: number }) {
  const { gameId } = useParams();
  const firestore = useFirestore();

  const predictionsQuery = useMemoFirebase(() => {
    if (!firestore || !gameId) return null;
    return query(
      collection(firestore, 'gameSessions', gameId as string, 'predictions'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
  }, [firestore, gameId]);

  const { data: recentActivity } = useCollection<any>(predictionsQuery);

  return (
    <div className="w-full bg-card/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          Live Group Activity
        </h3>
        <span className="text-[10px] font-bold text-muted-foreground">SYNCED</span>
      </div>

      <ScrollArea className="h-64">
        <div className="space-y-2 pr-4">
          {recentActivity && recentActivity.length === 0 ? (
            <div className="text-center py-8 opacity-50 text-[10px] font-bold uppercase">Waiting for snaps...</div>
          ) : (
            recentActivity?.map((activity, idx) => (
              <div 
                key={activity.id} 
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-all bg-white/5 border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{activity.username || 'Fan'}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-secondary fill-current" />
                      <span className="text-[10px] text-muted-foreground uppercase">{activity.playType}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-black italic text-primary">LOCKED IN</span>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

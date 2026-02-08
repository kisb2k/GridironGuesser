
"use client"

import { useParams } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, where } from "firebase/firestore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Star, Clock, Zap } from "lucide-react";
import { format } from "date-fns";

interface LeaderboardProps {
  currentUserRank: number;
  currentPlayId?: string;
}

export function Leaderboard({ currentUserRank, currentPlayId }: LeaderboardProps) {
  const { gameId } = useParams();
  const firestore = useFirestore();

  // Query for Recent Activity (Global history)
  const recentQuery = useMemoFirebase(() => {
    if (!firestore || !gameId) return null;
    // Note: If this fails with permission error, ensure the rules allow listing.
    // Also, if the index is missing, a link will be provided in the browser console.
    return query(
      collection(firestore, 'gameSessions', gameId as string, 'predictions'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
  }, [firestore, gameId]);

  // Query for Current Play Activity
  const currentPlayQuery = useMemoFirebase(() => {
    if (!firestore || !gameId || !currentPlayId) return null;
    return query(
      collection(firestore, 'gameSessions', gameId as string, 'predictions'),
      where('playId', '==', currentPlayId),
      orderBy('timestamp', 'desc')
    );
  }, [firestore, gameId, currentPlayId]);

  const { data: recentActivity } = useCollection<any>(recentQuery);
  const { data: currentPlayActivity } = useCollection<any>(currentPlayQuery);

  const formatTimestamp = (ts: any) => {
    if (!ts) return 'just now';
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return format(date, 'HH:mm:ss');
    } catch (e) {
      return 'just now';
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Current Play Activity */}
      <div className="w-full bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black flex items-center gap-2 text-primary">
            <Zap className="w-4 h-4" />
            Active Play Snaps
          </h3>
          <span className="text-[10px] font-black bg-primary/20 text-primary px-2 py-0.5 rounded animate-pulse">
            LIVE
          </span>
        </div>

        <ScrollArea className="h-48">
          <div className="space-y-2 pr-4">
            {!currentPlayActivity || currentPlayActivity.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center gap-2 opacity-30">
                <Clock className="w-8 h-8" />
                <span className="text-[10px] font-black uppercase tracking-widest">Waiting for first snap...</span>
              </div>
            ) : (
              currentPlayActivity.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold">{activity.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-secondary px-2 py-0.5 bg-secondary/10 rounded uppercase">
                      {activity.playType}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Global Recent Activity */}
      <div className="w-full bg-card/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            Global Activity Feed
          </h3>
        </div>

        <ScrollArea className="h-64">
          <div className="space-y-2 pr-4">
            {!recentActivity || recentActivity.length === 0 ? (
              <div className="text-center py-8 opacity-50 text-[10px] font-bold uppercase">No history yet</div>
            ) : (
              recentActivity.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-center justify-between p-3 rounded-lg border transition-all bg-white/5 border-transparent"
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
                    <span className="block text-[8px] font-bold text-muted-foreground mb-1 uppercase tracking-tighter">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                    <span className="block text-[10px] font-black italic text-primary">LOCKED</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

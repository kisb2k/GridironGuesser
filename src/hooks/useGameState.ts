
'use client';

import { useEffect, useState } from 'react';
import { GameState, UserStats, PlayType, OutcomeType } from '@/lib/types';
import { useFirestore, useDoc, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function useGameState(gameId?: string) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [localSyncOffset, setLocalSyncOffset] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('gg_sync_offset');
    if (saved) setLocalSyncOffset(parseInt(saved));
  }, []);

  const gameRef = useMemoFirebase(() => 
    firestore && gameId ? doc(firestore, 'gameSessions', gameId) : null
  , [firestore, gameId]);

  const { data: gameData, loading: gameLoading } = useDoc<any>(gameRef);
  
  const userProfileRef = useMemoFirebase(() => 
    firestore && user ? doc(firestore, 'users', user.uid) : null
  , [firestore, user]);
  
  const { data: profileData } = useDoc<any>(userProfileRef);

  // Predictions disabled for diagnostics
  const game: GameState | null = useMemoFirebase(() => {
    if (!gameData) return null;
    return {
      id: gameId,
      adminUid: gameData.adminUid,
      currentPlayId: gameData.currentPlayId || 'p1',
      situation: gameData.situation || 'Ready to start',
      score: { 
        away: gameData.scoreAway || 0, 
        home: gameData.scoreHome || 0 
      },
      timeRemaining: gameData.timeRemaining || '15:00 1ST',
      playState: gameData.status || 'PREDICTING',
      syncOffset: gameData.syncOffset || 0,
      lastResult: gameData.lastResult
    };
  }, [gameData, gameId]);

  const stats: UserStats = useMemoFirebase(() => ({
    points: profileData?.points || 0,
    streak: profileData?.streak || 0,
    rank: 1, 
    totalPlayers: 1,
    prediction: undefined // Explicitly disabled
  }), [profileData]);

  // Scoring logic disabled while predictions are offline
  const makePrediction = (playType: PlayType, outcome?: OutcomeType) => {
    console.log("Predictions are currently disabled for this session.");
  };

  const updateSyncOffset = (val: number) => {
    setLocalSyncOffset(val);
    localStorage.setItem('gg_sync_offset', val.toString());
  };

  return { game, stats, makePrediction, loading: gameLoading, syncOffset: localSyncOffset, updateSyncOffset };
}

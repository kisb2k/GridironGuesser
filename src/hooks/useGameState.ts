
'use client';

import { useEffect, useState } from 'react';
import { GameState, UserStats, PlayType, OutcomeType, SportType } from '@/lib/types';
import { useFirestore, useDoc, useUser, useMemoFirebase } from '@/firebase';
import { doc, setDoc, updateDoc, increment } from 'firebase/firestore';

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

  const game: GameState | null = useMemoFirebase(() => {
    if (!gameData) return null;
    return {
      id: gameId,
      adminUid: gameData.adminUid,
      sport: gameData.sport || 'FOOTBALL',
      controlMode: gameData.controlMode || 'MANUAL',
      currentPlayId: gameData.currentPlayId || 'p1',
      situation: gameData.situation || 'Ready',
      score: { away: gameData.scoreAway || 0, home: gameData.scoreHome || 0 },
      timeRemaining: gameData.timeRemaining || '0:00',
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
    prediction: undefined
  }), [profileData]);

  const makePrediction = (playType: string, outcome?: string) => {
    if (!firestore || !user || !gameId || !game?.currentPlayId) return;
    
    const predictionId = `${user.uid}_${game.currentPlayId}`;
    const predRef = doc(firestore, 'gameSessions', gameId, 'predictions', predictionId);
    
    setDoc(predRef, {
      userId: user.uid,
      username: user.displayName,
      playId: game.currentPlayId,
      playType,
      outcome: outcome || null,
      timestamp: new Date().toISOString()
    }).catch(console.error);
  };

  const updateSyncOffset = (val: number) => {
    setLocalSyncOffset(val);
    localStorage.setItem('gg_sync_offset', val.toString());
  };

  return { game, stats, makePrediction, loading: gameLoading, syncOffset: localSyncOffset, updateSyncOffset };
}

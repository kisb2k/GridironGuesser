
'use client';

import { useEffect, useMemo, useState } from 'react';
import { GameState, UserStats, PlayType, OutcomeType } from '@/lib/types';
import { useFirestore, useDoc, useUser } from '@/firebase';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useGameState(gameId?: string) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [localSyncOffset, setLocalSyncOffset] = useState(0);

  // Load user's local sync preference from storage
  useEffect(() => {
    const saved = localStorage.getItem('gg_sync_offset');
    if (saved) setLocalSyncOffset(parseInt(saved));
  }, []);

  const gameRef = useMemo(() => 
    firestore && gameId ? doc(firestore, 'gameSessions', gameId) : null
  , [firestore, gameId]);

  const { data: gameData, loading: gameLoading } = useDoc<any>(gameRef);
  
  const userProfileRef = useMemo(() => 
    firestore && user ? doc(firestore, 'users', user.uid) : null
  , [firestore, user]);
  
  const { data: profileData } = useDoc<any>(userProfileRef);

  const predictionRef = useMemo(() => 
    firestore && gameId && user ? doc(firestore, 'gameSessions', gameId, 'predictions', user.uid) : null
  , [firestore, gameId, user]);
  
  const { data: predictionData } = useDoc<any>(predictionRef);

  const game: GameState | null = useMemo(() => {
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

  const stats: UserStats = useMemo(() => ({
    points: profileData?.points || 0,
    streak: profileData?.streak || 0,
    rank: 1, 
    totalPlayers: 1000,
    prediction: predictionData?.playId === game?.currentPlayId ? {
      playType: predictionData.playType,
      outcome: predictionData.outcome
    } : undefined
  }), [profileData, predictionData, game?.currentPlayId]);

  useEffect(() => {
    if (!game || !user || !stats.prediction || game.playState !== 'RESOLVING' || !game.lastResult) return;
    if (profileData?.lastUpdatedPlayId === game.currentPlayId) return;

    const isCorrect = stats.prediction.playType === game.lastResult.type;
    const newStreak = isCorrect ? stats.streak + 1 : 0;
    const pointsGained = isCorrect ? 10 * (newStreak + 1) : 0;

    if (userProfileRef) {
      updateDoc(userProfileRef, {
        points: (profileData?.points || 0) + pointsGained,
        streak: newStreak,
        lastUpdatedPlayId: game.currentPlayId
      }).catch(async (e) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userProfileRef.path,
          operation: 'update',
          requestResourceData: { points: (profileData?.points || 0) + pointsGained }
        }));
      });
    }
  }, [game?.playState, game?.currentPlayId, user, stats.prediction, game?.lastResult, profileData?.lastUpdatedPlayId, userProfileRef]);

  const makePrediction = (playType: PlayType, outcome?: OutcomeType) => {
    if (!game || game.playState !== 'PREDICTING' || !predictionRef) return;
    
    setDoc(predictionRef, {
      userId: user?.uid,
      username: user?.displayName || 'Anonymous',
      playId: game.currentPlayId,
      playType,
      outcome: outcome || 'NONE',
      timestamp: serverTimestamp()
    }).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: predictionRef.path,
        operation: 'write',
        requestResourceData: { playType, outcome }
      }));
    });
  };

  const updateSyncOffset = (val: number) => {
    setLocalSyncOffset(val);
    localStorage.setItem('gg_sync_offset', val.toString());
  };

  return { game, stats, makePrediction, loading: gameLoading, syncOffset: localSyncOffset, updateSyncOffset };
}

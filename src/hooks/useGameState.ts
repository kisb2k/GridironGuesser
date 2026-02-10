
'use client';

import { useEffect, useState, useMemo } from 'react';
import { GameState, UserStats, PlayType, OutcomeType, SportType } from '@/lib/types';
import { useFirestore, useDoc, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { doc, setDoc, updateDoc, increment, collection, query, orderBy } from 'firebase/firestore';

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

  // For ranking, we need to know where we stand in this session
  const predictionsRef = useMemoFirebase(() => 
    firestore && gameId ? collection(firestore, 'gameSessions', gameId, 'predictions') : null
  , [firestore, gameId]);
  const { data: predictions } = useCollection(predictionsRef);

  const playersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"), orderBy("points", "desc"));
  }, [firestore]);
  const { data: allPlayers } = useCollection(playersQuery);

  const game: GameState | null = useMemo(() => {
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

  const stats: UserStats = useMemo(() => {
    const sessionUserIds = predictions ? Array.from(new Set(predictions.map(p => p.userId))) : [];
    const sessionRankedPlayers = allPlayers 
      ? allPlayers.filter(p => sessionUserIds.includes(p.id)).sort((a, b) => (b.points || 0) - (a.points || 0))
      : [];
    
    const myRank = user ? sessionRankedPlayers.findIndex(p => p.id === user.uid) + 1 : 1;

    return {
      points: profileData?.points || 0,
      streak: profileData?.streak || 0,
      rank: myRank || 1, 
      totalPlayers: sessionUserIds.length || 1,
      prediction: undefined
    };
  }, [profileData, allPlayers, predictions, user]);

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

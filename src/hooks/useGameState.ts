"use client"

import { useState, useEffect, useCallback } from 'react';
import { GameState, UserStats, PlayType, OutcomeType } from '@/lib/types';

const INITIAL_GAME: GameState = {
  currentPlayId: 'p1',
  situation: '3rd & 2 AT PHI 45',
  score: { away: 24, home: 21 },
  timeRemaining: '02:45 4TH',
  playState: 'PREDICTING',
};

const INITIAL_STATS: UserStats = {
  points: 4250,
  streak: 2,
  rank: 1402,
  totalPlayers: 500000,
};

export function useGameState() {
  const [game, setGame] = useState<GameState>(INITIAL_GAME);
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);

  const simulatePlayCycle = useCallback(() => {
    // Stage 1: Predicting (happens automatically in loop reset)
    
    // Stage 2: Lockdown after 15s
    const lockdownTimer = setTimeout(() => {
      setGame(prev => ({ ...prev, playState: 'LOCKDOWN' }));
    }, 15000);

    // Stage 3: Resolve after another 5s
    const resolveTimer = setTimeout(() => {
      setGame(prev => ({ 
        ...prev, 
        playState: 'RESOLVING',
        lastResult: {
          type: Math.random() > 0.5 ? 'PASS' : 'RUN',
          outcome: Math.random() > 0.8 ? 'TOUCHDOWN' : 'FIRST_DOWN',
          yards: Math.floor(Math.random() * 20),
          description: 'Hurtles over two defenders for a massive gain!'
        }
      }));
    }, 20000);

    // Stage 4: Reset loop with new play after 8s
    const resetTimer = setTimeout(() => {
      setGame(prev => ({
        ...prev,
        currentPlayId: 'p' + Date.now(),
        playState: 'PREDICTING',
        situation: `${Math.ceil(Math.random() * 4)}th & ${Math.floor(Math.random() * 10) + 1} AT KC ${Math.floor(Math.random() * 50)}`,
        lastResult: undefined
      }));
      setStats(prev => ({ ...prev, prediction: undefined }));
    }, 28000);

    return () => {
      clearTimeout(lockdownTimer);
      clearTimeout(resolveTimer);
      clearTimeout(resetTimer);
    };
  }, []);

  useEffect(() => {
    const cleanup = simulatePlayCycle();
    const interval = setInterval(simulatePlayCycle, 28000);
    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [simulatePlayCycle]);

  const makePrediction = (playType: PlayType, outcome?: OutcomeType) => {
    if (game.playState !== 'PREDICTING') return;
    setStats(prev => ({
      ...prev,
      prediction: { playType, outcome }
    }));
  };

  // Logic to calculate points when result arrives
  useEffect(() => {
    if (game.playState === 'RESOLVING' && game.lastResult && stats.prediction) {
      const isCorrectType = game.lastResult.type === stats.prediction.playType;
      
      if (isCorrectType) {
        const pointsGained = 10 * (stats.streak + 1);
        setStats(prev => ({
          ...prev,
          points: prev.points + pointsGained,
          streak: prev.streak + 1,
          rank: Math.max(1, prev.rank - Math.floor(Math.random() * 100))
        }));
      } else {
        setStats(prev => ({
          ...prev,
          streak: 0,
          rank: prev.rank + Math.floor(Math.random() * 200)
        }));
      }
    }
  }, [game.playState, game.lastResult, stats.prediction]);

  return { game, stats, makePrediction };
}
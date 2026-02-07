
export type PlayType = 'RUN' | 'PASS' | 'FG' | 'PUNT';
export type OutcomeType = 'TD' | 'FIRST_DOWN' | 'SACK' | 'INCOMPLETE' | 'YARDS_15_PLUS' | 'NONE';

export interface GameState {
  id?: string;
  adminUid: string;
  currentPlayId: string;
  situation: string;
  score: { away: number; home: number };
  timeRemaining: string;
  playState: 'PREDICTING' | 'LOCKDOWN' | 'RESOLVING' | 'COMPLETED';
  syncOffset?: number;
  lastResult?: {
    type: PlayType;
    outcome: OutcomeType;
    yards: number;
    description: string;
  };
}

export interface UserStats {
  points: number;
  streak: number;
  rank: number;
  totalPlayers: number;
  prediction?: {
    playType: PlayType;
    outcome?: OutcomeType;
  };
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  points: number;
  streak: number;
}

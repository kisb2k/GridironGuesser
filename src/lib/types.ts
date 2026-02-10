
export type SportType = 'FOOTBALL' | 'CRICKET' | 'BASEBALL' | 'HOCKEY' | 'SOCCER';
export type ControlMode = 'MANUAL' | 'LIVE';

export type PlayType = 
  | 'RUN' | 'PASS' | 'FG' | 'PUNT' // Football
  | 'DOT' | 'RUNS' | 'WICKET' | 'BOUNDARY' // Cricket
  | 'STRIKE' | 'BALL' | 'IN_PLAY' // Baseball
  | 'SHOT' | 'POWER_PLAY' | 'DUMP_IN' // Hockey/Soccer (Interval events)
  | 'INTERVAL_GOAL' | 'INTERVAL_CLEAN'; // Soccer/Hockey (Time based)

export type OutcomeType = 
  | 'TD' | 'FIRST_DOWN' | 'SACK' | 'INCOMPLETE' | 'YARDS_15_PLUS' | 'NONE' // Football
  | 'WICKET' | 'SIX' | 'FOUR' | 'SINGLE' // Cricket
  | 'HOME_RUN' | 'STRIKEOUT' | 'WALK' | 'HIT' // Baseball
  | 'GOAL' | 'SAVE' | 'PENALTY'; // Hockey/Soccer

export interface GameState {
  id?: string;
  adminUid: string;
  sport: SportType;
  controlMode: ControlMode;
  currentPlayId: string;
  situation: string;
  score: { away: number; home: number };
  timeRemaining: string;
  playState: 'PREDICTING' | 'LOCKDOWN' | 'RESOLVING' | 'COMPLETED';
  syncOffset?: number;
  lastResult?: {
    type: string;
    outcome: string;
    yards?: number;
    description: string;
  };
}

export interface UserStats {
  points: number;
  streak: number;
  rank: number;
  totalPlayers: number;
  prediction?: {
    playType: string;
    outcome?: string;
  };
}

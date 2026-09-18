export interface TeamColor {
  id: string;
  name: string;
  hex: string;
  badgeBg: string;
  buttonBg: string;
  buttonHover: string;
  border: string;
  glow: string;
  cardBg: string;
  accentText: string;
  ropeRider: string;
}

export interface Question {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number; // 0, 1, 2, 3
  explanation?: string;
}

export type OpponentMode = 'pvp' | 'vs_bot'; // 'pvp': 2 người chơi, 'vs_bot': Chơi với máy
export type BotDifficulty = 'easy' | 'medium' | 'hard'; // Mức độ của máy

export interface TeamData {
  id: 'teamA' | 'teamB';
  name: string;
  color: TeamColor;
  mascot: string;
  questions: Question[];
  currentQuestionIndex: number;
  score: number;
  correctAnswersCount: number;
  wrongAnswersCount: number;
  streak: number;
  lastAction?: 'correct' | 'wrong' | null;
  lastActionTime?: number;
  answeredHistory: ('correct' | 'wrong' | null)[];
  isFinished: boolean;
  isBot?: boolean;
  botDifficulty?: BotDifficulty;
}

export type GameMode = 'simultaneous' | 'turn_based';

export interface GameSettings {
  maxDistance: number; // e.g. 100 (-100 to +100, 0 is center)
  stepPerCorrect: number; // e.g. 20
  penaltyPerWrong: number; // e.g. 10
  timeLimit: number; // in seconds, 0 for unlimited
  soundEnabled: boolean;
  gameMode: GameMode;
  opponentMode: OpponentMode;
  botDifficulty: BotDifficulty;
}

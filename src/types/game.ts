export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export type TileType = 'subject' | 'boon' | 'karma' | 'quiz' | 'exam' | 'rest' | 'start';

export type SubjectCategory = 
  | 'ไวยากรณ์' 
  | 'วิภัตติ' 
  | 'สนธิ' 
  | 'สมาส' 
  | 'กิตก์' 
  | 'ตัทธิต' 
  | 'พระสูตร' 
  | 'พระวินัย' 
  | 'อภิธรรม';

export type UpgradeLevel = 0 | 1 | 2 | 3 | 4; 
// 0: ตำรา (Base), 1: ห้องเรียน, 2: สำนักเรียน, 3: สนามสอบ, 4: มหาวิทยาลัยบาลี

export interface Question {
  id: string;
  category: SubjectCategory;
  level: DifficultyLevel;
  questionText: string;
  options: string[];
  correctAnswer: number; // Index 0-3
  explanation: string;
  paliVocab?: string;
  thaiTranslation?: string;
}

export interface ReviewItem {
  question: Question;
  timesWrong: number;
  lastAnsweredDate: string; // ISO date string
  nextReviewDate: string;
  mastered: boolean;
}

export interface BoardTile {
  id: number; // 0 - 39
  name: string;
  type: TileType;
  category?: SubjectCategory;
  price?: number; // Base purchase price in Wisdom Points
  rents?: [number, number, number, number, number]; // Rent based on UpgradeLevel 0-4
  upgradeCost?: number;
  ownerId?: string | null; // player id or null
  upgradeLevel?: UpgradeLevel;
  icon?: string;
  color?: string;
  description?: string;
}

export type CharacterId = 'monk' | 'novice' | 'teacher' | 'student';

export interface Character {
  id: CharacterId;
  name: string;
  title: string;
  avatar: string; // Emoji or SVG icon
  skillName: string;
  skillDescription: string;
  initialWisdomBonus: number;
  expMultiplier: number;
  easyQuestionBonus: boolean;
  firstWrongFree: boolean;
}

export interface Player {
  id: string;
  name: string;
  character: Character;
  wisdomPoints: number;
  position: number; // 0-39
  isAi: boolean;
  aiDifficulty?: 'easy' | 'medium' | 'hard';
  color: string;
  isSkipTurn: boolean;
  isBankrupt: boolean;
  doublesStreak: number;
  freeAnswerCards: number;
  ownedProperties: number[]; // Tile IDs
  exp: number;
  level: number;
  stats: {
    correctAnswers: number;
    totalAnswers: number;
    propertiesBought: number;
    examsPassed: number;
  };
}

export interface CardEffect {
  id: string;
  title: string;
  description: string;
  type: 'boon' | 'karma';
  wisdomDelta?: number;
  moveDelta?: number;
  giveFreeAnswerCard?: boolean;
  skipNextTurn?: boolean;
}

export type GameMode = 'points' | 'monopoly' | 'last_standing';

export interface GameState {
  mode: GameMode;
  maxRounds: number;
  currentRound: number;
  currentTurnPlayerIndex: number;
  players: Player[];
  tiles: BoardTile[];
  dice: [number, number];
  isDiceRolled: boolean;
  gameStatus: 'setup' | 'playing' | 'turn_ended' | 'game_over';
  winner?: Player | null;
  logs: GameLog[];
  reviewItems: ReviewItem[];
}

export interface GameLog {
  id: string;
  timestamp: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

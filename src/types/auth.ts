import type { ReviewItem, CharacterId } from './game';

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  currentWinStreak: number;
  maxWinStreak: number;
  correctAnswers: number;
  totalAnswers: number;
  propertiesBought: number;
  examsPassed: number;
  totalWisdomEarned: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string; // ISO date
}

export interface FriendRequest {
  fromUserId: string;
  timestamp: string;
  message?: string;
}

export interface OutgoingFriendRequest {
  toUserId: string;
  timestamp: string;
}

export interface GameInvite {
  id: string;
  fromUserId: string;
  fromDisplayName: string;
  fromAvatar: string;
  toUserId: string;
  roomCode: string;
  timestamp: string;
}

export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string; // Basic base64 hash for persistent demo storage
  displayName: string;
  avatar: string; // Emoji
  favoriteCharacter: CharacterId;
  createdAt: string;
  lastLogin: string;
  level: number;
  exp: number;
  rankTitle: string;
  role?: 'developer' | 'admin' | 'user';
  isDeveloper?: boolean;
  stats: UserStats;
  reviewItems: ReviewItem[];
  achievements: string[]; // List of unlocked achievement IDs
  friendIds?: string[];
  incomingFriendRequests?: FriendRequest[];
  outgoingFriendRequests?: OutgoingFriendRequest[];
}

export interface AuthSession {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  favoriteCharacter: CharacterId;
  level: number;
  rankTitle: string;
  role?: 'developer' | 'admin' | 'user';
  isDeveloper?: boolean;
  rememberMe: boolean;
}

export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: 'first_win',
    title: 'ปฐมชัยชนะ',
    description: 'ชนะเกมบาลีส่วนฐีเป็นครั้งแรก',
    icon: '🏆',
  },
  {
    id: 'streak_3',
    title: 'ไตรสิกขากล้าแกร่ง',
    description: 'ชนะการแข่งขันต่อเนื่อง 3 เกมติดต่อกัน',
    icon: '🔥',
  },
  {
    id: 'streak_5',
    title: 'มหาเปรียญไร้พ่าย',
    description: 'ชนะการแข่งขันต่อเนื่อง 5 เกมติดต่อกัน',
    icon: '⚡',
  },
  {
    id: 'scholar_10',
    title: 'ผู้ทรงภูมิ',
    description: 'ตอบคำถามบาลีถูกต้องสะสมครบ 10 ข้อ',
    icon: '📖',
  },
  {
    id: 'scholar_50',
    title: 'คลังพระไตรปิฎก',
    description: 'ตอบคำถามบาลีถูกต้องสะสมครบ 50 ข้อ',
    icon: '✨',
  },
  {
    id: 'exam_master',
    title: 'สอบผ่านสนามหลวง',
    description: 'ผ่านบททดสอบข้อสอบใหญ่ (Exam) 3 ครั้ง',
    icon: '📜',
  },
  {
    id: 'landlord',
    title: 'เจ้าสำนักศึกษา',
    description: 'ครอบครองวิชาบาลีในกระดานสะสมรวม 10 แห่ง',
    icon: '🏛️',
  },
  {
    id: 'vocab_master',
    title: 'เชี่ยวชาญศัพท์บาลี',
    description: 'ท่องจำศัพท์ในสมุดทบทวน (SRS) จนชำนาญ 5 ข้อ',
    icon: '🧠',
  },
  {
    id: 'dev_badge',
    title: 'ผู้สร้างระบบบาลีส่วนฐี',
    description: 'บัญชีเกียรติยศระดับผู้พัฒนาเกม (Developer ID)',
    icon: '🛠️',
  },
];

export const RANK_TITLES: { minLevel: number; title: string; badge: string }[] = [
  { minLevel: 1, title: 'ผู้เริ่มต้นศึกษาบาลี', badge: '🌱' },
  { minLevel: 3, title: 'สามเณรเปรียญ', badge: '📿' },
  { minLevel: 5, title: 'มหาเปรียญตรี (ป.ธ.๓)', badge: '🥉' },
  { minLevel: 8, title: 'มหาเปรียญโท (ป.ธ.๖)', badge: '🥈' },
  { minLevel: 12, title: 'มหาเปรียญเอก (ป.ธ.๙)', badge: '🥇' },
  { minLevel: 16, title: 'พระอาจารย์ใหญ่แห่งสำนักเรียน', badge: '👑' },
  { minLevel: 25, title: 'มหาปราชญ์บาลีขั้นสูง', badge: '🔮' },
  { minLevel: 50, title: 'อัครมหาบัณฑิตผู้ทรงธรรม', badge: '💎' },
  { minLevel: 99, title: '👑 พระมหาเปรียญเอกสูงสุด (ผู้สร้างระบบ)', badge: '⚡' },
];

export function getRankTitle(level: number): { title: string; badge: string } {
  for (let i = RANK_TITLES.length - 1; i >= 0; i--) {
    if (level >= RANK_TITLES[i].minLevel) {
      return { title: RANK_TITLES[i].title, badge: RANK_TITLES[i].badge };
    }
  }
  return RANK_TITLES[0];
}

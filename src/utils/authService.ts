import type { UserAccount, AuthSession, Achievement } from '../types/auth';
import { ACHIEVEMENTS_LIST, getRankTitle } from '../types/auth';
import type { ReviewItem, CharacterId } from '../types/game';

const STORAGE_KEY_ACCOUNTS = 'pali_accounts_v2';
const STORAGE_KEY_SESSION = 'pali_session_v2';

function hashPassword(password: string): string {
  try {
    return btoa(encodeURIComponent(password));
  } catch {
    return password;
  }
}

export const DEVELOPER_ACCOUNT: UserAccount = {
  id: 'user_dev_root',
  username: 'developer',
  passwordHash: hashPassword('dev1234'),
  displayName: '👑 ผู้พัฒนาระบบ (Developer)',
  avatar: '💻',
  favoriteCharacter: 'teacher',
  createdAt: '2026-01-01T00:00:00.000Z',
  lastLogin: new Date().toISOString(),
  level: 99,
  exp: 99999,
  rankTitle: '👑 พระมหาเปรียญเอกสูงสุด (ผู้สร้างระบบ)',
  role: 'developer',
  isDeveloper: true,
  stats: {
    gamesPlayed: 100,
    gamesWon: 99,
    currentWinStreak: 99,
    maxWinStreak: 99,
    correctAnswers: 999,
    totalAnswers: 1000,
    propertiesBought: 500,
    examsPassed: 99,
    totalWisdomEarned: 999999,
  },
  reviewItems: [],
  achievements: [
    'first_win',
    'streak_3',
    'streak_5',
    'scholar_10',
    'scholar_50',
    'exam_master',
    'landlord',
    'vocab_master',
    'dev_badge',
  ],
};

const INITIAL_DEMO_ACCOUNTS: UserAccount[] = [
  DEVELOPER_ACCOUNT,
  {
    id: 'user_demo_1',
    username: 'pali_scholar',
    passwordHash: hashPassword('123456'),
    displayName: 'มหาปุรินทร์ (ภิกษุผู้เพียรศึกษา)',
    avatar: '🧘‍♂️',
    favoriteCharacter: 'monk',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastLogin: new Date().toISOString(),
    level: 7,
    exp: 980,
    rankTitle: 'มหาเปรียญตรี (ป.ธ.๓)',
    role: 'user',
    stats: {
      gamesPlayed: 14,
      gamesWon: 11,
      currentWinStreak: 5,
      maxWinStreak: 5,
      correctAnswers: 52,
      totalAnswers: 58,
      propertiesBought: 36,
      examsPassed: 6,
      totalWisdomEarned: 24500,
    },
    reviewItems: [],
    achievements: ['first_win', 'streak_3', 'streak_5', 'scholar_10', 'scholar_50', 'exam_master', 'landlord'],
  },
  {
    id: 'user_demo_2',
    username: 'novice_mind',
    passwordHash: hashPassword('123456'),
    displayName: 'สามเณรปัญญาวุฑโฒ',
    avatar: '👦',
    favoriteCharacter: 'novice',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    level: 6,
    exp: 820,
    rankTitle: 'มหาเปรียญตรี (ป.ธ.๓)',
    role: 'user',
    stats: {
      gamesPlayed: 12,
      gamesWon: 8,
      currentWinStreak: 3,
      maxWinStreak: 4,
      correctAnswers: 44,
      totalAnswers: 50,
      propertiesBought: 26,
      examsPassed: 4,
      totalWisdomEarned: 18900,
    },
    reviewItems: [],
    achievements: ['first_win', 'streak_3', 'scholar_10', 'exam_master'],
  },
  {
    id: 'user_demo_3',
    username: 'teacher_dhamma',
    passwordHash: hashPassword('123456'),
    displayName: 'พระอาจารย์กิตติเมธี',
    avatar: '👨‍🏫',
    favoriteCharacter: 'teacher',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    level: 9,
    exp: 1350,
    rankTitle: 'มหาเปรียญโท (ป.ธ.๖)',
    role: 'user',
    stats: {
      gamesPlayed: 20,
      gamesWon: 15,
      currentWinStreak: 2,
      maxWinStreak: 7,
      correctAnswers: 78,
      totalAnswers: 84,
      propertiesBought: 48,
      examsPassed: 8,
      totalWisdomEarned: 38000,
    },
    reviewItems: [],
    achievements: ['first_win', 'streak_3', 'streak_5', 'scholar_10', 'scholar_50', 'exam_master', 'landlord'],
  },
];

export function getStoredAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(INITIAL_DEMO_ACCOUNTS));
      return INITIAL_DEMO_ACCOUNTS;
    }
    const accounts: UserAccount[] = JSON.parse(raw);
    
    // Guarantee Developer Account always exists
    const hasDev = accounts.some((a) => a.id === DEVELOPER_ACCOUNT.id || a.username.toLowerCase() === 'developer');
    if (!hasDev) {
      accounts.unshift(DEVELOPER_ACCOUNT);
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    } else {
      // Ensure role/isDeveloper is set
      const devAcc = accounts.find((a) => a.id === DEVELOPER_ACCOUNT.id || a.username.toLowerCase() === 'developer');
      if (devAcc) {
        devAcc.isDeveloper = true;
        devAcc.role = 'developer';
        if (!devAcc.achievements.includes('dev_badge')) {
          devAcc.achievements.push('dev_badge');
        }
      }
    }

    return accounts;
  } catch (e) {
    console.error('Failed to load accounts from storage', e);
    return INITIAL_DEMO_ACCOUNTS;
  }
}

export function saveStoredAccounts(accounts: UserAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save accounts to storage', e);
  }
}

export function getCurrentSession(): AuthSession | null {
  try {
    const localRaw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (localRaw) {
      return JSON.parse(localRaw);
    }
    const sessionRaw = sessionStorage.getItem(STORAGE_KEY_SESSION);
    if (sessionRaw) {
      return JSON.parse(sessionRaw);
    }
    return null;
  } catch (e) {
    console.error('Failed to get auth session', e);
    return null;
  }
}

export function setStoredSession(session: AuthSession | null, rememberMe: boolean = true): void {
  try {
    if (!session) {
      localStorage.removeItem(STORAGE_KEY_SESSION);
      sessionStorage.removeItem(STORAGE_KEY_SESSION);
      return;
    }

    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
      sessionStorage.removeItem(STORAGE_KEY_SESSION);
    } else {
      sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
      localStorage.removeItem(STORAGE_KEY_SESSION);
    }
  } catch (e) {
    console.error('Failed to set auth session', e);
  }
}

export function getCurrentUser(): UserAccount | null {
  const session = getCurrentSession();
  if (!session) return null;
  const accounts = getStoredAccounts();
  return accounts.find((acc) => acc.id === session.userId) || null;
}

export function registerAccount(
  username: string,
  password: string,
  displayName: string,
  avatar: string = '🧘‍♂️',
  favoriteCharacter: CharacterId = 'monk'
): { success: boolean; message: string; user?: UserAccount } {
  const cleanUsername = username.trim().toLowerCase();
  const cleanDisplayName = displayName.trim();

  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, message: 'ชื่อผู้ใช้ (Username) ต้องมีความยาวอย่างน้อย 3 ตัวอักษร' };
  }

  if (!password || password.length < 4) {
    return { success: false, message: 'รหัสผ่าน (Password) ต้องมีความยาวอย่างน้อย 4 ตัวอักษร' };
  }

  if (!cleanDisplayName) {
    return { success: false, message: 'กรุณาระบุชื่อที่ต้องการแสดงในเกม (Display Name)' };
  }

  const accounts = getStoredAccounts();
  const exists = accounts.some((acc) => acc.username.toLowerCase() === cleanUsername);

  if (exists) {
    return { success: false, message: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว กรุณาเลือกชื่ออื่น' };
  }

  const newAccount: UserAccount = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    username: cleanUsername,
    passwordHash: hashPassword(password),
    displayName: cleanDisplayName,
    avatar: avatar || '🧘‍♂️',
    favoriteCharacter,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    level: 1,
    exp: 0,
    rankTitle: getRankTitle(1).title,
    role: 'user',
    stats: {
      gamesPlayed: 0,
      gamesWon: 0,
      currentWinStreak: 0,
      maxWinStreak: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      propertiesBought: 0,
      examsPassed: 0,
      totalWisdomEarned: 0,
    },
    reviewItems: [],
    achievements: [],
  };

  const updatedAccounts = [newAccount, ...accounts];
  saveStoredAccounts(updatedAccounts);

  const session: AuthSession = {
    userId: newAccount.id,
    username: newAccount.username,
    displayName: newAccount.displayName,
    avatar: newAccount.avatar,
    favoriteCharacter: newAccount.favoriteCharacter,
    level: newAccount.level,
    rankTitle: newAccount.rankTitle,
    role: newAccount.role,
    isDeveloper: false,
    rememberMe: true,
  };
  setStoredSession(session, true);

  return { success: true, message: 'สมัครสมาชิกและเข้าสู่ระบบสำเร็จ!', user: newAccount };
}

export function loginAccount(
  username: string,
  password: string,
  rememberMe: boolean = true
): { success: boolean; message: string; user?: UserAccount } {
  const cleanUsername = username.trim().toLowerCase();
  const accounts = getStoredAccounts();

  // Check Developer Alias Login
  const isDevLogin = cleanUsername === 'developer' || cleanUsername === 'dev' || cleanUsername === 'admin';
  const isDevPassword =
    password === 'dev1234' ||
    password === 'developer' ||
    password === 'admin123' ||
    password === '123456';

  let user = accounts.find((acc) => acc.username.toLowerCase() === cleanUsername);

  if (isDevLogin && !user) {
    user = accounts.find((acc) => acc.id === DEVELOPER_ACCOUNT.id || acc.role === 'developer');
  }

  if (!user) {
    return { success: false, message: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ' };
  }

  // Developer special master pass check or standard hash check
  const isPasswordValid =
    (user.isDeveloper && (isDevPassword || user.passwordHash === hashPassword(password))) ||
    user.passwordHash === hashPassword(password);

  if (!isPasswordValid) {
    return { success: false, message: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' };
  }

  user.lastLogin = new Date().toISOString();
  saveStoredAccounts(accounts);

  const session: AuthSession = {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    favoriteCharacter: user.favoriteCharacter,
    level: user.level,
    rankTitle: user.rankTitle,
    role: user.role,
    isDeveloper: user.isDeveloper || user.role === 'developer',
    rememberMe,
  };
  setStoredSession(session, rememberMe);

  return {
    success: true,
    message: user.isDeveloper ? `⚡ ยินดีต้อนรับท่านผู้พัฒนาระบบ (${user.displayName})!` : `ยินดีต้อนรับกลับ, ${user.displayName}!`,
    user,
  };
}

export function loginAsDeveloper(rememberMe: boolean = true): { success: boolean; message: string; user: UserAccount } {
  const accounts = getStoredAccounts();
  let devAcc = accounts.find((a) => a.id === DEVELOPER_ACCOUNT.id || a.username === 'developer');
  if (!devAcc) {
    devAcc = { ...DEVELOPER_ACCOUNT };
    accounts.unshift(devAcc);
  }
  devAcc.lastLogin = new Date().toISOString();
  devAcc.isDeveloper = true;
  devAcc.role = 'developer';
  saveStoredAccounts(accounts);

  const session: AuthSession = {
    userId: devAcc.id,
    username: devAcc.username,
    displayName: devAcc.displayName,
    avatar: devAcc.avatar,
    favoriteCharacter: devAcc.favoriteCharacter,
    level: devAcc.level,
    rankTitle: devAcc.rankTitle,
    role: 'developer',
    isDeveloper: true,
    rememberMe,
  };
  setStoredSession(session, rememberMe);

  return {
    success: true,
    message: `⚡ เข้าสู่ระบบในฐานะผู้พัฒนา (Developer Mode) สำเร็จ!`,
    user: devAcc,
  };
}

export function switchAccount(userId: string): { success: boolean; user?: UserAccount } {
  const accounts = getStoredAccounts();
  const target = accounts.find((acc) => acc.id === userId);
  if (!target) return { success: false };

  target.lastLogin = new Date().toISOString();
  saveStoredAccounts(accounts);

  const session: AuthSession = {
    userId: target.id,
    username: target.username,
    displayName: target.displayName,
    avatar: target.avatar,
    favoriteCharacter: target.favoriteCharacter,
    level: target.level,
    rankTitle: target.rankTitle,
    role: target.role,
    isDeveloper: target.isDeveloper || target.role === 'developer',
    rememberMe: true,
  };
  setStoredSession(session, true);

  return { success: true, user: target };
}

export function logoutAccount(): void {
  setStoredSession(null);
}

export function updateProfile(
  userId: string,
  updates: { displayName?: string; avatar?: string; favoriteCharacter?: CharacterId }
): UserAccount | null {
  const accounts = getStoredAccounts();
  const userIndex = accounts.findIndex((acc) => acc.id === userId);
  if (userIndex < 0) return null;

  const user = accounts[userIndex];
  if (updates.displayName?.trim()) user.displayName = updates.displayName.trim();
  if (updates.avatar) user.avatar = updates.avatar;
  if (updates.favoriteCharacter) user.favoriteCharacter = updates.favoriteCharacter;

  accounts[userIndex] = user;
  saveStoredAccounts(accounts);

  const currentSession = getCurrentSession();
  if (currentSession && currentSession.userId === userId) {
    currentSession.displayName = user.displayName;
    currentSession.avatar = user.avatar;
    currentSession.favoriteCharacter = user.favoriteCharacter;
    setStoredSession(currentSession, currentSession.rememberMe);
  }

  return user;
}

export function syncUserReviewDeck(userId: string, reviewItems: ReviewItem[]): void {
  const accounts = getStoredAccounts();
  const user = accounts.find((acc) => acc.id === userId);
  if (!user) return;

  user.reviewItems = reviewItems;
  saveStoredAccounts(accounts);
}

export function recordMatchResult(
  userId: string,
  matchData: {
    isWinner: boolean;
    wisdomEarned: number;
    correctAnswers: number;
    totalAnswers: number;
    propertiesBought: number;
    examsPassed: number;
  }
): { user: UserAccount; newLevel: number; leveledUp: boolean; newAchievements: Achievement[]; streakGained: number } | null {
  const accounts = getStoredAccounts();
  const userIndex = accounts.findIndex((acc) => acc.id === userId);
  if (userIndex < 0) return null;

  const user = accounts[userIndex];
  const prevLevel = user.level;

  // Initialize stats safeguards
  if (!user.stats) {
    user.stats = {
      gamesPlayed: 0,
      gamesWon: 0,
      currentWinStreak: 0,
      maxWinStreak: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      propertiesBought: 0,
      examsPassed: 0,
      totalWisdomEarned: 0,
    };
  }

  // Update Stats
  user.stats.gamesPlayed += 1;
  if (matchData.isWinner) {
    user.stats.gamesWon += 1;
    user.stats.currentWinStreak = (user.stats.currentWinStreak || 0) + 1;
    user.stats.maxWinStreak = Math.max(user.stats.maxWinStreak || 0, user.stats.currentWinStreak);
  } else {
    user.stats.currentWinStreak = 0;
  }

  user.stats.correctAnswers += matchData.correctAnswers;
  user.stats.totalAnswers += matchData.totalAnswers;
  user.stats.propertiesBought += matchData.propertiesBought;
  user.stats.examsPassed += matchData.examsPassed;
  user.stats.totalWisdomEarned += matchData.wisdomEarned;

  // Calculate EXP:
  // Base match exp: 50
  // Win bonus: +100
  // Streak bonus: +20 * currentWinStreak
  // Per correct answer: +15
  // Per exam passed: +30
  const streakBonus = matchData.isWinner ? (user.stats.currentWinStreak || 1) * 20 : 0;
  const gainedExp =
    50 +
    (matchData.isWinner ? 100 : 0) +
    streakBonus +
    matchData.correctAnswers * 15 +
    matchData.examsPassed * 30;

  user.exp += gainedExp;

  // Level formula: level = Math.floor(exp / 150) + 1
  const calculatedLevel = Math.floor(user.exp / 150) + 1;
  user.level = calculatedLevel;
  user.rankTitle = getRankTitle(user.level).title;

  // Check achievements
  const newlyUnlocked: Achievement[] = [];
  if (!user.achievements) user.achievements = [];

  const checkAchievement = (achId: string, condition: boolean) => {
    if (condition && !user.achievements.includes(achId)) {
      user.achievements.push(achId);
      const found = ACHIEVEMENTS_LIST.find((a) => a.id === achId);
      if (found) newlyUnlocked.push(found);
    }
  };

  checkAchievement('first_win', user.stats.gamesWon >= 1);
  checkAchievement('streak_3', (user.stats.maxWinStreak || 0) >= 3);
  checkAchievement('streak_5', (user.stats.maxWinStreak || 0) >= 5);
  checkAchievement('scholar_10', user.stats.correctAnswers >= 10);
  checkAchievement('scholar_50', user.stats.correctAnswers >= 50);
  checkAchievement('exam_master', user.stats.examsPassed >= 3);
  checkAchievement('landlord', user.stats.propertiesBought >= 10);

  const masteredVocabCount = user.reviewItems ? user.reviewItems.filter((i) => i.mastered).length : 0;
  checkAchievement('vocab_master', masteredVocabCount >= 5);

  accounts[userIndex] = user;
  saveStoredAccounts(accounts);

  // Sync session
  const currentSession = getCurrentSession();
  if (currentSession && currentSession.userId === userId) {
    currentSession.level = user.level;
    currentSession.rankTitle = user.rankTitle;
    setStoredSession(currentSession, currentSession.rememberMe);
  }

  return {
    user,
    newLevel: user.level,
    leveledUp: user.level > prevLevel,
    newAchievements: newlyUnlocked,
    streakGained: user.stats.currentWinStreak,
  };
}

export function getLeaderboardAccounts(
  sortBy: 'streak' | 'wins' | 'level' | 'wisdom' = 'streak'
): UserAccount[] {
  const accounts = getStoredAccounts();
  const sorted = [...accounts].sort((a, b) => {
    if (sortBy === 'streak') {
      const diff = (b.stats?.maxWinStreak || 0) - (a.stats?.maxWinStreak || 0);
      if (diff !== 0) return diff;
      return (b.stats?.currentWinStreak || 0) - (a.stats?.currentWinStreak || 0);
    } else if (sortBy === 'wins') {
      const diff = (b.stats?.gamesWon || 0) - (a.stats?.gamesWon || 0);
      if (diff !== 0) return diff;
      return (b.stats?.totalWisdomEarned || 0) - (a.stats?.totalWisdomEarned || 0);
    } else if (sortBy === 'level') {
      const diff = (b.level || 1) - (a.level || 1);
      if (diff !== 0) return diff;
      return (b.exp || 0) - (a.exp || 0);
    } else {
      return (b.stats?.totalWisdomEarned || 0) - (a.stats?.totalWisdomEarned || 0);
    }
  });

  return sorted;
}

export function devSetLevel(userId: string, targetLevel: number): UserAccount | null {
  const accounts = getStoredAccounts();
  const userIndex = accounts.findIndex((a) => a.id === userId);
  if (userIndex < 0) return null;

  const user = accounts[userIndex];
  user.level = Math.max(1, targetLevel);
  user.exp = (user.level - 1) * 150;
  user.rankTitle = getRankTitle(user.level).title;

  accounts[userIndex] = user;
  saveStoredAccounts(accounts);

  const session = getCurrentSession();
  if (session && session.userId === userId) {
    session.level = user.level;
    session.rankTitle = user.rankTitle;
    setStoredSession(session, session.rememberMe);
  }

  return user;
}

export function devAddExp(userId: string, expBonus: number): UserAccount | null {
  const accounts = getStoredAccounts();
  const userIndex = accounts.findIndex((a) => a.id === userId);
  if (userIndex < 0) return null;

  const user = accounts[userIndex];
  user.exp += expBonus;
  user.level = Math.floor(user.exp / 150) + 1;
  user.rankTitle = getRankTitle(user.level).title;

  accounts[userIndex] = user;
  saveStoredAccounts(accounts);

  const session = getCurrentSession();
  if (session && session.userId === userId) {
    session.level = user.level;
    session.rankTitle = user.rankTitle;
    setStoredSession(session, session.rememberMe);
  }

  return user;
}

export function devUnlockAllAchievements(userId: string): UserAccount | null {
  const accounts = getStoredAccounts();
  const userIndex = accounts.findIndex((a) => a.id === userId);
  if (userIndex < 0) return null;

  const user = accounts[userIndex];
  user.achievements = ACHIEVEMENTS_LIST.map((a) => a.id);

  accounts[userIndex] = user;
  saveStoredAccounts(accounts);

  return user;
}

export function devResetAccountStats(userId: string): UserAccount | null {
  const accounts = getStoredAccounts();
  const userIndex = accounts.findIndex((a) => a.id === userId);
  if (userIndex < 0) return null;

  const user = accounts[userIndex];
  user.level = 1;
  user.exp = 0;
  user.rankTitle = getRankTitle(1).title;
  user.achievements = user.isDeveloper ? ['dev_badge'] : [];
  user.stats = {
    gamesPlayed: 0,
    gamesWon: 0,
    currentWinStreak: 0,
    maxWinStreak: 0,
    correctAnswers: 0,
    totalAnswers: 0,
    propertiesBought: 0,
    examsPassed: 0,
    totalWisdomEarned: 0,
  };

  accounts[userIndex] = user;
  saveStoredAccounts(accounts);

  const session = getCurrentSession();
  if (session && session.userId === userId) {
    session.level = user.level;
    session.rankTitle = user.rankTitle;
    setStoredSession(session, session.rememberMe);
  }

  return user;
}

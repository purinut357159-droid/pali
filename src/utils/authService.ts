import type { UserAccount, AuthSession, Achievement } from '../types/auth';
import { ACHIEVEMENTS_LIST, getRankTitle } from '../types/auth';
import type { ReviewItem, CharacterId } from '../types/game';
import { cloudStorageService } from './cloudStorageService';

const STORAGE_KEY_ACCOUNTS = 'pali_accounts_v2';
const STORAGE_KEY_SESSION = 'pali_session_v2';
const STORAGE_KEY_PUBLIC_REGISTRY = 'pali_public_accounts_registry_v2';

const accountsChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('pali_accounts_sync_channel_v2') : null;

if (accountsChannel) {
  accountsChannel.onmessage = (event) => {
    if (event.data?.type === 'ACCOUNTS_SYNC' && Array.isArray(event.data.accounts)) {
      syncExternalAccounts(event.data.accounts, false);
    }
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY_ACCOUNTS || e.key === STORAGE_KEY_PUBLIC_REGISTRY) {
      if (e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            syncExternalAccounts(parsed, false);
          }
        } catch {
          // ignore parse error
        }
      }
      window.dispatchEvent(new Event('pali_accounts_updated'));
    }
  });
}

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
    let accounts: UserAccount[] = [];
    const raw = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
    if (!raw) {
      accounts = INITIAL_DEMO_ACCOUNTS;
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(INITIAL_DEMO_ACCOUNTS));
    } else {
      accounts = JSON.parse(raw);
    }

    // Merge with Public Accounts Registry so newly registered IDs from other sessions/peers are preserved
    const publicRaw = localStorage.getItem(STORAGE_KEY_PUBLIC_REGISTRY);
    if (publicRaw) {
      try {
        const publicAccounts: UserAccount[] = JSON.parse(publicRaw);
        publicAccounts.forEach((pubAcc) => {
          const localIdx = accounts.findIndex((a) => a.id === pubAcc.id || a.username.toLowerCase() === pubAcc.username.toLowerCase());
          if (localIdx < 0) {
            accounts.push(pubAcc);
          } else {
            // Update stats/level if public has higher stats
            const localAcc = accounts[localIdx];
            if ((pubAcc.level || 1) > (localAcc.level || 1) || (pubAcc.stats?.gamesWon || 0) > (localAcc.stats?.gamesWon || 0)) {
              accounts[localIdx] = {
                ...localAcc,
                level: Math.max(localAcc.level, pubAcc.level || 1),
                exp: Math.max(localAcc.exp, pubAcc.exp || 0),
                rankTitle: pubAcc.rankTitle || localAcc.rankTitle,
                stats: {
                  ...localAcc.stats,
                  gamesPlayed: Math.max(localAcc.stats.gamesPlayed, pubAcc.stats?.gamesPlayed || 0),
                  gamesWon: Math.max(localAcc.stats.gamesWon, pubAcc.stats?.gamesWon || 0),
                  maxWinStreak: Math.max(localAcc.stats.maxWinStreak, pubAcc.stats?.maxWinStreak || 0),
                  currentWinStreak: pubAcc.stats?.currentWinStreak ?? localAcc.stats.currentWinStreak,
                  correctAnswers: Math.max(localAcc.stats.correctAnswers, pubAcc.stats?.correctAnswers || 0),
                  totalAnswers: Math.max(localAcc.stats.totalAnswers, pubAcc.stats?.totalAnswers || 0),
                  totalWisdomEarned: Math.max(localAcc.stats.totalWisdomEarned, pubAcc.stats?.totalWisdomEarned || 0),
                },
              };
            }
          }
        });
      } catch {}
    }
    
    // Guarantee Developer Account always exists
    const hasDev = accounts.some((a) => a.id === DEVELOPER_ACCOUNT.id || a.username.toLowerCase() === 'developer');
    if (!hasDev) {
      accounts.unshift(DEVELOPER_ACCOUNT);
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    } else {
      const devAcc = accounts.find((a) => a.id === DEVELOPER_ACCOUNT.id || a.username.toLowerCase() === 'developer');
      if (devAcc) {
        devAcc.isDeveloper = true;
        devAcc.role = 'developer';
        if (!devAcc.achievements.includes('dev_badge')) {
          devAcc.achievements.push('dev_badge');
        }
      }
    }

    // Guarantee friend arrays are initialized on all accounts
    accounts.forEach((acc) => {
      acc.friendIds = acc.friendIds || [];
      acc.incomingFriendRequests = acc.incomingFriendRequests || [];
      acc.outgoingFriendRequests = acc.outgoingFriendRequests || [];
    });

    return accounts;
  } catch (e) {
    console.error('Failed to load accounts from storage', e);
    return INITIAL_DEMO_ACCOUNTS;
  }
}

export function saveStoredAccounts(accounts: UserAccount[], broadcast: boolean = true): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    localStorage.setItem(STORAGE_KEY_PUBLIC_REGISTRY, JSON.stringify(accounts));

    if (broadcast && accountsChannel) {
      accountsChannel.postMessage({ type: 'ACCOUNTS_SYNC', accounts });
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pali_accounts_updated'));
    }
  } catch (e) {
    console.error('Failed to save accounts to storage', e);
  }
}

export function syncExternalAccounts(incomingAccounts: UserAccount[], broadcast: boolean = true): void {
  if (!Array.isArray(incomingAccounts) || incomingAccounts.length === 0) return;

  const current = getStoredAccounts();
  let changed = false;

  incomingAccounts.forEach((inc) => {
    const existingIndex = current.findIndex(
      (a) => a.id === inc.id || a.username.toLowerCase() === inc.username.toLowerCase()
    );

    if (existingIndex < 0) {
      current.push({
        ...inc,
        friendIds: inc.friendIds || [],
        incomingFriendRequests: inc.incomingFriendRequests || [],
        outgoingFriendRequests: inc.outgoingFriendRequests || [],
      });
      changed = true;
    } else {
      const existing = current[existingIndex];
      const hasUpdates =
        (inc.level || 1) > (existing.level || 1) ||
        (inc.exp || 0) > (existing.exp || 0) ||
        (inc.stats?.gamesWon || 0) > (existing.stats?.gamesWon || 0) ||
        (inc.stats?.maxWinStreak || 0) > (existing.stats?.maxWinStreak || 0) ||
        (inc.stats?.totalWisdomEarned || 0) > (existing.stats?.totalWisdomEarned || 0) ||
        (inc.stats?.correctAnswers || 0) > (existing.stats?.correctAnswers || 0) ||
        (inc.stats?.gamesPlayed || 0) > (existing.stats?.gamesPlayed || 0) ||
        (inc.stats?.examsPassed || 0) > (existing.stats?.examsPassed || 0) ||
        (inc.stats?.propertiesBought || 0) > (existing.stats?.propertiesBought || 0);

      if (hasUpdates) {
        current[existingIndex] = {
          ...existing,
          displayName: inc.displayName || existing.displayName,
          avatar: inc.avatar || existing.avatar,
          level: Math.max(existing.level, inc.level || 1),
          exp: Math.max(existing.exp, inc.exp || 0),
          rankTitle: inc.rankTitle || existing.rankTitle,
          stats: {
            ...existing.stats,
            gamesPlayed: Math.max(existing.stats?.gamesPlayed || 0, inc.stats?.gamesPlayed || 0),
            gamesWon: Math.max(existing.stats?.gamesWon || 0, inc.stats?.gamesWon || 0),
            maxWinStreak: Math.max(existing.stats?.maxWinStreak || 0, inc.stats?.maxWinStreak || 0),
            currentWinStreak: inc.stats?.currentWinStreak ?? existing.stats?.currentWinStreak ?? 0,
            correctAnswers: Math.max(existing.stats?.correctAnswers || 0, inc.stats?.correctAnswers || 0),
            totalAnswers: Math.max(existing.stats?.totalAnswers || 0, inc.stats?.totalAnswers || 0),
            propertiesBought: Math.max(existing.stats?.propertiesBought || 0, inc.stats?.propertiesBought || 0),
            examsPassed: Math.max(existing.stats?.examsPassed || 0, inc.stats?.examsPassed || 0),
            totalWisdomEarned: Math.max(existing.stats?.totalWisdomEarned || 0, inc.stats?.totalWisdomEarned || 0),
          },
        };
        changed = true;
      }
    }
  });

  if (changed) {
    saveStoredAccounts(current, broadcast);
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
  cloudStorageService.saveAccountToCloud(newAccount);

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
  cloudStorageService.saveAccountToCloud(user);

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

export function liveRecordStatChange(
  userId: string,
  statDelta: {
    wisdomGained?: number;
    correctDelta?: number;
    totalAnswersDelta?: number;
    propertyBoughtDelta?: number;
    examDelta?: number;
  }
): UserAccount | null {
  const accounts = getStoredAccounts();
  const userIndex = accounts.findIndex((acc) => acc.id === userId);
  if (userIndex < 0) return null;

  const user = accounts[userIndex];
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

  if (statDelta.wisdomGained) {
    user.stats.totalWisdomEarned = Math.max(0, user.stats.totalWisdomEarned + statDelta.wisdomGained);
    user.exp += Math.max(5, Math.floor(statDelta.wisdomGained / 10));
  }
  if (statDelta.correctDelta) {
    user.stats.correctAnswers += statDelta.correctDelta;
    user.exp += statDelta.correctDelta * 15;
  }
  if (statDelta.totalAnswersDelta) {
    user.stats.totalAnswers += statDelta.totalAnswersDelta;
  }
  if (statDelta.propertyBoughtDelta) {
    user.stats.propertiesBought += statDelta.propertyBoughtDelta;
    user.exp += statDelta.propertyBoughtDelta * 20;
  }
  if (statDelta.examDelta) {
    user.stats.examsPassed += statDelta.examDelta;
    user.exp += statDelta.examDelta * 30;
  }

  // Update level in real-time
  const newLevel = Math.floor(user.exp / 150) + 1;
  if (newLevel > user.level) {
    user.level = newLevel;
    user.rankTitle = getRankTitle(user.level).title;
  }

  accounts[userIndex] = user;
  saveStoredAccounts(accounts, true);
  cloudStorageService.saveAccountToCloud(user);

  const currentSession = getCurrentSession();
  if (currentSession && currentSession.userId === userId) {
    currentSession.level = user.level;
    currentSession.rankTitle = user.rankTitle;
    setStoredSession(currentSession, currentSession.rememberMe);
  }

  return user;
}

export function getLeaderboardAccounts(
  sortBy: 'streak' | 'wins' | 'level' | 'wisdom' = 'streak'
): UserAccount[] {
  const allAccounts = getStoredAccounts();

  // EXCLUDE DEVELOPER ACCOUNTS from Leaderboard Rankings
  const realPlayers = allAccounts.filter(
    (acc) =>
      !acc.isDeveloper &&
      acc.role !== 'developer' &&
      acc.username.toLowerCase() !== 'developer' &&
      acc.id !== 'user_dev_root'
  );

  const sorted = [...realPlayers].sort((a, b) => {
    // 1. Primary Sort
    if (sortBy === 'streak') {
      const diff = (b.stats?.maxWinStreak || 0) - (a.stats?.maxWinStreak || 0);
      if (diff !== 0) return diff;
      const currentDiff = (b.stats?.currentWinStreak || 0) - (a.stats?.currentWinStreak || 0);
      if (currentDiff !== 0) return currentDiff;
    } else if (sortBy === 'wins') {
      const diff = (b.stats?.gamesWon || 0) - (a.stats?.gamesWon || 0);
      if (diff !== 0) return diff;
      const streakDiff = (b.stats?.maxWinStreak || 0) - (a.stats?.maxWinStreak || 0);
      if (streakDiff !== 0) return streakDiff;
    } else if (sortBy === 'level') {
      const diff = (b.level || 1) - (a.level || 1);
      if (diff !== 0) return diff;
      const expDiff = (b.exp || 0) - (a.exp || 0);
      if (expDiff !== 0) return expDiff;
    } else if (sortBy === 'wisdom') {
      const diff = (b.stats?.totalWisdomEarned || 0) - (a.stats?.totalWisdomEarned || 0);
      if (diff !== 0) return diff;
    }

    // 2. Secondary Tie-Breakers (Wins -> Total Wisdom -> Level -> Correct Answers -> Games Played)
    const winsDiff = (b.stats?.gamesWon || 0) - (a.stats?.gamesWon || 0);
    if (winsDiff !== 0) return winsDiff;

    const wisdomDiff = (b.stats?.totalWisdomEarned || 0) - (a.stats?.totalWisdomEarned || 0);
    if (wisdomDiff !== 0) return wisdomDiff;

    const levelDiff = (b.level || 1) - (a.level || 1);
    if (levelDiff !== 0) return levelDiff;

    const expDiff = (b.exp || 0) - (a.exp || 0);
    if (expDiff !== 0) return expDiff;

    const correctDiff = (b.stats?.correctAnswers || 0) - (a.stats?.correctAnswers || 0);
    if (correctDiff !== 0) return correctDiff;

    const playedDiff = (b.stats?.gamesPlayed || 0) - (a.stats?.gamesPlayed || 0);
    if (playedDiff !== 0) return playedDiff;

    // 3. Final Tie-Breaker for 0-score / newly registered accounts:
    // Earlier registered accounts rank above newer accounts with 0 score,
    // so a freshly registered account (newest timestamp) will ALWAYS sit at the bottom / last rank (#N)!
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeA - timeB;
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

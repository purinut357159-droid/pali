import type { UserAccount, GameInvite } from '../types/auth';
import { getStoredAccounts, saveStoredAccounts } from './authService';
import { publicDiscoveryService } from './publicDiscoveryService';

const INVITE_STORAGE_KEY = 'pali_game_invites_v2';
const inviteChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('pali_invites_channel') : null;

export function getFriends(userId: string): UserAccount[] {
  const accounts = getStoredAccounts();
  const user = accounts.find((a) => a.id === userId);
  if (!user || !user.friendIds || user.friendIds.length === 0) return [];

  return accounts.filter((a) => user.friendIds?.includes(a.id));
}

export function getIncomingFriendRequests(
  userId: string
): { fromUser: UserAccount; timestamp: string; message?: string }[] {
  const accounts = getStoredAccounts();
  const user = accounts.find((a) => a.id === userId);
  if (!user || !user.incomingFriendRequests) return [];

  const list: { fromUser: UserAccount; timestamp: string; message?: string }[] = [];
  user.incomingFriendRequests.forEach((req) => {
    const fromUser = accounts.find((a) => a.id === req.fromUserId);
    if (fromUser) {
      list.push({ fromUser, timestamp: req.timestamp, message: req.message });
    }
  });

  return list;
}

export function getOutgoingFriendRequests(
  userId: string
): { toUser: UserAccount; timestamp: string }[] {
  const accounts = getStoredAccounts();
  const user = accounts.find((a) => a.id === userId);
  if (!user || !user.outgoingFriendRequests) return [];

  const list: { toUser: UserAccount; timestamp: string }[] = [];
  user.outgoingFriendRequests.forEach((req) => {
    const toUser = accounts.find((a) => a.id === req.toUserId);
    if (toUser) {
      list.push({ toUser, timestamp: req.timestamp });
    }
  });

  return list;
}

export function sendFriendRequest(
  fromUserId: string,
  targetIdentifier: string,
  message?: string
): { success: boolean; message: string; targetUser?: UserAccount } {
  const cleanTarget = targetIdentifier.trim().toLowerCase();
  if (!cleanTarget) {
    return { success: false, message: 'กรุณาระบุชื่อผู้ใช้ (Username) หรือรหัสผู้เล่น' };
  }

  const accounts = getStoredAccounts();
  const sender = accounts.find((a) => a.id === fromUserId);
  if (!sender) {
    return { success: false, message: 'ไม่พบบัญชีผู้ส่งคำขอ กรุณาเข้าสู่ระบบใหม่' };
  }

  const target = accounts.find(
    (a) =>
      a.id.toLowerCase() === cleanTarget ||
      a.username.toLowerCase() === cleanTarget ||
      a.displayName.toLowerCase() === cleanTarget
  );

  if (!target) {
    return {
      success: false,
      message: `ไม่พบผู้เล่นที่ตรงกับ "${targetIdentifier}" ในระบบ กรุณาตรวจสอบชื่อผู้ใช้หรือรหัสผู้เล่นอีกครั้ง`,
    };
  }

  if (target.id === sender.id) {
    return { success: false, message: 'ท่านไม่สามารถส่งคำขอเป็นเพื่อนถึงตัวเองได้' };
  }

  // Check if already friends
  if (sender.friendIds && sender.friendIds.includes(target.id)) {
    return { success: false, message: `ท่านกับ ${target.displayName} เป็นเพื่อนกันอยู่แล้ว` };
  }

  // Check if target already sent a request to sender -> Auto Accept!
  const hasIncomingFromTarget = sender.incomingFriendRequests?.some((r) => r.fromUserId === target.id);
  if (hasIncomingFromTarget) {
    return acceptFriendRequest(sender.id, target.id);
  }

  // Check if already sent
  if (sender.outgoingFriendRequests?.some((r) => r.toUserId === target.id)) {
    return { success: false, message: `ท่านได้ส่งคำขอเป็นเพื่อนถึง ${target.displayName} ไปแล้ว กรุณารอการตอบรับ` };
  }

  // Add outgoing to sender
  sender.outgoingFriendRequests = sender.outgoingFriendRequests || [];
  sender.outgoingFriendRequests.push({
    toUserId: target.id,
    timestamp: new Date().toISOString(),
  });

  // Add incoming to target
  target.incomingFriendRequests = target.incomingFriendRequests || [];
  target.incomingFriendRequests.push({
    fromUserId: sender.id,
    timestamp: new Date().toISOString(),
    message: message || 'ขอเพิ่มเป็นเพื่อนในเกมบาลีส่วนฐีเพื่อร่วมศึกษาพระบาลี',
  });

  saveStoredAccounts(accounts);
  notifyAccountSync();

  return {
    success: true,
    message: `ส่งคำขอเป็นเพื่อนถึง "${target.displayName}" เรียบร้อยแล้ว!`,
    targetUser: target,
  };
}

export function acceptFriendRequest(
  userId: string,
  fromUserId: string
): { success: boolean; message: string; friend?: UserAccount } {
  const accounts = getStoredAccounts();
  const user = accounts.find((a) => a.id === userId);
  const fromUser = accounts.find((a) => a.id === fromUserId);

  if (!user || !fromUser) {
    return { success: false, message: 'ไม่พบบัญชีผู้เล่น' };
  }

  // Initialize arrays
  user.friendIds = user.friendIds || [];
  fromUser.friendIds = fromUser.friendIds || [];

  if (!user.friendIds.includes(fromUser.id)) {
    user.friendIds.push(fromUser.id);
  }
  if (!fromUser.friendIds.includes(user.id)) {
    fromUser.friendIds.push(user.id);
  }

  // Clean incoming and outgoing
  user.incomingFriendRequests = (user.incomingFriendRequests || []).filter(
    (r) => r.fromUserId !== fromUser.id
  );
  fromUser.outgoingFriendRequests = (fromUser.outgoingFriendRequests || []).filter(
    (r) => r.toUserId !== user.id
  );

  // Also clean reverse if any
  user.outgoingFriendRequests = (user.outgoingFriendRequests || []).filter(
    (r) => r.toUserId !== fromUser.id
  );
  fromUser.incomingFriendRequests = (fromUser.incomingFriendRequests || []).filter(
    (r) => r.fromUserId !== user.id
  );

  saveStoredAccounts(accounts);
  notifyAccountSync();

  return {
    success: true,
    message: `ยินดีด้วย! ท่านและ ${fromUser.displayName} ได้เป็นเพื่อนกันแล้ว 🎉`,
    friend: fromUser,
  };
}

export function declineFriendRequest(
  userId: string,
  fromUserId: string
): { success: boolean; message: string } {
  const accounts = getStoredAccounts();
  const user = accounts.find((a) => a.id === userId);
  const fromUser = accounts.find((a) => a.id === fromUserId);

  if (user) {
    user.incomingFriendRequests = (user.incomingFriendRequests || []).filter(
      (r) => r.fromUserId !== fromUserId
    );
  }
  if (fromUser) {
    fromUser.outgoingFriendRequests = (fromUser.outgoingFriendRequests || []).filter(
      (r) => r.toUserId !== userId
    );
  }

  saveStoredAccounts(accounts);
  notifyAccountSync();

  return { success: true, message: 'ปฏิเสธคำขอเป็นเพื่อนเรียบร้อย' };
}

export function cancelFriendRequest(
  fromUserId: string,
  toUserId: string
): { success: boolean; message: string } {
  const accounts = getStoredAccounts();
  const sender = accounts.find((a) => a.id === fromUserId);
  const target = accounts.find((a) => a.id === toUserId);

  if (sender) {
    sender.outgoingFriendRequests = (sender.outgoingFriendRequests || []).filter(
      (r) => r.toUserId !== toUserId
    );
  }
  if (target) {
    target.incomingFriendRequests = (target.incomingFriendRequests || []).filter(
      (r) => r.fromUserId !== fromUserId
    );
  }

  saveStoredAccounts(accounts);
  notifyAccountSync();

  return { success: true, message: 'ยกเลิกคำขอเป็นเพื่อนเรียบร้อย' };
}

export function removeFriend(
  userId: string,
  friendUserId: string
): { success: boolean; message: string } {
  const accounts = getStoredAccounts();
  const user = accounts.find((a) => a.id === userId);
  const friend = accounts.find((a) => a.id === friendUserId);

  if (user && user.friendIds) {
    user.friendIds = user.friendIds.filter((id) => id !== friendUserId);
  }
  if (friend && friend.friendIds) {
    friend.friendIds = friend.friendIds.filter((id) => id !== userId);
  }

  saveStoredAccounts(accounts);
  notifyAccountSync();

  return { success: true, message: 'ลบเพื่อนเรียบร้อยแล้ว' };
}

export function searchUsers(query: string, currentUserId?: string): UserAccount[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const accounts = getStoredAccounts();
  return accounts.filter(
    (a) =>
      a.id !== currentUserId &&
      (a.username.toLowerCase().includes(clean) ||
        a.displayName.toLowerCase().includes(clean) ||
        a.id.toLowerCase() === clean)
  );
}

export function getSuggestedFriends(currentUserId: string): UserAccount[] {
  const accounts = getStoredAccounts();
  const user = accounts.find((a) => a.id === currentUserId);
  const friendIds = user?.friendIds || [];
  const outgoingIds = (user?.outgoingFriendRequests || []).map((r) => r.toUserId);

  return accounts
    .filter(
      (a) =>
        a.id !== currentUserId &&
        !friendIds.includes(a.id) &&
        !outgoingIds.includes(a.id)
    )
    .slice(0, 6);
}

export function getFriendOnlineStatus(
  friendId: string,
  activeOnlineUserIds: string[] = []
): { status: 'online' | 'in_game' | 'offline'; label: string; color: string } {
  if (activeOnlineUserIds.includes(friendId)) {
    return { status: 'online', label: 'ออนไลน์', color: '#10b981' };
  }

  // Developer and main demo accounts have dynamic simulated activity for rich experience
  if (friendId.includes('dev')) {
    return { status: 'online', label: '👑 ออนไลน์ (พัฒนาเกม)', color: '#38bdf8' };
  }

  // Deterministic status based on friendId hash
  const charCode = friendId.charCodeAt(friendId.length - 1) || 0;
  if (charCode % 3 === 0) {
    return { status: 'online', label: 'ออนไลน์', color: '#10b981' };
  } else if (charCode % 3 === 1) {
    return { status: 'in_game', label: 'กำลังเล่นห้อง', color: '#f59e0b' };
  } else {
    return { status: 'offline', label: 'ออฟไลน์', color: '#94a3b8' };
  }
}

// -------------------------------------------------------------
// In-App Game Invites
// -------------------------------------------------------------

export function getStoredInvites(): GameInvite[] {
  try {
    const raw = localStorage.getItem(INVITE_STORAGE_KEY);
    if (!raw) return [];
    const invites: GameInvite[] = JSON.parse(raw);
    const now = Date.now();
    // Exclude invites older than 10 minutes
    return invites.filter((inv) => now - new Date(inv.timestamp).getTime() < 10 * 60 * 1000);
  } catch {
    return [];
  }
}

export function sendGameInvite(
  fromUser: UserAccount,
  toUserId: string,
  roomCode: string
): { success: boolean; message: string } {
  const current = getStoredInvites();
  const newInvite: GameInvite = {
    id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    fromUserId: fromUser.id,
    fromDisplayName: fromUser.displayName,
    fromAvatar: fromUser.avatar,
    toUserId,
    roomCode,
    timestamp: new Date().toISOString(),
  };

  current.push(newInvite);
  localStorage.setItem(INVITE_STORAGE_KEY, JSON.stringify(current));

  if (inviteChannel) {
    inviteChannel.postMessage({ type: 'NEW_INVITE', invite: newInvite });
  }

  publicDiscoveryService.sendInvite(newInvite);

  return { success: true, message: `ส่งคำชวนเล่นห้อง ${roomCode} เรียบร้อยแล้ว!` };
}

export function getPendingInvitesForUser(userId: string): GameInvite[] {
  const invites = getStoredInvites();
  return invites.filter((inv) => inv.toUserId === userId);
}

export function clearInvite(inviteId: string): void {
  const invites = getStoredInvites().filter((i) => i.id !== inviteId);
  localStorage.setItem(INVITE_STORAGE_KEY, JSON.stringify(invites));
}

function notifyAccountSync() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('pali_accounts_updated'));
  }
}

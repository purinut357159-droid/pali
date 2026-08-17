import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Flame,
  X,
  Sparkles,
  Search,
  UserPlus,
  Gamepad2,
  Check,
  Globe,
  Coins,
} from 'lucide-react';
import type { UserAccount } from '../types/auth';
import { getLeaderboardAccounts } from '../utils/authService';
import { sendFriendRequest, sendGameInvite, getFriends } from '../utils/friendService';
import { audioManager } from '../utils/audioManager';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
  currentRoomCode?: string | null;
  onOpenCreateRoom?: () => void;
}

export const LeaderboardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  currentRoomCode,
  onOpenCreateRoom,
}) => {
  const [sortTab, setSortTab] = useState<'streak' | 'wins' | 'level' | 'wisdom'>('streak');
  const [searchTerm, setSearchTerm] = useState('');
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [sentReqIds, setSentReqIds] = useState<string[]>([]);

  const loadAccounts = () => {
    const list = getLeaderboardAccounts(sortTab);
    setAccounts(list);
    if (currentUser) {
      const friends = getFriends(currentUser.id);
      setFriendIds(friends.map((f) => f.id));
      setSentReqIds((currentUser.outgoingFriendRequests || []).map((r) => r.toUserId));
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadAccounts();

    const handleAccountsUpdate = () => {
      loadAccounts();
    };

    window.addEventListener('pali_accounts_updated', handleAccountsUpdate);
    return () => {
      window.removeEventListener('pali_accounts_updated', handleAccountsUpdate);
    };
  }, [isOpen, sortTab, currentUser]);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddFriend = (target: UserAccount) => {
    if (!currentUser) {
      showToast('กรุณาเข้าสู่ระบบก่อนเพื่อเพิ่มเพื่อน', 'info');
      return;
    }
    const res = sendFriendRequest(currentUser.id, target.id);
    if (res.success) {
      setSentReqIds((prev) => [...prev, target.id]);
      showToast(res.message, 'success');
      audioManager.playSathuChime();
    } else {
      showToast(res.message, 'info');
    }
  };

  const handleInviteToRoom = (target: UserAccount) => {
    if (!currentUser) return;
    if (currentRoomCode) {
      sendGameInvite(currentUser, target.id, currentRoomCode);
      showToast(`ส่งคำชวนเข้าห้อง ${currentRoomCode} ถึง ${target.displayName} แล้ว!`, 'success');
      audioManager.playSathuChime();
    } else {
      if (onOpenCreateRoom) {
        onClose();
        onOpenCreateRoom();
      } else {
        showToast('กรุณาสร้างห้องเล่นเกมก่อนเพื่อส่งคำชวนเพื่อน', 'info');
      }
    }
  };

  if (!isOpen) return null;

  const filteredAccounts = accounts.filter((acc) =>
    acc.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topThree = filteredAccounts.slice(0, 3);

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '24px',
          border: '2px solid var(--primary-gold)',
          boxShadow: '0 0 50px rgba(212, 175, 55, 0.4)',
          position: 'relative',
        }}
      >
        {/* Toast */}
        {toastMessage && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1200,
              background: toastMessage.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(59, 130, 246, 0.95)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.82rem',
              fontWeight: 600,
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <Sparkles size={14} />
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={22} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Globe size={26} color="#38bdf8" />
            <Trophy size={30} color="var(--primary-gold)" />
            <h2 className="gold-gradient-text" style={{ fontSize: '1.5rem', margin: 0 }}>
              ทำเนียบมหาเปรียญออนไลน์ (Online Leaderboard)
            </h2>
            <Flame size={28} color="#ef4444" />
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            จัดอันดับสถิติสดของผู้เล่นและนักศึกษาบาลีทั่วประเทศ (ซิงค์บัญชีออนไลน์อัตโนมัติ)
          </p>
        </div>

        {/* Tab Selection */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px',
            background: 'rgba(0,0,0,0.35)',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '16px',
          }}
        >
          <button
            onClick={() => setSortTab('streak')}
            style={{
              padding: '9px 6px',
              borderRadius: '8px',
              border: 'none',
              background: sortTab === 'streak' ? 'linear-gradient(135deg, #ef4444, #f59e0b)' : 'transparent',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
            }}
          >
            <Flame size={14} color={sortTab === 'streak' ? '#fff' : '#ef4444'} />
            ชนะติด (Streak)
          </button>

          <button
            onClick={() => setSortTab('wins')}
            style={{
              padding: '9px 6px',
              borderRadius: '8px',
              border: 'none',
              background: sortTab === 'wins' ? 'linear-gradient(135deg, #d4af37, #aa7c11)' : 'transparent',
              color: sortTab === 'wins' ? '#090e1a' : '#fff',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
            }}
          >
            <Trophy size={14} />
            ชัยชนะ (Wins)
          </button>

          <button
            onClick={() => setSortTab('level')}
            style={{
              padding: '9px 6px',
              borderRadius: '8px',
              border: 'none',
              background: sortTab === 'level' ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'transparent',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
            }}
          >
            <Sparkles size={14} />
            ยศ & เลเวล (Level)
          </button>

          <button
            onClick={() => setSortTab('wisdom')}
            style={{
              padding: '9px 6px',
              borderRadius: '8px',
              border: 'none',
              background: sortTab === 'wisdom' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
            }}
          >
            <Coins size={14} />
            แต้มปัญญา (Wisdom)
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อผู้เล่น, ชื่อผู้ใช้ (Username) หรือรหัสไอดี..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '0.82rem',
            }}
          />
        </div>

        {/* Top 3 Podium Cards */}
        {topThree.length > 0 && !searchTerm && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginBottom: '16px',
              alignItems: 'flex-end',
            }}
          >
            {/* Rank 2 */}
            {topThree[1] && (
              <div
                style={{
                  background: 'rgba(203, 213, 225, 0.08)',
                  border: '1px solid #94a3b8',
                  borderRadius: '12px',
                  padding: '12px 8px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>🥈 อันดับ 2</div>
                <div style={{ fontSize: '1.8rem' }}>{topThree[1].avatar}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                  {topThree[1].displayName}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Lv.{topThree[1].level}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700 }}>
                  {sortTab === 'streak' && `🔥 ${topThree[1].stats?.currentWinStreak || 0} ตาติด`}
                  {sortTab === 'wins' && `🏆 ${topThree[1].stats?.gamesWon || 0} ชนะ`}
                  {sortTab === 'level' && `⚡ Lv.${topThree[1].level}`}
                  {sortTab === 'wisdom' && `💎 ${(topThree[1].stats?.totalWisdomEarned || 0).toLocaleString()} แต้ม`}
                </div>
              </div>
            )}

            {/* Rank 1 */}
            {topThree[0] && (
              <div
                style={{
                  background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.25), rgba(212, 175, 55, 0.05))',
                  border: '2px solid var(--primary-gold)',
                  borderRadius: '14px',
                  padding: '16px 8px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
                  transform: 'translateY(-6px)',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--primary-gold)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  👑 🥇 อันดับ 1
                </div>
                <div style={{ fontSize: '2.2rem' }}>{topThree[0].avatar}</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                  {topThree[0].displayName}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold)' }}>
                  {topThree[0].rankTitle}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#f59e0b', fontWeight: 800 }}>
                  {sortTab === 'streak' && `🔥 ${topThree[0].stats?.currentWinStreak || 0} ตาติด (สูงสุด ${topThree[0].stats?.maxWinStreak || 0})`}
                  {sortTab === 'wins' && `🏆 ${topThree[0].stats?.gamesWon || 0} ชัยชนะ`}
                  {sortTab === 'level' && `⚡ Lv.${topThree[0].level} (${topThree[0].exp} EXP)`}
                  {sortTab === 'wisdom' && `💎 ${(topThree[0].stats?.totalWisdomEarned || 0).toLocaleString()} แต้มปัญญา`}
                </div>
              </div>
            )}

            {/* Rank 3 */}
            {topThree[2] && (
              <div
                style={{
                  background: 'rgba(217, 119, 6, 0.08)',
                  border: '1px solid #d97706',
                  borderRadius: '12px',
                  padding: '12px 8px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d97706' }}>🥉 อันดับ 3</div>
                <div style={{ fontSize: '1.8rem' }}>{topThree[2].avatar}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                  {topThree[2].displayName}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Lv.{topThree[2].level}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700 }}>
                  {sortTab === 'streak' && `🔥 ${topThree[2].stats?.currentWinStreak || 0} ตาติด`}
                  {sortTab === 'wins' && `🏆 ${topThree[2].stats?.gamesWon || 0} ชนะ`}
                  {sortTab === 'level' && `⚡ Lv.${topThree[2].level}`}
                  {sortTab === 'wisdom' && `💎 ${(topThree[2].stats?.totalWisdomEarned || 0).toLocaleString()} แต้ม`}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detailed Leaderboard Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '4px 10px',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            <span>ผู้เข้าแข่งขันออนไลน์ ({filteredAccounts.length} บัญชี)</span>
            <span>สถิติหลัก / การกระทำ</span>
          </div>

          {filteredAccounts.map((acc, index) => {
            const isMe = currentUser?.id === acc.id;
            const rank = index + 1;
            const isFriend = friendIds.includes(acc.id);
            const isSentReq = sentReqIds.includes(acc.id);

            return (
              <div
                key={acc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: isMe
                    ? 'rgba(212, 175, 55, 0.18)'
                    : rank <= 3
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(255,255,255,0.02)',
                  border: isMe
                    ? '1.5px solid var(--primary-gold)'
                    : rank === 1
                    ? '1px solid var(--primary-gold)'
                    : '1px solid rgba(255,255,255,0.07)',
                  transition: 'all 0.2s',
                  gap: '8px',
                }}
              >
                {/* Player info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: '24px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color:
                        rank === 1
                          ? '#fbbf24'
                          : rank === 2
                          ? '#cbd5e1'
                          : rank === 3
                          ? '#d97706'
                          : 'var(--text-muted)',
                      flexShrink: 0,
                    }}
                  >
                    #{rank}
                  </div>

                  <div style={{ fontSize: '1.3rem', flexShrink: 0, position: 'relative' }}>
                    {acc.avatar}
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '-1px',
                        right: '-2px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#22c55e',
                        border: '1.5px solid #090e1a',
                      }}
                      title="🟢 กำลังออนไลน์ในระบบ"
                    />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: (acc.isDeveloper || acc.role === 'developer') ? '#38bdf8' : isMe ? 'var(--primary-gold)' : '#fff', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {acc.displayName}
                      </span>
                      {(acc.isDeveloper || acc.role === 'developer') && (
                        <span style={{ background: '#0284c7', color: '#fff', fontSize: '0.58rem', padding: '1px 4px', borderRadius: '4px', fontWeight: 800, flexShrink: 0 }}>
                          DEV
                        </span>
                      )}
                      {isMe && (
                        <span style={{ background: 'var(--primary-gold)', color: '#090e1a', fontSize: '0.58rem', padding: '1px 4px', borderRadius: '4px', fontWeight: 800, flexShrink: 0 }}>
                          คุณ
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      @{acc.username} • Lv.{acc.level} ({acc.rankTitle})
                    </div>
                  </div>
                </div>

                {/* Right Stat & Action buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  {/* Metric Value */}
                  <div style={{ textAlign: 'right' }}>
                    {sortTab === 'streak' && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px', color: '#f59e0b', fontWeight: 700, fontSize: '0.82rem' }}>
                          <Flame size={13} color="#ef4444" />
                          <span>{acc.stats?.currentWinStreak || 0} ติด</span>
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          สูงสุด {acc.stats?.maxWinStreak || 0}
                        </div>
                      </div>
                    )}

                    {sortTab === 'wins' && (
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--primary-gold)', fontSize: '0.85rem' }}>
                          🏆 {acc.stats?.gamesWon || 0} ชนะ
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          เล่น {acc.stats?.gamesPlayed || 0} เกม
                        </div>
                      </div>
                    )}

                    {sortTab === 'level' && (
                      <div>
                        <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.85rem' }}>
                          Lv.{acc.level}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {acc.exp || 0} EXP
                        </div>
                      </div>
                    )}

                    {sortTab === 'wisdom' && (
                      <div>
                        <div style={{ fontWeight: 700, color: '#10b981', fontSize: '0.85rem' }}>
                          💎 {(acc.stats?.totalWisdomEarned || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          ตอบถูก {acc.stats?.correctAnswers || 0} ข้อ
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions: Add Friend / Invite to Room */}
                  {!isMe && currentUser && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {isFriend ? (
                        <button
                          onClick={() => handleInviteToRoom(acc)}
                          className="gold-button"
                          style={{ padding: '4px 8px', fontSize: '0.7rem', borderRadius: '6px', gap: '3px' }}
                          title="ชวนเข้าห้องเล่นเกม"
                        >
                          <Gamepad2 size={12} />
                          <span>ชวนเล่น</span>
                        </button>
                      ) : isSentReq ? (
                        <button
                          disabled
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.7rem',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.08)',
                            color: 'var(--text-muted)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            cursor: 'default',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Check size={12} color="#10b981" />
                          <span>ส่งแล้ว</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddFriend(acc)}
                          className="secondary-button"
                          style={{ padding: '4px 8px', fontSize: '0.7rem', borderRadius: '6px', gap: '3px' }}
                          title="เพิ่มเป็นเพื่อน"
                        >
                          <UserPlus size={12} />
                          <span>แอดเพื่อน</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

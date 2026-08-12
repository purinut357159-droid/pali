import React, { useState } from 'react';
import {
  Trophy,
  Flame,
  X,
  Sparkles,
  Search,
} from 'lucide-react';
import { getLeaderboardAccounts } from '../utils/authService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string | null;
}

export const LeaderboardModal: React.FC<Props> = ({ isOpen, onClose, currentUserId }) => {
  const [sortTab, setSortTab] = useState<'streak' | 'wins' | 'level'>('streak');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const accounts = getLeaderboardAccounts(sortTab);
  const filteredAccounts = accounts.filter((acc) =>
    acc.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topThree = filteredAccounts.slice(0, 3);

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '28px',
          border: '2px solid var(--primary-gold)',
          boxShadow: '0 0 50px rgba(212, 175, 55, 0.4)',
          position: 'relative',
        }}
      >
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
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Trophy size={32} color="var(--primary-gold)" />
            <h2 className="gold-gradient-text" style={{ fontSize: '1.6rem', margin: 0 }}>
              ทำเนียบมหาเปรียญ (Leaderboard)
            </h2>
            <Flame size={32} color="#ef4444" />
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            จัดอันดับสถิติผู้ชนะต่อเนื่องและเกียรติยศสูงสุดของบัญชีผู้เล่น
          </p>
        </div>

        {/* Tab Selection */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            background: 'rgba(0,0,0,0.3)',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '20px',
          }}
        >
          <button
            onClick={() => setSortTab('streak')}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: '8px',
              border: 'none',
              background: sortTab === 'streak' ? 'linear-gradient(135deg, #ef4444, #f59e0b)' : 'transparent',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Flame size={16} color={sortTab === 'streak' ? '#fff' : '#ef4444'} />
            ชนะต่อเนื่อง (Win Streak)
          </button>

          <button
            onClick={() => setSortTab('wins')}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: '8px',
              border: 'none',
              background: sortTab === 'wins' ? 'linear-gradient(135deg, #d4af37, #aa7c11)' : 'transparent',
              color: sortTab === 'wins' ? '#090e1a' : '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Trophy size={16} />
            ชัยชนะรวม (Total Wins)
          </button>

          <button
            onClick={() => setSortTab('level')}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: '8px',
              border: 'none',
              background: sortTab === 'level' ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'transparent',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={16} />
            เลเวล & ยศ (Level)
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อผู้เล่น..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '0.85rem',
            }}
          />
        </div>

        {/* Top 3 Podium Cards */}
        {topThree.length > 0 && !searchTerm && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '24px',
              alignItems: 'end',
            }}
          >
            {/* Rank 2 */}
            {topThree[1] && (
              <div
                style={{
                  background: 'linear-gradient(180deg, rgba(203, 213, 225, 0.15) 0%, rgba(16, 25, 50, 0.8) 100%)',
                  border: '1px solid rgba(203, 213, 225, 0.4)',
                  borderRadius: '12px',
                  padding: '16px 10px',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>🥈 #2</div>
                <div style={{ fontSize: '2rem' }}>{topThree[1].avatar}</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {topThree[1].displayName}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Lv.{topThree[1].level} • {topThree[1].rankTitle}
                </div>

                <div
                  style={{
                    marginTop: '8px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                    padding: '4px',
                    fontSize: '0.75rem',
                    color: '#fca5a5',
                    fontWeight: 700,
                  }}
                >
                  🔥 ชนะ {topThree[1].stats?.currentWinStreak || 0} ตาติด (สูงสุด {topThree[1].stats?.maxWinStreak || 0})
                </div>
              </div>
            )}

            {/* Rank 1 (Tallest) */}
            {topThree[0] && (
              <div
                style={{
                  background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.25) 0%, rgba(16, 25, 50, 0.9) 100%)',
                  border: '2px solid var(--primary-gold)',
                  boxShadow: '0 0 25px rgba(212,175,55,0.4)',
                  borderRadius: '14px',
                  padding: '20px 10px',
                  textAlign: 'center',
                  transform: 'scale(1.05)',
                  zIndex: 2,
                }}
              >
                <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>👑 #1 มหาเปรียญ</div>
                <div style={{ fontSize: '2.5rem' }}>{topThree[0].avatar}</div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary-gold)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {topThree[0].displayName}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#fef08a' }}>
                  Lv.{topThree[0].level} • {topThree[0].rankTitle}
                </div>

                <div
                  style={{
                    marginTop: '10px',
                    background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
                    borderRadius: '8px',
                    padding: '6px',
                    fontSize: '0.8rem',
                    color: '#fff',
                    fontWeight: 800,
                    boxShadow: '0 0 10px rgba(245, 158, 11, 0.6)',
                  }}
                >
                  🔥 ชนะ {topThree[0].stats?.currentWinStreak || 0} ตาติด (สูงสุด {topThree[0].stats?.maxWinStreak || 0})
                </div>
              </div>
            )}

            {/* Rank 3 */}
            {topThree[2] && (
              <div
                style={{
                  background: 'linear-gradient(180deg, rgba(217, 119, 6, 0.15) 0%, rgba(16, 25, 50, 0.8) 100%)',
                  border: '1px solid rgba(217, 119, 6, 0.4)',
                  borderRadius: '12px',
                  padding: '16px 10px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>🥉 #3</div>
                <div style={{ fontSize: '2rem' }}>{topThree[2].avatar}</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {topThree[2].displayName}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Lv.{topThree[2].level} • {topThree[2].rankTitle}
                </div>

                <div
                  style={{
                    marginTop: '8px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                    padding: '4px',
                    fontSize: '0.75rem',
                    color: '#fca5a5',
                    fontWeight: 700,
                  }}
                >
                  🔥 ชนะ {topThree[2].stats?.currentWinStreak || 0} ตาติด (สูงสุด {topThree[2].stats?.maxWinStreak || 0})
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detailed Leaderboard Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '6px 14px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            <span>อันดับ & ผู้เข้าแข่งขัน</span>
            <div style={{ display: 'flex', gap: '20px' }}>
              <span>ชนะต่อเนื่อง</span>
              <span>ชนะ/เล่นทั้งหมด</span>
              <span>แต้มปัญญารวม</span>
            </div>
          </div>

          {filteredAccounts.map((acc, index) => {
            const isMe = currentUserId === acc.id;
            const rank = index + 1;
            const currentStreak = acc.stats?.currentWinStreak || 0;
            const maxStreak = acc.stats?.maxWinStreak || 0;

            return (
              <div
                key={acc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: isMe
                    ? 'rgba(212, 175, 55, 0.2)'
                    : rank <= 3
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(255,255,255,0.02)',
                  border: isMe
                    ? '1.5px solid var(--primary-gold)'
                    : rank === 1
                    ? '1px solid var(--primary-gold)'
                    : '1px solid rgba(255,255,255,0.06)',
                  transition: 'all 0.2s',
                }}
              >
                {/* Player info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '28px',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      color:
                        rank === 1
                          ? '#fbbf24'
                          : rank === 2
                          ? '#cbd5e1'
                          : rank === 3
                          ? '#d97706'
                          : 'var(--text-muted)',
                    }}
                  >
                    #{rank}
                  </div>

                  <div style={{ fontSize: '1.5rem' }}>{acc.avatar}</div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: isMe ? 'var(--primary-gold)' : '#fff', fontSize: '0.9rem' }}>
                        {acc.displayName}
                      </span>
                      {isMe && (
                        <span style={{ background: 'var(--primary-gold)', color: '#090e1a', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '6px', fontWeight: 800 }}>
                          คุณ
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Lv.{acc.level} • {acc.rankTitle}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.85rem' }}>
                  {/* Streak */}
                  <div style={{ textAlign: 'right', minWidth: '90px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', color: '#f59e0b', fontWeight: 700 }}>
                      <Flame size={14} color="#ef4444" />
                      <span>{currentStreak} ติด</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      สูงสุด: {maxStreak}
                    </div>
                  </div>

                  {/* Win rate */}
                  <div style={{ textAlign: 'right', minWidth: '70px' }}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>
                      {acc.stats?.gamesWon || 0} / {acc.stats?.gamesPlayed || 0}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#10b981' }}>
                      {acc.stats?.gamesPlayed ? Math.round(((acc.stats.gamesWon || 0) / acc.stats.gamesPlayed) * 100) : 0}% ชนะ
                    </div>
                  </div>

                  {/* Wisdom */}
                  <div style={{ textAlign: 'right', minWidth: '75px', color: 'var(--accent-gold)', fontWeight: 700 }}>
                    💡 {(acc.stats?.totalWisdomEarned || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

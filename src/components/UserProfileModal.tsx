import React, { useState } from 'react';
import {
  Trophy,
  Award,
  BookOpen,
  Settings,
  LogOut,
  X,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Users,
  BarChart2,
  TrendingUp,
  Flame,
  Terminal,
  Zap,
  Cpu,
  RotateCcw,
  KeyRound,
  Lock,
} from 'lucide-react';
import type { UserAccount } from '../types/auth';
import { ACHIEVEMENTS_LIST, getRankTitle } from '../types/auth';
import {
  updateProfile,
  logoutAccount,
  devSetLevel,
  devAddExp,
  devUnlockAllAchievements,
  devResetAccountStats,
  setDeveloperMasterPassword,
} from '../utils/authService';
import { CHARACTERS } from '../data/charactersData';
import type { CharacterId } from '../types/game';

interface Props {
  user: UserAccount;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updatedUser: UserAccount) => void;
  onLogout: () => void;
  onSwitchAccount: () => void;
  onOpenLeaderboard?: () => void;
  onOpenFriends?: () => void;
}

const AVATAR_PRESETS = ['🧘‍♂️', '👨‍🏫', '👦', '🎓', '📿', '📜', '✨', '🏯', '👑', '🕊️', '💻'];

export const UserProfileModal: React.FC<Props> = ({
  user,
  isOpen,
  onClose,
  onUpdateUser,
  onLogout,
  onSwitchAccount,
  onOpenLeaderboard,
  onOpenFriends,
}) => {
  const isDev = user.isDeveloper || user.role === 'developer';
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'edit' | 'dev'>('stats');

  // Edit form state
  const [editDisplayName, setEditDisplayName] = useState(user.displayName);
  const [editAvatar, setEditAvatar] = useState(user.avatar);
  const [editFavoriteChar, setEditFavoriteChar] = useState<CharacterId>(user.favoriteCharacter);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [devActionMsg, setDevActionMsg] = useState<string | null>(null);

  // Dev Master Password change state
  const [newDevPass, setNewDevPass] = useState('');
  const [devPassSuccess, setDevPassSuccess] = useState(false);
  const [devPassError, setDevPassError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentExp = user.exp;
  const currentLevel = user.level;
  const expForCurrentLevel = (currentLevel - 1) * 150;
  const expForNextLevel = currentLevel * 150;
  const progressInLevel = Math.max(0, currentExp - expForCurrentLevel);
  const levelExpRange = expForNextLevel - expForCurrentLevel;
  const expPercentage = Math.min(100, Math.round((progressInLevel / levelExpRange) * 100));

  const winRate = user.stats?.gamesPlayed > 0 ? Math.round((user.stats.gamesWon / user.stats.gamesPlayed) * 100) : 0;
  const accuracyRate =
    user.stats?.totalAnswers > 0 ? Math.round((user.stats.correctAnswers / user.stats.totalAnswers) * 100) : 0;
  const masteredVocabCount = user.reviewItems ? user.reviewItems.filter((i) => i.mastered).length : 0;
  const totalDeckCount = user.reviewItems ? user.reviewItems.length : 0;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = updateProfile(user.id, {
      displayName: editDisplayName,
      avatar: editAvatar,
      favoriteCharacter: editFavoriteChar,
    });
    if (updated) {
      onUpdateUser(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const rankInfo = getRankTitle(user.level);

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '580px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '28px',
          border: '2px solid var(--primary-gold)',
          boxShadow: '0 0 50px rgba(212, 175, 55, 0.4)',
          position: 'relative',
        }}
      >
        {/* Close button */}
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

        {/* Profile Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(16, 25, 50, 0.8))',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(212,175,55,0.4) 0%, rgba(0,0,0,0.5) 100%)',
              border: '2px solid var(--primary-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.2rem',
              boxShadow: '0 0 15px rgba(212,175,55,0.4)',
            }}
          >
            {user.avatar}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.3rem', color: '#fff', margin: 0, fontWeight: 700 }}>
                {user.displayName}
              </h2>
              <span
                style={{
                  background: 'rgba(212, 175, 55, 0.2)',
                  color: 'var(--primary-gold)',
                  border: '1px solid var(--primary-gold)',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                Lv.{user.level}
              </span>
              {isDev && (
                <span
                  style={{
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    color: '#fff',
                    border: '1px solid #38bdf8',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    boxShadow: '0 0 10px rgba(56,189,248,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Terminal size={12} />
                  DEV
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--accent-gold)' }}>
                {rankInfo.badge} {user.rankTitle || rankInfo.title}
              </div>

              {onOpenFriends && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenFriends();
                  }}
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: '8px',
                    padding: '2px 8px',
                    fontSize: '0.72rem',
                    color: '#38bdf8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600,
                  }}
                >
                  <Users size={12} />
                  <span>เพื่อน ({user.friendIds?.length || 0})</span>
                </button>
              )}
            </div>

            {/* EXP Progress Bar */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                <span>EXP: {currentExp} แต้ม</span>
                <span>{progressInLevel} / {levelExpRange} ({expPercentage}%)</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${expPercentage}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #f39c12, #d4af37)',
                    borderRadius: '3px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            background: 'rgba(0,0,0,0.3)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => setActiveTab('stats')}
            style={{
              flex: 1,
              minWidth: '70px',
              padding: '6px 8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'stats' ? 'rgba(212,175,55,0.25)' : 'transparent',
              color: activeTab === 'stats' ? 'var(--primary-gold)' : '#fff',
              fontWeight: 600,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <BarChart2 size={14} />
            <span>สถิติ</span>
          </button>

          <button
            onClick={() => setActiveTab('achievements')}
            style={{
              flex: 1,
              minWidth: '85px',
              padding: '6px 8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'achievements' ? 'rgba(212,175,55,0.25)' : 'transparent',
              color: activeTab === 'achievements' ? 'var(--primary-gold)' : '#fff',
              fontWeight: 600,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Award size={14} />
            <span>เหรียญตรา ({user.achievements ? user.achievements.length : 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('edit')}
            style={{
              flex: 1,
              minWidth: '75px',
              padding: '6px 8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'edit' ? 'rgba(212,175,55,0.25)' : 'transparent',
              color: activeTab === 'edit' ? 'var(--primary-gold)' : '#fff',
              fontWeight: 600,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Settings size={14} />
            <span>โปรไฟล์</span>
          </button>

          {isDev && (
            <button
              onClick={() => setActiveTab('dev')}
              style={{
                flex: 1,
                minWidth: '65px',
                padding: '6px 8px',
                borderRadius: '8px',
                background: activeTab === 'dev' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(6,182,212,0.1)',
                color: activeTab === 'dev' ? '#fff' : '#38bdf8',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                border: activeTab === 'dev' ? '1px solid #38bdf8' : '1px solid rgba(6,182,212,0.3)',
              }}
            >
              <Cpu size={14} />
              <span>Dev</span>
            </button>
          )}
        </div>

        {/* TAB 1: STATISTICS */}
        {activeTab === 'stats' && (
          <div>
            {/* Win Streak Card Highlight */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.2))',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '10px',
                padding: '10px 12px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Flame size={20} color="#ef4444" />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ชนะต่อเนื่อง (Streak)</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f59e0b' }}>
                    กำลังชนะ {user.stats?.currentWinStreak || 0} ตาติด
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>สถิติสูงสุด</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
                  ⚡ {user.stats?.maxWinStreak || 0} ตาติด
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 6px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>เกมที่เล่น</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                  {user.stats?.gamesPlayed || 0}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 6px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ชนะทั้งหมด</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-gold)', marginTop: '2px' }}>
                  {user.stats?.gamesWon || 0}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 6px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>อัตราชนะ</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                  {winRate}%
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <BookOpen size={14} color="var(--primary-gold)" />
                  <span>ตอบถูก</span>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                  {user.stats?.correctAnswers || 0} / {user.stats?.totalAnswers || 0}
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', marginLeft: '4px' }}>
                    ({accuracyRate}%)
                  </span>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Trophy size={14} color="#3b82f6" />
                  <span>ผ่านสอบใหญ่</span>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                  {user.stats?.examsPassed || 0} ครั้ง
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <TrendingUp size={14} color="#ec4899" />
                  <span>วิชาที่เคยซื้อ</span>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                  {user.stats?.propertiesBought || 0} แห่ง
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Sparkles size={14} color="var(--primary-gold)" />
                  <span>แต้มปัญญารวม</span>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-gold)', marginTop: '4px' }}>
                  💡 {(user.stats?.totalWisdomEarned || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* SRS Vocab Deck Summary */}
            <div
              style={{
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.2)',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                  🧠 คลังคำศัพท์ในสมุดทบทวน (SRS Deck)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  จดจำได้แม่นยำแล้ว {masteredVocabCount} จาก {totalDeckCount} คำศัพท์
                </div>
              </div>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                {totalDeckCount > 0 ? Math.round((masteredVocabCount / totalDeckCount) * 100) : 100}% แม่นยำ
              </span>
            </div>

            {/* Open Leaderboard Button */}
            {onOpenLeaderboard && (
              <button
                onClick={() => {
                  onClose();
                  onOpenLeaderboard();
                }}
                className="gold-button"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 50%, #d4af37 100%)',
                }}
              >
                <Trophy size={18} />
                ดูทำเนียบจัดอันดับผู้ชนะต่อเนื่อง (Leaderboard)
              </button>
            )}
          </div>
        )}

        {/* TAB 2: ACHIEVEMENTS */}
        {activeTab === 'achievements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ACHIEVEMENTS_LIST.map((ach) => {
              const isUnlocked = user.achievements && user.achievements.includes(ach.id);
              return (
                <div
                  key={ach.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '10px',
                    background: isUnlocked ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isUnlocked ? 'var(--primary-gold)' : 'rgba(255,255,255,0.06)'}`,
                    opacity: isUnlocked ? 1 : 0.6,
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: isUnlocked ? 'rgba(212,175,55,0.25)' : 'rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      filter: isUnlocked ? 'none' : 'grayscale(1)',
                    }}
                  >
                    {ach.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: isUnlocked ? 'var(--primary-gold)' : '#fff', fontSize: '0.9rem' }}>
                        {ach.title}
                      </span>
                      {isUnlocked && <CheckCircle size={14} color="#10b981" />}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                      {ach.description}
                    </p>
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: isUnlocked ? '#10b981' : 'var(--text-muted)',
                      fontWeight: 600,
                    }}
                  >
                    {isUnlocked ? 'ปลดล็อกแล้ว' : 'ยังไม่ปลดล็อก'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: EDIT PROFILE & ACTIONS */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSaveProfile}>
            {saveSuccess && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10b981',
                  borderRadius: '8px',
                  padding: '10px',
                  marginBottom: '14px',
                  color: '#6ee7b7',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CheckCircle size={16} />
                บันทึกการเปลี่ยนแปลงเรียบร้อย!
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--primary-gold)', marginBottom: '4px' }}>
                ชื่อที่แสดงในเกม (Display Name):
              </label>
              <input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--primary-gold)', marginBottom: '6px' }}>
                รูปโปรไฟล์ (Avatar):
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {AVATAR_PRESETS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setEditAvatar(av)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      border: `2px solid ${editAvatar === av ? 'var(--primary-gold)' : 'rgba(255,255,255,0.1)'}`,
                      background: editAvatar === av ? 'rgba(212,175,55,0.25)' : 'rgba(0,0,0,0.3)',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--primary-gold)', marginBottom: '6px' }}>
                ตัวละครโปรดเริ่มต้น:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {CHARACTERS.map((char) => (
                  <div
                    key={char.id}
                    onClick={() => setEditFavoriteChar(char.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: `1px solid ${editFavoriteChar === char.id ? 'var(--primary-gold)' : 'rgba(255,255,255,0.1)'}`,
                      background: editFavoriteChar === char.id ? 'rgba(212,175,55,0.2)' : 'rgba(0,0,0,0.3)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{char.avatar}</span>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{char.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="gold-button"
              style={{ width: '100%', justifyContent: 'center', padding: '10px', marginBottom: '16px' }}
            >
              บันทึกข้อมูลส่วนตัว
            </button>
          </form>
        )}

        {/* TAB 4: DEVELOPER TOOLS */}
        {activeTab === 'dev' && isDev && (
          <div>
            {/* Dev Notification Message */}
            {devActionMsg && (
              <div
                style={{
                  background: 'rgba(6, 182, 212, 0.2)',
                  border: '1px solid #38bdf8',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  color: '#e0f2fe',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle size={16} color="#38bdf8" />
                <span>{devActionMsg}</span>
              </div>
            )}

            {/* Developer Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.2), rgba(15, 23, 42, 0.8))',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <Terminal size={22} color="#38bdf8" />
                <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1rem', fontWeight: 700 }}>
                  แผงควบคุมสิทธิ์ผู้พัฒนา (Developer Control Center)
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                เครื่องมือทดสอบระบบ ปรับแต่งระดับเลเวล ปลดล็อกความสำเร็จ และตรวจเช็คสถานะฐานข้อมูล
              </p>
            </div>

            {/* Dev Controls Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Set Level */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--primary-gold)', fontSize: '0.85rem', fontWeight: 700 }}>
                  <Zap size={16} />
                  <span>ปรับระดับเลเวลทันที (Instant Level)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {[1, 10, 50, 99].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        const updated = devSetLevel(user.id, lvl);
                        if (updated) {
                          onUpdateUser(updated);
                          setDevActionMsg(`⚡ ปรับเลเวลสู่ Lv.${lvl} เรียบร้อยแล้ว!`);
                          setTimeout(() => setDevActionMsg(null), 2500);
                        }
                      }}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        background: user.level === lvl ? 'rgba(56, 189, 248, 0.3)' : 'rgba(0, 0, 0, 0.4)',
                        border: `1px solid ${user.level === lvl ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'}`,
                        color: user.level === lvl ? '#38bdf8' : '#fff',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      Lv.{lvl} {lvl === 99 ? '👑' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add EXP */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 700 }}>
                  <TrendingUp size={16} />
                  <span>เพิ่มค่าประสบการณ์ (Add EXP)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[1000, 5000, 25000].map((exp) => (
                    <button
                      key={exp}
                      type="button"
                      onClick={() => {
                        const updated = devAddExp(user.id, exp);
                        if (updated) {
                          onUpdateUser(updated);
                          setDevActionMsg(`⚡ เพิ่ม +${exp.toLocaleString()} EXP สำเร็จ!`);
                          setTimeout(() => setDevActionMsg(null), 2500);
                        }
                      }}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        background: 'rgba(2, 132, 199, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#e0f2fe',
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                      }}
                    >
                      +{exp.toLocaleString()} EXP
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Dev Actions */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a78bfa', fontSize: '0.85rem', fontWeight: 700 }}>
                  <Award size={16} />
                  <span>ปลดล็อกและความสำเร็จ (Achievements)</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const updated = devUnlockAllAchievements(user.id);
                    if (updated) {
                      onUpdateUser(updated);
                      setDevActionMsg('🏆 ปลดล็อกเหรียญตราและความสำเร็จทั้งหมดแล้ว!');
                      setTimeout(() => setDevActionMsg(null), 2500);
                    }
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(212, 175, 55, 0.2))',
                    border: '1px solid #a855f7',
                    color: '#f3e8ff',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Sparkles size={16} />
                  ปลดล็อกเหรียญตราทั้งหมด (Unlock All {ACHIEVEMENTS_LIST.length} Badges)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('คุณต้องการรีเซ็ตสถิติและเลเวลของบัญชีนี้กลับเป็นเริ่มต้นหรือไม่?')) {
                      const updated = devResetAccountStats(user.id);
                      if (updated) {
                        onUpdateUser(updated);
                        setDevActionMsg('🔄 รีเซ็ตสถิติบัญชีเรียบร้อยแล้ว');
                        setTimeout(() => setDevActionMsg(null), 2500);
                      }
                    }
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <RotateCcw size={14} />
                  รีเซ็ตสถิติทั้งหมด (Reset Stats)
                </button>
              </div>

              {/* Developer Master Key Management */}
              <div
                style={{
                  background: 'rgba(2, 132, 199, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '10px',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>
                  <Lock size={16} />
                  <span>ตั้งค่ารหัสผ่านลับผู้พัฒนาระบบ (Master Dev Key)</span>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  รหัสนี้ใช้สำหรับเข้าสู่ระบบในฐานะผู้พัฒนาสูงสุด (เข้าถึงได้เฉพาะคุณปุรินทร์)
                </p>

                {devPassSuccess && (
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid #10b981',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      marginBottom: '10px',
                      color: '#6ee7b7',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <CheckCircle size={14} color="#10b981" />
                    <span>อัปเดตรหัสผ่านลับผู้พัฒนาเรียบร้อยแล้ว!</span>
                  </div>
                )}

                {devPassError && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid #ef4444',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      marginBottom: '10px',
                      color: '#fca5a5',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <AlertCircle size={14} color="#ef4444" />
                    <span>{devPassError}</span>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setDevPassError(null);
                    if (!newDevPass || newDevPass.trim().length < 4) {
                      setDevPassError('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
                      return;
                    }
                    const ok = setDeveloperMasterPassword(newDevPass.trim());
                    if (ok) {
                      setDevPassSuccess(true);
                      setNewDevPass('');
                      setTimeout(() => setDevPassSuccess(false), 3000);
                    } else {
                      setDevPassError('ไม่สามารถบันทึกรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง');
                    }
                  }}
                  style={{ display: 'flex', gap: '8px' }}
                >
                  <input
                    type="password"
                    value={newDevPass}
                    onChange={(e) => setNewDevPass(e.target.value)}
                    placeholder="กำหนดรหัสผ่านลับใหม่..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      color: '#fff',
                      fontSize: '0.8rem',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                      border: '1px solid #38bdf8',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <KeyRound size={13} />
                    บันทึกรหัส
                  </button>
                </form>
              </div>

              {/* Developer Metadata Info */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div><strong>User ID:</strong> <code style={{ color: '#38bdf8' }}>{user.id}</code></div>
                <div><strong>Username:</strong> <code style={{ color: '#f59e0b' }}>{user.username}</code></div>
                <div><strong>Role:</strong> <code style={{ color: '#10b981' }}>{user.role || 'developer'}</code> (Super Admin)</div>
                <div><strong>Security Isolation:</strong> <span style={{ color: '#38bdf8' }}>🔒 ล็อกความปลอดภัยเฉพาะคุณปุรินทร์ (Exclusive Access)</span></div>
                <div><strong>Session Persistence:</strong> <span style={{ color: '#10b981' }}>✓ LocalStorage (Persistent)</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Account Switcher and Logout Footer */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            gap: '10px',
          }}
        >
          <button
            onClick={() => {
              onClose();
              onSwitchAccount();
            }}
            className="secondary-button"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.85rem',
            }}
          >
            <Users size={16} />
            สลับบัญชี
          </button>

          <button
            onClick={() => {
              logoutAccount();
              onLogout();
              onClose();
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#fca5a5',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <LogOut size={16} />
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
};

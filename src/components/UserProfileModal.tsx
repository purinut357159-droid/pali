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
  Users,
  BarChart2,
  TrendingUp,
  Flame,
} from 'lucide-react';
import type { UserAccount } from '../types/auth';
import { ACHIEVEMENTS_LIST, getRankTitle } from '../types/auth';
import { updateProfile, logoutAccount } from '../utils/authService';
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
}

const AVATAR_PRESETS = ['🧘‍♂️', '👨‍🏫', '👦', '🎓', '📿', '📜', '✨', '🏯', '👑', '🕊️'];

export const UserProfileModal: React.FC<Props> = ({
  user,
  isOpen,
  onClose,
  onUpdateUser,
  onLogout,
  onSwitchAccount,
  onOpenLeaderboard,
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'edit'>('stats');

  // Edit form state
  const [editDisplayName, setEditDisplayName] = useState(user.displayName);
  const [editAvatar, setEditAvatar] = useState(user.avatar);
  const [editFavoriteChar, setEditFavoriteChar] = useState<CharacterId>(user.favoriteCharacter);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', marginTop: '2px' }}>
              {rankInfo.badge} {user.rankTitle || rankInfo.title}
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
            gap: '6px',
            background: 'rgba(0,0,0,0.3)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '20px',
          }}
        >
          <button
            onClick={() => setActiveTab('stats')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'stats' ? 'rgba(212,175,55,0.25)' : 'transparent',
              color: activeTab === 'stats' ? 'var(--primary-gold)' : '#fff',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <BarChart2 size={16} />
            สถิติผลงาน
          </button>

          <button
            onClick={() => setActiveTab('achievements')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'achievements' ? 'rgba(212,175,55,0.25)' : 'transparent',
              color: activeTab === 'achievements' ? 'var(--primary-gold)' : '#fff',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Award size={16} />
            เหรียญตรา ({user.achievements ? user.achievements.length : 0}/{ACHIEVEMENTS_LIST.length})
          </button>

          <button
            onClick={() => setActiveTab('edit')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'edit' ? 'rgba(212,175,55,0.25)' : 'transparent',
              color: activeTab === 'edit' ? 'var(--primary-gold)' : '#fff',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Settings size={16} />
            ตั้งค่าโปรไฟล์
          </button>
        </div>

        {/* TAB 1: STATISTICS */}
        {activeTab === 'stats' && (
          <div>
            {/* Win Streak Card Highlight */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.2))',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Flame size={24} color="#ef4444" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>สถิติชนะต่อเนื่อง (Win Streak)</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>
                    กำลังชนะต่อเนื่อง {user.stats?.currentWinStreak || 0} ตาติด
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ชนะต่อเนื่องสูงสุด</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                  ⚡ {user.stats?.maxWinStreak || 0} ตาติด
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>จำนวนเกมที่เล่น</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                  {user.stats?.gamesPlayed || 0} เกม
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ชนะการแข่งขัน</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-gold)', marginTop: '4px' }}>
                  {user.stats?.gamesWon || 0} ครั้ง
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>อัตราการชนะ</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                  {winRate}%
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <BookOpen size={16} color="var(--primary-gold)" />
                  <span>ตอบคำถามบาลีถูกต้อง</span>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginTop: '6px' }}>
                  {user.stats?.correctAnswers || 0} / {user.stats?.totalAnswers || 0} ข้อ
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', marginLeft: '8px' }}>
                    ({accuracyRate}%)
                  </span>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Trophy size={16} color="#3b82f6" />
                  <span>ผ่านการสอบใหญ่ (Exam)</span>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginTop: '6px' }}>
                  {user.stats?.examsPassed || 0} ครั้ง
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <TrendingUp size={16} color="#ec4899" />
                  <span>สำนักเรียนที่ครอบครอง</span>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginTop: '6px' }}>
                  {user.stats?.propertiesBought || 0} แห่ง
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Sparkles size={16} color="var(--primary-gold)" />
                  <span>แต้มปัญญารวมที่เคยได้</span>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-gold)', marginTop: '6px' }}>
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

import React, { useState } from 'react';
import { Volume2, VolumeX, BookOpen, RefreshCw, LogIn, Trophy, Users, Globe, Music, Music2 } from 'lucide-react';
import type { GameState } from '../types/game';
import type { UserAccount } from '../types/auth';
import { audioManager, BGM_THEMES, type BGMThemeId } from '../utils/audioManager';

interface Props {
  gameState: GameState;
  currentUser: UserAccount | null;
  onOpenNotebook: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  onOpenAuthModal: () => void;
  onOpenProfileModal: () => void;
  onOpenLeaderboard: () => void;
  onOpenFriends: () => void;
  onOpenOnlineLobby: () => void;
  isOnline?: boolean;
  onlineRoomCode?: string | null;
  friendRequestCount?: number;
}

export const GameHeader: React.FC<Props> = ({
  gameState,
  currentUser,
  onOpenNotebook,
  onRestart,
  onToggleMute,
  isMuted,
  onOpenAuthModal,
  onOpenProfileModal,
  onOpenLeaderboard,
  onOpenFriends,
  onOpenOnlineLobby,
  isOnline = false,
  onlineRoomCode = null,
  friendRequestCount = 0,
}) => {
  const currentTurnPlayer = gameState.players[gameState.currentTurnPlayerIndex];
  const dueReviewsCount = gameState.reviewItems.filter((i) => !i.mastered).length;

  const bgmState = audioManager.getBGMState();
  const [isBgmActive, setIsBgmActive] = useState<boolean>(bgmState.isPlaying);
  const [bgmVol, setBgmVol] = useState<number>(bgmState.volume);
  const [bgmTheme, setBgmTheme] = useState<BGMThemeId>(bgmState.theme);
  const [showMusicPanel, setShowMusicPanel] = useState<boolean>(false);

  return (
    <header className="glass-panel game-header" style={{ padding: '12px 20px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.8rem' }}>🎲</span>
          <div>
            <h1 className="gold-gradient-text" style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
              บาลีส่วนฐี (Pali Tycoon)
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              ครอบครองวิชา อัปเกรดสำนักเรียน พิชิตความเป็น "มหาเปรียญ"
            </p>
          </div>
        </div>

        {gameState.gameStatus === 'playing' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.2)' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>รอบที่: </span>
              <strong style={{ color: 'var(--accent-gold)' }}>{gameState.currentRound} / {gameState.maxRounds}</strong>
            </div>
            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }} />
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ตาของ: </span>
              <strong style={{ color: currentTurnPlayer?.color || '#fff' }}>
                {currentTurnPlayer?.character?.avatar} {currentTurnPlayer?.name}
              </strong>
            </div>
          </div>
        )}

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* User Profile / Auth Button */}
          {currentUser ? (
            <button
              onClick={onOpenProfileModal}
              className="glass-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '12px',
                border: (currentUser.isDeveloper || currentUser.role === 'developer')
                  ? '1.5px solid #38bdf8'
                  : '1px solid var(--primary-gold)',
                background: (currentUser.isDeveloper || currentUser.role === 'developer')
                  ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(212, 175, 55, 0.15))'
                  : 'rgba(212, 175, 55, 0.15)',
                boxShadow: (currentUser.isDeveloper || currentUser.role === 'developer')
                  ? '0 0 15px rgba(6, 182, 212, 0.3)'
                  : 'none',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title="เปิดหน้าโปรไฟล์และสถิติ"
            >
              <span style={{ fontSize: '1.2rem' }}>{currentUser.avatar}</span>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: (currentUser.isDeveloper || currentUser.role === 'developer') ? '#38bdf8' : 'var(--primary-gold)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{currentUser.displayName}</span>
                  {(currentUser.isDeveloper || currentUser.role === 'developer') ? (
                    <span style={{ fontSize: '0.65rem', background: '#0284c7', color: '#fff', padding: '1px 5px', borderRadius: '8px', fontWeight: 800 }}>
                      DEV Lv.{currentUser.level}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.65rem', background: 'var(--primary-gold)', color: '#090e1a', padding: '1px 5px', borderRadius: '8px', fontWeight: 800 }}>
                      Lv.{currentUser.level}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {currentUser.rankTitle} {currentUser.stats?.currentWinStreak ? `🔥${currentUser.stats.currentWinStreak}` : ''}
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="gold-button"
              style={{ padding: '8px 14px', fontSize: '0.85rem', gap: '6px' }}
              title="เข้าสู่ระบบ หรือ สมัครสมาชิกเพื่อบันทึกสถิติ"
            >
              <LogIn size={16} />
              <span>เข้าสู่ระบบ / สมาชิก</span>
            </button>
          )}

          {/* Friends Button */}
          <button
            onClick={onOpenFriends}
            className="secondary-button"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}
            title="เปิดระบบเพื่อนและคำขอเป็นเพื่อน"
          >
            <Users size={18} color="#38bdf8" />
            <span style={{ fontSize: '0.85rem' }}>เพื่อน</span>
            {friendRequestCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '0.68rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  boxShadow: '0 2px 6px rgba(239,68,68,0.6)',
                }}
              >
                {friendRequestCount}
              </span>
            )}
          </button>

          {/* Online Room Button / Badge */}
          {isOnline && onlineRoomCode ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(212, 175, 55, 0.2))',
                border: '1.5px solid #38bdf8',
                borderRadius: '10px',
                padding: '6px 10px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#38bdf8',
              }}
            >
              <Globe size={15} />
              <span>ห้อง: {onlineRoomCode}</span>
            </div>
          ) : (
            <button
              onClick={onOpenOnlineLobby}
              className="gold-button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                fontSize: '0.85rem',
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                color: '#fff',
                boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)',
              }}
              title="สร้างห้องหรือเข้าร่วมห้องเล่นออนไลน์กับเพื่อน"
            >
              <Globe size={16} />
              <span>เล่นออนไลน์</span>
            </button>
          )}

          {/* Leaderboard Button */}
          <button
            onClick={onOpenLeaderboard}
            className="secondary-button"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="ดูทำเนียบจัดอันดับผู้ชนะต่อเนื่อง"
          >
            <Trophy size={18} color="#f59e0b" />
            <span style={{ fontSize: '0.85rem' }}>จัดอันดับ</span>
          </button>

          <button
            onClick={onOpenNotebook}
            className="secondary-button"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}
            title="สมุดทบทวนคำบาลีที่ตอบผิด"
          >
            <BookOpen size={18} color="#d4af37" />
            <span style={{ fontSize: '0.85rem' }}>สมุดทบทวน</span>
            {dueReviewsCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: 'var(--accent-lotus)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                {dueReviewsCount}
              </span>
            )}
          </button>

          {/* BGM Music Control Button & Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMusicPanel(!showMusicPanel)}
              className="secondary-button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                border: isBgmActive ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
                background: isBgmActive
                  ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.25), rgba(212, 175, 55, 0.15))'
                  : 'rgba(255, 255, 255, 0.05)',
                boxShadow: isBgmActive ? '0 0 15px rgba(56, 189, 248, 0.3)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title="ดนตรีบรรเลงวน (Looping Background Music)"
            >
              <Music size={17} color={isBgmActive ? '#38bdf8' : 'var(--text-muted)'} />
              <span style={{ fontSize: '0.82rem', color: isBgmActive ? '#e0f2fe' : 'var(--text-muted)', fontWeight: 600 }}>
                {isBgmActive ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>เพลงวน</span>
                    <span className="pulse-active" style={{ fontSize: '0.7rem' }}>▶</span>
                  </span>
                ) : (
                  'เพลงวน (ปิด)'
                )}
              </span>
            </button>

            {/* BGM Quick Control Popover Panel */}
            {showMusicPanel && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  width: '280px',
                  padding: '16px',
                  borderRadius: '14px',
                  border: '1.5px solid #38bdf8',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(56, 189, 248, 0.25)',
                  zIndex: 200,
                  background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.96), rgba(9, 14, 26, 0.98))',
                  animation: 'fadeIn 0.2s ease-out',
                }}
              >
                {/* Panel Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Music2 size={18} color="#38bdf8" />
                    <strong style={{ fontSize: '0.9rem', color: '#38bdf8' }}>ดนตรีบรรเลงวน (BGM)</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMusicPanel(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                {/* Main Play / Pause Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    const newState = audioManager.toggleBGM();
                    setIsBgmActive(newState);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    border: isBgmActive ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.2)',
                    background: isBgmActive
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.2))'
                      : 'rgba(255, 255, 255, 0.05)',
                    color: isBgmActive ? '#6ee7b7' : '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '14px',
                    transition: 'all 0.2s',
                  }}
                >
                  {isBgmActive ? (
                    <>
                      <span>⏸️ พักเพลงบรรเลง</span>
                      <span style={{ fontSize: '0.72rem', color: '#a7f3d0' }}>(กำลังเล่นวน)</span>
                    </>
                  ) : (
                    <>
                      <span>▶️ เริ่มเล่นเพลงบรรเลงวน</span>
                    </>
                  )}
                </button>

                {/* Volume Slider */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>ระดับเสียงดนตรี:</span>
                    <strong style={{ color: '#38bdf8' }}>{Math.round(bgmVol * 100)}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={bgmVol}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setBgmVol(val);
                      audioManager.setBGMVolume(val);
                    }}
                    style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                  />
                </div>

                {/* Track Theme Selector */}
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary-gold)', fontWeight: 700, marginBottom: '6px' }}>
                    เลือกบทเพลงบรรเลงวน (Looping Tracks):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {BGM_THEMES.map((theme) => {
                      const isSelected = bgmTheme === theme.id;
                      return (
                        <div
                          key={theme.id}
                          onClick={() => {
                            setBgmTheme(theme.id);
                            audioManager.setBGMTheme(theme.id);
                            if (!isBgmActive) {
                              setIsBgmActive(true);
                              audioManager.toggleBGM();
                            }
                          }}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: isSelected ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                            background: isSelected ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.15s',
                          }}
                        >
                          <span style={{ fontSize: '1.2rem' }}>{theme.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#38bdf8' : '#fff' }}>
                              {theme.name}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {theme.subtitle}
                            </div>
                          </div>
                          {isSelected && isBgmActive && (
                            <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>♫</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sound Effects Mute Button */}
          <button
            onClick={onToggleMute}
            className="secondary-button"
            style={{ padding: '8px 12px' }}
            title={isMuted ? 'เปิดเสียงเอฟเฟกต์ (SFX)' : 'ปิดเสียงเอฟเฟกต์ (SFX)'}
          >
            {isMuted ? <VolumeX size={18} color="#ef4444" /> : <Volume2 size={18} color="#10b981" />}
          </button>

          <button
            onClick={onRestart}
            className="secondary-button"
            style={{ padding: '8px 12px' }}
            title="เริ่มเกมใหม่"
          >
            <RefreshCw size={18} />
          </button>
        </div>

      </div>
    </header>
  );
};

import React, { useState, useEffect } from 'react';
import { CHARACTERS } from '../data/charactersData';
import type { Character, GameMode } from '../types/game';
import type { UserAccount } from '../types/auth';
import { Play, Users, Bot, LogIn, Sparkles, Trophy, Flame } from 'lucide-react';
import { getLeaderboardAccounts } from '../utils/authService';

export interface PlayerSetupConfig {
  name: string;
  character: Character;
  isAi: boolean;
}

interface Props {
  onStartGame: (playersConfig: PlayerSetupConfig[], mode: GameMode, rounds: number) => void;
  currentUser?: UserAccount | null;
  onOpenAuthModal?: () => void;
  onOpenLeaderboard?: () => void;
}

export const CharacterSelectModal: React.FC<Props> = ({
  onStartGame,
  currentUser,
  onOpenAuthModal,
  onOpenLeaderboard,
}) => {
  const [playType, setPlayType] = useState<'ai' | 'pass_play'>('pass_play');

  const [singlePlayerName, setSinglePlayerName] = useState<string>(
    currentUser ? currentUser.displayName : 'ท่าน (ผู้เล่น 1)'
  );
  const [singleCharId, setSingleCharId] = useState<string>(
    currentUser?.favoriteCharacter || 'monk'
  );
  const [aiCount, setAiCount] = useState<number>(2);

  const [humanPlayerCount, setHumanPlayerCount] = useState<number>(2);
  const [multiplayerConfig, setMultiplayerConfig] = useState<{ name: string; charId: string }[]>([
    { name: currentUser ? currentUser.displayName : 'ผู้เล่น 1', charId: currentUser?.favoriteCharacter || 'monk' },
    { name: 'ผู้เล่น 2', charId: 'novice' },
    { name: 'ผู้เล่น 3', charId: 'teacher' },
    { name: 'ผู้เล่น 4', charId: 'student' },
  ]);

  const [gameMode] = useState<GameMode>('points');
  const [rounds] = useState<number>(20);

  // Sync state if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setSinglePlayerName(currentUser.displayName);
      setSingleCharId(currentUser.favoriteCharacter);
      setMultiplayerConfig((prev) => {
        const updated = [...prev];
        updated[0] = { name: currentUser.displayName, charId: currentUser.favoriteCharacter };
        return updated;
      });
    }
  }, [currentUser]);

  const handleMultiNameChange = (index: number, name: string) => {
    const updated = [...multiplayerConfig];
    updated[index].name = name;
    setMultiplayerConfig(updated);
  };

  const handleMultiCharChange = (index: number, charId: string) => {
    const updated = [...multiplayerConfig];
    updated[index].charId = charId;
    setMultiplayerConfig(updated);
  };

  const handleStart = () => {
    const setupConfigs: PlayerSetupConfig[] = [];

    if (playType === 'ai') {
      const char = CHARACTERS.find((c) => c.id === singleCharId) || CHARACTERS[0];
      setupConfigs.push({
        name: singlePlayerName || (currentUser ? currentUser.displayName : 'ผู้เล่น 1'),
        character: char,
        isAi: false,
      });

      const aiNames = ['พระอาจารย์ AI', 'ศิษย์พี่ AI', 'มหา AI'];
      const aiChars = [CHARACTERS[1], CHARACTERS[2], CHARACTERS[3]];
      for (let i = 0; i < aiCount; i++) {
        setupConfigs.push({
          name: aiNames[i],
          character: aiChars[i % aiChars.length],
          isAi: true,
        });
      }
    } else {
      for (let i = 0; i < humanPlayerCount; i++) {
        const conf = multiplayerConfig[i];
        const char = CHARACTERS.find((c) => c.id === conf.charId) || CHARACTERS[i % CHARACTERS.length];
        setupConfigs.push({
          name: conf.name || `ผู้เล่น ${i + 1}`,
          character: char,
          isAi: false,
        });
      }
    }

    onStartGame(setupConfigs, gameMode, rounds);
  };

  const topStreaks = getLeaderboardAccounts('streak').slice(0, 3);

  return (
    <div className="modal-overlay">
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          border: '2px solid var(--primary-gold)',
          boxShadow: '0 0 40px rgba(212,175,55,0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '2.5rem' }}>🎲</span>
          <h1 className="gold-gradient-text" style={{ fontSize: '1.8rem', margin: '4px 0' }}>
            บาลีส่วนฐี (Pali Tycoon)
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            ตั้งค่าผู้เล่นและเลือกโหมดเพื่อเริ่มการแข่งขันกระดานบาลี
          </p>
        </div>

        {/* User Account Status Banner */}
        {currentUser ? (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(16, 25, 50, 0.6))',
              border: '1px solid var(--primary-gold)',
              borderRadius: '12px',
              padding: '10px 16px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.6rem' }}>{currentUser.avatar}</span>
              <div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
                  เข้าสู่ระบบในชื่อ: <span style={{ color: 'var(--primary-gold)' }}>{currentUser.displayName}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>
                  Lv.{currentUser.level} • {currentUser.rankTitle} {currentUser.stats?.currentWinStreak ? `(🔥 ชนะ ${currentUser.stats.currentWinStreak} ตาติด)` : ''}
                </div>
              </div>
            </div>

            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                สลับบัญชี
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px dashed rgba(212, 175, 55, 0.4)',
              borderRadius: '12px',
              padding: '10px 16px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <Sparkles size={16} color="var(--primary-gold)" />
              <span>ต้องการบันทึกเลเวล สถิติ และคำศัพท์ไว้ตลอดไปไหม?</span>
            </div>

            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="gold-button"
                style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '4px' }}
              >
                <LogIn size={14} />
                เข้าสู่ระบบ / สมัคร
              </button>
            )}
          </div>
        )}

        {/* Top 3 Win Streak Leaderboard Preview Banner in Lobby */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(245, 158, 11, 0.15), rgba(16, 25, 50, 0.8))',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '14px',
            padding: '12px 16px',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trophy size={18} color="var(--primary-gold)" />
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>
                ทำเนียบผู้ชนะต่อเนื่องสูงสุด 🔥
              </span>
            </div>
            {onOpenLeaderboard && (
              <button
                onClick={onOpenLeaderboard}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  color: 'var(--primary-gold)',
                  borderRadius: '6px',
                  padding: '3px 10px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Trophy size={12} />
                ดูอันดับทั้งหมด
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {topStreaks.map((acc, idx) => (
              <div
                key={acc.id}
                onClick={onOpenLeaderboard}
                style={{
                  background: 'rgba(0,0,0,0.35)',
                  border: idx === 0 ? '1px solid var(--primary-gold)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
              >
                <div style={{ fontSize: '1.4rem' }}>{acc.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: idx === 0 ? 'var(--primary-gold)' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {idx === 0 ? '👑 ' : idx === 1 ? '🥈 ' : '🥉 '}
                    {acc.displayName}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#fca5a5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Flame size={10} color="#ef4444" />
                    <span>ชนะ {acc.stats?.currentWinStreak || 0} ตาติด</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setPlayType('pass_play')}
            style={{
              padding: '12px',
              borderRadius: '10px',
              border: `2px solid ${playType === 'pass_play' ? 'var(--primary-gold)' : 'rgba(255,255,255,0.1)'}`,
              background: playType === 'pass_play' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.03)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Users size={18} />
            เล่นหลายคน (Pass & Play)
          </button>

          <button
            onClick={() => setPlayType('ai')}
            style={{
              padding: '12px',
              borderRadius: '10px',
              border: `2px solid ${playType === 'ai' ? 'var(--primary-gold)' : 'rgba(255,255,255,0.1)'}`,
              background: playType === 'ai' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.03)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Bot size={18} />
            เล่นคนเดียว (สู้กับ AI)
          </button>
        </div>

        {playType === 'pass_play' ? (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                จำนวนผู้เล่น:
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[2, 3, 4].map((count) => (
                  <button
                    key={count}
                    onClick={() => setHumanPlayerCount(count)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: `1px solid ${humanPlayerCount === count ? 'var(--primary-gold)' : 'rgba(255,255,255,0.1)'}`,
                      background: humanPlayerCount === count ? 'var(--primary-gold)' : 'rgba(255,255,255,0.05)',
                      color: humanPlayerCount === count ? '#090e1a' : '#fff',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {count} คน
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {Array.from({ length: humanPlayerCount }).map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        ชื่อผู้เล่น {idx + 1}:
                      </label>
                      <input
                        type="text"
                        value={multiplayerConfig[idx].name}
                        onChange={(e) => handleMultiNameChange(idx, e.target.value)}
                        placeholder={`ผู้เล่น ${idx + 1}`}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '8px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      เลือกตัวละคร:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      {CHARACTERS.map((char) => (
                        <div
                          key={char.id}
                          onClick={() => handleMultiCharChange(idx, char.id)}
                          style={{
                            padding: '6px 4px',
                            borderRadius: '8px',
                            border: `1.5px solid ${multiplayerConfig[idx].charId === char.id ? 'var(--primary-gold)' : 'rgba(255,255,255,0.08)'}`,
                            background: multiplayerConfig[idx].charId === char.id ? 'rgba(212, 175, 55, 0.25)' : 'rgba(0,0,0,0.2)',
                            cursor: 'pointer',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                          }}
                        >
                          {char.avatarImage ? (
                            <img
                              src={char.avatarImage}
                              alt={char.name}
                              style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', marginBottom: '4px' }}
                            />
                          ) : (
                            <div style={{ fontSize: '1.4rem' }}>{char.avatar}</div>
                          )}
                          <div style={{ fontSize: '0.68rem', color: '#fff' }}>{char.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                ชื่อของคุณ:
              </label>
              <input
                type="text"
                value={singlePlayerName}
                onChange={(e) => setSinglePlayerName(e.target.value)}
                placeholder="ระบุชื่อของคุณ"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  marginBottom: '12px',
                }}
              />

              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                เลือกตัวละครของคุณ:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {CHARACTERS.map((char) => (
                  <div
                    key={char.id}
                    onClick={() => setSingleCharId(char.id)}
                    style={{
                      padding: '10px 6px',
                      borderRadius: '10px',
                      border: `2px solid ${singleCharId === char.id ? 'var(--primary-gold)' : 'rgba(255,255,255,0.08)'}`,
                      background: singleCharId === char.id ? 'rgba(212, 175, 55, 0.25)' : 'rgba(0,0,0,0.3)',
                      boxShadow: singleCharId === char.id ? '0 0 16px rgba(212, 175, 55, 0.45)' : 'none',
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    {char.avatarImage ? (
                      <img
                        src={char.avatarImage}
                        alt={char.name}
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: `2px solid ${singleCharId === char.id ? 'var(--primary-gold)' : 'rgba(255,255,255,0.2)'}`,
                          marginBottom: '6px',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: '1.8rem' }}>{char.avatar}</div>
                    )}
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: singleCharId === char.id ? 'var(--primary-gold)' : '#fff' }}>{char.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>{char.skillName}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                จำนวน AI คู่แข่ง:
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[1, 2, 3].map((count) => (
                  <button
                    key={count}
                    onClick={() => setAiCount(count)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: `1px solid ${aiCount === count ? 'var(--primary-gold)' : 'rgba(255,255,255,0.1)'}`,
                      background: aiCount === count ? 'var(--primary-gold)' : 'rgba(255,255,255,0.05)',
                      color: aiCount === count ? '#090e1a' : '#fff',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {count} ตัว
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleStart}
          className="gold-button"
          style={{ width: '100%', padding: '14px', fontSize: '1.1rem', justifyContent: 'center' }}
        >
          <Play size={20} />
          เริ่มการแข่งขันบาลี
        </button>
      </div>
    </div>
  );
};

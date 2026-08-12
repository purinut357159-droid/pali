import React, { useState, useEffect } from 'react';
import { CHARACTERS } from '../data/charactersData';
import type { Character, GameMode } from '../types/game';
import type { UserAccount } from '../types/auth';
import { Play, Users, Bot, LogIn, Sparkles } from 'lucide-react';

export interface PlayerSetupConfig {
  name: string;
  character: Character;
  isAi: boolean;
}

interface Props {
  onStartGame: (playersConfig: PlayerSetupConfig[], mode: GameMode, rounds: number) => void;
  currentUser?: UserAccount | null;
  onOpenAuthModal?: () => void;
}

export const CharacterSelectModal: React.FC<Props> = ({
  onStartGame,
  currentUser,
  onOpenAuthModal,
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
              marginBottom: '18px',
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
                  Lv.{currentUser.level} • {currentUser.rankTitle} (ผลการเล่นจะถูกบันทึกเข้าบัญชีนี้)
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
              marginBottom: '18px',
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
            <Users size={18} color="var(--primary-gold)" />
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
            <Bot size={18} color="#3b82f6" />
            เล่นคนเดียว (สู้กับ AI)
          </button>
        </div>

        {playType === 'pass_play' ? (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--primary-gold)', marginBottom: '10px' }}>
              👥 จำนวนผู้เล่น (2 - 4 คน):
            </h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => setHumanPlayerCount(count)}
                  className="secondary-button"
                  style={{
                    flex: 1,
                    background: humanPlayerCount === count ? 'var(--primary-gold)' : 'rgba(255,255,255,0.05)',
                    color: humanPlayerCount === count ? '#000' : '#fff',
                    fontWeight: 700,
                  }}
                >
                  {count} คน
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Array.from({ length: humanPlayerCount }).map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    ชื่อผู้เล่นคนที่ {idx + 1}:
                    {idx === 0 && currentUser && (
                      <span style={{ color: 'var(--primary-gold)', marginLeft: '6px' }}>
                        (บัญชีของคุณ: {currentUser.displayName})
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={multiplayerConfig[idx].name}
                    onChange={(e) => handleMultiNameChange(idx, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      marginBottom: '10px',
                    }}
                  />

                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    เลือกอาชีพ:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {CHARACTERS.map((char) => (
                      <button
                        key={char.id}
                        onClick={() => handleMultiCharChange(idx, char.id)}
                        style={{
                          padding: '6px',
                          borderRadius: '6px',
                          border: `1px solid ${multiplayerConfig[idx].charId === char.id ? 'var(--primary-gold)' : 'rgba(255,255,255,0.1)'}`,
                          background: multiplayerConfig[idx].charId === char.id ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.03)',
                          color: '#fff',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '1.2rem' }}>{char.avatar}</div>
                        <div style={{ fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {char.name.split(' ')[0]}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                ชื่อของคุณ:
                {currentUser && (
                  <span style={{ color: 'var(--primary-gold)', marginLeft: '6px' }}>
                    (บัญชีของคุณ: {currentUser.displayName})
                  </span>
                )}
              </label>
              <input
                type="text"
                value={singlePlayerName}
                onChange={(e) => setSinglePlayerName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                จำนวน AI คู่แข่ง (1 - 3 ตัว):
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[1, 2, 3].map((count) => (
                  <button
                    key={count}
                    onClick={() => setAiCount(count)}
                    className="secondary-button"
                    style={{
                      flex: 1,
                      background: aiCount === count ? 'var(--primary-gold)' : 'rgba(255,255,255,0.05)',
                      color: aiCount === count ? '#000' : '#fff',
                      fontWeight: 700,
                    }}
                  >
                    {count} ตัว
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                เลือกอาชีพของคุณ:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {CHARACTERS.map((char) => (
                  <div
                    key={char.id}
                    onClick={() => setSingleCharId(char.id)}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: `2px solid ${singleCharId === char.id ? 'var(--primary-gold)' : 'rgba(255,255,255,0.1)'}`,
                      background: singleCharId === char.id ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1.4rem' }}>{char.avatar}</span>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--primary-gold)' }}>{char.name}</strong>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                      {char.skillDescription}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            onClick={handleStart}
            className="gold-button pulse-active"
            style={{ width: '100%', padding: '14px', justifyContent: 'center', fontSize: '1.1rem' }}
          >
            <Play size={20} />
            เริ่มเข้าสู่กระดานบาลีส่วนฐี
          </button>
        </div>
      </div>
    </div>
  );
};

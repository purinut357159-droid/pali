import React, { useState, useEffect } from 'react';
import { CHARACTERS } from '../data/charactersData';
import type { Character, GameMode } from '../types/game';
import type { UserAccount } from '../types/auth';
import { Play, Users, Bot, Sparkles, Globe, UserPlus } from 'lucide-react';

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
  onOpenOnlineLobby?: () => void;
  onOpenFriends?: () => void;
}

export const CharacterSelectModal: React.FC<Props> = ({
  onStartGame,
  currentUser,
  onOpenAuthModal,
  onOpenOnlineLobby,
  onOpenFriends,
}) => {
  const [playType, setPlayType] = useState<'ai' | 'pass_play'>('ai');

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
          maxWidth: '540px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '18px 20px',
          border: '2px solid var(--primary-gold)',
          boxShadow: '0 0 40px rgba(212,175,55,0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', lineHeight: 1 }}>🎲</div>
          <h1 className="gold-gradient-text" style={{ fontSize: '1.4rem', margin: '2px 0 0 0', fontWeight: 800 }}>
            บาลีส่วนฐี (Pali Tycoon)
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            เกมกระดานพิชิตวิชาบาลี ๔๐ หมวด
          </p>
        </div>

        {/* User Account Bar */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: currentUser
              ? ((currentUser.isDeveloper || currentUser.role === 'developer') ? '1px solid #38bdf8' : '1px solid rgba(212, 175, 55, 0.4)')
              : '1px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              <span style={{ fontSize: '1.2rem' }}>{currentUser.avatar}</span>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: (currentUser.isDeveloper || currentUser.role === 'developer') ? '#38bdf8' : 'var(--primary-gold)' }}>
                  {currentUser.displayName}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                  Lv.{currentUser.level} ({currentUser.rankTitle})
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <Sparkles size={13} color="var(--primary-gold)" />
              <span>โหมดผู้เยี่ยมชม (Guest)</span>
            </div>
          )}

          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              style={{
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid var(--primary-gold)',
                color: 'var(--primary-gold)',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {currentUser ? 'สลับบัญชี' : 'เข้าสู่ระบบ'}
            </button>
          )}
        </div>

        {/* Online & Friends Feature Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {onOpenOnlineLobby && (
            <button
              onClick={onOpenOnlineLobby}
              className="gold-button"
              style={{
                padding: '8px 12px',
                fontSize: '0.82rem',
                justifyContent: 'center',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                color: '#fff',
                boxShadow: '0 4px 15px rgba(2, 132, 199, 0.4)',
              }}
            >
              <Globe size={16} />
              <span>🌐 เล่นออนไลน์กับเพื่อน</span>
            </button>
          )}

          {onOpenFriends && (
            <button
              onClick={onOpenFriends}
              className="secondary-button"
              style={{
                padding: '8px 12px',
                fontSize: '0.82rem',
                justifyContent: 'center',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: 'rgba(56, 189, 248, 0.4)',
              }}
            >
              <UserPlus size={16} color="#38bdf8" />
              <span>👥 ระบบแอดเพื่อน</span>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>หรือเล่นในเครื่องนี้</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
        </div>

        {/* Play Mode Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={() => setPlayType('ai')}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              border: `2px solid ${playType === 'ai' ? 'var(--primary-gold)' : 'rgba(255,255,255,0.1)'}`,
              background: playType === 'ai' ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255,255,255,0.03)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Bot size={15} color={playType === 'ai' ? 'var(--primary-gold)' : '#a0aec0'} />
            <span>สู้กับ AI (Single Player)</span>
          </button>

          <button
            onClick={() => setPlayType('pass_play')}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              border: `2px solid ${playType === 'pass_play' ? 'var(--primary-gold)' : 'rgba(255,255,255,0.1)'}`,
              background: playType === 'pass_play' ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255,255,255,0.03)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Users size={15} color={playType === 'pass_play' ? 'var(--primary-gold)' : '#a0aec0'} />
            <span>เล่นหลายคน (Pass & Play)</span>
          </button>
        </div>

        {/* Content per mode */}
        {playType === 'ai' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Player Name Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                ชื่อของคุณ:
              </label>
              <input
                type="text"
                value={singlePlayerName}
                onChange={(e) => setSinglePlayerName(e.target.value)}
                placeholder="ระบุชื่อของคุณ"
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            {/* Character Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                เลือกตัวละครของคุณ:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {CHARACTERS.map((char) => {
                  const isSelected = singleCharId === char.id;
                  return (
                    <div
                      key={char.id}
                      onClick={() => setSingleCharId(char.id)}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '8px',
                        border: `2px solid ${isSelected ? 'var(--primary-gold)' : 'rgba(255,255,255,0.08)'}`,
                        background: isSelected ? 'rgba(212, 175, 55, 0.25)' : 'rgba(0,0,0,0.25)',
                        boxShadow: isSelected ? '0 0 10px rgba(212, 175, 55, 0.4)' : 'none',
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
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: `1.5px solid ${isSelected ? 'var(--primary-gold)' : 'rgba(255,255,255,0.2)'}`,
                            marginBottom: '3px',
                          }}
                        />
                      ) : (
                        <div style={{ fontSize: '1.4rem' }}>{char.avatar}</div>
                      )}
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isSelected ? 'var(--primary-gold)' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                        {char.name}
                      </div>
                      <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                        {char.skillName}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Opponent Count */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                จำนวน AI คู่แข่ง:
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 3].map((count) => (
                  <button
                    key={count}
                    onClick={() => setAiCount(count)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '6px',
                      border: `1px solid ${aiCount === count ? 'var(--primary-gold)' : 'rgba(255,255,255,0.1)'}`,
                      background: aiCount === count ? 'var(--primary-gold)' : 'rgba(255,255,255,0.05)',
                      color: aiCount === count ? '#090e1a' : '#fff',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                    }}
                  >
                    {count} ตัว
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Player Count Select */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                จำนวนผู้เล่น:
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[2, 3, 4].map((count) => (
                  <button
                    key={count}
                    onClick={() => setHumanPlayerCount(count)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '6px',
                      border: `1px solid ${humanPlayerCount === count ? 'var(--primary-gold)' : 'rgba(255,255,255,0.1)'}`,
                      background: humanPlayerCount === count ? 'var(--primary-gold)' : 'rgba(255,255,255,0.05)',
                      color: humanPlayerCount === count ? '#090e1a' : '#fff',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                    }}
                  >
                    {count} คน
                  </button>
                ))}
              </div>
            </div>

            {/* Players List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Array.from({ length: humanPlayerCount }).map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <input
                    type="text"
                    value={multiplayerConfig[idx].name}
                    onChange={(e) => handleMultiNameChange(idx, e.target.value)}
                    placeholder={`ผู้เล่น ${idx + 1}`}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      borderRadius: '6px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: '0.78rem',
                    }}
                  />

                  {/* Character Pick Mini Avatars */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {CHARACTERS.map((char) => {
                      const isSelected = multiplayerConfig[idx].charId === char.id;
                      return (
                        <div
                          key={char.id}
                          onClick={() => handleMultiCharChange(idx, char.id)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? 'var(--primary-gold)' : 'transparent'}`,
                            background: isSelected ? 'rgba(212, 175, 55, 0.3)' : 'rgba(0,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            overflow: 'hidden',
                          }}
                          title={char.name}
                        >
                          {char.avatarImage ? (
                            <img src={char.avatarImage} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '0.9rem' }}>{char.avatar}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Start Game Button */}
        <button
          onClick={handleStart}
          className="gold-button"
          style={{ width: '100%', padding: '11px', fontSize: '0.95rem', justifyContent: 'center', marginTop: '4px', fontWeight: 800 }}
        >
          <Play size={17} />
          เริ่มการแข่งขัน (Start Game)
        </button>
      </div>
    </div>
  );
};

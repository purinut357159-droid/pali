import React, { useState } from 'react';
import { CHARACTERS } from '../data/charactersData';
import type { Character, GameMode } from '../types/game';
import { Play, Users, Bot } from 'lucide-react';

export interface PlayerSetupConfig {
  name: string;
  character: Character;
  isAi: boolean;
}

interface Props {
  onStartGame: (playersConfig: PlayerSetupConfig[], mode: GameMode, rounds: number) => void;
}

export const CharacterSelectModal: React.FC<Props> = ({ onStartGame }) => {
  const [playType, setPlayType] = useState<'ai' | 'pass_play'>('pass_play');
  
  // Single Player (vs AI) setup
  const [singlePlayerName, setSinglePlayerName] = useState<string>('ท่าน (ผู้เล่น 1)');
  const [singleCharId, setSingleCharId] = useState<string>('monk');
  const [aiCount, setAiCount] = useState<number>(2);

  // Multiplayer (Pass & Play) setup for 2-4 human players
  const [humanPlayerCount, setHumanPlayerCount] = useState<number>(2);
  const [multiplayerConfig, setMultiplayerConfig] = useState<{ name: string; charId: string }[]>([
    { name: 'ผู้เล่น 1', charId: 'monk' },
    { name: 'ผู้เล่น 2', charId: 'novice' },
    { name: 'ผู้เล่น 3', charId: 'teacher' },
    { name: 'ผู้เล่น 4', charId: 'student' },
  ]);

  const [gameMode, setGameMode] = useState<GameMode>('points');
  const [rounds] = useState<number>(20);

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
        name: singlePlayerName || 'ผู้เล่น 1',
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
      // Pass & Play mode
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
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '2.5rem' }}>🎲</span>
          <h1 className="gold-gradient-text" style={{ fontSize: '1.8rem', margin: '4px 0' }}>
            บาลีเศรษฐี (Pali Tycoon)
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            ตั้งค่าผู้เล่นและเลือกโหมดเพื่อเริ่มการแข่งขันกระดานบาลี
          </p>
        </div>

        {/* Play Type Selector Tab */}
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
              fontSize: '0.95rem',
            }}
          >
            <Users size={20} color="var(--primary-gold)" />
            👥 เล่นหลายคน (Pass & Play)
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
              fontSize: '0.95rem',
            }}
          >
            <Bot size={20} color="#3b82f6" />
            🤖 เล่นคนเดียว แข่งกับ AI
          </button>
        </div>

        {/* Multiplayer Pass & Play Config */}
        {playType === 'pass_play' ? (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              👥 จำนวนผู้เล่น (2 - 4 คน):
            </label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              {[2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setHumanPlayerCount(num)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: `1px solid ${humanPlayerCount === num ? 'var(--primary-gold)' : 'rgba(255,255,255,0.1)'}`,
                    background: humanPlayerCount === num ? 'var(--primary-gold)' : 'rgba(255,255,255,0.05)',
                    color: humanPlayerCount === num ? '#000' : '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {num} คน
                </button>
              ))}
            </div>

            {/* Individual Human Player Card Customizers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Array.from({ length: humanPlayerCount }).map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    padding: '12px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-gold)', minWidth: '80px' }}>
                      ผู้เล่น #{idx + 1}:
                    </span>
                    <input
                      type="text"
                      value={multiplayerConfig[idx].name}
                      onChange={(e) => handleMultiNameChange(idx, e.target.value)}
                      placeholder={`ชื่อผู้เล่น ${idx + 1}`}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: 'rgba(20, 30, 60, 0.9)',
                        border: '1px solid var(--border-gold)',
                        color: '#fff',
                        fontSize: '0.85rem',
                      }}
                    />
                    <select
                      value={multiplayerConfig[idx].charId}
                      onChange={(e) => handleMultiCharChange(idx, e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: 'rgba(20, 30, 60, 0.9)',
                        border: '1px solid var(--border-gold)',
                        color: '#fff',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      {CHARACTERS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.avatar} {c.name} ({c.skillName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Single Player Config */
          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                👤 ชื่อของคุณ:
              </label>
              <input
                type="text"
                value={singlePlayerName}
                onChange={(e) => setSinglePlayerName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(20, 30, 60, 0.9)',
                  border: '1px solid var(--border-gold)',
                  color: '#fff',
                }}
              />
            </div>

            <h3 style={{ fontSize: '0.85rem', color: 'var(--primary-gold)', marginBottom: '8px' }}>
              เลือกตัวละครของคุณ:
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '16px' }}>
              {CHARACTERS.map((char) => {
                const isSelected = char.id === singleCharId;
                return (
                  <div
                    key={char.id}
                    onClick={() => setSingleCharId(char.id)}
                    style={{
                      background: isSelected ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.03)',
                      border: `2px solid ${isSelected ? 'var(--primary-gold)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '10px',
                      padding: '10px',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '1.8rem' }}>{char.avatar}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{char.name}</div>
                  </div>
                );
              })}
            </div>

            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              🤖 จำนวน AI คู่แข่ง:
            </label>
            <select
              value={aiCount}
              onChange={(e) => setAiCount(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: 'rgba(20, 30, 60, 0.9)',
                border: '1px solid var(--border-gold)',
                color: '#fff',
                fontWeight: 600,
              }}
            >
              <option value={1}>1 คน (ดวล 1v1)</option>
              <option value={2}>2 คน (รวมเป็น 3 คน)</option>
              <option value={3}>3 คน (รวมเป็น 4 คน)</option>
            </select>
          </div>
        )}

        {/* Win Mode Selector */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            🏆 โหมดชัยชนะ:
          </label>
          <select
            value={gameMode}
            onChange={(e) => setGameMode(e.target.value as GameMode)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              background: 'rgba(20, 30, 60, 0.9)',
              border: '1px solid var(--border-gold)',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            <option value="points">โหมดคะแนน (ครบ {rounds} รอบ)</option>
            <option value="monopoly">โหมดครอบครองวิชามากสุด</option>
            <option value="last_standing">โหมดเหลือผู้เล่นคนสุดท้าย</option>
          </select>
        </div>

        {/* Start Game Button */}
        <button
          onClick={handleStart}
          className="gold-button pulse-active"
          style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1.1rem' }}
        >
          <Play size={22} />
          เริ่มเกมบาลีเศรษฐี
        </button>
      </div>
    </div>
  );
};

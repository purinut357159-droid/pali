import React, { useState } from 'react';
import { CHARACTERS } from '../data/charactersData';
import type { Character, GameMode } from '../types/game';
import { Play } from 'lucide-react';

interface Props {
  onStartGame: (selectedCharacter: Character, aiCount: number, mode: GameMode, rounds: number) => void;
}

export const CharacterSelectModal: React.FC<Props> = ({ onStartGame }) => {
  const [selectedCharId, setSelectedCharId] = useState<string>('monk');
  const [aiCount, setAiCount] = useState<number>(2);
  const [gameMode, setGameMode] = useState<GameMode>('points');
  const [rounds] = useState<number>(20);

  const selectedCharacter = CHARACTERS.find((c) => c.id === selectedCharId) || CHARACTERS[0];

  const handleStart = () => {
    onStartGame(selectedCharacter, aiCount, gameMode, rounds);
  };

  return (
    <div className="modal-overlay">
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '620px',
          padding: '28px',
          border: '2px solid var(--primary-gold)',
          boxShadow: '0 0 40px rgba(212,175,55,0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '2.5rem' }}>🎲</span>
          <h1 className="gold-gradient-text" style={{ fontSize: '1.8rem', margin: '4px 0' }}>
            บาลีเศรษฐี (Pali Tycoon)
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            เลือกตัวละครและตั้งค่าโหมดการเล่นเพื่อเริ่มการแข่งขัน
          </p>
        </div>

        <h3 style={{ fontSize: '0.95rem', color: 'var(--primary-gold)', marginBottom: '10px' }}>
          👤 เลือกตัวละครผู้เล่น (Select Character)
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          {CHARACTERS.map((char) => {
            const isSelected = char.id === selectedCharId;
            return (
              <div
                key={char.id}
                onClick={() => setSelectedCharId(char.id)}
                style={{
                  background: isSelected ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.03)',
                  border: `2px solid ${isSelected ? 'var(--primary-gold)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '12px',
                  padding: '12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: '2.2rem', marginBottom: '4px' }}>{char.avatar}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{char.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--primary-gold)', marginTop: '2px' }}>
                  {char.skillName}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px dashed var(--border-gold)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '20px',
            fontSize: '0.8rem',
          }}
        >
          <strong style={{ color: 'var(--accent-gold)' }}>✨ สกิลประจำตัว: {selectedCharacter.skillName}</strong>
          <p style={{ color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{selectedCharacter.skillDescription}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div>
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

          <div>
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
        </div>

        <button
          onClick={handleStart}
          className="gold-button pulse-active"
          style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1.1rem' }}
        >
          <Play size={22} />
          เข้าสู่สนามกระดานบาลีเศรษฐี
        </button>
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import type { Player } from '../types/game';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface Props {
  winner: Player;
  players: Player[];
  onRestart: () => void;
}

export const WinnerModal: React.FC<Props> = ({ winner, players, onRestart }) => {
  useEffect(() => {
    audioManager.playSathuChime();
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore if confetti fails
    }
  }, []);

  const sortedPlayers = [...players].sort((a, b) => b.wisdomPoints - a.wisdomPoints);

  return (
    <div className="modal-overlay">
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '500px',
          padding: '32px',
          textAlign: 'center',
          border: '3px solid var(--primary-gold)',
          boxShadow: '0 0 50px rgba(212, 175, 55, 0.5)',
        }}
      >
        <Trophy size={64} color="var(--primary-gold)" style={{ filter: 'drop-shadow(0 0 15px #d4af37)' }} />

        <h1 className="gold-gradient-text" style={{ fontSize: '2rem', margin: '12px 0 4px 0' }}>
          มหาเปรียญผู้พิชิต!
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
          ขออนุโมทนาบุญและขอแสดงความยินดีกับผู้ชนะ
        </p>

        <div
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(16, 25, 50, 0.8))',
            border: '2px solid var(--primary-gold)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <div style={{ fontSize: '2.5rem' }}>{winner.character.avatar}</div>
          <h2 style={{ fontSize: '1.4rem', color: winner.color, margin: '6px 0 2px 0' }}>
            {winner.name}
          </h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent-gold)' }}>
            💡 แต้มปัญญารวม: {winner.wisdomPoints.toLocaleString()} แต้ม
          </div>
        </div>

        <h3 style={{ fontSize: '0.95rem', color: 'var(--primary-gold)', marginBottom: '10px', textAlign: 'left' }}>
          📊 อันดับตารางคะแนนสุดท้าย (Final Leaderboard)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {sortedPlayers.map((p, idx) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                background: idx === 0 ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.03)',
                border: idx === 0 ? '1px solid var(--primary-gold)' : 'none',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ color: idx === 0 ? 'var(--primary-gold)' : 'var(--text-muted)' }}>
                  #{idx + 1}
                </strong>
                <span>{p.character.avatar}</span>
                <span style={{ color: p.color, fontWeight: 600 }}>{p.name}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>ตอบถูก: {p.stats.correctAnswers} ข้อ</span>
                <strong style={{ color: 'var(--accent-gold)' }}>💡 {p.wisdomPoints}</strong>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onRestart} className="gold-button pulse-active" style={{ width: '100%', justifyContent: 'center' }}>
          <RefreshCw size={20} />
          เล่นเกมใหม่อีกครั้ง
        </button>
      </div>
    </div>
  );
};

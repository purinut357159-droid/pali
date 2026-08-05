import React from 'react';
import type { CardEffect, Player } from '../types/game';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface Props {
  card: CardEffect;
  player: Player;
  onClose: () => void;
}

export const EventModal: React.FC<Props> = ({ card, onClose }) => {
  const isBoon = card.type === 'boon';

  React.useEffect(() => {
    if (isBoon) {
      audioManager.playSathuChime();
    } else {
      audioManager.playTempleBell();
    }
  }, [isBoon]);

  return (
    <div className="modal-overlay">
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '24px',
          textAlign: 'center',
          border: `2px solid ${isBoon ? '#10b981' : '#ef4444'}`,
          boxShadow: `0 0 30px ${isBoon ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          {isBoon ? (
            <Sparkles size={56} color="#10b981" style={{ filter: 'drop-shadow(0 0 10px #10b981)' }} />
          ) : (
            <AlertTriangle size={56} color="#ef4444" style={{ filter: 'drop-shadow(0 0 10px #ef4444)' }} />
          )}
        </div>

        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: isBoon ? '#10b981' : '#ef4444',
            background: isBoon ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            padding: '4px 12px',
            borderRadius: '12px',
          }}
        >
          {isBoon ? '🪷 ไพ่บุญ (Boon Card)' : '⚠️ ไพ่กรรม (Karma Card)'}
        </span>

        <h2 style={{ fontSize: '1.4rem', margin: '12px 0 8px 0', color: '#ffffff' }}>
          {card.title}
        </h2>

        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>
          {card.description}
        </p>

        <div
          style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '10px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '0.9rem',
            fontWeight: 700,
            color: isBoon ? '#4ade80' : '#f87171',
          }}
        >
          {card.wisdomDelta !== undefined && (
            <div>แต้มปัญญา: {card.wisdomDelta > 0 ? `+${card.wisdomDelta}` : card.wisdomDelta} แต้ม</div>
          )}
          {card.moveDelta !== undefined && (
            <div>การเดิน: {card.moveDelta > 0 ? `เดินหน้า +${card.moveDelta} ช่อง` : `ถอยหลัง ${card.moveDelta} ช่อง`}</div>
          )}
          {card.giveFreeAnswerCard && <div>ได้รับ: ไพ่ตอบฟรี 1 ใบ! 🎫</div>}
          {card.skipNextTurn && <div>ผลกระทบ: ข้ามการเล่น 1 ตา ⏳</div>}
        </div>

        <button onClick={onClose} className="gold-button" style={{ width: '100%', justifyContent: 'center' }}>
          รับทราบผล
        </button>
      </div>
    </div>
  );
};

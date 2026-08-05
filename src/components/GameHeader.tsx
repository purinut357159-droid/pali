import React from 'react';
import { Volume2, VolumeX, BookOpen, RefreshCw } from 'lucide-react';
import type { GameState } from '../types/game';

interface Props {
  gameState: GameState;
  onOpenNotebook: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
}

export const GameHeader: React.FC<Props> = ({
  gameState,
  onOpenNotebook,
  onRestart,
  onToggleMute,
  isMuted,
}) => {
  const currentTurnPlayer = gameState.players[gameState.currentTurnPlayerIndex];
  const dueReviewsCount = gameState.reviewItems.filter((i) => !i.mastered).length;

  return (
    <header className="glass-panel" style={{ padding: '12px 20px', marginBottom: '16px' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.05)', padding: '6px 16px', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.2)' }}>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

          <button
            onClick={onToggleMute}
            className="secondary-button"
            style={{ padding: '8px 12px' }}
            title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
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

import React from 'react';
import { Volume2, VolumeX, BookOpen, RefreshCw, LogIn } from 'lucide-react';
import type { GameState } from '../types/game';
import type { UserAccount } from '../types/auth';

interface Props {
  gameState: GameState;
  currentUser: UserAccount | null;
  onOpenNotebook: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  onOpenAuthModal: () => void;
  onOpenProfileModal: () => void;
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
                border: '1px solid var(--primary-gold)',
                background: 'rgba(212, 175, 55, 0.15)',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title="เปิดหน้าโปรไฟล์และสถิติ"
            >
              <span style={{ fontSize: '1.2rem' }}>{currentUser.avatar}</span>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-gold)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{currentUser.displayName}</span>
                  <span style={{ fontSize: '0.65rem', background: 'var(--primary-gold)', color: '#090e1a', padding: '1px 5px', borderRadius: '8px', fontWeight: 800 }}>
                    Lv.{currentUser.level}
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {currentUser.rankTitle}
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

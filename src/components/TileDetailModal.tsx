import React from 'react';
import type { BoardTile, Player } from '../types/game';
import { X, ArrowUpCircle, ShoppingBag } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface Props {
  tile: BoardTile;
  owner?: Player;
  currentPlayer: Player;
  onClose: () => void;
  onUpgrade?: (tile: BoardTile) => void;
  onBuy?: (tile: BoardTile) => void;
  isCurrentPlayerOnTile?: boolean;
}

export const TileDetailModal: React.FC<Props> = ({
  tile,
  owner,
  currentPlayer,
  onClose,
  onUpgrade,
  onBuy,
  isCurrentPlayerOnTile,
}) => {
  const upgradeNames = ['ตำรา (Base)', 'ห้องเรียน', 'สำนักเรียน', 'สนามสอบ', 'มหาวิทยาลัยบาลี'];

  const canUpgrade =
    isCurrentPlayerOnTile &&
    owner?.id === currentPlayer.id &&
    tile.upgradeLevel !== undefined &&
    tile.upgradeLevel < 4 &&
    tile.upgradeCost &&
    currentPlayer.wisdomPoints >= tile.upgradeCost;

  const canBuy =
    isCurrentPlayerOnTile &&
    !owner &&
    tile.type === 'subject' &&
    tile.price &&
    currentPlayer.wisdomPoints >= tile.price;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '24px',
          border: `2px solid ${tile.color || 'var(--primary-gold)'}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.8rem' }}>{tile.icon}</span>
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0, color: tile.color || '#fff' }}>
                {tile.name}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {tile.category || tile.type}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="secondary-button" style={{ padding: '4px 8px' }}>
            <X size={18} />
          </button>
        </div>

        {owner ? (
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>เจ้าของวิชา:</span>
            <strong style={{ color: owner.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {owner.character.avatar} {owner.name}
            </strong>
          </div>
        ) : tile.type === 'subject' ? (
          <div style={{ color: '#4ade80', fontSize: '0.85rem', marginBottom: '16px' }}>
            ✨ วิชานี้ยังไม่มีเจ้าของ สามารถตอบคำถามเพื่อครอบครองได้!
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            {tile.description}
          </p>
        )}

        {tile.type === 'subject' && tile.rents && (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', marginBottom: '8px' }}>
              📊 ตารางค่าผ่านทาง & ระดับการอัปเกรด
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {tile.rents.map((rent, idx) => {
                const isCurrentLevel = tile.upgradeLevel === idx;
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: isCurrentLevel ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.03)',
                      border: isCurrentLevel ? '1px solid var(--primary-gold)' : 'none',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span>
                      {idx > 0 ? '🏫' : '📜'} {upgradeNames[idx]}
                    </span>
                    <strong style={{ color: isCurrentLevel ? 'var(--primary-gold)' : 'var(--text-muted)' }}>
                      💡 {rent} แต้ม
                    </strong>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          {canBuy && onBuy && (
            <button
              onClick={() => {
                onBuy(tile);
                onClose();
              }}
              className="gold-button"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <ShoppingBag size={18} />
              ซื้อวิชา (💡 {tile.price} แต้ม)
            </button>
          )}

          {canUpgrade && onUpgrade && (
            <button
              onClick={() => {
                onUpgrade(tile);
                audioManager.playUpgradeSound();
                onClose();
              }}
              className="gold-button"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <ArrowUpCircle size={18} />
              อัปเกรดเป็น {upgradeNames[(tile.upgradeLevel || 0) + 1]} (💡 {tile.upgradeCost} แต้ม)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

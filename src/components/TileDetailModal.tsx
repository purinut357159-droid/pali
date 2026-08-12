import React from 'react';
import type { BoardTile, Player } from '../types/game';
import { X, ArrowUpCircle, ShoppingBag, DollarSign, RefreshCw, Flame } from 'lucide-react';
import { audioManager } from '../utils/audioManager';
import { checkPropertyCombo, UPGRADE_NAMES } from '../utils/comboEngine';

interface Props {
  tile: BoardTile;
  owner?: Player;
  currentPlayer: Player;
  allTiles?: BoardTile[];
  onClose: () => void;
  onUpgrade?: (tile: BoardTile) => void;
  onBuy?: (tile: BoardTile) => void;
  onSell?: (tile: BoardTile) => void;
  onTakeover?: (tile: BoardTile) => void;
  isCurrentPlayerOnTile?: boolean;
}

export const TileDetailModal: React.FC<Props> = ({
  tile,
  owner,
  currentPlayer,
  allTiles = [],
  onClose,
  onUpgrade,
  onBuy,
  onSell,
  onTakeover,
  isCurrentPlayerOnTile,
}) => {
  const upgradeNames = UPGRADE_NAMES;

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

  const canSell =
    owner?.id === currentPlayer.id &&
    tile.type === 'subject';

  const takeoverCost = tile.price ? Math.floor(tile.price * 1.5) : 0;
  const canTakeover =
    isCurrentPlayerOnTile &&
    owner &&
    owner.id !== currentPlayer.id &&
    tile.type === 'subject' &&
    currentPlayer.wisdomPoints >= takeoverCost;

  const sellPrice = tile.price
    ? Math.floor(tile.price * 0.5 + (tile.upgradeLevel || 0) * (tile.upgradeCost || 0) * 0.5)
    : 0;

  const combo = owner && allTiles.length > 0 ? checkPropertyCombo(allTiles, tile, owner.id) : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
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
              marginBottom: '14px',
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
          <div style={{ color: '#4ade80', fontSize: '0.85rem', marginBottom: '14px' }}>
            ✨ วิชานี้ยังไม่มีเจ้าของ สามารถตอบคำถามเพื่อครอบครองได้!
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            {tile.description}
          </p>
        )}

        {/* Combo Multiplier Banner */}
        {combo?.hasCombo && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.2))',
              border: '1px solid #f59e0b',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: 700, fontSize: '0.85rem' }}>
              <Flame size={16} color="#ef4444" />
              <span>🔥 โบนัสคอมโบ x{combo.multiplier} เท่า ทำงานอยู่!</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#fef08a', marginTop: '4px' }}>
              {combo.reasons.map((r, i) => (
                <div key={i}>• {r}</div>
              ))}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              *เมื่อมีผู้เล่นตกในช่องนี้ ค่าผ่านทางจะเพิ่มเป็น 2 เท่าทันที
            </div>
          </div>
        )}

        {tile.type === 'subject' && tile.rents && (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', marginBottom: '8px' }}>
              📊 ตารางค่าผ่านทาง (Monopoly Rent Table)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {tile.rents.map((baseRent, idx) => {
                const isCurrentLevel = tile.upgradeLevel === idx;
                const effectiveRent = combo?.hasCombo ? baseRent * combo.multiplier : baseRent;

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {combo?.hasCombo && isCurrentLevel && (
                        <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700 }}>
                          (x{combo.multiplier})
                        </span>
                      )}
                      <strong style={{ color: isCurrentLevel ? 'var(--primary-gold)' : 'var(--text-muted)' }}>
                        💡 {effectiveRent} แต้ม
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
          {canBuy && onBuy && (
            <>
              <button
                onClick={() => onBuy(tile)}
                className="gold-button"
                style={{ justifyContent: 'center', fontSize: '0.95rem', padding: '12px' }}
              >
                <ShoppingBag size={18} />
                📖 จ่าย 💡 {tile.price} แต้ม & ตอบคำถามเพื่อซื้อวิชา
              </button>
              <button
                onClick={onClose}
                className="secondary-button"
                style={{ justifyContent: 'center', padding: '8px' }}
              >
                ⏭️ ไม่ซื้อ (ผ่านตานี้)
              </button>
            </>
          )}

          {canUpgrade && onUpgrade && (
            <>
              <button
                onClick={() => onUpgrade(tile)}
                className="gold-button"
                style={{ justifyContent: 'center', fontSize: '0.95rem', padding: '12px' }}
              >
                <ArrowUpCircle size={18} />
                🏫 จ่าย 💡 {tile.upgradeCost} แต้ม & ตอบคำถามเพื่ออัปเกรด ({upgradeNames[(tile.upgradeLevel || 0) + 1]})
              </button>
              <button
                onClick={onClose}
                className="secondary-button"
                style={{ justifyContent: 'center', padding: '8px' }}
              >
                ⏭️ ไม่ต้องการอัปเกรด (ผ่าน)
              </button>
            </>
          )}

          {canTakeover && onTakeover && (
            <button
              onClick={() => {
                onTakeover(tile);
                audioManager.playUpgradeSound();
              }}
              className="gold-button"
              style={{ justifyContent: 'center', background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}
            >
              <RefreshCw size={18} />
              เทคโอเวอร์วิชาจากคู่แข่ง (💡 {takeoverCost} แต้ม)
            </button>
          )}

          {canSell && onSell && (
            <button
              onClick={() => onSell(tile)}
              className="secondary-button"
              style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', borderColor: 'rgba(239,68,68,0.4)' }}
            >
              <DollarSign size={18} />
              ขายวิชาคืนให้สำนักเรียน (+💡 {sellPrice} แต้ม)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

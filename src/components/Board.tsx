import React from 'react';
import type { BoardTile, Player, GameLog } from '../types/game';
import { DiceRoller } from './DiceRoller';
import { checkPropertyCombo } from '../utils/comboEngine';
import {
  Book,
  Gift,
  HelpCircle,
  Award,
  Coffee,
  Flag,
  Sparkles,
  Zap,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  tiles: BoardTile[];
  players: Player[];
  currentTurnPlayer: Player;
  movingPlayerId?: string | null;
  onTileClick: (tile: BoardTile) => void;
  onRollDice: () => void;
  isDiceRolled: boolean;
  dice: [number, number];
  logs: GameLog[];
  canRollDice?: boolean;
}

export const Board: React.FC<Props> = ({
  tiles,
  players,
  currentTurnPlayer,
  movingPlayerId,
  onTileClick,
  onRollDice,
  isDiceRolled,
  dice,
  logs,
  canRollDice = true,
}) => {
  const getTileIcon = (tile: BoardTile) => {
    switch (tile.type) {
      case 'start':
        return <Flag size={16} color="#f59e0b" />;
      case 'boon':
        return <Gift size={16} color="#10b981" />;
      case 'karma':
        return <Zap size={16} color="#ef4444" />;
      case 'quiz':
        return <HelpCircle size={16} color="#3b82f6" />;
      case 'exam':
        return <Award size={16} color="#ec4899" />;
      case 'rest':
        return <Coffee size={16} color="#8b5cf6" />;
      case 'goto_jail':
        return <AlertTriangle size={16} color="#ef4444" />;
      case 'subject':
      default:
        return <Book size={14} color={tile.color || '#d4af37'} />;
    }
  };

  const getTilePositionStyle = (id: number) => {
    if (id >= 0 && id <= 10) {
      return { gridColumn: 11 - id, gridRow: 11 };
    } else if (id >= 11 && id <= 20) {
      return { gridColumn: 1, gridRow: 11 - (id - 10) };
    } else if (id >= 21 && id <= 30) {
      return { gridColumn: id - 19, gridRow: 1 };
    } else {
      return { gridColumn: 11, gridRow: id - 29 };
    }
  };

  return (
    <div className="board-container">
      {tiles.map((tile) => {
        const playersOnTile = players.filter((p) => p.position === tile.id);
        const owner = players.find((p) => p.id === tile.ownerId);
        const combo = owner ? checkPropertyCombo(tiles, tile, owner.id) : null;

        return (
          <div
            key={tile.id}
            className="board-tile"
            style={{
              ...getTilePositionStyle(tile.id),
              borderColor: owner ? owner.color : 'rgba(212, 175, 55, 0.2)',
              position: 'relative',
              boxShadow: combo?.hasCombo ? '0 0 10px rgba(245, 158, 11, 0.4)' : undefined,
            }}
            onClick={() => onTileClick(tile)}
          >
            {/* Combo Multiplier Tag */}
            {combo?.hasCombo && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
                  color: '#fff',
                  fontSize: '0.52rem',
                  fontWeight: 800,
                  padding: '1px 3px',
                  borderRadius: '4px',
                  boxShadow: '0 0 5px rgba(245, 158, 11, 0.8)',
                  zIndex: 2,
                }}
                title={`🔥 คอมโบ x${combo.multiplier}: ${combo.reasons.join(' และ ')}`}
              >
                🔥x{combo.multiplier}
              </span>
            )}

            {tile.category && (
              <div
                className="board-tile-category-bar"
                style={{ backgroundColor: tile.color || '#d4af37' }}
              />
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600, width: '100%', justifyContent: 'center' }}>
              {getTileIcon(tile)}
              <span className="tile-name-text" style={{ color: tile.color || '#fff', fontSize: '0.65rem' }}>
                {tile.name}
              </span>
            </div>

            {tile.type === 'subject' && (
              <div className="tile-price-text" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                {tile.price ? `${tile.price} 💡` : ''}
              </div>
            )}

            {owner && (
              <div
                style={{
                  fontSize: '0.55rem',
                  background: owner.color,
                  color: '#000',
                  padding: '1px 4px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  marginTop: '1px',
                }}
              >
                {owner.name.substring(0, 4)} {tile.upgradeLevel ? `★${tile.upgradeLevel}` : ''}
              </div>
            )}

            <div className="tile-tokens">
              {playersOnTile.map((p) => (
                <div
                  key={p.id}
                  className={`player-token ${p.id === movingPlayerId ? 'jumping-token' : 'bounce-token'}`}
                  style={{
                    backgroundColor: p.color,
                    borderColor: '#ffffff',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={`${p.name} (${p.character.name})`}
                >
                  {p.character.avatarImage ? (
                    <img
                      src={p.character.avatarImage}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  ) : (
                    p.character.avatar
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="board-center">
        <div style={{ textAlign: 'center', marginBottom: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img
            src="/images/board_logo.png"
            alt="บาลีส่วนฐี"
            style={{
              width: '68px',
              height: '68px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 16px rgba(212,175,55,0.75))',
              marginBottom: '4px',
            }}
          />
          <h2 className="gold-gradient-text" style={{ fontSize: '1.25rem', margin: '0 0 2px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Sparkles size={18} color="var(--primary-gold)" />
            กระดานบาลี ๔๐ วิชา
            <Sparkles size={18} color="var(--primary-gold)" />
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            ตาของ: <strong style={{ color: currentTurnPlayer.color, fontSize: '0.95rem' }}>{currentTurnPlayer.name}</strong> {currentTurnPlayer.isAi && '(AI)'}
          </p>
        </div>

        {/* 3D Tumbling Rolling Dice Component */}
        <div style={{ marginBottom: '16px' }}>
          <DiceRoller
            dice={dice}
            isDiceRolled={isDiceRolled}
            onRollDice={onRollDice}
            disabled={!canRollDice || currentTurnPlayer.isAi || !!movingPlayerId}
            doublesStreak={currentTurnPlayer.doublesStreak}
          />
        </div>

        {/* Activity Feed Log */}
        <div
          className="activity-log"
          style={{
            width: '100%',
            maxHeight: '110px',
            overflowY: 'auto',
            background: 'rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            padding: '8px 12px',
            fontSize: '0.75rem',
          }}
        >
          {logs.slice(0, 8).map((log) => (
            <div
              key={log.id}
              style={{
                marginBottom: '4px',
                color:
                  log.type === 'success'
                    ? '#4ade80'
                    : log.type === 'warning'
                    ? '#facc15'
                    : log.type === 'danger'
                    ? '#f87171'
                    : '#cbd5e1',
              }}
            >
              • {log.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

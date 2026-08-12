import React, { useState } from 'react';
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
  Layers,
  Maximize2,
  Compass,
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
}

type ViewMode = '3d-iso' | '3d-tilt' | '2d';

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
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('3d-iso');

  const getTileIcon = (tile: BoardTile) => {
    switch (tile.type) {
      case 'start':
        return <Flag size={16} color="#22c55e" />;
      case 'boon':
        return <Gift size={16} color="#10b981" />;
      case 'karma':
        return <Zap size={16} color="#ef4444" />;
      case 'quiz':
        return <HelpCircle size={16} color="#eab308" />;
      case 'exam':
        return <Award size={16} color="#f97316" />;
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

  const getBuildingVisual = (level: number = 0, owner: Player) => {
    switch (level) {
      case 1:
        return (
          <div
            className="tile-3d-building-badge"
            style={{ background: `linear-gradient(135deg, ${owner.color}, #b45309)`, color: '#fff' }}
            title="🛖 กุฏิเรียน (Level 1)"
          >
            <span>🛖</span> {owner.name.substring(0, 3)}
          </div>
        );
      case 2:
        return (
          <div
            className="tile-3d-building-badge"
            style={{ background: `linear-gradient(135deg, ${owner.color}, #0284c7)`, color: '#fff' }}
            title="🏛️ ศาลาการเปรียญ (Level 2)"
          >
            <span>🏛️</span> {owner.name.substring(0, 3)}
          </div>
        );
      case 3:
        return (
          <div
            className="tile-3d-building-badge"
            style={{ background: `linear-gradient(135deg, ${owner.color}, #d97706)`, color: '#fff' }}
            title="🏯 พระมหาเจดีย์ (Level 3)"
          >
            <span>🏯</span> {owner.name.substring(0, 3)}
          </div>
        );
      case 4:
        return (
          <div
            className="tile-3d-building-badge"
            style={{ background: `linear-gradient(135deg, #fbbf24, #ef4444)`, color: '#000', border: '1px solid #ffd700' }}
            title="👑 สำนักเรียนหลวง (Level 4 สูงสุด)"
          >
            <span>👑</span> {owner.name.substring(0, 3)}
          </div>
        );
      default:
        return (
          <div
            className="tile-3d-building-badge"
            style={{ background: owner.color, color: '#000' }}
            title={`📜 เจ้าของ: ${owner.name}`}
          >
            <span>📜</span> {owner.name.substring(0, 4)}
          </div>
        );
    }
  };

  const viewClass = 
    viewMode === '3d-iso' 
      ? 'board-view-3d-iso' 
      : viewMode === '3d-tilt' 
      ? 'board-view-3d-tilt' 
      : 'board-view-2d';

  return (
    <div className="board-3d-wrapper">
      <div className={`board-container ${viewClass}`}>
        {tiles.map((tile) => {
          const playersOnTile = players.filter((p) => p.position === tile.id);
          const isCurrentPlayerHere = currentTurnPlayer.position === tile.id;
          const owner = players.find((p) => p.id === tile.ownerId);
          const combo = owner ? checkPropertyCombo(tiles, tile, owner.id) : null;
          const isCorner = tile.id === 0 || tile.id === 10 || tile.id === 20 || tile.id === 30;

          return (
            <div
              key={tile.id}
              className={`board-tile ${isCurrentPlayerHere ? 'board-tile-active-player' : ''}`}
              style={{
                ...getTilePositionStyle(tile.id),
                borderColor: isCurrentPlayerHere
                  ? '#f59e0b'
                  : owner
                  ? owner.color
                  : isCorner
                  ? 'var(--primary-gold)'
                  : 'rgba(212, 175, 55, 0.25)',
                background: isCorner
                  ? 'linear-gradient(145deg, rgba(30, 45, 90, 0.95), rgba(10, 15, 35, 0.98))'
                  : undefined,
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
                    padding: '1px 4px',
                    borderRadius: '4px',
                    boxShadow: '0 0 6px rgba(245, 158, 11, 0.9)',
                    zIndex: 10,
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600, marginTop: '2px' }}>
                {getTileIcon(tile)}
                <span style={{ color: tile.color || '#fff', fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '58px' }}>
                  {tile.name}
                </span>
              </div>

              {tile.type === 'subject' && (
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                  {tile.price ? `${tile.price} 💡` : ''}
                </div>
              )}

              {owner && getBuildingVisual(tile.upgradeLevel, owner)}

              {/* 3D Player Tokens on Pedestals */}
              <div className="tile-tokens">
                {playersOnTile.map((p) => (
                  <div key={p.id} className="player-token-pedestal">
                    <div
                      className={`player-token ${p.id === movingPlayerId ? 'jumping-token' : 'bounce-token'}`}
                      style={{ backgroundColor: p.color, borderColor: '#ffffff' }}
                      title={`${p.name} (💡 ${p.wisdomPoints} แต้ม)`}
                    >
                      {p.character.avatar}
                    </div>
                    <div className="player-token-shadow" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* 3D Sunken Center Battle Arena */}
        <div className="board-center">
          {/* Rotating Sacred Mandala Background Watermark */}
          <svg className="board-center-mandala" viewBox="0 0 100 100" fill="none" stroke="currentColor">
            <circle cx="50" cy="50" r="45" stroke="#d4af37" strokeWidth="1" strokeDasharray="4 2" />
            <circle cx="50" cy="50" r="35" stroke="#d4af37" strokeWidth="0.8" />
            <circle cx="50" cy="50" r="25" stroke="#d4af37" strokeWidth="0.6" strokeDasharray="3 3" />
            <polygon points="50,10 90,50 50,90 10,50" stroke="#d4af37" strokeWidth="0.6" />
            <polygon points="50,15 85,50 50,85 15,50" stroke="#d4af37" strokeWidth="0.4" />
            <circle cx="50" cy="50" r="8" fill="rgba(212,175,55,0.2)" stroke="#d4af37" strokeWidth="0.8" />
          </svg>

          {/* Header & 3D Perspective Controls */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={16} color="var(--primary-gold)" />
                <span className="gold-gradient-text" style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                  กระดานบาลี ๔๐ วิชา 3D
                </span>
              </div>

              {/* 3D View Angle Switchers */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => setViewMode('3d-iso')}
                  className={viewMode === '3d-iso' ? 'gold-button' : 'secondary-button'}
                  style={{ padding: '2px 6px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                  title="มุมมอง 3D ไอโซเมตริก"
                >
                  <Compass size={11} />
                  3D Iso
                </button>
                <button
                  onClick={() => setViewMode('3d-tilt')}
                  className={viewMode === '3d-tilt' ? 'gold-button' : 'secondary-button'}
                  style={{ padding: '2px 6px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                  title="มุมมอง 3D เอียงหน้าตรง"
                >
                  <Layers size={11} />
                  3D Tilt
                </button>
                <button
                  onClick={() => setViewMode('2d')}
                  className={viewMode === '2d' ? 'gold-button' : 'secondary-button'}
                  style={{ padding: '2px 6px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                  title="มุมมอง 2D ระนาบตรง"
                >
                  <Maximize2 size={11} />
                  2D Flat
                </button>
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 6px 0' }}>
              ตาของ: <strong style={{ color: currentTurnPlayer.color, fontSize: '0.9rem' }}>{currentTurnPlayer.name}</strong> {currentTurnPlayer.isAi && '(AI)'}
            </p>
          </div>

          {/* 3D Tumbling Rolling Dice Stage */}
          <div style={{ margin: '4px 0', zIndex: 10 }}>
            <DiceRoller
              dice={dice}
              isDiceRolled={isDiceRolled}
              onRollDice={onRollDice}
              disabled={currentTurnPlayer.isAi || !!movingPlayerId}
              doublesStreak={currentTurnPlayer.doublesStreak}
            />
          </div>

          {/* Activity Feed Log */}
          <div
            style={{
              width: '100%',
              maxHeight: '90px',
              overflowY: 'auto',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.72rem',
              zIndex: 10,
            }}
          >
            {logs.slice(0, 6).map((log) => (
              <div
                key={log.id}
                style={{
                  marginBottom: '2px',
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
    </div>
  );
};

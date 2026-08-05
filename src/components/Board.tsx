import React from 'react';
import type { BoardTile, Player, UpgradeLevel } from '../types/game';
import { Dices } from 'lucide-react';

interface Props {
  tiles: BoardTile[];
  players: Player[];
  currentTurnPlayer: Player;
  onTileClick: (tile: BoardTile) => void;
  onRollDice: () => void;
  isDiceRolled: boolean;
  dice: [number, number];
  logs: { id: string; text: string; type: string }[];
}

export const Board: React.FC<Props> = ({
  tiles,
  players,
  currentTurnPlayer,
  onTileClick,
  onRollDice,
  isDiceRolled,
  dice,
  logs,
}) => {
  const getTileGridPosition = (index: number) => {
    if (index >= 0 && index <= 10) {
      return { gridRow: 1, gridColumn: index + 1 };
    } else if (index > 10 && index <= 20) {
      return { gridColumn: 11, gridRow: index - 10 + 1 };
    } else if (index > 20 && index <= 30) {
      return { gridRow: 11, gridColumn: 11 - (index - 20) };
    } else {
      return { gridColumn: 1, gridRow: 11 - (index - 30) };
    }
  };

  const getUpgradeIcon = (level?: UpgradeLevel) => {
    switch (level) {
      case 1: return '📖';
      case 2: return '🏫';
      case 3: return '🏛️';
      case 4: return '👑';
      default: return '📜';
    }
  };

  return (
    <div className="board-container">
      {tiles.map((tile) => {
        const { gridRow, gridColumn } = getTileGridPosition(tile.id);
        const owner = players.find((p) => p.id === tile.ownerId);
        const playersOnTile = players.filter((p) => p.position === tile.id);

        return (
          <div
            key={tile.id}
            className="board-tile"
            style={{
              gridRow,
              gridColumn,
              borderColor: owner ? owner.color : 'rgba(255,255,255,0.12)',
              boxShadow: owner ? `inset 0 0 8px ${owner.color}44` : undefined,
            }}
            onClick={() => onTileClick(tile)}
          >
            <div
              className="tile-header"
              style={{
                backgroundColor: tile.color || '#334155',
                color: '#ffffff',
              }}
            >
              {tile.name}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '2px 0' }}>
              <span style={{ fontSize: '1.1rem' }}>{tile.icon}</span>
              {tile.price && (
                <span style={{ fontSize: '0.6rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                  💡 {tile.price}
                </span>
              )}
            </div>

            {tile.ownerId && tile.upgradeLevel !== undefined && (
              <div
                style={{
                  fontSize: '0.55rem',
                  background: owner ? owner.color : '#333',
                  color: '#000',
                  borderRadius: '4px',
                  padding: '1px 3px',
                  fontWeight: 700,
                }}
              >
                {getUpgradeIcon(tile.upgradeLevel)} Lv.{tile.upgradeLevel}
              </div>
            )}

            <div className="tile-tokens">
              {playersOnTile.map((p) => (
                <div
                  key={p.id}
                  className="player-token bounce-token"
                  style={{ backgroundColor: p.color }}
                  title={p.name}
                >
                  {p.character.avatar}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="board-center">
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <h2 className="gold-gradient-text" style={{ fontSize: '1.2rem', marginBottom: '4px' }}>
            กระดานบาลี ๔๐ วิชา
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            ตาของ: <strong style={{ color: currentTurnPlayer.color }}>{currentTurnPlayer.name}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
                color: '#0f172a',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
                boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
              }}
            >
              {dice[0]}
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
                background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
                color: '#0f172a',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
                boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
              }}
            >
              {dice[1]}
            </div>
          </div>

          <button
            onClick={onRollDice}
            disabled={isDiceRolled}
            className="gold-button pulse-active"
            style={{ padding: '10px 20px', fontSize: '1rem' }}
          >
            <Dices size={20} />
            {isDiceRolled ? 'กำลังรับผล' : 'ทอยลูกเต๋า'}
          </button>
        </div>

        <div
          style={{
            width: '100%',
            maxHeight: '120px',
            overflowY: 'auto',
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '8px',
            fontSize: '0.72rem',
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

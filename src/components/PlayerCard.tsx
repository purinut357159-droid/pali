import React from 'react';
import type { Player } from '../types/game';
import { Award, Zap, Home, Flag } from 'lucide-react';

interface Props {
  player: Player;
  isCurrentTurn: boolean;
}

export const PlayerCard: React.FC<Props> = ({ player, isCurrentTurn }) => {
  return (
    <div
      className={`glass-panel ${isCurrentTurn ? 'pulse-active' : ''}`}
      style={{
        padding: '14px',
        borderLeft: `5px solid ${player.color}`,
        transition: 'all 0.3s ease',
        opacity: isCurrentTurn ? 1 : 0.8,
        background: isCurrentTurn ? 'rgba(25, 38, 72, 0.95)' : 'rgba(16, 25, 50, 0.75)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.6rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
            {player.character.avatar}
          </span>
          <div>
            <h3 style={{ fontSize: '0.95rem', margin: 0, color: player.color }}>
              {player.name} {player.isAi && <span style={{ fontSize: '0.7rem', color: '#a0aec0' }}>(AI)</span>}
            </h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
              {player.character.name}
            </p>
          </div>
        </div>
        {isCurrentTurn && (
          <span
            style={{
              fontSize: '0.65rem',
              background: player.color,
              color: '#000',
              padding: '2px 8px',
              borderRadius: '10px',
              fontWeight: 700,
            }}
          >
            กำลังเล่น
          </span>
        )}
      </div>

      <div
        style={{
          background: 'rgba(0,0,0,0.3)',
          padding: '8px 10px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          border: '1px solid rgba(212,175,55,0.2)',
        }}
      >
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          💡 แต้มปัญญา:
        </span>
        <strong style={{ fontSize: '1.1rem', color: 'var(--accent-gold)' }}>
          {player.wisdomPoints.toLocaleString()}
        </strong>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.75rem', marginBottom: '6px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '4px 6px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Home size={12} color="#3b82f6" />
          <span>วิชา: {player.ownedProperties.length}</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '4px 6px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Award size={12} color="#10b981" />
          <span>ถูก: {player.stats.correctAnswers} ข้อ</span>
        </div>
      </div>

      {/* 1st Lap Status Badge */}
      <div
        style={{
          fontSize: '0.68rem',
          padding: '4px 6px',
          borderRadius: '6px',
          background: player.hasCompletedFirstLap ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${player.hasCompletedFirstLap ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          color: player.hasCompletedFirstLap ? '#4ade80' : '#f87171',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginBottom: '6px',
        }}
      >
        <Flag size={12} />
        <span>{player.hasCompletedFirstLap ? 'ปลดล็อกซื้อวิชาแล้ว (ผ่านรอบ 1)' : 'ยังไม่ครบรอบ 1 (ซื้อวิชาไม่ได้)'}</span>
      </div>

      {player.isSkipTurn && (
        <div
          style={{
            fontSize: '0.68rem',
            padding: '3px 6px',
            borderRadius: '6px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #ef4444',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '6px',
          }}
        >
          <span>🛑 ติดภารกิจ (หยุดเดิน 1 ตา)</span>
        </div>
      )}

      {player.tutoringWrongCount > 0 && !player.isSkipTurn && (
        <div
          style={{
            fontSize: '0.68rem',
            padding: '3px 6px',
            borderRadius: '6px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid #f59e0b',
            color: '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '6px',
          }}
        >
          <span>👨‍🏫 ติวผิดสะสม: {player.tutoringWrongCount}/3 ข้อ</span>
        </div>
      )}

      <div
        style={{
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          background: 'rgba(212, 175, 55, 0.05)',
          padding: '4px 6px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <Zap size={12} color="var(--primary-gold)" />
        <span>สกิล: <strong>{player.character.skillName}</strong></span>
      </div>
    </div>
  );
};

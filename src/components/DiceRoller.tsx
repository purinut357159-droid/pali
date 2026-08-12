import React, { useState, useEffect } from 'react';
import { Dices, Sparkles } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface Props {
  dice: [number, number];
  isDiceRolled: boolean;
  onRollDice: () => void;
  disabled?: boolean;
  doublesStreak?: number;
}

export const DiceRoller: React.FC<Props> = ({ dice, isDiceRolled, onRollDice, disabled, doublesStreak = 0 }) => {
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [tempDice, setTempDice] = useState<[number, number]>([1, 1]);
  const [showDoublesEffect, setShowDoublesEffect] = useState<boolean>(false);

  const handleRollClick = () => {
    if (isRolling || disabled || isDiceRolled) return;

    setIsRolling(true);
    setShowDoublesEffect(false);

    // Rapid face tumbling interval
    const interval = setInterval(() => {
      setTempDice([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]);
      audioManager.playDiceRoll();
    }, 80);

    // Stop tumbling after 800ms and execute main roll logic
    setTimeout(() => {
      clearInterval(interval);
      setIsRolling(false);
      onRollDice();
    }, 800);
  };

  useEffect(() => {
    if (isDiceRolled && !isRolling) {
      if (dice[0] === dice[1]) {
        setShowDoublesEffect(true);
        audioManager.playSathuChime();
      } else {
        setShowDoublesEffect(false);
      }
    }
  }, [isDiceRolled, dice, isRolling]);

  const displayDice = isRolling ? tempDice : dice;

  // Render authentic 3D dice dot face (1 to 6)
  const renderDiceFace = (val: number, isFirst: boolean) => {
    // Dot positions in 3x3 grid (0 to 8)
    const dotPositions: Record<number, number[]> = {
      1: [4], // Center dot
      2: [0, 8], // Top-left, bottom-right
      3: [0, 4, 8], // Diagonal 3 dots
      4: [0, 2, 6, 8], // 4 corners
      5: [0, 2, 4, 6, 8], // 4 corners + center
      6: [0, 2, 3, 5, 6, 8], // 2 columns of 3
    };

    const activeDots = dotPositions[val] || [4];
    const isOne = val === 1;

    return (
      <div
        className={`dice-cube ${isRolling ? (isFirst ? 'rolling-dice-1' : 'rolling-dice-2') : 'landed-dice'}`}
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
        }}
      >
        {Array.from({ length: 9 }).map((_, idx) => {
          const isDotActive = activeDots.includes(idx);
          return (
            <div key={idx} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isDotActive && (
                <div
                  className={`dice-dot ${isOne ? '' : 'dice-dot-black'}`}
                  style={{
                    width: isOne ? '13px' : '9px',
                    height: isOne ? '13px' : '9px',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      {/* 3D Tumbling Dice Display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
        {renderDiceFace(displayDice[0], true)}
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-gold)' }}>+</div>
        {renderDiceFace(displayDice[1], false)}

        {/* Total Score Badge */}
        <div
          style={{
            marginLeft: '8px',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.3), rgba(0,0,0,0.6))',
            border: '1px solid var(--primary-gold)',
            borderRadius: '10px',
            padding: '4px 10px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>รวมแต้ม</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
            {displayDice[0] + displayDice[1]}
          </div>
        </div>
      </div>

      {/* Doubles Thrill Banner */}
      {showDoublesEffect && (
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: doublesStreak >= 2 ? '#ef4444' : '#f59e0b',
            background: doublesStreak >= 2 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.15)',
            border: `1px solid ${doublesStreak >= 2 ? '#ef4444' : '#f59e0b'}`,
            padding: '4px 14px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            animation: 'pulse 1s infinite',
          }}
        >
          <Sparkles size={14} color={doublesStreak >= 2 ? '#ef4444' : '#f59e0b'} />
          {doublesStreak === 1 && `🎲 ออกคู่ ${dice[0]}-${dice[1]}! ได้สิทธิ์ทอยเพิ่มอีก 1 ครั้ง (ครั้งที่ 1/3)`}
          {doublesStreak === 2 && `🔥 ออกคู่ซ้อน 2 ครั้งติด (${dice[0]}-${dice[1]})! ได้สิทธิ์ทอยต่อ (⚠️ ออกคู่ครั้งที่ 3 เข้าคุกทันที!)`}
          {doublesStreak >= 3 && `🚨 ออกคู่ 3 ครั้งติดต่อกัน (${dice[0]}-${dice[1]})! ส่งเข้าสนามสอบสนามหลวง (คุก)`}
        </div>
      )}

      {/* Action Roll Button */}
      <button
        onClick={handleRollClick}
        disabled={isRolling || isDiceRolled || disabled}
        className="gold-button pulse-active"
        style={{
          padding: '12px 28px',
          fontSize: '1rem',
          letterSpacing: '0.5px',
          background: isRolling
            ? 'linear-gradient(135deg, #e67e22, #d35400)'
            : doublesStreak > 0
            ? 'linear-gradient(135deg, #e11d48 0%, #f59e0b 100%)'
            : 'linear-gradient(135deg, #f39c12 0%, #d4af37 100%)',
        }}
      >
        <Dices size={22} className={isRolling ? 'rolling-dice-1' : ''} />
        {isRolling
          ? 'กำลังหมุนลูกเต๋า...'
          : isDiceRolled
          ? 'กำลังดำเนินการ...'
          : doublesStreak > 0
          ? `🎲 ทอยต่อ (ได้สิทธิ์จากออกคู่ ครั้งที่ ${doublesStreak})`
          : '🎲 ทอยลูกเต๋า'}
      </button>
    </div>
  );
};

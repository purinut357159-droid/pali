import React, { useState, useEffect, useRef } from 'react';
import type { Question, Player } from '../types/game';
import { CheckCircle2, XCircle, Sparkles, Timer, Zap } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface Props {
  question: Question;
  player: Player;
  title: string;
  mode?: 'buy' | 'rent' | 'quiz' | 'exam' | 'upgrade';
  onAnswer: (isCorrect: boolean, speedBonus: number, timeTaken: number) => void;
  canUseFreeCard?: boolean;
  onUseFreeCard?: () => void;
}

const TOTAL_TIME = 15; // 15 seconds limit

export const QuizModal: React.FC<Props> = ({
  question,
  player,
  title,
  mode = 'quiz',
  onAnswer,
  canUseFreeCard,
  onUseFreeCard,
}) => {
  const [isStarted, setIsStarted] = useState<boolean>(player.isAi);
  const [timeLeft, setTimeLeft] = useState<number>(TOTAL_TIME);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isTimeout, setIsTimeout] = useState<boolean>(false);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [earnedBonus, setEarnedBonus] = useState<number>(0);
  const lastTickSecond = useRef<number>(TOTAL_TIME);

  // Speed multiplier based on player character skill
  const charMultiplier = player.character.id === 'teacher' ? 1.5 : (player.character.id === 'novice' ? 1.2 : 1.0);

  const calculateSpeedBonus = (remaining: number) => {
    const base = Math.max(10, Math.round(remaining * 10));
    return Math.round(base * charMultiplier);
  };

  const currentLiveBonus = calculateSpeedBonus(timeLeft);

  // AI auto-answer simulation
  useEffect(() => {
    if (!player.isAi) return;
    setIsStarted(true);

    const timer = setTimeout(() => {
      if (isAnswered) return;
      const accuracy = player.aiDifficulty === 'easy' ? 0.6 : player.aiDifficulty === 'hard' ? 0.95 : 0.8;
      const isCorrect = Math.random() < accuracy;
      const chosen = isCorrect
        ? question.correctAnswer
        : (question.correctAnswer + 1) % question.options.length;
      handleSelectOption(chosen);

      setTimeout(() => {
        const bonus = isCorrect ? calculateSpeedBonus(timeLeft) : 0;
        onAnswer(isCorrect, isPropertyMode ? 0 : bonus, 2.0);
      }, 1500);
    }, 1500);

    return () => clearTimeout(timer);
  }, [player.isAi]);

  // Countdown timer effect
  useEffect(() => {
    if (!isStarted || isAnswered) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, +(prev - 0.1).toFixed(1));

        // Soft tick sound for last 4 seconds
        const currentInt = Math.ceil(next);
        if (next <= 4.0 && next > 0 && currentInt !== lastTickSecond.current) {
          lastTickSecond.current = currentInt;
          audioManager.playTickSound();
        }

        if (next <= 0) {
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isStarted, isAnswered]);

  const handleTimeout = () => {
    if (isAnswered) return;
    setIsAnswered(true);
    setIsTimeout(true);
    setTimeTaken(TOTAL_TIME);
    setEarnedBonus(0);
    audioManager.playTimeoutSound();
  };

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    const taken = +(TOTAL_TIME - timeLeft).toFixed(1);
    const correct = index === question.correctAnswer;
    const bonus = correct ? calculateSpeedBonus(timeLeft) : 0;

    setSelectedIndex(index);
    setTimeTaken(taken);
    setEarnedBonus(bonus);
    setIsAnswered(true);

    if (correct) {
      audioManager.playSathuChime();
    } else {
      audioManager.playTempleBell();
    }
  };

  const handleUseFreeCardLocal = () => {
    if (isAnswered) return;
    const bonus = calculateSpeedBonus(TOTAL_TIME); // max bonus
    setIsStarted(true);
    setIsAnswered(true);
    setSelectedIndex(question.correctAnswer);
    setTimeTaken(0.5);
    setEarnedBonus(bonus);
    audioManager.playSathuChime();

    if (onUseFreeCard) {
      onUseFreeCard();
    }
  };

  const isPropertyMode = mode === 'buy' || mode === 'upgrade';

  const handleConfirm = () => {
    const isCorrect = selectedIndex === question.correctAnswer && !isTimeout;
    onAnswer(isCorrect, isPropertyMode ? 0 : isCorrect ? earnedBonus : 0, timeTaken);
  };

  const renderStars = (level: number) => {
    return '⭐'.repeat(level);
  };

  const getSpeedGrade = (seconds: number) => {
    if (seconds <= 3.5) {
      return { label: 'สายฟ้าแลบ (Lightning Fast)', icon: '⚡', color: '#f59e0b' };
    }
    if (seconds <= 7.0) {
      return { label: 'รวดเร็วมาก (Super Fast)', icon: '🚀', color: '#06b6d4' };
    }
    if (seconds <= 11.0) {
      return { label: 'ฉับไว (Quick Answer)', icon: '🎯', color: '#10b981' };
    }
    return { label: 'ทันเวลา (In Time)', icon: '⏱️', color: '#94a3b8' };
  };

  // Timer Bar Percentage & Color
  const timerPercent = Math.min(100, Math.max(0, (timeLeft / TOTAL_TIME) * 100));
  const isUrgent = timeLeft <= 4.0;
  let barGradient = 'linear-gradient(90deg, #10b981, #d4af37)';
  if (timeLeft <= 4.0) {
    barGradient = 'linear-gradient(90deg, #ef4444, #dc2626)';
  } else if (timeLeft <= 7.5) {
    barGradient = 'linear-gradient(90deg, #f59e0b, #eab308)';
  }

  const speedGrade = getSpeedGrade(timeTaken);

  return (
    <div className="modal-overlay">
      <div
        className={`glass-panel ${isUrgent && !isAnswered && isStarted ? 'timer-warning' : ''}`}
        style={{
          width: '100%',
          maxWidth: '540px',
          padding: '24px',
          border: isUrgent && !isAnswered && isStarted ? '2px solid #ef4444' : '2px solid var(--primary-gold)',
          boxShadow: isUrgent && !isAnswered && isStarted ? '0 0 30px rgba(239,68,68,0.5)' : '0 0 30px rgba(212,175,55,0.3)',
          transition: 'border 0.3s, box-shadow 0.3s',
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                background: 'rgba(212, 175, 55, 0.2)',
                color: 'var(--primary-gold)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 600,
              }}
            >
              {question.category} {renderStars(question.level)}
            </span>
            <h2 className="gold-gradient-text" style={{ fontSize: '1.25rem', marginTop: '4px', margin: 0 }}>
              {title}
            </h2>
          </div>
          <span style={{ fontSize: '1.8rem' }}>✍️</span>
        </div>

        {!isStarted ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px 8px 8px 8px' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'rgba(212, 175, 55, 0.15)',
                border: '2px solid var(--primary-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.2rem',
                marginBottom: '16px',
                animation: 'pulse 2s infinite',
              }}
            >
              {mode === 'buy' ? '📜' : mode === 'upgrade' ? '🏫' : mode === 'quiz' ? '👨‍🏫' : '🏛️'}
            </div>

            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-gold)', margin: '0 0 8px 0' }}>
              {title}
            </h3>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5, maxWidth: '440px' }}>
              {mode === 'buy' && 'ตอบคำถามบาลีให้ถูกต้องภายใน 15 วินาที เพื่อรับสิทธิ์ครอบครองวิชา!'}
              {mode === 'upgrade' && 'ตอบคำถามบาลีให้ถูกต้องภายใน 15 วินาที เพื่ออัปเกรดสำนักเรียน!'}
              {mode === 'quiz' && 'ห้องติวพิเศษ: ตอบถูกรับ +150 แต้มปัญญา ภายใน 15 วินาที!'}
              {mode === 'exam' && 'สนามสอบเปรียญ: ตอบถูกรับแต้มปัญญาโบนัสใหญ่ +300 แต้ม!'}
              {mode === 'rent' && 'ตอบคำถามบาลีให้ถูกต้องเพื่อรับส่วนลดค่าผ่านทาง 50%!'}
              <br />
              <span style={{ fontSize: '0.75rem', color: '#fca5a5' }}>
                (⚠️ ตอบผิดสะสมครบ 3 ข้อ จะถูกส่งเข้าสนามติวเข้มพิเศษ ช่อง 20)
              </span>
            </p>

            <div
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '10px 12px',
                marginBottom: '18px',
                fontSize: '0.82rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '6px',
                textAlign: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>หมวดวิชา</div>
                <strong style={{ color: 'var(--primary-gold)' }}>{question.category}</strong>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>ความยาก</div>
                <strong style={{ color: '#fbbf24' }}>{renderStars(question.level)}</strong>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>เวลาตอบ</div>
                <strong style={{ color: '#4ade80' }}>15.0 วินาที</strong>
              </div>
            </div>

            <button
              onClick={() => {
                setIsStarted(true);
                audioManager.playDiceRoll();
              }}
              className="gold-button pulse-active"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '1rem' }}
            >
              <Sparkles size={18} />
              ⚡ พร้อมตอบคำถาม (เริ่มจับเวลา)
            </button>

            {canUseFreeCard && onUseFreeCard && (
              <button
                onClick={handleUseFreeCardLocal}
                className="secondary-button"
                style={{ marginTop: '10px', width: '100%', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', padding: '8px 12px' }}
              >
                <Sparkles size={14} color="var(--primary-gold)" />
                ใช้การ์ดผ่านฟรี ({player.freeAnswerCards}) ข้ามข้อนี้ทันที
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Speed Timer Bar Container */}
            <div
              style={{
                background: 'rgba(10, 17, 35, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '8px 12px',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.8rem', flexWrap: 'wrap', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isUrgent && !isAnswered ? '#f87171' : '#f8f9fa', fontWeight: 600 }}>
                  <Timer size={14} color={isUrgent && !isAnswered ? '#ef4444' : 'var(--primary-gold)'} />
                  <span>
                    {isAnswered
                      ? isTimeout
                        ? '⌛ หมดเวลา'
                        : `⏱️ ใช้เวลา: ${timeTaken.toFixed(1)} วิ`
                      : `⏱️ เหลือ: ${timeLeft.toFixed(1)} วินาที`}
                  </span>
                </div>

                {!isAnswered ? (
                  <div
                    className="shimmer-badge"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--primary-gold)',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      border: '1px solid rgba(212, 175, 55, 0.4)',
                    }}
                  >
                    {isPropertyMode ? (
                      <>
                        <Sparkles size={12} color="#f59e0b" />
                        <span>{mode === 'buy' ? '🎯 ตอบถูกเพื่อซื้อวิชา' : '🏫 ตอบถูกเพื่ออัปเกรด'}</span>
                      </>
                    ) : (
                      <>
                        <Zap size={12} color="#f59e0b" />
                        <span>+{currentLiveBonus} แต้ม {charMultiplier > 1 ? `(${charMultiplier}x)` : ''}</span>
                      </>
                    )}
                  </div>
                ) : (
                  selectedIndex === question.correctAnswer && !isTimeout && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#4ade80',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                      }}
                    >
                      {isPropertyMode ? (
                        <>
                          <Sparkles size={14} color="#22c55e" />
                          {mode === 'buy' ? '🎉 ได้สิทธิ์ครอบครองวิชา!' : '🎉 ได้สิทธิ์อัปเกรดสำนักเรียน!'}
                        </>
                      ) : (
                        <>
                          <Zap size={14} color="#22c55e" />
                          โบนัสตอบไว: +{earnedBonus} แต้ม!
                        </>
                      )}
                    </div>
                  )
                )}
              </div>

              {/* Progress Bar Track */}
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${timerPercent}%`,
                    height: '100%',
                    background: barGradient,
                    borderRadius: '4px',
                    transition: 'width 0.1s linear, background 0.3s ease',
                  }}
                />
              </div>
            </div>

            {question.paliVocab && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(16, 25, 50, 0.6))',
                  border: '1px solid var(--primary-gold)',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  textAlign: 'center',
                  marginBottom: '14px',
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>คำศัพท์บาลี:</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', letterSpacing: '1px' }}>
                  {question.paliVocab}
                </div>
              </div>
            )}

            <p style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '16px', lineHeight: 1.5, color: '#f8f9fa' }}>
              {question.questionText}
            </p>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              {question.options.map((option, idx) => {
                let bgColor = 'rgba(255, 255, 255, 0.05)';
                let borderColor = 'rgba(255, 255, 255, 0.1)';

                if (isAnswered) {
                  if (idx === question.correctAnswer) {
                    bgColor = 'rgba(34, 197, 94, 0.25)';
                    borderColor = '#22c55e';
                  } else if (idx === selectedIndex) {
                    bgColor = 'rgba(239, 68, 68, 0.25)';
                    borderColor = '#ef4444';
                  }
                } else if (selectedIndex === idx) {
                  borderColor = 'var(--primary-gold)';
                  bgColor = 'rgba(212, 175, 55, 0.1)';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswered}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: bgColor,
                      border: `1.5px solid ${borderColor}`,
                      color: '#ffffff',
                      textAlign: 'left',
                      fontSize: '0.95rem',
                      cursor: isAnswered ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span>{option}</span>
                    {isAnswered && idx === question.correctAnswer && <CheckCircle2 color="#22c55e" size={20} />}
                    {isAnswered && idx === selectedIndex && idx !== question.correctAnswer && <XCircle color="#ef4444" size={20} />}
                  </button>
                );
              })}
            </div>

            {/* Result Breakdown */}
            {isAnswered && (
              <div
                style={{
                  background:
                    selectedIndex === question.correctAnswer && !isTimeout
                      ? 'rgba(34, 197, 94, 0.12)'
                      : 'rgba(239, 68, 68, 0.12)',
                  border: `1px solid ${
                    selectedIndex === question.correctAnswer && !isTimeout ? '#22c55e' : '#ef4444'
                  }`,
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '16px',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong
                    style={{
                      fontSize: '0.95rem',
                      color: selectedIndex === question.correctAnswer && !isTimeout ? '#4ade80' : '#f87171',
                    }}
                  >
                    {isTimeout
                      ? '⏰ หมดเวลา! ไม่สามารถตอบคำถามได้ทัน'
                      : selectedIndex === question.correctAnswer
                      ? '✨ คำตอบถูกต้อง! (สาธุ)'
                      : '❌ ตอบผิด!'}
                  </strong>

                  {selectedIndex === question.correctAnswer && !isTimeout && (
                    <span
                      style={{
                        background: 'rgba(212,175,55,0.2)',
                        color: speedGrade.color,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {speedGrade.icon} {speedGrade.label}
                    </span>
                  )}
                </div>

                {selectedIndex === question.correctAnswer && !isTimeout && !isPropertyMode && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      margin: '8px 0',
                      padding: '6px 10px',
                      background: 'rgba(0,0,0,0.25)',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div>
                      ⏱️ เวลาที่ใช้: <strong>{timeTaken.toFixed(1)} วิ</strong>
                    </div>
                    <div>
                      ⚡ โบนัสความเร็ว: <strong style={{ color: '#fbbf24' }}>+{earnedBonus} แต้มปัญญา</strong>
                    </div>
                  </div>
                )}

                <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)' }}>
                  <strong>คำอธิบาย:</strong> {question.explanation}
                </p>
              </div>
            )}

            {/* Footer / Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {canUseFreeCard && !isAnswered && onUseFreeCard && (
                <button
                  onClick={handleUseFreeCardLocal}
                  className="secondary-button"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
                >
                  <Sparkles size={16} color="var(--primary-gold)" />
                  ใช้การ์ดผ่านฟรี ({player.freeAnswerCards})
                </button>
              )}

              {isAnswered && (
                <button
                  onClick={handleConfirm}
                  className="gold-button"
                  style={{ marginLeft: 'auto' }}
                >
                  ดำเนินการต่อ
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};


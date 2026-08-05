import React, { useState } from 'react';
import type { Question, Player } from '../types/game';
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface Props {
  question: Question;
  player: Player;
  title: string;
  onAnswer: (isCorrect: boolean) => void;
  canUseFreeCard?: boolean;
  onUseFreeCard?: () => void;
}

export const QuizModal: React.FC<Props> = ({
  question,
  player,
  title,
  onAnswer,
  canUseFreeCard,
  onUseFreeCard,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedIndex(index);
    setIsAnswered(true);
    const correct = index === question.correctAnswer;
    
    if (correct) {
      audioManager.playSathuChime();
    } else {
      audioManager.playTempleBell();
    }
  };

  const handleConfirm = () => {
    if (selectedIndex === null) return;
    onAnswer(selectedIndex === question.correctAnswer);
  };

  const renderStars = (level: number) => {
    return '⭐'.repeat(level);
  };

  return (
    <div className="modal-overlay">
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '24px',
          border: '2px solid var(--primary-gold)',
          boxShadow: '0 0 30px rgba(212,175,55,0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
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

        {question.paliVocab && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(16, 25, 50, 0.6))',
              border: '1px solid var(--primary-gold)',
              borderRadius: '12px',
              padding: '12px 16px',
              textAlign: 'center',
              marginBottom: '16px',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>คำศัพท์บาลี:</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#ffffff', letterSpacing: '1px' }}>
              {question.paliVocab}
            </div>
          </div>
        )}

        <p style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '20px', lineHeight: 1.5, color: '#f8f9fa' }}>
          {question.questionText}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
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

        {isAnswered && (
          <div
            style={{
              background: selectedIndex === question.correctAnswer ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${selectedIndex === question.correctAnswer ? '#22c55e' : '#ef4444'}`,
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '16px',
              fontSize: '0.85rem',
            }}
          >
            <strong style={{ color: selectedIndex === question.correctAnswer ? '#4ade80' : '#f87171' }}>
              {selectedIndex === question.correctAnswer ? '✨ คำตอบถูกต้อง! (สาธุ)' : '❌ ตอบผิด!'}
            </strong>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>
              {question.explanation}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {canUseFreeCard && !isAnswered && onUseFreeCard && (
            <button
              onClick={onUseFreeCard}
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
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import type { ReviewItem } from '../types/game';
import { BookOpen, X, Sparkles } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface Props {
  reviewItems: ReviewItem[];
  onClose: () => void;
  onMasterQuestion: (questionId: string) => void;
}

export const ReviewNotebook: React.FC<Props> = ({ reviewItems, onClose, onMasterQuestion }) => {
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [userChoice, setUserChoice] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [isTimeout, setIsTimeout] = useState<boolean>(false);

  const activeItems = reviewItems.filter((item) => !item.mastered);
  const masteredItems = reviewItems.filter((item) => item.mastered);

  // Review question timer
  useEffect(() => {
    if (!selectedItem || isAnswered) return;

    setTimeLeft(15);
    setIsTimeout(false);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, +(prev - 0.1).toFixed(1));
        if (next <= 0) {
          clearInterval(interval);
          setIsAnswered(true);
          setIsTimeout(true);
          setTimeTaken(15);
          audioManager.playTimeoutSound();
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [selectedItem, isAnswered]);

  const handleTestQuestion = (item: ReviewItem) => {
    setSelectedItem(item);
    setUserChoice(null);
    setIsAnswered(false);
    setIsTimeout(false);
    setTimeLeft(15);
    setTimeTaken(0);
  };

  const handleSelectOption = (index: number) => {
    if (!selectedItem || isAnswered) return;
    const taken = +(15 - timeLeft).toFixed(1);
    setUserChoice(index);
    setTimeTaken(taken);
    setIsAnswered(true);

    if (index === selectedItem.question.correctAnswer) {
      audioManager.playSathuChime();
      onMasterQuestion(selectedItem.question.id);
    } else {
      audioManager.playTempleBell();
    }
  };

  const getSpeedGrade = (sec: number) => {
    if (sec <= 3.5) return { label: 'สายฟ้าแลบ ⚡', color: '#f59e0b' };
    if (sec <= 7.0) return { label: 'รวดเร็วมาก 🚀', color: '#06b6d4' };
    if (sec <= 11.0) return { label: 'ฉับไว 🎯', color: '#10b981' };
    return { label: 'ทันเวลา ⏱️', color: '#94a3b8' };
  };

  return (
    <div className="modal-overlay">
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          border: '2px solid var(--primary-gold)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={28} color="var(--primary-gold)" />
            <div>
              <h2 className="gold-gradient-text" style={{ fontSize: '1.3rem', margin: 0 }}>
                สมุดทบทวนบาลี (Spaced Repetition)
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                ทบทวนศัพท์และไวยากรณ์ที่เคยตอบผิด พร้อมระบบจับเวลาฝึกความแม่นยำ
              </p>
            </div>
          </div>
          <button onClick={onClose} className="secondary-button" style={{ padding: '4px 8px' }}>
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ต้องทบทวนวันนี้</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f87171' }}>
              {activeItems.length} ข้อ
            </div>
          </div>
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34,197,94,0.3)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>เชี่ยวชาญแล้ว (Mastered)</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#4ade80' }}>
              {masteredItems.length} ข้อ
            </div>
          </div>
        </div>

        {selectedItem ? (
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary-gold)' }}>
                หมวด: {selectedItem.question.category}
              </span>
              <button onClick={() => setSelectedItem(null)} className="secondary-button" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                กลับสู่รายการ
              </button>
            </div>

            {/* Timer Bar for Review */}
            <div style={{ marginBottom: '14px', background: 'rgba(0,0,0,0.4)', padding: '8px 12px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ color: timeLeft <= 4 ? '#ef4444' : '#f8f9fa' }}>
                  {isAnswered
                    ? isTimeout
                      ? '⌛ หมดเวลา'
                      : `⏱️ เวลาที่ใช้: ${timeTaken.toFixed(1)} วินาที`
                    : `⏱️ เวลาที่เหลือ: ${timeLeft.toFixed(1)} วิ`}
                </span>
                {isAnswered && userChoice === selectedItem.question.correctAnswer && (
                  <span style={{ color: getSpeedGrade(timeTaken).color, fontWeight: 700 }}>
                    {getSpeedGrade(timeTaken).label}
                  </span>
                )}
              </div>
              <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(timeLeft / 15) * 100}%`,
                    background: timeLeft <= 4 ? '#ef4444' : timeLeft <= 8 ? '#f59e0b' : '#10b981',
                    transition: 'width 0.1s linear',
                  }}
                />
              </div>
            </div>

            {selectedItem.question.paliVocab && (
              <div style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
                {selectedItem.question.paliVocab}
              </div>
            )}

            <p style={{ fontSize: '0.95rem', marginBottom: '16px' }}>
              {selectedItem.question.questionText}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {selectedItem.question.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    textAlign: 'left',
                    background: isAnswered
                      ? idx === selectedItem.question.correctAnswer
                        ? 'rgba(34, 197, 94, 0.3)'
                        : idx === userChoice
                        ? 'rgba(239, 68, 68, 0.3)'
                        : 'rgba(255,255,255,0.05)'
                      : 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    cursor: isAnswered ? 'default' : 'pointer',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>

            {isAnswered && (
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.85rem' }}>
                <div>
                  <strong style={{ color: userChoice === selectedItem.question.correctAnswer ? '#4ade80' : '#f87171' }}>
                    {isTimeout
                      ? '⏰ หมดเวลา!'
                      : userChoice === selectedItem.question.correctAnswer
                      ? '✨ ถูกต้อง! เชี่ยวชาญวิชานี้แล้ว'
                      : '❌ ตอบผิด!'}
                  </strong>
                </div>
                <div style={{ marginTop: '4px' }}>
                  <strong>คำอธิบาย:</strong> {selectedItem.question.explanation}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
            {activeItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <Sparkles size={40} color="var(--primary-gold)" style={{ marginBottom: '8px' }} />
                <p>ยอดเยี่ยมมาก! ไม่มีข้อที่ต้องทบทวนในขณะนี้</p>
              </div>
            ) : (
              activeItems.map((item) => (
                <div
                  key={item.question.id}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary-gold)' }}>
                      {item.question.category} • ตอบผิด {item.timesWrong} ครั้ง
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginTop: '2px' }}>
                      {item.question.paliVocab ? `${item.question.paliVocab} - ` : ''}
                      {item.question.questionText}
                    </div>
                  </div>

                  <button
                    onClick={() => handleTestQuestion(item)}
                    className="gold-button"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    ทบทวน
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

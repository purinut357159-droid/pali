import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles } from 'lucide-react';
import { QUESTION_BANK } from '../data/questionBank';
import { audioManager } from '../utils/audioManager';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
  timestamp: string;
}

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'bot',
      text: 'เจริญพร! ยินดีต้อนรับสู่ระบบช่วยเหลือ บาลีส่วนฐี (Pali Assistant Bot) มีข้อสงสัยเรื่องไวยากรณ์บาลี หรือต้องการทดสอบความรู้ สามารถพิมพ์ถามได้เลยครับ 🙏',
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const generateBotReply = (text: string): { replyText: string; options?: string[]; correctAnswer?: number; explanation?: string } => {
    const query = text.toLowerCase().trim();

    if (query.includes('สุ่มคำถาม') || query.includes('โจทย์') || query.includes('ทดสอบ') || query.includes('บาลี')) {
      const q = QUESTION_BANK[Math.floor(Math.random() * QUESTION_BANK.length)];
      return {
        replyText: `🎲 โจทย์ทดสอบความรู้หมวด [${q.category}]:\n\n"${q.questionText}"`,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      };
    }

    if (query.includes('วิภัตติ')) {
      return {
        replyText: '📖 **ความรู้วิภัตติบาลี (Case Endings)**:\n\nวิภัตติในภาษาบาลีมี 7 แผนก ได้แก่:\n1. ปฐมา (ผู้/อันว่า)\n2. ทุติยา (ซึ่ง/สู่/ยัง)\n3. ตติยา (ด้วย/โดย/เพราะ)\n4. จตุตถี (แก่/เพื่อ/ต่อ)\n5. ปัญจมี (แต่/จาก/กว่า)\n6. ฉัฏฐี (แห่ง/ของ/เมื่อ)\n7. สัตตมี (ใน/บน/ที่)\n\nพิมพ์ "สุ่มคำถาม" เพื่อทดสอบข้อสอบวิภัตติได้เลยครับ!',
      };
    }

    if (query.includes('สมาส')) {
      return {
        replyText: '🧩 **ความรู้เรื่องสมาสบาลี (Compounds)**:\n\nสมาสคือการนำนามนามตั้งแต่ 2 ศัพท์ขึ้นไปมารวมกันเป็นบทเดียว มี 6 ประเภทหลัก:\n1. กัมมธารยสมาส\n2. ทิคุสมาส\n3. ตัปปุริสสมาส\n4. ทวันทวสมาส\n5. อัพยยีภาวสมาส\n6. พหุพพิหิสมาส',
      };
    }

    if (query.includes('สนธิ')) {
      return {
        replyText: '🔗 **ความรู้เรื่องสนธิ (Phonetic Combination)**:\n\nสนธิ คือการต่อศัพท์ให้เนื่องกันด้วยสระ พยัญชนะ หรือ นิคหิต แบ่งเป็น 3 สนธิหลัก:\n1. สระสนธิ (ต่อสระ)\n2. พยัญชนะสนธิ (ต่อพยัญชนะ)\n3. นิคหิตสนธิ (ต่อระฆัง/นิคหิต ํ)',
      };
    }

    if (query.includes('กฎ') || query.includes('กติกา') || query.includes('วิธีเล่น')) {
      return {
        replyText: '🎲 **กฎกติกาการเล่น บาลีส่วนฐี (Pali Tycoon)**:\n\n1. ทอยลูกเต๋าเดินตามช่อง 40 วิชา\n2. ต้องวิ่งครบรอบ 1 ก่อนจึงจะเริ่มซื้อวิชาได้ (รับโบนัสฟรี +500 แต้ม!)\n3. ตอบคำถามถูกเพื่อซื้อวิชา หรือตอบถูกขณะตกเมืองคนอื่นเพื่อลดค่าผ่านทาง 50%\n4. ทอยได้ลูกเต๋าคู่ (Doubles) จะได้สิทธิ์ทอยซ้ำ\n5. ตอบผิดข้อสอบจะถูกบันทึกลง "สมุดทบทวน" ให้ฝึกฝนซ้ำแบบ Spaced Repetition',
      };
    }

    if (query.includes('สวัสดี') || query.includes('หวัดดี') || query.includes('สาธุ')) {
      return {
        replyText: 'สาธุ! ขอให้เกิดปัญญาสว่างไสวในการเรียนรู้ภาษาบาลีครับ 🙏 พิมพ์ "สุ่มคำถาม" เพื่อเริ่มทดสอบความรู้ได้เลย!',
      };
    }

    return {
      replyText: `ขออภัยครับ ศิษย์พี่ AI ยังไม่เข้าใจคำถามเกี่ยวกับ "${text}"\n\nลองเลือกหัวข้อที่สนใจด้านล่าง หรือพิมพ์ว่า "สุ่มคำถาม" เพื่อทดสอบโจทย์บาลีได้ครับ 🙏`,
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: time,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');

    setTimeout(() => {
      const botResponse = generateBotReply(text);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botResponse.replyText,
        options: botResponse.options,
        correctAnswer: botResponse.correctAnswer,
        explanation: botResponse.explanation,
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 600);
  };

  const handleOptionClick = (optionIdx: number, msg: Message) => {
    if (msg.correctAnswer === undefined) return;
    const isCorrect = optionIdx === msg.correctAnswer;
    const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    if (isCorrect) {
      audioManager.playSathuChime();
    } else {
      audioManager.playTempleBell();
    }

    const replyMsg: Message = {
      id: Date.now().toString(),
      sender: 'bot',
      text: isCorrect
        ? `✨ **ตอบถูกต้อง! (สาธุ)**\n${msg.explanation || ''}`
        : `❌ **ยังไม่ถูกต้องครับ**\n${msg.explanation || ''}`,
      timestamp: time,
    };

    setMessages((prev) => [...prev, replyMsg]);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f39c12, #d4af37)',
          border: '2px solid #ffffff',
          boxShadow: '0 6px 20px rgba(212, 175, 55, 0.6)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          transition: 'transform 0.2s ease',
        }}
        title="ศิษย์พี่ AI ตอบคำถามบาลี"
      >
        {isOpen ? <X size={28} color="#000" /> : <Bot size={30} color="#000" />}
      </button>

      {isOpen && (
        <div
          className="glass-panel chat-widget-window"
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            width: 'min(90vw, 380px)',
            height: '520px',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            overflow: 'hidden',
            border: '2px solid var(--primary-gold)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3), rgba(16, 25, 50, 0.9))',
              borderBottom: '1px solid var(--border-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--primary-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                }}
              >
                🧘‍♂️
              </div>
              <div>
                <h3 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--primary-gold)' }}>
                  ศิษย์พี่ AI (Pali Assistant)
                </h3>
                <span style={{ fontSize: '0.68rem', color: '#4ade80' }}>🟢 ออนไลน์ • ตอบกลับอัตโนมัติ</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="secondary-button" style={{ padding: '4px' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: msg.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    background: msg.sender === 'user' ? 'linear-gradient(135deg, #d4af37, #aa7c11)' : 'rgba(255,255,255,0.08)',
                    color: msg.sender === 'user' ? '#000' : '#fff',
                    fontSize: '0.85rem',
                    lineHeight: 1.4,
                    whiteSpace: 'pre-line',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  {msg.text}

                  {msg.options && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {msg.options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleOptionClick(idx, msg)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(20, 30, 60, 0.9)',
                            border: '1px solid var(--primary-gold)',
                            color: '#fff',
                            fontSize: '0.78rem',
                            textAlign: 'left',
                            cursor: 'pointer',
                          }}
                        >
                          {idx + 1}. {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                  {msg.timestamp}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div
            style={{
              padding: '6px 10px',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(0,0,0,0.2)',
            }}
          >
            <button
              onClick={() => handleSendMessage('สุ่มคำถาม')}
              className="secondary-button"
              style={{ padding: '4px 8px', fontSize: '0.7rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Sparkles size={12} color="var(--primary-gold)" />
              🎲 สุ่มคำถาม
            </button>
            <button
              onClick={() => handleSendMessage('วิภัตติ')}
              className="secondary-button"
              style={{ padding: '4px 8px', fontSize: '0.7rem', whiteSpace: 'nowrap' }}
            >
              📖 วิภัตติ
            </button>
            <button
              onClick={() => handleSendMessage('สมาส')}
              className="secondary-button"
              style={{ padding: '4px 8px', fontSize: '0.7rem', whiteSpace: 'nowrap' }}
            >
              🧩 สมาส
            </button>
            <button
              onClick={() => handleSendMessage('กฎการเล่นเกม')}
              className="secondary-button"
              style={{ padding: '4px 8px', fontSize: '0.7rem', whiteSpace: 'nowrap' }}
            >
              💡 กฎการเล่น
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: '8px 10px',
              display: 'flex',
              gap: '8px',
              background: 'rgba(10, 17, 40, 0.95)',
              borderTop: '1px solid var(--border-gold)',
            }}
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="พิมพ์คำถาม หรือ 'บาลี'..."
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: '0.85rem',
              }}
            />
            <button
              type="submit"
              className="gold-button"
              style={{ padding: '8px 12px', borderRadius: '10px' }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

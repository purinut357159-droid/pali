import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import type { InGameChatMessage } from '../types/multiplayer';
import { multiplayerService } from '../utils/multiplayerService';
import { audioManager } from '../utils/audioManager';

interface Props {
  isOnline: boolean;
  currentRoomCode?: string | null;
}

const QUICK_EMOTES = [
  { emoji: '🙏', label: 'สาธุ!' },
  { emoji: '🔥', label: 'ร้อนแรง!' },
  { emoji: '🎉', label: 'ยินดีด้วย!' },
  { emoji: '😂', label: 'เกือบแล้ว!' },
  { emoji: '⚔️', label: 'ขอท้าดวล!' },
  { emoji: '🎲', label: 'ลูกเต๋าเป็นใจ!' },
  { emoji: '👑', label: 'สุดยอดมหาเปรียญ!' },
];

export const InGameOnlineChat: React.FC<Props> = ({ isOnline, currentRoomCode }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<InGameChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [floatingEmote, setFloatingEmote] = useState<{ emoji: string; senderName: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOnline) return;

    const unsub = multiplayerService.on('ingame_chat', (msg: InGameChatMessage) => {
      setMessages((prev) => [...prev, msg]);

      if (msg.type === 'emote') {
        setFloatingEmote({ emoji: msg.text, senderName: msg.senderName });
        setTimeout(() => setFloatingEmote(null), 3000);
      }

      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
        audioManager.playDiceRoll();
      }
    });

    return () => {
      unsub();
    };
  }, [isOnline, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  if (!isOnline) return null;

  const handleSend = (textToSend?: string, isEmote: boolean = false) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    multiplayerService.sendInGameChat(text, isEmote ? 'emote' : 'chat');
    setInputText('');

    if (isEmote) {
      setFloatingEmote({ emoji: text, senderName: 'ท่าน' });
      setTimeout(() => setFloatingEmote(null), 3000);
    }
  };

  return (
    <>
      {/* Floating Big Emote Animation */}
      {floatingEmote && (
        <div
          style={{
            position: 'fixed',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1500,
            pointerEvents: 'none',
            animation: 'fadeIn 0.3s ease, floatUp 2.8s ease-out',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <div
            style={{
              fontSize: '4rem',
              filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.6))',
            }}
          >
            {floatingEmote.emoji}
          </div>
          <div
            style={{
              background: 'rgba(9, 14, 26, 0.85)',
              border: '1px solid var(--primary-gold)',
              borderRadius: '20px',
              padding: '2px 12px',
              fontSize: '0.8rem',
              color: 'var(--primary-gold)',
              fontWeight: 700,
            }}
          >
            {floatingEmote.senderName}
          </div>
        </div>
      )}

      {/* Floating Chat Button / Widget */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          zIndex: 950,
        }}
      >
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className="glass-panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '30px',
              border: '1.5px solid var(--primary-gold)',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3), rgba(16, 25, 50, 0.95))',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 16px var(--gold-glow)',
              position: 'relative',
            }}
          >
            <MessageSquare size={18} color="var(--primary-gold)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>แชทในห้อง ({currentRoomCode})</span>

            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.6)',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
        ) : (
          /* Opened Chat Panel */
          <div
            className="glass-panel"
            style={{
              width: '320px',
              height: '380px',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '16px',
              border: '1.5px solid var(--primary-gold)',
              boxShadow: '0 12px 36px rgba(0,0,0,0.7), 0 0 20px var(--gold-glow)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '10px 14px',
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(16, 25, 50, 0.95))',
                borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1rem' }}>💬</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-gold)' }}>
                  แชทห้อง {currentRoomCode}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages Area */}
            <div
              style={{
                flex: 1,
                padding: '10px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: 'rgba(10, 16, 35, 0.7)',
              }}
            >
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '40px' }}>
                  ส่งข้อความหรืออิโมจิให้เพื่อนในห้องได้เลย! 🎲
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      padding: '6px 10px',
                      background: msg.type === 'emote' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      border: msg.type === 'emote' ? '1px solid rgba(212, 175, 55, 0.3)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 700, color: msg.senderColor || 'var(--primary-gold)', fontSize: '0.72rem' }}>
                        {msg.senderAvatar} {msg.senderName}
                      </span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{msg.timestamp}</span>
                    </div>
                    <div style={{ color: '#fff', fontSize: msg.type === 'emote' ? '1.1rem' : '0.82rem' }}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Emotes Bar */}
            <div
              style={{
                padding: '4px 8px',
                display: 'flex',
                gap: '4px',
                overflowX: 'auto',
                background: 'rgba(0, 0, 0, 0.3)',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              {QUICK_EMOTES.map((item) => (
                <button
                  key={item.emoji}
                  onClick={() => handleSend(item.emoji, true)}
                  style={{
                    padding: '3px 6px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                  title={item.label}
                >
                  {item.emoji}
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{
                padding: '8px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                gap: '6px',
                background: 'rgba(10, 16, 35, 0.9)',
              }}
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="พิมพ์ข้อความ..."
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                className="gold-button"
                style={{ padding: '6px 10px', fontSize: '0.8rem', borderRadius: '8px' }}
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

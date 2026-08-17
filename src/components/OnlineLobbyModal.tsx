import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  LogIn,
  Users,
  Copy,
  Check,
  Share2,
  Play,
  Bot,
  Crown,
  Sparkles,
  Send,
  Radio,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import type { UserAccount } from '../types/auth';
import type { GameMode } from '../types/game';
import type { RoomMember, RoomSettings, LobbyChatMessage } from '../types/multiplayer';
import { CHARACTERS } from '../data/charactersData';
import { multiplayerService, MultiplayerService } from '../utils/multiplayerService';
import { getFriends, sendGameInvite } from '../utils/friendService';
import { audioManager } from '../utils/audioManager';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onOpenAuthModal?: () => void;
  onStartOnlineGame: (roomMembers: RoomMember[], settings: RoomSettings) => void;
  initialRoomCode?: string | null;
  onOpenFriends?: () => void;
}

const PLAYER_COLORS = ['#f59e0b', '#3b82f6', '#ec4899', '#10b981'];

export const OnlineLobbyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onStartOnlineGame,
  initialRoomCode,
  onOpenFriends,
}) => {
  const [view, setView] = useState<'create' | 'join' | 'public' | 'lobby'>(
    initialRoomCode ? 'join' : 'create'
  );

  // Form states
  const [roomName, setRoomName] = useState<string>('');
  const [gameMode, setGameMode] = useState<GameMode>('points');
  const [maxRounds, setMaxRounds] = useState<number>(20);
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  const [inputRoomCode, setInputRoomCode] = useState<string>(initialRoomCode || '');
  const [selectedCharId, setSelectedCharId] = useState<string>(
    currentUser?.favoriteCharacter || 'monk'
  );
  const [selectedColor, setSelectedColor] = useState<string>(PLAYER_COLORS[0]);

  // Lobby state
  const [roomSettings, setRoomSettings] = useState<RoomSettings | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [publicRooms, setPublicRooms] = useState<any[]>([]);

  // Lobby Chat
  const [chatMessages, setChatMessages] = useState<LobbyChatMessage[]>([]);
  const [inputChat, setInputChat] = useState<string>('');
  const [showInviteFriendsPopup, setShowInviteFriendsPopup] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'danger' | 'info' } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const showToast = (text: string, type: 'success' | 'danger' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  };

  useEffect(() => {
    if (initialRoomCode) {
      setInputRoomCode(initialRoomCode);
      setView('join');
    }
  }, [initialRoomCode]);

  useEffect(() => {
    if (isOpen) {
      setPublicRooms(MultiplayerService.getPublicRooms());
    }
  }, [isOpen, view]);

  // Listen to multiplayer network events
  useEffect(() => {
    if (!isOpen) return;

    const unsubs = [
      multiplayerService.on('room_state_change', ({ settings, members }: any) => {
        setRoomSettings(settings);
        setMembers(members);
        if (settings) {
          setView('lobby');
        }
      }),

      multiplayerService.on('member_joined', (member: RoomMember) => {
        audioManager.playSathuChime();
        showToast(`${member.displayName} เข้าร่วมห้องแล้ว!`, 'success');
      }),

      multiplayerService.on('member_left', () => {
        showToast('ผู้เล่นออกจากห้อง', 'info');
      }),

      multiplayerService.on('lobby_chat', (msg: LobbyChatMessage) => {
        setChatMessages((prev) => [...prev, msg]);
      }),

      multiplayerService.on('game_start', (config: any) => {
        audioManager.playUpgradeSound();
        onStartOnlineGame(config.members || members, config.settings || roomSettings);
      }),
    ];

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [isOpen, members, roomSettings, onStartOnlineGame]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, view]);

  if (!isOpen) return null;

  const currentMember = members.find((m) => m.id === multiplayerService.currentMemberId);
  const isHost = multiplayerService.isHost;

  const handleCreateRoom = async () => {
    const defaultChar = CHARACTERS.find((c) => c.id === selectedCharId) || CHARACTERS[0];
    const hostInfo = {
      userId: currentUser?.id,
      displayName: currentUser ? currentUser.displayName : 'เจ้าสำนัก (Host)',
      avatar: currentUser ? currentUser.avatar : defaultChar.avatar,
      character: defaultChar,
      color: selectedColor,
      isReady: true,
      joinedAt: Date.now(),
    };

    const res = await multiplayerService.createRoom(
      {
        roomName: roomName.trim() || `ห้องสำนักเรียนของ ${hostInfo.displayName}`,
        mode: gameMode,
        maxRounds,
        maxPlayers,
        isPrivate: false,
      },
      hostInfo
    );

    if (res.success) {
      audioManager.playSathuChime();
      setChatMessages([
        {
          id: 'init_sys',
          senderId: 'sys',
          senderName: 'ระบบ',
          senderAvatar: '🏛️',
          text: `ยินดีต้อนรับสู่ห้อง ${res.roomCode}! สามารถส่งรหัสห้องหรือกดชวนเพื่อนเข้าร่วมแข่งขันได้เลย`,
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          isSystem: true,
        },
      ]);
    }
  };

  const handleJoinRoom = async (codeToJoin?: string) => {
    const code = (codeToJoin || inputRoomCode).trim().toUpperCase();
    if (!code) {
      showToast('กรุณาระบุรหัสห้อง', 'danger');
      return;
    }

    const defaultChar = CHARACTERS.find((c) => c.id === selectedCharId) || CHARACTERS[0];
    const memberInfo = {
      userId: currentUser?.id,
      displayName: currentUser ? currentUser.displayName : `ผู้เข้าสอบ #${Math.floor(Math.random() * 900 + 100)}`,
      avatar: currentUser ? currentUser.avatar : defaultChar.avatar,
      character: defaultChar,
      color: selectedColor,
      isReady: false,
      joinedAt: Date.now(),
    };

    const res = await multiplayerService.joinRoom(code, memberInfo);
    if (res.success) {
      audioManager.playSathuChime();
      setChatMessages([
        {
          id: 'init_sys',
          senderId: 'sys',
          senderName: 'ระบบ',
          senderAvatar: '🏛️',
          text: `เชื่อมต่อกับห้อง ${code} เรียบร้อยแล้ว!`,
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          isSystem: true,
        },
      ]);
    }
  };

  const handleLeaveLobby = () => {
    multiplayerService.leaveRoom();
    setRoomSettings(null);
    setMembers([]);
    setChatMessages([]);
    setView('create');
  };

  const handleAddAiBot = () => {
    if (!isHost || !roomSettings || members.length >= roomSettings.maxPlayers) return;

    const aiIndex = members.length;
    const aiChars = [CHARACTERS[1], CHARACTERS[2], CHARACTERS[3], CHARACTERS[0]];
    const aiNames = ['พระอาจารย์ AI', 'ศิษย์พี่ AI', 'มหา AI', 'สามเณร AI'];
    const chosenChar = aiChars[aiIndex % aiChars.length];

    const aiMember: RoomMember = {
      id: `bot_${Date.now()}_${aiIndex}`,
      displayName: aiNames[aiIndex % aiNames.length],
      avatar: chosenChar.avatar,
      character: chosenChar,
      color: PLAYER_COLORS[aiIndex % PLAYER_COLORS.length],
      isHost: false,
      isReady: true,
      isAi: true,
      joinedAt: Date.now(),
    };

    const updated = [...members, aiMember];
    setMembers(updated);
    multiplayerService.members = updated;
    multiplayerService.sendPacket('ROOM_STATE_SYNC', { settings: roomSettings, members: updated });
    audioManager.playSathuChime();
  };

  const handleRemoveMember = (memberId: string) => {
    if (!isHost) return;
    const updated = members.filter((m) => m.id !== memberId);
    setMembers(updated);
    multiplayerService.members = updated;
    multiplayerService.sendPacket('ROOM_STATE_SYNC', { settings: roomSettings, members: updated });
  };

  const handleCharacterChange = (charId: string) => {
    setSelectedCharId(charId);
    const char = CHARACTERS.find((c) => c.id === charId) || CHARACTERS[0];
    multiplayerService.updateMyMember({ character: char, avatar: char.avatar });
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    multiplayerService.updateMyMember({ color });
  };

  const handleToggleReady = () => {
    multiplayerService.toggleReady();
    audioManager.playDiceRoll();
  };

  const handleCopyCode = () => {
    if (!roomSettings) return;
    navigator.clipboard.writeText(roomSettings.roomCode);
    setCopiedCode(true);
    showToast(`คัดลอกรหัสห้อง ${roomSettings.roomCode} แล้ว!`, 'success');
    audioManager.playSathuChime();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!roomSettings) return;
    const link = `${window.location.origin}${window.location.pathname}?room=${roomSettings.roomCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    showToast('คัดลอกลิงก์คำเชิญเข้าห้องเรียบร้อย!', 'success');
    audioManager.playSathuChime();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendChat = (textToSend?: string) => {
    const text = (textToSend || inputChat).trim();
    if (!text) return;

    multiplayerService.sendLobbyChat(text);
    setInputChat('');
  };

  const handleStartGameClick = () => {
    if (!isHost || !roomSettings) return;

    if (members.length < 2) {
      showToast('ต้องมีผู้เล่นหรือบอท AI อย่างน้อย 2 คนจึงจะเริ่มเล่นได้', 'danger');
      return;
    }

    const allReady = members.every((m) => m.isReady || m.isAi);
    if (!allReady) {
      showToast('รอให้ผู้เล่นทุกคนกดยืนยัน "พร้อมแล้ว" ก่อนเริ่มเกม', 'danger');
      return;
    }

    multiplayerService.startGame({ members, settings: roomSettings });
  };

  const myFriends = currentUser ? getFriends(currentUser.id) : [];

  return (
    <div className="modal-overlay" style={{ zIndex: 1150 }}>
      <div
        className="glass-panel"
        style={{
          width: '95%',
          maxWidth: view === 'lobby' ? '860px' : '640px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.25s ease-out',
          border: '1.5px solid var(--primary-gold)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.8), 0 0 30px var(--gold-glow)',
          transition: 'max-width 0.3s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(16, 25, 50, 0.95))',
            borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #38bdf8, #d4af37)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                boxShadow: '0 4px 12px rgba(56, 189, 248, 0.4)',
              }}
            >
              🌐
            </div>
            <div>
              <h2 className="gold-gradient-text" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                {view === 'lobby' ? `ห้องรอเล่น: ${roomSettings?.roomCode}` : 'เล่นออนไลน์กับเพื่อน (Online Room)'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {view === 'lobby'
                  ? `โหมด: ${roomSettings?.mode === 'points' ? 'แต้มสะสมปัญญา' : 'มหาเศรษฐี'} (${roomSettings?.maxRounds} รอบ) • ผู้เล่น ${members.length}/${roomSettings?.maxPlayers} คน`
                  : 'สร้างห้องแข่งขัน หรือเข้าร่วมห้องของเพื่อนด้วยรหัสผ่านเครือข่าย WebRTC'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {view === 'lobby' && (
              <button
                onClick={handleLeaveLobby}
                className="secondary-button"
                style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px', color: '#f87171' }}
              >
                ออกจากห้อง
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div
            style={{
              padding: '8px 16px',
              margin: '10px 20px 0 20px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background:
                toastMessage.type === 'success'
                  ? 'rgba(16, 185, 129, 0.25)'
                  : toastMessage.type === 'danger'
                  ? 'rgba(239, 68, 68, 0.25)'
                  : 'rgba(56, 189, 248, 0.25)',
              border:
                toastMessage.type === 'success'
                  ? '1px solid #10b981'
                  : toastMessage.type === 'danger'
                  ? '1px solid #ef4444'
                  : '1px solid #38bdf8',
              color:
                toastMessage.type === 'success'
                  ? '#34d399'
                  : toastMessage.type === 'danger'
                  ? '#f87171'
                  : '#7dd3fc',
            }}
          >
            <Sparkles size={16} />
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* VIEW 1: CREATION / JOIN TABS */}
        {view !== 'lobby' && (
          <div>
            {/* Nav Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '0 20px',
              }}
            >
              <button
                onClick={() => setView('create')}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  background: view === 'create' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                  border: 'none',
                  borderBottom: view === 'create' ? '2.5px solid var(--primary-gold)' : '2.5px solid transparent',
                  color: view === 'create' ? 'var(--primary-gold)' : 'var(--text-muted)',
                  fontWeight: view === 'create' ? 700 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={16} />
                <span>สร้างห้องใหม่</span>
              </button>

              <button
                onClick={() => setView('join')}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  background: view === 'join' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                  border: 'none',
                  borderBottom: view === 'join' ? '2.5px solid var(--primary-gold)' : '2.5px solid transparent',
                  color: view === 'join' ? 'var(--primary-gold)' : 'var(--text-muted)',
                  fontWeight: view === 'join' ? 700 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <LogIn size={16} />
                <span>เข้าร่วมด้วยรหัส</span>
              </button>

              <button
                onClick={() => setView('public')}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  background: view === 'public' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                  border: 'none',
                  borderBottom: view === 'public' ? '2.5px solid var(--primary-gold)' : '2.5px solid transparent',
                  color: view === 'public' ? 'var(--primary-gold)' : 'var(--text-muted)',
                  fontWeight: view === 'public' ? 700 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Radio size={16} />
                <span>ห้องสาธารณะ ({publicRooms.length})</span>
              </button>
            </div>

            <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
              {/* Character selection sub-picker */}
              <div
                style={{
                  padding: '14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  marginBottom: '16px',
                }}
              >
                <label style={{ fontSize: '0.82rem', color: 'var(--primary-gold)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                  👤 เลือกตัวละครและสีตัวหมากของท่าน:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {CHARACTERS.map((char) => {
                    const isSelected = selectedCharId === char.id;
                    return (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => setSelectedCharId(char.id)}
                        style={{
                          padding: '8px 4px',
                          background: isSelected ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: isSelected ? '2px solid var(--primary-gold)' : '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          color: '#fff',
                        }}
                      >
                        <span style={{ fontSize: '1.6rem' }}>{char.avatar}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: isSelected ? 700 : 500 }}>{char.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Color choices */}
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>สีตัวหมาก:</span>
                  {PLAYER_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleColorChange(c)}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: c,
                        border: selectedColor === c ? '2.5px solid #fff' : '1px solid transparent',
                        cursor: 'pointer',
                        transform: selectedColor === c ? 'scale(1.2)' : 'none',
                        transition: 'all 0.15s',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* CREATE TAB */}
              {view === 'create' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      ชื่อห้องแข่งขัน (ไม่บังคับ):
                    </label>
                    <input
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder={`ห้องสำนักเรียนของ ${currentUser ? currentUser.displayName : 'ท่าน'}`}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '0.9rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                      โหมดการแข่งขัน:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {[
                        { id: 'points', label: 'แต้มสะสมปัญญา', icon: '🏆', desc: 'ผู้มีแต้มสูงสุดเมื่อจบรอบเป็นผู้ชนะ' },
                        { id: 'monopoly', label: 'มหาเศรษฐีบาลี', icon: '🏛️', desc: 'เน้นครอบครองวิชาและอัปเกรดสำนัก' },
                        { id: 'last_standing', label: 'อยู่รอดคนสุดท้าย', icon: '⚡', desc: 'ผู้เล่นที่แต้มหมดจะตกรอบ' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setGameMode(m.id as GameMode)}
                          style={{
                            padding: '10px',
                            background: gameMode === m.id ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.03)',
                            border: gameMode === m.id ? '1.5px solid var(--primary-gold)' : '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            color: '#fff',
                            textAlign: 'left',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ fontSize: '1.2rem', marginBottom: '2px' }}>{m.icon}</div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{m.label}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>{m.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '160px' }}>
                      <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                        จำนวนรอบสูงสุด:
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[10, 15, 20, 30].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setMaxRounds(r)}
                            style={{
                              flex: 1,
                              padding: '8px 4px',
                              background: maxRounds === r ? 'var(--primary-gold)' : 'rgba(255,255,255,0.05)',
                              color: maxRounds === r ? '#090e1a' : '#fff',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              borderRadius: '8px',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            {r} รอบ
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: '160px' }}>
                      <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                        จำนวนผู้เล่นสูงสุด:
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[2, 3, 4].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setMaxPlayers(p)}
                            style={{
                              flex: 1,
                              padding: '8px 4px',
                              background: maxPlayers === p ? 'var(--primary-gold)' : 'rgba(255,255,255,0.05)',
                              color: maxPlayers === p ? '#090e1a' : '#fff',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              borderRadius: '8px',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            {p} คน
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCreateRoom}
                    className="gold-button"
                    style={{
                      marginTop: '10px',
                      padding: '12px',
                      fontSize: '1rem',
                      justifyContent: 'center',
                      borderRadius: '12px',
                    }}
                  >
                    <Crown size={18} />
                    <span>สร้างห้องแข่งขันและเริ่มล็อบบี้</span>
                  </button>
                </div>
              )}

              {/* JOIN TAB */}
              {view === 'join' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--primary-gold)', fontWeight: 700, display: 'block', marginBottom: '10px' }}>
                      กรอกรหัสห้อง 6 ตัวอักษร (เช่น PALI-7722):
                    </label>
                    <input
                      type="text"
                      value={inputRoomCode}
                      onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                      placeholder="PALI-XXXX"
                      maxLength={12}
                      style={{
                        padding: '12px 20px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '2px solid var(--primary-gold)',
                        borderRadius: '14px',
                        color: 'var(--primary-gold)',
                        fontSize: '1.6rem',
                        fontWeight: 800,
                        letterSpacing: '2px',
                        textAlign: 'center',
                        width: '100%',
                        maxWidth: '280px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <button
                    onClick={() => handleJoinRoom()}
                    className="gold-button"
                    style={{
                      padding: '12px',
                      fontSize: '1rem',
                      justifyContent: 'center',
                      borderRadius: '12px',
                    }}
                  >
                    <LogIn size={18} />
                    <span>เข้าร่วมห้องแข่งขัน</span>
                  </button>
                </div>
              )}

              {/* PUBLIC ROOMS TAB */}
              {view === 'public' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ห้องที่กำลังเปิดรับสมัครผู้เล่น:</span>
                    <button
                      onClick={() => setPublicRooms(MultiplayerService.getPublicRooms())}
                      className="secondary-button"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
                    >
                      <RefreshCw size={13} /> รีเฟรช
                    </button>
                  </div>

                  {publicRooms.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                      <Radio size={36} style={{ opacity: 0.5, marginBottom: '8px' }} />
                      <p style={{ fontSize: '0.88rem' }}>ยังไม่มีห้องสาธารณะที่เปิดอยู่ในขณะนี้</p>
                      <button onClick={() => setView('create')} className="gold-button" style={{ marginTop: '10px', fontSize: '0.8rem', padding: '6px 14px' }}>
                        สร้างห้องคนแรกเลย!
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {publicRooms.map((room) => (
                        <div
                          key={room.roomCode}
                          style={{
                            padding: '12px 16px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            borderRadius: '10px',
                            border: '1px solid rgba(212, 175, 55, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '10px',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>
                              {room.roomName} <code style={{ color: 'var(--primary-gold)', fontSize: '0.8rem' }}>({room.roomCode})</code>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              เจ้าสำนัก: {room.hostName} • โหมด: {room.mode} • {room.maxRounds} รอบ
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                              👥 {room.playerCount}/{room.maxPlayers} คน
                            </span>
                            <button
                              onClick={() => handleJoinRoom(room.roomCode)}
                              className="gold-button"
                              style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '8px' }}
                            >
                              เข้าร่วม
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: LOBBY ROOM */}
        {view === 'lobby' && roomSettings && (
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
            {/* Top Room Info & Share Bar */}
            <div
              style={{
                padding: '12px 20px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>รหัสห้อง:</span>
                <span
                  style={{
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3), rgba(245, 158, 11, 0.2))',
                    border: '1.5px solid var(--primary-gold)',
                    borderRadius: '8px',
                    padding: '4px 12px',
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: 'var(--primary-gold)',
                    letterSpacing: '1px',
                  }}
                >
                  {roomSettings.roomCode}
                </span>

                <button
                  onClick={handleCopyCode}
                  className="secondary-button"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="คัดลอกรหัสห้อง"
                >
                  {copiedCode ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                  <span>{copiedCode ? 'คัดลอกแล้ว' : 'คัดลอกรหัส'}</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="secondary-button"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="คัดลอกลิงก์คำเชิญ"
                >
                  {copiedLink ? <Check size={14} color="#34d399" /> : <Share2 size={14} />}
                  <span>{copiedLink ? 'คัดลอกแล้ว' : 'แชร์ลิงก์'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setShowInviteFriendsPopup(!showInviteFriendsPopup)}
                  className="gold-button"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px' }}
                >
                  <UserPlus size={15} />
                  <span>ชวนเพื่อน ({myFriends.length})</span>
                </button>
              </div>
            </div>

            {/* Friends Quick Invite Drawer */}
            {showInviteFriendsPopup && (
              <div
                style={{
                  padding: '12px 20px',
                  background: 'rgba(16, 25, 50, 0.95)',
                  borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--primary-gold)', fontWeight: 700 }}>
                    👥 ส่งคำเชิญเข้าห้องถึงเพื่อนของท่าน:
                  </span>
                  <button
                    onClick={() => setShowInviteFriendsPopup(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={15} />
                  </button>
                </div>

                {myFriends.length === 0 ? (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    ท่านยังไม่มีรายชื่อเพื่อน{' '}
                    <button
                      onClick={() => {
                        setShowInviteFriendsPopup(false);
                        onOpenFriends?.();
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--primary-gold)', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      เปิดระบบเพื่อนเพื่อแอดเพื่อนใหม่
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {myFriends.map((f) => (
                      <div
                        key={f.id}
                        style={{
                          padding: '6px 10px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '8px',
                          border: '1px solid rgba(212,175,55,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexShrink: 0,
                        }}
                      >
                        <span>{f.avatar}</span>
                        <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>{f.displayName}</span>
                        <button
                          onClick={() => {
                            if (currentUser) {
                              sendGameInvite(currentUser, f.id, roomSettings.roomCode);
                              showToast(`ส่งคำเชิญถึง ${f.displayName} แล้ว!`, 'success');
                              audioManager.playSathuChime();
                            }
                          }}
                          className="gold-button"
                          style={{ padding: '3px 8px', fontSize: '0.7rem', borderRadius: '6px' }}
                        >
                          ส่งคำชวน
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Lobby Grid Layout: Players on Left, Chat on Right */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '16px',
                padding: '16px 20px',
                flex: 1,
                overflowY: 'auto',
              }}
            >
              {/* Player Slots */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ fontSize: '0.88rem', color: 'var(--primary-gold)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} />
                  <span>ผู้เข้าร่วมการแข่งขัน ({members.length}/{roomSettings.maxPlayers})</span>
                </h4>

                {Array.from({ length: roomSettings.maxPlayers }).map((_, slotIdx) => {
                  const member = members[slotIdx];
                  const isMe = member?.id === multiplayerService.currentMemberId;

                  if (member) {
                    return (
                      <div
                        key={member.id}
                        style={{
                          padding: '12px 16px',
                          background: isMe ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                          borderRadius: '12px',
                          border: isMe ? '1.5px solid var(--primary-gold)' : '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ position: 'relative' }}>
                            <div
                              style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                background: member.color || '#d4af37',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.8rem',
                                boxShadow: `0 4px 12px ${member.color}66`,
                              }}
                            >
                              {member.avatar}
                            </div>
                            {member.isHost && (
                              <span
                                style={{
                                  position: 'absolute',
                                  top: -6,
                                  left: -6,
                                  background: 'linear-gradient(135deg, #f59e0b, #d4af37)',
                                  borderRadius: '50%',
                                  padding: '2px',
                                  fontSize: '0.75rem',
                                }}
                                title="เจ้าสำนัก (Host)"
                              >
                                👑
                              </span>
                            )}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ fontSize: '0.95rem', color: '#fff' }}>
                                {member.displayName} {isMe && '(ท่าน)'}
                              </strong>
                              {member.isAi && (
                                <span style={{ fontSize: '0.65rem', background: '#3b82f6', color: '#fff', padding: '1px 5px', borderRadius: '6px' }}>
                                  BOT AI
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              ตัวละคร: <span style={{ color: 'var(--primary-gold)' }}>{member.character.name}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {member.isReady || member.isHost || member.isAi ? (
                            <span
                              style={{
                                background: 'rgba(16, 185, 129, 0.2)',
                                border: '1px solid #10b981',
                                color: '#34d399',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Check size={14} /> พร้อมแล้ว
                            </span>
                          ) : (
                            <span
                              style={{
                                background: 'rgba(245, 158, 11, 0.2)',
                                border: '1px solid #f59e0b',
                                color: '#fbbf24',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}
                            >
                              ⏳ เตรียมตัว
                            </span>
                          )}

                          {isHost && !member.isHost && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#f87171',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                              }}
                              title="เตะออกจากห้อง"
                            >
                              เตะ
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Empty Slot
                  return (
                    <div
                      key={`empty_${slotIdx}`}
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.015)',
                        borderRadius: '12px',
                        border: '1.5px dashed rgba(255, 255, 255, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <span style={{ fontSize: '1.4rem', opacity: 0.4 }}>👤</span>
                        <span>ช่องผู้เล่นที่ {slotIdx + 1} (รอผู้เล่นเข้าร่วม)</span>
                      </div>

                      {isHost && (
                        <button
                          onClick={handleAddAiBot}
                          className="secondary-button"
                          style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Bot size={13} />
                          <span>+ เพิ่มบอท AI</span>
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Character Picker for current user */}
                {currentMember && (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      border: '1px solid rgba(212, 175, 55, 0.2)',
                      marginTop: '6px',
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', color: 'var(--primary-gold)', marginBottom: '6px', fontWeight: 600 }}>
                      เปลี่ยนตัวละครของท่าน:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      {CHARACTERS.map((char) => (
                        <button
                          key={char.id}
                          type="button"
                          onClick={() => handleCharacterChange(char.id)}
                          style={{
                            padding: '6px 2px',
                            background: currentMember.character.id === char.id ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255,255,255,0.03)',
                            border: currentMember.character.id === char.id ? '1.5px solid var(--primary-gold)' : '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.72rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                        >
                          <span style={{ fontSize: '1.2rem' }}>{char.avatar}</span>
                          <span>{char.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Lobby Real-Time Chat */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(10, 16, 35, 0.8)',
                  borderRadius: '14px',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  overflow: 'hidden',
                  height: '340px',
                }}
              >
                <div
                  style={{
                    padding: '8px 14px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--primary-gold)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  💬 สนทนาในห้องล็อบบี้
                </div>

                {/* Messages List */}
                <div style={{ flex: 1, padding: '10px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        padding: '6px 10px',
                        background: msg.isSystem ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                        borderRadius: '8px',
                        border: msg.isSystem ? '1px solid rgba(56, 189, 248, 0.2)' : 'none',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 700, color: msg.senderColor || 'var(--primary-gold)', fontSize: '0.75rem' }}>
                          {msg.senderAvatar} {msg.senderName}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{msg.timestamp}</span>
                      </div>
                      <div style={{ color: '#fff', wordBreak: 'break-word', lineHeight: 1.3 }}>{msg.text}</div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Quick Phrases */}
                <div style={{ padding: '4px 10px', display: 'flex', gap: '4px', overflowX: 'auto', background: 'rgba(0,0,0,0.2)' }}>
                  {['พร้อมแล้ว! 🔥', 'ขอเวลา 1 นาที ⏳', 'สาธุ! 🙏', 'สู้ๆ ทุกคน ⚔️'].map((phrase) => (
                    <button
                      key={phrase}
                      onClick={() => handleSendChat(phrase)}
                      style={{
                        padding: '2px 8px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.68rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {phrase}
                    </button>
                  ))}
                </div>

                {/* Chat Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChat();
                  }}
                  style={{
                    padding: '8px 10px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    gap: '6px',
                  }}
                >
                  <input
                    type="text"
                    value={inputChat}
                    onChange={(e) => setInputChat(e.target.value)}
                    placeholder="พิมพ์ข้อความทักทาย..."
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(212, 175, 55, 0.2)',
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
            </div>

            {/* Bottom Action Footer */}
            <div
              style={{
                padding: '14px 20px',
                background: 'rgba(10, 16, 35, 0.95)',
                borderTop: '1px solid rgba(212, 175, 55, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {isHost
                  ? '👑 ท่านเป็นเจ้าสำนัก (Host) เมื่อผู้เล่นทุกคนพร้อมแล้ว สามารถกดเริ่มเกมได้ทันที'
                  : 'กรุณากดยืนยัน "พร้อมแล้ว" เพื่อให้เจ้าสำนักเริ่มเกม'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {!isHost && (
                  <button
                    onClick={handleToggleReady}
                    className="gold-button"
                    style={{
                      padding: '10px 20px',
                      fontSize: '0.9rem',
                      borderRadius: '10px',
                      background: currentMember?.isReady ? 'linear-gradient(135deg, #10b981, #059669)' : undefined,
                    }}
                  >
                    {currentMember?.isReady ? '✅ พร้อมแล้ว (กดยกเลิก)' : '🚀 ยืนยันว่าพร้อมแล้ว'}
                  </button>
                )}

                {isHost && (
                  <button
                    onClick={handleStartGameClick}
                    className="gold-button"
                    style={{
                      padding: '10px 24px',
                      fontSize: '0.95rem',
                      borderRadius: '10px',
                      boxShadow: '0 4px 20px rgba(212, 175, 55, 0.6)',
                    }}
                  >
                    <Play size={18} />
                    <span>เริ่มการแข่งขัน (Start Game)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

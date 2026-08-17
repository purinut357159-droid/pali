import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  UserPlus,
  Inbox,
  Search,
  Copy,
  Check,
  Gamepad2,
  Trash2,
  Sparkles,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import type { UserAccount } from '../types/auth';
import {
  getFriends,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
  searchUsers,
  getSuggestedFriends,
  getFriendOnlineStatus,
  sendGameInvite,
} from '../utils/friendService';
import { audioManager } from '../utils/audioManager';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onOpenAuthModal: () => void;
  currentRoomCode?: string | null;
  onOpenCreateRoom?: () => void;
}

export const FriendsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuthModal,
  currentRoomCode,
  onOpenCreateRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'danger' | 'info' } | null>(null);

  // Data states
  const [friendsList, setFriendsList] = useState<UserAccount[]>([]);
  const [incomingReqs, setIncomingReqs] = useState<{ fromUser: UserAccount; timestamp: string; message?: string }[]>([]);
  const [outgoingReqs, setOutgoingReqs] = useState<{ toUser: UserAccount; timestamp: string }[]>([]);
  const [searchResults, setSearchResults] = useState<UserAccount[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserAccount[]>([]);

  const showToast = (text: string, type: 'success' | 'danger' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  };

  const loadData = () => {
    if (!currentUser) return;
    const friends = getFriends(currentUser.id);
    const incoming = getIncomingFriendRequests(currentUser.id);
    const outgoing = getOutgoingFriendRequests(currentUser.id);
    const suggested = getSuggestedFriends(currentUser.id);

    setFriendsList(friends);
    setIncomingReqs(incoming);
    setOutgoingReqs(outgoing);
    setSuggestedUsers(suggested);

    if (searchQuery.trim()) {
      setSearchResults(searchUsers(searchQuery, currentUser.id));
    }
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      loadData();
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    const handleAccountSync = () => {
      if (isOpen && currentUser) {
        loadData();
      }
    };
    window.addEventListener('pali_accounts_updated', handleAccountSync);
    return () => window.removeEventListener('pali_accounts_updated', handleAccountSync);
  }, [isOpen, currentUser, searchQuery]);

  useEffect(() => {
    if (!currentUser) return;
    if (searchQuery.trim()) {
      setSearchResults(searchUsers(searchQuery, currentUser.id));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, currentUser]);

  if (!isOpen) return null;

  const handleCopyPlayerId = () => {
    if (!currentUser) return;
    navigator.clipboard.writeText(currentUser.id);
    setCopiedId(true);
    showToast('คัดลอกรหัสผู้เล่นเรียบร้อยแล้ว!', 'success');
    audioManager.playSathuChime();
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSendRequest = (targetIdOrUsername: string) => {
    if (!currentUser) return;
    const res = sendFriendRequest(currentUser.id, targetIdOrUsername);
    if (res.success) {
      showToast(res.message, 'success');
      audioManager.playSathuChime();
      loadData();
      setSearchQuery('');
    } else {
      showToast(res.message, 'danger');
    }
  };

  const handleAcceptRequest = (fromUserId: string) => {
    if (!currentUser) return;
    const res = acceptFriendRequest(currentUser.id, fromUserId);
    if (res.success) {
      showToast(res.message, 'success');
      audioManager.playUpgradeSound();
      loadData();
    } else {
      showToast(res.message, 'danger');
    }
  };

  const handleDeclineRequest = (fromUserId: string) => {
    if (!currentUser) return;
    const res = declineFriendRequest(currentUser.id, fromUserId);
    if (res.success) {
      showToast(res.message, 'info');
      loadData();
    }
  };

  const handleCancelRequest = (toUserId: string) => {
    if (!currentUser) return;
    const res = cancelFriendRequest(currentUser.id, toUserId);
    if (res.success) {
      showToast(res.message, 'info');
      loadData();
    }
  };

  const handleRemoveFriend = (friendId: string, friendName: string) => {
    if (!currentUser) return;
    if (window.confirm(`ท่านต้องการลบ "${friendName}" ออกจากรายชื่อเพื่อนหรือไม่?`)) {
      const res = removeFriend(currentUser.id, friendId);
      if (res.success) {
        showToast(res.message, 'info');
        loadData();
      }
    }
  };

  const handleInviteToRoom = (friend: UserAccount) => {
    if (!currentUser) return;
    if (currentRoomCode) {
      sendGameInvite(currentUser, friend.id, currentRoomCode);
      showToast(`ส่งคำชวนเข้าห้อง ${currentRoomCode} ถึง ${friend.displayName} แล้ว!`, 'success');
      audioManager.playSathuChime();
    } else {
      if (onOpenCreateRoom) {
        onClose();
        onOpenCreateRoom();
      } else {
        showToast('กรุณาสร้างห้องเล่นเกมก่อนเพื่อส่งคำชวนเพื่อน', 'info');
      }
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="glass-panel"
        style={{
          width: '94%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.25s ease-out',
          border: '1.5px solid var(--primary-gold)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 0 24px var(--gold-glow)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(16, 25, 50, 0.9))',
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
                background: 'linear-gradient(135deg, #f59e0b, #d4af37)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4)',
              }}
            >
              👥
            </div>
            <div>
              <h2 className="gold-gradient-text" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                มิตรสหายแห่งธรรม (ระบบเพื่อน)
              </h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                เชื่อมต่อกับศิษย์ร่วมสำนัก แอดเพื่อน และชวนประลองปัญญาออนไลน์
              </p>
            </div>
          </div>

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
              animation: 'fadeIn 0.2s ease',
              background:
                toastMessage.type === 'success'
                  ? 'rgba(16, 185, 129, 0.2)'
                  : toastMessage.type === 'danger'
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'rgba(56, 189, 248, 0.2)',
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

        {!currentUser ? (
          /* Not logged in State */
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>🔒</span>
            <h3 style={{ color: 'var(--primary-gold)', marginBottom: '8px' }}>กรุณาเข้าสู่ระบบเพื่อใช้งานระบบเพื่อน</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 20px auto' }}>
              ล็อกอินหรือสร้างบัญชีผู้เล่นเพื่อบันทึกรายชื่อเพื่อน แลกเปลี่ยนคำขอ และชวนเล่นเกมออนไลน์กับเพื่อนได้ตลอดเวลา
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenAuthModal();
              }}
              className="gold-button"
            >
              เข้าสู่ระบบ / สร้างบัญชี
            </button>
          </div>
        ) : (
          /* Logged In Content */
          <>
            {/* My ID Sub-bar */}
            <div
              style={{
                margin: '12px 20px 0 20px',
                padding: '10px 16px',
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '12px',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>{currentUser.avatar}</span>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {currentUser.displayName}
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary-gold)', marginLeft: '6px' }}>
                      (Lv.{currentUser.level} {currentUser.rankTitle})
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Username: <strong style={{ color: '#fff' }}>@{currentUser.username}</strong> | ID: <code style={{ color: 'var(--accent-cyan)' }}>{currentUser.id}</code>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCopyPlayerId}
                className="secondary-button"
                style={{
                  padding: '5px 12px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '8px',
                  borderColor: copiedId ? '#10b981' : 'rgba(212, 175, 55, 0.4)',
                  color: copiedId ? '#34d399' : '#fff',
                }}
              >
                {copiedId ? <Check size={14} /> : <Copy size={14} />}
                {copiedId ? 'คัดลอกแล้ว!' : 'คัดลอก ID ผู้เล่น'}
              </button>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                padding: '12px 20px 0 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <button
                onClick={() => setActiveTab('friends')}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  background: activeTab === 'friends' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'friends' ? '2.5px solid var(--primary-gold)' : '2.5px solid transparent',
                  color: activeTab === 'friends' ? 'var(--primary-gold)' : 'var(--text-muted)',
                  fontWeight: activeTab === 'friends' ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                }}
              >
                <Users size={16} />
                <span>เพื่อนของฉัน</span>
                <span
                  style={{
                    background: activeTab === 'friends' ? 'var(--primary-gold)' : 'rgba(255,255,255,0.1)',
                    color: activeTab === 'friends' ? '#090e1a' : '#fff',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                  }}
                >
                  {friendsList.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('requests')}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  background: activeTab === 'requests' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'requests' ? '2.5px solid var(--primary-gold)' : '2.5px solid transparent',
                  color: activeTab === 'requests' ? 'var(--primary-gold)' : 'var(--text-muted)',
                  fontWeight: activeTab === 'requests' ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                }}
              >
                <Inbox size={16} />
                <span>คำขอเป็นเพื่อน</span>
                {incomingReqs.length > 0 && (
                  <span
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      borderRadius: '10px',
                      padding: '1px 6px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      animation: 'pulse 1.5s infinite',
                    }}
                  >
                    {incomingReqs.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('search')}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  background: activeTab === 'search' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'search' ? '2.5px solid var(--primary-gold)' : '2.5px solid transparent',
                  color: activeTab === 'search' ? 'var(--primary-gold)' : 'var(--text-muted)',
                  fontWeight: activeTab === 'search' ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                }}
              >
                <UserPlus size={16} />
                <span>ค้นหา & เพิ่มเพื่อน</span>
              </button>
            </div>

            {/* Tab Body */}
            <div style={{ padding: '16px 20px', flex: 1, overflowY: 'auto', maxHeight: '56vh' }}>
              {/* TAB 1: FRIENDS LIST */}
              {activeTab === 'friends' && (
                <div>
                  {friendsList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                      <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>📿</span>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                        ยังไม่มีรายชื่อเพื่อนในขณะนี้ ค้นหาศิษย์ร่วมศึกษาหรือเพิ่มจากคำแนะนำได้เลย!
                      </p>
                      <button onClick={() => setActiveTab('search')} className="gold-button" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                        <UserPlus size={16} />
                        ค้นหาและเพิ่มเพื่อน
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {friendsList.map((friend) => {
                        const status = getFriendOnlineStatus(friend.id);
                        return (
                          <div
                            key={friend.id}
                            style={{
                              padding: '12px 16px',
                              background: 'rgba(255, 255, 255, 0.04)',
                              borderRadius: '12px',
                              border: '1px solid rgba(212, 175, 55, 0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '12px',
                              transition: 'all 0.2s',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ position: 'relative', fontSize: '1.8rem' }}>
                                {friend.avatar}
                                <span
                                  style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    width: '11px',
                                    height: '11px',
                                    borderRadius: '50%',
                                    background: status.color,
                                    border: '2px solid #090e1a',
                                  }}
                                  title={status.label}
                                />
                              </div>

                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{friend.displayName}</strong>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--primary-gold)' }}>
                                    Lv.{friend.level}
                                  </span>
                                  {friend.isDeveloper && (
                                    <span style={{ fontSize: '0.65rem', background: '#0284c7', color: '#fff', padding: '1px 5px', borderRadius: '6px', fontWeight: 800 }}>
                                      DEV
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ color: status.color, fontWeight: 600 }}>● {status.label}</span>
                                  <span>| ยศ: {friend.rankTitle}</span>
                                  <span>| ชนะ: {friend.stats.gamesWon} เกม</span>
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                onClick={() => handleInviteToRoom(friend)}
                                className="gold-button"
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.8rem',
                                  borderRadius: '8px',
                                }}
                                title="ชวนเพื่อนเข้าห้องเล่นเกมออนไลน์"
                              >
                                <Gamepad2 size={15} />
                                <span>ชวนเล่นห้อง</span>
                              </button>

                              <button
                                onClick={() => handleRemoveFriend(friend.id, friend.displayName)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#f87171',
                                  borderRadius: '8px',
                                  padding: '6px 10px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title="ลบเพื่อน"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: FRIEND REQUESTS */}
              {activeTab === 'requests' && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--primary-gold)', marginBottom: '10px' }}>
                    📥 คำขอที่ส่งถึงท่าน ({incomingReqs.length})
                  </h4>

                  {incomingReqs.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', marginBottom: '20px' }}>
                      ไม่มีคำขอเป็นเพื่อนที่รอการตอบรับในขณะนี้
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                      {incomingReqs.map(({ fromUser, timestamp, message }) => (
                        <div
                          key={fromUser.id}
                          style={{
                            padding: '12px 16px',
                            background: 'rgba(212, 175, 55, 0.08)',
                            borderRadius: '12px',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '10px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.8rem' }}>{fromUser.avatar}</span>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                                {fromUser.displayName}
                                <span style={{ fontSize: '0.72rem', color: 'var(--primary-gold)', marginLeft: '6px' }}>
                                  (Lv.{fromUser.level} {fromUser.rankTitle})
                                </span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {message || 'ขอเพิ่มเป็นเพื่อนในเกม'} • <Clock size={11} style={{ verticalAlign: 'middle' }} /> {new Date(timestamp).toLocaleDateString('th-TH')}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleAcceptRequest(fromUser.id)}
                              className="gold-button"
                              style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '8px' }}
                            >
                              <Check size={14} />
                              <span>ยอมรับ</span>
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(fromUser.id)}
                              className="secondary-button"
                              style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px' }}
                            >
                              <X size={14} />
                              <span>ปฏิเสธ</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    📤 คำขอที่ท่านส่งไป ({outgoingReqs.length})
                  </h4>

                  {outgoingReqs.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                      ท่านไม่มีคำขอที่กำลังรอการตอบรับ
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {outgoingReqs.map(({ toUser, timestamp }) => (
                        <div
                          key={toUser.id}
                          style={{
                            padding: '10px 14px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.4rem' }}>{toUser.avatar}</span>
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                                {toUser.displayName}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                ส่งเมื่อ: {new Date(timestamp).toLocaleDateString('th-TH')} (รอการตอบรับ)
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleCancelRequest(toUser.id)}
                            className="secondary-button"
                            style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: '6px' }}
                          >
                            ยกเลิกคำขอ
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SEARCH & SUGGESTIONS */}
              {activeTab === 'search' && (
                <div>
                  {/* Search Input */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(212, 175, 55, 0.4)',
                      borderRadius: '12px',
                      padding: '8px 14px',
                      marginBottom: '16px',
                    }}
                  >
                    <Search size={18} color="var(--primary-gold)" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="พิมพ์ Username, ชื่อผู้เล่น หรือรหัส Player ID..."
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#fff',
                        fontSize: '0.9rem',
                        width: '100%',
                      }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Search Results */}
                  {searchQuery.trim() && (
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '0.85rem', color: 'var(--primary-gold)', marginBottom: '8px' }}>
                        🔍 ผลการค้นหา ({searchResults.length})
                      </h4>

                      {searchResults.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          ไม่พบผู้เล่นที่ตรงกับ "{searchQuery}"
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {searchResults.map((user) => {
                            const isAlreadyFriend = friendsList.some((f) => f.id === user.id);
                            const isPending = outgoingReqs.some((r) => r.toUser.id === user.id);
                            const hasIncoming = incomingReqs.some((r) => r.fromUser.id === user.id);

                            return (
                              <div
                                key={user.id}
                                style={{
                                  padding: '10px 14px',
                                  background: 'rgba(255, 255, 255, 0.04)',
                                  borderRadius: '10px',
                                  border: '1px solid rgba(212, 175, 55, 0.2)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ fontSize: '1.6rem' }}>{user.avatar}</span>
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                                      {user.displayName}
                                      <span style={{ fontSize: '0.7rem', color: 'var(--primary-gold)', marginLeft: '6px' }}>
                                        (Lv.{user.level} {user.rankTitle})
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                      @{user.username} | ชนะสะสม {user.stats.gamesWon} เกม
                                    </div>
                                  </div>
                                </div>

                                {isAlreadyFriend ? (
                                  <span style={{ fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                    <ShieldCheck size={15} /> เป็นเพื่อนแล้ว
                                  </span>
                                ) : isPending ? (
                                  <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
                                    ⏳ รอการตอบรับ
                                  </span>
                                ) : hasIncoming ? (
                                  <button
                                    onClick={() => handleAcceptRequest(user.id)}
                                    className="gold-button"
                                    style={{ padding: '5px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
                                  >
                                    ยอมรับคำขอ
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleSendRequest(user.id)}
                                    className="gold-button"
                                    style={{ padding: '5px 12px', fontSize: '0.75rem', borderRadius: '6px' }}
                                  >
                                    <UserPlus size={14} />
                                    <span>เพิ่มเพื่อน</span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggested Scholars */}
                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--primary-gold)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={16} />
                      <span>แนะนำผู้ร่วมศึกษาเปรียญธรรม (Suggested Scholars)</span>
                    </h4>

                    {suggestedUsers.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        ท่านได้เป็นเพื่อนกับศิษย์เปรียญธรรมทุกคนแล้ว!
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                        {suggestedUsers.map((user) => (
                          <div
                            key={user.id}
                            style={{
                              padding: '12px',
                              background: 'rgba(255, 255, 255, 0.03)',
                              borderRadius: '12px',
                              border: '1px solid rgba(212, 175, 55, 0.15)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: '10px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '2rem' }}>{user.avatar}</span>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                                  {user.displayName}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--primary-gold)' }}>
                                  {user.rankTitle} (Lv.{user.level})
                                </div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                  ตอบถูก {user.stats.correctAnswers} ข้อ | ชนะ {user.stats.gamesWon} เกม
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleSendRequest(user.id)}
                              className="gold-button"
                              style={{
                                width: '100%',
                                padding: '6px 10px',
                                fontSize: '0.75rem',
                                borderRadius: '8px',
                                justifyContent: 'center',
                              }}
                            >
                              <UserPlus size={14} />
                              <span>ขอเป็นเพื่อน</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

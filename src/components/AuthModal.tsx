import React, { useState, useEffect } from 'react';
import {
  LogIn,
  UserPlus,
  Users,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
  ShieldCheck,
  Lock,
  KeyRound,
} from 'lucide-react';
import {
  loginAccount,
  verifyAndLoginDeveloper,
  registerAccount,
  getSavedAccountsForAuth,
  switchAccount,
} from '../utils/authService';
import type { UserAccount } from '../types/auth';
import type { CharacterId } from '../types/game';
import { CHARACTERS } from '../data/charactersData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  initialTab?: 'login' | 'register' | 'saved';
}

const AVATAR_PRESETS = ['🧘‍♂️', '👨‍🏫', '👦', '🎓', '📿', '📜', '✨', '🏯', '👑', '🕊️', '💻'];

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialTab = 'login',
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'saved'>(initialTab);
  
  // Login Form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Register Form state
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regAvatar, setRegAvatar] = useState('🧘‍♂️');
  const [regFavoriteChar, setRegFavoriteChar] = useState<CharacterId>('monk');

  // Status message
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Secret Developer Authentication State
  const [showSecretDevAuth, setShowSecretDevAuth] = useState(false);
  const [secretDevKey, setSecretDevKey] = useState('');
  const [secretDevError, setSecretDevError] = useState<string | null>(null);
  const logoTapRef = React.useRef(0);

  // Keyboard shortcut listener for developer portal (Ctrl + Shift + D)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setShowSecretDevAuth((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const savedAccounts = getSavedAccountsForAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = loginAccount(loginUsername, loginPassword, rememberMe);
    if (res.success && res.user) {
      setSuccessMessage(res.message);
      setTimeout(() => {
        onLoginSuccess(res.user!);
        onClose();
      }, 500);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleSecretDevLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setSecretDevError(null);
    const res = verifyAndLoginDeveloper(secretDevKey, rememberMe);
    if (res.success && res.user) {
      setSuccessMessage(res.message);
      setShowSecretDevAuth(false);
      setTimeout(() => {
        onLoginSuccess(res.user!);
        onClose();
      }, 400);
    } else {
      setSecretDevError(res.message);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = registerAccount(
      regUsername,
      regPassword,
      regDisplayName,
      regAvatar,
      regFavoriteChar
    );

    if (res.success && res.user) {
      setSuccessMessage(res.message);
      setTimeout(() => {
        onLoginSuccess(res.user!);
        onClose();
      }, 600);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleQuickSwitch = (userId: string) => {
    const res = switchAccount(userId);
    if (res.success && res.user) {
      setSuccessMessage(`สลับเข้าใช้งานบัญชี ${res.user.displayName} เรียบร้อย!`);
      setTimeout(() => {
        onLoginSuccess(res.user!);
        onClose();
      }, 400);
    }
  };

  const handleLogoTap = () => {
    logoTapRef.current += 1;
    if (logoTapRef.current >= 5) {
      setShowSecretDevAuth(true);
      logoTapRef.current = 0;
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '28px',
          border: '2px solid var(--primary-gold)',
          boxShadow: '0 0 50px rgba(212, 175, 55, 0.35)',
          position: 'relative',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={22} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            onClick={handleLogoTap}
            style={{
              fontSize: '2.5rem',
              marginBottom: '4px',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'transform 0.15s ease',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            title="บาลีส่วนฐี (กด 5 ครั้งสำหรับผู้สร้างระบบ)"
          >
            🏛️
          </div>
          <h2 className="gold-gradient-text" style={{ fontSize: '1.6rem', margin: 0 }}>
            บัญชีผู้เล่นบาลีส่วนฐี
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            บันทึกสถิติ ท่องจำคำศัพท์ และสะสมเลเวลมหาเปรียญ
          </p>
        </div>

        {/* SECRET DEVELOPER AUTHENTICATION MODAL CARD */}
        {showSecretDevAuth ? (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.18), rgba(15, 23, 42, 0.95))',
              border: '2px solid #38bdf8',
              boxShadow: '0 0 35px rgba(56, 189, 248, 0.35)',
              borderRadius: '14px',
              padding: '20px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(56, 189, 248, 0.2)',
                    border: '1px solid #38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Lock size={18} color="#38bdf8" />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '0.98rem', fontWeight: 800 }}>
                    ประตูสิทธิ์ผู้พัฒนาระบบ (Developer Key)
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    เฉพาะคุณปุรินทร์ (ผู้สร้างเกม) เท่านั้นที่เข้าถึงได้
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSecretDevAuth(false);
                  setSecretDevError(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {secretDevError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  marginBottom: '14px',
                  color: '#fca5a5',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertCircle size={15} color="#ef4444" />
                <span>{secretDevError}</span>
              </div>
            )}

            <form onSubmit={handleSecretDevLogin}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#38bdf8', marginBottom: '6px', fontWeight: 600 }}>
                  รหัสผ่านลับผู้พัฒนาระบบ (Master Security Key):
                </label>
                <input
                  type="password"
                  value={secretDevKey}
                  onChange={(e) => setSecretDevKey(e.target.value)}
                  placeholder="กรอกรหัสผ่านลับผู้พัฒนา..."
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid rgba(56, 189, 248, 0.5)',
                    color: '#fff',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    border: '1px solid #38bdf8',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)',
                  }}
                >
                  <KeyRound size={15} />
                  <span>ยืนยันสิทธิ์ผู้พัฒนา ➔</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSecretDevAuth(false);
                    setSecretDevError(null);
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '20px',
          }}
        >
          <button
            onClick={() => {
              setTab('login');
              setErrorMessage(null);
            }}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: '8px',
              border: 'none',
              background: tab === 'login' ? 'linear-gradient(135deg, #d4af37, #aa7c11)' : 'transparent',
              color: tab === 'login' ? '#090e1a' : '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <LogIn size={16} />
            เข้าสู่ระบบ
          </button>

          <button
            onClick={() => {
              setTab('register');
              setErrorMessage(null);
            }}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: '8px',
              border: 'none',
              background: tab === 'register' ? 'linear-gradient(135deg, #d4af37, #aa7c11)' : 'transparent',
              color: tab === 'register' ? '#090e1a' : '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <UserPlus size={16} />
            สมัครสมาชิก
          </button>

          {savedAccounts.length > 0 && (
            <button
              onClick={() => {
                setTab('saved');
                setErrorMessage(null);
              }}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: '8px',
                border: 'none',
                background: tab === 'saved' ? 'linear-gradient(135deg, #d4af37, #aa7c11)' : 'transparent',
                color: tab === 'saved' ? '#090e1a' : '#fff',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <Users size={16} />
              บัญชีในเครื่อง ({savedAccounts.length})
            </button>
          )}
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#fca5a5',
              fontSize: '0.85rem',
            }}
          >
            <AlertCircle size={18} color="#ef4444" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#6ee7b7',
              fontSize: '0.85rem',
            }}
          >
            <CheckCircle size={18} color="#10b981" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* LOGIN TAB */}
        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--primary-gold)', marginBottom: '6px' }}>
                ชื่อผู้ใช้ (Username):
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="เช่น monk_somchai"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px', position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--primary-gold)', marginBottom: '6px' }}>
                รหัสผ่าน (Password):
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="รหัสผ่านของคุณ"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(212,175,55,0.3)',
                    color: '#fff',
                    fontSize: '0.9rem',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--primary-gold)', width: '16px', height: '16px' }}
                />
                <span style={{ color: 'var(--text-main)' }}>จดจำการเข้าสู่ระบบในอุปกรณ์นี้ (Remember Me)</span>
              </label>
              <ShieldCheck size={16} color="var(--primary-gold)" />
            </div>

            <button
              type="submit"
              className="gold-button pulse-active"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '1rem' }}
            >
              <LogIn size={18} />
              เข้าสู่ระบบ
            </button>
          </form>
        )}

        {/* REGISTER TAB */}
        {tab === 'register' && (
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--primary-gold)', marginBottom: '4px' }}>
                ชื่อผู้ใช้ (Username ภาษาอังกฤษ/ตัวเลข):
              </label>
              <input
                type="text"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="เช่น pali_master"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--primary-gold)', marginBottom: '4px' }}>
                รหัสผ่าน (Password):
              </label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="อย่างน้อย 4 ตัวอักษร"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--primary-gold)', marginBottom: '4px' }}>
                ชื่อที่แสดงในเกม (Display Name):
              </label>
              <input
                type="text"
                value={regDisplayName}
                onChange={(e) => setRegDisplayName(e.target.value)}
                placeholder="เช่น พระมหาปรีชา หรือ น้องสามเณรเอก"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            {/* Avatar Picker */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--primary-gold)', marginBottom: '6px' }}>
                เลือกรูปโปรไฟล์ (Avatar):
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {AVATAR_PRESETS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setRegAvatar(av)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      border: `2px solid ${regAvatar === av ? 'var(--primary-gold)' : 'rgba(255,255,255,0.1)'}`,
                      background: regAvatar === av ? 'rgba(212,175,55,0.25)' : 'rgba(0,0,0,0.3)',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Favorite Character Picker */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--primary-gold)', marginBottom: '6px' }}>
                ตัวละครเริ่มต้นที่ชอบ (Default Character):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {CHARACTERS.map((char) => (
                  <div
                    key={char.id}
                    onClick={() => setRegFavoriteChar(char.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: `1px solid ${regFavoriteChar === char.id ? 'var(--primary-gold)' : 'rgba(255,255,255,0.1)'}`,
                      background: regFavoriteChar === char.id ? 'rgba(212,175,55,0.2)' : 'rgba(0,0,0,0.3)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span style={{ fontSize: '1.3rem' }}>{char.avatar}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{char.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{char.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="gold-button pulse-active"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '1rem' }}
            >
              <UserPlus size={18} />
              ยืนยันการสมัครสมาชิก
            </button>
          </form>
        )}

        {/* SAVED ACCOUNTS TAB */}
        {tab === 'saved' && (
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              บัญชีที่เคยล็อกอินไว้ในอุปกรณ์นี้ สามารถคลิกเพื่อเข้าใช้งานได้ทันที:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {savedAccounts.map((acc) => {
                const isDev = acc.isDeveloper || acc.role === 'developer';
                return (
                  <div
                    key={acc.id}
                    onClick={() => handleQuickSwitch(acc.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: isDev
                        ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(212, 175, 55, 0.12))'
                        : 'rgba(255,255,255,0.05)',
                      border: isDev ? '1.5px solid rgba(6, 182, 212, 0.6)' : '1px solid rgba(212,175,55,0.2)',
                      boxShadow: isDev ? '0 0 15px rgba(6, 182, 212, 0.2)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = isDev ? '#38bdf8' : 'var(--primary-gold)';
                      e.currentTarget.style.background = isDev
                        ? 'rgba(6, 182, 212, 0.2)'
                        : 'rgba(212,175,55,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isDev ? 'rgba(6, 182, 212, 0.6)' : 'rgba(212,175,55,0.2)';
                      e.currentTarget.style.background = isDev
                        ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(212, 175, 55, 0.12))'
                        : 'rgba(255,255,255,0.05)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: isDev ? 'rgba(6, 182, 212, 0.25)' : 'rgba(212,175,55,0.2)',
                          border: `1px solid ${isDev ? '#38bdf8' : 'var(--primary-gold)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem',
                        }}
                      >
                        {acc.avatar}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{acc.displayName}</span>
                          {isDev && (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                background: '#0284c7',
                                color: '#fff',
                                padding: '1px 6px',
                                borderRadius: '6px',
                                fontWeight: 800,
                              }}
                            >
                              DEV
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: isDev ? '#38bdf8' : 'var(--accent-gold)' }}>
                          Lv.{acc.level} • {acc.rankTitle}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          background: isDev ? 'rgba(6, 182, 212, 0.25)' : 'rgba(212,175,55,0.2)',
                          color: isDev ? '#38bdf8' : 'var(--primary-gold)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          border: `1px solid ${isDev ? 'rgba(6, 182, 212, 0.4)' : 'transparent'}`,
                        }}
                      >
                        เข้าสู่ระบบ ➔
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer info & Guest play */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={14} color="var(--primary-gold)" />
            <span>ข้อมูลจะถูกจดจำอัตโนมัติ</span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-gold)',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '0.8rem',
            }}
          >
            เล่นแบบผู้เยี่ยมชม (Guest)
          </button>
        </div>
      </div>
    </div>
  );
};

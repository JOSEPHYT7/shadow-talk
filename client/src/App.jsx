import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import CryptoJS from 'crypto-js';
import {
  Terminal,
  Search,
  Key,
  Paperclip,
  Mic,
  X,
  ChevronDown,
  Lock,
  Unlock,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  User,
  Shield,
  FileText,
  Download,
  CornerDownLeft,
  Reply,
  ExternalLink,
  Globe,
  Loader2,
  Camera,
  Check,
  ShieldCheck,
  AtSign,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  Mail
} from 'lucide-react';
import { PRESET_AVATARS } from './avatars';
import './App.css';

const SERVER_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000'
  : 'https://shadow-talk-kryk.onrender.com';

const SOCKET_URL = SERVER_URL;
const UPLOAD_URL = `${SERVER_URL}/upload`;

// Exact Official Twitter/Telegram-style 16-point Blue Tick
export function VerifiedBlueTick({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-label="Verified Profile"
      className={`verified-blue-tick-svg ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path
        d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
        fill="#1d9bf0"
      />
      <path
        d="M10.54 16.2L6.8 12.46l1.41-1.42 2.33 2.33 4.86-4.86 1.41 1.41-6.27 6.28z"
        fill="#ffffff"
      />
    </svg>
  );
}

// Authentic Google 4-Color 'G' Icon for Sign-in & OTP Verification
export function GoogleIcon({ size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`google-icon-svg ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

// Decode Google JWT ID Token from Google Identity Services
function decodeGoogleJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Failed to decode Google JWT token:', err);
    return null;
  }
}

// Realistic Human Portrait Avatar SVG for James
const JAMES_HUMAN_AVATAR = `data:image/svg+xml;utf8,<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bgG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%230f1b29"/><stop offset="100%" stop-color="%23070c14"/></linearGradient><linearGradient id="skG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23f5d0b0"/><stop offset="100%" stop-color="%23e0a985"/></linearGradient><linearGradient id="hrG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%232b3445"/><stop offset="100%" stop-color="%23171d27"/></linearGradient><linearGradient id="jkG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%231e293b"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><circle cx="60" cy="60" r="58" fill="url(%23bgG)" stroke="%2300f3ff" stroke-width="2.5"/><path d="M22 118 C22 92, 40 84, 60 84 C80 84, 98 92, 98 118 Z" fill="url(%23jkG)" stroke="%23334155" stroke-width="1.5"/><path d="M48 84 L60 102 L72 84 Z" fill="%230f172a"/><line x1="38" y1="94" x2="52" y2="84" stroke="%2300f3ff" stroke-width="2" stroke-linecap="round"/><line x1="82" y1="94" x2="68" y2="84" stroke="%2300f3ff" stroke-width="2" stroke-linecap="round"/><rect x="52" y="70" width="16" height="18" rx="4" fill="url(%23skG)"/><ellipse cx="60" cy="54" rx="20" ry="24" fill="url(%23skG)"/><ellipse cx="53" cy="52" rx="2.5" ry="3" fill="%231e293b"/><ellipse cx="67" cy="52" rx="2.5" ry="3" fill="%231e293b"/><circle cx="54" cy="51" r="0.8" fill="%23ffffff"/><circle cx="68" cy="51" r="0.8" fill="%23ffffff"/><path d="M48 46 Q53 44 57 46" stroke="%231a202c" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M63 46 Q67 44 72 46" stroke="%231a202c" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M60 54 L58 60 L61 60" stroke="%23cf9563" stroke-width="1.4" stroke-linecap="round" fill="none"/><path d="M54 66 Q60 70 66 66" stroke="%23bc7444" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M38 48 C36 30, 48 20, 64 20 C78 20, 84 28, 83 42 C80 34, 74 30, 64 30 C54 30, 44 36, 40 48 Z" fill="url(%23hrG)"/><path d="M38 44 C38 34, 46 26, 58 24 C72 22, 82 28, 84 38 C76 32, 66 30, 54 32 C46 34, 40 40, 38 44 Z" fill="%234a5568"/><circle cx="39" cy="56" r="3.5" fill="%23f5d0b0"/><circle cx="81" cy="56" r="3.5" fill="%23f5d0b0"/></svg>`;

// Real Usernames
const REAL_USERNAMES = [
  'alex_vance', 'elena_reed', 'marcus_tech', 'sophia.codes', 'lucas_sterling',
  'maya_lin', 'liam.walker', 'aria_knight', 'kai_rivera', 'sarah.dev',
  'ethan_hunt', 'clara.design', 'julian_mercer', 'noah.bishop', 'zoe_miller',
  'adam.cruz', 'chloe_fox', 'felix.web', 'gabriel_chen', 'nora_stone',
  'mason.dev', 'eva_ross', 'dylan.codes', 'riley_price', 'owen.tech',
  'jasper_winter', 'leo.sterling', 'zara_novak', 'finn_carver', 'caleb.dev',
  'hannah.codes', 'amara_cruz', 'dominic_reed', 'sienna.tech', 'nathan_fox'
];

function generateRealUsername() {
  const base = REAL_USERNAMES[Math.floor(Math.random() * REAL_USERNAMES.length)];
  return Math.random() < 0.45 ? `${base}${Math.floor(Math.random() * 89 + 10)}` : base;
}

const HACKER_COLORS = [
  '#00f3ff', '#00ff66', '#ff007f', '#9d4edd', '#fffb00',
  '#ff5e00', '#00ffb3', '#b300ff', '#ff003c', '#00a8ff'
];

const REACTION_EMOJIS = ['👍', '❤️', '🔥', '😂', '😮', '👀', '🚀', '💀'];
const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

function extractFirstUrl(text) {
  if (!text) return null;
  const match = text.match(URL_REGEX);
  return match ? match[0] : null;
}

function getUrlDomain(urlStr) {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'link';
  }
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function resolveMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return SOCKET_URL + url;
}

function getOrCreateIdentity() {
  let identity = localStorage.getItem('bbx_identity');
  if (identity) {
    try {
      const parsed = JSON.parse(identity);
      if (parsed.alias) {
        const cleanAlias = parsed.alias.replace(/\s*#\d+$/, '');
        return {
          ...parsed,
          alias: cleanAlias,
          bio: parsed.bio || 'Encrypted mesh developer',
          status: parsed.status || 'Online',
          isVerified: !!parsed.isVerified
        };
      }
    } catch { /* ignore */ }
  }
  const alias = generateRealUsername();
  const color = HACKER_COLORS[Math.floor(Math.random() * HACKER_COLORS.length)];
  const randomAvatar = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)].svg;
  identity = {
    alias,
    color,
    avatar: randomAvatar,
    bio: 'Encrypted mesh developer',
    status: 'Online',
    isVerified: false
  };
  localStorage.setItem('bbx_identity', JSON.stringify(identity));
  return identity;
}

function generateRandomPassphrase() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let res = '';
  for (let i = 0; i < 16; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

function renderAvatar(dmsgAlias, dmsgColor, dmsgAvatar, size = 24) {
  if (dmsgAlias === 'James') {
    return <img src={JAMES_HUMAN_AVATAR} alt="James" className="avatar-img" style={{ width: size, height: size }} />;
  }
  if (dmsgAvatar) {
    return <img src={dmsgAvatar} alt="avatar" className="avatar-img" style={{ width: size, height: size }} />;
  }
  return (
    <div className="user-avatar-circle" style={{ background: dmsgColor || '#00f3ff', width: size, height: size, fontSize: size * 0.44 }}>
      {(dmsgAlias || '?').slice(0, 2).toUpperCase()}
    </div>
  );
}

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [replyingTo, setReplyingTo] = useState(null);

  // File Download & Permission States
  const [downloadingFileId, setDownloadingFileId] = useState(null);

  // @ Mention Autocomplete States
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');

  // Selected User Profile Popup Modal State
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);

  // --- Real Email 4-Digit OTP Verification States ---
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpStep, setOtpStep] = useState('email'); // 'email' | 'code' | 'success'
  const [targetEmail, setTargetEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']); // 4 digits
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');
  const [otpResendCountdown, setOtpResendCountdown] = useState(30);
  const otpInputRefs = useRef([]);

  // Mobile Instagram Swipe-to-Reply Gesture States
  const [swipingMsgId, setSwipingMsgId] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartRef = useRef({ x: 0, y: 0, id: null, active: false });

  // Audio Voice Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const [identity, setIdentity] = useState(getOrCreateIdentity());
  const [passphrase, setPassphrase] = useState(localStorage.getItem('bbx_passphrase') || '');
  const [showPassphraseKey, setShowPassphraseKey] = useState(false);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState(null);

  const [typingUsers, setTypingUsers] = useState([]);
  const [atBottom, setAtBottom] = useState(true);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const avatarUploadRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('bbx_passphrase', passphrase);
  }, [passphrase]);

  useEffect(() => {
    localStorage.setItem('bbx_identity', JSON.stringify(identity));
  }, [identity]);

  function encryptMsg(obj) {
    if (!passphrase) return obj;
    const payload = JSON.stringify(obj);
    return { encrypted: CryptoJS.AES.encrypt(payload, passphrase).toString() };
  }

  function decryptMsg(msg) {
    if (!msg.encrypted) return msg;
    if (!passphrase) {
      return { text: '🔒 Encrypted Payload (Enter Passphrase in Vault)', alias: msg.alias || 'Encrypted', color: '#ffaa00', timestamp: msg.timestamp };
    }
    try {
      const bytes = CryptoJS.AES.decrypt(msg.encrypted, passphrase);
      const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
      if (!decryptedStr) throw new Error('Bad key');
      const decrypted = JSON.parse(decryptedStr);
      return { ...decrypted, id: msg.id, timestamp: msg.timestamp, reactions: msg.reactions };
    } catch {
      return { text: '⚠️ [Decryption Failed - Invalid Passphrase Key]', alias: msg.alias || 'Unknown', color: '#ff0055', timestamp: msg.timestamp };
    }
  }

  const scrollToMessage = (targetId) => {
    if (!targetId) return;
    const el = document.getElementById(`msg-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlight-pulse');
      setTimeout(() => {
        el.classList.remove('highlight-pulse');
      }, 2000);
    }
  };

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      socketRef.current.emit('userJoined', { alias: identity.alias, isVerified: identity.isVerified });
    });

    socketRef.current.on('init', (msgs) => setMessages(msgs));
    socketRef.current.on('userCount', (count) => setOnlineCount(count || 1));

    socketRef.current.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socketRef.current.on('reaction', ({ messageId, reactions }) => {
      setMessages((prev) => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
    });

    // Real-time sync for file download permissions
    socketRef.current.on('fileDownloadToggled', ({ messageId, allowDownload }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, allowDownload } : m));
    });

    socketRef.current.on('typing', ({ alias }) => {
      setTypingUsers((prev) => {
        if (prev.includes(alias)) return prev;
        return [...prev, alias];
      });
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter(a => a !== alias));
      }, 2500);
    });

    return () => socketRef.current.disconnect();
  }, [passphrase, identity]);

  useEffect(() => {
    const viewport = messagesEndRef.current?.parentNode;
    if (!viewport) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      setAtBottom(scrollHeight - scrollTop - clientHeight < 60);
    };
    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (atBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, atBottom]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- Real Email 4-Digit OTP Verification Logic ---
  const startEmailVerification = () => {
    setShowIdentityModal(false);
    setShowOtpModal(true);
    setOtpStep('email');
    setOtpError('');
    setOtpSuccessMsg('');
    setOtpDigits(['', '', '', '']);
    if (identity.verifiedEmail) {
      setTargetEmail(identity.verifiedEmail);
    } else {
      setTargetEmail('');
    }
  };

  const handleSendOtp = async () => {
    if (!targetEmail || !targetEmail.includes('@')) {
      setOtpError('Please enter a valid email address.');
      return;
    }

    setOtpLoading(true);
    setOtpError('');
    setOtpSuccessMsg('');

    try {
      const res = await fetch(`${SERVER_URL}/api/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail.trim() })
      });
      const data = await res.json();

      if (data.success) {
        setOtpStep('code');
        setOtpDigits(['', '', '', '']);
        setOtpResendCountdown(30);
        setOtpSuccessMsg(data.message || `Verification code sent to ${targetEmail}`);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
      } else {
        setOtpError(data.error || 'Failed to send verification code.');
      }
    } catch (err) {
      setOtpError('Network error connecting to verification server.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpDigitChange = (index, value) => {
    const char = value.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);
    setOtpError('');

    if (char && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto verify when 4th digit entered
    const fullCode = newDigits.join('');
    if (fullCode.length === 4) {
      handleVerifyOtp(fullCode);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4);
    if (!pasted) return;
    const newDigits = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setOtpDigits(newDigits);
    if (pasted.length === 4) {
      handleVerifyOtp(pasted);
    } else {
      otpInputRefs.current[Math.min(3, pasted.length)]?.focus();
    }
  };

  const handleVerifyOtp = async (codeToVerify) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length < 4) {
      setOtpError('Please enter the full 4-digit code.');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      const res = await fetch(`${SERVER_URL}/api/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail.trim(),
          otp: code,
          alias: identity.alias
        })
      });
      const data = await res.json();

      if (data.success && data.verified) {
        setOtpStep('success');
        setIdentity(prev => ({
          ...prev,
          isVerified: true,
          verifiedEmail: targetEmail.trim()
        }));

        if (socketRef.current) {
          socketRef.current.emit('userJoined', {
            alias: identity.alias,
            isVerified: true,
            avatar: identity.avatar
          });
        }

        setTimeout(() => {
          setShowOtpModal(false);
          setOtpStep('email');
        }, 2200);
      } else {
        setOtpError(data.error || 'Incorrect code. Please try again.');
      }
    } catch (err) {
      setOtpError('Error connecting to verification server.');
    } finally {
      setOtpLoading(false);
    }
  };



  const closeOtpModal = () => {
    setShowOtpModal(false);
    setOtpStep('email');
    setOtpError('');
    setOtpLoading(false);
  };

  useEffect(() => {
    let timer;
    if (showOtpModal && otpStep === 'code' && otpResendCountdown > 0) {
      timer = setInterval(() => {
        setOtpResendCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpModal, otpStep, otpResendCountdown]);

  // Mobile Instagram Swipe-to-Reply Gesture Handlers
  const handleTouchStart = (e, msgId) => {
    if (window.innerWidth > 768) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, id: msgId, active: false };
  };

  const handleTouchMove = (e, msgId) => {
    if (window.innerWidth > 768) return;
    if (touchStartRef.current.id !== msgId) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      touchStartRef.current.active = true;
      setSwipingMsgId(msgId);
      const clamped = Math.max(-75, Math.min(75, dx));
      setSwipeOffset(clamped);
    }
  };

  const handleTouchEnd = (msg, dmsg, msgId) => {
    if (window.innerWidth > 768) return;
    if (swipingMsgId === msgId && Math.abs(swipeOffset) > 42) {
      startReply(msg, dmsg, msgId);
      if (navigator.vibrate) {
        try { navigator.vibrate(35); } catch { }
      }
    }
    setSwipingMsgId(null);
    setSwipeOffset(0);
    touchStartRef.current = { x: 0, y: 0, id: null, active: false };
  };

  // Toggle File Download Permission (Sender/Owner only)
  const handleToggleFileDownload = (msgId, currentAllowed) => {
    const newAllowed = !currentAllowed;
    if (socketRef.current) {
      socketRef.current.emit('toggleFileDownload', { messageId: msgId, allowDownload: newAllowed });
    }
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, allowDownload: newAllowed } : m));
  };

  // Download File with Animation
  const handleDownloadFile = async (msgId, fileUrl, fileName) => {
    setDownloadingFileId(msgId);
    try {
      const fullUrl = resolveMediaUrl(fileUrl);
      const res = await fetch(fullUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(resolveMediaUrl(fileUrl), '_blank');
    }
    setTimeout(() => setDownloadingFileId(null), 1000);
  };

  // Compute mentionable users for @ autocomplete
  const mentionCandidates = Array.from(
    new Set([
      'James',
      ...messages.map(m => m.alias).filter(Boolean),
      identity.alias
    ])
  ).filter(name => {
    if (!mentionQuery) return true;
    return name.toLowerCase().includes(mentionQuery.toLowerCase());
  });

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    socketRef.current.emit('typing', { alias: identity.alias });

    // Detect @ symbol at or near cursor
    const cursor = e.target.selectionStart;
    const textBefore = val.slice(0, cursor);
    const match = textBefore.match(/(?:^|\s)@([a-zA-Z0-9._-]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setShowMentionDropdown(true);
    } else {
      setShowMentionDropdown(false);
    }
  };

  const selectMention = (username) => {
    const cursor = textareaRef.current?.selectionStart || input.length;
    const textBefore = input.slice(0, cursor);
    const textAfter = input.slice(cursor);
    const updatedBefore = textBefore.replace(/(?:^|\s)@([a-zA-Z0-9._-]*)$/, (m) => {
      const leadingSpace = m.startsWith(' ') ? ' ' : '';
      return `${leadingSpace}@${username} `;
    });
    setInput(updatedBefore + textAfter);
    setShowMentionDropdown(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachedFile(file);
      if (file.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const removeSelectedFile = () => {
    setAttachedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAvatarFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdentity(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Voice Message Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });

        setUploading(true);
        let audioUrl = null;

        try {
          const formData = new FormData();
          formData.append('file', audioFile);

          const res = await fetch(UPLOAD_URL, { method: 'POST', body: formData });
          if (res.ok) {
            const data = await res.json();
            audioUrl = data.fileUrl || data.imageUrl;
          }
        } catch (err) {
          console.warn('Voice upload fallback:', err);
        }

        if (!audioUrl) {
          audioUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(audioBlob);
          });
        }

        socketRef.current.emit('message', encryptMsg({
          audioUrl: audioUrl,
          fileUrl: audioUrl,
          fileType: 'audio/webm',
          fileName: 'Voice Transmission.webm',
          alias: identity.alias,
          color: identity.color,
          avatar: identity.avatar,
          isVerified: identity.isVerified,
          allowDownload: true,
          replyTo: replyingTo ? {
            id: replyingTo.id,
            alias: replyingTo.alias,
            color: replyingTo.color,
            text: replyingTo.text,
            fileName: replyingTo.fileName
          } : null
        }));

        setReplyingTo(null);
        setUploading(false);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch {
      alert('Microphone access denied or unavailable on this device.');
    }
  };

  const stopAndSendRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  // Send Message / File Payload
  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (uploading) return;

    if (attachedFile) {
      setUploading(true);
      let uploadedUrl = null;
      let finalFileName = attachedFile.name;
      let finalFileType = attachedFile.type;
      let finalFileSize = attachedFile.size;

      try {
        const formData = new FormData();
        formData.append('file', attachedFile);

        const res = await fetch(UPLOAD_URL, { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          uploadedUrl = data.fileUrl || data.imageUrl;
          if (data.fileName) finalFileName = data.fileName;
          if (data.fileType) finalFileType = data.fileType;
          if (data.fileSize) finalFileSize = data.fileSize;
        }
      } catch (err) {
        console.warn('File upload fallback:', err);
      }

      if (!uploadedUrl && attachedFile.size < 5 * 1024 * 1024) {
        uploadedUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(attachedFile);
        });
      }

      if (!uploadedUrl) {
        alert('File upload failed. Please verify server connection and try again.');
        setUploading(false);
        return;
      }

      const isImg = finalFileType.startsWith('image/');
      const isVid = finalFileType.startsWith('video/');
      const isAud = finalFileType.startsWith('audio/');

      socketRef.current.emit('message', encryptMsg({
        text: input.trim() || null,
        fileUrl: uploadedUrl,
        imageUrl: isImg ? uploadedUrl : null,
        videoUrl: isVid ? uploadedUrl : null,
        audioUrl: isAud ? uploadedUrl : null,
        fileName: finalFileName,
        fileType: finalFileType,
        fileSize: finalFileSize,
        alias: identity.alias,
        color: identity.color,
        avatar: identity.avatar,
        isVerified: identity.isVerified,
        allowDownload: true,
        replyTo: replyingTo ? {
          id: replyingTo.id,
          alias: replyingTo.alias,
          color: replyingTo.color,
          text: replyingTo.text,
          fileName: replyingTo.fileName
        } : null
      }));

      removeSelectedFile();
      setReplyingTo(null);
      setInput('');
      setUploading(false);
      return;
    }

    if (input.trim()) {
      socketRef.current.emit('message', encryptMsg({
        text: input.trim(),
        alias: identity.alias,
        color: identity.color,
        avatar: identity.avatar,
        isVerified: identity.isVerified,
        replyTo: replyingTo ? {
          id: replyingTo.id,
          alias: replyingTo.alias,
          color: replyingTo.color,
          text: replyingTo.text,
          fileName: replyingTo.fileName
        } : null
      }));
      setReplyingTo(null);
      setInput('');
      setShowMentionDropdown(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (showMentionDropdown && mentionCandidates.length > 0) {
        e.preventDefault();
        selectMention(mentionCandidates[0]);
        return;
      }
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReaction = (messageId, emoji) => {
    socketRef.current.emit('reaction', { messageId, emoji, alias: identity.alias });
    setActiveReactionMsgId(null);
  };

  const generateNewIdentity = () => {
    const newAlias = generateRealUsername();
    const newColor = HACKER_COLORS[Math.floor(Math.random() * HACKER_COLORS.length)];
    const updated = { ...identity, alias: newAlias, color: newColor };
    setIdentity(updated);
  };

  const startReply = (msg, dmsg, msgId) => {
    setReplyingTo({
      id: msgId,
      alias: dmsg.alias,
      color: dmsg.color,
      text: dmsg.text,
      fileName: dmsg.fileName,
      fileType: dmsg.fileType
    });
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const openUserProfile = (alias, color, avatar, isVerified, bio, status) => {
    setSelectedUserProfile({
      alias: alias || 'Anonymous',
      color: color || '#00f3ff',
      avatar: avatar || null,
      isVerified: !!isVerified || alias === 'James',
      bio: alias === 'James' ? 'Full-stack engineer & tech enthusiast. Always around!' : (bio || 'Encrypted mesh user'),
      status: status || 'Online'
    });
  };

  const renderFormattedMessage = (text) => {
    if (!text) return null;
    const parts = text.split(/(https?:\/\/[^\s]+|@[a-zA-Z0-9._-]+)/gi);
    return parts.map((part, index) => {
      if (part.match(URL_REGEX)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="chat-link"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      if (part.startsWith('@') && part.length > 1) {
        const username = part.slice(1);
        return (
          <span
            key={index}
            className="mention-tag"
            onClick={(e) => {
              e.stopPropagation();
              openUserProfile(username, '#00f3ff', null, username === 'James', '', 'Online');
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const filteredMessages = messages.filter(msg => {
    if (!searchQuery.trim()) return true;
    const dmsg = decryptMsg(msg);
    const q = searchQuery.toLowerCase();
    return (
      (dmsg.alias && dmsg.alias.toLowerCase().includes(q)) ||
      (dmsg.text && dmsg.text.toLowerCase().includes(q)) ||
      (dmsg.fileName && dmsg.fileName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="shadow-root">
      <div className="cyber-grid" />
      <div className="glow-ambient" />

      {/* --- Top Header Navigation --- */}
      <header className="shadow-header">
        <div className="brand-section">
          <div className="brand-icon-wrapper">
            <Terminal size={17} />
          </div>
          <div className="brand-title">
            SHADOWTALK <span className="version-tag">v2.0</span>
          </div>

          <div className="online-members-badge" title="Active Members Online">
            <span className="online-dot" />
            <span>{onlineCount}</span>
          </div>
        </div>

        <div className="header-actions">
          <button
            className={`icon-btn ${showSearch ? 'active' : ''}`}
            onClick={() => setShowSearch(!showSearch)}
            title="Search Transmissions"
          >
            <Search size={16} />
          </button>

          <button
            className={`icon-btn ${passphrase ? 'active' : ''}`}
            onClick={() => setShowVaultModal(true)}
            title="Encryption Key Vault"
          >
            <Key size={16} />
          </button>

          <button
            className="profile-btn"
            onClick={() => setShowIdentityModal(true)}
            title="Profile Settings"
          >
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              {renderAvatar(identity.alias, identity.color, identity.avatar, 24)}
              <span className="status-indicator-dot online" title="Online" />
            </div>
            <span className="profile-btn-alias">{identity.alias}</span>
            {identity.isVerified && <VerifiedBlueTick size={14} />}
          </button>
        </div>
      </header>

      {/* --- Search Bar Container --- */}
      {showSearch && (
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search transmissions, logs or files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button className="icon-btn" style={{ width: 22, height: 22 }} onClick={() => setSearchQuery('')}>
                <X size={13} />
              </button>
            )}
          </div>
          <span className="search-count">
            {filteredMessages.length} / {messages.length} MATCHES
          </span>
        </div>
      )}

      {/* --- Main Chat Viewport --- */}
      <main className="main-chat-area">
        <div className="messages-viewport">
          {filteredMessages.length === 0 ? (
            <div className="empty-state">
              <Shield className="empty-state-icon" />
              <h3>{searchQuery ? 'NO MATCHES FOUND' : 'QUANTUM MESH ACTIVE'}</h3>
              <p>
                {searchQuery
                  ? 'No message logs found matching your search term.'
                  : 'End-to-end encrypted mesh terminal. Supports voice notes, images, videos & documents.'}
              </p>
            </div>
          ) : (
            filteredMessages.map((msg, idx) => {
              const dmsg = decryptMsg(msg);
              const isOwn = dmsg.alias === identity.alias;
              const isJames = dmsg.alias === 'James';
              const isVerified = dmsg.isVerified || isJames;
              const msgId = msg.id || idx;
              const isPopoverVisible = hoveredMsgId === msgId || activeReactionMsgId === msgId;

              const reactionEntries = Object.entries(msg.reactions || {}).filter(([, users]) => users.length > 0);
              const hasActiveReactions = reactionEntries.length > 0;

              const isImage = dmsg.imageUrl || dmsg.fileType?.startsWith('image/');
              const isVideo = dmsg.videoUrl || dmsg.fileType?.startsWith('video/');
              const isAudio = dmsg.audioUrl || dmsg.fileType?.startsWith('audio/');
              const isOtherFile = dmsg.fileUrl && !isImage && !isVideo && !isAudio;
              const hasFile = isImage || isVideo || isAudio || isOtherFile;

              // File Download Permission: default true
              const isDownloadAllowed = dmsg.allowDownload !== false;
              const isDownloading = downloadingFileId === msgId;

              const detectedUrl = extractFirstUrl(dmsg.text);

              return (
                <div
                  key={msgId}
                  id={`msg-${msgId}`}
                  className={`message-card ${isOwn ? 'own-message' : ''}`}
                  onMouseEnter={() => setHoveredMsgId(msgId)}
                  onMouseLeave={() => setHoveredMsgId(null)}
                >
                  {/* Floating Emoji Reaction Popover */}
                  {isPopoverVisible && (
                    <div className="hover-reaction-bar">
                      {REACTION_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          className="hover-reaction-btn"
                          onClick={() => handleReaction(msgId, emoji)}
                          title={`React ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                      <button
                        className="hover-reaction-btn close-btn"
                        onClick={() => {
                          setHoveredMsgId(null);
                          setActiveReactionMsgId(null);
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}

                  {/* Message Row with ALWAYS-VISIBLE Side Reply Button */}
                  <div className="message-wrapper-row" style={{ position: 'relative' }}>
                    {/* Mobile Instagram-style Swipe-to-Reply indicator cue */}
                    {swipingMsgId === msgId && Math.abs(swipeOffset) > 12 && (
                      <div
                        className={`mobile-swipe-reply-cue ${swipeOffset > 0 ? 'swipe-right' : 'swipe-left'}`}
                        style={{
                          opacity: Math.min(1, (Math.abs(swipeOffset) - 12) / 28),
                          transform: `scale(${Math.min(1.2, 0.75 + Math.abs(swipeOffset) / 75)})`
                        }}
                      >
                        <Reply size={15} />
                      </div>
                    )}

                    {/* If own message: Reply button permanently visible on the left beside message (desktop only) */}
                    {isOwn && (
                      <div className="msg-side-actions left permanent">
                        <button
                          className="msg-side-reply-btn always-visible"
                          onClick={() => startReply(msg, dmsg, msgId)}
                          title="Reply to this message"
                        >
                          <Reply size={13} />
                        </button>
                      </div>
                    )}

                    <div
                      className="message-card-content"
                      onTouchStart={(e) => handleTouchStart(e, msgId)}
                      onTouchMove={(e) => handleTouchMove(e, msgId)}
                      onTouchEnd={() => handleTouchEnd(msg, dmsg, msgId)}
                      style={swipingMsgId === msgId ? { transform: `translateX(${swipeOffset}px)`, transition: 'none' } : { transition: 'transform 0.22s cubic-bezier(0.18, 0.89, 0.32, 1.28)' }}
                    >
                      {/* Message Header */}
                      <div className="message-header">
                        {!isOwn ? (
                          <div
                            className="message-user-info clickable-profile"
                            onClick={() => openUserProfile(dmsg.alias, dmsg.color, dmsg.avatar, isVerified, dmsg.bio, dmsg.status)}
                            title="Click to view profile"
                          >
                            {renderAvatar(dmsg.alias, dmsg.color, dmsg.avatar, 24)}
                            <span className="user-alias-name" style={{ color: dmsg.color || '#00f3ff' }}>
                              {dmsg.alias || 'Anonymous'}
                            </span>

                            {/* Official Twitter/Telegram-style Blue Tick */}
                            {isVerified && (
                              <span className="verified-blue-tick-badge" title="Verified Profile">
                                <VerifiedBlueTick size={14} />
                              </span>
                            )}

                            <span className="time-stamp">{formatTime(dmsg.timestamp)}</span>
                            {msg.encrypted && (
                              <span className="encrypted-tag" title="AES-256 Encrypted">
                                <Lock size={10} /> E2EE
                              </span>
                            )}
                          </div>
                        ) : (
                          <div
                            className="message-user-info own clickable-profile"
                            onClick={() => setShowIdentityModal(true)}
                            title="View your profile"
                          >
                            {msg.encrypted && (
                              <span className="encrypted-tag" title="AES-256 Encrypted">
                                <Lock size={10} /> E2EE
                              </span>
                            )}
                            <span className="time-stamp">{formatTime(dmsg.timestamp)}</span>
                            {isVerified && (
                              <span className="verified-blue-tick-badge" title="Verified Profile">
                                <VerifiedBlueTick size={14} />
                              </span>
                            )}
                            <span className="user-alias-name" style={{ color: dmsg.color || '#00f3ff' }}>
                              {dmsg.alias || 'You'}
                            </span>
                            {renderAvatar(dmsg.alias, dmsg.color, dmsg.avatar, 24)}
                          </div>
                        )}
                      </div>

                      <div className={`message-body ${dmsg.text === '🔒 Encrypted Payload (Enter Passphrase in Vault)' ? 'encrypted-placeholder' : ''}`}>
                        {/* Render Quoted Reply Banner */}
                        {dmsg.replyTo && (
                          <div
                            className="quoted-reply-box"
                            onClick={() => scrollToMessage(dmsg.replyTo.id)}
                            title="Jump to quoted message"
                          >
                            <div className="quoted-reply-indicator" style={{ background: dmsg.replyTo.color || '#00f3ff' }} />
                            <div className="quoted-reply-content">
                              <span className="quoted-reply-author" style={{ color: dmsg.replyTo.color || '#00f3ff' }}>
                                <CornerDownLeft size={10} /> @{dmsg.replyTo.alias || 'User'}
                              </span>
                              <span className="quoted-reply-text">
                                {dmsg.replyTo.text || (dmsg.replyTo.fileName ? `[Attachment: ${dmsg.replyTo.fileName}]` : '[Attachment]')}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Message Text with Interactive Clickable URLs and @Mentions */}
                        {dmsg.text && (
                          <div className="message-text-content">
                            {renderFormattedMessage(dmsg.text)}
                          </div>
                        )}

                        {/* Interactive Link Preview Card */}
                        {detectedUrl && (
                          <div className="link-preview-card" onClick={() => window.open(detectedUrl, '_blank', 'noopener,noreferrer')}>
                            <div className="link-preview-left">
                              <div className="link-icon-badge">
                                <Globe size={15} />
                              </div>
                              <div className="link-details">
                                <span className="link-domain">{getUrlDomain(detectedUrl)}</span>
                                <span className="link-full-url">{detectedUrl}</span>
                              </div>
                            </div>
                            <a
                              href={detectedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link-visit-btn"
                              onClick={e => e.stopPropagation()}
                              title="Open Link"
                            >
                              <ExternalLink size={13} />
                            </a>
                          </div>
                        )}

                        {/* Image Attachment */}
                        {isImage && (
                          <div className="media-attachment-wrapper">
                            <div
                              className="message-image-container"
                              onClick={() => setLightboxImage(resolveMediaUrl(dmsg.imageUrl || dmsg.fileUrl))}
                            >
                              <img src={resolveMediaUrl(dmsg.imageUrl || dmsg.fileUrl)} alt="attachment" className="message-img" />
                            </div>
                          </div>
                        )}

                        {/* Video Attachment */}
                        {isVideo && (
                          <div className="media-attachment-container">
                            <video
                              controls
                              controlsList={!isDownloadAllowed ? "nodownload noplaybackrate" : undefined}
                              disablePictureInPicture={!isDownloadAllowed}
                              onContextMenu={e => { if (!isDownloadAllowed) e.preventDefault(); }}
                              src={resolveMediaUrl(dmsg.videoUrl || dmsg.fileUrl)}
                              className="message-video"
                            />
                          </div>
                        )}

                        {/* Audio / Voice Transmission */}
                        {isAudio && (
                          <div className="audio-attachment-container">
                            <audio
                              controls
                              controlsList={!isDownloadAllowed ? "nodownload" : undefined}
                              onContextMenu={e => { if (!isDownloadAllowed) e.preventDefault(); }}
                              src={resolveMediaUrl(dmsg.audioUrl || dmsg.fileUrl)}
                              className="message-audio"
                            />
                          </div>
                        )}

                        {/* Document / Other File Attachment */}
                        {isOtherFile && (
                          <div className="file-attachment-card">
                            <FileText size={20} color="var(--accent-cyan)" />
                            <div className="file-info-col">
                              <span className="file-title">{dmsg.fileName || 'Attachment'}</span>
                              {dmsg.fileSize && <span className="file-size-tag">{formatFileSize(dmsg.fileSize)}</span>}
                            </div>
                          </div>
                        )}

                        {/* File Action Toolbar: Download Animation + Owner Permission Toggle */}
                        {hasFile && (
                          <div className="file-actions-row">
                            {/* If other user: show Download button (if allowed) OR Preview Only badge (if restricted) */}
                            {!isOwn ? (
                              isDownloadAllowed ? (
                                <button
                                  type="button"
                                  className={`file-download-action-btn ${isDownloading ? 'downloading' : ''}`}
                                  onClick={() => handleDownloadFile(msgId, dmsg.fileUrl, dmsg.fileName)}
                                  disabled={isDownloading}
                                  title="Download file"
                                >
                                  {isDownloading ? (
                                    <>
                                      <Loader2 size={13} className="send-spinner" />
                                      <span>Downloading...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Download size={13} />
                                      <span>Download</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <span className="file-preview-only-badge" title="Downloads restricted by sender">
                                  <Lock size={12} /> Preview Only
                                </span>
                              )
                            ) : (
                              /* If owner: render interactive toggle switch without duplicate badge */
                              <button
                                type="button"
                                className={`file-owner-toggle ${isDownloadAllowed ? 'allowed' : 'restricted'}`}
                                onClick={() => handleToggleFileDownload(msgId, isDownloadAllowed)}
                                title={isDownloadAllowed ? 'Click to make this file Preview Only' : 'Click to allow others to Download'}
                              >
                                {isDownloadAllowed ? (
                                  <>
                                    <Unlock size={12} />
                                    <span>Downloads Allowed</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock size={12} />
                                    <span>Preview Only</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Render Reaction Badges */}
                      {hasActiveReactions && (
                        <div className="reactions-wrapper">
                          {reactionEntries.map(([emoji, users]) => {
                            const count = users.length;
                            const reacted = users.includes(identity.alias);
                            return (
                              <button
                                key={emoji}
                                className={`reaction-pill ${reacted ? 'active' : ''}`}
                                onClick={() => handleReaction(msgId, emoji)}
                                title={`Reacted by: ${users.join(', ')}`}
                              >
                                <span>{emoji}</span>
                                <span className="reaction-count">{count}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* If other's message (or James): Reply button permanently visible beside message on the right */}
                    {!isOwn && (
                      <div className="msg-side-actions right permanent">
                        <button
                          className="msg-side-reply-btn always-visible"
                          onClick={() => startReply(msg, dmsg, msgId)}
                          title="Reply to this message"
                        >
                          <Reply size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Scroll Button */}
        {!atBottom && (
          <button className="scroll-fab" onClick={scrollToBottom}>
            <ChevronDown size={15} /> Latest Transmissions
          </button>
        )}

        {/* Typing Bar */}
        {typingUsers.length > 0 && (
          <div className="typing-bar">
            <div className="typing-dots">
              <span />
              <span />
              <span />
            </div>
            <span>
              {typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
            </span>
          </div>
        )}

        {/* --- Input Composer Area --- */}
        <div className="composer-area">
          {/* @ Mention Autocomplete Floating Dropdown */}
          {showMentionDropdown && mentionCandidates.length > 0 && (
            <div className="mention-autocomplete-dropdown">
              <div className="mention-dropdown-header">
                <AtSign size={13} /> MENTION USERS
              </div>
              {mentionCandidates.map(user => (
                <div
                  key={user}
                  className="mention-dropdown-item"
                  onClick={() => selectMention(user)}
                >
                  {renderAvatar(user, '#00f3ff', null, 20)}
                  <span className="mention-item-name">{user}</span>
                  {(user === 'James' || (user === identity.alias && identity.isVerified)) && (
                    <VerifiedBlueTick size={12} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Replying Banner Preview Bar */}
          {replyingTo && (
            <div className="replying-preview-bar">
              <div className="replying-info">
                <div className="replying-indicator-line" style={{ background: replyingTo.color || '#00f3ff' }} />
                <div className="replying-text-col">
                  <span className="replying-target-name" style={{ color: replyingTo.color || '#00f3ff' }}>
                    <CornerDownLeft size={11} /> Replying to @{replyingTo.alias}
                  </span>
                  <span className="replying-snippet-text">
                    {replyingTo.text || (replyingTo.fileName ? `[Attachment: ${replyingTo.fileName}]` : '[Attachment]')}
                  </span>
                </div>
              </div>
              <button
                className="icon-btn"
                style={{ width: 22, height: 22 }}
                onClick={() => setReplyingTo(null)}
                title="Cancel Reply"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* File Attachment Chip Preview */}
          {attachedFile && (
            <div className="attachment-preview">
              {filePreview ? (
                <img src={filePreview} alt="thumb" className="attachment-thumb" />
              ) : (
                <FileText size={18} color="var(--accent-cyan)" />
              )}
              <span className="attachment-name">{attachedFile.name} ({formatFileSize(attachedFile.size)})</span>
              <button className="icon-btn" style={{ width: 22, height: 22 }} onClick={removeSelectedFile} title="Remove file">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Voice Recording Live Bar */}
          {isRecording ? (
            <div className="voice-recording-row">
              <div className="recording-status">
                <span className="recording-dot" />
                <span>REC {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
              </div>
              <div className="voice-actions">
                <button type="button" className="icon-btn cancel-btn" onClick={cancelRecording} title="Cancel Recording">
                  <X size={16} />
                </button>
                <button type="button" className="icon-btn composer-tool-btn send-btn active" onClick={stopAndSendRecording} title="Send Voice Transmission">
                  <ArrowRight size={18} strokeWidth={2.2} />
                </button>
              </div>
            </div>
          ) : (
            <form className="composer-row" onSubmit={sendMessage}>
              <textarea
                ref={textareaRef}
                className="chat-textarea"
                placeholder={
                  replyingTo
                    ? `Reply to @${replyingTo.alias}...`
                    : attachedFile
                      ? 'Add caption or send file...'
                      : passphrase
                        ? 'Type encrypted transmission (type @ to mention)...'
                        : 'Type a message (type @ to mention, paste link)...'
                }
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={uploading}
              />

              <div className="composer-tools">
                <input
                  type="file"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip,.rar,.txt,.json,.csv,*/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  className={`icon-btn composer-tool-btn ${attachedFile ? 'active' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach File"
                >
                  <Paperclip size={18} />
                </button>

                <button
                  type="button"
                  className="icon-btn composer-tool-btn"
                  onClick={startRecording}
                  title="Record Voice Note"
                >
                  <Mic size={18} />
                </button>

                {/* Send Button synced with other composer buttons */}
                <button
                  className={`icon-btn composer-tool-btn send-btn ${input.trim() || attachedFile ? 'active' : ''}`}
                  type="submit"
                  disabled={uploading || (!input.trim() && !attachedFile)}
                  title={uploading ? 'Transmitting...' : 'Send'}
                >
                  {uploading ? (
                    <Loader2 size={16} className="send-spinner" />
                  ) : (
                    <ArrowRight size={18} strokeWidth={2.2} />
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* --- Other User Profile Popup Modal --- */}
      {selectedUserProfile && (
        <div className="modal-overlay" onClick={() => setSelectedUserProfile(null)}>
          <div className="modal-content user-popup-modal" onClick={e => e.stopPropagation()}>
            <div className="user-popup-header">
              <button className="icon-btn popup-close" onClick={() => setSelectedUserProfile(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="user-popup-body">
              <div className="user-popup-avatar-ring">
                {renderAvatar(selectedUserProfile.alias, selectedUserProfile.color, selectedUserProfile.avatar, 72)}
              </div>
              <div className="user-popup-name-row">
                <h3 className="user-popup-name" style={{ color: selectedUserProfile.color || '#00f3ff' }}>
                  @{selectedUserProfile.alias}
                </h3>
                {selectedUserProfile.isVerified && (
                  <VerifiedBlueTick size={19} className="verified-blue-tick" />
                )}
              </div>
              <span className="user-popup-status-badge">
                <span className="status-dot-sm online" /> {selectedUserProfile.status || 'Active on Mesh'}
              </span>
              <p className="user-popup-bio">
                {selectedUserProfile.bio || 'Encrypted mesh user'}
              </p>

              <div className="user-popup-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setInput(prev => `${prev ? prev + ' ' : ''}@${selectedUserProfile.alias} `);
                    setSelectedUserProfile(null);
                    setTimeout(() => textareaRef.current?.focus(), 50);
                  }}
                >
                  <AtSign size={14} /> Mention @{selectedUserProfile.alias}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    startReply(null, selectedUserProfile, Date.now());
                    setSelectedUserProfile(null);
                  }}
                >
                  <Reply size={14} /> Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Real Email 4-Digit OTP Verification Modal --- */}
      {showOtpModal && (
        <div className="modal-overlay otp-modal-overlay" onClick={closeOtpModal}>
          <div className="modal-content otp-verification-card" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="otp-modal-header">
              <div className="otp-header-left">
                <div className="otp-header-icon-wrap">
                  <Mail size={18} />
                </div>
                <div>
                  <h3 className="otp-modal-title">Verified Blue Tick</h3>
                  <span className="otp-modal-subtitle">4-Digit Email Verification</span>
                </div>
              </div>
              <button className="icon-btn otp-modal-close" onClick={closeOtpModal} title="Close">
                <X size={18} />
              </button>
            </div>

            {/* STEP 1: Enter Email */}
            {otpStep === 'email' && (
              <div className="otp-modal-body">
                <div className="otp-step-graphic">
                  <div className="otp-pulse-ring">
                    <Mail size={32} color="#00f3ff" />
                  </div>
                </div>

                <h4 className="otp-step-heading">Verify Your Email Address</h4>
                <p className="otp-step-desc">
                  Enter your email address to receive a <strong>4-digit verification code</strong>. Once confirmed, you will instantly earn the official Verified Blue Tick badge.
                </p>

                <div className="otp-form-group">
                  <label className="otp-field-label">YOUR EMAIL ADDRESS</label>
                  <div className="otp-input-wrapper">
                    <Mail size={16} className="otp-input-icon" />
                    <input
                      type="email"
                      className="otp-text-input"
                      placeholder="e.g. name@gmail.com"
                      value={targetEmail}
                      onChange={e => {
                        setTargetEmail(e.target.value);
                        setOtpError('');
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSendOtp();
                      }}
                      autoFocus
                    />
                  </div>
                </div>

                {otpError && (
                  <div className="otp-error-banner">
                    {otpError}
                  </div>
                )}

                <button
                  type="button"
                  className="otp-primary-action-btn"
                  onClick={handleSendOtp}
                  disabled={otpLoading}
                >
                  {otpLoading ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      <span>Sending 4-Digit Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send 4-Digit Code</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

              </div>
            )}

            {/* STEP 2: Enter 4-Digit Code */}
            {otpStep === 'code' && (
              <div className="otp-modal-body">
                <div className="otp-step-heading-row">
                  <button
                    type="button"
                    className="otp-back-btn"
                    onClick={() => setOtpStep('email')}
                    title="Change email"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <h4 className="otp-step-heading">Enter 4-Digit Code</h4>
                    <p className="otp-step-desc">
                      Sent to <strong>{targetEmail}</strong>
                    </p>
                  </div>
                </div>

                {/* 4 Individual Digit Input Boxes */}
                <div className="otp-boxes-row" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      className={`otp-digit-box ${digit ? 'filled' : ''} ${otpError ? 'has-error' : ''}`}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                {otpError && (
                  <div className="otp-error-banner">
                    {otpError}
                  </div>
                )}

                <button
                  type="button"
                  className="otp-primary-action-btn"
                  onClick={() => handleVerifyOtp()}
                  disabled={otpLoading || otpDigits.join('').length < 4}
                >
                  {otpLoading ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>Verify & Claim Blue Tick</span>
                    </>
                  )}
                </button>

                {/* Resend Row with Countdown */}
                <div className="otp-resend-row">
                  <span>Didn't get the code?</span>{' '}
                  {otpResendCountdown > 0 ? (
                    <span className="otp-countdown-text">Resend in {otpResendCountdown}s</span>
                  ) : (
                    <button
                      type="button"
                      className="otp-resend-link-btn"
                      onClick={handleSendOtp}
                      disabled={otpLoading}
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: Verification Success */}
            {otpStep === 'success' && (
              <div className="otp-modal-body otp-success-view">
                <div className="otp-success-icon-wrap">
                  <VerifiedBlueTick size={64} />
                </div>
                <h4 className="otp-success-title">Email Verified!</h4>
                <p className="otp-success-desc">
                  Official Verified Blue Tick awarded to <strong>@{identity.alias}</strong>.
                </p>
                <div className="otp-success-preview-badge">
                  <span className="otp-badge-name">@{identity.alias}</span>
                  <VerifiedBlueTick size={18} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Modal: Upgraded Profile Matrix with 20 Illustrated Avatars & Live Verification --- */}
      {showIdentityModal && (
        <div className="modal-overlay" onClick={() => setShowIdentityModal(false)}>
          <div className="modal-content profile-modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <User size={18} /> USER PROFILE MATRIX
              </div>
              <button className="icon-btn" onClick={() => setShowIdentityModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              {/* Profile Preview Card */}
              <div className="profile-preview-card">
                <div className="profile-preview-avatar-wrap">
                  {renderAvatar(identity.alias, identity.color, identity.avatar, 54)}
                  <span className={`status-indicator-dot ${identity.status?.toLowerCase() || 'online'}`} />
                </div>
                <div className="profile-preview-info">
                  <div className="profile-preview-name-row">
                    <span className="profile-preview-name" style={{ color: identity.color || '#00f3ff' }}>
                      @{identity.alias}
                    </span>
                    {identity.isVerified && (
                      <span className="verified-blue-tick-badge" title="Verified Profile">
                        <VerifiedBlueTick size={16} />
                      </span>
                    )}
                  </div>
                  <span className="profile-preview-bio">{identity.bio || 'Encrypted mesh user'}</span>
                  <span className="profile-preview-status-tag">Status: {identity.status || 'Online'}</span>
                </div>
              </div>

              {/* Username & Randomize */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>USERNAME</label>
                  <button
                    type="button"
                    className="dice-randomize-btn"
                    onClick={generateNewIdentity}
                    title="Generate New Real Username"
                  >
                    <RefreshCw size={12} /> Randomize Username
                  </button>
                </div>
                <input
                  type="text"
                  className="form-input"
                  value={identity.alias}
                  onChange={e => setIdentity({ ...identity, alias: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') })}
                  maxLength={24}
                  placeholder="e.g. alex_vance, elena_reed..."
                />
              </div>

              {/* Custom Profile Picture Upload from Device */}
              <div className="form-group">
                <label className="form-label">UPLOAD CUSTOM PROFILE PICTURE</label>
                <div className="avatar-upload-row">
                  <input
                    type="file"
                    accept="image/*"
                    ref={avatarUploadRef}
                    style={{ display: 'none' }}
                    onChange={handleAvatarFileUpload}
                  />
                  <button
                    type="button"
                    className="avatar-upload-btn"
                    onClick={() => avatarUploadRef.current?.click()}
                  >
                    <Camera size={15} /> Upload Photo from Device
                  </button>
                  {identity.avatar && (
                    <button
                      type="button"
                      className="avatar-reset-btn"
                      onClick={() => setIdentity({ ...identity, avatar: null })}
                    >
                      Reset Photo
                    </button>
                  )}
                </div>
              </div>

              {/* 20 Unique Illustrated Preset Avatars (Matching Reference Image) */}
              <div className="form-group">
                <label className="form-label">CHOOSE ILLUSTRATED CHARACTER AVATAR (20 PRESETS)</label>
                <div className="avatar-picker-grid twenty-grid">
                  {PRESET_AVATARS.map(opt => (
                    <button
                      key={opt.id}
                      className={`avatar-option-btn illustrated ${identity.avatar === opt.svg ? 'selected' : ''}`}
                      onClick={() => setIdentity({ ...identity, avatar: opt.svg })}
                      title={opt.name}
                    >
                      <img src={opt.svg} alt={opt.name} className="avatar-option-img rounded-full" />
                      <span className="avatar-option-label">{opt.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Bio / Status Line */}
              <div className="form-group">
                <label className="form-label">PROFILE BIO / STATUS</label>
                <input
                  type="text"
                  className="form-input"
                  value={identity.bio || ''}
                  onChange={e => setIdentity({ ...identity, bio: e.target.value })}
                  maxLength={65}
                  placeholder="Tell others what you're working on..."
                />
              </div>

              {/* Status Picker */}
              <div className="form-group">
                <label className="form-label">ACTIVE STATUS</label>
                <div className="status-picker-row">
                  {['Online', 'In the Zone', 'Away'].map(st => (
                    <button
                      key={st}
                      type="button"
                      className={`status-chip ${identity.status === st ? 'active' : ''}`}
                      onClick={() => setIdentity({ ...identity, status: st })}
                    >
                      <span className={`status-dot-sm ${st.toLowerCase().replace(/\s+/g, '-')}`} />
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blue Tick Verification Section with 4-Digit Email OTP */}
              <div className="form-group verification-section">
                <div className="verification-header-row">
                  <label className="form-label" style={{ margin: 0 }}>BLUE TICK VERIFICATION</label>
                  {identity.isVerified && (
                    <span className="verified-pill">
                      <VerifiedBlueTick size={13} /> VERIFIED
                    </span>
                  )}
                </div>

                {identity.isVerified ? (
                  <div className="verified-active-card">
                    <div className="verified-active-text">
                      <VerifiedBlueTick size={22} />
                      <div>
                        <strong>Account Verified</strong>
                        <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', opacity: 0.85 }}>
                          Verified via Email ({identity.verifiedEmail || 'mesh user'}). Official Blue Tick is active on all your messages and transmissions.
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.7rem' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', borderColor: '#00f3ff', color: '#00f3ff' }}
                        onClick={startEmailVerification}
                      >
                        <Mail size={14} style={{ marginRight: 5 }} /> Verify Different Email
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                        onClick={() => setIdentity(prev => ({ ...prev, isVerified: false, verifiedEmail: null }))}
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="verification-box email-verification-box">
                    <p className="verification-desc">
                      Enter your email address to receive a <strong>4-digit verification code</strong> and claim the official Verified Blue Tick badge.
                    </p>

                    <button
                      type="button"
                      className="email-verify-trigger-btn"
                      onClick={startEmailVerification}
                    >
                      <Mail size={18} />
                      <span>Verify Email with 4-Digit OTP</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Accent Theme Color */}
              <div className="form-group">
                <label className="form-label">THEME ACCENT COLOR</label>
                <div className="swatch-group">
                  {HACKER_COLORS.map(c => (
                    <button
                      key={c}
                      className={`swatch-btn ${identity.color === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => setIdentity({ ...identity, color: c })}
                    />
                  ))}
                </div>
              </div>

              <button className="btn-primary" style={{ marginTop: '0.8rem', width: '100%' }} onClick={() => setShowIdentityModal(false)}>
                <Check size={16} /> Save Profile Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal: Encryption Key Vault --- */}
      {showVaultModal && (
        <div className="modal-overlay" onClick={() => setShowVaultModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Key size={18} /> AES-256 PASSPHRASE VAULT
              </div>
              <button className="icon-btn" onClick={() => setShowVaultModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Enter a secret passphrase key. All messages are encrypted locally using AES-256 before transmission.
              </p>

              <div className="form-group">
                <label className="form-label">PASSPHRASE KEY</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showPassphraseKey ? 'text' : 'password'}
                    className="form-input"
                    style={{ width: '100%', paddingRight: '2.5rem' }}
                    value={passphrase}
                    onChange={e => setPassphrase(e.target.value)}
                    placeholder="Enter encryption key..."
                  />
                  <button
                    className="icon-btn"
                    style={{ position: 'absolute', right: '0.4rem', width: 28, height: 28 }}
                    onClick={() => setShowPassphraseKey(!showPassphraseKey)}
                  >
                    {showPassphraseKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setPassphrase(generateRandomPassphrase())}
                >
                  <RefreshCw size={14} /> Generate Key
                </button>
                {passphrase && (
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, color: 'var(--accent-pink)', borderColor: 'var(--accent-pink)' }}
                    onClick={() => setPassphrase('')}
                  >
                    Clear Vault
                  </button>
                )}
              </div>

              <button className="btn-primary" style={{ marginTop: '0.5rem' }} onClick={() => setShowVaultModal(false)}>
                <Lock size={15} /> Save Encryption Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Lightbox Modal --- */}
      {lightboxImage && (
        <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <button className="icon-btn lightbox-close" onClick={() => setLightboxImage(null)}>
            <X size={20} />
          </button>
          <img src={lightboxImage} alt="enlarged" className="lightbox-img" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

export default App;

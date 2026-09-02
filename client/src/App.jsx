import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import CryptoJS from 'crypto-js';
import {
  Terminal,
  Search,
  Key,
  Send,
  Paperclip,
  Mic,
  X,
  ChevronDown,
  Lock,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  User,
  Shield,
  FileText,
  Download
} from 'lucide-react';
import './App.css';

const SERVER_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000'
  : 'https://shadow-talk-kryk.onrender.com';

const SOCKET_URL = SERVER_URL;
const UPLOAD_URL = `${SERVER_URL}/upload`;

const HACKER_ALIASES = [
  'ShadowFox', 'NeonSpectre', 'ByteGhost', 'ZeroTrace', 'CipherWolf',
  'NightRoot', 'HexPhantom', 'PulseVapor', 'GlitchWarden', 'Darkline',
  'GhostShell', 'BitShade', 'NullSpecter', 'RootWisp', 'EchoCipher',
  'VaporBlade', 'QuantumVoid', 'KestrelGrid', 'StealthNode', 'MatrixReaper'
];

const HACKER_COLORS = [
  '#00f3ff', '#00ff66', '#ff007f', '#9d4edd', '#fffb00',
  '#ff5e00', '#00ffb3', '#b300ff', '#ff003c', '#00a8ff'
];

const AVATAR_OPTIONS = [
  { id: 'initials', name: 'Initials Badge', svg: null },
  {
    id: 'cyber-ninja',
    name: 'Cyber Ninja',
    svg: 'data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" fill="%230d131e" stroke="%2300f3ff" stroke-width="4"/><path d="M25 40 h50 v20 h-50 z" fill="%231e293b"/><circle cx="40" cy="50" r="5" fill="%2300f3ff"/><circle cx="60" cy="50" r="5" fill="%2300f3ff"/><path d="M20 32 L50 20 L80 32" stroke="%2300f3ff" stroke-width="4" fill="none"/></svg>'
  },
  {
    id: 'quantum-bot',
    name: 'Quantum Bot',
    svg: 'data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" fill="%230d131e" stroke="%2300ff66" stroke-width="4"/><rect x="30" y="30" width="40" height="35" rx="8" fill="%231e293b" stroke="%2300ff66" stroke-width="3"/><circle cx="42" cy="45" r="6" fill="%2300ff66"/><circle cx="58" cy="45" r="6" fill="%2300ff66"/><line x1="38" y1="58" x2="62" y2="58" stroke="%2300ff66" stroke-width="3"/><line x1="50" y1="15" x2="50" y2="30" stroke="%2300ff66" stroke-width="4"/><circle cx="50" cy="12" r="4" fill="%2300ff66"/></svg>'
  },
  {
    id: 'neon-ghost',
    name: 'Neon Ghost',
    svg: 'data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" fill="%230d131e" stroke="%23ff007f" stroke-width="4"/><path d="M30 70 C 30 35, 70 35, 70 70 C 63 65, 57 73, 50 67 C 43 73, 37 65, 30 70 Z" fill="%23ff007f" opacity="0.85"/><circle cx="43" cy="48" r="4" fill="%230d131e"/><circle cx="57" cy="48" r="4" fill="%230d131e"/></svg>'
  },
  {
    id: 'cipher-fox',
    name: 'Cipher Fox',
    svg: 'data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" fill="%230d131e" stroke="%23ff5e00" stroke-width="4"/><polygon points="25,30 35,55 20,60" fill="%23ff5e00"/><polygon points="75,30 65,55 80,60" fill="%23ff5e00"/><polygon points="35,50 65,50 50,80" fill="%23ffaa00"/><circle cx="42" cy="55" r="4" fill="%230d131e"/><circle cx="58" cy="55" r="4" fill="%230d131e"/></svg>'
  },
  {
    id: 'matrix-cat',
    name: 'Matrix Cat',
    svg: 'data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" fill="%230d131e" stroke="%239d4edd" stroke-width="4"/><polygon points="25,25 40,45 20,50" fill="%239d4edd"/><polygon points="75,25 60,45 80,50" fill="%239d4edd"/><circle cx="50" cy="58" r="22" fill="%231e293b" stroke="%239d4edd" stroke-width="2"/><ellipse cx="40" cy="54" rx="4" ry="6" fill="%2300f3ff"/><ellipse cx="60" cy="54" rx="4" ry="6" fill="%2300f3ff"/><polygon points="50,62 47,66 53,66" fill="%239d4edd"/></svg>'
  },
  {
    id: 'stealth-skull',
    name: 'Stealth Skull',
    svg: 'data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" fill="%230d131e" stroke="%23ff0055" stroke-width="4"/><path d="M32 35 C 32 20, 68 20, 68 35 C 68 55, 60 62, 60 70 L40 70 C 40 62, 32 55, 32 35 Z" fill="%23e2e8f0"/><circle cx="42" cy="45" r="7" fill="%230d131e"/><circle cx="58" cy="45" r="7" fill="%230d131e"/><polygon points="50,55 46,62 54,62" fill="%230d131e"/><line x1="46" y1="66" x2="46" y2="70" stroke="%230d131e" stroke-width="2"/><line x1="50" y1="66" x2="50" y2="70" stroke="%230d131e" stroke-width="2"/><line x1="54" y1="66" x2="54" y2="70" stroke="%230d131e" stroke-width="2"/></svg>'
  }
];

const REACTION_EMOJIS = ['👍', '❤️', '🔥', '😂', '😮', '👀', '🚀', '💀'];

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
    try { return JSON.parse(identity); } catch { /* ignore */ }
  }
  const alias = HACKER_ALIASES[Math.floor(Math.random() * HACKER_ALIASES.length)] + Math.floor(Math.random() * 900 + 100);
  const color = HACKER_COLORS[Math.floor(Math.random() * HACKER_COLORS.length)];
  identity = { alias, color, avatar: null };
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
  if (dmsgAvatar) {
    return <img src={dmsgAvatar} alt="avatar" className="avatar-img" style={{ width: size, height: size }} />;
  }
  return (
    <div className="user-avatar-circle" style={{ background: dmsgColor || '#00f3ff', width: size, height: size, fontSize: size * 0.45 }}>
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
  const longPressTimerRef = useRef(null);

  const [typingUsers, setTypingUsers] = useState([]);
  const [atBottom, setAtBottom] = useState(true);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('init', (msgs) => setMessages(msgs));
    socketRef.current.on('userCount', (count) => setOnlineCount(count || 1));

    socketRef.current.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socketRef.current.on('reaction', ({ messageId, reactions }) => {
      setMessages((prev) => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachedFile(file);
      if (file.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeSelectedFile = () => {
    setAttachedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Voice Message Recording Logic with Bulletproof Base64 Fallback
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

        // Try server upload using field 'image' (compatible with remote backend)
        try {
          const formData = new FormData();
          formData.append('image', audioFile);
          formData.append('file', audioFile);

          const res = await fetch(UPLOAD_URL, { method: 'POST', body: formData });
          if (res.ok) {
            const data = await res.json();
            audioUrl = data.fileUrl || data.imageUrl;
          }
        } catch {
          /* ignore and use fallback */
        }

        // Bulletproof Fallback: convert audio to Base64 Data URL if server upload fails or 500s
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
          avatar: identity.avatar
        }));

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

  // Send Message / File Payload with Bulletproof Base64 Fallback
  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (uploading) return;

    if (attachedFile) {
      setUploading(true);
      let uploadedUrl = null;

      try {
        const formData = new FormData();
        formData.append('image', attachedFile);
        formData.append('file', attachedFile);

        const res = await fetch(UPLOAD_URL, { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          uploadedUrl = data.fileUrl || data.imageUrl;
        }
      } catch {
        /* ignore and use fallback */
      }

      // Fallback if server upload returned error or 500
      if (!uploadedUrl) {
        uploadedUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(attachedFile);
        });
      }

      const isImg = attachedFile.type.startsWith('image/');
      const isVid = attachedFile.type.startsWith('video/');
      const isAud = attachedFile.type.startsWith('audio/');

      socketRef.current.emit('message', encryptMsg({
        text: input.trim() || null,
        fileUrl: uploadedUrl,
        imageUrl: isImg ? uploadedUrl : null,
        videoUrl: isVid ? uploadedUrl : null,
        audioUrl: isAud ? uploadedUrl : null,
        fileName: attachedFile.name,
        fileType: attachedFile.type,
        fileSize: attachedFile.size,
        alias: identity.alias,
        color: identity.color,
        avatar: identity.avatar
      }));

      removeSelectedFile();
      setInput('');
      setUploading(false);
      return;
    }

    if (input.trim()) {
      socketRef.current.emit('message', encryptMsg({
        text: input,
        alias: identity.alias,
        color: identity.color,
        avatar: identity.avatar
      }));
      setInput('');
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    socketRef.current.emit('typing', { alias: identity.alias });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReaction = (messageId, emoji) => {
    socketRef.current.emit('reaction', { messageId, emoji, alias: identity.alias });
    setActiveReactionMsgId(null);
  };

  const generateNewIdentity = () => {
    const newAlias = HACKER_ALIASES[Math.floor(Math.random() * HACKER_ALIASES.length)] + Math.floor(Math.random() * 900 + 100);
    const newColor = HACKER_COLORS[Math.floor(Math.random() * HACKER_COLORS.length)];
    setIdentity({ ...identity, alias: newAlias, color: newColor });
  };

  const handleTouchStart = (msgId) => {
    longPressTimerRef.current = setTimeout(() => {
      setActiveReactionMsgId(msgId);
    }, 380);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
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

          <div className="online-members-badge" title="Active Members Connected">
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
            title="Hacker Profile Settings"
          >
            {renderAvatar(identity.alias, identity.color, identity.avatar, 22)}
            <span className="profile-btn-alias">{identity.alias}</span>
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
              const msgId = msg.id || idx;
              const isPopoverVisible = hoveredMsgId === msgId || activeReactionMsgId === msgId;

              const reactionEntries = Object.entries(msg.reactions || {}).filter(([, users]) => users.length > 0);
              const hasActiveReactions = reactionEntries.length > 0;

              const isImage = dmsg.imageUrl || dmsg.fileType?.startsWith('image/');
              const isVideo = dmsg.videoUrl || dmsg.fileType?.startsWith('video/');
              const isAudio = dmsg.audioUrl || dmsg.fileType?.startsWith('audio/');
              const isOtherFile = dmsg.fileUrl && !isImage && !isVideo && !isAudio;

              return (
                <div
                  key={msgId}
                  className={`message-card ${isOwn ? 'own-message' : ''}`}
                  onMouseEnter={() => setHoveredMsgId(msgId)}
                  onMouseLeave={() => setHoveredMsgId(null)}
                  onTouchStart={() => handleTouchStart(msgId)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                >
                  {/* Floating Hover & Touch Reaction Popover */}
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

                  {/* Message Header */}
                  <div className="message-header">
                    {!isOwn ? (
                      <div className="message-user-info">
                        {renderAvatar(dmsg.alias, dmsg.color, dmsg.avatar, 24)}
                        <span className="user-alias-name" style={{ color: dmsg.color || '#00f3ff' }}>
                          {dmsg.alias || 'Anonymous'}
                        </span>
                        <span className="time-stamp">{formatTime(dmsg.timestamp)}</span>
                        {msg.encrypted && (
                          <span className="encrypted-tag" title="AES-256 Encrypted">
                            <Lock size={10} /> E2EE
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="message-user-info own">
                        {msg.encrypted && (
                          <span className="encrypted-tag" title="AES-256 Encrypted">
                            <Lock size={10} /> E2EE
                          </span>
                        )}
                        <span className="time-stamp">{formatTime(dmsg.timestamp)}</span>
                        {renderAvatar(dmsg.alias, dmsg.color, dmsg.avatar, 24)}
                      </div>
                    )}
                  </div>

                  <div className={`message-body ${dmsg.text === '🔒 Encrypted Payload (Enter Passphrase in Vault)' ? 'encrypted-placeholder' : ''}`}>
                    {dmsg.text && <span>{dmsg.text}</span>}

                    {/* Image Attachment */}
                    {isImage && (
                      <div
                        className="message-image-container"
                        onClick={() => setLightboxImage(resolveMediaUrl(dmsg.imageUrl || dmsg.fileUrl))}
                      >
                        <img src={resolveMediaUrl(dmsg.imageUrl || dmsg.fileUrl)} alt="attachment" className="message-img" />
                      </div>
                    )}

                    {/* Video Attachment */}
                    {isVideo && (
                      <div className="media-attachment-container">
                        <video controls src={resolveMediaUrl(dmsg.videoUrl || dmsg.fileUrl)} className="message-video" />
                      </div>
                    )}

                    {/* Audio / Voice Transmission */}
                    {isAudio && (
                      <div className="audio-attachment-container">
                        <audio controls src={resolveMediaUrl(dmsg.audioUrl || dmsg.fileUrl)} className="message-audio" />
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
                        <a
                          href={resolveMediaUrl(dmsg.fileUrl)}
                          download={dmsg.fileName || 'file'}
                          target="_blank"
                          rel="noreferrer"
                          className="file-download-btn"
                          title="Download File"
                        >
                          <Download size={15} />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Render Reaction Badges ONLY IF someone has reacted */}
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
              {typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} transmitting...
            </span>
          </div>
        )}

        {/* --- Minimal Composer Bar & Voice Note UI --- */}
        <div className="composer-area">
          {/* File Attachment Chip Preview */}
          {attachedFile && (
            <div className="attachment-preview">
              {filePreview && <img src={filePreview} alt="thumb" className="attachment-thumb" />}
              <span className="attachment-name">{attachedFile.name} ({formatFileSize(attachedFile.size)})</span>
              <button className="icon-btn" style={{ width: 22, height: 22 }} onClick={removeSelectedFile}>
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
                <button type="button" className="send-btn record-send" onClick={stopAndSendRecording} title="Send Voice Transmission">
                  <Send size={15} />
                </button>
              </div>
            </div>
          ) : (
            <form className="composer-row" onSubmit={sendMessage}>
              <textarea
                className="chat-textarea"
                placeholder={passphrase ? 'Type encrypted transmission...' : 'Type message...'}
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
                  className="icon-btn minimal-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach Media or Document"
                >
                  <Paperclip size={17} />
                </button>

                <button
                  type="button"
                  className="icon-btn minimal-btn"
                  onClick={startRecording}
                  title="Record Voice Note"
                >
                  <Mic size={17} />
                </button>

                <button className="send-btn minimal-send" type="submit" disabled={uploading || (!input.trim() && !attachedFile)}>
                  <Send size={16} />
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* --- Modal: Identity Profile Customizer --- */}
      {showIdentityModal && (
        <div className="modal-overlay" onClick={() => setShowIdentityModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <User size={18} /> HACKER PROFILE MATRIX
              </div>
              <button className="icon-btn" onClick={() => setShowIdentityModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">CURRENT ALIAS</label>
                <input
                  type="text"
                  className="form-input"
                  value={identity.alias}
                  onChange={e => setIdentity({ ...identity, alias: e.target.value })}
                  maxLength={24}
                />
              </div>

              <div className="form-group">
                <label className="form-label">AVATAR IMAGE MATRIX</label>
                <div className="avatar-picker-grid">
                  {AVATAR_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      className={`avatar-option-btn ${identity.avatar === opt.svg ? 'selected' : ''}`}
                      onClick={() => setIdentity({ ...identity, avatar: opt.svg })}
                      title={opt.name}
                    >
                      {opt.svg ? (
                        <img src={opt.svg} alt={opt.name} className="avatar-option-img" />
                      ) : (
                        <div
                          className="user-avatar-circle"
                          style={{ background: identity.color, width: 34, height: 34, fontSize: 13 }}
                        >
                          {(identity.alias || '?').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="avatar-option-label">{opt.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">AVATAR NEON HIGHLIGHT</label>
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

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={generateNewIdentity}>
                  <RefreshCw size={15} /> Randomize Alias
                </button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={() => setShowIdentityModal(false)}>
                  <Sparkles size={15} /> Save Changes
                </button>
              </div>
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

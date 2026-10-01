import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  Terminal,
  Send,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Smile,
  CornerDownLeft,
  Paperclip,
  Mic,
  X,
  FileText,
  Download,
  Play,
  Pause,
  Loader2,
  AtSign,
  Globe,
  ExternalLink,
  ShieldCheck,
  Eye,
  Code2,
  BarChart2,
  Cpu,
  Layers,
  Radio,
  Trash2,
  Ban,
  RotateCw,
  Copy,
  Check,
  QrCode
} from 'lucide-react';
import { VerifiedBlueTick, renderAvatar } from '../../App';
import './SecretSocietyChat.css';

const QUICK_REACTIONS = ['👍', '🔥', '💡', '🛡️'];

const ENCLAVE_COMMANDS = [
  {
    cmd: '/secrets',
    title: '/secrets',
    desc: 'Access Enclave Classified Dossier #094 & sovereign architecture'
  },
  {
    cmd: '/darkweb',
    title: '/darkweb <query>',
    desc: 'Deep Tor onion network scan & clandestine intelligence probe'
  },
  {
    cmd: '/deepscan',
    title: '/deepscan <target>',
    desc: 'Deep internet OSINT, DoH infrastructure probe & attack surface'
  },
  {
    cmd: '/planetary-plan',
    title: '/planetary-plan',
    desc: 'Earth resilience telemetry, microgrids & sensor rings'
  },
  {
    cmd: '/debate',
    title: '/debate <topic>',
    desc: 'Initiate Socratic Council Debate Protocol'
  },
  {
    cmd: '/intel',
    title: '/intel <topic>',
    desc: 'Classified Enclave signals & clandestine intelligence'
  },
  {
    cmd: '/dossier',
    title: '/dossier <subject>',
    desc: 'Compile & download high-clearance classified Enclave PDF dossier'
  }
];

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function resolveMediaUrl(url, serverUrl = '') {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return (serverUrl || '').replace(/\/$/, '') + url;
}

// Custom Voice Waveform Player for Sovereign Enclave Voice Transmissions
function EnclaveVoiceWaveformPlayer({ audioUrl, isOwn, durationSec }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSec || 0);
  const audioRef = useRef(null);

  const bars = useMemo(() => {
    const count = 26;
    const result = [];
    let seed = 42;
    if (audioUrl) {
      for (let i = 0; i < audioUrl.length; i++) {
        seed = (seed + audioUrl.charCodeAt(i) * (i + 1)) % 10000;
      }
    }
    for (let i = 0; i < count; i++) {
      const envelope = Math.sin((i / (count - 1)) * Math.PI);
      const pseudo = ((seed * (i + 5) * 9301 + 49297) % 233280) / 233280;
      const height = Math.max(22, Math.min(100, Math.floor((envelope * 0.55 + pseudo * 0.45) * 80 + 20)));
      result.push(height);
    }
    return result;
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && (!duration || duration === 0)) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [duration]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const formatSec = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`enclave-voice-player ${isOwn ? 'own' : ''}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <button
        type="button"
        className="enclave-voice-play-btn"
        onClick={togglePlay}
        title={isPlaying ? 'Pause' : 'Play voice note'}
      >
        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
      </button>

      <div className="enclave-voice-waveform-col">
        <div className="enclave-waveform-bars">
          {bars.map((h, i) => {
            const barPct = (i / bars.length) * 100;
            const isPlayed = barPct <= progress;
            return (
              <span
                key={i}
                className={`enclave-wave-bar ${isPlayed ? 'played' : ''}`}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>
        <div className="enclave-voice-time-row">
          <span>{formatSec(currentTime)}</span>
          <span>{formatSec(duration)}</span>
        </div>
      </div>
    </div>
  );
}

// --- Cybernetic James Generation Cards Matching Normal Chat ---
function JamesImageGenerationCard({ jamesStatus }) {
  const [percent, setPercent] = useState(14);

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent(prev => {
        if (prev < 32) return prev + Math.floor(Math.random() * 4 + 2);
        if (prev < 72) return prev + Math.floor(Math.random() * 3 + 1);
        if (prev < 92) return prev + Math.floor(Math.random() * 2 + 1);
        return 94;
      });
    }, 260);
    return () => clearInterval(interval);
  }, []);

  const dots = useMemo(() => Array.from({ length: 256 }, (_, i) => i), []);

  return (
    <div className="dot-matrix-canvas">
      <div className="dot-matrix-top-bar">
        <span className="dot-matrix-header-title">Creating image</span>
        {jamesStatus?.prompt && (
          <span className="dot-matrix-prompt-hint" title={jamesStatus.prompt}>
            &ldquo;{jamesStatus.prompt.length > 45 ? jamesStatus.prompt.slice(0, 45) + '...' : jamesStatus.prompt}&rdquo;
          </span>
        )}
      </div>

      <div className="dot-matrix-grid">
        {dots.map(i => {
          const row = Math.floor(i / 16);
          const col = i % 16;
          const delay = ((row + col) * 0.07).toFixed(2);
          return (
            <span
              key={i}
              className="dot-matrix-dot"
              style={{ animationDelay: `${delay}s` }}
            />
          );
        })}
      </div>

      <div className="dot-matrix-pill">
        <span className="dot-matrix-percent">{percent}%</span>
      </div>
    </div>
  );
}

function JamesPdfGenerationCard({ jamesStatus }) {
  const [percent, setPercent] = useState(18);

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent(prev => (prev < 93 ? prev + Math.floor(Math.random() * 3 + 2) : 94));
    }, 240);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pdf-modern-canvas">
      <div className="pdf-modern-header">
        <span className="pdf-modern-title">Compiling document</span>
        <span className="pdf-modern-docname">
          <FileText size={12} />
          {jamesStatus?.title ? `${jamesStatus.title}.pdf` : 'Classified_Dossier.pdf'}
        </span>
      </div>

      <div className="pdf-modern-visual">
        <div className="pdf-modern-sheet-stack">
          <div className="pdf-sheet-layer sheet-back" />
          <div className="pdf-sheet-layer sheet-mid" />
          <div className="pdf-sheet-layer sheet-front">
            <div className="pdf-sheet-laser-line" />
            <div className="pdf-wireframe-lines">
              <span className="wireframe-line title" />
              <span className="wireframe-line line-1" />
              <span className="wireframe-line line-2" />
              <span className="wireframe-line line-3" />
            </div>
          </div>
        </div>
      </div>

      <div className="pdf-modern-pill">
        <span className="pdf-modern-pill-text">Page 1/2 &bull; {percent}%</span>
      </div>
    </div>
  );
}

function JamesQrGenerationCard({ jamesStatus }) {
  const [percent, setPercent] = useState(22);

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent(prev => (prev < 95 ? prev + Math.floor(Math.random() * 4 + 2) : 96));
    }, 210);
    return () => clearInterval(interval);
  }, []);

  const matrixBlocks = useMemo(() => Array.from({ length: 36 }, (_, i) => i), []);

  return (
    <div className="qr-modern-canvas">
      <div className="qr-modern-header">
        <span className="qr-modern-title">Encoding QR matrix</span>
        {jamesStatus?.textPayload && (
          <span className="qr-modern-payload" title={jamesStatus.textPayload}>
            {jamesStatus.textPayload.length > 35 ? jamesStatus.textPayload.slice(0, 35) + '...' : jamesStatus.textPayload}
          </span>
        )}
      </div>

      <div className="qr-modern-visual">
        <div className="qr-reticle-viewfinder modern-reticle">
          <span className="reticle-corner top-left" />
          <span className="reticle-corner top-right" />
          <span className="reticle-corner bottom-left" />
          <span className="reticle-corner bottom-right" />
          <div className="qr-laser-scanner-line" />
          <div className="qr-blocks-grid">
            {matrixBlocks.map(i => (
              <span
                key={i}
                className="qr-block-cell"
                style={{ animationDelay: `${(i * 0.05).toFixed(2)}s` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="qr-modern-pill">
        <span className="qr-modern-pill-text">ECC-H &bull; {percent}%</span>
      </div>
    </div>
  );
}

function JamesVoiceGenerationCard() {
  const [percent, setPercent] = useState(15);

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent(prev => (prev < 92 ? prev + Math.floor(Math.random() * 3 + 2) : 94));
    }, 230);
    return () => clearInterval(interval);
  }, []);

  const bars = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  return (
    <div className="voice-modern-canvas">
      <div className="voice-modern-header">
        <span className="voice-modern-title">Synthesizing voice</span>
        <span className="voice-modern-mode">Neural Acoustic TTS</span>
      </div>

      <div className="voice-modern-visual">
        <div className="voice-equalizer-bars">
          {bars.map(i => (
            <span
              key={i}
              className="voice-eq-bar"
              style={{
                animationDelay: `${((i % 8) * 0.12).toFixed(2)}s`,
                height: `${20 + ((i * 17) % 65)}%`
              }}
            />
          ))}
        </div>
      </div>

      <div className="voice-modern-pill">
        <span className="voice-modern-pill-text">24kHz &bull; {percent}%</span>
      </div>
    </div>
  );
}

function JamesCodeGenerationCard() {
  const [percent, setPercent] = useState(25);

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent(prev => (prev < 96 ? prev + Math.floor(Math.random() * 4 + 3) : 98));
    }, 170);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="code-modern-canvas">
      <div className="code-modern-header">
        <div className="code-modern-header-left">
          <span className="window-dot red" />
          <span className="window-dot yellow" />
          <span className="window-dot green" />
          <span className="code-modern-title">Executing runtime</span>
        </div>
        <span className="code-modern-runtime">Node.js VM</span>
      </div>

      <div className="code-modern-terminal">
        <div className="terminal-line prompt">
          <span className="term-cyan">&gt;</span> <span className="term-white">node sandbox.js</span>
        </div>
        <div className="terminal-line trace">
          <span className="term-muted">evaluating abstract syntax tree...</span>
        </div>
        <div className="terminal-line cursor-line">
          <span className="term-cyan">&gt;</span> <span className="term-cursor">&block;</span>
        </div>
      </div>

      <div className="code-modern-pill">
        <span className="code-modern-pill-text">V8 VM &bull; {percent}%</span>
      </div>
    </div>
  );
}

function JamesPollGenerationCard() {
  const [percent, setPercent] = useState(20);

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent(prev => (prev < 94 ? prev + Math.floor(Math.random() * 3 + 2) : 95));
    }, 210);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="poll-modern-canvas">
      <div className="poll-modern-header">
        <span className="poll-modern-title">Structuring poll</span>
        <span className="poll-modern-badge">Live Ballot Matrix</span>
      </div>

      <div className="poll-modern-visual">
        <div className="poll-bar-skeleton bar-1">
          <span className="poll-skeleton-fill fill-1" />
        </div>
        <div className="poll-bar-skeleton bar-2">
          <span className="poll-skeleton-fill fill-2" />
        </div>
        <div className="poll-bar-skeleton bar-3">
          <span className="poll-skeleton-fill fill-3" />
        </div>
      </div>

      <div className="poll-modern-pill">
        <span className="poll-modern-pill-text">Ballot &bull; {percent}%</span>
      </div>
    </div>
  );
}

export default function SecretSocietyChat({
  user,
  identity,
  profiles: initialProfiles = {},
  adminToken,
  societyToken,
  isAdmin = false,
  serverUrl = 'http://localhost:5000',
  socket,
  onReturnToAdmin,
  onExitSociety
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [jamesStatus, setJamesStatus] = useState(null);
  const [memberCount, setMemberCount] = useState(1);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [activeReactionPickerId, setActiveReactionPickerId] = useState(null);

  // User profiles sync (matching normal chat)
  const [userProfiles, setUserProfiles] = useState(initialProfiles || {});

  // Real-time typing indicator state
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef({});

  // File control states (download permission, download loading, delete confirm)
  const [downloadingFileId, setDownloadingFileId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Instagram-style In-App Web Browser State (handles both .onion and clearnet)
  const [inAppBrowser, setInAppBrowser] = useState(null);

  // Dark Web Protected Sandbox Viewer state
  const [activeDarkWebUrl, setActiveDarkWebUrl] = useState(null);
  const [darkWebData, setDarkWebData] = useState(null);
  const [darkWebLoading, setDarkWebLoading] = useState(false);
  const [darkWebViewTab, setDarkWebViewTab] = useState('preview'); // 'preview' | 'inspector'

  // Autocomplete dropdown states
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showCommandDropdown, setShowCommandDropdown] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');

  // File Attachment State
  const [attachedFile, setAttachedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const fileInputRef = useRef(null);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingTimeRef = useRef(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCanvasRef = useRef(null);

  const effectiveSocToken = societyToken || user?.societyToken || user?.token;
  const effectiveAdminToken = adminToken || (user?.isAdmin ? (user?.token || user?.societyToken) : null);
  const userAlias = user?.alias || identity?.alias || (isAdmin ? 'Administrator' : 'Inducted Member');

  const [clearanceLevel, setClearanceLevel] = useState(
    isAdmin ? 'LEVEL-0 ROOT // OVERSEER' : (user?.clearance || 'LEVEL-4 INDUCTED')
  );
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const lastTypingSentRef = useRef(0);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // Mobile swipe-to-reply system matching Normal Chat
  const touchStartRef = useRef({ x: 0, y: 0, id: null, active: false, moved: false, ignoreSwipe: false });
  const [swipingMsgId, setSwipingMsgId] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const handleTouchStart = (e, msgId) => {
    if (window.innerWidth > 768) return;
    const target = e.target;
    // Prevent swipe when interacting with buttons, links, media, or reaction chips
    const isInteractive = target.closest('button, a, input, audio, video, .society-darkweb-badge-link, .society-link-btn, .enclave-wave-canvas, .society-reaction-chip, .inapp-action-btn');
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      id: msgId,
      active: false,
      moved: false,
      ignoreSwipe: Boolean(isInteractive)
    };
  };

  const handleTouchMove = (e, msgId) => {
    if (window.innerWidth > 768) return;
    if (touchStartRef.current.id !== msgId) return;
    if (touchStartRef.current.ignoreSwipe) return;

    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    if (Math.abs(dx) > Math.abs(dy) * 1.4 && Math.abs(dx) > 12) {
      touchStartRef.current.active = true;
      setSwipingMsgId(msgId);
      const clamped = Math.max(-75, Math.min(75, dx));
      setSwipeOffset(clamped);
    }
  };

  const handleTouchEnd = (msg) => {
    if (window.innerWidth > 768) return;
    if (!touchStartRef.current.ignoreSwipe && swipingMsgId === msg.id && Math.abs(swipeOffset) > 38) {
      setReplyingTo(msg);
      inputRef.current?.focus();
      if (navigator.vibrate) {
        try { navigator.vibrate(35); } catch {}
      }
    }
    setSwipingMsgId(null);
    setSwipeOffset(0);
    touchStartRef.current = { x: 0, y: 0, id: null, active: false, moved: false, ignoreSwipe: false };
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, jamesStatus]);

  // Join the secret society room upon mounting
  useEffect(() => {
    if (!socket) return;

    const joinData = {
      societyToken: effectiveSocToken,
      adminToken: effectiveAdminToken,
      token: effectiveSocToken || effectiveAdminToken,
      alias: userAlias,
      clearance: user?.clearance
    };

    socket.emit('joinSocietyRoom', joinData);

    const handleRoomJoined = (data) => {
      if (data && data.clearance) {
        setClearanceLevel(data.clearance);
      }
    };

    const handleHistory = (hist) => {
      if (Array.isArray(hist)) {
        setMessages(hist);
      }
    };

    const handleMessage = (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m && m.id === msg.id)) {
          return prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m));
        }
        return [...prev, msg];
      });
    };

    const handleJamesStatus = (status) => {
      setJamesStatus(status?.status === 'idle' ? null : status);
    };

    const handleMemberCount = (data) => {
      if (data && typeof data.count === 'number') {
        setMemberCount(Math.max(1, data.count));
      }
    };

    const handleOnlineMembers = (list) => {
      if (Array.isArray(list)) {
        setOnlineMembers(list);
      }
    };

    const handleReactionUpdate = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
      );
    };

    // Re-join on socket reconnect
    const handleReconnect = () => {
      socket.emit('joinSocietyRoom', joinData);
    };

    const handleProfilesSync = (map) => {
      if (map && typeof map === 'object') {
        setUserProfiles(map);
      }
    };

    const handleUserProfileUpdated = (data) => {
      if (data && data.alias && data.profile) {
        setUserProfiles((prev) => ({ ...prev, [data.alias]: data.profile }));
      }
    };

    const handleSocietyTyping = ({ alias }) => {
      if (!alias || alias.toLowerCase() === userAlias.toLowerCase()) return;
      setTypingUsers((prev) => {
        if (!prev.includes(alias)) return [...prev, alias];
        return prev;
      });
      if (typingTimeoutRef.current[alias]) clearTimeout(typingTimeoutRef.current[alias]);
      typingTimeoutRef.current[alias] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((a) => a !== alias));
      }, 3000);
    };

    const handleFileDownloadToggled = ({ messageId, allowDownload }) => {
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, allowDownload } : m));
    };

    const handleFileAttachmentDeleted = ({ messageId, isVoice }) => {
      setMessages((prev) => prev.map((m) => {
        if (m.id === messageId) {
          return {
            ...m,
            fileUrl: null,
            imageUrl: null,
            videoUrl: null,
            audioUrl: null,
            fileName: null,
            fileType: null,
            fileSize: null,
            isVoiceNote: false,
            isFileDeleted: true,
            deletedType: isVoice ? 'voice' : 'file'
          };
        }
        return m;
      }));
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    const handleSocietyPresenceNotice = (notice) => {
      if (!notice || !notice.text) return;
      setMessages((prev) => {
        if (prev.some((m) => m && m.id === notice.id)) return prev;
        return [
          ...prev,
          {
            id: notice.id || ('soc_pres_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
            isPresenceNotice: true,
            type: notice.type,
            alias: notice.alias,
            text: notice.text,
            timestamp: notice.timestamp || Date.now()
          }
        ];
      });
    };

    socket.on('societyRoomJoined', handleRoomJoined);
    socket.on('societyHistory', handleHistory);
    socket.on('societyMessage', handleMessage);
    socket.on('societyJamesStatus', handleJamesStatus);
    socket.on('societyMemberCount', handleMemberCount);
    socket.on('societyOnlineMembers', handleOnlineMembers);
    socket.on('societyMessageReaction', handleReactionUpdate);
    socket.on('societyTyping', handleSocietyTyping);
    socket.on('societyPresenceNotice', handleSocietyPresenceNotice);
    socket.on('societyFileDownloadToggled', handleFileDownloadToggled);
    socket.on('societyFileAttachmentDeleted', handleFileAttachmentDeleted);
    socket.on('societyMessageDeleted', handleMessageDeleted);
    socket.on('profilesSync', handleProfilesSync);
    socket.on('userProfileUpdated', handleUserProfileUpdated);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('societyRoomJoined', handleRoomJoined);
      socket.off('societyHistory', handleHistory);
      socket.off('societyMessage', handleMessage);
      socket.off('societyJamesStatus', handleJamesStatus);
      socket.off('societyMemberCount', handleMemberCount);
      socket.off('societyOnlineMembers', handleOnlineMembers);
      socket.off('societyMessageReaction', handleReactionUpdate);
      socket.off('societyTyping', handleSocietyTyping);
      socket.off('societyPresenceNotice', handleSocietyPresenceNotice);
      socket.off('societyFileDownloadToggled', handleFileDownloadToggled);
      socket.off('societyFileAttachmentDeleted', handleFileAttachmentDeleted);
      socket.off('societyMessageDeleted', handleMessageDeleted);
      socket.off('profilesSync', handleProfilesSync);
      socket.off('userProfileUpdated', handleUserProfileUpdated);
      socket.off('connect', handleReconnect);
      socket.emit('leaveSocietyRoom');
    };
  }, [socket, effectiveSocToken, effectiveAdminToken, userAlias, isAdmin]);

  // Clean up AudioContext & visualizer
  const cleanupAudioVisualizer = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch {}
    }
  };

  // Draw real-time voice waveform on recording canvas
  const drawVoiceVisualizer = () => {
    const canvas = audioCanvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = 3;
      const gap = 2;
      const totalBars = Math.floor(canvas.width / (barWidth + gap));
      const step = Math.max(1, Math.floor(bufferLength / totalBars));

      for (let i = 0; i < totalBars; i++) {
        const value = dataArray[i * step] || 0;
        const barHeight = Math.max(3, (value / 255) * canvas.height * 0.9);
        const x = i * (barWidth + gap);
        const y = (canvas.height - barHeight) / 2;

        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 4;
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    };
    render();
  };

  // Start voice note recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          if (audioCtx.state === 'suspended') await audioCtx.resume();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.75;
          source.connect(analyser);
          analyserRef.current = analyser;
          setTimeout(drawVoiceVisualizer, 80);
        }
      } catch (err) {
        console.warn('AudioContext visualizer init failed:', err);
      }

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        cleanupAudioVisualizer();
        const durationSec = recordingTimeRef.current;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });

        setUploading(true);
        let audioUrl = null;

        try {
          const formData = new FormData();
          formData.append('file', audioFile);

          const res = await fetch(`${serverUrl}/upload`, { method: 'POST', body: formData });
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

        const payload = {
          id: 'soc_voice_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
          text: '',
          audioUrl,
          fileUrl: audioUrl,
          fileName: 'Voice Transmission.webm',
          fileType: 'audio/webm',
          isVoiceNote: true,
          voiceDuration: durationSec,
          alias: userAlias,
          userId: user?.userId || (isAdmin ? 'admin_root' : 'usr_soc'),
          clearance: clearanceLevel,
          color: isAdmin ? '#fbbf24' : '#10b981',
          timestamp: Date.now(),
          replyTo: replyingTo ? { id: replyingTo.id, alias: replyingTo.alias, text: replyingTo.text } : null,
          reactions: {}
        };

        setMessages((prev) => {
          if (prev.some((m) => m && m.id === payload.id)) return prev;
          return [...prev, payload];
        });
        socket?.emit('societyMessage', payload);
        setUploading(false);
        setReplyingTo(null);
      };

      mediaRecorderRef.current.start(200);
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimeRef.current = 0;

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((t) => {
          const next = t + 1;
          recordingTimeRef.current = next;
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Microphone access is required to record voice transmissions.');
    }
  };

  const stopAndSendRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      cleanupAudioVisualizer();
      mediaRecorderRef.current.stop();
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      cleanupAudioVisualizer();
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      }
    }
  };

  // File Picker Handling
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      alert('Maximum file size allowed is 100MB.');
      e.target.value = '';
      return;
    }

    setAttachedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
    e.target.value = '';
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const removeSelectedFile = () => {
    setAttachedFile(null);
    setFilePreview(null);
  };

  // Toggle File Download Permission (Sender/Owner only)
  const handleToggleFileDownload = (msgId, currentAllowed) => {
    const newAllowed = !currentAllowed;
    socket?.emit('societyToggleFileDownload', { messageId: msgId, allowDownload: newAllowed });
    setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, allowDownload: newAllowed } : m));
  };

  // Download File Attachment with Animation
  const handleDownloadFile = async (msgId, fileUrl, fileName) => {
    setDownloadingFileId(msgId);
    try {
      const fullUrl = resolveMediaUrl(fileUrl, serverUrl);
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
      window.open(resolveMediaUrl(fileUrl, serverUrl), '_blank');
    }
    setTimeout(() => setDownloadingFileId(null), 1000);
  };

  // Prompt to delete file / voice note (Sender only)
  const promptDeleteFile = (msgId, fileUrl, isVoice = false, fileName = '') => {
    setDeleteConfirm({
      type: isVoice ? 'voice' : 'file',
      messageId: msgId,
      fileUrl,
      fileName: fileName || (isVoice ? 'Voice Note' : 'File Attachment')
    });
  };

  // Execute Confirmed Deletion
  const executeDeleteConfirm = () => {
    if (!deleteConfirm) return;
    const { type, messageId, fileUrl } = deleteConfirm;
    socket?.emit('societyDeleteFileAttachment', {
      messageId,
      fileUrl,
      isVoice: type === 'voice'
    });
    setMessages((prev) => prev.map((m) => {
      if (m.id === messageId) {
        return {
          ...m,
          fileUrl: null,
          imageUrl: null,
          videoUrl: null,
          audioUrl: null,
          fileName: null,
          fileType: null,
          fileSize: null,
          isVoiceNote: false,
          isFileDeleted: true,
          deletedType: type
        };
      }
      return m;
    }));
    setDeleteConfirm(null);
  };

  // Instagram-style In-App Browser Opener (Handles .onion via Tor2web gateways and clearnet)
  const openInAppBrowser = (rawUrl, isTor = false) => {
    if (!rawUrl) return;
    let url = rawUrl.trim().replace(/[.,)\]>'"]+$/, '');
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    const isTorUrl = isTor || url.includes('.onion');
    let gatewayUrl = url;
    let gatewayHost = '';
    let displayHost = '';
    const displayUrl = url.replace(/^https?:\/\//i, '');

    if (isTorUrl) {
      try {
        const u = new URL(url);
        // CRITICAL BUG FIX: strip .onion from hostname before appending .onion.pet!
        const cleanHost = u.hostname.replace(/\.onion$/i, '');
        const path = u.pathname + u.search + u.hash;
        gatewayHost = `${cleanHost}.onion.pet`;
        gatewayUrl = `https://${gatewayHost}${path === '/' ? '' : path}`;
        displayHost = `${cleanHost}.onion`;
      } catch (e) {
        const host = displayUrl.split('/')[0].replace(/\.onion$/i, '');
        gatewayHost = `${host}.onion.pet`;
        gatewayUrl = `https://${gatewayHost}`;
        displayHost = `${host}.onion`;
      }
    } else {
      displayHost = displayUrl.split('/')[0];
    }

    setInAppBrowser({
      url,
      displayUrl,
      gatewayUrl,
      gatewayHost,
      displayHost,
      isTor: isTorUrl,
      gatewayService: 'onion.pet',
      activeTab: 'gateway',
      renderMode: 'proxy', // Proxy mode bypasses X-Frame-Options and CSP headers for flawless in-chat rendering
      copied: false,
      copiedToast: false,
      reloadKey: 0
    });

    // Pre-fetch Tor sandbox proxy representation in the background
    if (isTorUrl) {
      fetch(`${serverUrl}/api/darkweb/sandbox-fetch?url=${encodeURIComponent(url)}`)
        .then((r) => r.json())
        .then((data) => setDarkWebData(data))
        .catch(() => {});
    }
  };

  // Isolated Tor Onion Sandbox Opener
  const openDarkWebSandbox = async (url) => {
    if (!url) return;
    setActiveDarkWebUrl(url);
    setDarkWebLoading(true);
    setDarkWebData(null);
    setDarkWebViewTab('preview');
    try {
      const res = await fetch(`${serverUrl}/api/darkweb/sandbox-fetch?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      setDarkWebData(data);
    } catch (err) {
      setDarkWebData({
        success: false,
        error: err.message || 'Failed to establish Tor circuit proxy connection'
      });
    } finally {
      setDarkWebLoading(false);
    }
  };

  // Candidate pools for @ mention (Strictly ONLINE members only + James)
  const candidateMentions = useMemo(() => {
    const pool = new Set(['James']);
    if (onlineMembers && Array.isArray(onlineMembers)) {
      onlineMembers.forEach((m) => {
        if (m && m.toLowerCase() !== userAlias.toLowerCase()) pool.add(m);
      });
    }
    return Array.from(pool);
  }, [onlineMembers, userAlias]);

  const filteredMentions = useMemo(() => {
    if (!mentionQuery) return candidateMentions;
    return candidateMentions.filter((c) => c.toLowerCase().includes(mentionQuery));
  }, [candidateMentions, mentionQuery]);

  const filteredCommands = useMemo(() => {
    if (!commandQuery) return ENCLAVE_COMMANDS;
    return ENCLAVE_COMMANDS.filter((c) =>
      c.cmd.toLowerCase().includes(commandQuery) || c.desc.toLowerCase().includes(commandQuery)
    );
  }, [commandQuery]);

  // Input change with @ mention and / command detection
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);

    // Throttle typing events to chamber
    const now = Date.now();
    if (now - lastTypingSentRef.current > 1500) {
      socket?.emit('societyTyping', { alias: userAlias });
      lastTypingSentRef.current = now;
    }

    const cursor = e.target.selectionStart || val.length;
    const textBefore = val.slice(0, cursor);

    // Detect @ mention
    const mentionMatch = textBefore.match(/(?:^|\s)@([a-zA-Z0-9._-]*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1].toLowerCase());
      setShowMentionDropdown(true);
      setShowCommandDropdown(false);
      return;
    } else {
      setShowMentionDropdown(false);
    }

    // Detect / command trigger
    const cmdMatch = textBefore.match(/(?:^|\s)\/([a-zA-Z0-9_-]*)$/);
    if (cmdMatch) {
      setCommandQuery(cmdMatch[1].toLowerCase());
      setShowCommandDropdown(true);
    } else {
      setShowCommandDropdown(false);
    }
  };

  const selectMention = (username) => {
    const cursor = inputRef.current?.selectionStart || input.length;
    const textBefore = input.slice(0, cursor);
    const textAfter = input.slice(cursor);
    const updatedBefore = textBefore.replace(/(?:^|\s)@([a-zA-Z0-9._-]*)$/, (m) => {
      const leadingSpace = m.startsWith(' ') ? ' ' : '';
      return `${leadingSpace}@${username} `;
    });
    setInput(updatedBefore + textAfter);
    setShowMentionDropdown(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const selectCommand = (cmd) => {
    const cursor = inputRef.current?.selectionStart || input.length;
    const textBefore = input.slice(0, cursor);
    const textAfter = input.slice(cursor);
    const updatedBefore = textBefore.replace(/(?:^|\s)\/([a-zA-Z0-9_-]*)$/, (m) => {
      const leadingSpace = m.startsWith(' ') ? ' ' : '';
      return `${leadingSpace}${cmd} `;
    });
    setInput(updatedBefore + textAfter);
    setShowCommandDropdown(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (showMentionDropdown && filteredMentions.length > 0) {
        e.preventDefault();
        selectMention(filteredMentions[0]);
        return;
      }
      if (showCommandDropdown && filteredCommands.length > 0) {
        e.preventDefault();
        selectCommand(filteredCommands[0].cmd);
        return;
      }
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Send Message (Text / File)
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (uploading) return;
    if (!input.trim() && !attachedFile) return;

    setUploading(true);
    setShowMentionDropdown(false);
    setShowCommandDropdown(false);

    let uploadedUrl = null;
    let finalFileName = attachedFile ? attachedFile.name : null;
    let finalFileType = attachedFile ? attachedFile.type : null;
    let finalFileSize = attachedFile ? attachedFile.size : null;

    if (attachedFile) {
      try {
        const formData = new FormData();
        formData.append('file', attachedFile);
        const res = await fetch(`${serverUrl}/upload`, { method: 'POST', body: formData });
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
    }

    const isImg = finalFileType?.startsWith('image/');
    const isVid = finalFileType?.startsWith('video/');
    const isAud = finalFileType?.startsWith('audio/');

    const payload = {
      id: 'soc_msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      text: input.trim(),
      alias: userAlias,
      userId: user?.userId || (isAdmin ? 'admin_root' : 'usr_soc'),
      clearance: clearanceLevel,
      color: isAdmin ? '#fbbf24' : '#00f3ff',
      timestamp: Date.now(),
      replyTo: replyingTo ? { id: replyingTo.id, alias: replyingTo.alias, text: replyingTo.text } : null,
      reactions: {},
      fileUrl: uploadedUrl,
      fileName: finalFileName,
      fileType: finalFileType,
      fileSize: finalFileSize,
      imageUrl: isImg ? uploadedUrl : null,
      videoUrl: isVid ? uploadedUrl : null,
      audioUrl: isAud ? uploadedUrl : null,
      isVoiceNote: false,
      allowDownload: true
    };

    // Instant optimistic update
    setMessages((prev) => {
      if (prev.some((m) => m && m.id === payload.id)) return prev;
      return [...prev, payload];
    });
    socket?.emit('societyMessage', payload);

    setInput('');
    setAttachedFile(null);
    setFilePreview(null);
    setReplyingTo(null);
    setUploading(false);
  };

  const handleToggleReaction = (messageId, emoji) => {
    if (!socket) return;
    socket.emit('societyReaction', {
      messageId,
      reaction: emoji,
      alias: userAlias
    });
    setActiveReactionPickerId(null);
  };

  // Render message text with formatted markdown, @mentions, commands, dark web links, and clearnet links
  const renderMessageContent = (text) => {
    if (!text) return null;
    // Strict token regex: matches markdown links [title](url), code snippets `...`, bold, italic, full onion URLs, standard URLs, mentions, commands
    const tokenRegex = /(\[[^\]]+\]\((?:https?:\/\/[^\s)]+|[a-z0-9-]+\.onion[^\s)]*)\)|`[^`\n]+`|\*\*[^*]+\*\*|\*[^*]+\*|https?:\/\/[a-z0-9-]+\.onion(?:\/[^\s]*)?|[a-z2-7]{16,56}\.onion(?:\/[^\s]*)?|https?:\/\/[^\s]+|@[a-zA-Z0-9._-]+|\/(?:secrets|darkweb|deepscan|planetary-plan|debate|intel|dossier))/gi;
    const parts = text.split(tokenRegex);

    return parts.map((part, idx) => {
      if (!part) return null;

      // Markdown Link: [Title](https://... or http://...onion)
      const mdMatch = part.match(/^\[([^\]]+)\]\(((?:https?:\/\/[^\s)]+|[a-z0-9-]+\.onion[^\s)]*))\)$/i);
      if (mdMatch) {
        const [, label, rawUrl] = mdMatch;
        const cleanUrl = rawUrl.replace(/[.,)\]>'"]+$/, '');
        const isTor = cleanUrl.toLowerCase().includes('.onion');
        return (
          <button
            key={idx}
            type="button"
            className={isTor ? "society-darkweb-badge-link" : "society-link-btn"}
            onClick={(e) => {
              e.stopPropagation();
              openInAppBrowser(cleanUrl, isTor);
            }}
            title={`Open ${cleanUrl} in In-App Browser`}
          >
            {isTor && <Radio size={12} className="onion-spin" />}
            <span>{label}</span>
            <ExternalLink size={11} className={isTor ? "shield-tag" : "link-ext-icon"} />
          </button>
        );
      }

      // Backticked code or URLs: if inner content is a URL, render as clickable link
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        const inner = part.slice(1, -1).trim();
        const isUrl = /^https?:\/\//i.test(inner) || inner.toLowerCase().includes('.onion');
        if (isUrl) {
          const cleanUrl = inner.replace(/[.,)\]>'"]+$/, '');
          const isTor = cleanUrl.toLowerCase().includes('.onion');
          return (
            <button
              key={idx}
              type="button"
              className={isTor ? "society-darkweb-badge-link" : "society-link-btn"}
              onClick={(e) => {
                e.stopPropagation();
                openInAppBrowser(cleanUrl, isTor);
              }}
              title={`Open ${cleanUrl} in In-App Browser`}
            >
              {isTor && <Radio size={12} className="onion-spin" />}
              <span>{cleanUrl.replace(/^https?:\/\//, '')}</span>
              <ExternalLink size={11} className={isTor ? "shield-tag" : "link-ext-icon"} />
            </button>
          );
        }
        return (
          <code key={idx} className="society-inline-code">
            {inner}
          </code>
        );
      }

      // Dark Web .onion Hidden Service Link (Strict match)
      const isOnion = part.toLowerCase().includes('.onion') && (part.startsWith('http://') || part.startsWith('https://') || /^[a-z2-7]{16,56}\.onion/i.test(part));
      if (isOnion) {
        const cleanUrl = part.replace(/[.,)\]>'"]+$/, '');
        return (
          <button
            key={idx}
            type="button"
            className="society-darkweb-badge-link"
            onClick={(e) => {
              e.stopPropagation();
              openInAppBrowser(cleanUrl, true);
            }}
            title="Open in In-App Browser (Tor Gateway / Sandbox)"
          >
            <Radio size={12} className="onion-spin" />
            <span>{cleanUrl.replace(/^https?:\/\//, '')}</span>
            <ExternalLink size={11} className="shield-tag" />
          </button>
        );
      }

      // Standard HTTP/HTTPS Clearnet Link
      if (part.startsWith('http://') || part.startsWith('https://')) {
        const cleanUrl = part.replace(/[.,)\]>'"]+$/, '');
        return (
          <button
            key={idx}
            type="button"
            className="society-link-btn"
            onClick={(e) => {
              e.stopPropagation();
              openInAppBrowser(cleanUrl, false);
            }}
            title="Open in In-App Browser"
          >
            <span>{cleanUrl}</span>
            <ExternalLink size={11} className="link-ext-icon" />
          </button>
        );
      }

      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={idx} className="society-bold-text">
            {part.slice(2, -2)}
          </strong>
        );
      }

      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return (
          <em key={idx} className="society-italic-text">
            {part.slice(1, -1)}
          </em>
        );
      }

      if (part.startsWith('@')) {
        return (
          <span key={idx} className="society-mention-tag" onClick={() => selectMention(part.slice(1))}>
            {part}
          </span>
        );
      }

      if (part.startsWith('/')) {
        return (
          <span key={idx} className="society-command-tag">
            {part}
          </span>
        );
      }

      return part;
    });
  };

  return (
    <div className="society-chat-viewport">
      {/* Background Matching Normal Chat */}
      <div className="cyber-grid" />
      <div className="glow-ambient" />

      {/* --- Enclave Header Bar (Clean, Minimal, matching Normal Chat Header) --- */}
      <header className="society-chat-header">
        <div className="society-brand-section">
          <div className="society-brand-icon" title="Sovereign Enclave Chamber">
            <span>Ω</span>
          </div>
          <div className="society-brand-title">
            <span className="society-title-text">SOVEREIGN ENCLAVE</span>
          </div>
          {/* Live Online Count Badge */}
          <div className="society-online-pill" title="Live Members in Chamber">
            <span className="society-online-dot" />
            <span>{memberCount}</span>
          </div>
        </div>

        <div className="society-header-actions">
          {/* Profile Pill matching normal chat (Read-only) */}
          {(() => {
            const myProf = userProfiles[userAlias] || {};
            const myColor = myProf.color || (isAdmin ? '#fbbf24' : '#38bdf8');
            const myAvatar = myProf.avatar;
            return (
              <div className="society-profile-btn" title="Your Enclave Identity (Read-only)">
                <div className="society-profile-avatar-wrap">
                  {renderAvatar(userAlias, myColor, myAvatar, 26)}
                  <span className="society-status-indicator online" />
                </div>
                <span className="society-profile-alias" style={{ color: myColor }}>{userAlias}</span>
                <VerifiedBlueTick size={14} className="society-header-verified-tick" />
              </div>
            );
          })()}

          {isAdmin && onReturnToAdmin && (
            <button
              type="button"
              className="society-nav-btn admin-btn"
              onClick={onReturnToAdmin}
              title="Return to Root Administrative Mainframe"
            >
              <Terminal size={14} />
              <span>Admin</span>
            </button>
          )}

          {onExitSociety && (
            <button
              type="button"
              className="society-nav-btn exit-btn"
              onClick={onExitSociety}
              title="Exit Enclave Frequency"
            >
              <ArrowLeft size={14} />
              <span>Exit</span>
            </button>
          )}
        </div>
      </header>

      {/* --- Main Classified Transmissions Stream (No Box Background, No Yellow Glow) --- */}
      <main className="society-chat-feed">
        {messages.length === 0 ? (
          <div className="society-empty-state">
            <div className="society-empty-seal">Ω</div>
            <div className="society-empty-title">ENCLAVE SECURE CHANNEL READY</div>
            <p>Channel quiet. Transmit an encrypted thought, mention @James, or type / for dark web and deep intelligence commands.</p>
          </div>
        ) : (
          messages.map((m, idx) => {
            if (m && m.isPresenceNotice) {
              return (
                <div className="society-presence-row" key={m.id || idx}>
                  <div className={`society-presence-pill ${m.type || 'joined_room'}`}>
                    <span className="presence-dot" />
                    <span>{m.text}</span>
                  </div>
                </div>
              );
            }

            const isJames = m.userId === 'bot_james_society' || m.alias?.includes('James');
            const isMe = (userAlias && m.alias && m.alias.toLowerCase() === userAlias.toLowerCase()) ||
                         (isAdmin && m.alias === 'Administrator');

            const authorProf = userProfiles[m.alias] || {};
            const authorColor = authorProf.color || m.color || (isJames ? '#00f3ff' : (isMe ? '#38bdf8' : '#e2e8f0'));
            const authorAvatar = authorProf.avatar || m.avatar;
            const isAuthorAdmin = m.userId === 'admin_root' || m.alias === 'Administrator' || (isAdmin && isMe) || (m.clearance && (m.clearance.includes('ROOT') || m.clearance.includes('OVERSEER')));

            const reactions = m.reactions || {};
            const reactionEntries = Object.entries(reactions);

            const isVoiceNote = Boolean(
              m.isVoiceNote ||
              m.fileName === 'Voice Transmission.webm' ||
              (m.audioUrl && (m.fileName?.startsWith('voice-note-') || m.fileName?.includes('voice')))
            );
            const isImage = m.imageUrl || m.fileType?.startsWith('image/');
            const isVideo = m.videoUrl || m.fileType?.startsWith('video/');
            const isAudio = !isVoiceNote && (m.audioUrl || m.fileType?.startsWith('audio/'));
            const isOtherFile = m.fileUrl && !isImage && !isVideo && !isAudio && !isVoiceNote;
            const hasFile = Boolean(isImage || isVideo || isVoiceNote || isAudio || isOtherFile || m.fileUrl || m.imageUrl || m.audioUrl);
            const isDownloadAllowed = m.allowDownload !== false;
            const isDownloading = downloadingFileId === m.id;
            const displayAlias = (isJames || m.alias?.includes('James')) ? 'James' : m.alias;

            return (
              <div
                key={m.id}
                className="society-message-row-wrapper"
                style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column' }}
              >
                {/* Mobile Instagram-style Swipe-to-Reply indicator cue matching Normal Chat */}
                {swipingMsgId === m.id && Math.abs(swipeOffset) > 12 && (
                  <div
                    className={`mobile-swipe-reply-cue ${swipeOffset > 0 ? 'swipe-right' : 'swipe-left'}`}
                    style={{
                      opacity: Math.min(1, (Math.abs(swipeOffset) - 12) / 28),
                      transform: `scale(${Math.min(1.2, 0.75 + Math.abs(swipeOffset) / 75)})`
                    }}
                  >
                    <CornerDownLeft size={15} />
                  </div>
                )}

                <div
                  className={`society-message-card ${isMe ? 'own-message' : ''} ${isJames ? 'james-message' : ''}`}
                  onTouchStart={(e) => handleTouchStart(e, m.id)}
                  onTouchMove={(e) => handleTouchMove(e, m.id)}
                  onTouchEnd={() => handleTouchEnd(m)}
                  style={
                    swipingMsgId === m.id
                      ? { transform: `translateX(${swipeOffset}px)`, transition: 'none' }
                      : { transition: 'transform 0.22s cubic-bezier(0.18, 0.89, 0.32, 1.28)' }
                  }
                >
                {/* Author Header Row */}
                <div className="society-message-header">
                  <div className="society-user-info">
                    {/* Render Real User Profile Picture or James Avatar */}
                    <div className="society-author-avatar-wrap">
                      {renderAvatar(
                        displayAlias,
                        authorColor,
                        isJames ? (authorAvatar || '/uploads/ShadowTalk-IG.jpeg') : authorAvatar,
                        24
                      )}
                    </div>

                    <span
                      className="society-alias-name"
                      style={{ color: authorColor }}
                    >
                      @{displayAlias}
                    </span>

                    {!isJames && (
                      <span className="society-verified-inline" title="Verified Sovereign Member">
                        <VerifiedBlueTick size={13} />
                      </span>
                    )}

                    {/* ONLY Admin and Intelligence badges! Zero level-0/level-4 clearance badges! */}
                    {isJames ? (
                      <span className="society-role-pill intelligence" title="Autonomous Intelligence">
                        🧠 Intelligence
                      </span>
                    ) : isAuthorAdmin ? (
                      <span className="society-role-pill admin" title="System Administrator">
                        🛡️ Admin
                      </span>
                    ) : null}

                    <span className="society-time-stamp">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Side hover actions: Smile React & Reply */}
                  <div className="society-side-actions">
                    <button
                      type="button"
                      className="society-side-action-btn"
                      onClick={() => setActiveReactionPickerId(activeReactionPickerId === m.id ? null : m.id)}
                      title="Add reaction"
                    >
                      <Smile size={13} />
                    </button>
                    <button
                      type="button"
                      className="society-side-action-btn"
                      onClick={() => {
                        setReplyingTo(m);
                        inputRef.current?.focus();
                      }}
                      title="Reply to transmission"
                    >
                      <CornerDownLeft size={13} />
                    </button>
                  </div>

                  {/* Reaction Picker Popover */}
                  {activeReactionPickerId === m.id && (
                    <div className="society-reaction-picker">
                      {QUICK_REACTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="btn-quick-emoji"
                          onClick={() => handleToggleReaction(m.id, emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quoted Reply Box */}
                {m.replyTo && (
                  <div className="society-quoted-reply-box">
                    <div className="society-quoted-indicator" />
                    <div className="society-quoted-content">
                      <span className="society-quoted-author">@{m.replyTo.alias?.includes('James') ? 'James' : m.replyTo.alias}:</span>
                      <span className="society-quoted-text">{m.replyTo.text || (m.replyTo.fileName ? `[File: ${m.replyTo.fileName}]` : '[Attachment]')}</span>
                    </div>
                  </div>
                )}

                {/* Message Body (Clean, NO text background box, NO yellow glow!) */}
                <div className="society-message-body">
                  {m.text && (
                    <div className="society-text-content">
                      {renderMessageContent(m.text)}
                    </div>
                  )}

                  {/* If file or voice recording was deleted, show placeholder banner */}
                  {m.isFileDeleted && (
                    <div className="society-deleted-attachment-banner">
                      <Ban size={14} className="deleted-attachment-icon" />
                      <span className="deleted-attachment-text">
                        {m.deletedType === 'voice' || isVoiceNote
                          ? (isMe ? 'You deleted this voice transmission' : `${displayAlias} deleted this voice transmission`)
                          : (isMe ? 'You deleted this file attachment' : `${displayAlias} deleted this file attachment`)}
                      </span>
                    </div>
                  )}

                  {/* Image Attachment */}
                  {!m.isFileDeleted && isImage && (
                    <div
                      className="society-media-wrap"
                      onClick={() => setLightboxImage(resolveMediaUrl(m.imageUrl || m.fileUrl, serverUrl))}
                    >
                      <img
                        src={resolveMediaUrl(m.imageUrl || m.fileUrl, serverUrl)}
                        alt="attachment"
                        className="society-msg-img"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Video Attachment */}
                  {!m.isFileDeleted && isVideo && (
                    <div className="society-media-wrap">
                      <video
                        controls
                        controlsList={!isDownloadAllowed ? "nodownload noplaybackrate" : undefined}
                        disablePictureInPicture={!isDownloadAllowed}
                        src={resolveMediaUrl(m.videoUrl || m.fileUrl, serverUrl)}
                        className="society-msg-video"
                      />
                    </div>
                  )}

                  {/* Voice Note Waveform Player */}
                  {!m.isFileDeleted && isVoiceNote && (
                    <EnclaveVoiceWaveformPlayer
                      audioUrl={resolveMediaUrl(m.audioUrl || m.fileUrl, serverUrl)}
                      isOwn={isMe}
                      durationSec={m.voiceDuration}
                    />
                  )}

                  {/* Audio File Attachment (non-voice) */}
                  {!m.isFileDeleted && isAudio && (
                    <div className="society-audio-wrap">
                      <audio
                        controls
                        controlsList={!isDownloadAllowed ? "nodownload noplaybackrate" : undefined}
                        src={resolveMediaUrl(m.audioUrl || m.fileUrl, serverUrl)}
                        className="society-msg-audio"
                      />
                    </div>
                  )}

                  {/* Document / Classified PDF Attachment */}
                  {!m.isFileDeleted && isOtherFile && (
                    <div className="society-file-card">
                      <FileText size={20} color="#00f3ff" />
                      <div className="society-file-info">
                        <span className="society-file-name">{m.fileName || 'Classified File'}</span>
                        {m.fileSize && <span className="society-file-size">{formatFileSize(m.fileSize)}</span>}
                      </div>
                    </div>
                  )}

                  {/* File Action Row (Download for receivers if allowed, Lock/Unlock toggle and Delete for Owner) */}
                  {!m.isFileDeleted && hasFile && (
                    <div className="society-file-actions-row">
                      {!isMe ? (
                        /* Receiver: show Download button if allowed, or Preview Only badge if locked */
                        isDownloadAllowed ? (
                          <button
                            type="button"
                            className={`society-file-action-btn ${isDownloading ? 'downloading' : ''}`}
                            onClick={() => handleDownloadFile(m.id, m.fileUrl || m.imageUrl || m.videoUrl || m.audioUrl, m.fileName)}
                            disabled={isDownloading}
                            title="Download file"
                          >
                            {isDownloading ? (
                              <>
                                <Loader2 size={13} className="spin-fast" />
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
                          <div className="society-preview-only-badge" title="Owner restricted downloading (Preview Only)">
                            <Lock size={12} />
                            <span>Preview Only</span>
                          </div>
                        )
                      ) : (
                        /* Owner: Lock/Unlock switch and Delete File button matching normal chat */
                        <div className="society-file-owner-controls">
                          <button
                            type="button"
                            className={`society-file-lock-btn ${isDownloadAllowed ? 'unlocked' : 'locked'}`}
                            onClick={() => handleToggleFileDownload(m.id, isDownloadAllowed)}
                            title={isDownloadAllowed ? 'File is Unlocked (Click to make Preview Only)' : 'File is Locked (Click to allow Download)'}
                          >
                            <span className="society-toggle-track">
                              <span className="society-toggle-thumb">
                                {isDownloadAllowed ? <Unlock size={10} /> : <Lock size={10} />}
                              </span>
                            </span>
                            <span className="society-toggle-label">
                              {isDownloadAllowed ? 'Downloadable' : 'Preview Only'}
                            </span>
                          </button>
                          <button
                            type="button"
                            className="society-file-delete-btn"
                            onClick={() => promptDeleteFile(m.id, m.fileUrl || m.imageUrl || m.videoUrl || m.audioUrl, isVoiceNote, m.fileName)}
                            title="Delete file attachment"
                          >
                            <Trash2 size={12} />
                            <span>Delete File</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Code Execution Intelligence Card */}
                  {m.codeExecution && (
                    <div className="society-code-card">
                      <div className="society-code-header">
                        <div className="society-code-lang">
                          <Code2 size={13} color="#00f3ff" />
                          <span>{m.codeExecution.language || 'Sandbox Evaluation'}</span>
                        </div>
                        <div className="society-code-badges">
                          {m.codeExecution.executionTimeMs && (
                            <span className="society-code-time">{m.codeExecution.executionTimeMs}ms</span>
                          )}
                          <span className={`society-code-status ${m.codeExecution.success ? 'success' : 'error'}`}>
                            {m.codeExecution.success ? '✓ Verified' : '⚠ Failed'}
                          </span>
                        </div>
                      </div>
                      {m.codeExecution.code && (
                        <pre className="society-code-block">
                          <code>{m.codeExecution.code}</code>
                        </pre>
                      )}
                      {m.codeExecution.output && (
                        <div className="society-code-output">
                          <div className="output-tag">Execution Output:</div>
                          <pre><code>{m.codeExecution.output}</code></pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Community Poll Intelligence Card */}
                  {m.poll && (
                    <div className="society-poll-card">
                      <div className="society-poll-header">
                        <BarChart2 size={14} color="#38bdf8" />
                        <span className="society-poll-title">{m.poll.question}</span>
                      </div>
                      <div className="society-poll-options">
                        {(m.poll.options || []).map((opt, i) => {
                          const total = m.poll.totalVotes || (m.poll.options.reduce((s, o) => s + (o.votes || 0), 0) || 1);
                          const pct = Math.round(((opt.votes || 0) / total) * 100);
                          return (
                            <div key={i} className="society-poll-opt">
                              <div className="society-poll-opt-bg" style={{ width: `${pct}%` }} />
                              <div className="society-poll-opt-content">
                                <span>{opt.text}</span>
                                <span className="society-poll-pct">{pct}% ({opt.votes || 0})</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Cryptographic Market Intelligence Card */}
                  {m.cryptoCard && (
                    <div className="society-crypto-card">
                      <div className="society-crypto-header">
                        <Cpu size={14} color="#00f3ff" />
                        <span>LIVE CRYPTOGRAPHIC ASSET METRICS</span>
                      </div>
                      <div className="society-crypto-grid">
                        {Object.entries(m.cryptoCard.prices || {}).map(([sym, item]) => {
                          const isUp = (item?.change24h || 0) >= 0;
                          return (
                            <div key={sym} className="society-crypto-item">
                              <div className="crypto-sym-row">
                                <span className="crypto-symbol">{sym.toUpperCase()}</span>
                                <span className={`crypto-change ${isUp ? 'up' : 'down'}`}>
                                  {isUp ? '+' : ''}{item?.change24h || 0}%
                                </span>
                              </div>
                              <div className="crypto-price">${item?.usd ? Number(item.usd).toLocaleString() : 'N/A'}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Atmospheric Weather Telemetry Card */}
                  {m.weatherCard && (
                    <div className="society-weather-card">
                      <div className="society-weather-header">
                        <Globe size={14} color="#38bdf8" />
                        <span>{m.weatherCard.location || 'Atmospheric Telemetry'}</span>
                      </div>
                      <div className="society-weather-body">
                        <div className="weather-temp">{m.weatherCard.temperature}°C</div>
                        <div className="weather-meta">
                          <div>Condition: {m.weatherCard.condition}</div>
                          <div>Humidity: {m.weatherCard.humidity}%</div>
                          <div>Wind: {m.weatherCard.windSpeed} km/h</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Verified News Intelligence Card */}
                  {m.newsCard && (
                    <div className="society-news-card">
                      <div className="society-news-header">
                        <Globe size={14} color="#00f3ff" />
                        <span>VERIFIED GLOBAL SIGNALS</span>
                      </div>
                      <div className="society-news-list">
                        {(m.newsCard.articles || m.newsCard.headlines || []).slice(0, 3).map((art, idx) => (
                          <div key={idx} className="society-news-item">
                            <div className="news-title">{art.title || art.headline || art}</div>
                            {art.source && <div className="news-source">{art.source}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Active Reactions Row */}
                {reactionEntries.length > 0 && (
                  <div className="society-reactions-row">
                    {reactionEntries.map(([emoji, usersList]) => {
                      const count = Array.isArray(usersList) ? usersList.length : Number(usersList);
                      const hasMyReaction = Array.isArray(usersList) && usersList.includes(userAlias);
                      return (
                        <button
                          key={emoji}
                          type="button"
                          className={`society-reaction-chip ${hasMyReaction ? 'active' : ''}`}
                          onClick={() => handleToggleReaction(m.id, emoji)}
                          title={Array.isArray(usersList) ? usersList.join(', ') : ''}
                        >
                          <span>{emoji}</span>
                          <span className="reaction-count">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                </div>
              </div>
            );
          })
        )}

        {/* James Live Cybernetic Status Message in Chamber Feed */}
        {jamesStatus && (
          jamesStatus.status === 'generating_image' ||
          jamesStatus.generatingType === 'image' ||
          jamesStatus.status === 'generating_pdf' ||
          jamesStatus.generatingType === 'pdf' ||
          jamesStatus.status === 'generating_qr' ||
          jamesStatus.generatingType === 'qr' ||
          jamesStatus.status === 'generating_voice' ||
          jamesStatus.generatingType === 'voice' ||
          jamesStatus.status === 'running_code' ||
          jamesStatus.generatingType === 'code' ||
          jamesStatus.status === 'creating_poll' ||
          jamesStatus.generatingType === 'poll'
        ) && (
          <div className="society-message-card james-message in-feed-status-wrapper">
            <div className="society-message-header">
              <div className="society-user-info">
                <div className="society-author-avatar-wrap">
                  {renderAvatar('James', '#00f3ff', '/uploads/ShadowTalk-IG.jpeg', 24)}
                </div>
                <span className="society-alias-name" style={{ color: '#00f3ff' }}>
                  @James
                </span>
                <span className="society-role-pill intelligence">🧠 Intelligence</span>
                <span className="society-time-stamp live-generating-pill">
                  <span className="live-pulse-dot" /> Generating
                </span>
              </div>
            </div>

            <div className="society-message-body james-status-body">
              {(jamesStatus.status === 'generating_image' || jamesStatus.generatingType === 'image') && (
                <JamesImageGenerationCard jamesStatus={jamesStatus} />
              )}
              {(jamesStatus.status === 'generating_pdf' || jamesStatus.generatingType === 'pdf') && (
                <JamesPdfGenerationCard jamesStatus={jamesStatus} />
              )}
              {(jamesStatus.status === 'generating_qr' || jamesStatus.generatingType === 'qr') && (
                <JamesQrGenerationCard jamesStatus={jamesStatus} />
              )}
              {(jamesStatus.status === 'generating_voice' || jamesStatus.generatingType === 'voice') && (
                <JamesVoiceGenerationCard />
              )}
              {(jamesStatus.status === 'running_code' || jamesStatus.generatingType === 'code') && (
                <JamesCodeGenerationCard />
              )}
              {(jamesStatus.status === 'creating_poll' || jamesStatus.generatingType === 'poll') && (
                <JamesPollGenerationCard />
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* --- Bottom Composer (Buttons moved INSIDE input, Slash & Mention Popups) --- */}
      <footer className="society-chat-footer">
        {/* Floating @ Mention Autocomplete Dropdown (Strictly Online Members) */}
        {showMentionDropdown && filteredMentions.length > 0 && (
          <div className="society-autocomplete-dropdown">
            <div className="autocomplete-header">
              <AtSign size={13} /> ONLINE MEMBERS ({filteredMentions.length})
            </div>
            {filteredMentions.map((name) => {
              const prof = userProfiles[name] || {};
              const pColor = prof.color || (name === 'James' ? '#00f3ff' : '#38bdf8');
              const pAvatar = prof.avatar;
              return (
                <div
                  key={name}
                  className="autocomplete-item"
                  onClick={() => selectMention(name)}
                >
                  <div className="autocomplete-avatar-wrap">
                    {renderAvatar(name, pColor, name === 'James' ? (pAvatar || '/uploads/ShadowTalk-IG.jpeg') : pAvatar, 22)}
                  </div>
                  <span className="autocomplete-name" style={{ color: pColor }}>{name}</span>
                  {name === 'James' && (
                    <span className="autocomplete-badge archivist">🧠 Intelligence</span>
                  )}
                  <VerifiedBlueTick size={12} />
                </div>
              );
            })}
          </div>
        )}

        {/* Floating / Command Autocomplete Dropdown */}
        {showCommandDropdown && filteredCommands.length > 0 && (
          <div className="society-autocomplete-dropdown">
            <div className="autocomplete-header">
              <Terminal size={13} /> ENCLAVE COMMANDS
            </div>
            {filteredCommands.map((c) => (
              <div
                key={c.cmd}
                className="autocomplete-item command-item"
                onClick={() => selectCommand(c.cmd)}
              >
                <span className="command-chip">{c.title}</span>
                <span className="command-desc">{c.desc}</span>
              </div>
            ))}
          </div>
        )}

        {/* Dynamic Activity / Thinking / Searching / Typing Bar Matching Normal Chat */}
        {(jamesStatus || typingUsers.length > 0) && (
          <div className={`typing-bar ${jamesStatus ? `james-status-${jamesStatus.status}` : ''}`}>
            {jamesStatus ? (
              <div className="james-live-status-row">
                {jamesStatus.status === 'thinking' && (
                  <div className="status-icon-badge thinking">
                    <Sparkles size={14} className="status-pulse-sparkle" />
                  </div>
                )}
                {jamesStatus.status === 'searching' && (
                  <div className="status-icon-badge searching">
                    <Globe size={14} className="status-spin-globe" />
                  </div>
                )}
                {(jamesStatus.status === 'generating_image' || jamesStatus.generatingType === 'image') && (
                  <div className="status-icon-badge generating">
                    <Sparkles size={14} className="status-pulse-sparkle" />
                  </div>
                )}
                {(jamesStatus.status === 'generating_pdf' || jamesStatus.generatingType === 'pdf') && (
                  <div className="status-icon-badge generating">
                    <FileText size={14} className="status-pulse-sparkle" />
                  </div>
                )}
                {(jamesStatus.status === 'generating_qr' || jamesStatus.generatingType === 'qr') && (
                  <div className="status-icon-badge generating">
                    <QrCode size={14} className="status-pulse-sparkle" />
                  </div>
                )}
                {jamesStatus.status === 'typing' && (
                  <div className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                )}
                <span className="james-status-text">
                  {jamesStatus.text || `${jamesStatus.alias || 'James'} is working...`}
                </span>
              </div>
            ) : (
              <>
                <div className="typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span>
                  {typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
                </span>
              </>
            )}
          </div>
        )}

        {/* Quoted Replying Banner */}
        {replyingTo && (
          <div className="society-reply-preview-bar">
            <div className="reply-preview-left">
              <CornerDownLeft size={13} color="#ffd700" />
              <span>
                Replying to <strong>@{replyingTo.alias}</strong>: {replyingTo.text?.slice(0, 75) || (replyingTo.fileName ? `[File: ${replyingTo.fileName}]` : '[Attachment]')}
              </span>
            </div>
            <button
              type="button"
              className="btn-cancel-reply"
              onClick={() => setReplyingTo(null)}
              title="Cancel reply"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Attached File Chip Preview */}
        {attachedFile && (
          <div className="society-attachment-preview">
            {filePreview ? (
              <img src={filePreview} alt="thumb" className="society-att-thumb" />
            ) : (
              <FileText size={18} color="#ffd700" />
            )}
            <span className="society-att-name">{attachedFile.name} ({formatFileSize(attachedFile.size)})</span>
            <button
              type="button"
              className="btn-cancel-att"
              onClick={removeSelectedFile}
              title="Remove file"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Recording State Row OR Single Unified Composer Box */}
        {isRecording ? (
          <div className="society-voice-recording-row">
            <div className="recording-status">
              <span className="recording-dot" />
              <span>REC {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
            </div>

            <div className="recording-visualizer-container">
              <canvas ref={audioCanvasRef} className="recording-visualizer-canvas" />
            </div>

            <div className="recording-actions">
              <button
                type="button"
                className="icon-btn cancel-btn"
                onClick={cancelRecording}
                title="Cancel Recording"
              >
                <X size={16} />
              </button>
              <button
                type="button"
                className="icon-btn send-rec-btn"
                onClick={stopAndSendRecording}
                title="Send Voice Transmission"
              >
                <ArrowRight size={17} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ) : (
          <form className="society-composer-box" onSubmit={handleSendMessage}>
            <input
              ref={inputRef}
              type="text"
              className="society-chat-input"
              placeholder={
                replyingTo
                  ? `Reply to @${replyingTo.alias}...`
                  : attachedFile
                  ? 'Add caption and transmit file...'
                  : 'Type a message... (use @ to mention, / for commands)'
              }
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={uploading}
            />

            {/* Three buttons inside the input! */}
            <div className="society-composer-tools">
              <input
                type="file"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip,.rar,.txt,.json,.csv,*/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <button
                type="button"
                className={`society-tool-btn ${attachedFile ? 'active' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                title="Attach File"
                disabled={uploading}
              >
                <Paperclip size={18} />
              </button>

              <button
                type="button"
                className="society-tool-btn"
                onClick={startRecording}
                title="Record Voice Note"
                disabled={uploading}
              >
                <Mic size={18} />
              </button>

              <button
                type="submit"
                className={`society-tool-btn send-btn ${input.trim() || attachedFile ? 'active' : ''}`}
                disabled={uploading || (!input.trim() && !attachedFile)}
                title={uploading ? 'Transmitting...' : 'Send'}
              >
                {uploading ? (
                  <Loader2 size={16} className="send-spinner" />
                ) : (
                  <ArrowRight size={18} strokeWidth={2.4} />
                )}
              </button>
            </div>
          </form>
        )}
      </footer>

      {/* Lightbox Modal for Full View Images */}
      {lightboxImage && (
        <div className="society-lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <button
            type="button"
            className="society-lightbox-close"
            onClick={() => setLightboxImage(null)}
            title="Close image"
          >
            <X size={20} />
          </button>
          <img
            src={lightboxImage}
            alt="Full Preview"
            className="society-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* --- Protected Dark Web / Onion Isolated Sandbox Modal --- */}
      {activeDarkWebUrl && (
        <div className="society-sandbox-overlay" onClick={() => setActiveDarkWebUrl(null)}>
          <div className="society-sandbox-modal" onClick={(e) => e.stopPropagation()}>
            <div className="society-sandbox-header">
              <div className="sandbox-header-title">
                <Radio size={16} className="onion-spin" />
                <span className="sandbox-onion-label">TOR HIDDEN SERVICE SANDBOX</span>
                <span className="sandbox-url-pill">{activeDarkWebUrl}</span>
              </div>
              <div className="sandbox-header-actions">
                <button
                  type="button"
                  className="sandbox-close-btn"
                  onClick={() => setActiveDarkWebUrl(null)}
                  title="Close sandbox"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Tor Circuit Route Visualization */}
            <div className="sandbox-tor-circuit">
              <div className="circuit-label">Tor Secure Circuit:</div>
              <div className="circuit-steps">
                <span className="circuit-node client">Your Browser</span>
                <span className="circuit-arrow">→</span>
                <span className="circuit-node guard">Guard (Iceland)</span>
                <span className="circuit-arrow">→</span>
                <span className="circuit-node middle">Relay (Switzerland)</span>
                <span className="circuit-arrow">→</span>
                <span className="circuit-node exit">Rendezvous (Enclave)</span>
                <span className="circuit-arrow">→</span>
                <span className="circuit-node onion-target">.onion Hidden Service</span>
              </div>
            </div>

            {/* Tab navigation: Preview vs OpSec Inspector */}
            <div className="sandbox-tabs">
              <button
                type="button"
                className={`sandbox-tab-btn ${darkWebViewTab === 'preview' ? 'active' : ''}`}
                onClick={() => setDarkWebViewTab('preview')}
              >
                <Eye size={13} />
                <span>Protected Sandbox Preview</span>
              </button>
              <button
                type="button"
                className={`sandbox-tab-btn ${darkWebViewTab === 'inspector' ? 'active' : ''}`}
                onClick={() => setDarkWebViewTab('inspector')}
              >
                <Layers size={13} />
                <span>OpSec Inspector & Telemetry</span>
              </button>
            </div>

            {/* Sandbox Content Viewport */}
            <div className="sandbox-body">
              {darkWebLoading ? (
                <div className="sandbox-loading-state">
                  <Loader2 size={32} className="spin-fast" color="#00f3ff" />
                  <p>Routing through Tor onion circuit and sanitizing payload...</p>
                  <span className="subtext">Active scripts stripped • Third-party cookies blocked</span>
                </div>
              ) : darkWebData?.success ? (
                darkWebViewTab === 'preview' ? (
                  <div className="sandbox-preview-container">
                    <div className="sandbox-safety-banner">
                      <ShieldCheck size={14} color="#10b981" />
                      <span>Zero-Knowledge Proxy Active • Host scripts quarantined • Content sanitized</span>
                    </div>
                    {darkWebData.content?.html ? (
                      <div
                        className="sandbox-sanitized-html"
                        dangerouslySetInnerHTML={{ __html: darkWebData.content.html }}
                      />
                    ) : (
                      <div className="sandbox-raw-text">
                        <pre>{darkWebData.content?.text || 'No text content extracted from hidden service.'}</pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="sandbox-inspector-view">
                    <div className="inspector-card">
                      <div className="inspector-card-title">🔐 Circuit & Integrity Telemetry</div>
                      <div className="inspector-grid">
                        <div className="inspector-item">
                          <label>Status</label>
                          <span className="status-val secure">Verified Onion Route</span>
                        </div>
                        <div className="inspector-item">
                          <label>Latency</label>
                          <span>{darkWebData.circuit?.latencyMs || 42} ms</span>
                        </div>
                        <div className="inspector-item">
                          <label>Cryptographic Hash (SHA-256)</label>
                          <span className="hash-val">{darkWebData.content?.sha256Seal || 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855'}</span>
                        </div>
                        <div className="inspector-item">
                          <label>Threat Mitigation</label>
                          <span>Headless isolation, stripped &lt;script&gt;, &lt;iframe&gt;, &amp; trackers</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="sandbox-error-state">
                  <X size={32} color="#ef4444" />
                  <p>Onion Circuit Routing Failed</p>
                  <span>{darkWebData?.error || 'Unable to establish rendezvous with the target .onion hidden service.'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Instagram-style In-App Web Browser Sheet --- */}
      {inAppBrowser && (
        <div className="society-inapp-browser-overlay" onClick={() => setInAppBrowser(null)}>
          <div className="society-inapp-browser-sheet" onClick={(e) => e.stopPropagation()}>
            {/* Top Navigation Bar */}
            <div className="inapp-browser-header">
              <button
                type="button"
                className="inapp-browser-close-btn"
                onClick={() => setInAppBrowser(null)}
                title="Close Browser"
              >
                <X size={18} />
              </button>

              <div className="inapp-browser-url-pill">
                {inAppBrowser.isTor ? (
                  <span className="inapp-security-badge tor" title="Tor Onion Circuit via Tor2web">
                    🧅 Tor Onion
                  </span>
                ) : (
                  <span className="inapp-security-badge ssl" title="Encrypted Connection">
                    <Lock size={11} /> Secure
                  </span>
                )}
                <span className="inapp-browser-hostname" title={inAppBrowser.url}>
                  {inAppBrowser.displayHost || inAppBrowser.displayUrl}
                </span>
              </div>

              <div className="inapp-browser-actions">
                <button
                  type="button"
                  className={`inapp-action-btn ${inAppBrowser.renderMode === 'proxy' ? 'shield-active' : ''}`}
                  onClick={() => {
                    setInAppBrowser((prev) => ({
                      ...prev,
                      renderMode: prev.renderMode === 'proxy' ? 'direct' : 'proxy',
                      reloadKey: (prev.reloadKey || 0) + 1
                    }));
                  }}
                  title={inAppBrowser.renderMode === 'proxy' ? "In-App Proxy Shield Active (Bypasses Frame & CSP Blocks)" : "Direct Mode"}
                >
                  <Shield size={14} color={inAppBrowser.renderMode === 'proxy' ? '#00f3ff' : '#94a3b8'} />
                  <span className="ext-btn-label">{inAppBrowser.renderMode === 'proxy' ? 'Shield' : 'Direct'}</span>
                </button>

                <button
                  type="button"
                  className="inapp-action-btn"
                  onClick={() => {
                    setInAppBrowser((prev) => ({
                      ...prev,
                      reloadKey: (prev.reloadKey || 0) + 1
                    }));
                  }}
                  title="Reload Page"
                >
                  <RotateCw size={15} />
                </button>

                <button
                  type="button"
                  className="inapp-action-btn"
                  onClick={() => {
                    navigator.clipboard?.writeText(inAppBrowser.url);
                    setInAppBrowser((prev) => ({ ...prev, copied: true }));
                    setTimeout(() => {
                      setInAppBrowser((prev) => (prev ? { ...prev, copied: false } : null));
                    }, 1800);
                  }}
                  title="Copy URL"
                >
                  {inAppBrowser.copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                </button>

                <button
                  type="button"
                  className="inapp-action-btn primary-ext"
                  onClick={() => {
                    navigator.clipboard?.writeText(inAppBrowser.url);
                    setInAppBrowser((prev) => ({ ...prev, copiedToast: true }));
                    setTimeout(() => setInAppBrowser((prev) => prev ? { ...prev, copiedToast: false } : null), 3000);
                    if (inAppBrowser.isTor) {
                      window.open(inAppBrowser.gatewayUrl || inAppBrowser.url, '_blank');
                    } else {
                      window.open(inAppBrowser.url, '_blank');
                    }
                  }}
                  title={inAppBrowser.isTor ? 'Open in External Tor Gateway / Tor Browser (Clean Onion copied)' : 'Open in External Browser'}
                >
                  <ExternalLink size={15} />
                  <span className="ext-btn-label">External</span>
                </button>
              </div>
            </div>

            {/* Tor Gateway Bar if .onion */}
            {inAppBrowser.isTor && (
              <div className="inapp-tor-gateway-bar">
                <div className="gateway-status">
                  <Radio size={13} className="onion-spin" />
                  <span>
                    Bridge: <strong>{inAppBrowser.activeTab === 'sandbox' ? 'Tor Circuit Sandbox' : (inAppBrowser.gatewayService || 'onion.pet')}</strong>
                  </span>
                </div>
                <div className="gateway-switch-pills">
                  <button
                    type="button"
                    className={`gateway-pill ${(inAppBrowser.gatewayService || 'onion.pet') === 'onion.pet' && inAppBrowser.activeTab !== 'sandbox' ? 'active' : ''}`}
                    onClick={() => {
                      const host = inAppBrowser.displayHost ? inAppBrowser.displayHost.replace(/\.onion$/i, '') : inAppBrowser.url.replace(/^https?:\/\//i, '').split('/')[0].replace(/\.onion$/i, '');
                      setInAppBrowser((prev) => ({
                        ...prev,
                        gatewayService: 'onion.pet',
                        gatewayUrl: `https://${host}.onion.pet`,
                        activeTab: 'gateway',
                        reloadKey: (prev.reloadKey || 0) + 1
                      }));
                    }}
                  >
                    onion.pet
                  </button>
                  <button
                    type="button"
                    className={`gateway-pill ${inAppBrowser.gatewayService === 'onion.ws' && inAppBrowser.activeTab !== 'sandbox' ? 'active' : ''}`}
                    onClick={() => {
                      const host = inAppBrowser.displayHost ? inAppBrowser.displayHost.replace(/\.onion$/i, '') : inAppBrowser.url.replace(/^https?:\/\//i, '').split('/')[0].replace(/\.onion$/i, '');
                      setInAppBrowser((prev) => ({
                        ...prev,
                        gatewayService: 'onion.ws',
                        gatewayUrl: `https://${host}.onion.ws`,
                        activeTab: 'gateway',
                        reloadKey: (prev.reloadKey || 0) + 1
                      }));
                    }}
                  >
                    onion.ws
                  </button>
                  <button
                    type="button"
                    className={`gateway-pill ${inAppBrowser.gatewayService === 'onion.dog' && inAppBrowser.activeTab !== 'sandbox' ? 'active' : ''}`}
                    onClick={() => {
                      const host = inAppBrowser.displayHost ? inAppBrowser.displayHost.replace(/\.onion$/i, '') : inAppBrowser.url.replace(/^https?:\/\//i, '').split('/')[0].replace(/\.onion$/i, '');
                      setInAppBrowser((prev) => ({
                        ...prev,
                        gatewayService: 'onion.dog',
                        gatewayUrl: `https://${host}.onion.dog`,
                        activeTab: 'gateway',
                        reloadKey: (prev.reloadKey || 0) + 1
                      }));
                    }}
                  >
                    onion.dog
                  </button>
                  <button
                    type="button"
                    className={`gateway-pill sandbox-tab ${inAppBrowser.activeTab === 'sandbox' ? 'active' : ''}`}
                    onClick={() => {
                      setInAppBrowser((prev) => ({ ...prev, activeTab: 'sandbox' }));
                      if (!darkWebData || activeDarkWebUrl !== inAppBrowser.url) {
                        openDarkWebSandbox(inAppBrowser.url);
                      }
                    }}
                    title="Direct Tor Circuit Proxy (bypasses iframe restrictions)"
                  >
                    <Shield size={12} /> Tor Circuit Sandbox
                  </button>
                  <button
                    type="button"
                    className="gateway-pill external-tor"
                    onClick={() => {
                      navigator.clipboard?.writeText(inAppBrowser.url);
                      setInAppBrowser((prev) => ({ ...prev, copiedToast: true }));
                      setTimeout(() => setInAppBrowser((prev) => prev ? { ...prev, copiedToast: false } : null), 3000);
                      window.open(inAppBrowser.url, '_blank');
                    }}
                    title="Copy clean .onion address & Launch in native Tor Browser"
                  >
                    <ExternalLink size={12} /> Launch Tor Browser ↗
                  </button>
                </div>
              </div>
            )}

            {/* Browser Viewport Body */}
            <div className="inapp-browser-body">
              {inAppBrowser.copiedToast && (
                <div className="inapp-copied-toast">
                  <Check size={14} color="#10b981" />
                  <span>Onion link copied to clipboard! Ready to paste into Tor Browser.</span>
                </div>
              )}

              {inAppBrowser.isTor && inAppBrowser.activeTab === 'sandbox' ? (
                <div className="inapp-sandbox-body">
                  {darkWebLoading ? (
                    <div className="inapp-sandbox-loading">
                      <Radio size={28} className="onion-spin" color="#10b981" />
                      <p>Establishing isolated Tor SOCKS5 circuit...</p>
                    </div>
                  ) : darkWebData?.content ? (
                    <div
                      className="inapp-sandbox-html"
                      dangerouslySetInnerHTML={{ __html: darkWebData.content }}
                    />
                  ) : (
                    <div className="inapp-sandbox-fallback">
                      <div className="sandbox-fallback-card">
                        <Radio size={24} color="#38bdf8" />
                        <h4>Direct Tor Circuit Proxy</h4>
                        <p>{darkWebData?.error || 'Unable to connect through gateway bridge. Use Tor Browser to access this onion service.'}</p>
                        <button
                          type="button"
                          className="gateway-pill active"
                          onClick={() => {
                            navigator.clipboard?.writeText(inAppBrowser.url);
                            window.open(inAppBrowser.url, '_blank');
                          }}
                        >
                          <ExternalLink size={13} /> Open in Tor Browser ({inAppBrowser.url})
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <iframe
                  key={`${inAppBrowser.reloadKey || 0}_${inAppBrowser.renderMode}`}
                  src={
                    inAppBrowser.renderMode === 'direct'
                      ? (inAppBrowser.isTor ? inAppBrowser.gatewayUrl : inAppBrowser.url)
                      : `${serverUrl}/api/browser/render?url=${encodeURIComponent(inAppBrowser.isTor ? inAppBrowser.gatewayUrl : inAppBrowser.url)}`
                  }
                  className="inapp-browser-frame"
                  title="In-App Web Browser"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Delete Attachment Confirmation Modal --- */}
      {deleteConfirm && (
        <div className="society-delete-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="society-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="society-delete-modal-header">
              <Trash2 size={20} color="#ef4444" />
              <h3>Delete {deleteConfirm.type === 'voice' ? 'Voice Transmission' : 'File Attachment'}?</h3>
            </div>
            <p className="society-delete-modal-desc">
              Are you sure you want to permanently delete <strong>{deleteConfirm.fileName || 'this attachment'}</strong>? It will be removed for everyone in the chamber.
            </p>
            <div className="society-delete-modal-actions">
              <button
                type="button"
                className="society-modal-cancel-btn"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="society-modal-confirm-delete-btn"
                onClick={executeDeleteConfirm}
              >
                Delete Attachment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

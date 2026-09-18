import { useEffect, useRef, useState, useMemo } from 'react';
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
  Mail,
  Play,
  Pause,
  Trash2,
  Ban,
  Code2,
  Copy
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
        const updated = {
          ...parsed,
          userId: parsed.userId || ('usr_' + Math.random().toString(36).substring(2, 11)),
          alias: cleanAlias,
          bio: parsed.bio || 'Encrypted mesh developer',
          status: parsed.status || 'Online',
          isVerified: !!parsed.isVerified
        };
        localStorage.setItem('bbx_identity', JSON.stringify(updated));
        return updated;
      }
    } catch { /* ignore */ }
  }
  const alias = generateRealUsername();
  const userId = 'usr_' + Math.random().toString(36).substring(2, 11);
  const color = HACKER_COLORS[Math.floor(Math.random() * HACKER_COLORS.length)];
  const randomAvatar = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)].svg;
  identity = {
    userId,
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

function VoiceWaveformPlayer({ audioUrl, isOwn, onDelete }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  // Generate deterministic speech-like waveform bar heights
  const bars = useMemo(() => {
    const count = 28;
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
      const height = Math.max(20, Math.min(100, Math.floor((envelope * 0.55 + pseudo * 0.45) * 80 + 20)));
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
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && duration === 0) {
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

  const handleSeek = (index) => {
    const audio = audioRef.current;
    if (!audio) return;
    const dur = (duration > 0 && isFinite(duration)) ? duration : (audio.duration && isFinite(audio.duration) ? audio.duration : 0);
    if (dur > 0) {
      const progress = index / (bars.length - 1);
      const newTime = progress * dur;
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const progressPercent = (duration > 0 && isFinite(duration)) ? (currentTime / duration) : 0;
  const currentBarIndex = Math.floor(progressPercent * bars.length);

  const formatSecs = (secs) => {
    if (!secs || isNaN(secs) || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`voice-waveform-player ${isPlaying ? 'playing' : ''} ${isOwn ? 'own' : ''}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        className="waveform-play-btn"
        onClick={togglePlay}
        title={isPlaying ? 'Pause Voice Note' : 'Play Voice Note'}
      >
        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: 2 }} />}
      </button>

      {/* Waveform Bars Track */}
      <div className="waveform-bars-track">
        <div className="waveform-bars-list" title="Click to seek">
          {bars.map((h, i) => {
            const isPassed = i <= currentBarIndex && currentTime > 0;
            return (
              <div
                key={i}
                className={`waveform-bar ${isPassed ? 'played' : ''} ${isPlaying && isPassed ? 'pulse' : ''}`}
                style={{ height: `${h}%` }}
                onClick={() => handleSeek(i)}
              />
            );
          })}
        </div>

        {/* Timestamp Row */}
        <div className="waveform-time-row">
          <span className="waveform-current-time">
            {formatSecs(currentTime)}
          </span>
          <span className="waveform-duration">
            {duration > 0 && isFinite(duration) ? formatSecs(duration) : (currentTime > 0 ? formatSecs(currentTime) : 'Voice Note')}
          </span>
        </div>
      </div>

      {/* Sender Delete Voice Note Button */}
      {isOwn && onDelete && (
        <button
          type="button"
          className="waveform-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete voice transmission"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

// --- VS Code Dark+ Syntax Tokenizer ---
const VSCODE_KEYWORDS = new Set([
  'if', 'else', 'elif', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue',
  'return', 'yield', 'try', 'except', 'catch', 'finally', 'throw', 'raise', 'with', 'as',
  'import', 'from', 'export', 'pass', 'assert', 'await', 'async', 'def', 'function', 'class',
  'const', 'let', 'var', 'new', 'typeof', 'instanceof', 'public', 'private', 'protected',
  'static', 'final', 'void', 'int', 'float', 'double', 'char', 'boolean', 'interface',
  'implements', 'extends', 'package', 'lambda', 'global', 'nonlocal', 'in', 'is', 'not',
  'and', 'or', 'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE'
]);

const VSCODE_CONSTANTS = new Set([
  'true', 'false', 'True', 'False', 'null', 'None', 'undefined', 'NaN', 'self', 'this'
]);

const VSCODE_BUILTINS = new Set([
  'print', 'len', 'range', 'str', 'dict', 'list', 'set', 'tuple', 'int', 'float', 'bool',
  'console', 'log', 'error', 'warn', 'info', 'map', 'filter', 'reduce', 'parseInt', 'parseFloat',
  'Math', 'JSON', 'Promise', 'Array', 'Object', 'String', 'Number', 'Boolean', 'System', 'out', 'println'
]);

function tokenizeCodeLine(line, lang = '') {
  if (!line) return [<span key="empty">&nbsp;</span>];

  const tokens = [];
  let remaining = line;
  let keyIdx = 0;
  const isPyOrBash = /^(py|python|sh|bash|shell|yaml|yml)/i.test(lang);

  while (remaining.length > 0) {
    // 1. Comments
    if ((isPyOrBash && remaining.startsWith('#')) || remaining.startsWith('//')) {
      tokens.push(
        <span key={`c-${keyIdx++}`} className="vs-tok-comment">
          {remaining}
        </span>
      );
      break;
    }

    // 2. Strings
    const strMatch = remaining.match(/^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/);
    if (strMatch) {
      tokens.push(
        <span key={`s-${keyIdx++}`} className="vs-tok-string">
          {strMatch[0]}
        </span>
      );
      remaining = remaining.slice(strMatch[0].length);
      continue;
    }

    // 3. Numbers
    const numMatch = remaining.match(/^(\b\d+(\.\d+)?\b)/);
    if (numMatch) {
      tokens.push(
        <span key={`n-${keyIdx++}`} className="vs-tok-number">
          {numMatch[0]}
        </span>
      );
      remaining = remaining.slice(numMatch[0].length);
      continue;
    }

    // 4. Identifiers / Keywords / Functions / Types
    const wordMatch = remaining.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (wordMatch) {
      const word = wordMatch[0];
      const nextChar = remaining.slice(word.length).trimStart()[0];

      if (VSCODE_CONSTANTS.has(word)) {
        tokens.push(
          <span key={`w-${keyIdx++}`} className="vs-tok-constant">
            {word}
          </span>
        );
      } else if (VSCODE_KEYWORDS.has(word)) {
        tokens.push(
          <span key={`w-${keyIdx++}`} className="vs-tok-keyword">
            {word}
          </span>
        );
      } else if (VSCODE_BUILTINS.has(word)) {
        tokens.push(
          <span key={`w-${keyIdx++}`} className="vs-tok-builtin">
            {word}
          </span>
        );
      } else if (nextChar === '(') {
        tokens.push(
          <span key={`w-${keyIdx++}`} className="vs-tok-function">
            {word}
          </span>
        );
      } else if (/^[A-Z]/.test(word)) {
        tokens.push(
          <span key={`w-${keyIdx++}`} className="vs-tok-type">
            {word}
          </span>
        );
      } else {
        tokens.push(
          <span key={`w-${keyIdx++}`} className="vs-tok-variable">
            {word}
          </span>
        );
      }

      remaining = remaining.slice(word.length);
      continue;
    }

    // 5. Operators & Punctuation
    const opMatch = remaining.match(/^([+\-*/%=<>!&|^~?:;,.()\[\]{}]+)/);
    if (opMatch) {
      tokens.push(
        <span key={`o-${keyIdx++}`} className="vs-tok-operator">
          {opMatch[0]}
        </span>
      );
      remaining = remaining.slice(opMatch[0].length);
      continue;
    }

    // 6. Whitespace
    const wsMatch = remaining.match(/^(\s+)/);
    if (wsMatch) {
      tokens.push(<span key={`ws-${keyIdx++}`}>{wsMatch[0]}</span>);
      remaining = remaining.slice(wsMatch[0].length);
      continue;
    }

    tokens.push(<span key={`ch-${keyIdx++}`}>{remaining[0]}</span>);
    remaining = remaining.slice(1);
  }

  return tokens;
}

function CodeBlock({ code, language = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const cleanLang = (language || 'code').trim().toUpperCase();
  const lines = (code || '').split(/\r?\n/);

  return (
    <div className="chat-code-block vscode-editor-container">
      <div className="code-block-header vscode-editor-header">
        <div className="vscode-window-controls">
          <span className="window-dot red" />
          <span className="window-dot yellow" />
          <span className="window-dot green" />
          <div className="code-lang-badge">
            <Code2 size={12} />
            <span>{cleanLang}</span>
          </div>
        </div>
        <button
          type="button"
          className={`code-copy-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          title="Copy Code to Clipboard"
        >
          {copied ? (
            <>
              <Check size={12} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="vscode-editor-body">
        <div className="vscode-gutter" aria-hidden="true">
          {lines.map((_, i) => (
            <div key={i} className="vscode-gutter-line-num">
              {i + 1}
            </div>
          ))}
        </div>
        <pre className="code-content-pre vscode-code-pre">
          <code>
            {lines.map((line, idx) => (
              <div key={idx} className="vscode-line-row">
                {tokenizeCodeLine(line, cleanLang)}
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

function TypewriterMessage({ text, isJames, msgId, animatedIdsSet, onFinishAnimation, renderFn }) {
  const isAlreadyAnimated = !isJames || (animatedIdsSet && animatedIdsSet.has(msgId));
  const [displayedLength, setDisplayedLength] = useState(() => isAlreadyAnimated ? text.length : 0);

  useEffect(() => {
    if (isAlreadyAnimated) {
      setDisplayedLength(text.length);
      return;
    }

    let current = 0;
    // Fast, smooth step calculation
    const step = Math.max(2, Math.floor(text.length / 32));
    const interval = setInterval(() => {
      current += step;
      if (current >= text.length) {
        current = text.length;
        clearInterval(interval);
        if (onFinishAnimation && msgId) {
          onFinishAnimation(msgId);
        }
      }
      setDisplayedLength(current);
    }, 18);

    return () => clearInterval(interval);
  }, [text, msgId, isAlreadyAnimated]);

  const visibleText = displayedLength >= text.length ? text : text.slice(0, displayedLength);
  const isStillTyping = !isAlreadyAnimated && displayedLength < text.length;

  return (
    <div className={`typewriter-container ${isStillTyping ? 'typing-in-progress' : ''}`}>
      {renderFn(visibleText)}
      {isStillTyping && <span className="typewriter-cursor">▎</span>}
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

  // Dynamic James Activity Status & Typewriter Animation Tracking
  const [jamesStatus, setJamesStatus] = useState(null); // { alias, status: 'thinking'|'searching'|'typing', text }
  const [animatedMessageIds, setAnimatedMessageIds] = useState(() => new Set());
  const animatedMessageIdsRef = useRef(new Set());

  const markMessageAnimated = (id) => {
    animatedMessageIdsRef.current.add(id);
    setAnimatedMessageIds(new Set(animatedMessageIdsRef.current));
  };

  // Expanded Sources Popover State
  const [expandedSourcesMsgId, setExpandedSourcesMsgId] = useState(null);

  // @ Mention Autocomplete States
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');

  // Selected User Profile Popup Modal State
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [userProfilesMap, setUserProfilesMap] = useState({});

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
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const audioCanvasRef = useRef(null);

  const cleanupAudioVisualizer = () => {
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => { });
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
  };

  const [identity, setIdentity] = useState(getOrCreateIdentity());
  const [passphrase, setPassphrase] = useState(localStorage.getItem('bbx_passphrase') || '');
  const [showPassphraseKey, setShowPassphraseKey] = useState(false);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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
    if (!passphrase) {
      return {
        ...obj,
        userId: obj.userId || identity.userId
      };
    }
    const payload = JSON.stringify(obj);
    return {
      encrypted: CryptoJS.AES.encrypt(payload, passphrase).toString(),
      fileUrl: obj.fileUrl || null,
      userId: obj.userId || identity.userId,
      alias: obj.alias || identity.alias
    };
  }

  function decryptMsg(msg) {
    if (!msg.encrypted) return { ...msg, userId: msg.userId, sources: msg.sources || [] };
    if (!passphrase) {
      return {
        text: '🔒 Encrypted Payload (Enter Passphrase in Vault)',
        userId: msg.userId,
        alias: msg.alias || 'Encrypted',
        color: '#ffaa00',
        timestamp: msg.timestamp,
        sources: msg.sources || []
      };
    }
    try {
      const bytes = CryptoJS.AES.decrypt(msg.encrypted, passphrase);
      const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
      if (!decryptedStr) throw new Error('Bad key');
      const decrypted = JSON.parse(decryptedStr);
      return {
        ...decrypted,
        userId: decrypted.userId || msg.userId,
        id: msg.id,
        timestamp: msg.timestamp,
        reactions: msg.reactions,
        fileUrl: decrypted.fileUrl || msg.fileUrl,
        isFileDeleted: msg.isFileDeleted !== undefined ? msg.isFileDeleted : decrypted.isFileDeleted,
        deletedType: msg.deletedType || decrypted.deletedType,
        allowDownload: msg.allowDownload !== undefined ? msg.allowDownload : decrypted.allowDownload,
        sources: msg.sources || decrypted.sources || []
      };
    } catch {
      return {
        text: '⚠️ [Decryption Failed - Invalid Passphrase Key]',
        userId: msg.userId,
        alias: msg.alias || 'Unknown',
        color: '#ff0055',
        timestamp: msg.timestamp
      };
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

  const identityRef = useRef(identity);
  useEffect(() => {
    identityRef.current = identity;
  }, [identity]);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      socketRef.current.emit('userJoined', {
        alias: identityRef.current.alias,
        userId: identityRef.current.userId,
        color: identityRef.current.color,
        avatar: identityRef.current.avatar,
        bio: identityRef.current.bio,
        status: identityRef.current.status,
        isVerified: identityRef.current.isVerified
      });
    });

    socketRef.current.on('profilesSync', (profiles) => {
      if (profiles && typeof profiles === 'object') {
        setUserProfilesMap((prev) => ({ ...prev, ...profiles }));
      }
    });

    socketRef.current.on('userProfileUpdated', (profile) => {
      if (profile) {
        setUserProfilesMap((prev) => {
          const next = { ...prev };
          if (profile.userId) next[profile.userId] = profile;
          if (profile.alias) next[profile.alias.toLowerCase()] = profile;
          return next;
        });
      }
    });

    socketRef.current.on('init', (msgs) => {
      setMessages(msgs);
      if (Array.isArray(msgs)) {
        msgs.forEach((m) => {
          if (m && m.id) {
            animatedMessageIdsRef.current.add(m.id);
          }
        });
        setAnimatedMessageIds(new Set(animatedMessageIdsRef.current));

        setUserProfilesMap((prev) => {
          const updated = { ...prev };
          msgs.forEach((m) => {
            try {
              const dmsg = decryptMsg(m);
              if (dmsg && (dmsg.alias || dmsg.userId) && (dmsg.bio !== undefined || dmsg.status)) {
                const key = (dmsg.alias || '').toLowerCase();
                const uId = dmsg.userId;
                const p = {
                  alias: dmsg.alias,
                  userId: uId,
                  color: dmsg.color,
                  avatar: dmsg.avatar,
                  bio: dmsg.bio,
                  status: dmsg.status,
                  isVerified: dmsg.isVerified
                };
                if (key) updated[key] = { ...(updated[key] || {}), ...p };
                if (uId) updated[uId] = { ...(updated[uId] || {}), ...p };
              }
            } catch {}
          });
          return updated;
        });
      }
    });

    socketRef.current.on('userCount', (count) => setOnlineCount(count || 1));

    socketRef.current.on('jamesStatus', (payload) => {
      if (payload && payload.status && payload.status !== 'idle') {
        setJamesStatus(payload);
      } else {
        setJamesStatus(null);
      }
    });

    socketRef.current.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.alias === 'James' || msg.userId === 'bot_james') {
        setJamesStatus(null);
      }
      try {
        const dmsg = decryptMsg(msg);
        if (dmsg && (dmsg.alias || dmsg.userId) && (dmsg.bio !== undefined || dmsg.status)) {
          const key = (dmsg.alias || '').toLowerCase();
          const uId = dmsg.userId;
          const p = {
            alias: dmsg.alias,
            userId: uId,
            color: dmsg.color,
            avatar: dmsg.avatar,
            bio: dmsg.bio,
            status: dmsg.status,
            isVerified: dmsg.isVerified
          };
          setUserProfilesMap((prev) => {
            const next = { ...prev };
            if (key) next[key] = { ...(next[key] || {}), ...p };
            if (uId) next[uId] = { ...(next[uId] || {}), ...p };
            return next;
          });
        }
      } catch {}
    });

    socketRef.current.on('reaction', ({ messageId, reactions }) => {
      setMessages((prev) => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
    });

    // Real-time sync for file download permissions
    socketRef.current.on('fileDownloadToggled', ({ messageId, allowDownload }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, allowDownload } : m));
    });

    // Real-time sync for message deletion across all clients
    socketRef.current.on('messageDeleted', ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    // Real-time sync for file attachment deletion across all clients
    socketRef.current.on('fileAttachmentDeleted', ({ messageId, updatedMessage }) => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? updatedMessage : m)));
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

    // Notify server immediately if user closes browser window or tab
    const handleBeforeUnload = () => {
      if (socketRef.current?.connected && identityRef.current?.alias) {
        socketRef.current.emit('userLeaving', {
          userId: identityRef.current.userId,
          alias: identityRef.current.alias
        });
        socketRef.current.disconnect();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      socketRef.current?.disconnect();
    };
  }, []);

  // Synchronize identity updates (alias, bio, status, avatar, color, verification) with server in real time
  useEffect(() => {
    if (socketRef.current?.connected && identity?.alias) {
      const payload = {
        alias: identity.alias,
        userId: identity.userId,
        color: identity.color,
        avatar: identity.avatar,
        bio: identity.bio,
        status: identity.status,
        isVerified: identity.isVerified
      };
      socketRef.current.emit('userJoined', payload);
      socketRef.current.emit('userProfileUpdate', payload);
    }
  }, [
    identity.alias,
    identity.userId,
    identity.color,
    identity.avatar,
    identity.bio,
    identity.status,
    identity.isVerified
  ]);

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
  }, [messages, jamesStatus, atBottom]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Mobile Visual Viewport & Dial Pad / Virtual Keyboard Adaptation
  useEffect(() => {
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const height = window.visualViewport.height;
        document.documentElement.style.setProperty('--visual-viewport-height', `${height}px`);
        const kbHeight = Math.max(0, window.innerHeight - height);
        document.documentElement.style.setProperty('--keyboard-height', `${kbHeight}px`);
        if (kbHeight > 80) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 80);
        }
      } else {
        document.documentElement.style.setProperty('--visual-viewport-height', `${window.innerHeight}px`);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }
    window.addEventListener('resize', handleViewportChange);
    handleViewportChange();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
      window.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  const handleInputFocus = () => {
    // When virtual keyboard opens on mobile, automatically scroll messages and keep composer pinned
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 120);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  // Real-time Audio Pitch & Waveform Live Visualizer Animation Loop
  useEffect(() => {
    if (!isRecording) return;

    let animId;
    let barHeights = [];

    const render = () => {
      const canvas = audioCanvasRef.current;
      const analyser = analyserRef.current;

      if (canvas && analyser) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const rect = canvas.getBoundingClientRect();
          const w = rect.width;
          const h = rect.height;

          if (w > 0 && h > 0) {
            if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
              canvas.width = Math.floor(w * dpr);
              canvas.height = Math.floor(h * dpr);
            }

            ctx.save();
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, w, h);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteFrequencyData(dataArray);

            // Compute overall volume
            let totalVol = 0;
            for (let i = 0; i < bufferLength; i++) {
              totalVol += dataArray[i];
            }
            const avgVol = totalVol / (bufferLength * 255); // 0 to 1

            // Dynamic number of bars according to width
            const barWidth = 3;
            const minGap = 3;
            const numBars = Math.max(12, Math.min(32, Math.floor(w / (barWidth + minGap))));
            const gap = (w - (numBars * barWidth)) / Math.max(1, numBars - 1);
            const minH = 3.5;
            const maxH = Math.max(minH, h - 4);

            if (barHeights.length !== numBars) {
              barHeights = new Array(numBars).fill(minH);
            }

            // Frequency range for speech: bins 1 to 40
            const minBin = 1;
            const maxBin = Math.min(bufferLength - 1, 40);

            for (let i = 0; i < numBars; i++) {
              // Musical pitch distribution from low pitch (left) to high pitch (right)
              const binIdx = Math.floor(minBin + Math.pow(i / (numBars - 1), 1.3) * (maxBin - minBin));
              const freqVal = (dataArray[binIdx] || 0) / 255;

              // Voice energy combines specific pitch frequency (75%) and overall volume (25%)
              const energy = (freqVal * 0.75) + (avgVol * 0.25);
              const targetH = Math.max(minH, energy * maxH);

              // Snappy attack, smooth gravity decay
              if (targetH > barHeights[i]) {
                barHeights[i] = targetH;
              } else {
                barHeights[i] = Math.max(minH, barHeights[i] * 0.88 - 0.35);
              }

              const currentH = barHeights[i];
              const x = i * (barWidth + gap);
              const y = (h - currentH) / 2; // Vertically centered

              const isActive = currentH > minH + 2;
              const grad = ctx.createLinearGradient(0, y, 0, y + currentH);
              if (isActive) {
                grad.addColorStop(0, '#ff0055');
                grad.addColorStop(0.5, '#ff3388');
                grad.addColorStop(1, '#ff0055');
                ctx.shadowColor = 'rgba(255, 0, 85, 0.6)';
                ctx.shadowBlur = 5;
              } else {
                grad.addColorStop(0, 'rgba(255, 0, 85, 0.45)');
                grad.addColorStop(1, 'rgba(255, 0, 85, 0.3)');
                ctx.shadowBlur = 0;
              }

              ctx.fillStyle = grad;
              const radius = Math.min(barWidth / 2, currentH / 2);
              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(x, y, barWidth, currentH, radius);
              } else {
                ctx.rect(x, y, barWidth, currentH);
              }
              ctx.fill();
            }

            ctx.restore();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isRecording]);

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

  // Trigger Delete Confirm Modal for file or voice attachment (Sender only)
  const promptDeleteFile = (msgId, fileUrl, isVoice = false, fileName = '') => {
    setHoveredMsgId(null);
    setActiveReactionMsgId(null);
    setDeleteConfirm({
      type: isVoice ? 'voice' : 'file',
      messageId: msgId,
      fileUrl: fileUrl || null,
      fileName: fileName || (isVoice ? 'Voice Transmission' : 'File Attachment')
    });
  };

  // Execute Confirmed Deletion of file / voice transmission
  const executeDeleteConfirm = () => {
    if (!deleteConfirm) return;
    const { type, messageId, fileUrl } = deleteConfirm;

    if (navigator.vibrate) {
      try { navigator.vibrate(35); } catch { }
    }

    const targetMsg = messages.find(m => m.id === messageId);
    let newEncryptedPayload = null;
    if (targetMsg && targetMsg.encrypted && passphrase) {
      try {
        const bytes = CryptoJS.AES.decrypt(targetMsg.encrypted, passphrase);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
        if (decryptedStr) {
          const parsed = JSON.parse(decryptedStr);
          parsed.fileUrl = null;
          parsed.imageUrl = null;
          parsed.videoUrl = null;
          parsed.audioUrl = null;
          parsed.fileName = null;
          parsed.fileType = null;
          parsed.fileSize = null;
          parsed.isVoiceNote = false;
          parsed.allowDownload = undefined;
          parsed.isFileDeleted = true;
          parsed.deletedType = type;
          newEncryptedPayload = CryptoJS.AES.encrypt(JSON.stringify(parsed), passphrase).toString();
        }
      } catch (e) {
        console.error('Failed to re-encrypt after file deletion:', e);
      }
    }

    if (socketRef.current) {
      socketRef.current.emit('deleteFileAttachment', {
        messageId,
        fileUrl,
        isVoice: type === 'voice',
        newEncryptedPayload
      });
    }

    // Optimistically update message in state to show placeholder
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      return {
        ...m,
        isFileDeleted: true,
        deletedType: type,
        fileUrl: null,
        imageUrl: null,
        videoUrl: null,
        audioUrl: null,
        fileName: null,
        fileType: null,
        fileSize: null,
        allowDownload: undefined,
        ...(newEncryptedPayload ? { encrypted: newEncryptedPayload } : {})
      };
    }));

    setDeleteConfirm(null);
  };

  // Compute mentionable users for @ autocomplete
  const mentionCandidates = Array.from(
    new Set([
      'James',
      ...Object.values(userProfilesMap).map(p => p?.alias).filter(Boolean),
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

      // Initialize Web Audio API Analyser for real-time live pitch & volume detection
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
          }
          audioCtxRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.72;
          source.connect(analyser);
          analyserRef.current = analyser;
        }
      } catch (audioErr) {
        console.warn('AudioContext visualizer init failed:', audioErr);
      }

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        cleanupAudioVisualizer();
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
          isVoiceNote: true,
          userId: identity.userId,
          alias: identity.alias,
          color: identity.color,
          avatar: identity.avatar,
          bio: identity.bio || '',
          status: identity.status || 'Online',
          isVerified: identity.isVerified,
          allowDownload: false,
          replyTo: replyingTo ? {
            id: replyingTo.id,
            userId: replyingTo.userId,
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
      cleanupAudioVisualizer();
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      cleanupAudioVisualizer();
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
        userId: identity.userId,
        alias: identity.alias,
        color: identity.color,
        avatar: identity.avatar,
        bio: identity.bio || '',
        status: identity.status || 'Online',
        isVerified: identity.isVerified,
        allowDownload: true,
        replyTo: replyingTo ? {
          id: replyingTo.id,
          userId: replyingTo.userId,
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
        userId: identity.userId,
        alias: identity.alias,
        color: identity.color,
        avatar: identity.avatar,
        bio: identity.bio || '',
        status: identity.status || 'Online',
        isVerified: identity.isVerified,
        replyTo: replyingTo ? {
          id: replyingTo.id,
          userId: replyingTo.userId,
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
      userId: dmsg?.userId || null,
      alias: dmsg?.alias || 'User',
      color: dmsg?.color,
      text: dmsg?.text,
      fileName: dmsg?.fileName,
      fileType: dmsg?.fileType
    });
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const getUserProfile = (alias, fallbackColor, fallbackAvatar, fallbackVerified, fallbackBio, fallbackStatus, userId) => {
    if (!alias && !userId) return null;
    const cleanAlias = (alias || '').replace(/^@/, '');
    const key = cleanAlias.toLowerCase();

    // 1. If own alias or userId, always return current live identity
    const isSelf = Boolean(
      (userId && identity?.userId && userId === identity.userId) ||
      (cleanAlias && identity?.alias && cleanAlias.toLowerCase() === identity.alias.toLowerCase())
    );
    if (isSelf) {
      return {
        alias: identity.alias,
        userId: identity.userId,
        color: identity.color || '#00f3ff',
        avatar: identity.avatar !== undefined ? identity.avatar : null,
        isVerified: !!identity.isVerified,
        bio: identity.bio || 'Encrypted mesh developer',
        status: identity.status || 'Online',
        isOnline: true
      };
    }

    // 2. If James Bot
    if (key === 'james' || userId === 'bot_james') {
      return {
        alias: 'James',
        userId: 'bot_james',
        color: '#00f3ff',
        avatar: null,
        isVerified: true,
        bio: "Full-stack engineer & verified community member. Always around!",
        status: 'Online',
        isOnline: true
      };
    }

    // 3. Lookup in synchronized userProfilesMap by userId, alias, or previousAliases
    let cached = null;
    if (userId && userProfilesMap[userId]) {
      cached = userProfilesMap[userId];
    } else if (key && userProfilesMap[key]) {
      cached = userProfilesMap[key];
    } else {
      for (const p of Object.values(userProfilesMap)) {
        if (!p) continue;
        if (userId && p.userId === userId) {
          cached = p;
          break;
        }
        if (p.alias && p.alias.toLowerCase() === key) {
          cached = p;
          break;
        }
        if (p.previousAliases && p.previousAliases.some(a => a.toLowerCase() === key)) {
          cached = p;
          break;
        }
      }
    }

    const isOnline = cached?.isOnline !== undefined ? Boolean(cached.isOnline) : (cached?.status ? cached.status !== 'Offline' : false);
    const resolvedStatus = cached?.status ? cached.status : (isOnline ? (fallbackStatus || 'Online') : 'Offline');
    const resolvedColor = cached?.color || fallbackColor || '#00f3ff';
    const resolvedAvatar = cached?.avatar !== undefined ? cached.avatar : (fallbackAvatar || null);
    const resolvedVerified = cached?.isVerified !== undefined ? cached.isVerified : !!fallbackVerified;
    const resolvedBio = cached?.bio || fallbackBio || 'Encrypted mesh user';

    return {
      alias: cached?.alias || cleanAlias,
      userId: cached?.userId || userId,
      color: resolvedColor,
      avatar: resolvedAvatar,
      isVerified: resolvedVerified,
      bio: resolvedBio,
      status: resolvedStatus,
      isOnline
    };
  };

  const openUserProfile = (alias, color, avatar, isVerified, bio, status, userId) => {
    if (!alias && !userId) return;
    const cleanAlias = (alias || '').replace(/^@/, '');
    const profile = getUserProfile(cleanAlias, color, avatar, isVerified, bio, status, userId);
    setSelectedUserProfile({
      ...profile,
      clickedAlias: cleanAlias
    });
  };

  const renderMarkdownTable = (tableText, key) => {
    if (!tableText) return null;
    const lines = tableText.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return null;

    const parseRow = (rowStr) => {
      return rowStr
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map(cell => cell.trim());
    };

    const headers = parseRow(lines[0]);
    // Filter out delimiter line (e.g. |---|---|)
    const dataLines = lines.slice(1).filter(l => !l.match(/^\|?\s*[:\-]+(?:\s*\|\s*[:\-]+)*\s*\|?$/));
    const rows = dataLines.map(parseRow);

    return (
      <div key={key} className="chat-markdown-table-wrapper">
        <table className="chat-markdown-table">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderFormattedMessage = (text) => {
    if (!text) return null;

    // 1. Split text into code blocks (```lang ... ```) and regular text segments
    const codeBlockRegex = /```(?:([a-zA-Z0-9_#-]+)?\r?\n)?([\s\S]*?)```/g;
    const segments = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }
      segments.push({
        type: 'code',
        language: match[1] || 'code',
        code: match[2].trim()
      });
      lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    // Clean whitespace around code blocks so no unnecessary blank lines appear
    const cleanedSegments = [];
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.type === 'code') {
        cleanedSegments.push(seg);
      } else {
        let content = seg.content;
        const prevSeg = segments[i - 1];
        const nextSeg = segments[i + 1];

        if (prevSeg && prevSeg.type === 'code') {
          content = content.replace(/^\r?\n+/, '');
        }
        if (nextSeg && nextSeg.type === 'code') {
          content = content.replace(/\r?\n+$/, '');
        }

        if (content.length > 0) {
          cleanedSegments.push({ type: 'text', content });
        }
      }
    }

    // 1.5 Sub-split text segments into Markdown Tables and plain text
    const tableRegex = /((?:^|\n)\|[^\n]+\|\r?\n\|[\s\-:|]+\|\r?\n(?:\|[^\n]+\|\r?\n?)+)/g;
    const finalSegments = [];

    for (const seg of cleanedSegments) {
      if (seg.type === 'code') {
        finalSegments.push(seg);
        continue;
      }

      const str = seg.content;
      let lastTblIdx = 0;
      let tblMatch;
      while ((tblMatch = tableRegex.exec(str)) !== null) {
        if (tblMatch.index > lastTblIdx) {
          finalSegments.push({
            type: 'text',
            content: str.slice(lastTblIdx, tblMatch.index)
          });
        }
        finalSegments.push({
          type: 'table',
          content: tblMatch[1].trim()
        });
        lastTblIdx = tableRegex.lastIndex;
      }

      if (lastTblIdx < str.length) {
        finalSegments.push({
          type: 'text',
          content: str.slice(lastTblIdx)
        });
      }
    }

    return finalSegments.map((seg, segIdx) => {
      if (seg.type === 'code') {
        return <CodeBlock key={`cb-${segIdx}`} code={seg.code} language={seg.language} />;
      }

      if (seg.type === 'table') {
        return renderMarkdownTable(seg.content, `tbl-${segIdx}`);
      }

      // 2. Parse inline tokens: bold (**text**), inline code (`code`), URLs, mentions
      const inlineRegex = /(\*\*[^*]+\*\*|`[^`\n]+`|https?:\/\/[^\s]+|@[a-zA-Z0-9._-]+)/g;
      const parts = seg.content.split(inlineRegex);

      return (
        <span key={`seg-${segIdx}`}>
          {parts.map((part, pIdx) => {
            if (!part) return null;

            // Bold block highlight: **text**
            if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
              const boldText = part.slice(2, -2);
              return (
                <strong key={`b-${pIdx}`} className="chat-highlight">
                  {boldText}
                </strong>
              );
            }

            // Inline code: `code`
            if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
              const codeText = part.slice(1, -1);
              return (
                <code key={`c-${pIdx}`} className="chat-inline-code">
                  {codeText}
                </code>
              );
            }

            // Clickable URL
            if (part.match(URL_REGEX)) {
              return (
                <a
                  key={`u-${pIdx}`}
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

            // Interactive @Mention
            if (part.startsWith('@') && part.length > 1) {
              const username = part.slice(1);
              return (
                <span
                  key={`m-${pIdx}`}
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
          })}
        </span>
      );
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
              <span className={`status-indicator-dot ${(identity.status || 'online').toLowerCase().replace(/\s+/g, '-')}`} title={identity.status || 'Online'} />
            </div>
            <span className="profile-btn-alias">{identity.alias}</span>
            {identity.isVerified && <VerifiedBlueTick size={14} className="header-verified-tick" />}
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
              const isOwn = Boolean(
                (dmsg.userId && identity.userId && dmsg.userId === identity.userId) ||
                (dmsg.alias && identity.alias && dmsg.alias.toLowerCase() === identity.alias.toLowerCase())
              );
              const isJames = dmsg.alias === 'James' || dmsg.userId === 'bot_james';
              const isVerified = dmsg.isVerified || isJames;
              const msgId = msg.id || idx;
              const isPopoverVisible = hoveredMsgId === msgId || activeReactionMsgId === msgId;

              const reactionEntries = Object.entries(msg.reactions || {}).filter(([, users]) => users.length > 0);
              const hasActiveReactions = reactionEntries.length > 0;

              const isVoiceNote = Boolean(
                dmsg.isVoiceNote ||
                dmsg.fileName === 'Voice Transmission.webm' ||
                (dmsg.audioUrl && (!dmsg.fileName || dmsg.fileName.startsWith('voice-note-')))
              );
              const isImage = dmsg.imageUrl || dmsg.fileType?.startsWith('image/');
              const isVideo = dmsg.videoUrl || dmsg.fileType?.startsWith('video/');
              const isAudio = !isVoiceNote && (dmsg.audioUrl || dmsg.fileType?.startsWith('audio/'));
              const isOtherFile = dmsg.fileUrl && !isImage && !isVideo && !isAudio && !isVoiceNote;
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

                    {/* If own message: Reply button always, and Delete button ONLY for file or live voice recording */}
                    {isOwn && (
                      <div className="msg-side-actions left permanent">
                        <button
                          className="msg-side-reply-btn always-visible"
                          onClick={() => startReply(msg, dmsg, msgId)}
                          title="Reply to this message"
                        >
                          <Reply size={13} />
                        </button>
                        {(hasFile || isVoiceNote) && !dmsg.isFileDeleted && !msg.isFileDeleted && (
                          <button
                            type="button"
                            className="msg-side-delete-btn always-visible"
                            onClick={() => promptDeleteFile(msgId, dmsg.fileUrl || dmsg.audioUrl || dmsg.imageUrl || dmsg.videoUrl, isVoiceNote, dmsg.fileName)}
                            title={isVoiceNote ? "Delete voice recording" : "Delete file"}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
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
                        {!isOwn ? (() => {
                          const authorProf = getUserProfile(dmsg.alias, dmsg.color, dmsg.avatar, isVerified, dmsg.bio, dmsg.status, dmsg.userId);
                          return (
                            <div
                              className="message-user-info clickable-profile"
                              onClick={() => openUserProfile(dmsg.alias, authorProf.color, authorProf.avatar, authorProf.isVerified, authorProf.bio, authorProf.status, dmsg.userId)}
                              title="Click to view profile"
                            >
                              {renderAvatar(dmsg.alias, authorProf.color, authorProf.avatar, 24)}
                              <span className="user-alias-name" style={{ color: authorProf.color || '#00f3ff' }}>
                                {dmsg.alias || 'Anonymous'}
                              </span>

                              {/* Official Twitter/Telegram-style Blue Tick */}
                              {authorProf.isVerified && (
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
                          );
                        })() : (
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

                        {/* Compact Single-Row ChatGPT-Style Web Search Badge (Deduplicated, No Tall Pills) */}
                        {(() => {
                          if (!dmsg.sources || !Array.isArray(dmsg.sources) || dmsg.sources.length === 0) return null;
                          const seen = new Set();
                          const uniqueSources = [];
                          for (const s of dmsg.sources) {
                            const d = (s.domain || '').replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '').toLowerCase().trim();
                            if (d && !seen.has(d)) {
                              seen.add(d);
                              uniqueSources.push({ ...s, domain: d });
                            }
                          }
                          if (uniqueSources.length === 0) return null;

                          return (
                            <div className="chat-sources-wrapper-rel">
                              <div
                                className="chat-compact-search-badge"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedSourcesMsgId(expandedSourcesMsgId === msgId ? null : msgId);
                                }}
                                title="Click to browse visited sites"
                              >
                                <div className="chat-sources-favicons-cluster">
                                  {uniqueSources.slice(0, 4).map((src, sIdx) => (
                                    <a
                                      key={sIdx}
                                      href={src.url || `https://${src.domain}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="source-circle-avatar clickable"
                                      title={`Visit ${src.domain}: ${src.title || src.url}`}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <img
                                        src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=64`}
                                        alt=""
                                        className="source-circle-img"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          if (e.target.nextElementSibling) {
                                            e.target.nextElementSibling.style.display = 'flex';
                                          }
                                        }}
                                      />
                                      <span className="source-fallback-letter" style={{ display: 'none' }}>
                                        {(src.domain || '?')[0].toUpperCase()}
                                      </span>
                                    </a>
                                  ))}
                                </div>
                                <span className="chat-sources-count-label">
                                  Searched {uniqueSources.length} {uniqueSources.length === 1 ? 'site' : 'sites'}
                                </span>
                                <ChevronDown
                                  size={12}
                                  className={`sources-chevron-icon ${expandedSourcesMsgId === msgId ? 'rotated' : ''}`}
                                />
                              </div>

                              {/* Expandable Dropdown Popover to Go Through All Visited Sites */}
                              {expandedSourcesMsgId === msgId && (
                                <div className="chat-sources-dropdown-popover" onClick={(e) => e.stopPropagation()}>
                                  <div className="popover-sources-header">
                                    <div className="popover-sources-title-row">
                                      <Globe size={13} className="popover-header-icon" />
                                      <span>Visited {uniqueSources.length} {uniqueSources.length === 1 ? 'Site' : 'Sites'}</span>
                                    </div>
                                    <button
                                      type="button"
                                      className="popover-sources-close-btn"
                                      onClick={() => setExpandedSourcesMsgId(null)}
                                      title="Close"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                  <div className="popover-sources-list">
                                    {uniqueSources.map((src, sIdx) => (
                                      <a
                                        key={sIdx}
                                        href={src.url || `https://${src.domain}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="popover-source-item"
                                      >
                                        <span className="source-circle-avatar mini">
                                          <img
                                            src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=64`}
                                            alt=""
                                            className="source-circle-img"
                                            onError={(e) => {
                                              e.target.style.display = 'none';
                                              if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                                            }}
                                          />
                                          <span className="source-fallback-letter" style={{ display: 'none' }}>
                                            {(src.domain || '?')[0].toUpperCase()}
                                          </span>
                                        </span>
                                        <div className="popover-source-info">
                                          <span className="popover-source-domain">{src.domain}</span>
                                          <span className="popover-source-title">{src.title || src.snippet || src.url}</span>
                                        </div>
                                        <ExternalLink size={12} className="popover-external-icon" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Message Text with Interactive Clickable URLs, Mentions, Code Blocks & Typewriter Writing */}
                        {dmsg.text && (
                          <div className="message-text-content">
                            <TypewriterMessage
                              text={dmsg.text}
                              isJames={isJames}
                              msgId={msgId}
                              animatedIdsSet={animatedMessageIds}
                              onFinishAnimation={markMessageAnimated}
                              renderFn={renderFormattedMessage}
                            />
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

                        {/* If file or voice recording was deleted, show stylish placeholder banner */}
                        {(dmsg.isFileDeleted || msg.isFileDeleted) && (
                          <div className="deleted-attachment-placeholder">
                            <Ban size={14} className="deleted-attachment-icon" />
                            <span className="deleted-attachment-text">
                              {(dmsg.deletedType === 'voice' || isVoiceNote)
                                ? (isOwn ? 'You deleted this record' : `${dmsg.alias || 'User'} deleted this record`)
                                : (isOwn ? 'You deleted this file' : `${dmsg.alias || 'User'} deleted this file`)}
                            </span>
                          </div>
                        )}

                        {/* Image Attachment */}
                        {!dmsg.isFileDeleted && !msg.isFileDeleted && isImage && (
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
                        {!dmsg.isFileDeleted && !msg.isFileDeleted && isVideo && (
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

                        {/* Voice Note Waveform Player (Zero Native Download Controls) */}
                        {!dmsg.isFileDeleted && !msg.isFileDeleted && isVoiceNote && (
                          <div className="voice-waveform-wrapper">
                            <VoiceWaveformPlayer
                              audioUrl={resolveMediaUrl(dmsg.audioUrl || dmsg.fileUrl)}
                              isOwn={isOwn}
                              onDelete={() => promptDeleteFile(msgId, dmsg.audioUrl || dmsg.fileUrl, true, dmsg.fileName)}
                            />
                          </div>
                        )}

                        {/* Audio / Song File Attachment (non-voice) */}
                        {!dmsg.isFileDeleted && !msg.isFileDeleted && isAudio && (
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
                        {!dmsg.isFileDeleted && !msg.isFileDeleted && isOtherFile && (
                          <div className="file-attachment-card">
                            <FileText size={20} color="var(--accent-cyan)" />
                            <div className="file-info-col">
                              <span className="file-title">{dmsg.fileName || 'Attachment'}</span>
                              {dmsg.fileSize && <span className="file-size-tag">{formatFileSize(dmsg.fileSize)}</span>}
                            </div>
                          </div>
                        )}

                        {/* File Action Toolbar: Download for Receivers (if unlocked) OR Sleek Lock/Unlock Toggle for Sender */}
                        {!dmsg.isFileDeleted && !msg.isFileDeleted && hasFile && (
                          <div className="file-actions-row">
                            {!isOwn ? (
                              /* For other users: show Download button ONLY if unlocked by sender. If locked (preview only), show NOTHING! */
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
                              ) : null
                            ) : (
                              /* For owner: interactive Lock/Unlock toggle switch and Delete File button */
                              <div className="file-owner-controls">
                                <button
                                  type="button"
                                  className={`file-lock-toggle-btn ${isDownloadAllowed ? 'unlocked' : 'locked'}`}
                                  onClick={() => handleToggleFileDownload(msgId, isDownloadAllowed)}
                                  title={isDownloadAllowed ? 'File is Unlocked (Click to Lock / Preview Only)' : 'File is Locked (Click to Unlock for Download)'}
                                >
                                  <span className="toggle-indicator-track">
                                    <span className="toggle-indicator-thumb">
                                      {isDownloadAllowed ? <Unlock size={10} /> : <Lock size={10} />}
                                    </span>
                                  </span>
                                  <span className="toggle-label-text">
                                    {isDownloadAllowed ? 'Unlocked' : 'Locked'}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  className="file-delete-action-btn"
                                  onClick={() => promptDeleteFile(msgId, dmsg.fileUrl || dmsg.imageUrl || dmsg.videoUrl || dmsg.audioUrl, false, dmsg.fileName)}
                                  title="Delete file attachment"
                                >
                                  <Trash2 size={11} />
                                  <span>Delete File</span>
                                </button>
                              </div>
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

          {/* In-Chat Live Dynamic Status Bubble from James */}
          {jamesStatus && (
            <div className="message-item left james-in-chat-status-bubble" id="james-live-status-card">
              <div className="message-content-wrapper">
                <div className="message-header-row left">
                  <div
                    className="message-user-info other clickable-profile"
                    onClick={() => openUserProfile('James', '#00f3ff', null, true, 'Full-stack engineer & verified community member. Always around!', 'Online', 'bot_james')}
                    title="View James's profile"
                  >
                    {renderAvatar('James', '#00f3ff', null, 24)}
                    <span className="user-alias-name" style={{ color: '#00f3ff' }}>James</span>
                    <span className="verified-blue-tick-badge" title="Verified Profile">
                      <VerifiedBlueTick size={14} />
                    </span>
                    <span className="time-stamp">Live</span>
                  </div>
                </div>

                <div className="message-body james-status-body">
                  {jamesStatus.status === 'searching' && (
                    <div className="james-live-indicator-card searching">
                      <div className="indicator-top-row">
                        <div className="indicator-icon-pulse globe">
                          <Globe size={15} className="status-spin-globe" />
                        </div>
                        <div className="indicator-text-col">
                          <span className="indicator-headline">
                            {jamesStatus.text || 'Searching the live web...'}
                          </span>
                          {jamesStatus.query && (
                            <span className="indicator-query-tag">Query: &quot;{jamesStatus.query}&quot;</span>
                          )}
                        </div>
                      </div>

                      {jamesStatus.sources && jamesStatus.sources.length > 0 && (
                        <div className="live-sources-preview-box compact">
                          <div className="chat-sources-favicons-cluster">
                            {jamesStatus.sources.slice(0, 5).map((src, sIdx) => (
                              <span key={sIdx} className="source-circle-avatar" title={src.domain}>
                                <img
                                  src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=64`}
                                  alt=""
                                  className="source-circle-img"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                                  }}
                                />
                                <span className="source-fallback-letter" style={{ display: 'none' }}>
                                  {(src.domain || '?')[0].toUpperCase()}
                                </span>
                              </span>
                            ))}
                          </div>
                          <span className="sources-preview-title">
                            Visited {jamesStatus.sources.length} {jamesStatus.sources.length === 1 ? 'site' : 'sites'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {jamesStatus.status === 'thinking' && (
                    <div className="james-live-indicator-card thinking">
                      <div className="indicator-top-row">
                        <div className="indicator-icon-pulse sparkle">
                          <Sparkles size={15} className="status-pulse-sparkle" />
                        </div>
                        <div className="indicator-text-col">
                          <span className="indicator-headline">
                            {jamesStatus.text || 'James is thinking...'}
                          </span>
                          <span className="indicator-subtext">Synthesizing information & formulating response...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {jamesStatus.status === 'typing' && (
                    <div className="james-live-indicator-card typing">
                      <div className="indicator-top-row">
                        <div className="typing-dots in-bubble">
                          <span />
                          <span />
                          <span />
                        </div>
                        <span className="typing-in-bubble-text">
                          {jamesStatus.text || 'James is drafting a response...'}
                        </span>
                      </div>
                      {jamesStatus.sources && jamesStatus.sources.length > 0 && (
                        <div className="live-sources-mini-row">
                          <span className="mini-sources-label">Sources:</span>
                          {jamesStatus.sources.slice(0, 4).map((src, sIdx) => (
                            <span key={sIdx} className="mini-source-favicon-circle" title={src.domain}>
                              <img
                                src={src.favicon || `https://www.google.com/s2/favicons?domain=${src.domain}&sz=64`}
                                alt=""
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Scroll Button */}
        {!atBottom && (
          <button className="scroll-fab" onClick={scrollToBottom}>
            <ChevronDown size={15} /> Latest Transmissions
          </button>
        )}

        {/* Dynamic Activity / Thinking / Searching / Typing Bar */}
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

          {/* Voice Recording Live Bar with Real-time Pitch & Waveform Visualizer */}
          {isRecording ? (
            <div className="voice-recording-row">
              <div className="recording-status">
                <span className="recording-dot" />
                <span>REC {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
              </div>

              {/* Dynamic Live Audio Pitch & Voice Waveform Visualizer */}
              <div className="voice-visualizer-container">
                <canvas ref={audioCanvasRef} className="voice-visualizer-canvas" />
              </div>

              <div className="voice-actions">
                <button type="button" className="icon-btn cancel-btn" onClick={cancelRecording} title="Cancel Recording">
                  <X size={16} />
                </button>
                <button type="button" className="icon-btn composer-tool-btn send-btn active record-send-btn" onClick={stopAndSendRecording} title="Send Voice Transmission">
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
                        ? 'Type encrypted transmission...'
                        : 'Type a message...'
                }
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
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
      {selectedUserProfile && (() => {
        const activeProfile = getUserProfile(
          selectedUserProfile.alias,
          selectedUserProfile.color,
          selectedUserProfile.avatar,
          selectedUserProfile.isVerified,
          selectedUserProfile.bio,
          selectedUserProfile.status,
          selectedUserProfile.userId
        ) || selectedUserProfile;
        const isOffline = activeProfile.status === 'Offline' || activeProfile.isOnline === false;
        const displayStatus = isOffline ? 'Offline' : (activeProfile.status || 'Online');
        const statusSlug = displayStatus.toLowerCase().replace(/\s+/g, '-');
        const hasRenamed = Boolean(
          selectedUserProfile.clickedAlias &&
          activeProfile.alias &&
          selectedUserProfile.clickedAlias.toLowerCase() !== activeProfile.alias.toLowerCase()
        );

        return (
          <div className="modal-overlay" onClick={() => setSelectedUserProfile(null)}>
            <div className="modal-content user-popup-modal" onClick={e => e.stopPropagation()}>
              <div className="user-popup-header">
                <button className="icon-btn popup-close" onClick={() => setSelectedUserProfile(null)}>
                  <X size={18} />
                </button>
              </div>
              <div className="user-popup-body">
                <div
                  className="user-popup-avatar-ring"
                  style={{
                    borderColor: activeProfile.color || '#00f3ff',
                    boxShadow: `0 0 16px ${activeProfile.color ? activeProfile.color + '66' : 'rgba(0, 243, 255, 0.45)'}`
                  }}
                >
                  {renderAvatar(activeProfile.alias, activeProfile.color, activeProfile.avatar, 72)}
                </div>
                <div className="user-popup-name-row">
                  <h3 className="user-popup-name" style={{ color: activeProfile.color || '#00f3ff' }}>
                    @{activeProfile.alias}
                  </h3>
                  {activeProfile.isVerified && (
                    <VerifiedBlueTick size={19} className="verified-blue-tick" />
                  )}
                </div>
                {hasRenamed && (
                  <span className="user-popup-renamed-tag" title={`Sent earlier messages as @${selectedUserProfile.clickedAlias}`}>
                    (in this message: @{selectedUserProfile.clickedAlias})
                  </span>
                )}
                <span className={`user-popup-status-badge ${statusSlug}`}>
                  <span className={`status-dot-sm ${statusSlug}`} />
                  <span>{displayStatus}</span>
                </span>
                <p className="user-popup-bio">
                  {activeProfile.bio || 'Encrypted mesh user'}
                </p>

                <div className="user-popup-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      setInput(prev => `${prev ? prev + ' ' : ''}@${activeProfile.alias} `);
                      setSelectedUserProfile(null);
                      setTimeout(() => textareaRef.current?.focus(), 50);
                    }}
                  >
                    <AtSign size={14} /> Mention @{activeProfile.alias}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      startReply(null, activeProfile, Date.now());
                      setSelectedUserProfile(null);
                    }}
                  >
                    <Reply size={14} /> Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
                <div className="form-label-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
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
                    <div className="verified-active-actions">
                      <button
                        type="button"
                        className="btn-secondary verify-different-btn"
                        onClick={startEmailVerification}
                      >
                        <Mail size={14} /> Verify Different Email
                      </button>
                      <button
                        type="button"
                        className="btn-secondary revoke-btn"
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

      {/* --- Purge / Deletion Confirmation Modal --- */}
      {deleteConfirm && (
        <div className="modal-overlay purge-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content purge-modal-card" onClick={e => e.stopPropagation()}>
            <div className="purge-modal-header">
              <div className="purge-modal-icon-badge">
                <Trash2 size={18} />
              </div>
              <div className="purge-modal-title-wrap">
                <h3 className="purge-modal-title">
                  {deleteConfirm.type === 'voice'
                    ? 'Delete Voice Transmission'
                    : 'Delete File Attachment'}
                </h3>
                <span className="purge-modal-badge">Network Action</span>
              </div>
              <button
                className="icon-btn purge-modal-close"
                onClick={() => setDeleteConfirm(null)}
                title="Cancel"
              >
                <X size={15} />
              </button>
            </div>

            <div className="purge-modal-body">
              <p className="purge-modal-desc">
                {deleteConfirm.type === 'voice'
                  ? 'Delete this live voice recording from the chat? The audio file will be shredded and a notice will indicate you deleted this record.'
                  : 'Delete this file attachment from the chat? The file will be shredded and a notice will indicate you deleted this file.'}
              </p>
              {deleteConfirm.fileName && (
                <div className="purge-file-chip">
                  <FileText size={13} />
                  <span>{deleteConfirm.fileName}</span>
                </div>
              )}
            </div>

            <div className="purge-modal-actions">
              <button
                type="button"
                className="purge-cancel-btn"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="purge-confirm-btn"
                onClick={executeDeleteConfirm}
              >
                <Trash2 size={14} />
                <span>
                  {deleteConfirm.type === 'voice' ? 'Delete Record' : 'Delete File'}
                </span>
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

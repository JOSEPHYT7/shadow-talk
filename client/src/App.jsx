import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import './App.css';
import CryptoJS from 'crypto-js';

const SOCKET_URL = 'http://localhost:5000';
const UPLOAD_URL = 'http://localhost:5000/upload';

const HACKER_ALIASES = [
  'ShadowFox', 'NeonSpectre', 'ByteGhost', 'ZeroTrace', 'CipherWolf',
  'NightRoot', 'HexPhantom', 'PulseVapor', 'GlitchWarden', 'Darkline',
  'GhostShell', 'BitShade', 'NullSpecter', 'RootWisp', 'EchoCipher'
];
const HACKER_COLORS = [
  '#39ff14', '#0ff', '#ff00ea', '#00eaff', '#ff39c2', '#fffb00', '#ff5e00', '#00ffb3', '#b300ff', '#ff003c'
];

const REACTION_EMOJIS = ['👍', '😂', '🔥', '😮', '👀'];
const NOTIF_SOUND_URL = 'https://cdn.jsdelivr.net/gh/naptha/talkify-tts/demo/notification.mp3';

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getOrCreateIdentity() {
  let identity = localStorage.getItem('bbx_identity');
  if (identity) return JSON.parse(identity);
  const alias = HACKER_ALIASES[Math.floor(Math.random() * HACKER_ALIASES.length)] + Math.floor(Math.random()*1000);
  const color = HACKER_COLORS[Math.floor(Math.random() * HACKER_COLORS.length)];
  identity = { alias, color };
  localStorage.setItem('bbx_identity', JSON.stringify(identity));
  return identity;
}

function getAvatar(alias, color) {
  const initials = (alias || '?').slice(0, 2).toUpperCase();
  return (
    <span
      className="chat-avatar"
      style={{ background: color || '#222', color: '#101014', borderColor: color || '#0ff' }}
      title={alias}
    >
      {initials}
    </span>
  );
}

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [identity] = useState(getOrCreateIdentity());
  const [passphrase, setPassphrase] = useState(localStorage.getItem('bbx_passphrase') || '');
  const [typingUsers, setTypingUsers] = useState([]);
  const [windowFocused, setWindowFocused] = useState(true);
  const [atBottom, setAtBottom] = useState(true);
  const resizerRef = useRef(null);

  // Encrypt message if passphrase is set
  function encryptMsg(obj) {
    if (!passphrase) return obj;
    const payload = JSON.stringify(obj);
    return { encrypted: CryptoJS.AES.encrypt(payload, passphrase).toString() };
  }
  // Decrypt message if passphrase is set
  function decryptMsg(msg) {
    if (!msg.encrypted) return msg;
    try {
      const bytes = CryptoJS.AES.decrypt(msg.encrypted, passphrase);
      const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      // Merge outer fields (id, timestamp, reactions) for display
      return { ...decrypted, id: msg.id, timestamp: msg.timestamp, reactions: msg.reactions };
    } catch {
      return { text: '[Encrypted]', alias: msg.alias, color: msg.color, timestamp: msg.timestamp };
    }
  }

  useEffect(() => {
    localStorage.setItem('bbx_passphrase', passphrase);
  }, [passphrase]);

  useEffect(() => {
    const onFocus = () => setWindowFocused(true);
    const onBlur = () => setWindowFocused(false);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Notification sound
  function playNotifSound() {
    const audio = new window.Audio(NOTIF_SOUND_URL);
    audio.volume = 0.25;
    audio.play();
  }

  // Browser notification
  function showBrowserNotif(msg) {
    if (Notification.permission === 'granted') {
      const body = msg.text ? msg.text : (msg.imageUrl ? '[Image]' : 'New message');
      new Notification(`${msg.alias || 'Anonymous'}:`, { body });
    }
  }

  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    socketRef.current.on('init', (msgs) => setMessages(msgs));
    socketRef.current.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      const dmsg = decryptMsg(msg);
      if (dmsg.alias !== identity.alias) {
        if (!windowFocused) playNotifSound();
        if (!windowFocused) showBrowserNotif(dmsg);
      }
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
      }, 2000);
    });
    return () => socketRef.current.disconnect();
  }, []);

  useEffect(() => {
    const messagesDiv = messagesEndRef.current?.parentNode;
    if (!messagesDiv) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messagesDiv;
      setAtBottom(scrollHeight - scrollTop - clientHeight < 40);
    };
    messagesDiv.addEventListener('scroll', handleScroll);
    return () => messagesDiv.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const messagesDiv = messagesEndRef.current?.parentNode;
    if (!messagesDiv) return;
    if (atBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, atBottom]);

  useEffect(() => {
    const resizer = resizerRef.current;
    if (!resizer) return;
    let startY = 0;
    let startHeight = 0;
    let dragging = false;
    const minHeight = 200;
    const maxHeight = 700;
    function onMouseDown(e) {
      dragging = true;
      startY = e.clientY;
      startHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--chat-height') || 400, 10);
      document.body.style.userSelect = 'none';
    }
    function onMouseMove(e) {
      if (!dragging) return;
      let newHeight = startHeight + (e.clientY - startY);
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
      document.documentElement.style.setProperty('--chat-height', `${newHeight}px`);
    }
    function onMouseUp() {
      dragging = false;
      document.body.style.userSelect = '';
    }
    resizer.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      resizer.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (input.trim()) {
      socketRef.current.emit('message', encryptMsg({ text: input, alias: identity.alias, color: identity.color }));
      setInput('');
    } else if (image) {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', image);
      try {
        const res = await fetch(UPLOAD_URL, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.imageUrl) {
          socketRef.current.emit('image', encryptMsg({ imageUrl: data.imageUrl, alias: identity.alias, color: identity.color }));
        }
      } catch (err) {
        alert('Image upload failed');
      }
      setImage(null);
      setUploading(false);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
      setInput('');
    }
  };

  const handleReaction = (messageId, emoji) => {
    socketRef.current.emit('reaction', { messageId, emoji, alias: identity.alias });
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    socketRef.current.emit('typing', { alias: identity.alias });
  };

  const CameraIcon = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M5 7l1.5-3h11L19 7"/></svg>
  );
  const SendIcon = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
  );

  return (
    <div className="chat-root">
      <h1 className="chat-title">ShadowTalk</h1>
      <div className="chat-passphrase-row">
        <input
          className="chat-passphrase-input"
          type="password"
          value={passphrase}
          onChange={e => setPassphrase(e.target.value)}
          placeholder="Encryption passphrase (optional)"
          autoComplete="off"
        />
      </div>
      <div className="chat-messages" style={{ height: 'var(--chat-height, 340px)', maxHeight: 'var(--chat-height, 340px)' }}>
        {messages.map((msg, idx) => {
          const dmsg = decryptMsg(msg);
          return (
            <div key={idx} className="chat-message">
              <div className="chat-message-header">
                {getAvatar(dmsg.alias, dmsg.color)}
                <span className="chat-alias" style={{ color: dmsg.color || '#0ff' }}>{dmsg.alias || 'Anonymous'}</span>
                <span className="chat-meta">{formatTime(dmsg.timestamp)}</span>
              </div>
              <div className="chat-message-content">
                {dmsg.text && <span>{dmsg.text}</span>}
                {dmsg.imageUrl && (
                  <img
                    src={SOCKET_URL + dmsg.imageUrl}
                    alt="chat-img"
                    className="chat-image"
                  />
                )}
              </div>
              <div className="chat-reactions">
                {REACTION_EMOJIS.map(emoji => {
                  const count = (msg.reactions && msg.reactions[emoji]) ? msg.reactions[emoji].length : 0;
                  const reacted = msg.reactions && msg.reactions[emoji] && msg.reactions[emoji].includes(identity.alias);
                  return (
                    <button
                      key={emoji}
                      className={`chat-reaction-btn${reacted ? ' reacted' : ''}`}
                      onClick={() => handleReaction(msg.id, emoji)}
                      type="button"
                    >
                      {emoji} {count > 0 ? count : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-resizer" ref={resizerRef} title="Drag to resize chat" />
      {!atBottom && (
        <button className="chat-scroll-bottom-btn" onClick={scrollToBottom}>
          ↓ Scroll to latest
        </button>
      )}
      {typingUsers.length > 0 && (
        <div className="chat-typing-indicator">
          {typingUsers.map((a, i) => (
            <span key={a} style={{ color: '#0ff', marginRight: 8 }}>{a}{i < typingUsers.length - 1 ? ',' : ''}</span>
          ))}
          <span style={{ color: '#39ff14' }}>is typing...</span>
        </div>
      )}
      <form className="chat-input-row" onSubmit={sendMessage}>
        <input
          className="chat-input"
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          autoFocus
          disabled={uploading}
        />
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          id="image-upload"
          onChange={handleImageChange}
          disabled={uploading}
        />
        <label htmlFor="image-upload" className="chat-img-btn" tabIndex={0} aria-label="Upload image">
          <CameraIcon />
        </label>
        <button className="chat-send-btn" type="submit" disabled={uploading} aria-label="Send message">
          <SendIcon />
        </button>
      </form>
      </div>
  );
}

export default App;

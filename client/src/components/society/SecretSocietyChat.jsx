import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Shield,
  Lock,
  Terminal,
  Send,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Radio,
  Activity,
  Award,
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
  Image as ImageIcon
} from 'lucide-react';
import { VerifiedBlueTick } from '../../App';
import './SecretSocietyChat.css';

const QUICK_REACTIONS = ['👍', '🔥', '💡', '🛡️'];

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

export default function SecretSocietyChat({
  user,
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
  const [replyingTo, setReplyingTo] = useState(null);
  const [activeReactionPickerId, setActiveReactionPickerId] = useState(null);

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
  const userAlias = user?.alias || (isAdmin ? 'Administrator' : 'Inducted Member');

  const [clearanceLevel, setClearanceLevel] = useState(
    isAdmin ? 'LEVEL-0 ROOT // OVERSEER' : (user?.clearance || 'LEVEL-4 INDUCTED')
  );
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, jamesStatus]);

  // Join the secret society room upon mounting with stable socket lifecycle
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

    const handleReactionUpdate = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
      );
    };

    // Re-join on socket reconnection (network blip or restart)
    const handleReconnect = () => {
      socket.emit('joinSocietyRoom', joinData);
    };

    socket.on('societyRoomJoined', handleRoomJoined);
    socket.on('societyHistory', handleHistory);
    socket.on('societyMessage', handleMessage);
    socket.on('societyJamesStatus', handleJamesStatus);
    socket.on('societyMemberCount', handleMemberCount);
    socket.on('societyMessageReaction', handleReactionUpdate);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('societyRoomJoined', handleRoomJoined);
      socket.off('societyHistory', handleHistory);
      socket.off('societyMessage', handleMessage);
      socket.off('societyJamesStatus', handleJamesStatus);
      socket.off('societyMemberCount', handleMemberCount);
      socket.off('societyMessageReaction', handleReactionUpdate);
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
  };

  const removeSelectedFile = () => {
    setAttachedFile(null);
    setFilePreview(null);
  };

  // Download File Attachment
  const handleDownloadFile = async (fileUrl, fileName) => {
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
  };

  // Send Message (Text / File)
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (uploading) return;
    if (!input.trim() && !attachedFile) return;

    setUploading(true);

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
      color: isAdmin ? '#fbbf24' : '#10b981',
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

  const handleQuickCommand = (cmd) => {
    setInput(cmd + ' ');
    inputRef.current?.focus();
  };

  return (
    <div className="society-chat-viewport">
      {/* Ambient Matrix & Gold Glow Layers */}
      <div className="society-matrix-ambient" />
      <div className="society-vignette-layer" />

      {/* --- Enclave Header Bar (Clean, Compact, matching Normal Chat) --- */}
      <header className="society-chat-header">
        <div className="society-header-brand">
          <div className="society-brand-seal">
            <span>Ω</span>
          </div>
          <div className="society-brand-title">
            <span className="society-title-text">SOVEREIGN ENCLAVE</span>
            <span className="society-freq-pill">FREQ: 0xDEADBEEF</span>
          </div>
          {/* Live Online Count Badge */}
          <div className="society-online-chip" title="Live Inducted Members in Chamber">
            <span className="society-online-dot" />
            <span>{memberCount} {memberCount === 1 ? 'MEMBER' : 'MEMBERS'} LIVE</span>
          </div>
        </div>

        <div className="society-header-actions">
          {/* Member Identity Tag */}
          <div className="society-user-chip">
            <span className="society-user-dot" />
            <span className="society-user-name">@{userAlias}</span>
            <VerifiedBlueTick size={13} className="society-verified-tick" />
            <span className="society-user-clearance">{clearanceLevel}</span>
          </div>

          {isAdmin && onReturnToAdmin && (
            <button
              type="button"
              className="society-header-btn admin-btn"
              onClick={onReturnToAdmin}
              title="Return to Root Administrative Mainframe"
            >
              <Terminal size={14} />
              <span>← Admin Panel</span>
            </button>
          )}

          {onExitSociety && (
            <button
              type="button"
              className="society-header-btn exit-btn"
              onClick={onExitSociety}
              title="Disconnect from Enclave Frequency"
            >
              <ArrowLeft size={14} />
              <span>Exit Enclave</span>
            </button>
          )}
        </div>
      </header>

      {/* --- Main Classified Transmissions Stream --- */}
      <main className="society-chat-feed">
        {messages.length === 0 ? (
          <div className="society-empty-state">
            <div className="society-empty-seal">Ω</div>
            <div className="society-empty-title">ENCLAVE SECURE CHANNEL READY</div>
            <p>Channel quiet. Transmit the first encrypted thought to inducted members or consult James Autonomous Intelligence.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isJames = m.userId === 'bot_james_society' || m.alias?.includes('James');
            const isMe = (userAlias && m.alias && m.alias.toLowerCase() === userAlias.toLowerCase()) ||
                         (isAdmin && m.alias === 'Administrator');

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

            return (
              <div
                key={m.id}
                className={`society-msg-wrapper ${isJames ? 'james-society-msg' : ''} ${isMe ? 'my-society-msg' : 'other-society-msg'}`}
              >
                {/* Avatar */}
                <div className="society-msg-avatar">
                  {isJames ? (
                    <div className="avatar-seal-james" title="James Autonomous Intelligence">
                      <Sparkles size={16} color="#ffd700" />
                    </div>
                  ) : (
                    <div
                      className="avatar-seal-member"
                      style={{ borderColor: isMe ? '#ffd700' : (m.color || '#10b981') }}
                      title={`@${m.alias}`}
                    >
                      <span>{m.alias?.slice(0, 2).toUpperCase() || 'MB'}</span>
                    </div>
                  )}
                </div>

                {/* Message Bubble Column */}
                <div className="society-msg-bubble-col">
                  {/* Meta Row: Author, Verified Badge, Clearance, Time */}
                  <div className="society-msg-meta">
                    <span
                      className="msg-alias"
                      style={{ color: isJames ? '#ffd700' : (isMe ? '#ffd700' : '#10b981') }}
                    >
                      @{m.alias}
                    </span>
                    {!isJames && (
                      <span className="society-verified-inline" title="Verified Sovereign Member">
                        <VerifiedBlueTick size={13} />
                      </span>
                    )}
                    {m.clearance && (
                      <span className={`msg-clearance-tag ${isJames ? 'gold' : ''}`}>
                        {m.clearance}
                      </span>
                    )}
                    <span className="msg-timestamp">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Quoted Reply Banner */}
                  {m.replyTo && (
                    <div className="society-reply-quote">
                      <CornerDownLeft size={11} className="quote-icon" />
                      <span className="quote-author">@{m.replyTo.alias}:</span>
                      <span className="quote-text">{m.replyTo.text || '[Attachment]'}</span>
                    </div>
                  )}

                  {/* Message Bubble Body */}
                  <div className="society-msg-bubble">
                    {m.text && <div className="society-msg-text">{m.text}</div>}

                    {/* Image Attachment */}
                    {isImage && (
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
                    {isVideo && (
                      <div className="society-media-wrap">
                        <video
                          controls
                          src={resolveMediaUrl(m.videoUrl || m.fileUrl, serverUrl)}
                          className="society-msg-video"
                        />
                      </div>
                    )}

                    {/* Voice Note Waveform Player */}
                    {isVoiceNote && (
                      <EnclaveVoiceWaveformPlayer
                        audioUrl={resolveMediaUrl(m.audioUrl || m.fileUrl, serverUrl)}
                        isOwn={isMe}
                        durationSec={m.voiceDuration}
                      />
                    )}

                    {/* Audio / Song File Attachment (non-voice) */}
                    {isAudio && (
                      <div className="society-audio-wrap">
                        <audio
                          controls
                          src={resolveMediaUrl(m.audioUrl || m.fileUrl, serverUrl)}
                          className="society-msg-audio"
                        />
                      </div>
                    )}

                    {/* Document / Other File Attachment */}
                    {isOtherFile && (
                      <div className="society-file-card">
                        <FileText size={20} color="#ffd700" />
                        <div className="society-file-info">
                          <span className="society-file-name">{m.fileName || 'Encrypted File'}</span>
                          {m.fileSize && <span className="society-file-size">{formatFileSize(m.fileSize)}</span>}
                        </div>
                        <button
                          type="button"
                          className="society-file-download-btn"
                          onClick={() => handleDownloadFile(m.fileUrl, m.fileName)}
                          title="Download file"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    )}

                    {/* Quick Reaction Hover Action */}
                    <div className="society-bubble-actions">
                      <button
                        type="button"
                        className="btn-bubble-react"
                        onClick={() => setActiveReactionPickerId(activeReactionPickerId === m.id ? null : m.id)}
                        title="Add reaction"
                      >
                        <Smile size={12} />
                      </button>
                      <button
                        type="button"
                        className="btn-bubble-reply"
                        onClick={() => {
                          setReplyingTo(m);
                          inputRef.current?.focus();
                        }}
                        title="Reply to transmission"
                      >
                        <CornerDownLeft size={12} />
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
                            className={`reaction-chip ${hasMyReaction ? 'active' : ''}`}
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

        {/* James Typing Indicator */}
        {jamesStatus && (
          <div className="society-james-typing-row">
            <Sparkles size={14} className="gold-pulse" />
            <span>{jamesStatus.text || 'James is consulting Enclave Black Archives...'}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* --- Bottom Composer (Matching Normal Chat) --- */}
      <footer className="society-chat-footer">
        {/* Reply Preview Bar */}
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

        {/* File Attachment Chip Preview */}
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

        {/* Quick Command Suggestions */}
        <div className="society-command-pills">
          <button type="button" onClick={() => handleQuickCommand('/secrets')}>
            <Lock size={11} />
            <span>/secrets</span>
          </button>
          <button type="button" onClick={() => handleQuickCommand('/planetary-plan')}>
            <Activity size={11} />
            <span>/planetary-plan</span>
          </button>
          <button type="button" onClick={() => handleQuickCommand('/debate Ethical AI vs Human Sovereignty')}>
            <Award size={11} />
            <span>/debate</span>
          </button>
          <button type="button" onClick={() => handleQuickCommand('/intel Planetary Microgrids')}>
            <Radio size={11} />
            <span>/intel</span>
          </button>
        </div>

        {/* Voice Recording Live Bar OR Standard Input Composer */}
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
          <form className="society-composer-row" onSubmit={handleSendMessage}>
            <input
              ref={inputRef}
              type="text"
              className="society-input-field"
              placeholder={
                replyingTo
                  ? `Reply to @${replyingTo.alias}...`
                  : attachedFile
                  ? 'Add caption and transmit file...'
                  : 'Transmit encrypted thought to Enclave members or issue command (e.g. /secrets)...'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={uploading}
            />

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
                className={`society-send-btn ${input.trim() || attachedFile ? 'active' : ''}`}
                disabled={uploading || (!input.trim() && !attachedFile)}
                title={uploading ? 'Transmitting...' : 'Transmit'}
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
    </div>
  );
}

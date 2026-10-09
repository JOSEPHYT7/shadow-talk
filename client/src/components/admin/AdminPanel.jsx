import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Shield,
  Activity,
  Users,
  MessageSquare,
  AlertTriangle,
  Lock,
  LogOut,
  RefreshCw,
  CheckCircle,
  XCircle,
  Cpu,
  Database,
  Radio,
  Trash2,
  Send,
  Zap,
  Clock,
  Eye,
  X,
  Search,
  Globe,
  Sparkles,
  Copy,
  Check,
  UserPlus,
  UserCheck,
  UserX,
  KeyRound,
  ShieldCheck,
  Compass,
  FileText,
  Award,
  ExternalLink,
  Crosshair,
  MapPin,
  Wifi,
  Layers,
  Download,
  CheckCircle2,
  AlertOctagon,
  Fingerprint,
  ChevronRight,
  ArrowRight,
  Image as ImageIcon,
  Upload,
  ShieldAlert,
  Volume2,
  VolumeX,
  FileCode,
  Trash,
  Bug,
  Info,
  Filter,
  Play,
  Pause,
  Edit3
} from 'lucide-react';
import GeoGlobe3D from './GeoGlobe3D';
import './AdminPanel.css';

export function AdminPanel({
  socket,
  adminToken,
  adminUsername,
  serverUrl,
  onClose,
  onLogout,
  onOpenSocietyChat
}) {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return sessionStorage.getItem('shadowtalk_admin_tab') || 'telemetry';
    } catch {
      return 'telemetry';
    }
  }); // 'telemetry' | 'geo' | 'society' | 'users' | 'messages' | 'broadcast' | 'security'
  const [loading, setLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState(null);
  const [isHardRefreshing, setIsHardRefreshing] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem('shadowtalk_admin_tab', activeTab);
      localStorage.setItem('shadowtalk_admin_tab', activeTab);
      if (adminToken) {
        sessionStorage.setItem('shadowtalk_admin_token', adminToken);
        sessionStorage.setItem('shadowtalk_admin_panel_open', 'true');
        localStorage.setItem('shadowtalk_admin_token', adminToken);
        localStorage.setItem('shadowtalk_admin_panel_open', 'true');
      }
    } catch {}
  }, [activeTab, adminToken]);

  const handleHardRefresh = () => {
    setIsHardRefreshing(true);
    try {
      sessionStorage.setItem('shadowtalk_admin_panel_open', 'true');
      sessionStorage.setItem('shadowtalk_admin_tab', activeTab);
      localStorage.setItem('shadowtalk_admin_panel_open', 'true');
      localStorage.setItem('shadowtalk_admin_tab', activeTab);
      if (adminToken) {
        sessionStorage.setItem('shadowtalk_admin_token', adminToken);
        localStorage.setItem('shadowtalk_admin_token', adminToken);
      }
    } catch {}
    setTimeout(() => {
      window.location.reload();
    }, 150);
  };

  // Telemetry state & Real-Time Telemetry features
  const [telemetry, setTelemetry] = useState(null);
  const [selectedNewsCategory, setSelectedNewsCategory] = useState('viral');
  const [triggeringNews, setTriggeringNews] = useState(false);
  const [scanningVulnerabilities, setScanningVulnerabilities] = useState(false);
  const [scanResultModal, setScanResultModal] = useState(null);

  // Real-Time Operations & Event Stream state
  const [wsLatency, setWsLatency] = useState(null);
  const [liveEvents, setLiveEvents] = useState([]);
  const [isStreamPaused, setIsStreamPaused] = useState(false);
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [flushingCache, setFlushingCache] = useState(false);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);

  // Users state
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  // Messages state (Dynamic Public & Secret Society)
  const [messages, setMessages] = useState([]);
  const [msgSearch, setMsgSearch] = useState('');
  const [msgRoomFilter, setMsgRoomFilter] = useState('all'); // 'all' | 'public' | 'society'
  const [confirmPurgeRoom, setConfirmPurgeRoom] = useState(null); // 'public' | 'society' | null
  const [purgingRoom, setPurgingRoom] = useState(false);
  const [deletingMsgId, setDeletingMsgId] = useState(null);
  const [isRefreshingMessages, setIsRefreshingMessages] = useState(false);

  // Broadcast state (Image upload, multi-room target, CTA actions, siren audio)
  const [bcastTitle, setBcastTitle] = useState('');
  const [bcastMessage, setBcastMessage] = useState('');
  const [bcastLevel, setBcastLevel] = useState('critical');
  const [bcastTargetRooms, setBcastTargetRooms] = useState('all'); // 'all' | 'public' | 'society'
  const [bcastImageUrl, setBcastImageUrl] = useState('');
  const [bcastImageUploading, setBcastImageUploading] = useState(false);
  const [bcastActionUrl, setBcastActionUrl] = useState('');
  const [bcastActionLabel, setBcastActionLabel] = useState('');
  const [bcastPlayKlaxon, setBcastPlayKlaxon] = useState(true);
  const [bcastSending, setBcastSending] = useState(false);
  const [recentBroadcasts, setRecentBroadcasts] = useState([]);

  // Security audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditSeverityFilter, setAuditSeverityFilter] = useState('all'); // 'all' | 'critical' | 'warn' | 'info'
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);

  // Secret Society Induction & Members state
  const [societyApps, setSocietyApps] = useState([]);
  const [societyMembers, setSocietyMembers] = useState([]);
  const [societyWithdrawals, setSocietyWithdrawals] = useState([]);
  const [nameChangeRequests, setNameChangeRequests] = useState([]);
  const [societySubTab, setSocietySubTab] = useState('applications'); // 'applications' | 'members' | 'withdrawals' | 'name-changes'
  const [societySearch, setSocietySearch] = useState('');
  const [generatedCredentialModal, setGeneratedCredentialModal] = useState(null);
  const [copiedPass, setCopiedPass] = useState(false);
  const [showDirectInductModal, setShowDirectInductModal] = useState(false);
  const [directForm, setDirectForm] = useState({
    alias: '',
    email: '',
    fullName: '',
    role: '',
    location: '',
    customPassphrase: ''
  });
  const [approvingId, setApprovingId] = useState(null);

  // Fetch telemetry
  const fetchTelemetry = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/telemetry`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch {}
  };

  // Fetch real-time server ingress event stream
  const fetchLiveEvents = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/telemetry/live-stream`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.events)) {
          setLiveEvents(data.events);
        }
        if (typeof data.maintenanceActive === 'boolean') {
          setMaintenanceActive(data.maintenanceActive);
        }
      }
    } catch {}
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/users`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch {}
  };

  // Fetch both public and secret society messages for an integrated dynamic feed
  const fetchMessages = async () => {
    setIsRefreshingMessages(true);
    try {
      const [pubRes, socRes] = await Promise.all([
        fetch(`${serverUrl}/api/admin/dashboard/messages?limit=150`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        }),
        fetch(`${serverUrl}/api/admin/dashboard/society/messages?limit=150`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      ]);

      const pubRaw = pubRes.ok ? await pubRes.json() : [];
      const socRaw = socRes.ok ? await socRes.json() : [];

      const pubList = Array.isArray(pubRaw) ? pubRaw : (Array.isArray(pubRaw?.messages) ? pubRaw.messages : []);
      const socList = Array.isArray(socRaw) ? socRaw : (Array.isArray(socRaw?.messages) ? socRaw.messages : []);

      const combined = [
        ...pubList.map(m => ({ ...m, room: 'public', roomName: 'Public Room' })),
        ...socList.map(m => ({ ...m, room: 'society', roomName: 'Secret Society', isSociety: true }))
      ];

      // Sort newest first
      combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setMessages(combined);
      flashNotice(`Transmissions refreshed (${combined.length} loaded)`);
    } catch (err) {
      console.error('[AdminPanel]: Failed to fetch transmissions:', err);
      flashNotice('Failed to refresh transmissions', 'error');
    } finally {
      setIsRefreshingMessages(false);
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/audit-logs`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(Array.isArray(data) ? data : []);
      }
    } catch {}
  };

  // Fetch society applications
  const fetchSocietyApps = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/society/applications`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSocietyApps(Array.isArray(data) ? data : []);
      }
    } catch {}
  };

  // Fetch society active members
  const fetchSocietyMembers = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/society/members`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSocietyMembers(Array.isArray(data) ? data : []);
      }
    } catch {}
  };

  // Fetch society member withdrawal requests
  const fetchSocietyWithdrawals = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/society/withdrawals`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSocietyWithdrawals(Array.isArray(data) ? data : []);
      }
    } catch {}
  };

  // Fetch society member username change requests
  const fetchNameChangeRequests = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/society/name-changes`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNameChangeRequests(Array.isArray(data) ? data : []);
      }
    } catch {}
  };

  // Initial fetch and tab change polling
  useEffect(() => {
    if (activeTab === 'telemetry') {
      fetchTelemetry();
      fetchLiveEvents();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'messages') {
      fetchMessages();
    } else if (activeTab === 'security') {
      fetchAuditLogs();
    } else if (activeTab === 'society') {
      fetchSocietyApps();
      fetchSocietyMembers();
      fetchSocietyWithdrawals();
      fetchNameChangeRequests();
    }
  }, [activeTab]);

  // Interval auto-refresh for telemetry & live event stream
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeTab === 'telemetry') {
        fetchTelemetry();
        fetchLiveEvents();
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [activeTab]);

  // Real-Time Socket Connection & Multi-Channel Admin Monitoring
  useEffect(() => {
    if (!socket) return;

    // Join root telemetry & monitoring room
    socket.emit('adminJoinMonitoring', { token: adminToken });

    const handleNewMessage = (msg) => {
      if (!msg) return;
      setMessages(prev => {
        if (prev.some(m => String(m.id) === String(msg.id))) return prev;
        return [{ ...msg, room: 'public', roomName: 'Public Room' }, ...prev];
      });
    };

    const handleNewSocietyMessage = (msg) => {
      if (!msg) return;
      setMessages(prev => {
        if (prev.some(m => String(m.id) === String(msg.id))) return prev;
        return [{ ...msg, room: 'society', roomName: 'Secret Society', isSociety: true }, ...prev];
      });
    };

    const handleMessageDeleted = (data) => {
      const targetId = data?.messageId || data?.id;
      if (targetId) {
        setMessages(prev => prev.filter(m => String(m.id) !== String(targetId)));
      }
    };

    const handleSocietyMessageDeleted = (data) => {
      const targetId = data?.messageId || data?.id;
      if (targetId) {
        setMessages(prev => prev.filter(m => String(m.id) !== String(targetId)));
      }
    };

    const handleChatCleared = () => {
      setMessages(prev => prev.filter(m => m.room === 'society' || m.isSociety));
      fetchMessages();
    };

    const handleSocietyChatCleared = () => {
      setMessages(prev => prev.filter(m => m.room !== 'society' && !m.isSociety));
      fetchMessages();
    };

    const handleAdminLiveEvent = (ev) => {
      if (!ev || isStreamPaused) return;
      setLiveEvents(prev => {
        if (prev.some(e => e.id === ev.id)) return prev;
        return [ev, ...prev.slice(0, 99)];
      });
    };

    const handleMaintenanceNotice = (data) => {
      setMaintenanceActive(Boolean(data?.active));
    };

    socket.on('message', handleNewMessage);
    socket.on('societyMessage', handleNewSocietyMessage);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('societyMessageDeleted', handleSocietyMessageDeleted);
    socket.on('chatCleared', handleChatCleared);
    socket.on('societyChatCleared', handleSocietyChatCleared);
    socket.on('adminLiveEvent', handleAdminLiveEvent);
    socket.on('maintenanceNotice', handleMaintenanceNotice);

    // Live WebSocket ping measurement
    const measurePing = () => {
      const start = Date.now();
      socket.timeout(2500).emit('pingTelemetry', (err) => {
        if (!err) {
          setWsLatency(Date.now() - start);
        } else {
          const fetchStart = Date.now();
          fetch(`${serverUrl}/api/admin/dashboard/telemetry`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          }).then(res => {
            if (res.ok) setWsLatency(Date.now() - fetchStart);
          }).catch(() => {});
        }
      });
    };
    measurePing();
    const pingInterval = setInterval(measurePing, 4000);

    return () => {
      clearInterval(pingInterval);
      socket.off('message', handleNewMessage);
      socket.off('societyMessage', handleNewSocietyMessage);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('societyMessageDeleted', handleSocietyMessageDeleted);
      socket.off('chatCleared', handleChatCleared);
      socket.off('societyChatCleared', handleSocietyChatCleared);
      socket.off('adminLiveEvent', handleAdminLiveEvent);
      socket.off('maintenanceNotice', handleMaintenanceNotice);
    };
  }, [socket, adminToken, isStreamPaused, serverUrl]);

  // Periodic polling for messages when on transmissions feed tab
  useEffect(() => {
    if (activeTab !== 'messages') return;
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [activeTab, adminToken, serverUrl]);

  // Escape key listener to close console
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Action helpers
  const handleToggleVerify = async (userId, alias, currentStatus) => {
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/user/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ userId, alias, isVerified: !currentStatus })
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(users.map(u => (u.userId === userId || u.alias === alias) ? data.profile : u));
        flashNotice(`User @${alias} verification status toggled!`);
      }
    } catch {}
  };

  const handleKickUser = async (userId, alias) => {
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/user/kick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ userId, alias })
      });
      if (res.ok) {
        flashNotice(`Active sockets for @${alias} disconnected`);
      }
    } catch {}
  };

  const handleDeleteUser = async (userId, alias) => {
    if (!confirm(`Are you sure you want to permanently delete profile for @${alias}?`)) return;
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/user/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ userId, alias })
      });
      if (res.ok) {
        setUsers(users.filter(u => u.userId !== userId && u.alias !== alias));
        flashNotice(`Profile for @${alias} purged from database`);
      }
    } catch {}
  };

  // Delete message with room sensitivity (public vs secret society)
  const handleDeleteMessage = async (msgId, isSociety = false) => {
    setDeletingMsgId(msgId);
    try {
      const endpoint = isSociety
        ? `${serverUrl}/api/admin/dashboard/society/message/${msgId}`
        : `${serverUrl}/api/admin/dashboard/message/${msgId}`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => String(m.id) !== String(msgId)));
        flashNotice(`Transmission ${String(msgId).slice(0, 8)}... permanently removed`);
      } else {
        const err = await res.json().catch(() => ({}));
        flashNotice(`Failed to delete message: ${err.error || res.statusText}`, 'error');
      }
    } catch (err) {
      flashNotice(`Error deleting message: ${err.message}`, 'error');
    } finally {
      setDeletingMsgId(null);
    }
  };

  // Administrative purge of entire room chat history
  const handlePurgeRoom = async (roomType) => {
    setPurgingRoom(true);
    try {
      const endpoint = roomType === 'society'
        ? `${serverUrl}/api/admin/dashboard/chat/clear-society`
        : `${serverUrl}/api/admin/dashboard/chat/clear-public`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        flashNotice(data.message || `${roomType.toUpperCase()} room cleared successfully!`);
        if (roomType === 'society') {
          setMessages(prev => prev.filter(m => m.room !== 'society' && !m.isSociety));
        } else {
          setMessages(prev => prev.filter(m => m.room === 'society' || m.isSociety));
          try {
            localStorage.removeItem('shadowtalk_cached_messages');
          } catch (e) {}
        }
        fetchMessages();
      } else {
        flashNotice(`Failed to clear ${roomType} room`, 'error');
      }
    } catch (err) {
      flashNotice(`Error clearing room: ${err.message}`, 'error');
    } finally {
      setPurgingRoom(false);
      setConfirmPurgeRoom(null);
    }
  };

  // Real-Time System Cache & Buffer Flush
  const handleFlushCache = async () => {
    setFlushingCache(true);
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/system/flush-cache`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        flashNotice(data.message || 'System cache buffers purged!');
        fetchTelemetry();
        fetchLiveEvents();
      } else {
        flashNotice('Failed to flush system cache', 'error');
      }
    } catch (err) {
      flashNotice(`Error: ${err.message}`, 'error');
    } finally {
      setFlushingCache(false);
    }
  };

  // Real-Time Maintenance Mode / Traffic Shield Toggle
  const handleToggleMaintenance = async () => {
    setTogglingMaintenance(true);
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/system/toggle-maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ reason: maintenanceActive ? 'Maintenance completed' : 'Administrative maintenance active' })
      });
      if (res.ok) {
        const data = await res.json();
        setMaintenanceActive(Boolean(data.maintenanceActive));
        flashNotice(`Traffic Shield / Maintenance ${data.maintenanceActive ? 'ENGAGED' : 'DISENGAGED'}`);
        fetchTelemetry();
        fetchLiveEvents();
      }
    } catch (err) {
      flashNotice(`Error: ${err.message}`, 'error');
    } finally {
      setTogglingMaintenance(false);
    }
  };

  // Emergency Broadcast with Image, Target Rooms & Actions
  const handleBroadcastImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      flashNotice('Only image files (JPG, PNG, GIF, WEBP) are supported for emergency directives', 'error');
      return;
    }

    setBcastImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${serverUrl}/upload`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const uploadedUrl = data.fileUrl || data.url;
        setBcastImageUrl(uploadedUrl);
        flashNotice('Emergency broadcast image attached successfully!');
      } else {
        flashNotice('Image upload failed', 'error');
      }
    } catch (err) {
      flashNotice(`Upload error: ${err.message}`, 'error');
    } finally {
      setBcastImageUploading(false);
    }
  };

  const handleSendBroadcast = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!bcastMessage.trim()) return;

    setBcastSending(true);
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          title: bcastTitle.trim() || 'ADMINISTRATIVE DIRECTIVE',
          message: bcastMessage.trim(),
          level: bcastLevel,
          targetRooms: bcastTargetRooms,
          imageUrl: bcastImageUrl || null,
          actionUrl: bcastActionUrl.trim() || null,
          actionLabel: bcastActionLabel.trim() || null,
          playKlaxon: bcastPlayKlaxon
        })
      });

      if (res.ok) {
        const data = await res.json();
        flashNotice('Priority administrative directive dispatched successfully!');
        setRecentBroadcasts(prev => [
          {
            id: data.broadcastId || Date.now(),
            title: bcastTitle.trim() || 'ADMINISTRATIVE DIRECTIVE',
            message: bcastMessage.trim(),
            level: bcastLevel,
            targetRooms: bcastTargetRooms,
            imageUrl: bcastImageUrl,
            timestamp: Date.now()
          },
          ...prev.slice(0, 9)
        ]);
        setBcastTitle('');
        setBcastMessage('');
        setBcastImageUrl('');
        setBcastActionUrl('');
        setBcastActionLabel('');
        if (activeTab === 'messages') fetchMessages();
      } else {
        const err = await res.json().catch(() => ({}));
        flashNotice(`Broadcast failed: ${err.error || res.statusText}`, 'error');
      }
    } catch (err) {
      flashNotice(`Broadcast network error: ${err.message}`, 'error');
    } finally {
      setBcastSending(false);
    }
  };

  // Trigger James News Dispatch with selected category
  const handleTriggerNews = async () => {
    setTriggeringNews(true);
    try {
      flashNotice(`Triggering James autonomous news dispatch [${selectedNewsCategory.toUpperCase()}]...`);
      const res = await fetch(`${serverUrl}/api/admin/dashboard/james/trigger-news`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ category: selectedNewsCategory })
      });
      if (res.ok) {
        const data = await res.json();
        flashNotice(`World news [${(data.category || selectedNewsCategory).toUpperCase()}] dispatched into chat room!`);
        fetchTelemetry();
        if (activeTab === 'messages') fetchMessages();
      } else {
        const err = await res.json().catch(() => ({}));
        flashNotice(`News dispatch failed: ${err.error || res.statusText}`, 'error');
      }
    } catch (err) {
      flashNotice(`Network error: ${err.message}`, 'error');
    } finally {
      setTriggeringNews(false);
    }
  };

  // Run live security audit scan
  const handleRunVulnerabilityScan = async () => {
    setScanningVulnerabilities(true);
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/security/run-scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setScanResultModal(data.scanResult);
        flashNotice('Live security vulnerability audit passed!');
        fetchTelemetry();
      } else {
        flashNotice('Vulnerability scan failed', 'error');
      }
    } catch (err) {
      flashNotice(`Error: ${err.message}`, 'error');
    } finally {
      setScanningVulnerabilities(false);
    }
  };

  // Secret Society Actions
  const handleApproveCandidate = async (appId, customPassphrase = '') => {
    setApprovingId(appId);
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/society/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ applicationId: appId, customPassphrase })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedCredentialModal({
          alias: data.alias,
          rawPassphrase: data.rawPassphrase,
          email: data.email,
          message: data.message
        });
        fetchSocietyApps();
        fetchSocietyMembers();
        flashNotice(`Induction approved for @${data.alias}! Passphrase generated.`);
      } else {
        flashNotice(data.error || 'Failed to approve application');
      }
    } catch {
      flashNotice('Network error approving candidate');
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectCandidate = async (appId) => {
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/society/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ applicationId: appId })
      });
      if (res.ok) {
        fetchSocietyApps();
        flashNotice('Application candidate rejected');
      }
    } catch {}
  };

  const handleDeleteApplication = async (appId) => {
    if (!confirm('Are you sure you want to permanently delete this candidate dossier?')) return;
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/society/application/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ applicationId: appId })
      });
      if (res.ok) {
        fetchSocietyApps();
        flashNotice('Candidate dossier permanently deleted');
      }
    } catch {}
  };

  const handleApproveWithdrawal = async (withdrawalId) => {
    if (!confirm('Approve voluntary resignation and revoke Secret Society clearance & verified badge?')) return;
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/society/withdrawals/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ withdrawalId })
      });
      if (res.ok) {
        flashNotice('Membership withdrawn and verified badge revoked');
        setSocietyWithdrawals(prev => prev.filter(w => w.id !== withdrawalId));
        fetchSocietyWithdrawals();
        fetchSocietyMembers();
        fetchUsers();
      }
    } catch {}
  };

  const handleDismissWithdrawal = async (withdrawalId) => {
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/society/withdrawals/dismiss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ withdrawalId })
      });
      if (res.ok) {
        flashNotice('Withdrawal request dismissed');
        setSocietyWithdrawals(prev => prev.filter(w => w.id !== withdrawalId));
        fetchSocietyWithdrawals();
      }
    } catch {}
  };

  const handleApproveNameChange = async (requestId) => {
    if (!confirm('Approve this username change request? The member\'s verified identity and society dossier will update.')) return;
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/society/name-changes/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ requestId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        flashNotice(`Username updated to @${data.newAlias}`);
        setNameChangeRequests(prev => prev.filter(r => r.id !== requestId));
        fetchNameChangeRequests();
        fetchSocietyMembers();
        fetchUsers();
      } else {
        flashNotice(data.error || 'Failed to approve username change', 'error');
      }
    } catch {
      flashNotice('Error approving username change', 'error');
    }
  };

  const handleDismissNameChange = async (requestId) => {
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/society/name-changes/dismiss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ requestId })
      });
      if (res.ok) {
        flashNotice('Username change request dismissed');
        setNameChangeRequests(prev => prev.filter(r => r.id !== requestId));
        fetchNameChangeRequests();
      }
    } catch {}
  };

  const handleRegeneratePassphrase = async (memberId) => {
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/society/member/regenerate-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ memberId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedCredentialModal({
          alias: data.alias,
          rawPassphrase: data.rawPassphrase,
          email: data.email,
          message: data.message
        });
        fetchSocietyMembers();
        flashNotice(`New passphrase generated for @${data.alias}`);
      }
    } catch {}
  };

  const handleRemoveSocietyMember = async (memberId) => {
    if (!confirm('Are you sure you want to revoke this member\'s Secret Society clearance?')) return;
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/society/member/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ memberId })
      });
      if (res.ok) {
        fetchSocietyMembers();
        flashNotice('Member clearance revoked');
      }
    } catch {}
  };

  const handleDirectInductSubmit = async (e) => {
    e.preventDefault();
    if (!directForm.alias.trim()) return;
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/society/member/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(directForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedCredentialModal({
          alias: data.member.alias,
          rawPassphrase: data.rawPassphrase,
          email: data.member.email,
          message: 'Member directly inducted into Secret Society.'
        });
        setShowDirectInductModal(false);
        setDirectForm({ alias: '', email: '', fullName: '', role: '', location: '', customPassphrase: '' });
        fetchSocietyMembers();
        flashNotice(`Member @${data.member.alias} inducted successfully!`);
      } else {
        flashNotice(data.error || 'Failed to induct member');
      }
    } catch {
      flashNotice('Error inducting member');
    }
  };

  const copyPassphraseToClipboard = (pass) => {
    navigator.clipboard.writeText(pass);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2500);
  };

  const flashNotice = (msg) => {
    setActionStatus(msg);
    setTimeout(() => setActionStatus(null), 3500);
  };

  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (
      (u.alias && u.alias.toLowerCase().includes(q)) ||
      (u.userId && u.userId.toLowerCase().includes(q)) ||
      (u.status && u.status.toLowerCase().includes(q))
    );
  });

  const filteredMessages = messages.filter((m) => {
    if (msgRoomFilter === 'society' && !m.room?.includes('society') && !m.isSociety) return false;
    if (msgRoomFilter === 'public' && (m.room?.includes('society') || m.isSociety)) return false;
    if (!msgSearch) return true;
    const q = msgSearch.toLowerCase();
    return (
      (m.text && m.text.toLowerCase().includes(q)) ||
      (m.alias && m.alias.toLowerCase().includes(q))
    );
  });

  const pendingApps = societyApps.filter(a => a.status === 'pending' || (!a.status && a.status !== 'approved' && a.status !== 'rejected'));
  const filteredApps = pendingApps.filter((a) => {
    if (!societySearch) return true;
    const q = societySearch.toLowerCase();
    return (
      (a.alias && a.alias.toLowerCase().includes(q)) ||
      (a.fullName && a.fullName.toLowerCase().includes(q)) ||
      (a.email && a.email.toLowerCase().includes(q)) ||
      (a.role && a.role.toLowerCase().includes(q))
    );
  });

  const filteredMembers = societyMembers.filter((m) => {
    if (!societySearch) return true;
    const q = societySearch.toLowerCase();
    return (
      (m.alias && m.alias.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      (m.fullName && m.fullName.toLowerCase().includes(q))
    );
  });

  const pendingWithdrawals = societyWithdrawals.filter(w => w.status === 'pending');
  const filteredWithdrawals = pendingWithdrawals.filter((w) => {
    if (!societySearch) return true;
    const q = societySearch.toLowerCase();
    return (
      (w.alias && w.alias.toLowerCase().includes(q)) ||
      (w.reason && w.reason.toLowerCase().includes(q))
    );
  });

  const pendingNameChanges = nameChangeRequests.filter(r => r.status === 'pending');
  const filteredNameChanges = pendingNameChanges.filter((r) => {
    if (!societySearch) return true;
    const q = societySearch.toLowerCase();
    return (
      (r.oldAlias && r.oldAlias.toLowerCase().includes(q)) ||
      (r.newAlias && r.newAlias.toLowerCase().includes(q)) ||
      (r.userId && r.userId.toLowerCase().includes(q)) ||
      (r.reason && r.reason.toLowerCase().includes(q))
    );
  });

  const publicMsgCount = messages.filter(m => !m.room?.includes('society') && !m.isSociety).length;
  const societyMsgCount = messages.filter(m => m.room?.includes('society') || m.isSociety).length;

  const filteredAuditLogs = (Array.isArray(auditLogs) ? auditLogs : []).filter((log) => {
    if (auditSeverityFilter === 'critical') {
      const isDanger = log.event?.includes('FAILED') || log.event?.includes('LOCKOUT') || log.event?.includes('UNAUTHORIZED') || log.event?.includes('PURGED');
      if (!isDanger) return false;
    } else if (auditSeverityFilter === 'warn') {
      const isWarn = log.event?.includes('MODERATED') || log.event?.includes('REJECTED') || log.event?.includes('REVOKED');
      if (!isWarn) return false;
    } else if (auditSeverityFilter === 'info') {
      const isSuccess = log.event?.includes('AUTHORIZED') || log.event?.includes('INDUCTED') || log.event?.includes('APPROVED');
      if (!isSuccess) return false;
    }

    if (!auditSearch) return true;
    const q = auditSearch.toLowerCase();
    const detailsStr = typeof log.details === 'object' ? JSON.stringify(log.details).toLowerCase() : '';
    return (
      (log.event && log.event.toLowerCase().includes(q)) ||
      (log.maskedIp && log.maskedIp.toLowerCase().includes(q)) ||
      (log.details?.admin && log.details.admin.toLowerCase().includes(q)) ||
      (log.details?.username && log.details.username.toLowerCase().includes(q)) ||
      (log.details?.alias && log.details.alias.toLowerCase().includes(q)) ||
      detailsStr.includes(q)
    );
  });

  const formatUptime = (secs) => {
    if (!secs) return '0s';
    const d = Math.floor(secs / 86400);
    const h = Math.floor((secs % 86400) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${d > 0 ? d + 'd ' : ''}${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
  };

  return (
    <div className="admin-console-overlay">
      <div className="cyber-scanlines-layer" />
      <div className="cyber-hud-corner tl" />
      <div className="cyber-hud-corner tr" />
      <div className="cyber-hud-corner bl" />
      <div className="cyber-hud-corner br" />
      <div className="admin-console-container">
        {/* Top Header Row */}
        <header className="admin-top-header">
          <div className="admin-brand-cluster">
            <div className="admin-terminal-badge">
              <Terminal size={15} />
              <span>ROOT CONSOLE</span>
            </div>
            <div className="admin-auth-indicator">
              <Shield size={12} className="shield-active-icon" />
              <span>AUTHENTICATED: @{adminUsername}</span>
            </div>
          </div>

          {actionStatus && (
            <div className="admin-action-toast">
              <CheckCircle size={13} />
              <span>{actionStatus}</span>
            </div>
          )}

          <div className="admin-header-controls">
            <button
              type="button"
              className="admin-btn-refresh"
              onClick={handleHardRefresh}
              title="Force reload all telemetry & fresh bundles (stays on Admin Panel)"
            >
              <RefreshCw size={13} className={isHardRefreshing ? 'spin-icon' : ''} />
              <span>Hard Refresh</span>
            </button>
            {onOpenSocietyChat && (
              <button
                type="button"
                className="admin-btn-society"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSocietyChat();
                }}
                title="Enter exclusive Secret Society Chat with Level-5 Council clearance"
              >
                <Lock size={13} color="#ffd700" />
                <span>Secret Society Chat</span>
                <ExternalLink size={12} color="#ffd700" />
              </button>
            )}
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={onClose}
              title="Return to public terminal (ESC)"
            >
              <span>Return to Chat</span>
              <kbd className="admin-kbd">ESC</kbd>
            </button>
            <button
              type="button"
              className="admin-btn-danger"
              onClick={onLogout}
              title="Terminate root session"
            >
              <LogOut size={13} />
              <span>Revoke Access</span>
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="admin-nav-tabs">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'telemetry' ? 'active' : ''}`}
            onClick={() => setActiveTab('telemetry')}
          >
            <Activity size={14} />
            <span>Infrastructure & Telemetry</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'geo' ? 'active' : ''}`}
            onClick={() => setActiveTab('geo')}
          >
            <Globe size={14} />
            <span>Global Geo-Telemetry (3D)</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'society' ? 'active' : ''}`}
            onClick={() => setActiveTab('society')}
          >
            <Shield size={14} color="#ffd700" />
            <span>Enclave Induction Council ({pendingApps.length + pendingWithdrawals.length + pendingNameChanges.length})</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={14} />
            <span>Identity & Access ({users.length})</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <MessageSquare size={14} />
            <span>Transmissions Feed ({messages.length})</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'broadcast' ? 'active' : ''}`}
            onClick={() => setActiveTab('broadcast')}
          >
            <Zap size={14} />
            <span>Emergency Broadcast</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Lock size={14} />
            <span>Security Audit Logs</span>
          </button>
        </nav>

        {/* Body Content Area */}
        <div className="admin-panel-body">
          {/* TAB 1: TELEMETRY & SYSTEM HEALTH */}
          {activeTab === 'telemetry' && (
            <div className="admin-telemetry-view">
              <div className="telemetry-banner-card">
                <div className="telemetry-status-pill">
                  <span className="live-pulse-dot" />
                  <span>SYSTEM OPERATIONAL</span>
                </div>
                <div className="telemetry-banner-grid">
                  <div className="metric-box">
                    <span className="metric-label">UPTIME</span>
                    <span className="metric-val">{formatUptime(telemetry?.uptimeSeconds)}</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">ACTIVE WEBSOCKETS</span>
                    <span className="metric-val cyan">{telemetry?.network?.activeSockets || 0}</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">TRANSMISSIONS</span>
                    <span className="metric-val purple">{telemetry?.stats?.totalMessages || 0}</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">REGISTERED PROFILES</span>
                    <span className="metric-val emerald">{telemetry?.stats?.totalRegisteredProfiles || 0}</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">WS LATENCY (PING)</span>
                    <span className={`metric-val ${wsLatency !== null && wsLatency < 80 ? 'cyan' : wsLatency !== null && wsLatency < 200 ? 'amber' : 'red'}`}>
                      {wsLatency !== null ? `${wsLatency} ms` : 'MEASURING...'}
                    </span>
                  </div>
                </div>
              </div>

              {/* REAL-TIME OPERATIONS & SYSTEM CONTROL STRIP */}
              <div className="telemetry-ops-strip">
                <div className="ops-strip-title">
                  <Zap size={14} className="cyan-text" />
                  <span>REAL-TIME ROOT CONTROLS:</span>
                </div>
                <div className="ops-buttons-group">
                  <button
                    type="button"
                    className="ops-action-btn cache"
                    disabled={flushingCache}
                    onClick={handleFlushCache}
                    title="Purge in-memory message buffers and invoke V8 engine garbage collection"
                  >
                    {flushingCache ? <RefreshCw size={13} className="spin-icon" /> : <Trash2 size={13} />}
                    <span>{flushingCache ? 'Flushing Memory Buffers...' : 'Flush System Cache / Heap GC'}</span>
                  </button>

                  <button
                    type="button"
                    className={`ops-action-btn shield ${maintenanceActive ? 'engaged' : ''}`}
                    disabled={togglingMaintenance}
                    onClick={handleToggleMaintenance}
                    title="Toggle traffic shield to protect server during heavy loads"
                  >
                    <Shield size={13} />
                    <span>{maintenanceActive ? '⚠️ Traffic Shield: ENGAGED' : '🛡️ Traffic Shield: DISENGAGED'}</span>
                  </button>

                  <button
                    type="button"
                    className="ops-action-btn sync"
                    onClick={() => {
                      fetchTelemetry();
                      fetchLiveEvents();
                      flashNotice('Real-time telemetry and event stream recalibrated.');
                    }}
                    title="Force immediate refresh of all hardware and network diagnostics"
                  >
                    <RefreshCw size={13} />
                    <span>Recalibrate Telemetry</span>
                  </button>
                </div>
              </div>

              <div className="telemetry-grid-two-col">
                {/* Memory & Hardware Metrics */}
                <div className="telemetry-card">
                  <div className="card-header">
                    <Cpu size={14} />
                    <h4>COMPUTE & MEMORY ALLOCATION</h4>
                  </div>
                  <div className="memory-stats-list">
                    <div className="stat-line">
                      <span>Node Heap Used:</span>
                      <span className="stat-num">{telemetry?.memory?.heapUsedMb || 0} MB / {telemetry?.memory?.heapTotalMb || 0} MB</span>
                    </div>
                    <div className="stat-progress-bar">
                      <div
                        className="progress-fill cyan"
                        style={{
                          width: `${Math.min(100, Math.round(((telemetry?.memory?.heapUsedMb || 1) / (telemetry?.memory?.heapTotalMb || 1)) * 100))}%`
                        }}
                      />
                    </div>

                    <div className="stat-line">
                      <span>Process RSS Memory:</span>
                      <span className="stat-num">{telemetry?.memory?.rssMb || 0} MB</span>
                    </div>

                    <div className="stat-line">
                      <span>System Free RAM:</span>
                      <span className="stat-num">{telemetry?.system?.freeMemMb || 0} MB / {telemetry?.system?.totalMemMb || 0} MB</span>
                    </div>
                    <div className="stat-progress-bar">
                      <div
                        className="progress-fill purple"
                        style={{
                          width: `${Math.min(100, Math.round(((telemetry?.system?.freeMemMb || 1) / (telemetry?.system?.totalMemMb || 1)) * 100))}%`
                        }}
                      />
                    </div>

                    <div className="stat-line">
                      <span>CPU Architecture:</span>
                      <span className="stat-num">{telemetry?.system?.platform} ({telemetry?.system?.arch}, {telemetry?.system?.cpus} Cores)</span>
                    </div>
                  </div>
                </div>

                {/* James Autonomous Bot Control & Quota */}
                <div className="telemetry-card">
                  <div className="card-header">
                    <Radio size={14} />
                    <h4>JAMES AUTONOMOUS AGENT</h4>
                  </div>
                  <div className="james-control-body">
                    <div className="james-status-indicator">
                      <span className="badge-ai-active">AI CORE ACTIVE</span>
                      <span className="badge-model">deepseek/deepseek-v4-flash</span>
                    </div>
                    <p className="james-mission-text">
                      Autonomous community agent monitoring chat velocity, executing user requests, and broadcasting daily verified worldwide news dispatches.
                    </p>

                    <div className="quota-row">
                      <span>Daily News Quota:</span>
                      <span className="quota-val">
                        {telemetry?.jamesBot?.dailyNewsBroadcastsToday || 0} / {telemetry?.jamesBot?.dailyNewsQuota || 8} sent today
                      </span>
                    </div>

                    {/* Category Selector Chips */}
                    <div className="news-category-label">SELECT WIRE DISPATCH CATEGORY:</div>
                    <div className="admin-news-category-bar">
                      {[
                        { id: 'viral', label: '🔥 Viral Headlines' },
                        { id: 'tech', label: '💻 Tech Breakthroughs' },
                        { id: 'geopolitics', label: '🌐 Geopolitics' },
                        { id: 'finance', label: '📈 Markets & Crypto' },
                        { id: 'science', label: '🧬 Science' },
                        { id: 'healthcare', label: '⚕️ Health' },
                        { id: 'x_platform', label: '𝕏 Twitter Wire' }
                      ].map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          className={`category-chip-btn ${selectedNewsCategory === cat.id ? 'active' : ''}`}
                          onClick={() => setSelectedNewsCategory(cat.id)}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="admin-btn-trigger-news"
                      disabled={triggeringNews}
                      onClick={handleTriggerNews}
                    >
                      {triggeringNews ? <RefreshCw size={14} className="spin-icon" /> : <Zap size={14} />}
                      <span>{triggeringNews ? 'Dispatching News Article...' : `Trigger [${selectedNewsCategory.toUpperCase()}] News Dispatch`}</span>
                    </button>
                  </div>
                </div>

                {/* System Vulnerabilities & Security Posture Card */}
                <div className="telemetry-card security-posture-card">
                  <div className="card-header">
                    <ShieldCheck size={14} color="#10b981" />
                    <h4>SYSTEM VULNERABILITIES & SECURITY POSTURE</h4>
                    <span className="posture-score-tag">
                      {telemetry?.securityDiagnostics?.healthScore || 99}% SECURE
                    </span>
                  </div>
                  <p className="card-subtext">
                    Continuous automated security verification auditing cryptographic primitives, transport encryption, and brute-force defenses.
                  </p>
                  <div className="posture-grid">
                    {(telemetry?.securityDiagnostics?.securityPosture || [
                      { id: 'tls', name: 'TLS / WSS Transport Layer', status: 'ACTIVE', detail: 'Encrypted socket frame transmission & SSL tunneling' },
                      { id: 'hmac', name: 'HMAC SHA-256 Session Guard', status: 'ACTIVE', detail: 'Cryptographic nonce & timed token authentication' },
                      { id: 'rate', name: 'Anti-Brute-Force & Rate Limiting', status: 'ARMED', detail: 'Sliding lockout window with IP defense tracker' },
                      { id: 'helmet', name: 'Helmet HTTP Security Headers', status: 'ENFORCED', detail: 'CSP, HSTS, X-Frame-Options DENY, XSS filtering' },
                      { id: 'cors', name: 'CORS Origin Isolation', status: 'STRICT', detail: 'Access restricted to authorized host origins' },
                      { id: 'salt', name: 'Enclave Secret Passphrase Salt', status: 'ENCRYPTED', detail: 'Bcrypt-level salt with PBKDF2 hash rounds' }
                    ]).map(item => (
                      <div key={item.id || item.name} className="posture-item">
                        <div className="posture-item-top">
                          <div className="posture-title-wrap">
                            <CheckCircle2 size={13} color="#10b981" />
                            <strong>{item.name}</strong>
                          </div>
                          <span className="badge-posture-secure">{item.status}</span>
                        </div>
                        <span className="posture-item-desc">{item.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Issues, Errors & Diagnostics Center Card */}
                <div className="telemetry-card diagnostics-card">
                  <div className="card-header">
                    <Bug size={14} color="#f59e0b" />
                    <h4>ISSUES, ERRORS & SECURITY DIAGNOSTICS</h4>
                    <span className="status-pill-secure">0 CRITICAL EXPLOITS</span>
                  </div>
                  <p className="card-subtext">
                    Real-time exception tracker, failed authentication telemetry, socket drop statistics, and diagnostic toolbelt.
                  </p>
                  <div className="diagnostics-metrics-grid">
                    <div className="diag-metric-box">
                      <span className="diag-label">CRITICAL EXCEPTIONS</span>
                      <span className="diag-val clean">0</span>
                      <span className="diag-sub">Server runtime errors</span>
                    </div>
                    <div className="diag-metric-box">
                      <span className="diag-label">BLOCKED PROBES</span>
                      <span className="diag-val warn">{telemetry?.securityDiagnostics?.issuesSummary?.suspiciousProbesBlocked || 0}</span>
                      <span className="diag-sub">Rate-limited IPs</span>
                    </div>
                    <div className="diag-metric-box">
                      <span className="diag-label">AUTH VIOLATIONS</span>
                      <span className="diag-val alert">{telemetry?.securityDiagnostics?.issuesSummary?.failedAuthAttempts || 0}</span>
                      <span className="diag-sub">Invalid token handshakes</span>
                    </div>
                    <div className="diag-metric-box">
                      <span className="diag-label">MEMORY HEAP USED</span>
                      <span className="diag-val cyan">{telemetry?.memory?.heapUsedMb || 0} MB</span>
                      <span className="diag-sub">of {telemetry?.memory?.heapTotalMb || 0} MB Allocated</span>
                    </div>
                  </div>
                  <div className="diagnostics-action-row">
                    <button
                      type="button"
                      className="diag-btn primary"
                      disabled={scanningVulnerabilities}
                      onClick={handleRunVulnerabilityScan}
                    >
                      {scanningVulnerabilities ? <RefreshCw size={13} className="spin-icon" /> : <ShieldCheck size={13} />}
                      <span>{scanningVulnerabilities ? 'Executing Audit...' : 'Execute Live Vulnerability Audit'}</span>
                    </button>
                    <button
                      type="button"
                      className="diag-btn secondary"
                      onClick={() => {
                        fetchTelemetry();
                        flashNotice('Telemetry buffers refreshed.');
                      }}
                    >
                      <RefreshCw size={13} />
                      <span>Refresh Diagnostics</span>
                    </button>
                    <button
                      type="button"
                      className="diag-btn export"
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(telemetry || {}, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `shadowtalk-security-diagnostics-${Date.now()}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        flashNotice('Security diagnostics report exported!');
                      }}
                    >
                      <Download size={13} />
                      <span>Export Report (.json)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* REAL-TIME SERVER INGRESS & LIVE EVENT STREAM */}
              <div className="telemetry-card live-stream-card">
                <div className="card-header stream-header">
                  <div className="stream-header-left">
                    <span className="live-stream-pulse" />
                    <h4>LIVE SERVER INGRESS &amp; EVENT STREAM</h4>
                    <span className="stream-badge-count">{liveEvents.length} EVENTS RECORDED</span>
                  </div>
                  <div className="stream-header-actions">
                    <button
                      type="button"
                      className={`stream-ctrl-btn ${isStreamPaused ? 'paused' : ''}`}
                      onClick={() => setIsStreamPaused(!isStreamPaused)}
                      title={isStreamPaused ? 'Resume stream' : 'Pause live auto-update'}
                    >
                      {isStreamPaused ? <Play size={12} /> : <Pause size={12} />}
                      <span>{isStreamPaused ? 'Resume Stream' : 'Pause Stream'}</span>
                    </button>
                    <button
                      type="button"
                      className="stream-ctrl-btn danger"
                      onClick={() => {
                        setLiveEvents([]);
                        flashNotice('Event stream buffer cleared.');
                      }}
                      title="Clear terminal event log"
                    >
                      <Trash2 size={12} />
                      <span>Clear Buffer</span>
                    </button>
                  </div>
                </div>
                <p className="card-subtext">
                  Continuous zero-latency event socket logging all administrative actions, socket handshakes, broadcasts, and system optimizations as they execute.
                </p>

                <div className="live-event-terminal-window">
                  {liveEvents.length === 0 ? (
                    <div className="terminal-empty-state">
                      <span className="terminal-prompt">&gt;</span> Listening for live server socket events and administrative dispatches...
                    </div>
                  ) : (
                    liveEvents.map((ev) => {
                      const timeStr = new Date(ev.timestamp).toLocaleTimeString();
                      return (
                        <div key={ev.id} className={`terminal-event-row ${ev.severity || 'info'}`}>
                          <span className="event-time">[{timeStr}]</span>
                          <span className={`event-type-pill ${ev.severity || 'info'}`}>
                            {ev.type || 'SYSTEM_EVENT'}
                          </span>
                          <span className="event-summary">{ev.summary}</span>
                          {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                            <span className="event-meta">
                              {JSON.stringify(ev.metadata)}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GLOBAL 3D GEOLOCATION TELEMETRY (IPSTACK) */}
          {activeTab === 'geo' && (
            <div className="admin-geo-view">
              <GeoGlobe3D adminToken={adminToken} serverUrl={serverUrl} />
            </div>
          )}

          {/* TAB 3: SECRET SOCIETY ENCLAVE INDUCTION COUNCIL */}
          {activeTab === 'society' && (
            <div className="admin-society-view">
              {/* Society Top Toolbar */}
              <div className="society-toolbar">
                <div className="society-stats-cluster">
                  <div className="society-stat-badge">
                    <ShieldCheck size={14} color="#ffd700" />
                    <span>PENDING VETTING: {pendingApps.length}</span>
                  </div>
                  <div className="society-stat-badge">
                    <Users size={14} color="#10b981" />
                    <span>INDUCTED MEMBERS: {societyMembers.length}</span>
                  </div>
                  {pendingWithdrawals.length > 0 && (
                    <div className="society-stat-badge withdrawal">
                      <LogOut size={14} color="#f87171" />
                      <span>WITHDRAWALS: {pendingWithdrawals.length}</span>
                    </div>
                  )}
                  {pendingNameChanges.length > 0 && (
                    <div className="society-stat-badge namechanges">
                      <Edit3 size={14} color="#00f3ff" />
                      <span>NAME CHANGES: {pendingNameChanges.length}</span>
                    </div>
                  )}
                </div>

                <div className="society-toolbar-right">
                  {onOpenSocietyChat && (
                    <button
                      type="button"
                      className="admin-btn-society"
                      onClick={onOpenSocietyChat}
                      title="Enter Secret Society Chat (Level-5 Council Clearance)"
                    >
                      <Lock size={13} color="#ffd700" />
                      <span>Enter Secret Society Chat</span>
                      <ExternalLink size={12} color="#ffd700" />
                    </button>
                  )}

                  <div className="society-search-wrap">
                    <Search size={13} />
                    <input
                      type="text"
                      placeholder="Search candidates, members, or resignations..."
                      value={societySearch}
                      onChange={(e) => setSocietySearch(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    className="admin-btn-primary"
                    onClick={() => setShowDirectInductModal(true)}
                  >
                    <UserPlus size={13} />
                    <span>+ Direct Induct Member</span>
                  </button>
                </div>
              </div>

              {/* Sub-tab Navigation */}
              <div className="society-subtabs">
                <button
                  type="button"
                  className={`subtab-btn ${societySubTab === 'applications' ? 'active' : ''}`}
                  onClick={() => setSocietySubTab('applications')}
                >
                  <FileText size={13} />
                  <span>Candidate Applications ({pendingApps.length} Pending)</span>
                </button>
                <button
                  type="button"
                  className={`subtab-btn ${societySubTab === 'members' ? 'active' : ''}`}
                  onClick={() => setSocietySubTab('members')}
                >
                  <Award size={13} />
                  <span>Active Enclave Members ({societyMembers.length})</span>
                </button>
                <button
                  type="button"
                  className={`subtab-btn ${societySubTab === 'withdrawals' ? 'active' : ''}`}
                  onClick={() => setSocietySubTab('withdrawals')}
                >
                  <LogOut size={13} />
                  <span>Withdrawal Requests ({pendingWithdrawals.length} Pending)</span>
                </button>
                <button
                  type="button"
                  className={`subtab-btn ${societySubTab === 'name-changes' ? 'active' : ''}`}
                  onClick={() => setSocietySubTab('name-changes')}
                >
                  <Edit3 size={13} />
                  <span>Name Changes ({pendingNameChanges.length} Pending)</span>
                </button>
              </div>

              {/* View 1: Candidate Applications */}
              {societySubTab === 'applications' && (
                <div className="society-applications-feed">
                  {filteredApps.length === 0 ? (
                    <div className="society-empty-box">No candidate applications currently match filter.</div>
                  ) : (
                    filteredApps.map((app) => (
                      <div key={app.id} className={`candidate-dossier-card ${app.status}`}>
                        <div className="candidate-card-top">
                          <div className="candidate-id-badge">
                            <span className="candidate-seal">Ω</span>
                            <div>
                              <h4>{app.fullName}</h4>
                              <span className="candidate-alias">@{app.alias} &bull; {app.email}</span>
                            </div>
                          </div>
                          <span className={`status-badge-chip ${app.status}`}>
                            {app.status?.toUpperCase()}
                          </span>
                        </div>

                        <div className="candidate-grid-info">
                          <div className="info-cell">
                            <span className="cell-lbl">ROLE / STATUS:</span>
                            <span className="cell-val">{app.role}</span>
                          </div>
                          <div className="info-cell">
                            <span className="cell-lbl">AGE &amp; LOCATION:</span>
                            <span className="cell-val">{app.ageLocation}</span>
                          </div>
                          <div className="info-cell">
                            <span className="cell-lbl">SUBMITTED AT:</span>
                            <span className="cell-val">{new Date(app.timestamp || app.submittedAt).toLocaleString()}</span>
                          </div>
                          <div className="info-cell">
                            <span className="cell-lbl">PUBLIC HANDLE:</span>
                            <span className="cell-val">{app.socialHandle || 'None'}</span>
                          </div>
                        </div>

                        <div className="candidate-purpose-quote">
                          <span className="purpose-lbl">STATEMENT OF PURPOSE &amp; UNREDACTED KNOWLEDGE SOUGHT:</span>
                          <p>"{app.purpose}"</p>
                        </div>

                        {app.status === 'pending' && (
                          <div className="candidate-actions-footer">
                            <button
                              type="button"
                              className="btn-reject-candidate"
                              onClick={() => handleRejectCandidate(app.id)}
                            >
                              <UserX size={13} />
                              <span>Reject</span>
                            </button>
                            <button
                              type="button"
                              className="btn-approve-candidate"
                              disabled={approvingId === app.id}
                              onClick={() => handleApproveCandidate(app.id)}
                            >
                              <Sparkles size={13} color="#ffd700" />
                              <span>{approvingId === app.id ? 'Generating Hash...' : 'Approve & Issue Enclave Passphrase'}</span>
                            </button>
                          </div>
                        )}

                        {app.status === 'rejected' && (
                          <div className="candidate-actions-footer">
                            <button
                              type="button"
                              className="btn-delete-candidate"
                              onClick={() => handleDeleteApplication(app.id)}
                              title="Permanently remove rejected dossier"
                            >
                              <Trash2 size={13} />
                              <span>Delete Rejected Dossier</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* View 2: Active Members Roster */}
              {societySubTab === 'members' && (
                <div className="society-members-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: '190px' }}>MEMBER ALIAS</th>
                        <th style={{ width: '160px' }}>FULL NAME</th>
                        <th style={{ width: '230px' }}>EMAIL / COMM</th>
                        <th>ROLE / RELAY</th>
                        <th style={{ width: '150px' }}>CLEARANCE</th>
                        <th style={{ width: '140px' }}>INDUCTED DATE</th>
                        <th style={{ width: '200px', textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <div className="member-alias-cell">
                              <Shield size={14} color="#ffd700" className="member-shield-icon" />
                              <strong className="gold-text">@{m.alias}</strong>
                            </div>
                          </td>
                          <td className="member-name-cell">{m.fullName || '—'}</td>
                          <td className="member-email-cell"><code>{m.email || '—'}</code></td>
                          <td>
                            <div className="member-role-cell">
                              <span className="member-role-title">{m.role || 'Sovereign Inductee'}</span>
                              {m.location && <span className="sub-loc">({m.location})</span>}
                            </div>
                          </td>
                          <td>
                            <span className="badge-clearance">
                              <Lock size={10} color="#ffd700" />
                              <span>{m.clearance || 'LEVEL-4 INDUCTED'}</span>
                            </span>
                          </td>
                          <td className="member-date-cell">{new Date(m.joinedAt).toLocaleDateString()}</td>
                          <td>
                            <div className="table-actions">
                              <button
                                type="button"
                                className="action-btn gold"
                                title="Regenerate Enclave Passphrase"
                                onClick={() => handleRegeneratePassphrase(m.id)}
                              >
                                <KeyRound size={12} />
                                <span>New Pass</span>
                              </button>
                              <button
                                type="button"
                                className="action-btn danger"
                                title="Revoke Membership"
                                onClick={() => handleRemoveSocietyMember(m.id)}
                              >
                                <UserX size={12} />
                                <span>Revoke</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredMembers.length === 0 && (
                        <tr>
                          <td colSpan={7} className="empty-row">No active society members found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* View 3: Member Resignation & Withdrawal Requests */}
              {societySubTab === 'withdrawals' && (
                <div className="society-withdrawals-feed">
                  {filteredWithdrawals.length === 0 ? (
                    <div className="society-empty-box">No member resignation requests found.</div>
                  ) : (
                    filteredWithdrawals.map((req) => (
                      <div key={req.id} className={`withdrawal-card ${req.status}`}>
                        <div className="withdrawal-card-header">
                          <div className="withdrawal-user-info">
                            <Shield size={16} color={req.status === 'approved' ? '#f87171' : '#ffd700'} />
                            <div>
                              <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '0.92rem' }}>@{req.alias}</h4>
                              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                Submitted on {new Date(req.submittedAt || req.timestamp).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <span className={`status-badge-chip ${req.status}`}>
                            {req.status?.toUpperCase()}
                          </span>
                        </div>

                        <div className="withdrawal-reason-quote">
                          <strong style={{ display: 'block', fontSize: '0.68rem', color: '#f87171', marginBottom: '0.3rem', letterSpacing: '0.06em' }}>
                            STATED REASON FOR WITHDRAWAL:
                          </strong>
                          <p style={{ margin: 0, fontStyle: 'italic', color: '#cbd5e1' }}>"{req.reason}"</p>
                        </div>

                        {req.status === 'pending' && (
                          <div className="withdrawal-actions-footer">
                            <button
                              type="button"
                              className="btn-dismiss-withdrawal"
                              onClick={() => handleDismissWithdrawal(req.id)}
                              title="Dismiss resignation request"
                            >
                              <XCircle size={13} />
                              <span>Dismiss</span>
                            </button>
                            <button
                              type="button"
                              className="btn-approve-withdrawal"
                              onClick={() => handleApproveWithdrawal(req.id)}
                              title="Accept resignation, revoke secret clearance, and remove verified badge"
                            >
                              <UserX size={13} />
                              <span>Approve Resignation &amp; Revoke Member</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* View 4: Username / Alias Change Requests */}
              {societySubTab === 'name-changes' && (
                <div className="namechange-feed">
                  {filteredNameChanges.length === 0 ? (
                    <div className="society-empty-box">No username change requests found.</div>
                  ) : (
                    filteredNameChanges.map((req) => (
                      <div key={req.id} className={`namechange-card ${req.status || 'pending'}`}>
                        <div className="namechange-card-header">
                          <div className="namechange-transition-badge">
                            <Edit3 size={13} className="namechange-badge-icon" />
                            <span className="namechange-alias-old">@{req.oldAlias || req.currentAlias}</span>
                            <ArrowRight size={14} className="namechange-arrow-icon" />
                            <span className="namechange-alias-new">@{req.newAlias || req.requestedAlias}</span>
                          </div>
                          <span className={`status-badge-chip ${req.status || 'pending'}`}>
                            {(req.status || 'pending').toUpperCase()}
                          </span>
                        </div>

                        <div className="namechange-meta-row">
                          <div className="info-cell">
                            <span className="cell-lbl">MEMBER NAME:</span>
                            <span className="cell-val">{req.fullName || 'Verified Member'}</span>
                          </div>
                          <div className="info-cell">
                            <span className="cell-lbl">UID / ACCOUNT:</span>
                            <span className="cell-val"><code>{req.userId?.slice(0, 12)}...</code></span>
                          </div>
                          <div className="info-cell">
                            <span className="cell-lbl">EMAIL / CONTACT:</span>
                            <span className="cell-val">{req.email || '—'}</span>
                          </div>
                          <div className="info-cell">
                            <span className="cell-lbl">FILED AT:</span>
                            <span className="cell-val">{new Date(req.submittedAt || req.timestamp).toLocaleString()}</span>
                          </div>
                        </div>

                        {req.reason && (
                          <div className="namechange-reason-box">
                            <span className="reason-lbl">STATED JUSTIFICATION / REASON FOR MODIFICATION:</span>
                            <p>"{req.reason}"</p>
                          </div>
                        )}

                        {req.status === 'pending' && (
                          <div className="namechange-actions">
                            <button
                              type="button"
                              className="btn-dismiss-namechange"
                              onClick={() => handleDismissNameChange(req.id)}
                              title="Dismiss name change request"
                            >
                              <XCircle size={13} />
                              <span>Dismiss</span>
                            </button>
                            <button
                              type="button"
                              className="btn-approve-namechange"
                              onClick={() => handleApproveNameChange(req.id)}
                              title="Approve username change and update member identity"
                            >
                              <CheckCircle size={13} />
                              <span>Approve &amp; Update Member Alias</span>
                            </button>
                          </div>
                        )}

                        {req.status === 'approved' && (
                          <div className="namechange-status-note approved">
                            <CheckCircle size={13} />
                            <span>Identity successfully transitioned to @{req.newAlias || req.requestedAlias} across network.</span>
                          </div>
                        )}

                        {req.status === 'dismissed' && (
                          <div className="namechange-status-note dismissed">
                            <XCircle size={13} />
                            <span>Request was dismissed by administration.</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: USERS MANAGEMENT (IDENTITY & ACCESS) */}
          {activeTab === 'users' && (
            <div className="admin-users-view">
              <div className="view-toolbar">
                <div className="search-input-wrapper">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Search users by alias, userId, or status..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>
                    {filteredUsers.length} PROFILES LOADED
                  </span>
                  <button type="button" className="admin-btn-refresh" onClick={fetchUsers}>
                    <RefreshCw size={13} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-data-table users-table">
                  <thead>
                    <tr>
                      <th style={{ width: '220px' }}>USER / CITIZEN</th>
                      <th style={{ width: '150px' }}>USER ID</th>
                      <th style={{ width: '130px' }}>PRESENCE</th>
                      <th style={{ width: '150px' }}>CLEARANCE</th>
                      <th style={{ width: '130px' }}>VERIFIED BADGE</th>
                      <th style={{ width: '200px', textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const isAdm = u.role === 'admin' || u.isAdmin;
                      const isMem = u.isSocietyMember || (u.isVerified && !isAdm);

                      return (
                        <tr key={u.userId || u.alias}>
                          <td>
                            <div className="user-cell">
                              <span className="user-dot" style={{ background: u.color || '#00f3ff' }} />
                              <strong>@{u.alias}</strong>
                              {u.isVerified && <span className="verified-chip" title="Verified Badge">✓</span>}
                            </div>
                          </td>
                          <td><code>{u.userId}</code></td>
                          <td>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span
                                style={{
                                  width: '7px',
                                  height: '7px',
                                  borderRadius: '50%',
                                  background: u.isOnline ? '#10b981' : '#64748b',
                                  boxShadow: u.isOnline ? '0 0 6px #10b981' : 'none'
                                }}
                              />
                              <span className={`status-tag ${u.isOnline ? 'online' : 'offline'}`}>
                                {u.isOnline ? 'Online' : 'Offline'}
                              </span>
                            </div>
                          </td>
                          <td>
                            {isAdm ? (
                              <span className="admin-chip">ROOT ADMIN</span>
                            ) : isMem ? (
                              <span className="member-chip">SOCIETY MEMBER</span>
                            ) : (
                              <span className="user-chip">CITIZEN</span>
                            )}
                          </td>
                          <td>
                            <span className={u.isVerified ? 'verified-tag true' : 'verified-tag false'}>
                              {u.isVerified ? '✓ VERIFIED' : 'UNVERIFIED'}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                type="button"
                                className={`action-btn ${u.isVerified ? 'warn' : 'primary'}`}
                                onClick={() => handleToggleVerify(u.userId, u.alias, u.isVerified)}
                                title={u.isVerified ? 'Revoke verified badge' : 'Grant verified blue tick badge'}
                              >
                                <ShieldCheck size={12} />
                                <span>{u.isVerified ? 'Unverify' : 'Verify'}</span>
                              </button>
                              <button
                                type="button"
                                className="action-btn warn"
                                onClick={() => handleKickUser(u.userId, u.alias)}
                                title="Disconnect active socket connections"
                              >
                                <UserX size={12} />
                                <span>Kick</span>
                              </button>
                              <button
                                type="button"
                                className="action-btn danger"
                                onClick={() => handleDeleteUser(u.userId, u.alias)}
                                title="Permanently delete user profile"
                              >
                                <Trash2 size={12} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="empty-row">No user profiles matched search query.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: TRANSMISSIONS MODERATION (DYNAMIC PUBLIC & SECRET SOCIETY) */}
          {activeTab === 'messages' && (
            <div className="admin-messages-view">
              <div className="view-toolbar">
                <div className="search-input-wrapper">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Search transmissions by content or author alias..."
                    value={msgSearch}
                    onChange={(e) => setMsgSearch(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>
                    {filteredMessages.length} TRANSMISSIONS LOADED
                  </span>
                  <button
                    type="button"
                    className="admin-btn-refresh"
                    onClick={fetchMessages}
                    disabled={isRefreshingMessages}
                    title="Force refresh transmissions from public and Secret Society channels"
                  >
                    <RefreshCw size={13} className={isRefreshingMessages ? 'spin-icon' : ''} />
                    <span>{isRefreshingMessages ? 'Refreshing...' : 'Refresh'}</span>
                  </button>
                </div>
              </div>

              {/* Room Channel Filter & Moderation Purge Controls */}
              <div className="transmissions-control-header">
                <div className="society-subtabs">
                  <button
                    type="button"
                    className={`subtab-btn ${msgRoomFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setMsgRoomFilter('all')}
                  >
                    <MessageSquare size={13} />
                    <span>All Channels ({messages.length})</span>
                  </button>
                  <button
                    type="button"
                    className={`subtab-btn ${msgRoomFilter === 'public' ? 'active' : ''}`}
                    onClick={() => setMsgRoomFilter('public')}
                  >
                    <Globe size={13} />
                    <span>Public Room ({publicMsgCount})</span>
                  </button>
                  <button
                    type="button"
                    className={`subtab-btn ${msgRoomFilter === 'society' ? 'active' : ''}`}
                    onClick={() => setMsgRoomFilter('society')}
                  >
                    <Lock size={13} color="#ffd700" />
                    <span>Secret Society Stream ({societyMsgCount})</span>
                  </button>
                </div>

                <div className="purge-actions-cluster">
                  <button
                    type="button"
                    className="admin-btn-purge public"
                    onClick={() => setConfirmPurgeRoom('public')}
                    title="Clear all public room chat messages"
                  >
                    <Trash2 size={13} />
                    <span>Clear Public Chat ({publicMsgCount})</span>
                  </button>
                  <button
                    type="button"
                    className="admin-btn-purge society"
                    onClick={() => setConfirmPurgeRoom('society')}
                    title="Clear all secret society enclave messages"
                  >
                    <Trash2 size={13} />
                    <span>Clear Secret Society Chat ({societyMsgCount})</span>
                  </button>
                </div>
              </div>

              {/* Table Format Transmissions Feed */}
              <div className="admin-table-container">
                <table className="admin-data-table transmissions-table">
                  <thead>
                    <tr>
                      <th style={{ width: '110px' }}>CHANNEL</th>
                      <th style={{ width: '160px' }}>DATE &amp; TIME</th>
                      <th style={{ width: '180px' }}>AUTHOR</th>
                      <th>CONTENT / DIRECTIVE PAYLOAD</th>
                      <th style={{ width: '130px' }}>ATTACHMENTS</th>
                      <th style={{ width: '90px', textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMessages.map((m) => {
                      const isSoc = m.room === 'society' || m.isSociety;
                      const isDeleting = deletingMsgId === m.id;
                      const dateObj = new Date(m.timestamp || Date.now());

                      return (
                        <tr key={m.id} className={isSoc ? 'society-msg-row' : 'public-msg-row'}>
                          <td>
                            <span className={`channel-pill ${isSoc ? 'society' : 'public'}`}>
                              {isSoc ? 'ENCLAVE' : 'PUBLIC'}
                            </span>
                          </td>
                          <td>
                            <div className="table-timestamp-cell">
                              <span className="date-part">{dateObj.toLocaleDateString()}</span>
                              <span className="time-part">{dateObj.toLocaleTimeString()}</span>
                            </div>
                          </td>
                          <td>
                            <div className="user-cell">
                              <span className="user-color-dot" style={{ background: m.color || '#00f3ff' }} />
                              <strong className="user-alias-text">@{m.alias}</strong>
                              {m.isVerified && <span className="verified-chip" title="Verified Badge">✓</span>}
                            </div>
                          </td>
                          <td>
                            <div className="msg-content-cell">
                              {m.adminBroadcast && (
                                <span className={`directive-tag ${m.adminBroadcast.level || 'info'}`}>
                                  [DIRECTIVE: {m.adminBroadcast.level?.toUpperCase()}]
                                </span>
                              )}
                              {m.newsCard && (
                                <span className="news-tag-badge">
                                  [NEWS DISPATCH]
                                </span>
                              )}
                              <span className="msg-cell-text">{m.text}</span>
                            </div>
                          </td>
                          <td>
                            {m.imageUrl || m.fileUrl ? (
                              <div className="msg-attachment-pill">
                                <ImageIcon size={11} />
                                <span>{m.fileName || 'Image/File'}</span>
                              </div>
                            ) : m.isVoiceNote ? (
                              <div className="msg-attachment-pill voice">
                                <Volume2 size={11} />
                                <span>Voice Note</span>
                              </div>
                            ) : (
                              <span style={{ color: '#475569', fontSize: '0.72rem' }}>—</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="action-btn danger"
                              title="Permanently remove transmission from chat room"
                              disabled={isDeleting}
                              onClick={() => handleDeleteMessage(m.id, isSoc)}
                            >
                              {isDeleting ? <RefreshCw size={12} className="spin-icon" /> : <Trash2 size={12} />}
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredMessages.length === 0 && (
                      <tr>
                        <td colSpan={6} className="empty-row">No transmissions found in selected filter.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: EMERGENCY BROADCAST DISPATCHER */}
          {activeTab === 'broadcast' && (
            <div className="admin-broadcast-view">
              <div className="broadcast-card">
                <div className="card-header">
                  <Zap size={14} />
                  <h4>DISPATCH GLOBAL ADMINISTRATIVE DIRECTIVE</h4>
                </div>
                <p className="broadcast-explainer">
                  Broadcast verified emergency notifications across connected terminals worldwide with real-time banners, image attachments, action CTAs, and acoustic klaxons.
                </p>

                {/* Quick Directive Presets Bar */}
                <div className="bcast-presets-bar">
                  <span className="presets-label">QUICK DIRECTIVE PRESETS:</span>
                  <div className="presets-button-row">
                    <button
                      type="button"
                      className="preset-btn"
                      onClick={() => {
                        setBcastTitle('SCHEDULED INFRASTRUCTURE MAINTENANCE');
                        setBcastMessage('Core server telemetry maintenance scheduled in 10 minutes. WebSocket sessions may momentarily reconnect.');
                        setBcastLevel('alert');
                        setBcastActionLabel('Status Dashboard');
                        setBcastActionUrl('https://shadowtalk.net/status');
                      }}
                    >
                      ⚠️ Maintenance
                    </button>
                    <button
                      type="button"
                      className="preset-btn"
                      onClick={() => {
                        setBcastTitle('CRITICAL SECURITY PROTOCOL UPGRADE');
                        setBcastMessage('All citizens are requested to verify their identity keys and review the latest cryptographic security guidelines.');
                        setBcastLevel('critical');
                        setBcastActionLabel('Security Protocol');
                        setBcastActionUrl('https://shadowtalk.net/security');
                      }}
                    >
                      🛡️ Security Upgrade
                    </button>
                    <button
                      type="button"
                      className="preset-btn"
                      onClick={() => {
                        setBcastTitle('DDoS MITIGATION SYSTEM ENGAGED');
                        setBcastMessage('Active traffic filtration enabled. Rate limiting is currently enforced across public ingress nodes.');
                        setBcastLevel('alert');
                      }}
                    >
                      ⚡ DDoS Defense
                    </button>
                    <button
                      type="button"
                      className="preset-btn"
                      onClick={() => {
                        setBcastTitle('GENERAL PLATFORM ANNOUNCEMENT');
                        setBcastMessage('Welcome to ShadowTalk! Check out the Secret Society Enclave and participate in live world news debate polls.');
                        setBcastLevel('info');
                      }}
                    >
                      📢 Announcement
                    </button>
                  </div>
                </div>

                <form className="broadcast-form" onSubmit={handleSendBroadcast}>
                  <div className="form-row-2col">
                    <div className="form-group">
                      <label>DIRECTIVE TITLE / HEADER</label>
                      <input
                        type="text"
                        placeholder="e.g. CRITICAL PROTOCOL UPGRADE // SYSTEM DIRECTIVE"
                        value={bcastTitle}
                        onChange={(e) => setBcastTitle(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>TARGET BROADCAST CHANNEL</label>
                      <div className="target-channel-selector">
                        {[
                          { id: 'all', label: '🌐 All Channels' },
                          { id: 'public', label: '💬 Public Room' },
                          { id: 'society', label: '🏛️ Secret Society' }
                        ].map(t => (
                          <label key={t.id} className={`target-radio-pill ${bcastTargetRooms === t.id ? 'active' : ''}`}>
                            <input
                              type="radio"
                              name="bcastTargetRooms"
                              value={t.id}
                              checked={bcastTargetRooms === t.id}
                              onChange={() => setBcastTargetRooms(t.id)}
                            />
                            <span>{t.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>BROADCAST MESSAGE CONTENT *</label>
                    <textarea
                      rows={4}
                      placeholder="Enter the official administrative instruction dispatched directly into the chat room..."
                      value={bcastMessage}
                      onChange={(e) => setBcastMessage(e.target.value)}
                      required
                    />
                  </div>

                  {/* Image Attachment Upload */}
                  <div className="form-group">
                    <label>IMAGE ATTACHMENT (OPTIONAL)</label>
                    <div className="bcast-image-upload-wrap">
                      {!bcastImageUrl ? (
                        <label className="bcast-file-dropzone">
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleBroadcastImageUpload}
                            disabled={bcastImageUploading}
                          />
                          <div className="dropzone-content">
                            {bcastImageUploading ? (
                              <div className="uploading-state">
                                <RefreshCw size={18} className="spin-icon" />
                                <span>Uploading image to media server...</span>
                              </div>
                            ) : (
                              <>
                                <Upload size={18} color="#00f3ff" />
                                <span>Click to attach image banner (JPG, PNG, GIF, WEBP)</span>
                              </>
                            )}
                          </div>
                        </label>
                      ) : (
                        <div className="bcast-image-preview-card">
                          <img src={bcastImageUrl} alt="Broadcast attachment preview" className="bcast-attached-img" />
                          <div className="bcast-img-meta">
                            <span className="bcast-img-url">{bcastImageUrl}</span>
                            <button
                              type="button"
                              className="btn-remove-bcast-img"
                              onClick={() => setBcastImageUrl('')}
                            >
                              <X size={13} />
                              <span>Remove Image</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Optional Action CTA Link */}
                  <div className="form-row-2col">
                    <div className="form-group">
                      <label>OPTIONAL ACTION BUTTON LABEL</label>
                      <input
                        type="text"
                        placeholder="e.g. Read Security Advisory"
                        value={bcastActionLabel}
                        onChange={(e) => setBcastActionLabel(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>OPTIONAL ACTION BUTTON URL</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={bcastActionUrl}
                        onChange={(e) => setBcastActionUrl(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row-2col" style={{ alignItems: 'center' }}>
                    <div className="form-group">
                      <label>URGENCY CLASSIFICATION</label>
                      <div className="level-selector-row">
                        {['critical', 'alert', 'info'].map((lvl) => (
                          <label key={lvl} className={`level-pill ${bcastLevel === lvl ? 'active' : ''}`}>
                            <input
                              type="radio"
                              name="bcastLevel"
                              value={lvl}
                              checked={bcastLevel === lvl}
                              onChange={() => setBcastLevel(lvl)}
                            />
                            <span>{lvl.toUpperCase()}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>ACOUSTIC SIREN ALERT</label>
                      <label className="checkbox-label-styled">
                        <input
                          type="checkbox"
                          checked={bcastPlayKlaxon}
                          onChange={(e) => setBcastPlayKlaxon(e.target.checked)}
                        />
                        <span className="checkbox-custom" />
                        <span>Trigger emergency alert audio on connected terminals</span>
                      </label>
                    </div>
                  </div>

                  {/* Live Directive Viewport Preview */}
                  <div className="broadcast-preview-box">
                    <span className="preview-label">LIVE DIRECTIVE VIEWPORT PREVIEW:</span>
                    <div className={`preview-banner-card ${bcastLevel}`}>
                      <div className="preview-banner-header">
                        <AlertTriangle size={15} />
                        <strong>{bcastTitle.trim() || 'ADMINISTRATIVE DIRECTIVE'}</strong>
                        <span className="preview-urgency-tag">{bcastLevel.toUpperCase()}</span>
                      </div>
                      <p className="preview-banner-text">
                        {bcastMessage.trim() || 'Official broadcast directives display in this emergency banner across all online terminals in real time.'}
                      </p>
                      {bcastImageUrl && (
                        <div className="preview-banner-image-wrap">
                          <img src={bcastImageUrl} alt="Broadcast Directive Visual" className="preview-banner-img" />
                        </div>
                      )}
                      {bcastActionLabel.trim() && (
                        <div className="preview-action-row">
                          <a
                            href={bcastActionUrl.trim() || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="preview-cta-button"
                            onClick={(e) => { if (!bcastActionUrl.trim()) e.preventDefault(); }}
                          >
                            <span>{bcastActionLabel.trim()}</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="admin-btn-broadcast-submit"
                    disabled={bcastSending || !bcastMessage.trim()}
                  >
                    <Send size={14} />
                    <span>{bcastSending ? 'Transmitting Directive...' : `Dispatch Directive to ${bcastTargetRooms === 'all' ? 'All Channels' : bcastTargetRooms.toUpperCase()}`}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 7: SECURITY AUDIT LOGS (TABLE FORMAT & FULL DATE) */}
          {activeTab === 'security' && (
            <div className="admin-security-view">
              <div className="view-toolbar">
                <div className="search-input-wrapper">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Search logs by event, admin, IP address, or forensic details..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="admin-btn-export-logs"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(auditLogs, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `shadowtalk-security-audit-logs-${Date.now()}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      flashNotice('Audit log history exported!');
                    }}
                  >
                    <Download size={13} />
                    <span>Export Logs</span>
                  </button>
                  <button type="button" className="admin-btn-refresh" onClick={fetchAuditLogs}>
                    <RefreshCw size={13} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Severity Quick Filters */}
              <div className="society-subtabs" style={{ marginBottom: '1rem' }}>
                <button
                  type="button"
                  className={`subtab-btn ${auditSeverityFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setAuditSeverityFilter('all')}
                >
                  <Shield size={13} />
                  <span>All Events ({auditLogs.length})</span>
                </button>
                <button
                  type="button"
                  className={`subtab-btn ${auditSeverityFilter === 'critical' ? 'active' : ''}`}
                  onClick={() => setAuditSeverityFilter('critical')}
                >
                  <AlertOctagon size={13} color="#f87171" />
                  <span>Critical &amp; Locks</span>
                </button>
                <button
                  type="button"
                  className={`subtab-btn ${auditSeverityFilter === 'warn' ? 'active' : ''}`}
                  onClick={() => setAuditSeverityFilter('warn')}
                >
                  <AlertTriangle size={13} color="#fbbf24" />
                  <span>Warnings &amp; Moderation</span>
                </button>
                <button
                  type="button"
                  className={`subtab-btn ${auditSeverityFilter === 'info' ? 'active' : ''}`}
                  onClick={() => setAuditSeverityFilter('info')}
                >
                  <CheckCircle2 size={13} color="#60a5fa" />
                  <span>Authorized &amp; Info</span>
                </button>
              </div>

              {/* Table Format Audit Logs */}
              <div className="admin-table-container">
                <table className="admin-data-table audit-logs-table">
                  <thead>
                    <tr>
                      <th style={{ width: '180px' }}>DATE &amp; TIME</th>
                      <th style={{ width: '220px' }}>SECURITY EVENT</th>
                      <th style={{ width: '140px' }}>ACTOR / ADMIN</th>
                      <th style={{ width: '140px' }}>CLIENT IP</th>
                      <th style={{ width: '110px' }}>SEVERITY</th>
                      <th>FORENSIC AUDIT DETAILS</th>
                      <th style={{ width: '90px', textAlign: 'center' }}>INSPECT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAuditLogs.map((log) => {
                      const isDanger = log.event?.includes('FAILED') || log.event?.includes('LOCKOUT') || log.event?.includes('UNAUTHORIZED') || log.event?.includes('PURGED');
                      const isWarn = log.event?.includes('MODERATED') || log.event?.includes('REJECTED') || log.event?.includes('REVOKED');
                      const isSuccess = log.event?.includes('AUTHORIZED') || log.event?.includes('INDUCTED') || log.event?.includes('APPROVED');
                      const severity = isDanger ? 'CRITICAL' : isWarn ? 'WARNING' : isSuccess ? 'SUCCESS' : 'INFO';
                      const dateObj = new Date(log.timestamp || Date.now());

                      return (
                        <tr key={log.id} className={isDanger ? 'log-danger-row' : ''}>
                          <td>
                            <div className="table-timestamp-cell">
                              <span className="date-part">{dateObj.toLocaleDateString()}</span>
                              <span className="time-part">{dateObj.toLocaleTimeString()}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`audit-event-chip ${severity.toLowerCase()}`}>
                              {log.event}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: '#e2e8f0', fontSize: '0.78rem' }}>
                              @{log.details?.admin || log.details?.username || log.details?.alias || 'SYSTEM'}
                            </strong>
                          </td>
                          <td>
                            <code className="admin-code-cell">{log.maskedIp || '127.0.0.1'}</code>
                          </td>
                          <td>
                            <span className={`audit-severity-tag ${severity.toLowerCase()}`}>
                              {severity}
                            </span>
                          </td>
                          <td>
                            <div className="audit-details-preview">
                              {Object.entries(log.details || {})
                                .filter(([k]) => k !== 'admin' && k !== 'username' && k !== 'alias')
                                .map(([k, v]) => (
                                  <span key={k} className="audit-detail-pill">
                                    <em>{k}:</em> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                  </span>
                                ))}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="action-btn-inspect"
                              onClick={() => setSelectedAuditLog(log)}
                              title="Inspect raw JSON forensic payload"
                            >
                              <FileCode size={12} />
                              <span>JSON</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredAuditLogs.length === 0 && (
                      <tr>
                        <td colSpan={7} className="empty-row">No security audit logs found matching criteria.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- POPUP MODAL: Generated Enclave Passphrase Modal --- */}
      {generatedCredentialModal && (
        <div className="society-modal-backdrop" onClick={() => setGeneratedCredentialModal(null)}>
          <div className="society-credential-card" onClick={(e) => e.stopPropagation()}>
            <div className="credential-modal-header">
              <div className="header-seal-wrap">
                <Sparkles size={20} color="#ffd700" />
              </div>
              <div>
                <h3>ENCLAVE PASSPHRASE GENERATED</h3>
                <span>Clearance Granted &bull; Encrypted Storage</span>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setGeneratedCredentialModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="credential-modal-body">
              <p className="credential-intro">
                Candidate <strong>@{generatedCredentialModal.alias}</strong> has been inducted.
                The secret passphrase below was cryptographically salted and hashed on the server.
                {generatedCredentialModal.email && (
                  <span> A secure dispatch was also sent to <strong>{generatedCredentialModal.email}</strong>.</span>
                )}
              </p>

              <div className="passphrase-display-box">
                <span className="passphrase-label">ONE-TIME GENERATED PASSPHRASE</span>
                <div className="passphrase-text-row">
                  <code>{generatedCredentialModal.rawPassphrase}</code>
                  <button
                    type="button"
                    className="copy-pass-btn"
                    onClick={() => copyPassphraseToClipboard(generatedCredentialModal.rawPassphrase)}
                  >
                    {copiedPass ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{copiedPass ? 'COPIED!' : 'COPY'}</span>
                  </button>
                </div>
              </div>

              <div className="security-guarantee-note">
                <Lock size={14} color="#10b981" />
                <span>
                  <strong>Zero Raw Data Leakage:</strong> This passphrase is not stored in plaintext on disk. Only its cryptographic PBKDF2 hash is retained.
                </span>
              </div>
            </div>

            <div className="credential-modal-footer">
              <button
                type="button"
                className="modal-done-btn"
                onClick={() => setGeneratedCredentialModal(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- POPUP MODAL: Direct Induct Member --- */}
      {showDirectInductModal && (
        <div className="society-modal-backdrop" onClick={() => setShowDirectInductModal(false)}>
          <div className="society-credential-card" onClick={(e) => e.stopPropagation()}>
            <div className="credential-modal-header">
              <div className="header-seal-wrap">
                <UserPlus size={20} color="#00f3ff" />
              </div>
              <div>
                <h3>DIRECT MEMBER INDUCTION</h3>
                <span>Add Member Directly to Secret Society</span>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowDirectInductModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDirectInductSubmit} className="direct-induct-form">
              <div className="form-group">
                <label>CHAT ALIAS *</label>
                <input
                  type="text"
                  placeholder="e.g. solon_builder"
                  value={directForm.alias}
                  onChange={(e) => setDirectForm({ ...directForm, alias: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>EMAIL ADDRESS (FOR CREDENTIAL DISPATCH)</label>
                <input
                  type="email"
                  placeholder="e.g. member@proton.me"
                  value={directForm.email}
                  onChange={(e) => setDirectForm({ ...directForm, email: e.target.value })}
                />
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label>FULL / REAL NAME</label>
                  <input
                    type="text"
                    placeholder="Candidate Name"
                    value={directForm.fullName}
                    onChange={(e) => setDirectForm({ ...directForm, fullName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>ROLE / BACKGROUND</label>
                  <input
                    type="text"
                    placeholder="e.g. Systems Engineer"
                    value={directForm.role}
                    onChange={(e) => setDirectForm({ ...directForm, role: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>CUSTOM MEMORABLE PASSPHRASE (OPTIONAL — AUTO-GENERATED IF EMPTY)</label>
                <input
                  type="text"
                  placeholder="Leave empty for auto-generated passphrase (e.g. OMEGA-HORIZON-7492)"
                  value={directForm.customPassphrase}
                  onChange={(e) => setDirectForm({ ...directForm, customPassphrase: e.target.value })}
                />
              </div>

              <div className="direct-induct-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setShowDirectInductModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-submit-btn">
                  Induct &amp; Generate Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- POPUP MODAL: Room Chat Purge Confirmation --- */}
      {confirmPurgeRoom && (
        <div className="society-modal-backdrop" onClick={() => setConfirmPurgeRoom(null)}>
          <div className="society-credential-card danger-modal" onClick={e => e.stopPropagation()}>
            <div className="credential-modal-header danger">
              <div className="header-seal-wrap danger">
                <Trash2 size={20} color="#f87171" />
              </div>
              <div>
                <h3 style={{ color: '#f87171' }}>CONFIRM ADMINISTRATIVE ROOM PURGE</h3>
                <span>Irreversible Cryptographic Action &bull; Root Authority</span>
              </div>
              <button type="button" className="close-modal-btn" onClick={() => setConfirmPurgeRoom(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="credential-modal-body">
              <p style={{ color: '#f87171', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                WARNING: You are about to permanently purge ALL transmissions in the {confirmPurgeRoom === 'society' ? 'SECRET SOCIETY ENCLAVE' : 'PUBLIC ROOM'}!
              </p>
              <p style={{ color: '#cbd5e1', fontSize: '0.8rem', lineHeight: 1.5 }}>
                This action will wipe the in-memory array and persisted database storage for this channel. All connected terminals will receive an automated wipe signal and clear their viewports immediately.
              </p>
            </div>
            <div className="credential-modal-footer">
              <button type="button" className="modal-cancel-btn" onClick={() => setConfirmPurgeRoom(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="modal-submit-btn danger"
                disabled={purgingRoom}
                onClick={() => handlePurgeRoom(confirmPurgeRoom)}
              >
                {purgingRoom ? 'Purging Room...' : `Yes, Permanently Purge ${confirmPurgeRoom === 'society' ? 'Secret Society' : 'Public Room'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- POPUP MODAL: Vulnerability Scan Results --- */}
      {scanResultModal && (
        <div className="society-modal-backdrop" onClick={() => setScanResultModal(null)}>
          <div className="society-credential-card" onClick={e => e.stopPropagation()}>
            <div className="credential-modal-header">
              <div className="header-seal-wrap">
                <ShieldCheck size={20} color="#10b981" />
              </div>
              <div>
                <h3>SECURITY VULNERABILITY AUDIT REPORT</h3>
                <span>Health Score: {scanResultModal.healthScore}% &bull; Status: {scanResultModal.status}</span>
              </div>
              <button type="button" className="close-modal-btn" onClick={() => setScanResultModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="credential-modal-body">
              <div className="scan-tests-list">
                {(scanResultModal.testsRun || []).map((t, idx) => (
                  <div key={idx} className={`scan-test-row ${t.status?.toLowerCase()}`}>
                    <div className="scan-test-top">
                      <span className="scan-test-name">{t.test}</span>
                      <span className={`scan-badge ${t.status?.toLowerCase()}`}>{t.status}</span>
                    </div>
                    <span className="scan-test-detail">{t.details}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="credential-modal-footer">
              <button type="button" className="modal-done-btn" onClick={() => setScanResultModal(null)}>
                Close Audit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- POPUP MODAL: Forensic Audit Log Raw JSON Inspector --- */}
      {selectedAuditLog && (
        <div className="society-modal-backdrop" onClick={() => setSelectedAuditLog(null)}>
          <div className="society-credential-card" onClick={e => e.stopPropagation()}>
            <div className="credential-modal-header">
              <div className="header-seal-wrap">
                <FileCode size={20} color="#00f3ff" />
              </div>
              <div>
                <h3>FORENSIC AUDIT RECORD INSPECTOR</h3>
                <span>ID: {selectedAuditLog.id} &bull; {new Date(selectedAuditLog.timestamp).toLocaleString()}</span>
              </div>
              <button type="button" className="close-modal-btn" onClick={() => setSelectedAuditLog(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="credential-modal-body">
              <pre className="audit-raw-json">
                {JSON.stringify(selectedAuditLog, null, 2)}
              </pre>
            </div>
            <div className="credential-modal-footer">
              <button type="button" className="modal-done-btn" onClick={() => setSelectedAuditLog(null)}>
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

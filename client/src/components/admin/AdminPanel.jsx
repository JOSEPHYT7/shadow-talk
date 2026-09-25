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
  ChevronRight
} from 'lucide-react';
import GeoGlobe3D from './GeoGlobe3D';
import './AdminPanel.css';

export function AdminPanel({
  adminToken,
  adminUsername,
  serverUrl,
  onClose,
  onLogout,
  onOpenSocietyChat
}) {
  const [activeTab, setActiveTab] = useState('telemetry'); // 'telemetry' | 'geo' | 'society' | 'users' | 'messages' | 'broadcast' | 'security'
  const [loading, setLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState(null);

  // Telemetry state
  const [telemetry, setTelemetry] = useState(null);

  // Users state
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  // Messages state
  const [messages, setMessages] = useState([]);
  const [msgSearch, setMsgSearch] = useState('');
  const [msgRoomFilter, setMsgRoomFilter] = useState('all');

  // Broadcast state
  const [bcastTitle, setBcastTitle] = useState('');
  const [bcastMessage, setBcastMessage] = useState('');
  const [bcastLevel, setBcastLevel] = useState('critical');
  const [bcastSending, setBcastSending] = useState(false);

  // Security audit logs state
  const [auditLogs, setAuditLogs] = useState([]);

  // Secret Society Induction & Members state
  const [societyApps, setSocietyApps] = useState([]);
  const [societyMembers, setSocietyMembers] = useState([]);
  const [societyWithdrawals, setSocietyWithdrawals] = useState([]);
  const [societySubTab, setSocietySubTab] = useState('applications'); // 'applications' | 'members' | 'withdrawals'
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

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/users`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {}
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/messages?limit=150`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch {}
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/audit-logs`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
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

  // Initial fetch and tab change polling
  useEffect(() => {
    if (activeTab === 'telemetry') fetchTelemetry();
    else if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'messages') fetchMessages();
    else if (activeTab === 'security') fetchAuditLogs();
    else if (activeTab === 'society') {
      fetchSocietyApps();
      fetchSocietyMembers();
      fetchSocietyWithdrawals();
    }
  }, [activeTab]);

  // Interval auto-refresh for telemetry
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeTab === 'telemetry') fetchTelemetry();
    }, 5000);
    return () => clearInterval(timer);
  }, [activeTab]);

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

  const handleDeleteMessage = async (msgId) => {
    try {
      const res = await fetch(`${serverUrl}/api/admin/dashboard/message/${msgId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        setMessages(messages.filter(m => String(m.id) !== String(msgId)));
        flashNotice(`Transmission ${msgId.slice(0, 8)}... deleted`);
      }
    } catch {}
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
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
          level: bcastLevel
        })
      });

      if (res.ok) {
        setBcastTitle('');
        setBcastMessage('');
        flashNotice('Administrative directive dispatched to all active terminals!');
      }
    } catch {}
    setBcastSending(false);
  };

  const handleTriggerNews = async () => {
    try {
      flashNotice('Triggering James autonomous news broadcast...');
      const res = await fetch(`${serverUrl}/api/admin/dashboard/james/trigger-news`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({})
      });
      if (res.ok) {
        flashNotice('News broadcast triggered successfully!');
        fetchTelemetry();
      }
    } catch {}
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
        fetchSocietyWithdrawals();
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

  const pendingApps = societyApps.filter(a => a.status === 'pending');
  const filteredApps = societyApps.filter((a) => {
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
  const filteredWithdrawals = societyWithdrawals.filter((w) => {
    if (!societySearch) return true;
    const q = societySearch.toLowerCase();
    return (
      (w.alias && w.alias.toLowerCase().includes(q)) ||
      (w.reason && w.reason.toLowerCase().includes(q))
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
            <span>Enclave Induction Council ({pendingApps.length + pendingWithdrawals.length})</span>
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
                        {telemetry?.jamesBot?.dailyNewsBroadcastsToday || 0} / {telemetry?.jamesBot?.dailyNewsQuota || 9} sent today
                      </span>
                    </div>

                    <button
                      type="button"
                      className="admin-btn-trigger-news"
                      onClick={handleTriggerNews}
                    >
                      <Zap size={14} />
                      <span>Trigger Autonomous News Dispatch</span>
                    </button>
                  </div>
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
                        <th>MEMBER ALIAS</th>
                        <th>FULL NAME</th>
                        <th>EMAIL</th>
                        <th>ROLE / RELAY</th>
                        <th>CLEARANCE</th>
                        <th>INDUCTED DATE</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <strong className="gold-text">@{m.alias}</strong>
                          </td>
                          <td>{m.fullName || '—'}</td>
                          <td>{m.email || '—'}</td>
                          <td>
                            <span>{m.role || 'Sovereign Inductee'}</span>
                            {m.location && <span className="sub-loc">({m.location})</span>}
                          </td>
                          <td>
                            <span className="badge-clearance">{m.clearance || 'LEVEL-4'}</span>
                          </td>
                          <td>{new Date(m.joinedAt).toLocaleDateString()}</td>
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
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>USER / CITIZEN</th>
                      <th>USER ID</th>
                      <th>STATUS</th>
                      <th>CLEARANCE</th>
                      <th>VERIFIED BADGE</th>
                      <th>ACTIONS</th>
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

          {/* TAB 5: TRANSMISSIONS MODERATION */}
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
                    {filteredMessages.length} TRANSMISSIONS
                  </span>
                  <button type="button" className="admin-btn-refresh" onClick={fetchMessages}>
                    <RefreshCw size={13} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Room Channel Filter */}
              <div className="society-subtabs" style={{ marginBottom: '1rem' }}>
                <button
                  type="button"
                  className={`subtab-btn ${msgRoomFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setMsgRoomFilter('all')}
                >
                  <MessageSquare size={13} />
                  <span>All Channels</span>
                </button>
                <button
                  type="button"
                  className={`subtab-btn ${msgRoomFilter === 'public' ? 'active' : ''}`}
                  onClick={() => setMsgRoomFilter('public')}
                >
                  <Globe size={13} />
                  <span>Public Room</span>
                </button>
                <button
                  type="button"
                  className={`subtab-btn ${msgRoomFilter === 'society' ? 'active' : ''}`}
                  onClick={() => setMsgRoomFilter('society')}
                >
                  <Lock size={13} color="#ffd700" />
                  <span>Secret Society Stream</span>
                </button>
              </div>

              <div className="messages-stream-list">
                {filteredMessages.map((m) => (
                  <div key={m.id} className="message-stream-item">
                    <div className="msg-meta-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span className="msg-author" style={{ color: m.color || '#00f3ff' }}>@{m.alias}</span>
                        {m.isSociety && <span className="member-chip" style={{ fontSize: '0.52rem' }}>SOCIETY</span>}
                      </div>
                      <span className="msg-time">{new Date(m.timestamp).toLocaleTimeString()}</span>
                      <span className="msg-id">ID: {String(m.id).slice(0, 10)}...</span>
                      <button
                        type="button"
                        className="btn-delete-msg"
                        onClick={() => handleDeleteMessage(m.id)}
                        title="Delete transmission from chat"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                    <div className="msg-content-text">{m.text}</div>
                    {m.fileUrl && (
                      <div className="msg-attachment-info">
                        <span>Attachment: {m.fileName || m.fileUrl}</span>
                      </div>
                    )}
                  </div>
                ))}
                {filteredMessages.length === 0 && (
                  <div className="empty-messages-notice">No transmissions matching search filter.</div>
                )}
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
                  Broadcast high-priority emergency notifications to all connected terminals worldwide with real-time audio chime and prominent banners.
                </p>

                <form className="broadcast-form" onSubmit={handleSendBroadcast}>
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
                    <label>BROADCAST MESSAGE CONTENT *</label>
                    <textarea
                      rows={4}
                      placeholder="Enter the official administrative instruction dispatched directly into the chat room..."
                      value={bcastMessage}
                      onChange={(e) => setBcastMessage(e.target.value)}
                      required
                    />
                  </div>

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

                  {/* Live Directive Preview Banner */}
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
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="admin-btn-broadcast-submit"
                    disabled={bcastSending || !bcastMessage.trim()}
                  >
                    <Send size={14} />
                    <span>{bcastSending ? 'Transmitting...' : 'Dispatch Priority Directive to Room'}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 7: SECURITY AUDIT LOGS */}
          {activeTab === 'security' && (
            <div className="admin-security-view">
              <div className="view-toolbar">
                <div className="security-summary-badge">
                  <Shield size={13} />
                  <span>AUDIT LOG STREAM & BRUTE-FORCE DEFENSE</span>
                </div>
                <button type="button" className="admin-btn-refresh" onClick={fetchAuditLogs}>
                  <RefreshCw size={13} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="admin-logs-stream">
                {auditLogs.map((log) => {
                  const isWarning = log.event.includes('FAILED') || log.event.includes('LOCKOUT') || log.event.includes('UNAUTHORIZED');
                  return (
                    <div key={log.id} className={`audit-log-entry ${isWarning ? 'warning-entry' : ''}`}>
                      <div className="log-entry-header">
                        <span className="log-timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className={`log-event-tag ${isWarning ? 'warn' : 'info'}`}>
                          {log.event}
                        </span>
                        <span className="log-masked-ip">IP: {log.maskedIp}</span>
                      </div>
                      <div className="log-details-json">
                        <code>{JSON.stringify(log.details)}</code>
                      </div>
                    </div>
                  );
                })}
                {auditLogs.length === 0 && (
                  <div className="empty-stream-notice">No security audit logs recorded yet.</div>
                )}
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
    </div>
  );
}

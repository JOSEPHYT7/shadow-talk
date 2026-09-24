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
  Globe
} from 'lucide-react';
import './AdminPanel.css';

export function AdminPanel({ adminToken, adminUsername, serverUrl, onClose, onLogout }) {
  const [activeTab, setActiveTab] = useState('telemetry'); // 'telemetry' | 'users' | 'messages' | 'broadcast' | 'security'
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

  // Broadcast state
  const [bcastTitle, setBcastTitle] = useState('');
  const [bcastMessage, setBcastMessage] = useState('');
  const [bcastLevel, setBcastLevel] = useState('critical');
  const [bcastSending, setBcastSending] = useState(false);

  // Security audit logs state
  const [auditLogs, setAuditLogs] = useState([]);

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

  // Initial fetch and tab change polling
  useEffect(() => {
    if (activeTab === 'telemetry') fetchTelemetry();
    else if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'messages') fetchMessages();
    else if (activeTab === 'security') fetchAuditLogs();
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
        fetchUsers();
        flashNotice(`Verification ${!currentStatus ? 'granted' : 'revoked'} for @${alias}`);
      }
    } catch {}
  };

  const handleKickUser = async (userId, alias) => {
    if (!window.confirm(`Disconnect active sockets for @${alias}?`)) return;
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
        const data = await res.json();
        fetchUsers();
        flashNotice(`Kicked ${data.kickedSockets} sockets for @${alias}`);
      }
    } catch {}
  };

  const handleDeleteUser = async (userId, alias) => {
    if (!window.confirm(`Permanently wipe profile records for @${alias}? This cannot be undone.`)) return;
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
        fetchUsers();
        flashNotice(`Purged @${alias} from registry`);
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
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
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
    if (!msgSearch) return true;
    const q = msgSearch.toLowerCase();
    return (
      (m.text && m.text.toLowerCase().includes(q)) ||
      (m.alias && m.alias.toLowerCase().includes(q))
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
                      <span className="stat-num">{telemetry?.memory?.systemFreeMb || 0} MB / {telemetry?.memory?.systemTotalMb || 0} MB</span>
                    </div>
                    <div className="stat-progress-bar">
                      <div
                        className="progress-fill purple"
                        style={{
                          width: `${Math.min(100, Math.round(((telemetry?.memory?.systemFreeMb || 1) / (telemetry?.memory?.systemTotalMb || 1)) * 100))}%`
                        }}
                      />
                    </div>

                    <div className="stat-line">
                      <span>CPU Architecture:</span>
                      <span className="stat-num">{telemetry?.platform || 'Node'} ({telemetry?.arch || 'x64'}, {telemetry?.cpuCount || 1} Cores)</span>
                    </div>
                  </div>
                </div>

                {/* James AI Agent Diagnostics */}
                <div className="telemetry-card">
                  <div className="card-header">
                    <Radio size={14} />
                    <h4>JAMES AUTONOMOUS AGENT</h4>
                  </div>
                  <div className="james-diagnostics-box">
                    <div className="james-status-row">
                      <span className="james-active-badge">AI CORE ACTIVE</span>
                      <span className="james-model-tag">{telemetry?.jamesBot?.model || 'deepseek/deepseek-v4-flash'}</span>
                    </div>

                    <p className="james-desc">
                      Autonomous community agent monitoring chat velocity, executing user requests, and broadcasting daily verified worldwide news dispatches.
                    </p>

                    {telemetry?.jamesBot?.dailyStats && (
                      <div className="james-stats-pill">
                        <span>Daily News Quota:</span>
                        <strong>{telemetry.jamesBot.dailyStats.count} / {telemetry.jamesBot.dailyStats.targetToday} sent today</strong>
                      </div>
                    )}

                    <button
                      type="button"
                      className="admin-btn-action"
                      onClick={handleTriggerNews}
                    >
                      <Zap size={13} />
                      <span>Trigger Autonomous News Dispatch</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IDENTITY & ACCESS CONTROL */}
          {activeTab === 'users' && (
            <div className="admin-users-view">
              <div className="view-toolbar">
                <div className="search-input-wrapper">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Search by alias, userId, or status..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="admin-search-field"
                  />
                </div>
                <button type="button" className="admin-btn-refresh" onClick={fetchUsers}>
                  <RefreshCw size={13} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="admin-table-container">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>MEMBER</th>
                      <th>USER ID</th>
                      <th>CONNECTION</th>
                      <th>VERIFIED BADGE</th>
                      <th>BIO / ROLE</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, idx) => (
                      <tr key={idx} className={u.isCurrentlyConnected ? 'online-row' : ''}>
                        <td>
                          <div className="user-cell">
                            <span className="user-color-dot" style={{ background: u.color || '#00f3ff' }} />
                            <strong className="user-alias-text">@{u.alias}</strong>
                            {u.isVerified && <span className="verified-micro-tag">✓</span>}
                          </div>
                        </td>
                        <td>
                          <code className="admin-code-cell">{u.userId}</code>
                        </td>
                        <td>
                          {u.isCurrentlyConnected ? (
                            <span className="badge-online">ONLINE ({u.activeSocketsCount} sock)</span>
                          ) : (
                            <span className="badge-offline">OFFLINE</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`badge-toggle-btn ${u.isVerified ? 'verified' : 'unverified'}`}
                            onClick={() => handleToggleVerify(u.userId, u.alias, u.isVerified)}
                            title="Toggle official verification status"
                          >
                            {u.isVerified ? 'VERIFIED ✓' : 'UNVERIFIED'}
                          </button>
                        </td>
                        <td>
                          <span className="user-bio-preview">{u.bio || 'Encrypted mesh developer'}</span>
                        </td>
                        <td>
                          <div className="actions-cluster">
                            {u.isCurrentlyConnected && (
                              <button
                                type="button"
                                className="action-btn-warn"
                                onClick={() => handleKickUser(u.userId, u.alias)}
                                title="Disconnect active socket connections"
                              >
                                Kick
                              </button>
                            )}
                            <button
                              type="button"
                              className="action-btn-danger"
                              onClick={() => handleDeleteUser(u.userId, u.alias)}
                              title="Delete user profile"
                            >
                              Purge
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="empty-table-cell">
                          No matching user profiles found in registry.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TRANSMISSIONS FEED & MODERATION */}
          {activeTab === 'messages' && (
            <div className="admin-messages-view">
              <div className="view-toolbar">
                <div className="search-input-wrapper">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Search transmission text or alias..."
                    value={msgSearch}
                    onChange={(e) => setMsgSearch(e.target.value)}
                    className="admin-search-field"
                  />
                </div>
                <button type="button" className="admin-btn-refresh" onClick={fetchMessages}>
                  <RefreshCw size={13} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="admin-messages-stream">
                {filteredMessages.slice().reverse().map((m) => (
                  <div key={m.id} className="admin-msg-card">
                    <div className="msg-card-top">
                      <div className="msg-author-meta">
                        <strong style={{ color: m.color || '#00f3ff' }}>@{m.alias}</strong>
                        <span className="msg-timestamp">
                          {new Date(m.timestamp).toLocaleTimeString()} &bull; {new Date(m.timestamp).toLocaleDateString()}
                        </span>
                        <code className="msg-id-code">{String(m.id).slice(0, 16)}</code>
                      </div>
                      <button
                        type="button"
                        className="msg-delete-btn"
                        onClick={() => handleDeleteMessage(m.id)}
                        title="Delete transmission"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>

                    <p className="msg-body-preview">{m.text}</p>

                    {m.fileUrl && (
                      <div className="msg-attachment-pill">
                        <span>ATTACHMENT: {m.fileName || m.fileUrl}</span>
                      </div>
                    )}
                  </div>
                ))}
                {filteredMessages.length === 0 && (
                  <div className="empty-stream-notice">No transmissions matching search filter.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EMERGENCY PRIORITY DIRECTIVE */}
          {activeTab === 'broadcast' && (
            <div className="admin-broadcast-view">
              <div className="broadcast-card">
                <div className="card-header">
                  <AlertTriangle size={15} className="broadcast-warn-icon" />
                  <h4>EMERGENCY ADMINISTRATIVE DIRECTIVE</h4>
                </div>
                <p className="card-subtext">
                  Dispatches an official, high-priority system transmission to every connected Shadow Talk terminal.
                </p>

                <form onSubmit={handleSendBroadcast} className="admin-broadcast-form">
                  <div className="form-group">
                    <label>DIRECTIVE TITLE</label>
                    <input
                      type="text"
                      placeholder="e.g. CRITICAL NETWORK MAINTENANCE // PROTOCOL ZERO"
                      value={bcastTitle}
                      onChange={(e) => setBcastTitle(e.target.value)}
                      className="admin-input-dark"
                    />
                  </div>

                  <div className="form-group">
                    <label>ALERT LEVEL</label>
                    <div className="level-selector-row">
                      {['info', 'alert', 'critical'].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          className={`level-pill-btn ${lvl} ${bcastLevel === lvl ? 'active' : ''}`}
                          onClick={() => setBcastLevel(lvl)}
                        >
                          {lvl.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>DIRECTIVE CONTENT</label>
                    <textarea
                      rows={5}
                      placeholder="Enter the transmission text to broadcast to all terminals..."
                      value={bcastMessage}
                      onChange={(e) => setBcastMessage(e.target.value)}
                      className="admin-textarea-dark"
                      required
                    />
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

          {/* TAB 5: SECURITY AUDIT LOGS */}
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
    </div>
  );
}

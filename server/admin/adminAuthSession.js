/**
 * Admin Authentication Session Manager & Anti-Brute-Force Engine
 * Manages temporary multi-stage verification sessions, rate limiting, and session tokens.
 */

const crypto = require('crypto');
const { ADMIN_CONFIG } = require('./adminConfig');

// In-memory active verification sessions: sessionId -> session object
const activeSessions = new Map();

// In-memory active authenticated admin sessions: token -> admin session object
const activeAdminSessions = new Map();

// Rate-limiting and attempt tracking per IP: ip -> { count, lockedUntil, attempts: [] }
const ipAttemptTracker = new Map();

// In-memory audit log for security telemetry (capped at 250 items)
const auditLogs = [];

function maskIp(ip) {
  if (!ip || typeof ip !== 'string') return 'unknown';
  if (ip.includes(':')) {
    // IPv6
    const parts = ip.split(':');
    return parts.slice(0, 3).join(':') + ':****';
  }
  // IPv4
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }
  return ip.slice(0, 4) + '***';
}

function logAuditEvent(event, details = {}, ip = 'unknown') {
  const entry = {
    id: 'sec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    timestamp: Date.now(),
    event,
    maskedIp: maskIp(ip),
    details
  };
  auditLogs.unshift(entry);
  if (auditLogs.length > 250) {
    auditLogs.pop();
  }
  console.log(`[AdminSecurityAudit] [${event}] ${JSON.stringify(details)} from ${maskIp(ip)}`);
}

function getClientIp(req) {
  if (!req) return '127.0.0.1';
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.socket?.remoteAddress ||
         '127.0.0.1';
}

// Anti-Brute-Force check
function isRateLimited(ip) {
  const cleanIp = String(ip || '').replace(/^::ffff:/, '').trim();
  // Never lock out local development loopback
  if (cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost' || cleanIp === '') {
    return false;
  }

  const record = ipAttemptTracker.get(cleanIp);
  if (!record) return false;

  const now = Date.now();
  if (record.lockedUntil && record.lockedUntil > now) {
    return true;
  }

  // Clear expired lockout
  if (record.lockedUntil && record.lockedUntil <= now) {
    record.lockedUntil = null;
    record.count = 0;
  }

  // Filter out attempts older than lockout window
  const windowStart = now - ADMIN_CONFIG.lockoutDurationMs;
  record.attempts = (record.attempts || []).filter(t => t > windowStart);
  record.count = record.attempts.length;

  return record.count >= ADMIN_CONFIG.maxFailedAttempts;
}

function recordFailedAttempt(ip, reason = 'Verification failure') {
  const cleanIp = String(ip || '').replace(/^::ffff:/, '').trim();
  if (cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost' || cleanIp === '') {
    logAuditEvent('AUTH_ATTEMPT_FAILED', { reason, localDev: true }, cleanIp);
    return;
  }

  const now = Date.now();
  let record = ipAttemptTracker.get(cleanIp);
  if (!record) {
    record = { count: 0, lockedUntil: null, attempts: [] };
    ipAttemptTracker.set(cleanIp, record);
  }

  record.attempts.push(now);
  record.count = record.attempts.length;

  if (record.count >= ADMIN_CONFIG.maxFailedAttempts) {
    record.lockedUntil = now + ADMIN_CONFIG.lockoutDurationMs;
    logAuditEvent('SECURITY_LOCKOUT_TRIGGERED', {
      failedCount: record.count,
      lockoutMinutes: Math.round(ADMIN_CONFIG.lockoutDurationMs / 60000)
    }, ip);
  } else {
    logAuditEvent('AUTH_ATTEMPT_FAILED', {
      attemptNumber: record.count,
      maxAllowed: ADMIN_CONFIG.maxFailedAttempts,
      reason
    }, ip);
  }
}

function clearFailedAttempts(ip) {
  ipAttemptTracker.delete(ip);
}

// Generate an HMAC signature for a session
function signSessionPayload(sessionId, stage, expiresAt) {
  const data = `${sessionId}:${stage}:${expiresAt}`;
  return crypto.createHmac('sha256', ADMIN_CONFIG.sessionSecret).update(data).digest('hex');
}

// Create a temporary authentication flow session
function createTemporarySession(ip, clientNonce = '', socketId = null) {
  if (isRateLimited(ip)) {
    return { error: 'Rate limit active', locked: true };
  }

  const now = Date.now();
  const sessionId = 'asess_' + crypto.randomBytes(16).toString('hex');
  const expiresAt = now + ADMIN_CONFIG.sessionTtlMs;
  const stage = 'INITIATED';
  const token = signSessionPayload(sessionId, stage, expiresAt);

  const session = {
    sessionId,
    stage,
    ip,
    socketId: socketId || null,
    clientNonce: clientNonce || null,
    createdAt: now,
    lastActivityAt: now,
    expiresAt,
    token,
    senderAlias: null,
    senderUserId: null
  };

  activeSessions.set(sessionId, session);

  logAuditEvent('AUTH_FLOW_INITIATED', { sessionId: sessionId.slice(0, 10) + '...' }, ip);
  return { success: true, sessionId, sessionToken: token, expiresAt };
}

function getSession(sessionId) {
  if (!sessionId) return null;
  const session = activeSessions.get(sessionId);
  if (!session) return null;

  const now = Date.now();
  // Check global session expiry
  if (now > session.expiresAt) {
    activeSessions.delete(sessionId);
    return null;
  }

  // Check stage inactivity timeout
  if (now - session.lastActivityAt > ADMIN_CONFIG.stageInactivityTtlMs) {
    activeSessions.delete(sessionId);
    return null;
  }

  return session;
}

function verifySessionToken(session, token) {
  if (!session || !token) return false;
  const expected = signSessionPayload(session.sessionId, session.stage, session.expiresAt);
  try {
    const a = Buffer.from(token, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function advanceSessionStage(session, nextStage) {
  session.stage = nextStage;
  session.lastActivityAt = Date.now();
  session.token = signSessionPayload(session.sessionId, nextStage, session.expiresAt);
  return session.token;
}

function invalidateSession(sessionId) {
  if (sessionId && activeSessions.has(sessionId)) {
    activeSessions.delete(sessionId);
  }
}

// Create verified long-lived Administrator session
function createAdminSession(username, ip) {
  const now = Date.now();
  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = now + ADMIN_CONFIG.adminSessionDurationMs;

  const signature = crypto.createHmac('sha256', ADMIN_CONFIG.sessionSecret)
    .update(`${username}:${rawToken}:${expiresAt}`)
    .digest('hex');

  const adminToken = `${rawToken}.${expiresAt}.${signature}`;

  const adminSession = {
    username,
    token: adminToken,
    createdAt: now,
    expiresAt,
    ip,
    maskedIp: maskIp(ip)
  };

  activeAdminSessions.set(adminToken, adminSession);
  clearFailedAttempts(ip);

  logAuditEvent('ADMIN_SESSION_AUTHORIZED', { username }, ip);
  return { adminToken, expiresAt };
}

function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [rawToken, expiresAtStr, signature] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);

  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    activeAdminSessions.delete(token);
    return null;
  }

  const session = activeAdminSessions.get(token);
  if (!session) return null;

  const expectedSig = crypto.createHmac('sha256', ADMIN_CONFIG.sessionSecret)
    .update(`${session.username}:${rawToken}:${expiresAt}`)
    .digest('hex');

  try {
    const a = Buffer.from(signature, 'hex');
    const b = Buffer.from(expectedSig, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }
  } catch {
    return null;
  }

  return session;
}

function revokeAdminSession(token) {
  if (token && activeAdminSessions.has(token)) {
    const s = activeAdminSessions.get(token);
    activeAdminSessions.delete(token);
    logAuditEvent('ADMIN_SESSION_REVOKED', { username: s?.username }, s?.ip);
    return true;
  }
  return false;
}

function getAuditLogs() {
  return auditLogs.slice(0, 100);
}

// Periodic cleanup of expired sessions every 2 minutes
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [id, s] of activeSessions.entries()) {
    if (now > s.expiresAt || (now - s.lastActivityAt > ADMIN_CONFIG.stageInactivityTtlMs)) {
      activeSessions.delete(id);
    }
  }
  for (const [token, s] of activeAdminSessions.entries()) {
    if (now > s.expiresAt) {
      activeAdminSessions.delete(token);
    }
  }
}, 2 * 60 * 1000);
if (cleanupTimer && typeof cleanupTimer.unref === 'function') {
  cleanupTimer.unref();
}

module.exports = {
  createTemporarySession,
  getSession,
  verifySessionToken,
  advanceSessionStage,
  invalidateSession,
  createAdminSession,
  verifyAdminToken,
  revokeAdminSession,
  isRateLimited,
  recordFailedAttempt,
  getClientIp,
  logAuditEvent,
  getAuditLogs,
  activeSessions
};

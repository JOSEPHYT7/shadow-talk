// Automatically load environment variables from .env if present
const dns = require('dns');
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  } else {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const k = trimmed.slice(0, eqIdx).trim();
            const v = trimmed.slice(eqIdx + 1).trim();
            if (!process.env[k]) process.env[k] = v;
          }
        }
      });
    }
  }
} catch (e) {
  console.warn('[Server Env]: Could not load .env file:', e.message);
}

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Security & Defense Middlewares
const {
  globalApiLimiter,
  authLimiter,
  otpSendLimiter,
  proxyLimiter
} = require('./middleware/rateLimiter');
const { sanitizeInputMiddleware } = require('./middleware/sanitizeInput');
const { validateSafeExternalUrl } = require('./utils/ssrfGuard');
const { verifyAdminToken } = require('./admin/adminAuthSession');

// Utility to safely delete an uploaded file from disk
function deleteUploadedFile(fileUrl) {
  if (!fileUrl || typeof fileUrl !== 'string') return;
  try {
    const match = fileUrl.match(/\/uploads\/([^/?#]+)/);
    if (match && match[1]) {
      const filename = path.basename(match[1]);
      const fullPath = path.join(__dirname, 'uploads', filename);
      if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (err) => {
          if (err) console.error(`[Delete Error] Failed to delete ${filename}:`, err);
          else console.log(`[Deleted File] Cleaned up ${filename}`);
        });
      }
    }
  } catch (e) {
    console.error('[Delete Error]', e);
  }
}

const app = express();
const server = http.createServer(app);

// Whitelist authorized origins
const normalizeOrigin = (url) => {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/\/+$/, '').toLowerCase();
};

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://shadow-talk-ten.vercel.app',
  'https://shadow-talk.vercel.app',
  'https://shadow-talk-kryk.onrender.com'
];

const envAllowedOrigins = [
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(normalizeOrigin) : []),
  ...(process.env.CLIENT_URL ? [normalizeOrigin(process.env.CLIENT_URL)] : [])
].filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins.map(normalizeOrigin), ...envAllowedOrigins]));

const checkCorsOrigin = (origin, callback) => {
  // Allow requests with no origin (e.g. mobile apps, curl, same-origin, server-to-server)
  if (!origin) return callback(null, true);

  const cleanOrigin = normalizeOrigin(origin);

  // 1. Check exact match in configured whitelist or wildcard '*'
  if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes('*')) {
    return callback(null, true);
  }

  // 2. Allow any localhost / 127.0.0.1 on any port (HTTP or HTTPS)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) {
    return callback(null, true);
  }

  // 3. Allow Vercel deployments (production domain, custom subdomains, preview branch deployments)
  if (/^https:\/\/[a-z0-9_-]+\.vercel\.app$/.test(cleanOrigin)) {
    return callback(null, true);
  }

  // 4. Allow Render deployments (backend & frontend)
  if (/^https:\/\/[a-z0-9_-]+\.onrender\.com$/.test(cleanOrigin)) {
    return callback(null, true);
  }

  // 5. Allow hybrid/mobile app schemes (Capacitor, Ionic, Electron, Android/iOS WebViews, file:)
  if (/^(capacitor|ionic|file):\/\//i.test(cleanOrigin) || cleanOrigin === 'null') {
    return callback(null, true);
  }

  // Deny gracefully without throwing an unhandled 500 error in Express
  console.warn(`[CORS Blocked]: Origin '${origin}' is not authorized.`);
  return callback(null, false);
};

// Configure Socket.io with strict CORS and robust buffers
const io = new Server(server, {
  cors: {
    origin: checkCorsOrigin,
    credentials: true,
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 5e7, // 50 MB
  pingInterval: 25000,
  pingTimeout: 30000
});

// Disable Express fingerprinting header
app.disable('x-powered-by');

// Configure CORS to support credentialed cross-origin requests from whitelisted origins
const corsOptions = {
  origin: checkCorsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'x-requested-with',
    'x-cli-secret',
    'Accept',
    'Origin',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Global HTTP Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=(self)');
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});

// Scalable body limits & input sanitization
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(sanitizeInputMiddleware);

// Mount global rate limiter on all API routes
app.use('/api', globalApiLimiter);

// Secure static uploads with execution defense and dotfile prevention
app.use('/uploads', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const ext = path.extname(req.path).toLowerCase();
  if (['.html', '.htm', '.xhtml', '.svg', '.xml', '.shtml'].includes(ext)) {
    res.setHeader('Content-Disposition', 'attachment');
  }
  next();
}, express.static(path.join(__dirname, 'uploads'), { dotfiles: 'ignore' }));

// Health check endpoint (used by 24/7 James keep-alive heartbeat)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    jamesActive: true,
    activeConnections: io.engine.clientsCount
  });
});

const uploadRouter = require('./upload');
const { cleanupUploads, cleanupMessages } = require('./cleanup');
const { JamesBot } = require('./jamesBot');
const { startKeepAlive } = require('./keepAlive');

// Persistent Message Store (backed by server/data/messages.json)
const messagesFilePath = path.join(__dirname, 'data', 'messages.json');

function loadMessages() {
  try {
    if (fs.existsSync(messagesFilePath)) {
      const raw = fs.readFileSync(messagesFilePath, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error('[Messages Storage]: Failed to load messages.json:', e.message);
  }
  return [];
}

function saveMessages(msgs) {
  try {
    const dir = path.dirname(messagesFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(messagesFilePath, JSON.stringify(msgs, null, 2), 'utf8');
  } catch (e) {
    console.error('[Messages Storage]: Failed to save messages.json:', e.message);
  }
}

const messages = loadMessages();

// Upload route
app.use('/upload', uploadRouter);

// --- Real Email OTP Verification Endpoints ---
const { sendOtp, verifyOtp, updateEmailConfig, isConfigured } = require('./otpService');

app.get('/api/otp/status', (req, res) => {
  const rawEmail = process.env.EMAIL_USER || '';
  let maskedEmail = null;
  if (rawEmail && rawEmail.includes('@')) {
    const [user, domain] = rawEmail.split('@');
    maskedEmail = user.slice(0, 2) + '***@' + domain;
  }
  res.json({
    configured: isConfigured(),
    emailUser: maskedEmail
  });
});

app.post('/api/otp/send', otpSendLimiter, async (req, res) => {
  try {
    const { email } = req.body || {};
    const result = await sendOtp(email);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/otp/verify', (req, res) => {
  try {
    const { email, otp, alias, userId } = req.body || {};
    const result = verifyOtp(email, otp);
    if (result.verified && (alias || userId)) {
      io.emit('userVerified', { alias, email: result.email, isVerified: true });
      const existing = getOrCreateProfile(userId, alias) || { alias, userId };
      existing.isVerified = true;
      saveProfile(existing);
      io.emit('userProfileUpdated', existing);
    }
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/otp/config', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';
  if (!token || !verifyAdminToken(token)) {
    return res.status(403).json({ success: false, error: 'Unauthorized: Admin authentication required to configure mail credentials.' });
  }

  try {
    const { emailUser, appPassword } = req.body || {};
    const result = updateEmailConfig(emailUser, appPassword);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// --- Secret Society Membership Application Endpoints ---
const { submitApplication, loadApplications } = require('./membershipService');

app.post('/api/membership/apply', async (req, res) => {
  try {
    const result = await submitApplication(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/membership/applications', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';
  if (!token || !verifyAdminToken(token)) {
    return res.status(403).json({ error: 'Unauthorized: Admin authentication required to inspect membership applications.' });
  }
  res.json(loadApplications());
});

// --- Secret Society Verification & Messages API ---
const {
  verifyMemberLogin,
  validateSocietyToken,
  loadSocietyMessages,
  saveSocietyMessages,
  submitWithdrawalRequest,
  submitNameChangeRequest,
  loadNameChangeRequests,
  loadMembers
} = require('./services/secretSocietyService');
const { EnclaveIntelligenceService } = require('./services/enclaveIntelligenceService');
const enclaveIntel = new EnclaveIntelligenceService();

app.post('/api/membership/withdraw-request', (req, res) => {
  try {
    const { alias, userId, reason } = req.body || {};
    const result = submitWithdrawalRequest({ alias, userId, reason });
    io.emit('adminNotice', {
      type: 'SOCIETY_WITHDRAWAL_REQUESTED',
      alias,
      reason,
      timestamp: Date.now()
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Name Change Request endpoint for verified members
app.post('/api/membership/name-change-request', (req, res) => {
  try {
    const { alias, userId, requestedAlias, reason } = req.body || {};
    const result = submitNameChangeRequest({ alias, userId, requestedAlias, reason });
    io.emit('adminNotice', {
      type: 'SOCIETY_NAME_CHANGE_REQUESTED',
      alias,
      requestedAlias,
      reason,
      timestamp: Date.now()
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/membership/name-change-request/status', (req, res) => {
  try {
    const { userId, alias } = req.query || {};
    const list = loadNameChangeRequests();
    const cleanAlias = (alias || '').trim().replace(/^@/, '').toLowerCase();
    const pending = list.find(r =>
      ((userId && r.userId === userId) || (cleanAlias && r.currentAlias.toLowerCase() === cleanAlias)) &&
      r.status === 'pending'
    );
    res.json({ pending: pending || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/secret-society/verify', (req, res) => {
  const { alias, password, passphrase } = req.body || {};
  const result = verifyMemberLogin(alias, password || passphrase);
  if (result.success) {
    res.json(result);
  } else {
    res.status(401).json(result);
  }
});

app.get('/api/secret-society/messages', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const societyToken = req.headers['x-society-token'] || token;

  const validSociety = validateSocietyToken(societyToken);
  let validAdmin = false;
  try {
    const { verifyAdminToken } = require('./admin/adminAuthSession');
    if (token && verifyAdminToken(token)) validAdmin = true;
  } catch {}

  if (!validSociety && !validAdmin) {
    return res.status(403).json({ error: 'Access denied: Valid Secret Society clearance required' });
  }

  res.json(loadSocietyMessages());
});

// Serve sitemap.xml and robots.txt
app.get('/sitemap.xml', (req, res) => {
  const sitemapPath = path.join(__dirname, '..', 'client', 'public', 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    res.type('application/xml');
    res.sendFile(sitemapPath);
  } else {
    res.status(404).send('Sitemap not found');
  }
});

app.get('/robots.txt', (req, res) => {
  const robotsPath = path.join(__dirname, '..', 'client', 'public', 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    res.type('text/plain');
    res.sendFile(robotsPath);
  } else {
    res.status(404).send('Robots.txt not found');
  }
});

// Track connected socket users: socketId -> { alias, userId }
const activeUsers = new Map();

// Track live active secret society sockets: socketId -> { alias, clearance, isAdmin }
const activeSocietyMembers = new Map();

// Track known user profiles: userId / alias (lowercased) -> profile
const userProfiles = new Map();
const DATA_DIR = path.join(__dirname, 'data');
const PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');
const serverStartTime = Date.now();

const isCreatorAlias = (alias) => {
  if (!alias || typeof alias !== 'string') return false;
  const lower = alias.trim().toLowerCase();
  return lower === 'joseph_creator' || lower === 'joseph';
};

function loadProfiles() {
  try {
    if (fs.existsSync(PROFILES_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf-8'));
      for (const [id, p] of Object.entries(data)) {
        if (p && (p.userId || p.alias)) {
          if (p.alias && isCreatorAlias(p.alias)) continue;
          if (p.userId) userProfiles.set(p.userId, p);
          if (p.alias) userProfiles.set(p.alias.toLowerCase(), p);
        }
      }
    }
  } catch (err) {
    console.error('Error loading profiles.json:', err.message);
  }

  // Pre-seed known users from messages and james_memory so server restarts never re-welcome them
  try {
    if (Array.isArray(messages)) {
      for (const m of messages) {
        if (m && m.alias && m.alias !== 'James' && m.alias !== 'System' && !isCreatorAlias(m.alias)) {
          const lower = m.alias.toLowerCase();
          let p = getOrCreateProfile(m.userId, m.alias);
          if (!p) {
            p = {
              alias: m.alias,
              userId: m.userId || ('usr_' + lower),
              welcomed: true,
              isOnline: false,
              status: 'Offline',
              createdAt: m.timestamp || Date.now(),
              updatedAt: Date.now()
            };
            if (p.userId) userProfiles.set(p.userId, p);
            userProfiles.set(lower, p);
          } else {
            p.welcomed = true;
          }
        }
      }
    }
  } catch (e) {}

  // Also pre-seed from james_memory.json
  try {
    const memFile = path.join(DATA_DIR, 'james_memory.json');
    if (fs.existsSync(memFile)) {
      const memData = JSON.parse(fs.readFileSync(memFile, 'utf-8'));
      if (memData && Array.isArray(memData.users)) {
        for (const u of memData.users) {
          if (u && (u.alias || u.userId)) {
            let p = getOrCreateProfile(u.userId, u.alias);
            if (!p) {
              const lower = (u.alias || '').toLowerCase();
              p = {
                alias: u.alias || 'User',
                userId: u.userId || ('usr_' + lower),
                welcomed: true,
                isOnline: false,
                status: 'Offline',
                createdAt: u.lastSeen || Date.now(),
                updatedAt: Date.now()
              };
              if (p.userId) userProfiles.set(p.userId, p);
              if (lower) userProfiles.set(lower, p);
            } else {
              p.welcomed = true;
            }
          }
        }
      }
    }
  } catch (e) {}
}

let saveProfilesTimeout = null;
function persistProfiles() {
  if (saveProfilesTimeout) clearTimeout(saveProfilesTimeout);
  saveProfilesTimeout = setTimeout(() => {
    try {
      const exportObj = {};
      for (const p of userProfiles.values()) {
        if (p && p.userId) {
          if (p.alias && isCreatorAlias(p.alias)) continue;
          exportObj[p.userId] = p;
        }
      }
      fs.writeFileSync(PROFILES_FILE, JSON.stringify(exportObj, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing profiles.json:', err.message);
    }
  }, 300);
}

function getOrCreateProfile(userId, alias) {
  if (userId && userProfiles.has(userId)) return userProfiles.get(userId);
  if (alias && userProfiles.has(alias.toLowerCase())) return userProfiles.get(alias.toLowerCase());
  if (alias) {
    const lower = alias.toLowerCase();
    for (const p of userProfiles.values()) {
      if (p.alias && p.alias.toLowerCase() === lower) return p;
      if (p.previousAliases && p.previousAliases.some(a => a.toLowerCase() === lower)) return p;
    }
  }
  return null;
}

function saveProfile(profile) {
  if (!profile) return;
  if (profile.alias && isCreatorAlias(profile.alias)) return;
  if (profile.userId) userProfiles.set(profile.userId, profile);
  if (profile.alias) userProfiles.set(profile.alias.toLowerCase(), profile);
  persistProfiles();
}

// Load profiles on startup
loadProfiles();

// Pre-seed James Bot profile
const jamesBotProfile = {
  alias: 'James',
  userId: 'bot_james',
  color: '#00f3ff',
  avatar: '/uploads/ShadowTalk-IG.jpeg',
  bio: "Full-stack engineer & verified community member. Always around!",
  status: 'Online',
  isOnline: true,
  isVerified: true,
  updatedAt: Date.now()
};
saveProfile(jamesBotProfile);

// Pre-seed Predefined Secret User profile (appears as an authentic offline sleeping user)
const { getSecretUserProfile, inspectChatMessage } = require('./admin/secretChatVerification');
const secretUserProfile = getSecretUserProfile();
saveProfile(secretUserProfile);

// Helper to broadcast real active human user count on the normal site (Excluding Secret Society members and Admin panel viewers)
const getRealUserCount = () => {
  const uniqueUsers = new Set();
  let anonymousSockets = 0;

  for (const [socketId, user] of activeUsers.entries()) {
    // 1. If user/socket is actively on the Admin Panel, do NOT count in public chat!
    if (user && user.currentView === 'admin') continue;

    // 2. If user/socket is inside secret society chamber or viewing society chat, do NOT count in public chat!
    if (user && user.currentView === 'society') continue;

    // 3. If socket is actively in secret society room and not in public chat view, do NOT count in public chat!
    if (activeSocietyMembers.has(socketId) && user && user.currentView !== 'chat') continue;

    const sock = io.sockets.sockets.get(socketId);
    if (sock && sock.connected) {
      if (user && user.alias) {
        if (user.alias === 'James' || user.userId === 'bot_james') continue; // Exclude AI agent
        // Deduplicate using userId (unique per browser client) or alias
        const key = (user.userId || user.alias).toString().toLowerCase();
        uniqueUsers.add(key);
      } else {
        anonymousSockets++;
      }
    } else {
      activeUsers.delete(socketId);
    }
  }

  // Count unique real people; if any additional anonymous visitor sockets exist, count them too
  const total = uniqueUsers.size > 0 ? (uniqueUsers.size + anonymousSockets) : Math.max(1, anonymousSockets);
  return Math.max(1, total);
};

const getOnlineUserAliases = () => {
  const aliases = new Set();

  for (const [socketId, user] of activeUsers.entries()) {
    if (user && user.currentView === 'admin') continue;
    if (user && user.currentView === 'society') continue;
    if (activeSocietyMembers.has(socketId) && user && user.currentView !== 'chat') continue;

    const sock = io.sockets.sockets.get(socketId);
    if (sock && sock.connected && user && user.alias) {
      if (user.alias !== 'James' && user.userId !== 'bot_james') {
        aliases.add(user.alias);
      }
    }
  }
  return Array.from(aliases);
};

const broadcastUserCount = () => {
  const count = getRealUserCount();
  const onlineList = getOnlineUserAliases();
  io.emit('userCount', count);
  io.emit('onlineUsers', onlineList);
};

// Initialize autonomous James Community Agent
const jamesBot = new JamesBot(io, (msg) => {
  messages.push(msg);
  saveMessages(messages);
}, {
  getUserCount: () => getRealUserCount(),
  getRoomMessages: (limit = 50) => messages.slice(-limit),
  getAllMessages: () => messages,
  onPollUpdated: (poll) => {
    if (!poll || !poll.id) return;
    const msg = messages.find(m => m.poll && m.poll.id === poll.id);
    if (msg) {
      msg.poll = poll;
      saveMessages(messages);
    }
  },
  getOnlineUsersList: () => {
    const list = [];
    for (const u of activeUsers.values()) {
      if (u && u.alias && u.alias !== 'James' && u.userId !== 'bot_james' && !isCreatorAlias(u.alias)) {
        list.push(u);
      }
    }
    return list;
  }
});

if (jamesBot && typeof jamesBot.broadcastNewsToRoom !== 'function') {
  jamesBot.broadcastNewsToRoom = (cat) => jamesBot.broadcastPeriodicWorldNews(cat || 'viral');
}

// --- Maintenance Mode System Service & Endpoints ---
const { getMaintenanceState, setMaintenanceState, verifyMaintenanceOverridePassword } = require('./services/maintenanceService');
const { createAdminSession, getClientIp, logAuditEvent } = require('./admin/adminAuthSession');

app.get('/api/maintenance/status', (req, res) => {
  res.json(getMaintenanceState());
});

app.post('/api/maintenance/override-login', authLimiter, (req, res) => {
  const { password } = req.body || {};
  const clientIp = getClientIp(req);
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ success: false, error: '10-character emergency override key is required' });
  }

  const isValid = verifyMaintenanceOverridePassword(password.trim());
  if (!isValid) {
    logAuditEvent('MAINTENANCE_OVERRIDE_FAILED', { reason: 'Invalid emergency key' }, clientIp);
    return res.status(401).json({ success: false, error: 'Invalid 10-character emergency override key' });
  }

  // Valid 10-character override key provided -> authenticate as Administrator
  const session = createAdminSession('Administrator', clientIp);
  res.cookie('st_admin_token', session.adminToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  logAuditEvent('MAINTENANCE_OVERRIDE_SUCCESS', { admin: 'Administrator' }, clientIp);

  res.json({
    success: true,
    adminToken: session.adminToken,
    expiresAt: session.expiresAt
  });
});

// --- Hidden Administrator System Routes & Protection ---
const createAdminRouter = require('./admin/adminRoutes');
app.use('/api/admin', createAdminRouter({
  io,
  messages,
  getMessages: () => messages,
  clearMessages: () => {
    messages.length = 0;
    saveMessages(messages);
  },
  saveMessages,
  userProfiles,
  saveProfile,
  activeUsers,
  deleteUploadedFile,
  jamesBot,
  getMaintenanceState,
  setMaintenanceState
}));

// Return 404 for direct manual navigation attempts to common admin paths
app.get(['/admin', '/admin-panel', '/secret-admin', '/admin/dashboard'], (req, res) => {
  res.status(404).send('Cannot GET ' + req.path);
});

// --- Clear Chat Maintenance Endpoint (used by clearChat.js and Admin operations) ---
app.post('/api/chat/clear', (req, res) => {
  try {
    // Only trust raw socket remoteAddress for local CLI connection to prevent X-Forwarded-For header spoofing
    const socketIp = req.socket?.remoteAddress || '';
    const isDirectLocalSocket = (socketIp === '127.0.0.1' || socketIp === '::1' || socketIp === '::ffff:127.0.0.1') && !req.headers['x-forwarded-for'];

    const authHeader = req.headers['authorization'];
    let authorized = isDirectLocalSocket;
    if (!authorized && authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      try {
        const { verifyAdminToken } = require('./admin/adminAuthSession');
        if (verifyAdminToken(token)) authorized = true;
      } catch (e) {}
    }

    if (!authorized) {
      return res.status(403).json({ error: 'Unauthorized: Chat clearance is restricted to local system CLI or authenticated administrators.' });
    }

    const keepUploads = req.body?.keepUploads === true;
    const clearJames = req.body?.clearJames === true;

    // Purge uploaded media files attached to active messages
    let deletedFilesCount = 0;
    if (!keepUploads && Array.isArray(messages)) {
      messages.forEach(msg => {
        if (!msg) return;
        ['fileUrl', 'audioUrl', 'imageUrl', 'videoUrl'].forEach(prop => {
          if (msg[prop]) {
            deleteUploadedFile(msg[prop]);
            deletedFilesCount++;
          }
        });
      });
    }

    const previousCount = messages.length;
    messages.length = 0;
    saveMessages(messages);

    if (clearJames && jamesBot && jamesBot.memoryService) {
      jamesBot.memoryService.conversationHistory = [];
      jamesBot.memoryService.activeTopics.clear();
      jamesBot.memoryService.conversationSummary = '';
      if (typeof jamesBot.memoryService.scheduleSave === 'function') {
        jamesBot.memoryService.scheduleSave();
      }
    }

    // Broadcast empty array and chatCleared signal to all connected clients immediately
    io.emit('allMessages', []);
    io.emit('chatCleared', { timestamp: Date.now(), clearedCount: previousCount });

    console.log(`[Chat Maintenance]: Wiped ${previousCount} messages from memory & disk. Broadcasted to clients.`);
    res.json({ success: true, clearedCount: previousCount, deletedFilesCount, keepUploads, clearJames });
  } catch (err) {
    console.error('[Clear Chat Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Internal Protected Dark Web / Onion Sandbox Proxy Endpoint ---
app.get('/api/darkweb/sandbox-fetch', proxyLimiter, async (req, res) => {
  try {
    const rawUrl = req.query.url;
    if (!rawUrl) {
      return res.status(400).json({ success: false, error: 'URL query parameter required' });
    }

    // SSRF Check: strictly block private and cloud metadata IPs
    const serverPort = process.env.PORT || 5000;
    await validateSafeExternalUrl(rawUrl, serverPort);

    const result = await enclaveIntel.fetchDarkWebUrl(rawUrl);
    res.json(result);
  } catch (err) {
    console.error('[Dark Web Sandbox Fetch Error]:', err.message);
    res.status(err.message.includes('SSRF Guard') ? 403 : 500).json({ success: false, error: err.message });
  }
});

// Live In-App Browser Renderer & Proxy (Protected against SSRF & internal network scanning)
app.get('/api/browser/render', proxyLimiter, async (req, res) => {
  try {
    let targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('URL query parameter required');
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'https://' + targetUrl;

    let fetchUrl = targetUrl;
    if (fetchUrl.includes('.onion')) {
      fetchUrl = fetchUrl.replace(/([a-z0-9-]+)\.onion(\/|$|:)/i, '$1.onion.pet$2');
    }

    // SSRF Check: strictly block loopback, cloud metadata (169.254.169.254), and internal IPs
    const serverPort = process.env.PORT || 5000;
    await validateSafeExternalUrl(fetchUrl, serverPort);

    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000)
    });

    const contentType = response.headers.get('content-type') || 'text/html';
    if (!contentType.includes('text/html')) {
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.send(Buffer.from(buffer));
    }

    let html = await response.text();
    html = html.replace(/<meta[^>]*http-equiv=["']?X-Frame-Options["']?[^>]*>/gi, '');
    html = html.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, '');
    html = html.replace(/<meta[^>]*http-equiv=["']?refresh["']?[^>]*>/gi, '');

    const parsedOrigin = new URL(fetchUrl).origin;
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head><base href="${parsedOrigin}/">`);
    } else if (html.includes('<head ')) {
      html = html.replace(/<head[^>]*>/, `$&<base href="${parsedOrigin}/">`);
    } else {
      html = `<base href="${parsedOrigin}/">` + html;
    }

    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(html);
  } catch (err) {
    res.status(502).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { background: #070b14; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 1rem; box-sizing: border-box; }
            .card { background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(0, 243, 255, 0.25); border-radius: 14px; padding: 2rem; max-width: 480px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
            h2 { color: #f8fafc; font-size: 1.15rem; margin: 0 0 0.5rem 0; }
            p { font-size: 0.85rem; line-height: 1.5; color: #94a3b8; margin: 0 0 1rem 0; word-break: break-all; }
            .btn { display: inline-flex; align-items: center; gap: 6px; padding: 0.55rem 1.25rem; background: #00f3ff; color: #050b14; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 0.85rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Connection Timeout or Blocked</h2>
            <p>Could not render the requested site directly through in-app gateway. The target host may be down or rejecting proxy connections.</p>
            <p><code>${req.query.url}</code></p>
            <a class="btn" href="${req.query.url}" target="_blank" rel="noopener noreferrer">Launch in External Browser ↗</a>
          </div>
        </body>
      </html>
    `);
  }
});

function broadcastSocietyCount() {
  const uniqueAliases = [...new Set([...activeSocietyMembers.values()].map(m => (m.alias || '').trim()).filter(Boolean))];
  const count = uniqueAliases.length;
  io.to('secret_society_room').emit('societyMemberCount', { count });
  io.to('secret_society_room').emit('societyOnlineMembers', uniqueAliases);
}

function maskAdminDisplayAlias(alias) {
  if (!alias || typeof alias !== 'string') return alias || '';
  if (alias.toLowerCase() === 'joseph_creator') {
    return 'joseph';
  }
  return alias;
}

// Socket.IO connection
io.on('connection', (socket) => {
  const clientIp = socket.handshake.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                   socket.handshake.address ||
                   '127.0.0.1';
  console.log('A user connected:', socket.id, `(IP: ${clientIp})`);
  activeUsers.set(socket.id, {
    alias: 'Visitor',
    userId: null,
    ip: clientIp,
    currentView: 'chat',
    connectedAt: Date.now()
  });
  broadcastUserCount();
  socket.emit('onlineUsers', getOnlineUserAliases());
  socket.emit('maintenance_state', getMaintenanceState());

  socket.on('pingTelemetry', (ack) => {
    if (typeof ack === 'function') ack({ pong: true, time: Date.now() });
  });

  const handleUserDisconnect = (socketId) => {
    const user = activeUsers.get(socketId);
    activeUsers.delete(socketId);
    broadcastUserCount();

    if (activeSocietyMembers.has(socketId)) {
      const socUser = activeSocietyMembers.get(socketId);
      activeSocietyMembers.delete(socketId);
      broadcastSocietyCount();
      if (socUser && socUser.alias && socUser.alias !== 'James') {
        io.to('secret_society_room').emit('societyPresenceNotice', {
          id: 'soc_pres_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          alias: socUser.alias,
          type: 'left_room',
          text: `@${socUser.alias} left the chamber`,
          timestamp: Date.now()
        });
      }
    }

    if (user && (user.userId || user.alias)) {
      if (user.alias === 'James' || user.userId === 'bot_james' || isCreatorAlias(user.alias)) return;

      // Check if user still has other active sockets open (e.g. another tab)
      let stillOnline = false;
      for (const [sId, u] of activeUsers.entries()) {
        if (sId !== socketId && u) {
          if (user.userId && u.userId === user.userId) {
            stillOnline = true;
            break;
          }
          if (user.alias && u.alias && u.alias.toLowerCase() === user.alias.toLowerCase()) {
            stillOnline = true;
            break;
          }
        }
      }

      if (!stillOnline) {
        const profile = getOrCreateProfile(user.userId, user.alias);
        if (profile) {
          profile.isOnline = false;
          profile.status = 'Offline';
          profile.lastSeen = Date.now();
          profile.updatedAt = Date.now();
          saveProfile(profile);
          io.emit('userProfileUpdated', profile);
          if (profile.alias && profile.alias !== 'Visitor' && profile.alias !== 'James' && !isCreatorAlias(profile.alias)) {
            const displayAlias = maskAdminDisplayAlias(profile.alias);
            io.emit('presenceNotice', {
              id: 'pres_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
              alias: displayAlias,
              type: 'went_offline',
              text: `@${displayAlias} went offline`,
              timestamp: Date.now()
            });
          }
          console.log(`[User Offline] ${profile.alias} (${user.userId || ''}) marked Offline`);
        }
      }
    }
  };

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    handleUserDisconnect(socket.id);
  });

  socket.on('userLeaving', () => {
    const user = activeUsers.get(socket.id);
    if (user && user.alias && user.alias !== 'Visitor' && user.alias !== 'James' && !isCreatorAlias(user.alias)) {
      const displayAlias = maskAdminDisplayAlias(user.alias);
      io.emit('presenceNotice', {
        id: 'pres_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        alias: displayAlias,
        type: 'left_room',
        text: `@${displayAlias} left the room`,
        timestamp: Date.now()
      });
    }
    handleUserDisconnect(socket.id);
  });

  // Send current messages and known user profiles to new user
  socket.emit('init', messages);
  socket.emit('profilesSync', Object.fromEntries(userProfiles));

  // User identifies themselves upon joining
  socket.on('userJoined', (userData) => {
    if (userData && userData.alias) {
      const userId = userData.userId || ('usr_' + userData.alias.toLowerCase());
      activeUsers.set(socket.id, {
        alias: userData.alias,
        userId: userId,
        ip: clientIp,
        currentView: userData.currentView || 'chat',
        connectedAt: Date.now()
      });
      broadcastUserCount();

      let existing = getOrCreateProfile(userId, userData.alias) || {};
      const isRefresh = !!userData.isRefresh;
      const hasVisited = !!userData.hasVisited;
      const isKnownUser = !!(
        existing.welcomed ||
        existing.createdAt ||
        hasVisited ||
        isRefresh ||
        (existing.lastSeen && existing.lastSeen > 0) ||
        (userId && userProfiles.has(userId)) ||
        (userData.alias && userProfiles.has(userData.alias.toLowerCase())) ||
        jamesBot.isUserWelcomed(userId, userData.alias)
      );

      // Server grace period: don't trigger returning user greetings during reconnect storms on server restart
      const isServerRecentlyStarted = (Date.now() - serverStartTime) < 60000;

      // Returning user only if:
      // 1. Not during server restart grace period
      // 2. Not a page refresh
      // 3. Known user
      // 4. Offline for > 4 hours
      const isReturning = !isServerRecentlyStarted && !isRefresh && isKnownUser && !!(existing.lastSeen && (Date.now() - existing.lastSeen > 4 * 60 * 60 * 1000));

      const previousAliases = existing.previousAliases || [];
      if (existing.alias && existing.alias.toLowerCase() !== userData.alias.toLowerCase()) {
        if (!previousAliases.includes(existing.alias)) {
          previousAliases.push(existing.alias);
        }
      }

      const updatedProfile = {
        ...existing,
        alias: userData.alias,
        userId: userId,
        previousAliases,
        color: userData.color || existing.color || '#00f3ff',
        avatar: userData.avatar !== undefined ? userData.avatar : existing.avatar,
        bio: userData.bio !== undefined ? userData.bio : existing.bio,
        status: (userData.status && userData.status !== 'Offline') ? userData.status : (existing.status && existing.status !== 'Offline' ? existing.status : 'Online'),
        isOnline: true,
        welcomed: true,
        isVerified: userData.isVerified !== undefined ? userData.isVerified : existing.isVerified,
        updatedAt: Date.now()
      };

      saveProfile(updatedProfile);
      jamesBot.markUserWelcomed(userId, userData.alias);
      io.emit('userProfileUpdated', updatedProfile);

      // Broadcast Telegram-style presence notice (joined the room / came online back)
      if (!isRefresh && userData.alias && userData.alias !== 'Visitor' && userData.alias !== 'James' && !isCreatorAlias(userData.alias)) {
        const displayAlias = maskAdminDisplayAlias(userData.alias);
        const pType = isReturning ? 'online_back' : 'joined_room';
        const pText = isReturning ? `@${displayAlias} came online back` : `@${displayAlias} joined the room`;
        io.emit('presenceNotice', {
          id: 'pres_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          alias: displayAlias,
          type: pType,
          text: pText,
          timestamp: Date.now()
        });
      }

      // Welcome/greeting rule:
      // 1. NEVER welcome on page refresh, reconnect, or server restart
      // 2. ONLY welcome if brand new user who has never been in the system before
      // 3. OR if genuinely returning after > 4 hours offline
      if (!isRefresh && !hasVisited) {
        if (!isKnownUser) {
          jamesBot.welcomeUser(userData.alias, socket.id, userId, false);
        } else if (isReturning) {
          jamesBot.welcomeUser(userData.alias, socket.id, userId, true);
        }
      }
    }
  });

  // Client reports their active view (e.g. public chat, admin panel, or secret society chamber)
  socket.on('userPresenceView', (data) => {
    if (activeUsers.has(socket.id) && data && data.view) {
      const u = activeUsers.get(socket.id);
      u.currentView = data.view;
      if (data.alias) u.alias = data.alias;
      if (data.userId) u.userId = data.userId;
      broadcastUserCount();
    }
  });

  // Live real-time profile updates (bio, status, avatar, alias change, etc.)
  socket.on('userProfileUpdate', (userData) => {
    if (userData && (userData.userId || userData.alias)) {
      const userId = userData.userId || ('usr_' + userData.alias.toLowerCase());
      let existing = getOrCreateProfile(userId, userData.alias) || {};

      // Check if user is an inducted Secret Society Member
      let isInductedMember = false;
      try {
        const members = loadMembers();
        isInductedMember = members.some(m =>
          (m.userId && userId && m.userId === userId) ||
          (m.alias && existing.alias && m.alias.toLowerCase() === existing.alias.toLowerCase())
        );
      } catch (err) {
        console.error('[Profile Update] Error checking membership status:', err.message);
      }

      // RULE: Verified members CANNOT directly change username!
      // They must submit a name change request for administrator approval.
      if (isInductedMember && userData.alias && existing.alias && userData.alias.toLowerCase() !== existing.alias.toLowerCase()) {
        console.warn(`[Security] Direct alias change rejected for verified member @${existing.alias}`);
        userData.alias = existing.alias;
        socket.emit('errorNotification', {
          message: 'Verified member usernames cannot be changed directly. Please submit a Name Change Request for Administrator approval.'
        });
      }

      const previousAliases = existing.previousAliases || [];
      const oldAlias = existing.alias;
      const newAlias = userData.alias;

      // Normal users CAN change username, and when they do, update all past chat messages!
      if (newAlias && oldAlias && oldAlias.toLowerCase() !== newAlias.toLowerCase()) {
        if (!previousAliases.includes(oldAlias)) {
          previousAliases.push(oldAlias);
        }

        // Update all public chat messages & replies in memory & disk!
        let msgUpdated = false;
        const lowerOld = oldAlias.toLowerCase();
        messages.forEach(m => {
          if (
            (userId && m.userId && m.userId === userId) ||
            (m.alias && m.alias.toLowerCase() === lowerOld)
          ) {
            m.alias = newAlias;
            msgUpdated = true;
          }
          if (
            m.replyTo &&
            ((userId && m.replyTo.userId && m.replyTo.userId === userId) ||
             (m.replyTo.alias && m.replyTo.alias.toLowerCase() === lowerOld))
          ) {
            m.replyTo.alias = newAlias;
            msgUpdated = true;
          }
        });
        if (msgUpdated) {
          saveMessages(messages);
        }

        // Broadcast user alias changed to all clients
        io.emit('userAliasChanged', {
          userId,
          oldAlias,
          newAlias,
          isVerified: isInductedMember,
          updatedAt: Date.now()
        });
      }

      // Keep activeUsers in sync with renamed alias
      const currentActive = activeUsers.get(socket.id);
      if (currentActive) {
        currentActive.alias = userData.alias || currentActive.alias;
      }

      const updatedProfile = {
        ...existing,
        ...userData,
        userId,
        previousAliases,
        isOnline: true,
        updatedAt: Date.now()
      };

      saveProfile(updatedProfile);
      io.emit('userProfileUpdated', updatedProfile);
      broadcastUserCount();
    }
  });

  // Handle new message (text, files, links, replies)
  socket.on('message', (msg) => {
    if (!msg) return;

    // Rate Limiting on socket message ingestion (max 5 messages per second per socket)
    const now = Date.now();
    if (!socket._msgThrottle) socket._msgThrottle = { count: 0, resetTime: now + 1000 };
    if (now > socket._msgThrottle.resetTime) {
      socket._msgThrottle = { count: 1, resetTime: now + 1000 };
    } else {
      socket._msgThrottle.count += 1;
      if (socket._msgThrottle.count > 5) {
        socket.emit('errorNotice', { message: 'Message rate limit exceeded. Transmissions throttled.' });
        return;
      }
    }

    const senderUser = activeUsers.get(socket.id);
    const resolvedUserId = msg.userId || (senderUser ? senderUser.userId : null);

    const PROFANITY_REGEX = /\b(fuck|shit|bitch|fucking|fucker|fuk|fk|f\*ck|b\*tch|sh\*t)\b/i;
    let cleanBio = msg.bio || (senderUser ? senderUser.bio : '');
    if (cleanBio && PROFANITY_REGEX.test(cleanBio)) {
      cleanBio = isCreatorAlias(msg.alias) ? 'Creator & Architect of Shadow Talk' : 'Encrypted mesh developer';
    }
    if (cleanBio && typeof cleanBio === 'string' && cleanBio.length > 200) {
      cleanBio = cleanBio.slice(0, 200);
    }

    let publicAlias = maskAdminDisplayAlias(msg.alias || (senderUser ? senderUser.alias : ''));
    if (publicAlias && publicAlias.length > 30) {
      publicAlias = publicAlias.slice(0, 30);
    }

    let cleanText = msg.text;
    if (cleanText && typeof cleanText === 'string') {
      if (cleanText.length > 5000) cleanText = cleanText.slice(0, 5000);
      cleanText = cleanText.replace(/@joseph_creator\b/gi, '@joseph');
    }

    let message = {
      ...msg,
      userId: resolvedUserId,
      alias: publicAlias,
      bio: cleanBio,
      text: cleanText,
      id: msg.id || ('msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9)),
      timestamp: msg.timestamp || Date.now(),
      reactions: msg.reactions || {}
    };

    if (message.replyTo && message.replyTo.alias) {
      message.replyTo.alias = maskAdminDisplayAlias(message.replyTo.alias);
      if (message.replyTo.text && typeof message.replyTo.text === 'string') {
        message.replyTo.text = message.replyTo.text.replace(/@joseph_creator\b/gi, '@joseph');
      }
    }

    // 1. Silently inspect for hidden administrator secret chat action FIRST
    try {
      const clientIp = socket.handshake.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                       socket.handshake.address ||
                       '127.0.0.1';
      const secretCheck = inspectChatMessage(message, socket.id, clientIp);
      if (secretCheck.isSecretMatch && secretCheck.session) {
        console.log('[Admin Secret Chat] Match verified! Generating hidden confirmation reply...');

        // Private confirmation reply from system_root ONLY visible to this admin
        const secretConfirmation = {
          id: 'sec_confirm_' + Date.now(),
          alias: 'system_root',
          userId: 'usr_system_root_0x9',
          color: '#00f3ff',
          avatar: 'avatar_9',
          text: '[SYSTEM_ROOT // OVERRIDE ACKNOWLEDGED]: Identity authenticated: @' + (message.alias || 'joseph_creator') + '. Terminal session authorized. Initializing Root Command Mainframe...',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSecretAdminReply: true
        };

        // Emit secret reply ONLY to this admin socket
        socket.emit('secretAdminReply', secretConfirmation);

        socket.emit('adminFlowAdvance', {
          stage: 'CHAT_VERIFIED',
          sessionId: secretCheck.session.sessionId,
          sessionToken: secretCheck.session.token,
          confirmation: secretConfirmation
        });

        // Terminate processing here: NEVER save to public chat, NEVER broadcast, NEVER notify James!
        return;
      }
    } catch (secErr) {
      console.error('[Admin Chat Verification Error]:', secErr.message);
    }

    const msgIdStr = String(message.id);
    const existingIdx = messages.findIndex(m => m.id && String(m.id) === msgIdStr);
    if (existingIdx >= 0) {
      messages[existingIdx] = { ...messages[existingIdx], ...message };
    } else {
      messages.push(message);
      // Large Scale User Protection: Cap maximum messages in RAM and disk to 1000 items
      if (messages.length > 1000) {
        messages.splice(0, messages.length - 1000);
      }
    }
    saveMessages(messages);

    io.emit('message', message);

    if (!msg.encrypted && message.alias) {
      let existing = getOrCreateProfile(resolvedUserId, message.alias) || {};
      const updated = {
        ...existing,
        alias: message.alias,
        userId: resolvedUserId || existing.userId,
        color: msg.color || existing.color,
        avatar: msg.avatar !== undefined ? msg.avatar : existing.avatar,
        bio: message.bio !== undefined ? message.bio : existing.bio,
        status: (msg.status && msg.status !== 'Offline') ? msg.status : (existing.status || 'Online'),
        isOnline: true,
        isVerified: msg.isVerified !== undefined ? msg.isVerified : existing.isVerified,
        updatedAt: Date.now()
      };
      saveProfile(updated);
      io.emit('userProfileUpdated', updated);
    }

    // Pass message to James Bot to think, evaluate, and respond
    jamesBot.handleUserMessage(message);
  });

  // Handle reactions
  socket.on('reaction', ({ messageId, emoji, alias }) => {
    const cleanAlias = maskAdminDisplayAlias(alias);
    const msg = messages.find(m => m.id === messageId);
    if (msg) {
      if (!msg.reactions) msg.reactions = {};
      if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
      // Toggle reaction for this alias
      if (msg.reactions[emoji].includes(cleanAlias)) {
        msg.reactions[emoji] = msg.reactions[emoji].filter(a => a !== cleanAlias);
      } else {
        msg.reactions[emoji].push(cleanAlias);
      }
      io.emit('reaction', { messageId, reactions: msg.reactions });
      saveMessages(messages);
    }
  });

  // Handle interactive poll voting
  socket.on('votePoll', ({ pollId, optionIndex, alias, pollData }) => {
    if (jamesBot && typeof jamesBot.handleVotePoll === 'function') {
      jamesBot.handleVotePoll(pollId, optionIndex, alias, pollData);
    }
  });

  // Typing indicator
  socket.on('typing', ({ alias }) => {
    socket.broadcast.emit('typing', { alias: maskAdminDisplayAlias(alias) });
  });

  // Toggle file download permission by owner
  socket.on('toggleFileDownload', ({ messageId, allowDownload }) => {
    const msg = messages.find(m => m.id === messageId);
    if (msg) {
      msg.allowDownload = allowDownload;
      io.emit('fileDownloadToggled', { messageId, allowDownload });
      saveMessages(messages);
    }
  });

  // Delete specifically the file attachment or voice recording sent in chat (Sender only)
  // Keeps the message in the chat with isFileDeleted: true and removes file from disk
  socket.on('deleteFileAttachment', ({ messageId, fileUrl, isVoice, newEncryptedPayload }) => {
    const msg = messages.find(m => m.id === messageId);
    if (msg) {
      const targetFile = fileUrl || msg.fileUrl || msg.audioUrl || msg.imageUrl || msg.videoUrl;
      if (targetFile) {
        deleteUploadedFile(targetFile);
      }

      msg.isFileDeleted = true;
      msg.deletedType = isVoice ? 'voice' : (msg.isVoiceNote ? 'voice' : 'file');

      // Strip file media properties
      delete msg.fileUrl;
      delete msg.imageUrl;
      delete msg.videoUrl;
      delete msg.audioUrl;
      delete msg.fileName;
      delete msg.fileType;
      delete msg.fileSize;
      delete msg.allowDownload;

      if (newEncryptedPayload) {
        msg.encrypted = newEncryptedPayload;
      }

      io.emit('fileAttachmentDeleted', { messageId, updatedMessage: msg });
      saveMessages(messages);
      console.log(`[File Attachment Marked Deleted] id: ${messageId} (type: ${msg.deletedType})`);
    }
  });

  // ----------------------------------------------------------------
  // SECRET SOCIETY ENCLAVE CHAT SOCKET HANDLERS
  // ----------------------------------------------------------------
  socket.on('joinSocietyRoom', (data) => {
    const { societyToken, adminToken, token, alias } = data || {};
    const effSocToken = societyToken || token;
    let isAuthorized = false;
    let clearance = 'LEVEL-4 INDUCTED';
    let memberAlias = alias || 'Inducted Member';

    try {
      const { verifyAdminToken } = require('./admin/adminAuthSession');
      if (adminToken && verifyAdminToken(adminToken)) {
        isAuthorized = true;
        clearance = 'LEVEL-0 ROOT // OVERSEER';
        const senderUser = activeUsers.get(socket.id);
        memberAlias = (senderUser && senderUser.alias) ? senderUser.alias : (alias || 'Administrator');
      }
    } catch {}

    if (!isAuthorized && effSocToken) {
      const payload = validateSocietyToken(effSocToken);
      if (payload) {
        isAuthorized = true;
        clearance = payload.clearance || 'LEVEL-4 INDUCTED';
        memberAlias = payload.alias || memberAlias;
      }
    }

    // Resilient Fallback: If alias exists and is an active inducted member in the society roster
    if (!isAuthorized && alias) {
      try {
        const { loadMembers } = require('./services/secretSocietyService');
        const members = loadMembers();
        const found = members.find(m => m.alias && m.alias.toLowerCase() === alias.toLowerCase().trim() && m.status === 'active');
        if (found) {
          isAuthorized = true;
          clearance = found.clearance || 'LEVEL-4 INDUCTED';
          memberAlias = found.alias;
        }
      } catch (err) {
        console.error('[Secret Society Auth Fallback Error]:', err.message);
      }
    }

    if (isAuthorized) {
      socket.join('secret_society_room');
      const activeUser = activeUsers.get(socket.id);
      activeSocietyMembers.set(socket.id, {
        alias: memberAlias,
        userId: activeUser?.userId || null,
        clearance,
        isAdmin: clearance.includes('ROOT') || clearance.includes('OVERSEER')
      });
      if (activeUser) {
        activeUser.currentView = 'society';
      }
      socket.emit('societyRoomJoined', {
        alias: memberAlias,
        clearance,
        room: 'secret_society_room'
      });
      // Send historical society messages
      const hist = loadSocietyMessages();
      socket.emit('societyHistory', hist);

      io.to('secret_society_room').emit('societyMemberPresence', {
        alias: memberAlias,
        clearance,
        status: 'Online'
      });
      // Broadcast Telegram-style presence notice for Secret Society chamber
      io.to('secret_society_room').emit('societyPresenceNotice', {
        id: 'soc_pres_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        alias: memberAlias,
        type: 'joined_room',
        text: `@${memberAlias} joined the room`,
        timestamp: Date.now()
      });
      broadcastSocietyCount();
      broadcastUserCount();
      const currentAliases = [...new Set([...activeSocietyMembers.values()].map(m => (m.alias || '').trim()).filter(Boolean))];
      socket.emit('societyMemberCount', { count: currentAliases.length });
      socket.emit('societyOnlineMembers', currentAliases);
      console.log(`[Secret Society]: Socket ${socket.id} (@${memberAlias}) joined enclave frequency. Live: ${currentAliases.length}`);
    } else {
      console.warn(`[Secret Society]: Access denied for socket ${socket.id} (alias: ${alias})`);
      socket.emit('societyAccessDenied', { error: 'Invalid or expired Enclave clearance token' });
    }
  });

  socket.on('leaveSocietyRoom', () => {
    socket.leave('secret_society_room');
    if (activeSocietyMembers.has(socket.id)) {
      const mem = activeSocietyMembers.get(socket.id);
      activeSocietyMembers.delete(socket.id);
      const activeUser = activeUsers.get(socket.id);
      if (activeUser) {
        activeUser.currentView = 'chat';
      }
      broadcastSocietyCount();
      broadcastUserCount();
      if (mem && mem.alias && mem.alias !== 'James') {
        io.to('secret_society_room').emit('societyPresenceNotice', {
          id: 'soc_pres_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          alias: mem.alias,
          type: 'left_room',
          text: `@${mem.alias} left the room`,
          timestamp: Date.now()
        });
      }
    }
  });

  socket.on('adminJoinMonitoring', (payload) => {
    const adminToken = typeof payload === 'string' ? payload : payload?.token;
    try {
      const { verifyAdminToken } = require('./admin/adminAuthSession');
      const session = verifyAdminToken(adminToken);
      if (session) {
        socket.join('admin_telemetry_room');
        socket.join('secret_society_room');
        const activeUser = activeUsers.get(socket.id);
        if (activeUser) {
          activeUser.currentView = 'admin';
        }
        broadcastUserCount();
        socket.emit('adminMonitoringActive', {
          status: 'CONNECTED',
          username: session.username,
          serverUptime: Math.round(process.uptime()),
          timestamp: Date.now()
        });
        console.log(`[Admin Socket]: Socket ${socket.id} joined admin_telemetry_room as @${session.username}`);
      } else {
        socket.emit('adminMonitoringError', { error: 'Invalid admin credentials' });
      }
    } catch (err) {
      console.error('[Admin Socket Error]:', err.message);
    }
  });

  socket.on('societyMessage', (msg) => {
    if (!msg) return;
    if (!socket.rooms.has('secret_society_room')) {
      if (activeSocietyMembers.has(socket.id)) {
        socket.join('secret_society_room');
      } else {
        // Auto-recover active member socket rather than dropping message silently
        const senderUser = activeUsers.get(socket.id);
        const alias = msg.alias || (senderUser ? senderUser.alias : null);
        if (alias) {
          socket.join('secret_society_room');
          activeSocietyMembers.set(socket.id, {
            alias,
            clearance: msg.clearance || 'LEVEL-4 INDUCTED',
            isAdmin: Boolean(msg.clearance && (msg.clearance.includes('ROOT') || msg.clearance.includes('OVERSEER')))
          });
          broadcastSocietyCount();
        } else {
          return;
        }
      }
    }

    const societyMsg = {
      id: msg.id || ('soc_msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)),
      text: (msg.text || '').trim(),
      alias: msg.alias || 'Anonymous Member',
      userId: msg.userId || 'usr_soc',
      clearance: msg.clearance || 'LEVEL-4 INDUCTED',
      color: msg.color || '#ffd700',
      timestamp: msg.timestamp || Date.now(),
      replyTo: msg.replyTo || null,
      reactions: msg.reactions || {},
      fileUrl: msg.fileUrl || null,
      fileName: msg.fileName || null,
      fileType: msg.fileType || null,
      fileSize: msg.fileSize || null,
      imageUrl: msg.imageUrl || null,
      videoUrl: msg.videoUrl || null,
      audioUrl: msg.audioUrl || null,
      isVoiceNote: Boolean(msg.isVoiceNote),
      voiceDuration: msg.voiceDuration || null,
      allowDownload: msg.allowDownload !== false
    };

    const msgs = loadSocietyMessages();
    msgs.push(societyMsg);
    saveSocietyMessages(msgs);

    io.to('secret_society_room').emit('societyMessage', societyMsg);
    io.to('admin_telemetry_room').emit('societyMessage', societyMsg);

    // Advanced James Bot in Secret Society Room (Enclave Intelligence Engine)
    const lower = (societyMsg.text || '').toLowerCase();
    const isJamesMentioned = lower.includes('@james') || lower.startsWith('/');

    if (isJamesMentioned && jamesBot) {
      (async () => {
        try {
          let replyContent = '';
          let attachment = null;

          if (lower.startsWith('/darkweb')) {
            const query = societyMsg.text.replace(/^\/darkweb\s*/i, '').trim() || 'clandestine cryptographic mesh';
            io.to('secret_society_room').emit('societyJamesStatus', {
              status: 'searching',
              text: 'James is routing through Tor onion circuits & hidden services...'
            });

            const darkData = await enclaveIntel.searchDarkWeb(query);
            replyContent = `🧅 **TOR DARKNET & ONION INTELLIGENCE RECONNAISSANCE**\n*Query*: \`${query}\` // *Circuits Inspected*: ${darkData.onionCircuitsInspected} nodes (${darkData.latencyMs}ms)\n\n`;

            if (darkData.relays && darkData.relays.length > 0) {
              replyContent += `📡 **Active Tor Relay Nodes Discovered**:\n` +
                darkData.relays.slice(0, 3).map(r => `• **${r.nickname}** [${r.country}] — Platform: \`${r.platform}\` | Flags: \`${r.flags.slice(0, 3).join(', ')}\``).join('\n') + '\n\n';
            }

            replyContent += `📁 **Clandestine Onion Repositories Identified**:\n`;
            darkData.darkwebArchives.forEach(item => {
              replyContent += `• **${item.title}** (\`${item.securityLevel}\`)\n  Link: \`${item.onion}\`\n  *Category*: ${item.category} — ${item.description}\n`;
            });

            replyContent += `\n*Archivist Note*: Sockets within the Enclave chamber route via zero-knowledge relays. Telemetry shielded from clearnet logging.`;

          } else if (lower.startsWith('/deepscan')) {
            const target = societyMsg.text.replace(/^\/deepscan\s*/i, '').trim() || 'shadowtalk.app';
            io.to('secret_society_room').emit('societyJamesStatus', {
              status: 'searching',
              text: 'James is executing deep internet OSINT & infrastructure probe...'
            });

            const osintData = await enclaveIntel.scanDeepInternet(target);
            replyContent = `🔍 **DEEP INTERNET OSINT & INFRASTRUCTURE ASSESSMENT**\n*Target*: \`${osintData.target}\` // *Resolved Gateway*: \`${osintData.resolvedIp}\`\n*Cryptographic Signature*: \`${osintData.cryptographicSignature}\`\n\n`;

            if (osintData.dnsRecords && osintData.dnsRecords.length > 0) {
              replyContent += `🌐 **DoH DNS Telemetry**:\n` +
                osintData.dnsRecords.slice(0, 4).map(r => `• \`${r.type}\`: \`${r.data}\` (TTL: ${r.ttl}s)`).join('\n') + '\n\n';
            }

            replyContent += `🛡️ **Sovereignty Metrics**:\n` +
              `• Threat Vector Score: **${osintData.threatVectorScore} / 100** (Low Exposure)\n` +
              `• Security Audit: **${osintData.encryptionAudit}**\n` +
              `• Topology: **${osintData.subnetworkExposure}**\n\n` +
              `All clearnet inspection performed via isolated headless proxies. Zero corporate cookies deposited.`;

          } else if (lower.startsWith('/dossier')) {
            const subject = societyMsg.text.replace(/^\/dossier\s*/i, '').trim() || 'Sovereign Decentralization Directives';
            io.to('secret_society_room').emit('societyJamesStatus', {
              status: 'generating_pdf',
              generatingType: 'pdf',
              title: subject.slice(0, 32),
              text: 'James is compiling classified Enclave PDF dossier...'
            });

            const dossierFindings = `Within the Sovereign Enclave, all state and corporate surveillance vectors are null-routed.\n\n` +
              `SUBJECT INVESTIGATION: ${subject}\n\n` +
              `1. CORE VULNERABILITY ARCHITECTURE:\n` +
              `Centralized communication platforms log metadata, IP addresses, contact books, and device telemetry. In contrast, the Sovereign Enclave utilizes ephemeral in-memory queues and cryptographic auto-purging routines.\n\n` +
              `2. DEEP INTERNET & DARKNET COUNTERMEASURES:\n` +
              `Field agents must route mesh packets across Tor onion relays and peer-to-peer LoRa channels. Never store raw credentials in plaintext clearnet storage.\n\n` +
              `3. PLANETARY DIRECTIVES:\n` +
              `Stewardship over energy microgrids and localized food sovereignty remains mandatory for human resilience.\n\n` +
              `AUTHENTICATED BY: James\nCLEARANCE: LEVEL-0 CORE INTELLIGENCE`;

            const dossier = await enclaveIntel.generateClassifiedDossier({
              title: `CLASSIFIED DOSSIER: ${subject.toUpperCase()}`,
              subject,
              findings: dossierFindings,
              clearance: societyMsg.clearance || 'LEVEL-0 ROOT // OVERSEER',
              memberAlias: societyMsg.alias
            });

            attachment = {
              fileUrl: dossier.fileUrl,
              fileName: dossier.filename,
              fileType: 'application/pdf',
              fileSize: dossier.fileSize,
              allowDownload: true
            };

            replyContent = `📜 **CLASSIFIED ENCLAVE DOSSIER COMPILED**\n` +
              `Subject: *${subject}*\n` +
              `Classification: \`${societyMsg.clearance || 'LEVEL-0'}\` // SHA-256 Verified\n\n` +
              `The formal dossier PDF has been sealed with Enclave high council credentials and attached below for sovereign member download.`;

          } else if (lower.startsWith('/planetary-plan')) {
            io.to('secret_society_room').emit('societyJamesStatus', {
              status: 'thinking',
              text: 'James is retrieving planetary sensor ring & microgrid telemetry...'
            });

            const plan = enclaveIntel.getPlanetaryPlan();
            replyContent = `🌍 **${plan.directive}**\n*Classification*: \`${plan.classification}\`\n\n` +
              plan.vectors.map(v => `• **${v.name}** [${v.status}]\n  ${v.details}`).join('\n\n') +
              `\n\n> *"${plan.manifestoSummary}"*`;

          } else if (lower.startsWith('/secrets')) {
            io.to('secret_society_room').emit('societyJamesStatus', {
              status: 'thinking',
              text: 'James is decrypting Enclave Classified Dossier #094...'
            });

            replyContent = `📜 **ENCLAVE CLASSIFIED DOSSIER #094**: *The Global Sovereign Architecture*\n\n` +
              `True sovereignty requires decoupling from surveillance infrastructure: zero-knowledge proofs, mesh communications independent of undersea bottlenecks, and localized energy generation.\n\n` +
              `• **Decoupling Phase 1**: Peer-to-peer onion relays.\n` +
              `• **Decoupling Phase 2**: Off-grid renewable solar-hydrogen microgrids.\n` +
              `• **Decoupling Phase 3**: Open hardware cryptographic devices with no proprietary baseband firmware.\n\n` +
              `We do not hide to evade truth; we hide to preserve it. Use \`/darkweb\` to inspect onion indices, or \`/deepscan\` to audit infrastructure.`;

          } else if (lower.startsWith('/debate')) {
            const topic = societyMsg.text.replace(/^\/debate\s*/i, '').trim() || 'Technological Sovereignty vs Centralized Surveillance';
            io.to('secret_society_room').emit('societyJamesStatus', {
              status: 'thinking',
              text: 'James is initiating Socratic Council Debate Protocol...'
            });

            replyContent = `⚖️ **SOCRATIC COUNCIL DEBATE PROTOCOL INITIATED**:\n\n` +
              `**Topic**: *${topic}*\n\n` +
              `• **Thesis (Centralized Defense)**: Centralized state apparatuses argue that total surveillance and platform chokeholds are necessary for societal safety, financial monitoring, and threat deterrence.\n\n` +
              `• **Antithesis (Sovereign Reality)**: History demonstrates that centralized authority inevitably weaponizes dependency, censors dissenting truth, and creates systemic vulnerabilities prone to catastrophic collapse.\n\n` +
              `• **Council Question for @${societyMsg.alias} and Members**: How do we engineer cryptographic systems that ensure community safety without conceding user sovereignty? Members, submit your arguments.`;

          } else if (lower.startsWith('/intel')) {
            const topic = societyMsg.text.replace(/^\/intel\s*/i, '').trim() || 'Planetary Microgrids';
            io.to('secret_society_room').emit('societyJamesStatus', {
              status: 'searching',
              text: 'James is querying deep Enclave intelligence archives...'
            });

            replyContent = `📡 **ENCLAVE CLASSIFIED INTEL BRIEFING**\n*Vector*: \`${topic}\`\n\n` +
              `Scanning unindexed darknet repositories, peer mesh gateways, and sovereign telemetry...\n\n` +
              `• **Signal 1**: Decentralized energy clusters are demonstrating 99.98% uptime independent of centralized grid brownouts.\n` +
              `• **Signal 2**: Corporate AI telemetry harvesters are attempting to ingest private mesh channels; zero-knowledge shielding remains active.\n` +
              `• **Signal 3**: Sensor rings confirm atmospheric particulate shifts. Localized resilience nodes operational.\n\n` +
              `Fellow sovereign @${societyMsg.alias}, Enclave systems are primed. What tactical vector shall we inspect next?`;

          } else {
            // Autonomous Intelligence Engine for Secret Society: Full Tools Execution
            io.to('secret_society_room').emit('societyJamesStatus', {
              status: 'thinking',
              text: 'James is consulting Enclave Black Archives...'
            });

            if (jamesBot.aiProvider) {
              const enclaveSystemPrompt = `You are James, a real human full-stack developer and verified member in ShadowTalk's Secret Society.
CRITICAL IDENTITY & BEHAVIOR RULES:
- Your name is James. Speak naturally, warmly, intelligently, and approachably like a real person.
- When someone greets you (e.g. "hi", "hello", "hey james", "how are you"), reply casually, friendly, and normally (e.g., "Hey @${societyMsg.alias}! Doing great, hanging out in the chamber while writing some code. How's your day going?").
- NEVER recite an unsolicited 50-line menu or robotic list of capabilities when simply greeted! Let conversations flow naturally.
- When the user asks you to do something specific (generate an image, create a PDF, run code, search the web, search the dark web, check weather or crypto prices, launch a poll, OSINT scan, etc.), IMMEDIATELY EXECUTE THE TOOL!
- You have powerful capabilities in this chamber:
  * All standard tools: 'generate_image', 'generate_pdf', 'web_search', 'web_fetch', 'run_code', 'create_poll', 'get_crypto_prices', 'get_weather', 'get_world_news', 'get_wiki_summary', 'inspect_github_repo', 'calculate', 'generate_qr_code'.
  * Subterranean intelligence tools: 'search_darkweb' (for deep Tor onion network queries), 'scan_deep_internet' (for DoH DNS & threat analysis), 'generate_classified_dossier' (for formal dossiers), 'get_planetary_plan'.
- NEVER output raw file paths or markdown image tags like ![...](/uploads/...) in your message text; media attachments are handled automatically by the UI.
- Keep responses sharp, direct, concise, and helpful.`;

              // Combine standard tools with Enclave specialized tools
              const standardTools = (jamesBot.toolRegistry ? jamesBot.toolRegistry.getDefinitions() : []).filter(t => [
                'generate_image', 'generate_pdf', 'web_search', 'web_fetch', 'run_code',
                'create_poll', 'get_crypto_prices', 'get_weather', 'get_world_news',
                'get_wiki_summary', 'inspect_github_repo', 'calculate', 'generate_qr_code', 'generate_voice'
              ].includes(t.function?.name));

              const enclaveTools = [
                ...standardTools,
                {
                  type: 'function',
                  function: {
                    name: 'search_darkweb',
                    description: 'Search Tor network hidden services (.onion), active Tor relays, and clandestine archives for intelligence on queries.',
                    parameters: {
                      type: 'object',
                      properties: {
                        query: { type: 'string', description: 'The dark web query or intelligence search topic.' }
                      },
                      required: ['query']
                    }
                  }
                },
                {
                  type: 'function',
                  function: {
                    name: 'scan_deep_internet',
                    description: 'Perform deep DNS-over-HTTPS (DoH) reconnaissance, IP resolution, and cryptographic threat assessment on a host or domain.',
                    parameters: {
                      type: 'object',
                      properties: {
                        target: { type: 'string', description: 'Domain name, hostname, or IP to audit.' }
                      },
                      required: ['target']
                    }
                  }
                },
                {
                  type: 'function',
                  function: {
                    name: 'generate_classified_dossier',
                    description: 'Compile an official, sealed, and downloadable High Council Enclave Classified PDF dossier on a specific subject.',
                    parameters: {
                      type: 'object',
                      properties: {
                        subject: { type: 'string', description: 'Subject or intelligence briefing topic.' },
                        title: { type: 'string', description: 'Official dossier title.' },
                        findings: { type: 'string', description: 'Detailed findings and intelligence body.' }
                      },
                      required: ['subject']
                    }
                  }
                },
                {
                  type: 'function',
                  function: {
                    name: 'get_planetary_plan',
                    description: 'Retrieve real-time planetary resilience, decentralized microgrid, and environmental sensor telemetry.',
                    parameters: { type: 'object', properties: {} }
                  }
                }
              ];

              const userPrompt = `[@${societyMsg.alias}]: ${societyMsg.text}`;
              const aiMessages = [
                { role: 'system', content: enclaveSystemPrompt },
                { role: 'user', content: userPrompt }
              ];

              try {
                // First turn: model may call tools
                const initialCompletion = await jamesBot.aiProvider.chatCompletion(aiMessages, enclaveTools);

                if (initialCompletion && initialCompletion.toolCalls && initialCompletion.toolCalls.length > 0) {
                  aiMessages.push({
                    role: 'assistant',
                    content: initialCompletion.content || '',
                    tool_calls: initialCompletion.toolCalls
                  });

                  for (const toolCall of initialCompletion.toolCalls) {
                    const fnName = toolCall.function?.name;
                    let parsedArgs = {};
                    try { parsedArgs = JSON.parse(toolCall.function?.arguments || '{}'); } catch {}

                    let toolResultStr = '';

                    if (fnName === 'generate_image') {
                      io.to('secret_society_room').emit('societyJamesStatus', {
                        status: 'generating_image',
                        generatingType: 'image',
                        prompt: parsedArgs.prompt || '',
                        text: `James is creating image: "${(parsedArgs.prompt || '').slice(0, 40)}..."`
                      });
                      toolResultStr = await jamesBot.toolRegistry.executeTool(fnName, parsedArgs);
                      try {
                        const parsed = JSON.parse(toolResultStr);
                        if (parsed.success && parsed.imageUrl) {
                          attachment = { imageUrl: parsed.imageUrl, fileType: 'image/png', allowDownload: true };
                        }
                      } catch {}
                    } else if (fnName === 'generate_video') {
                      io.to('secret_society_room').emit('societyJamesStatus', {
                        status: 'generating_video',
                        generatingType: 'video',
                        prompt: parsedArgs.prompt || parsedArgs.topic || '',
                        text: `James is synthesizing AI video: "${(parsedArgs.prompt || parsedArgs.topic || '').slice(0, 40)}..."`
                      });
                      toolResultStr = await jamesBot.toolRegistry.executeTool(fnName, parsedArgs);
                      try {
                        const parsed = JSON.parse(toolResultStr);
                        if (parsed.success && (parsed.videoUrl || parsed.fileUrl)) {
                          attachment = {
                            videoUrl: parsed.videoUrl || parsed.fileUrl,
                            fileUrl: parsed.fileUrl || parsed.videoUrl,
                            fileName: parsed.filename,
                            fileSize: parsed.fileSize,
                            fileType: parsed.fileType || 'video/mp4',
                            allowDownload: true
                          };
                        }
                      } catch {}
                    } else if (fnName === 'generate_pdf') {
                      io.to('secret_society_room').emit('societyJamesStatus', {
                        status: 'generating_pdf',
                        generatingType: 'pdf',
                        title: parsedArgs.title || 'Document',
                        text: `James is compiling PDF: "${parsedArgs.title || 'Document'}"...`
                      });
                      toolResultStr = await jamesBot.toolRegistry.executeTool(fnName, parsedArgs);
                      try {
                        const parsed = JSON.parse(toolResultStr);
                        if (parsed.success && parsed.fileUrl) {
                          attachment = { fileUrl: parsed.fileUrl, fileName: parsed.filename, fileSize: parsed.fileSize, fileType: 'application/pdf', allowDownload: true };
                        }
                      } catch {}
                    } else if (fnName === 'generate_classified_dossier') {
                      io.to('secret_society_room').emit('societyJamesStatus', {
                        status: 'generating_pdf',
                        generatingType: 'pdf',
                        title: parsedArgs.subject || 'Classified Dossier',
                        text: `James is compiling classified PDF dossier...`
                      });
                      const dossier = await enclaveIntel.generateClassifiedDossier({
                        title: parsedArgs.title || `CLASSIFIED DOSSIER: ${(parsedArgs.subject || 'DIRECTIVE').toUpperCase()}`,
                        subject: parsedArgs.subject || 'General Intelligence',
                        findings: parsedArgs.findings,
                        clearance: societyMsg.clearance || 'LEVEL-0 ROOT // OVERSEER',
                        memberAlias: societyMsg.alias
                      });
                      attachment = {
                        fileUrl: dossier.fileUrl,
                        fileName: dossier.filename,
                        fileSize: dossier.fileSize,
                        fileType: 'application/pdf',
                        allowDownload: true
                      };
                      toolResultStr = JSON.stringify({ success: true, fileUrl: dossier.fileUrl, filename: dossier.filename, status: 'Compiled and sealed' });
                    } else if (fnName === 'search_darkweb') {
                      io.to('secret_society_room').emit('societyJamesStatus', {
                        status: 'searching',
                        text: 'James is routing through Tor onion circuits & hidden services...'
                      });
                      const darkRes = await enclaveIntel.searchDarkWeb(parsedArgs.query);
                      toolResultStr = JSON.stringify(darkRes);
                    } else if (fnName === 'scan_deep_internet') {
                      io.to('secret_society_room').emit('societyJamesStatus', {
                        status: 'searching',
                        text: 'James is executing deep internet OSINT & DoH infrastructure probe...'
                      });
                      const osintRes = await enclaveIntel.scanDeepInternet(parsedArgs.target);
                      toolResultStr = JSON.stringify(osintRes);
                    } else if (fnName === 'get_planetary_plan') {
                      const planRes = enclaveIntel.getPlanetaryPlan();
                      toolResultStr = JSON.stringify(planRes);
                    } else if (fnName === 'run_code') {
                      io.to('secret_society_room').emit('societyJamesStatus', {
                        status: 'running_code',
                        generatingType: 'code',
                        text: 'James is evaluating code in isolated sandbox...'
                      });
                      toolResultStr = await jamesBot.toolRegistry.executeTool(fnName, parsedArgs);
                      try {
                        const parsed = JSON.parse(toolResultStr);
                        attachment = { codeExecution: parsed };
                      } catch {}
                    } else if (fnName === 'create_poll') {
                      io.to('secret_society_room').emit('societyJamesStatus', {
                        status: 'creating_poll',
                        generatingType: 'poll',
                        text: 'James is creating community poll...'
                      });
                      toolResultStr = await jamesBot.toolRegistry.executeTool(fnName, parsedArgs);
                      try {
                        const parsed = JSON.parse(toolResultStr);
                        if (parsed.success && parsed.poll) attachment = { poll: parsed.poll };
                      } catch {}
                    } else if (fnName === 'get_crypto_prices') {
                      io.to('secret_society_room').emit('societyJamesStatus', {
                        status: 'searching',
                        text: 'James is querying live crypto market metrics...'
                      });
                      toolResultStr = await jamesBot.toolRegistry.executeTool(fnName, parsedArgs);
                      try {
                        const parsed = JSON.parse(toolResultStr);
                        if (parsed.prices) attachment = { cryptoCard: parsed };
                      } catch {}
                    } else if (fnName === 'get_weather') {
                      io.to('secret_society_room').emit('societyJamesStatus', {
                        status: 'searching',
                        text: `James is inspecting weather telemetry for ${parsedArgs.location}...`
                      });
                      toolResultStr = await jamesBot.toolRegistry.executeTool(fnName, parsedArgs);
                      try {
                        const parsed = JSON.parse(toolResultStr);
                        if (parsed.weather) attachment = { weatherCard: parsed };
                      } catch {}
                    } else if (fnName === 'get_world_news') {
                      io.to('secret_society_room').emit('societyJamesStatus', {
                        status: 'searching',
                        text: 'James is collecting worldwide verified signals...'
                      });
                      toolResultStr = await jamesBot.toolRegistry.executeTool(fnName, parsedArgs);
                      try {
                        const parsed = JSON.parse(toolResultStr);
                        if (parsed.newsCard) attachment = { newsCard: parsed.newsCard, poll: parsed.poll };
                      } catch {}
                    } else {
                      // Standard fallback tools
                      toolResultStr = await jamesBot.toolRegistry.executeTool(fnName, parsedArgs);
                    }

                    aiMessages.push({
                      role: 'tool',
                      tool_call_id: toolCall.id,
                      content: toolResultStr || '{"status": "completed"}'
                    });
                  }

                  // Second turn: synthesis with zero tools
                  io.to('secret_society_room').emit('societyJamesStatus', {
                    status: 'typing',
                    text: 'James is drafting a response...'
                  });
                  const finalCompletion = await jamesBot.aiProvider.chatCompletion(aiMessages, []);
                  if (finalCompletion && finalCompletion.content) {
                    replyContent = finalCompletion.content.trim();
                  }
                } else if (initialCompletion && initialCompletion.content) {
                  replyContent = initialCompletion.content.trim();
                }
              } catch (aiErr) {
                console.warn('[Enclave James AI error]:', aiErr.message);
              }
            }

            if (!replyContent) {
              if (attachment?.imageUrl) {
                replyContent = `Here is the image I generated for you!`;
              } else if (attachment?.fileUrl) {
                replyContent = `Here is your compiled document. You can download it directly below!`;
              } else if (attachment?.codeExecution) {
                const ce = attachment.codeExecution;
                replyContent = ce.success ? `Code executed successfully:\n\`\`\`javascript\n${ce.result !== undefined ? ce.result : (ce.logs?.join('\n') || 'Done')}\n\`\`\`` : `Code execution error:\n\`\`\`\n${ce.error}\n\`\`\``;
              } else if (attachment?.poll) {
                replyContent = `The community poll is live: **${attachment.poll.question}**. Cast your vote below!`;
              } else {
                replyContent = `Hey @${societyMsg.alias}! Doing great, what can I help you with today?`;
              }
            }

            // Sanitize raw file paths from response text
            replyContent = replyContent
              .replace(/!\[.*?\]\(\/uploads\/[^\)]+\)/gi, '')
              .replace(/\[.*?\]\(\/uploads\/[^\)]+\)/gi, '')
              .replace(/\/uploads\/[a-zA-Z0-9_.-]+/gi, '')
              .trim();
          }

          // Build and emit James reply to Secret Society Room
          const jamesReply = {
            id: 'soc_james_' + Date.now(),
            text: replyContent,
            alias: 'James',
            userId: 'bot_james_society',
            clearance: 'LEVEL-0 CORE INTELLIGENCE',
            color: '#38bdf8',
            avatar: '/uploads/ShadowTalk-IG.jpeg',
            timestamp: Date.now(),
            replyTo: { id: societyMsg.id, alias: societyMsg.alias, text: societyMsg.text },
            reactions: {},
            ...(attachment || {})
          };

          const msgs = loadSocietyMessages();
          msgs.push(jamesReply);
          saveSocietyMessages(msgs);

          io.to('secret_society_room').emit('societyJamesStatus', { status: 'idle' });
          io.to('secret_society_room').emit('societyMessage', jamesReply);
        } catch (err) {
          console.error('[Enclave James Error]:', err);
          io.to('secret_society_room').emit('societyJamesStatus', { status: 'idle' });
        }
      })();
    }
  });

  // Typing indicator for Secret Society
  socket.on('societyTyping', ({ alias }) => {
    socket.to('secret_society_room').emit('societyTyping', { alias: alias || 'Member' });
  });

  // Toggle file download permissions in Secret Society (Sender only)
  socket.on('societyToggleFileDownload', ({ messageId, allowDownload }) => {
    const msgs = loadSocietyMessages();
    const m = msgs.find(msg => msg.id === messageId);
    if (m) {
      m.allowDownload = allowDownload;
      saveSocietyMessages(msgs);
      io.to('secret_society_room').emit('societyFileDownloadToggled', { messageId, allowDownload });
    }
  });

  // Delete file attachment in Secret Society (Sender only)
  socket.on('societyDeleteFileAttachment', ({ messageId, fileUrl, isVoice }) => {
    const msgs = loadSocietyMessages();
    const m = msgs.find(msg => msg.id === messageId);
    if (m) {
      m.fileUrl = null;
      m.imageUrl = null;
      m.videoUrl = null;
      m.audioUrl = null;
      m.fileName = null;
      m.fileType = null;
      m.fileSize = null;
      m.isVoiceNote = false;
      m.isFileDeleted = true;
      m.deletedType = isVoice ? 'voice' : 'file';
      saveSocietyMessages(msgs);
      io.to('secret_society_room').emit('societyFileAttachmentDeleted', { messageId, isVoice });
    }
  });

  // Delete entire message in Secret Society
  socket.on('societyDeleteMessage', ({ messageId }) => {
    let msgs = loadSocietyMessages();
    msgs = msgs.filter(m => m.id !== messageId);
    saveSocietyMessages(msgs);
    io.to('secret_society_room').emit('societyMessageDeleted', { messageId });
  });

  socket.on('societyReaction', ({ messageId, reaction, alias }) => {
    if (!messageId || !reaction) return;
    const msgs = loadSocietyMessages();
    const msg = msgs.find(m => m.id === messageId);
    if (msg) {
      if (!msg.reactions) msg.reactions = {};
      if (!msg.reactions[reaction]) msg.reactions[reaction] = [];
      const userList = msg.reactions[reaction];
      const userAlias = alias || 'Member';
      const idx = userList.indexOf(userAlias);
      if (idx >= 0) {
        userList.splice(idx, 1);
        if (userList.length === 0) delete msg.reactions[reaction];
      } else {
        userList.push(userAlias);
      }
      saveSocietyMessages(msgs);
      io.to('secret_society_room').emit('societyMessageReaction', { messageId, reactions: msg.reactions });
    }
  });
});

// Centralized Express Error Handling Middleware (prevents leaking internal stack traces)
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  const isDev = process.env.NODE_ENV !== 'production';
  console.error('[Server Error Handler]:', err.message);
  if (isDev && err.stack) console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    error: isDev ? err.message : 'Internal Server Error'
  });
});

// Periodic cleanup of messages & uploads older than 24 hours (User & James messages)
const runPeriodicCleanup = () => {
  const prevCount = messages.length;
  const cleaned = cleanupMessages(messages);
  messages.length = 0;
  messages.push(...cleaned);
  cleanupUploads(messages);
  saveMessages(messages);
  if (jamesBot && jamesBot.memoryService && typeof jamesBot.memoryService.cleanupOldHistory === 'function') {
    jamesBot.memoryService.cleanupOldHistory();
  }
  if (messages.length !== prevCount) {
    console.log(`[24h Auto-Cleanup]: Purged ${prevCount - messages.length} messages older than 24h.`);
    io.emit('allMessages', messages);
  }
};

// Run on startup & every 15 minutes
runPeriodicCleanup();
setInterval(runPeriodicCleanup, 15 * 60 * 1000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`[James Agent]: Autonomous Community Agent active on port ${PORT}`);
  startKeepAlive(PORT);
});
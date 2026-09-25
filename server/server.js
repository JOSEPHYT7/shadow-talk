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

// Configure Socket.io with 100MB buffer and generous timeouts to prevent mobile/cloud disconnections
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    credentials: true,
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e8, // 100 MB
  pingInterval: 25000,
  pingTimeout: 30000
});

// Configure CORS to support credentialed cross-origin requests (HttpOnly cookies + headers)
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

let messages = loadMessages();

// Upload route
app.use('/upload', uploadRouter);

// --- Real Email OTP Verification Endpoints ---
const { sendOtp, verifyOtp, updateEmailConfig, isConfigured } = require('./otpService');

app.get('/api/otp/status', (req, res) => {
  res.json({
    configured: isConfigured(),
    emailUser: process.env.EMAIL_USER || null
  });
});

app.post('/api/otp/send', async (req, res) => {
  try {
    const { email } = req.body;
    const result = await sendOtp(email);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/otp/verify', (req, res) => {
  try {
    const { email, otp, alias, userId } = req.body;
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
  try {
    const { emailUser, appPassword } = req.body;
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
  res.json(loadApplications());
});

// --- Secret Society Verification & Messages API ---
const {
  verifyMemberLogin,
  validateSocietyToken,
  loadSocietyMessages,
  saveSocietyMessages,
  submitWithdrawalRequest
} = require('./services/secretSocietyService');

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

// Track known user profiles: userId / alias (lowercased) -> profile
const userProfiles = new Map();
const DATA_DIR = path.join(__dirname, 'data');
const PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');
const serverStartTime = Date.now();

function loadProfiles() {
  try {
    if (fs.existsSync(PROFILES_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf-8'));
      for (const [id, p] of Object.entries(data)) {
        if (p && (p.userId || p.alias)) {
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
        if (m && m.alias && m.alias !== 'James' && m.alias !== 'System') {
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

// Helper to broadcast real active human user count on the site
const getRealUserCount = () => {
  const uniqueUsers = new Set();
  let anonymousSockets = 0;

  for (const [socketId, user] of activeUsers.entries()) {
    const sock = io.sockets.sockets.get(socketId);
    if (sock && sock.connected) {
      if (user && user.alias) {
        if (user.alias === 'James' || user.userId === 'bot_james') continue; // Exclude internal bot
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
      if (u && u.alias && u.alias !== 'James' && u.userId !== 'bot_james') {
        list.push(u);
      }
    }
    return list;
  }
});

// --- Hidden Administrator System Routes & Protection ---
const createAdminRouter = require('./admin/adminRoutes');
app.use('/api/admin', createAdminRouter({
  io,
  messages,
  saveMessages,
  userProfiles,
  saveProfile,
  activeUsers,
  deleteUploadedFile,
  jamesBot
}));

// Return 404 for direct manual navigation attempts to common admin paths
app.get(['/admin', '/admin-panel', '/secret-admin', '/admin/dashboard'], (req, res) => {
  res.status(404).send('Cannot GET ' + req.path);
});

// --- Clear Chat Maintenance Endpoint (used by clearChat.js and Admin operations) ---
app.post('/api/chat/clear', (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     req.socket?.remoteAddress ||
                     req.ip ||
                     '127.0.0.1';
    const isLocal = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1' || clientIp.includes('127.0.0.1');

    const authHeader = req.headers['authorization'];
    let authorized = isLocal;
    if (!authorized && authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      try {
        const { verifyAdminToken } = require('./admin/adminAuthSession');
        if (verifyAdminToken(token)) authorized = true;
      } catch (e) {}
    }

    if (!authorized) {
      return res.status(403).json({ error: 'Unauthorized: Chat clearance is restricted to localhost CLI or authenticated administrators.' });
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
    messages = [];
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

// Track live active secret society sockets and broadcast real-time member count
const activeSocietyMembers = new Map(); // socket.id -> { alias, clearance, isAdmin }

function broadcastSocietyCount() {
  const uniqueAliases = new Set([...activeSocietyMembers.values()].map(m => (m.alias || '').toLowerCase().trim()).filter(Boolean));
  const count = uniqueAliases.size;
  io.to('secret_society_room').emit('societyMemberCount', { count });
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
    connectedAt: Date.now()
  });
  broadcastUserCount();
  socket.emit('onlineUsers', getOnlineUserAliases());

  const handleUserDisconnect = (socketId) => {
    const user = activeUsers.get(socketId);
    activeUsers.delete(socketId);
    broadcastUserCount();

    if (activeSocietyMembers.has(socketId)) {
      activeSocietyMembers.delete(socketId);
      broadcastSocietyCount();
    }

    if (user && (user.userId || user.alias)) {
      if (user.alias === 'James' || user.userId === 'bot_james') return;

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

  // Live real-time profile updates (bio, status, avatar, alias change, etc.)
  socket.on('userProfileUpdate', (userData) => {
    if (userData && (userData.userId || userData.alias)) {
      const userId = userData.userId || ('usr_' + userData.alias.toLowerCase());
      let existing = getOrCreateProfile(userId, userData.alias) || {};

      const previousAliases = existing.previousAliases || [];
      if (userData.alias && existing.alias && existing.alias.toLowerCase() !== userData.alias.toLowerCase()) {
        if (!previousAliases.includes(existing.alias)) {
          previousAliases.push(existing.alias);
        }
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
    const senderUser = activeUsers.get(socket.id);
    const resolvedUserId = msg.userId || (senderUser ? senderUser.userId : null);

    let message = {
      ...msg,
      userId: resolvedUserId,
      id: msg.id || ('msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9)),
      timestamp: msg.timestamp || Date.now(),
      reactions: msg.reactions || {}
    };

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
    }
    saveMessages(messages);

    io.emit('message', message);

    if (!msg.encrypted && msg.alias) {
      let existing = getOrCreateProfile(resolvedUserId, msg.alias) || {};
      const updated = {
        ...existing,
        alias: msg.alias,
        userId: resolvedUserId || existing.userId,
        color: msg.color || existing.color,
        avatar: msg.avatar !== undefined ? msg.avatar : existing.avatar,
        bio: msg.bio !== undefined ? msg.bio : existing.bio,
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
    const msg = messages.find(m => m.id === messageId);
    if (msg) {
      if (!msg.reactions) msg.reactions = {};
      if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
      // Toggle reaction for this alias
      if (msg.reactions[emoji].includes(alias)) {
        msg.reactions[emoji] = msg.reactions[emoji].filter(a => a !== alias);
      } else {
        msg.reactions[emoji].push(alias);
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
    socket.broadcast.emit('typing', { alias });
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
      activeSocietyMembers.set(socket.id, {
        alias: memberAlias,
        clearance,
        isAdmin: clearance.includes('ROOT') || clearance.includes('OVERSEER')
      });
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
      broadcastSocietyCount();
      // Send immediate count directly to the socket that joined
      const currentAliases = new Set([...activeSocietyMembers.values()].map(m => (m.alias || '').toLowerCase().trim()).filter(Boolean));
      socket.emit('societyMemberCount', { count: currentAliases.size });
      console.log(`[Secret Society]: Socket ${socket.id} (@${memberAlias}) joined enclave frequency. Live: ${currentAliases.size}`);
    } else {
      console.warn(`[Secret Society]: Access denied for socket ${socket.id} (alias: ${alias})`);
      socket.emit('societyAccessDenied', { error: 'Invalid or expired Enclave clearance token' });
    }
  });

  socket.on('leaveSocietyRoom', () => {
    socket.leave('secret_society_room');
    if (activeSocietyMembers.has(socket.id)) {
      activeSocietyMembers.delete(socket.id);
      broadcastSocietyCount();
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

    // Advanced James Bot in Secret Society Room
    const lower = (societyMsg.text || '').toLowerCase();
    const isJamesMentioned = lower.includes('@james') || lower.startsWith('/secrets') || lower.startsWith('/debate') || lower.startsWith('/planetary-plan') || lower.startsWith('/intel');

    if (isJamesMentioned && jamesBot) {
      setTimeout(() => {
        io.to('secret_society_room').emit('societyJamesStatus', { status: 'typing', text: 'James is consulting Enclave Black Archives...' });

        let replyContent = '';
        if (lower.startsWith('/secrets')) {
          replyContent = `📜 **ENCLAVE CLASSIFIED DOSSIER #094**: *The Global Sovereign Architecture*\n\nTrue sovereignty requires decoupling from surveillance infrastructure: zero-knowledge proofs, mesh communications independent of undersea bottlenecks, and localized energy generation. We do not hide to evade truth; we hide to preserve it. What vector shall we inspect next?`;
        } else if (lower.startsWith('/planetary-plan')) {
          replyContent = `🌍 **PLANETARY DIRECTIVE // EARTH RESILIENCE SCAN**:\n\nThe real crisis facing human civilization is not lack of intelligence—it is centralization of stewardship. Our primary projects focus on:\n1. Decentralized microgrids resilient against grid collapse.\n2. Open-hardware environmental sensor rings.\n3. Climate telemetry shielded from corporate greenwashing.\n\nEvery member here is a sovereign guardian of this pale blue dot.`;
        } else if (lower.startsWith('/debate')) {
          const topic = societyMsg.text.replace(/^\/debate\s*/i, '').trim() || 'Technological Sovereignty vs State Containment';
          replyContent = `⚖️ **SOCRATIC COUNCIL DEBATE PROTOCOL INITIATED**:\n\n**Topic**: *${topic}*\n\n*The Thesis*: Centralized institutions claim authority for societal safety.\n*The Antithesis*: Centralized authority inevitably stagnates human potential and weaponizes dependency.\n\nMembers, state your thesis. Keep your logic mathematically grounded.`;
        } else {
          replyContent = `Greetings, fellow sovereign @${societyMsg.alias}. Within this chamber, all corporate telemetry is null-routed. We speak unredacted truths about planetary health, autonomous cryptography, and human freedom. How can the Enclave intelligence assist your mission today?`;
        }

        setTimeout(() => {
          const jamesReply = {
            id: 'soc_james_' + Date.now(),
            text: replyContent,
            alias: 'James [Enclave Archivist]',
            userId: 'bot_james_society',
            clearance: 'LEVEL-0 CORE INTELLIGENCE',
            color: '#ffd700',
            avatar: '/uploads/ShadowTalk-IG.jpeg',
            timestamp: Date.now(),
            replyTo: { id: societyMsg.id, alias: societyMsg.alias, text: societyMsg.text }
          };
          msgs.push(jamesReply);
          saveSocietyMessages(msgs);
          io.to('secret_society_room').emit('societyJamesStatus', { status: 'idle' });
          io.to('secret_society_room').emit('societyMessage', jamesReply);
        }, 1600);
      }, 600);
    }
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

// Periodic cleanup of messages & uploads older than 24 hours (User & James messages)
const runPeriodicCleanup = () => {
  const prevCount = messages.length;
  messages = cleanupMessages(messages);
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
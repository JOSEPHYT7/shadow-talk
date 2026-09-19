// Automatically load environment variables from .env if present
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

// Configure Socket.io with 100MB buffer for rich attachments & base64 fallbacks
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e8, // 100 MB
  pingInterval: 10000,
  pingTimeout: 5000
});

app.use(cors());
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

// In-memory message store
let messages = [];

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

// Track connected socket users: socketId -> { alias, userId }
const activeUsers = new Map();

// Track known user profiles: userId / alias (lowercased) -> profile
const userProfiles = new Map();

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
}

// Pre-seed James Bot profile
const jamesBotProfile = {
  alias: 'James',
  userId: 'bot_james',
  color: '#00f3ff',
  avatar: null,
  bio: "Full-stack engineer & verified community member. Always around!",
  status: 'Online',
  isOnline: true,
  isVerified: true,
  updatedAt: Date.now()
};
saveProfile(jamesBotProfile);

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

const broadcastUserCount = () => {
  const count = getRealUserCount();
  io.emit('userCount', count);
};

// Initialize autonomous James Community Agent
const jamesBot = new JamesBot(io, (msg) => {
  messages.push(msg);
}, {
  getUserCount: () => getRealUserCount(),
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

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  activeUsers.set(socket.id, null);
  broadcastUserCount();

  const handleUserDisconnect = (socketId) => {
    const user = activeUsers.get(socketId);
    activeUsers.delete(socketId);
    broadcastUserCount();

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
        userId: userId
      });
      broadcastUserCount();

      let existing = getOrCreateProfile(userId, userData.alias) || {};
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
        isVerified: userData.isVerified !== undefined ? userData.isVerified : existing.isVerified,
        updatedAt: Date.now()
      };

      saveProfile(updatedProfile);
      io.emit('userProfileUpdated', updatedProfile);

      jamesBot.welcomeUser(userData.alias, socket.id, userId);
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
    }
  });

  // Handle new message (text, files, links, replies)
  socket.on('message', (msg) => {
    const senderUser = activeUsers.get(socket.id);
    const resolvedUserId = msg.userId || (senderUser ? senderUser.userId : null);

    let message = {
      ...msg,
      userId: resolvedUserId,
      id: msg.id || Date.now() + Math.random(),
      timestamp: Date.now(),
      reactions: msg.reactions || {}
    };

    messages.push(message);
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
      console.log(`[File Attachment Marked Deleted] id: ${messageId} (type: ${msg.deletedType})`);
    }
  });
});

// Periodic cleanup of messages & uploads older than 24 hours
const runPeriodicCleanup = () => {
  const prevCount = messages.length;
  messages = cleanupMessages(messages);
  cleanupUploads();
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
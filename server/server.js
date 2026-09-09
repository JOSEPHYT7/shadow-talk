const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Configure Socket.io with 100MB buffer for rich attachments & base64 fallbacks
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e8 // 100 MB
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

// In-memory message store
let messages = [];

// Initialize 24/7 autonomous James Bot
const jamesBot = new JamesBot(io, (msg) => {
  messages.push(msg);
});

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
    const { email, otp, alias } = req.body;
    const result = verifyOtp(email, otp);
    if (result.verified && alias) {
      io.emit('userVerified', { alias, email: result.email, isVerified: true });
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

// Helper to broadcast active user count (Always +1 for permanent 24/7 bot James)
const broadcastUserCount = () => {
  const count = Math.max(1, io.engine.clientsCount + 1);
  io.emit('userCount', count);
};

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  broadcastUserCount();

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    broadcastUserCount();
  });

  // Send current messages to new user
  socket.emit('init', messages);

  // User identifies themselves upon joining
  socket.on('userJoined', (userData) => {
    if (userData && userData.alias) {
      jamesBot.welcomeUser(userData.alias, socket.id);
    }
  });

  // Handle new message (text, files, links, replies)
  socket.on('message', (msg) => {
    let message;
    if (msg.encrypted) {
      message = {
        ...msg,
        id: msg.id || Date.now() + Math.random(),
        timestamp: Date.now(),
        reactions: msg.reactions || {}
      };
    } else {
      message = {
        ...msg,
        id: msg.id || Date.now() + Math.random(),
        timestamp: Date.now(),
        reactions: msg.reactions || {}
      };
    }

    messages.push(message);
    io.emit('message', message);

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
});

// Periodic cleanup every hour
setInterval(() => {
  messages = cleanupMessages(messages);
  cleanupUploads();
}, 60 * 60 * 1000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`[James Bot]: 24/7 AI Guardian active on port ${PORT}`);
});
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const uploadRouter = require('./upload');
const { cleanupUploads, cleanupMessages } = require('./cleanup');

// In-memory message store
let messages = [];

// Upload route
app.use('/upload', uploadRouter);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Send current messages to new user
  socket.emit('init', messages);

  // Handle new text message
  socket.on('message', (msg) => {
    if (msg.encrypted) {
      // Encrypted message: add id/timestamp/reactions at top level
      const message = {
        ...msg,
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
        reactions: {}
      };
      messages.push(message);
      io.emit('message', message);
    } else {
      // Plain message: add id/timestamp/reactions as before
      const message = { ...msg, id: Date.now() + Math.random(), timestamp: Date.now(), reactions: {} };
      messages.push(message);
      io.emit('message', message);
    }
  });

  // Handle image message (metadata only, image upload is via /upload)
  socket.on('image', (imgMsg) => {
    const message = { ...imgMsg, id: Date.now() + Math.random(), timestamp: Date.now(), type: 'image', reactions: {} };
    messages.push(message);
    io.emit('message', message);
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
});

// Periodic cleanup every hour
setInterval(() => {
  messages = cleanupMessages(messages);
  cleanupUploads();
}, 60 * 60 * 1000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
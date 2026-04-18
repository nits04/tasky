const jwt = require('jsonwebtoken');
const User = require('../models/User');

const setupSocket = (io) => {
  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name avatar email');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    // Each user joins their own room for targeted events
    socket.join(userId);
    console.log(`Socket connected: ${socket.user.name} (${socket.id})`);

    // Update last active
    User.findByIdAndUpdate(userId, { lastActive: new Date() }).catch(() => {});

    // ── Collaboration rooms ──────────────────────────────────────────────
    socket.on('task:join', (taskId) => {
      socket.join(`task:${taskId}`);
    });

    socket.on('task:leave', (taskId) => {
      socket.leave(`task:${taskId}`);
    });

    // ── Typing indicators for task comments ─────────────────────────────
    socket.on('task:typing', ({ taskId, isTyping }) => {
      socket.to(`task:${taskId}`).emit('task:typing', {
        taskId,
        user: { _id: userId, name: socket.user.name, avatar: socket.user.avatar },
        isTyping,
      });
    });

    // ── Cursor presence ─────────────────────────────────────────────────
    socket.on('user:presence', ({ status }) => {
      socket.broadcast.emit('user:presence', {
        userId,
        name: socket.user.name,
        avatar: socket.user.avatar,
        status,
      });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.name}`);
      socket.broadcast.emit('user:presence', { userId, status: 'offline' });
    });
  });
};

module.exports = setupSocket;

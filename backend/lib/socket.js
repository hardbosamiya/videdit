const jwt = require('jsonwebtoken');
const User = require('../models/User');

const setupSocketIO = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user || !user.isActive) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.name} (${socket.user.role})`);

    // Join job room
    socket.on('join_job', (jobId) => {
      socket.join(`job_${jobId}`);
      console.log(`${socket.user.name} joined job_${jobId}`);
    });

    socket.on('leave_job', (jobId) => {
      socket.leave(`job_${jobId}`);
    });

    // Typing indicators
    socket.on('typing', ({ jobId }) => {
      socket.to(`job_${jobId}`).emit('user_typing', {
        userId: socket.user._id,
        name: socket.user.name,
      });
    });

    socket.on('stop_typing', ({ jobId }) => {
      socket.to(`job_${jobId}`).emit('user_stop_typing', { userId: socket.user._id });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.name}`);
    });
  });
};

module.exports = { setupSocketIO };

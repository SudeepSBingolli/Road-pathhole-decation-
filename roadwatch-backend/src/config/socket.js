const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');

let io = null;

/**
 * Initializes Socket.IO with CORS and JWT authentication middleware
 * @param {import('http').Server} httpServer 
 * @returns {Server}
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  // Authentication Middleware for Handshake
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      // Also check headers.authorization as fallback
      if (!token && socket.handshake.headers?.authorization) {
        const authHeader = socket.handshake.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.split(' ')[1];
        }
      }

      if (!token) {
        return next(new Error('Authentication failed: Token is missing from handshake'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user || !user.isActive) {
        return next(new Error('Authentication failed: User account not found or deactivated'));
      }

      // Attach user to socket instance
      socket.user = user;
      next();
    } catch (err) {
      return next(new Error(`Authentication error: ${err.message}`));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`[Socket.IO] Client connected: ${user.name} (${user.role}) - ID: ${socket.id}`);

    // 1. Join personal room: user:<id>
    const userRoom = `user:${user._id.toString()}`;
    socket.join(userRoom);

    // 2. Join role-based room: role:admin
    if (user.role === 'admin') {
      socket.join('role:admin');
      console.log(`[Socket.IO] User ${user.name} joined room: role:admin`);
    }

    // 3. Join team room: team:<id>
    if (user.team) {
      const teamRoom = `team:${user.team.toString()}`;
      socket.join(teamRoom);
      console.log(`[Socket.IO] User ${user.name} joined room: ${teamRoom}`);
    }

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${user.name} (${reason})`);
    });
  });

  return io;
};

/**
 * Accessor for the active Socket.IO server instance
 * @returns {Server}
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized yet. Call initSocket(server) first.');
  }
  return io;
};

/**
 * Helper to emit a socket event to target rooms AND persist Notification documents in DB
 * 
 * @param {Object} options
 * @param {string} options.event - Event name (e.g. 'report:new', 'report:statusChanged', 'task:assigned', 'repair:submitted', 'repair:verified')
 * @param {string|string[]} options.rooms - Room or array of rooms to emit to
 * @param {Object} options.data - Payload to emit
 * @param {string} options.message - Human-readable message for the notification
 * @param {string} [options.reportId] - Related report ID
 * @param {string|string[]} [options.recipientUserIds] - User ID(s) who should receive persisted DB notifications
 */
const notifyAndEmit = async ({
  event,
  rooms,
  data,
  message,
  reportId = null,
  recipientUserIds = []
}) => {
  try {
    // 1. Emit realtime socket event
    if (io) {
      const targetRooms = Array.isArray(rooms) ? rooms : [rooms];
      targetRooms.forEach((room) => {
        io.to(room).emit(event, data);
      });
    }

    // 2. Persist notifications to DB for specified users
    let userIds = Array.isArray(recipientUserIds) ? recipientUserIds : [recipientUserIds];
    userIds = userIds.filter(Boolean);

    // If no explicit userIds but we need to notify all admins
    if (userIds.length === 0 && (Array.isArray(rooms) ? rooms : [rooms]).includes('role:admin')) {
      const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
      userIds = admins.map((a) => a._id);
    }

    if (userIds.length > 0) {
      const notifications = userIds.map((uid) => ({
        user: uid,
        message,
        report: reportId,
        type: event,
        isRead: false
      }));
      await Notification.insertMany(notifications);
    }
  } catch (err) {
    console.error(`[Socket/Notify Error] Failed during ${event}:`, err.message);
  }
};

module.exports = {
  initSocket,
  getIO,
  notifyAndEmit
};


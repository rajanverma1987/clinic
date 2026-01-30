/**
 * Custom Next.js Server with Socket.IO
 * Required for real-time chat functionality
 * Uses central logger (lib/utils/logger.js) for all server-side logging.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

// Check NODE_ENV, default to development if not set
const dev = !process.env.NODE_ENV || process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '5053', 10);

const app = next({ dev, hostname });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const { logger } = await import('./lib/utils/logger.js');

  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      logger.error('Error occurred handling request', err, { url: req.url });
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Initialize real-time manager for appointments, queue, etc. (separate from telemedicine)
  try {
    const { initRealtimeManager } = require('./lib/realtime/realtime-manager.js');
    initRealtimeManager(io);
  } catch (err) {
    logger.warn('Failed to initialize real-time manager; continuing without real-time features', {
      error: err?.message,
    });
  }

  io.on('connection', (socket) => {
    socket.on('join-session', (sessionId) => {
      if (!sessionId) {
        socket.emit('error', { message: 'Session ID is required' });
        return;
      }

      socket.join(`session:${sessionId}`);

      // Notify others in the session
      socket.to(`session:${sessionId}`).emit('user-joined', {
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });
    });

    // Leave session room
    socket.on('leave-session', (sessionId) => {
      if (sessionId) {
        socket.leave(`session:${sessionId}`);

        // Notify others in the session
        socket.to(`session:${sessionId}`).emit('user-left', {
          socketId: socket.id,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Handle chat message
    socket.on('chat-message', async (data) => {
      const { sessionId, message, senderId, senderName, timestamp, encrypted } = data;

      if (!sessionId || !message) {
        socket.emit('error', { message: 'Session ID and message are required' });
        return;
      }

      // Broadcast to all OTHER clients in the session (exclude sender to prevent duplicate)
      socket.to(`session:${sessionId}`).emit('chat-message', {
        sessionId,
        message,
        senderId,
        senderName: senderName || 'Unknown',
        timestamp: timestamp || new Date().toISOString(),
        encrypted: encrypted || false,
      });
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { sessionId, senderId, isTyping } = data;
      if (sessionId) {
        socket.to(`session:${sessionId}`).emit('typing', {
          senderId,
          isTyping,
          timestamp: new Date().toISOString(),
        });
      }
    });

    socket.on('disconnect', () => {});
  });

  httpServer
    .once('error', (err) => {
      logger.error('Server listen error', err);
      process.exit(1);
    })
    .listen(port, () => {
      logger.info(`Ready on http://${hostname}:${port}`);
      logger.info('Socket.IO server initialized');
    });
});

/**
 * Custom Next.js Server with Socket.IO
 * Required for real-time chat functionality
 * Uses central logger (lib/utils/logger.js) for all server-side logging.
 */

const path = require('path');

// Load env from app root (apps/clinic) so it works whether you run from repo root or apps/clinic
const appRoot = __dirname;
if (process.env.NODE_ENV !== 'production') {
  process.env.DOTENV_CONFIG_QUIET = '1';
}
require('dotenv').config({ path: path.join(appRoot, '.env') });
require('dotenv').config({ path: path.join(appRoot, '.env.local') });

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
  const loggerModule = await import('./lib/utils/logger.js');
  const { logger } = loggerModule.default || loggerModule;

  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      // In dev, brief delay for app page chunks so Next can compile on first hit (avoids 404 for e.g. app/admin/page.js)
      const pathname = parsedUrl.pathname || '';
      const isAppPageChunk =
        dev &&
        req.method === 'GET' &&
        pathname.startsWith('/_next/static/chunks/app/') &&
        pathname.includes('page');
      if (isAppPageChunk) {
        await new Promise((r) => setTimeout(r, 200));
      }
      await handle(req, res, parsedUrl);
    } catch (err) {
      logger.error('Error occurred handling request', err, { url: req.url });
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Parse allowed origins from env — never fall back to wildcard '*'
  const getAllowedOrigins = () => {
    if (process.env.CORS_ORIGINS) {
      return process.env.CORS_ORIGINS.split(',').map((o) => o.trim());
    }
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return [process.env.NEXT_PUBLIC_APP_URL];
    }
    // Dev fallback only
    return ['http://localhost:5053', 'http://localhost:3000'];
  };

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Initialize real-time manager for appointments, queue, etc. (separate from telemedicine)
  try {
    const { initRealtimeManager } = require('./lib/realtime/realtime-manager.js');
    initRealtimeManager(io);
    logger.info('✅ Real-time manager initialized');
  } catch (err) {
    logger.warn('Failed to initialize real-time manager; continuing without real-time features', {
      error: err?.message,
    });
  }

  // Initialize background jobs after server setup
  // Jobs will connect to DB internally when needed
  const { initializeJobs } = require('./jobs/index.js');
  initializeJobs().then(() => {
    logger.info('✅ Background jobs initialized');
  }).catch((err) => {
    logger.warn('Failed to initialize background jobs; continuing without pre-computed stats', {
      error: err?.message,
    });
  });

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

    socket.on('disconnect', () => { });
  });

  httpServer
    .once('error', (err) => {
      logger.error('Server listen error', err);
      process.exit(1);
    })
    .listen(port, () => {
      logger.info(`🚀 Server running on port ${port}`);
      logger.info(`Ready on http://${hostname}:${port}`);
      logger.info('Socket.IO server initialized');
      logger.info('Background jobs active');
    });
});

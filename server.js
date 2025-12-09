/**
 * Custom Next.js Server with Socket.IO
 * Required for real-time chat functionality
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '5053', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('[Socket.IO] ✅ Client connected:', socket.id);

    // Join session room
    socket.on('join-session', (sessionId) => {
      if (!sessionId) {
        socket.emit('error', { message: 'Session ID is required' });
        return;
      }
      
      socket.join(`session:${sessionId}`);
      console.log(`[Socket.IO] Client ${socket.id} joined session: ${sessionId}`);
      
      // Notify others in the session
      socket.to(`session:${sessionId}`).emit('user-joined', {
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    // Leave session room
    socket.on('leave-session', (sessionId) => {
      if (sessionId) {
        socket.leave(`session:${sessionId}`);
        console.log(`[Socket.IO] Client ${socket.id} left session: ${sessionId}`);
        
        // Notify others in the session
        socket.to(`session:${sessionId}`).emit('user-left', {
          socketId: socket.id,
          timestamp: new Date().toISOString()
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

      console.log(`[Socket.IO] 📨 Chat message in session ${sessionId} from ${senderId}`);

      // Broadcast to all clients in the session (including sender for confirmation)
      io.to(`session:${sessionId}`).emit('chat-message', {
        sessionId,
        message,
        senderId,
        senderName: senderName || 'Unknown',
        timestamp: timestamp || new Date().toISOString(),
        encrypted: encrypted || false
      });
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { sessionId, senderId, isTyping } = data;
      if (sessionId) {
        socket.to(`session:${sessionId}`).emit('typing', {
          senderId,
          isTyping,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('[Socket.IO] ❌ Client disconnected:', socket.id);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO server initialized`);
    });
});

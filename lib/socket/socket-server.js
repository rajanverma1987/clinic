/**
 * Socket.IO Server Setup for Real-time Chat
 * Provides real-time messaging for telemedicine sessions
 */

import { Server } from 'socket.io';

let io = null;

/**
 * Initialize Socket.IO server
 * @param {http.Server} server - HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
export function initSocketServer(server) {
  if (io) {
    return io; // Already initialized
  }

  io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log('[Socket.IO] Client connected:', socket.id);

    // Join session room
    socket.on('join-session', (sessionId) => {
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
      socket.leave(`session:${sessionId}`);
      console.log(`[Socket.IO] Client ${socket.id} left session: ${sessionId}`);
      
      // Notify others in the session
      socket.to(`session:${sessionId}`).emit('user-left', {
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    // Handle chat message
    socket.on('chat-message', async (data) => {
      const { sessionId, message, senderId, senderName, timestamp, encrypted } = data;
      
      if (!sessionId || !message) {
        socket.emit('error', { message: 'Session ID and message are required' });
        return;
      }

      console.log(`[Socket.IO] Chat message received in session ${sessionId} from ${senderId}`);

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
      console.log('[Socket.IO] Client disconnected:', socket.id);
    });
  });

  console.log('[Socket.IO] Server initialized');
  return io;
}

/**
 * Get Socket.IO server instance
 * @returns {Server|null} Socket.IO server instance or null if not initialized
 */
export function getSocketServer() {
  return io;
}

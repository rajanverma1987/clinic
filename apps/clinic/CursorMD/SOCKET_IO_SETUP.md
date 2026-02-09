# Socket.IO Setup for Real-time Chat

## Overview
Implemented Socket.IO for real-time chat messaging in telemedicine sessions, replacing polling with instant message delivery.

## Implementation

### 1. Custom Server Setup ✅
**File**: `server.js`

Created a custom Next.js server that integrates Socket.IO:
- HTTP server wraps Next.js app
- Socket.IO server attached to HTTP server
- Handles WebSocket connections for real-time communication

### 2. Socket.IO Server Configuration ✅
**Features**:
- Session-based rooms (`session:{sessionId}`)
- Real-time message broadcasting
- User join/leave notifications
- Typing indicators support
- Automatic reconnection

### 3. Client Integration ✅
**File**: `app/telemedicine/[id]/page.jsx`

**Features**:
- Socket.IO client connection on component mount
- Joins session room automatically
- Receives messages in real-time
- Sends messages via Socket.IO + backend (dual persistence)
- Handles encryption/decryption
- Automatic cleanup on unmount

## Usage

### Starting the Server

**Development**:
```bash
npm run dev
```
This now uses the custom server with Socket.IO support.

**Production**:
```bash
npm run build
npm start
```

### Environment Variables

Optional (for custom Socket.IO URL):
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:5053
```

If not set, defaults to `window.location.origin`.

## Message Flow

1. **User sends message**:
   - Message encrypted client-side (if E2EE enabled)
   - Sent via Socket.IO for instant delivery
   - Also saved to backend for persistence

2. **Other users receive**:
   - Socket.IO broadcasts to all users in session room
   - Message decrypted client-side (if encrypted)
   - Added to chat messages state

3. **Backend persistence**:
   - Messages also saved to MongoDB via API
   - Ensures messages persist even if Socket.IO disconnects

## Benefits

1. **Real-time Delivery**: Messages appear instantly (no polling delay)
2. **Lower Server Load**: No constant polling requests
3. **Better UX**: Instant message delivery
4. **Dual Persistence**: Socket.IO for speed + API for reliability
5. **Automatic Reconnection**: Socket.IO handles reconnection automatically

## Socket.IO Events

### Client → Server
- `join-session`: Join a session room
- `leave-session`: Leave a session room
- `chat-message`: Send a chat message
- `typing`: Send typing indicator

### Server → Client
- `chat-message`: Receive a chat message
- `user-joined`: User joined the session
- `user-left`: User left the session
- `typing`: User is typing
- `error`: Error occurred

## Fallback

If Socket.IO connection fails:
- System falls back to polling (existing implementation)
- Messages still work via API polling
- No functionality loss

## Files Created/Modified

1. **New**: `server.js` - Custom Next.js server with Socket.IO
2. **New**: `lib/socket/socket-server.js` - Socket.IO server utilities (for reference)
3. **New**: `app/api/socket/route.js` - Socket.IO health check endpoint
4. **Modified**: `app/telemedicine/[id]/page.jsx` - Socket.IO client integration
5. **Modified**: `package.json` - Updated scripts to use custom server

## Testing

1. Start server: `npm run dev`
2. Open two browser windows with same session
3. Send message from one window
4. Message should appear instantly in other window
5. Check console for Socket.IO connection logs

## Troubleshooting

**Socket.IO not connecting**:
- Check server is running with custom server (`npm run dev`)
- Check browser console for connection errors
- Verify CORS settings in `server.js`

**Messages not appearing**:
- Check Socket.IO connection status in console
- Verify session ID matches in both clients
- Check backend API is saving messages

**Fallback to polling**:
- If Socket.IO fails, system automatically uses polling
- Messages will still work, just with slight delay

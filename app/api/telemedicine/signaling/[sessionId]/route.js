import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

// In-memory storage for signaling messages
// In production, use Redis or a database
const signalingStore = new Map();

// Cleanup old messages (older than 5 minutes)
const MESSAGE_TTL = 5 * 60 * 1000; // 5 minutes

function cleanupOldMessages() {
  const now = Date.now();
  for (const [key, messages] of signalingStore.entries()) {
    const filtered = messages.filter(msg => now - msg.timestamp < MESSAGE_TTL);
    if (filtered.length === 0) {
      signalingStore.delete(key);
    } else {
      signalingStore.set(key, filtered);
    }
  }
}

// Run cleanup every minute
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldMessages, 60 * 1000);
}

/**
 * POST /api/telemedicine/signaling/:sessionId
 * Send a signaling message (offer, answer, ice-candidate)
 */
export async function POST(
  req,
  context
) {
  try {
    const params = await context.params;
    const sessionId = params.sessionId;
    const body = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        errorResponse('Session ID is required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    if (!body.type || !body.from || !body.to) {
      return NextResponse.json(
        errorResponse('Missing required fields: type, from, to', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Create message
    const message = {
      ...body,
      sessionId,
      timestamp: Date.now(),
      id: `${sessionId}-${Date.now()}-${Math.random()}`,
    };

    // Store message
    const key = `${sessionId}`;
    if (!signalingStore.has(key)) {
      signalingStore.set(key, []);
    }
    signalingStore.get(key).push(message);

    console.log(`[Signaling API] POST ${sessionId}:`, {
      type: message.type,
      from: String(message.from).trim(),
      to: String(message.to).trim(),
      totalMessages: signalingStore.get(key).length,
      allMessages: signalingStore.get(key).map(m => ({ type: m.type, from: String(m.from).trim(), to: String(m.to).trim() }))
    });

    // Cleanup old messages
    cleanupOldMessages();

    return NextResponse.json(successResponse({ message: 'Signal sent successfully' }));
  } catch (error) {
    console.error('Error in POST /api/telemedicine/signaling/[sessionId]:', error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to send signal',
        'SIGNALING_ERROR'
      ),
      { status: 500 }
    );
  }
}

/**
 * GET /api/telemedicine/signaling/:sessionId
 * Poll for signaling messages for a specific user
 */
export async function GET(
  req,
  context
) {
  try {
    const params = await context.params;
    const sessionId = params.sessionId;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!sessionId) {
      return NextResponse.json(
        errorResponse('Session ID is required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        errorResponse('User ID is required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Get messages for this session
    const key = `${sessionId}`;
    const messages = signalingStore.get(key) || [];

    // Filter messages for this user and not from this user
    // Use string comparison to handle different ID formats
    const userIdStr = String(userId).trim();
    const userMessages = messages.filter(
      msg => {
        const msgTo = String(msg.to).trim();
        const msgFrom = String(msg.from).trim();
        const isForUser = msgTo === userIdStr && msgFrom !== userIdStr;
        return isForUser;
      }
    );
    
    console.log(`[Signaling API] GET ${sessionId} for userId "${userIdStr}":`, {
      totalMessages: messages.length,
      userMessages: userMessages.length,
      messageTypes: userMessages.map(m => m.type),
      allMessages: messages.map(m => ({ 
        type: m.type, 
        from: String(m.from).trim(), 
        to: String(m.to).trim(),
        isForUser: String(m.to).trim() === userIdStr && String(m.from).trim() !== userIdStr
      })),
    });

    // Remove retrieved messages from store (one-time delivery)
    if (userMessages.length > 0) {
      const remaining = messages.filter(
        msg => !(String(msg.to) === String(userId) && String(msg.from) !== String(userId))
      );
      if (remaining.length === 0) {
        signalingStore.delete(key);
      } else {
        signalingStore.set(key, remaining);
      }
    }

    // Cleanup old messages
    cleanupOldMessages();

    return NextResponse.json(successResponse(userMessages));
  } catch (error) {
    console.error('Error in GET /api/telemedicine/signaling/[sessionId]:', error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to fetch signals',
        'SIGNALING_ERROR'
      ),
      { status: 500 }
    );
  }
}


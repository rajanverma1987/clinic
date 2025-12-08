/**
 * Signaling API for WebRTC
 * Handles SDP offer/answer and ICE candidate exchange
 * HIPAA-compliant: Only signaling data, no media content
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection.js';
import TelemedicineSession from '@/models/TelemedicineSession.js';
import { withTenant } from '@/lib/db/tenant-helper.js';

// In-memory signaling storage (use Redis in production)
// Structure: { [sessionId]: { [userId]: [{ id, from, to, signal, timestamp }] } }
const signalingStore = new Map();

// Cleanup old signals (older than 5 minutes)
setInterval(() => {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes

  for (const [sessionId, userSignals] of signalingStore.entries()) {
    for (const [userId, signals] of userSignals.entries()) {
      const filtered = signals.filter(s => now - s.timestamp < maxAge);
      if (filtered.length === 0) {
        userSignals.delete(userId);
      } else {
        userSignals.set(userId, filtered);
      }
    }

    if (userSignals.size === 0) {
      signalingStore.delete(sessionId);
    }
  }
}, 60000); // Run cleanup every minute

/**
 * POST /api/telemedicine/signaling/:id
 * Send signaling data (SDP offer/answer or ICE candidate)
 * Public endpoint (patients may not be authenticated)
 */
export async function POST(
  req,
  context
) {
  try {
    const params = await context.params;
    const sessionId = params.id;
    const body = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        errorResponse('Session ID is required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const { from, to, signal } = body;

    if (!from || !to || !signal) {
      return NextResponse.json(
        errorResponse('from, to, and signal are required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Verify session exists (optional auth check)
    await connectDB();
    const session = await TelemedicineSession.findById(sessionId).lean();

    if (!session) {
      return NextResponse.json(
        errorResponse('Session not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Initialize session store if needed
    if (!signalingStore.has(sessionId)) {
      signalingStore.set(sessionId, new Map());
    }

    const sessionStore = signalingStore.get(sessionId);

    // Initialize user store if needed
    if (!sessionStore.has(to)) {
      sessionStore.set(to, []);
    }

    // Add signal to recipient's queue
    const signalId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const signalData = {
      id: signalId,
      from,
      to,
      signal,
      timestamp: Date.now()
    };

    sessionStore.get(to).push(signalData);

    // Debug: Log all users in session after adding signal
    const allUserIds = Array.from(sessionStore.keys());
    const recipientQueue = sessionStore.get(to) || [];
    console.log(`[Signaling API] POST ${sessionId}: Signal from ${from} to ${to}`, {
      signalType: signal.type || 'unknown',
      signalId,
      totalSignalsForRecipient: recipientQueue.length,
      allUsersInSession: allUserIds,
      recipientHasQueue: sessionStore.has(to),
      recipientQueueSize: recipientQueue.length,
      latestSignalInQueue: recipientQueue.length > 0 ? {
        id: recipientQueue[recipientQueue.length - 1].id,
        type: recipientQueue[recipientQueue.length - 1].signal?.type || 'unknown',
        from: recipientQueue[recipientQueue.length - 1].from
      } : null
    });

    return NextResponse.json(successResponse({
      id: signalId,
      sent: true
    }));
  } catch (error) {
    console.error('Error in POST /api/telemedicine/signaling/[id]:', error);
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
 * GET /api/telemedicine/signaling/:id
 * Poll for incoming signals
 * Public endpoint (patients may not be authenticated)
 */
export async function GET(
  req,
  context
) {
  try {
    const params = await context.params;
    const sessionId = params.id;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const lastSignalId = searchParams.get('lastSignalId') || '';

    if (!sessionId || !userId) {
      return NextResponse.json(
        errorResponse('Session ID and userId are required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Verify session exists
    await connectDB();
    const session = await TelemedicineSession.findById(sessionId).lean();

    if (!session) {
      return NextResponse.json(
        errorResponse('Session not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Get signals for this user
    const sessionStore = signalingStore.get(sessionId);
    const userSignals = sessionStore?.get(userId) || [];

    // Debug: Log all users in this session for troubleshooting
    if (sessionStore) {
      const allUserIds = Array.from(sessionStore.keys());
      console.log(`[Signaling API] GET ${sessionId} - All users in session:`, allUserIds);
      console.log(`[Signaling API] GET ${sessionId} - Requesting userId:`, userId);
      console.log(`[Signaling API] GET ${sessionId} - Signals for this user:`, userSignals.length);

      // Check if requesting user exists in session
      if (!sessionStore.has(userId)) {
        console.warn(`[Signaling API] ⚠️ User ${userId} not found in session store. Available users:`, allUserIds);
      }

      // Log signals for all users (for debugging)
      let totalSignalsInSession = 0;
      for (const [uid, signals] of sessionStore.entries()) {
        totalSignalsInSession += signals.length;
        if (signals.length > 0) {
          console.log(`[Signaling API] User ${uid} has ${signals.length} signal(s):`, signals.map(s => ({
            id: s.id,
            from: s.from,
            to: s.to,
            type: s.signal?.type || 'unknown',
            timestamp: new Date(s.timestamp).toISOString()
          })));
        }
      }

      if (totalSignalsInSession === 0) {
        console.warn(`[Signaling API] ⚠️ No signals in session ${sessionId} for any user. Doctor may not have connected yet.`);
      }
    } else {
      console.warn(`[Signaling API] ⚠️ Session store not found for ${sessionId}. This is normal if no signals have been sent yet.`);
    }

    console.log(`[Signaling API] GET ${sessionId} for userId ${userId}:`, {
      totalSignals: userSignals.length,
      lastSignalId,
      allSignalIds: userSignals.map(s => s.id)
    });

    // Filter signals after lastSignalId
    let signals = userSignals;
    if (lastSignalId) {
      const lastIndex = userSignals.findIndex(s => s.id === lastSignalId);
      if (lastIndex >= 0) {
        signals = userSignals.slice(lastIndex + 1);
      }
    }

    console.log(`[Signaling API] Returning ${signals.length} new signals for userId ${userId}`);

    // Clear processed signals (keep only last 10 for debugging)
    if (sessionStore && sessionStore.has(userId)) {
      const allSignals = sessionStore.get(userId);
      if (allSignals.length > 10) {
        sessionStore.set(userId, allSignals.slice(-10));
      }
    }

    return NextResponse.json(successResponse({
      signals: signals.map(s => ({
        id: s.id,
        from: s.from,
        signal: s.signal
      }))
    }));
  } catch (error) {
    console.error('Error in GET /api/telemedicine/signaling/[id]:', error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to fetch signals',
        'SIGNALING_ERROR'
      ),
      { status: 500 }
    );
  }
}

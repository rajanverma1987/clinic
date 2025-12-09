/**
 * Waiting Room API
 * Manage waiting room participants
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection.js';
import TelemedicineSession from '@/models/TelemedicineSession.js';
import { AuditLogger } from '@/lib/audit/audit-logger.js';

/**
 * POST /api/telemedicine/sessions/[id]/waiting-room
 * Add participant to waiting room
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

    const { userId, name, role } = body;

    if (!userId || !name || !role) {
      return NextResponse.json(
        errorResponse('userId, name, and role are required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    await connectDB();
    const session = await TelemedicineSession.findOne({ sessionId }).lean();

    if (!session) {
      return NextResponse.json(
        errorResponse('Session not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Check if participant already exists
    const existingParticipant = session.participants?.find(p => p.userId?.toString() === userId);

    if (existingParticipant) {
      return NextResponse.json(successResponse({
        participant: existingParticipant,
        message: 'Participant already in waiting room'
      }));
    }

    // Add participant to waiting room
    const participant = {
      userId,
      name,
      role,
      status: 'waiting',
      joinedAt: new Date()
    };

    await TelemedicineSession.updateOne(
      { sessionId },
      { $push: { participants: participant } }
    );

    return NextResponse.json(successResponse({
      participant,
      message: 'Added to waiting room'
    }));
  } catch (error) {
    console.error('Error in POST /api/telemedicine/sessions/[id]/waiting-room:', error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to add to waiting room',
        'WAITING_ROOM_ERROR'
      ),
      { status: 500 }
    );
  }
}

/**
 * GET /api/telemedicine/sessions/[id]/waiting-room
 * Get waiting room participants
 */
export async function GET(
  req,
  context
) {
  try {
    const params = await context.params;
    const sessionId = params.id;

    if (!sessionId) {
      return NextResponse.json(
        errorResponse('Session ID is required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    await connectDB();
    const session = await TelemedicineSession.findOne({ sessionId }).lean();

    if (!session) {
      return NextResponse.json(
        errorResponse('Session not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    const waitingParticipants = (session.participants || []).filter(p => p.status === 'waiting');

    return NextResponse.json(successResponse({
      participants: waitingParticipants
    }));
  } catch (error) {
    console.error('Error in GET /api/telemedicine/sessions/[id]/waiting-room:', error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to fetch waiting room',
        'WAITING_ROOM_ERROR'
      ),
      { status: 500 }
    );
  }
}

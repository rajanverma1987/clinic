/**
 * File Transfer API for Telemedicine Sessions
 * HIPAA-compliant encrypted file sharing
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection.js';
import TelemedicineSession from '@/models/TelemedicineSession.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { AuditLogger } from '@/lib/audit/audit-logger.js';

/**
 * POST /api/telemedicine/sessions/[id]/files
 * Upload encrypted file to session
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

    const { fileName, fileType, fileSize, encryptedData, iv, encrypted, uploadedBy, uploadedAt } = body;

    if (!fileName || !encryptedData) {
      return NextResponse.json(
        errorResponse('fileName and encryptedData are required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileSize > maxSize) {
      return NextResponse.json(
        errorResponse('File size exceeds 10MB limit', 'VALIDATION_ERROR'),
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

    // Add encrypted file to session
    // IMPORTANT: Store encrypted file as-is, never decrypt on server
    const fileData = {
      fileName,
      fileType: fileType || 'application/octet-stream',
      fileSize,
      encryptedData: encryptedData, // Encrypted file data
      iv: iv || null, // IV for decryption (if encrypted)
      encrypted: encrypted || false, // Flag indicating if file is encrypted
      uploadedBy,
      uploadedAt: uploadedAt || new Date()
    };

    await TelemedicineSession.updateOne(
      { sessionId },
      { $push: { sharedFiles: fileData } }
    );

    // Audit log
    if (uploadedBy) {
      await AuditLogger.auditWrite(
        'telemedicine_session',
        sessionId,
        uploadedBy,
        session.tenantId,
        'CREATE',
        { fileName, fileSize },
        { action: 'upload_file' }
      );
    }

    return NextResponse.json(successResponse({
      id: Date.now().toString(),
      ...fileData
    }));
  } catch (error) {
    console.error('Error in POST /api/telemedicine/sessions/[id]/files:', error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to upload file',
        'FILE_UPLOAD_ERROR'
      ),
      { status: 500 }
    );
  }
}

/**
 * GET /api/telemedicine/sessions/[id]/files
 * Get all files for a session
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

    return NextResponse.json(successResponse({
      files: session.sharedFiles || []
    }));
  } catch (error) {
    console.error('Error in GET /api/telemedicine/sessions/[id]/files:', error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to fetch files',
        'FILE_FETCH_ERROR'
      ),
      { status: 500 }
    );
  }
}

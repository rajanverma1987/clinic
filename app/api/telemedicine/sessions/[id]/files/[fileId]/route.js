/**
 * File Download API
 * Download encrypted file from session
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection.js';
import TelemedicineSession from '@/models/TelemedicineSession.js';
import { AuditLogger } from '@/lib/audit/audit-logger.js';

/**
 * GET /api/telemedicine/sessions/[id]/files/[fileId]
 * Download encrypted file
 */
export async function GET(
  req,
  context
) {
  try {
    const params = await context.params;
    const sessionId = params.id;
    const fileId = params.fileId;

    if (!sessionId || !fileId) {
      return NextResponse.json(
        errorResponse('Session ID and File ID are required', 'VALIDATION_ERROR'),
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

    // Find file in sharedFiles array
    const file = session.sharedFiles?.find(f =>
      f._id?.toString() === fileId || f.fileName === fileId
    );

    if (!file) {
      return NextResponse.json(
        errorResponse('File not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Audit log (get user from request if available)
    // TODO: Extract user from auth token
    // await AuditLogger.auditWrite(...)

    return NextResponse.json(successResponse({
      fileName: file.fileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      encryptedData: file.encryptedData || file.fileUrl, // Return encrypted data for client-side decryption
      iv: file.iv || null, // IV for decryption
      encrypted: file.encrypted || false, // Flag indicating if file is encrypted
      uploadedAt: file.uploadedAt
    }));
  } catch (error) {
    console.error('Error in GET /api/telemedicine/sessions/[id]/files/[fileId]:', error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to download file',
        'FILE_DOWNLOAD_ERROR'
      ),
      { status: 500 }
    );
  }
}

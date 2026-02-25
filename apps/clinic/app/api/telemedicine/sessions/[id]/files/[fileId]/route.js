/**
 * File Download API
 * Download encrypted file from session
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { findSessionByParamId } from '@/services/telemedicine.service.js';
import connectDB from '@/lib/db/connection.js';
import TelemedicineSession from '@/models/TelemedicineSession.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';
import { logger } from '@/lib/utils/logger.js';

/**
 * GET /api/telemedicine/sessions/[id]/files/[fileId]
 * Download encrypted file
 */
async function getHandler(req, user, context) {
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
    const session = await findSessionByParamId(sessionId, user.tenantId);

    if (!session) {
      return NextResponse.json(
        errorResponse('Session not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    const file = session.sharedFiles?.find(f =>
      f._id?.toString() === fileId || f.fileName === fileId
    );

    if (!file) {
      return NextResponse.json(
        errorResponse('File not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    await AuditLogger.auditWrite(
      'telemedicine_session',
      session._id.toString(),
      user.userId,
      user.tenantId || 'system',
      AuditAction.READ,
      undefined,
      { action: 'file_download', fileId, fileName: file.fileName }
    );

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
    logger.error('Error in GET /api/telemedicine/sessions/[id]/files/[fileId]:', error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to download file',
        'FILE_DOWNLOAD_ERROR'
      ),
      { status: 500 }
    );
  }
}

export const GET = withErrorHandler(withAuth(getHandler));

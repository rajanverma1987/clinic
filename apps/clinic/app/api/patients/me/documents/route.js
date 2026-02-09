/**
 * Patient Documents API Route
 * Handle document uploads for patients
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Patient from '@/models/Patient';
import { withTenant } from '@/lib/db/tenant-helper';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { logger } from '@/lib/utils/logger.js';

/**
 * POST /api/patients/me/documents
 * Upload a document for the current patient
 */
async function postHandler(req, user) {
  await connectDB();

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const category = formData.get('category') || 'medical-record';

    if (!file) {
      return NextResponse.json(errorResponse('File is required', 'VALIDATION_ERROR'), {
        status: 400,
      });
    }

    // Get patient record
    const patient = await Patient.findOne(
      withTenant(user.tenantId, {
        userId: user.userId,
        deletedAt: null,
      })
    );

    if (!patient) {
      return NextResponse.json(errorResponse('Patient not found', 'NOT_FOUND'), { status: 404 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'documents', user.tenantId.toString());
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const filename = `${patient._id}_${timestamp}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Save document reference to patient (using attachments field)
    const documentUrl = `/uploads/documents/${user.tenantId}/${filename}`;
    
    if (!patient.attachments) {
      patient.attachments = [];
    }
    
    patient.attachments.push({
      filename: originalName,
      url: documentUrl,
      fileType: file.type,
      uploadedAt: new Date(),
      uploadedBy: user.userId,
    });

    await patient.save();

    return NextResponse.json(
      successResponse({
        document: {
          filename: originalName,
          url: documentUrl,
          fileType: file.type,
          size: buffer.length,
          uploadedAt: new Date(),
        },
      }),
      { status: 201 }
    );
  } catch (err) {
    logger.error('Failed to upload document:', err);
    return NextResponse.json(errorResponse('Failed to upload document', 'UPLOAD_ERROR'), {
      status: 500,
    });
  }
}

/**
 * GET /api/patients/me/documents
 * Get all documents for the current patient
 */
async function getHandler(req, user) {
  await connectDB();

  try {
    const patient = await Patient.findOne(
      withTenant(user.tenantId, {
        userId: user.userId,
        deletedAt: null,
      })
    ).select('documents');

    if (!patient) {
      return NextResponse.json(errorResponse('Patient not found', 'NOT_FOUND'), { status: 404 });
    }

    return NextResponse.json(
      successResponse({
        documents: patient.attachments || [],
      })
    );
  } catch (err) {
    logger.error('Failed to fetch documents:', err);
    return NextResponse.json(errorResponse('Failed to fetch documents', 'FETCH_ERROR'), {
      status: 500,
    });
  }
}

// Apply middleware
export const POST = withErrorHandler(apiRateLimit(withAuth(postHandler)));
export const GET = withErrorHandler(apiRateLimit(withAuth(getHandler)));

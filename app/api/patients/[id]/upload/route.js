import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import connectDB from '@/lib/db/connection';
import Patient from '@/models/Patient';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

/**
 * POST /api/patients/:id/upload
 * Upload a photo/attachment for a patient
 */
async function postHandler(
  req,
  user,
  { params }
) {
  try {
    await connectDB();
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        errorResponse('No file provided', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        errorResponse('Invalid file type. Only images are allowed.', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        errorResponse('File size exceeds 5MB limit', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Get patient
    const patient = await Patient.findOne({
      _id: params.id,
      tenantId: user.tenantId,
      deletedAt: null,
    });

    if (!patient) {
      return NextResponse.json(
        errorResponse('Patient not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Convert file to base64 for storage (in production, use cloud storage like S3)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Create attachment object
    const attachment = {
      filename: file.name,
      url: dataUrl, // In production, this would be a cloud storage URL
      fileType: file.type,
      uploadedAt: new Date(),
      uploadedBy: user.userId,
    };

    // Add attachment to patient
    if (!patient.attachments) {
      patient.attachments = [];
    }
    patient.attachments.push(attachment);
    await patient.save();

    return NextResponse.json(
      successResponse({
        id: attachment.uploadedAt.toString(),
        filename: attachment.filename,
        url: attachment.url,
        fileType: attachment.fileType,
        uploadedAt: attachment.uploadedAt,
      }),
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) || 'Failed to upload file',
        'UPLOAD_ERROR'
      ),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/patients/:id/upload
 * Delete a patient attachment
 * attachmentId is passed as query parameter
 */
async function deleteHandler(
  req,
  user,
  { params }
) {
  try {
    await connectDB();

    const patient = await Patient.findOne({
      _id: params.id,
      tenantId: user.tenantId,
      deletedAt: null,
    });

    if (!patient) {
      return NextResponse.json(
        errorResponse('Patient not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    if (!patient.attachments || patient.attachments.length === 0) {
      return NextResponse.json(
        errorResponse('No attachments found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Get attachmentId from query parameter
    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get('attachmentId');
    
    if (!attachmentId) {
      return NextResponse.json(
        errorResponse('Attachment ID is required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Remove attachment by uploadedAt timestamp (used as ID)
    const attachmentIndex = patient.attachments.findIndex(
      (att) => new Date(att.uploadedAt).getTime().toString() === attachmentId
    );

    if (attachmentIndex === -1) {
      return NextResponse.json(
        errorResponse('Attachment not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    patient.attachments.splice(attachmentIndex, 1);
    await patient.save();

    return NextResponse.json(
      successResponse({ message: 'Attachment deleted successfully' })
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) || 'Failed to delete attachment',
        'DELETE_ERROR'
      ),
      { status: 500 }
    );
  }
}

// Note: Next.js 14+ uses async params
export async function POST(
  req,
  context
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  
  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;
  
  return postHandler(authenticatedReq, authResult.user, { params });
}

export async function DELETE(
  req,
  context
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  
  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;
  
  return deleteHandler(authenticatedReq, authResult.user, { params });
}


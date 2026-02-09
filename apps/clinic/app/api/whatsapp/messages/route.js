/**
 * WhatsApp Messages API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { z } from 'zod';
import {
  sendWhatsAppMessage,
  listWhatsAppMessages,
} from '@/services/whatsapp.service';

const sendMessageSchema = z.object({
  phoneNumber: z.string().min(10, 'Phone number is required'),
  message: z.string().min(1, 'Message is required').max(1600),
  patientId: z.string().optional(),
  templateName: z.string().optional(),
  relatedTo: z.object({
    type: z.enum(['appointment', 'prescription', 'invoice', 'lab_result', 'general']).optional(),
    id: z.string().optional(),
  }).optional(),
});

const listMessagesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  patientId: z.string().optional(),
  direction: z.enum(['inbound', 'outbound']).optional(),
  status: z.string().optional(),
  from: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * GET /api/whatsapp/messages
 * List WhatsApp messages
 */
async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);

  const queryParams = {
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
    patientId: searchParams.get('patientId') || undefined,
    direction: searchParams.get('direction') || undefined,
    status: searchParams.get('status') || undefined,
    from: searchParams.get('from') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
  };

  const validationResult = listMessagesQuerySchema.safeParse(queryParams);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const result = await listWhatsAppMessages(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(successResponse(result));
}

/**
 * POST /api/whatsapp/messages
 * Send WhatsApp message
 */
async function postHandler(req, user) {
  const body = await req.json();

  const validationResult = sendMessageSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const result = await sendWhatsAppMessage(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(
    successResponse({
      id: result.message._id.toString(),
      messageSid: result.message.messageSid,
      status: result.message.status,
      sentAt: result.message.sentAt,
    }),
    { status: 201 }
  );
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.NOTIFICATION, ACTIONS.READ)(getHandler)
    )
  )
);

export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.NOTIFICATION, ACTIONS.CREATE)(postHandler)
    )
  )
);

/**
 * WhatsApp Webhook API Route
 * Handles incoming messages and status updates from Twilio
 */

import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logIncomingMessage, updateMessageStatus } from '@/services/whatsapp.service';
import { logger } from '@/lib/utils/logger.js';

/**
 * POST /api/whatsapp/webhook
 * Handle Twilio WhatsApp webhook
 */
async function postHandler(req) {
  try {
    const formData = await req.formData();
    const webhookData = Object.fromEntries(formData.entries());

    // Determine webhook type
    const messageSid = webhookData.MessageSid || webhookData.SmsSid;
    const messageStatus = webhookData.MessageStatus || webhookData.SmsStatus;
    const messageBody = webhookData.Body || webhookData.MessageBody;

    // Extract tenantId from webhook (could be in custom parameter or phone number mapping)
    // For now, we'll need to determine tenant from phone number or use a default
    // In production, you'd map Twilio numbers to tenants
    const tenantId = webhookData.tenantId || process.env.DEFAULT_TENANT_ID;

    if (!tenantId) {
      logger.warn('[WHATSAPP WEBHOOK] No tenantId found in webhook');
      // Still return 200 to prevent Twilio retries
      return NextResponse.json(successResponse({ received: true }));
    }

    // If it's a status update
    if (messageSid && messageStatus && !messageBody) {
      await updateMessageStatus(messageSid, messageStatus, webhookData, tenantId);
      return NextResponse.json(successResponse({ status: 'updated' }));
    }

    // If it's an incoming message
    if (messageBody && webhookData.From) {
      await logIncomingMessage(webhookData, tenantId);
      
      // Optional: Auto-reply or trigger automated response
      // This could be handled by a separate service
      
      return NextResponse.json(successResponse({ received: true }));
    }

    // Unknown webhook type
    return NextResponse.json(successResponse({ received: true }));
  } catch (error) {
    logger.error('[WHATSAPP WEBHOOK ERROR]', error);
    // Always return 200 to prevent Twilio retries
    return NextResponse.json(successResponse({ received: true }));
  }
}

// Apply middleware (no auth required for webhooks, but rate limit)
export const POST = withErrorHandler(
  apiRateLimit(postHandler)
);

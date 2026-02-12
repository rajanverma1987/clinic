/**
 * GET/PUT /api/admin/settings/email-sms
 * Platform SMTP + SMS (Twilio) configuration — Super Admin only
 */

import connectDB from '@/lib/db/connection';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import SystemSettings from '@/models/SystemSettings';
import { NextResponse } from 'next/server';

const SLUG = 'platform';

function maskSecret(s) {
  if (!s || typeof s !== 'string') return '';
  if (s.length <= 4) return '****';
  return s.slice(0, 2) + '****' + s.slice(-2);
}

async function getHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  await connectDB();
  let doc = await SystemSettings.findOne({ slug: SLUG }).lean();
  if (!doc) {
    doc = await SystemSettings.create({ slug: SLUG });
    doc = doc.toObject();
  }
  const smtp = doc.smtp || {};
  const sms = doc.sms || {};
  return NextResponse.json(
    successResponse({
      smtp: {
        host: smtp.host || '',
        port: smtp.port ?? 587,
        secure: smtp.secure ?? false,
        user: smtp.user || '',
        password: smtp.password ? maskSecret(smtp.password) : '',
        passwordSet: !!smtp.password,
        fromEmail: smtp.fromEmail || '',
        fromName: smtp.fromName || '',
      },
      sms: {
        twilioAccountSid: sms.twilioAccountSid || '',
        twilioAuthToken: sms.twilioAuthToken ? maskSecret(sms.twilioAuthToken) : '',
        twilioAuthTokenSet: !!sms.twilioAuthToken,
        twilioPhoneNumber: sms.twilioPhoneNumber || '',
      },
    }),
  );
}

async function putHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  await connectDB();
  let doc = await SystemSettings.findOne({ slug: SLUG }).lean();
  if (!doc) {
    await SystemSettings.create({ slug: SLUG });
    doc = {};
  }
  const smtp = {
    host: typeof body.smtp?.host === 'string' ? body.smtp.host.trim() : doc.smtp?.host || '',
    port: typeof body.smtp?.port === 'number' ? body.smtp.port : doc.smtp?.port ?? 587,
    secure: !!body.smtp?.secure,
    user: typeof body.smtp?.user === 'string' ? body.smtp.user.trim() : doc.smtp?.user || '',
    fromEmail: typeof body.smtp?.fromEmail === 'string' ? body.smtp.fromEmail.trim() : doc.smtp?.fromEmail || '',
    fromName: typeof body.smtp?.fromName === 'string' ? body.smtp.fromName.trim() : doc.smtp?.fromName || '',
  };
  if (typeof body.smtp?.password === 'string' && body.smtp.password.trim()) {
    smtp.password = body.smtp.password.trim();
  } else if (doc.smtp?.password) {
    smtp.password = doc.smtp.password;
  }
  const sms = {
    twilioAccountSid: typeof body.sms?.twilioAccountSid === 'string' ? body.sms.twilioAccountSid.trim() : doc.sms?.twilioAccountSid || '',
    twilioPhoneNumber: typeof body.sms?.twilioPhoneNumber === 'string' ? body.sms.twilioPhoneNumber.trim() : doc.sms?.twilioPhoneNumber || '',
  };
  if (typeof body.sms?.twilioAuthToken === 'string' && body.sms.twilioAuthToken.trim()) {
    sms.twilioAuthToken = body.sms.twilioAuthToken.trim();
  } else if (doc.sms?.twilioAuthToken) {
    sms.twilioAuthToken = doc.sms.twilioAuthToken;
  }
  await SystemSettings.findOneAndUpdate(
    { slug: SLUG },
    { $set: { smtp, sms, updatedAt: new Date() } },
    { upsert: true },
  );
  return NextResponse.json(successResponse({ smtp, sms }));
}

export const GET = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SETTINGS, ACTIONS.READ)(getHandler))),
  ),
);
export const PUT = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SETTINGS, ACTIONS.UPDATE)(putHandler))),
  ),
);

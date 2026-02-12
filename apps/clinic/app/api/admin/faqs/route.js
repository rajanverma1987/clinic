/**
 * Admin FAQs API (Super Admin only)
 * GET /api/admin/faqs - list
 * POST /api/admin/faqs - create
 */
import connectDB from '@/lib/db/connection';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import FAQ from '@/models/FAQ';
import { NextResponse } from 'next/server';

async function getHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  await connectDB();
  const list = await FAQ.find().sort({ order: 1, createdAt: -1 }).lean();
  const data = list.map((s) => ({
    _id: s._id.toString(),
    question: s.question,
    answer: s.answer,
    category: s.category,
    order: s.order,
    isActive: s.isActive,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));
  return NextResponse.json(successResponse({ data }));
}

async function postHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const question = body.question && String(body.question).trim();
  const answer = body.answer != null ? String(body.answer) : '';
  if (!question) {
    return NextResponse.json(errorResponse('question is required', 'VALIDATION_ERROR'), {
      status: 400,
    });
  }
  await connectDB();
  const category =
    body.category === 'patients' || body.category === 'doctors' || body.category === 'general'
      ? body.category
      : 'general';
  const doc = await FAQ.create({
    question,
    answer,
    category,
    order: typeof body.order === 'number' ? body.order : 0,
    isActive: body.isActive !== false,
  });
  return NextResponse.json(
    successResponse({
      _id: doc._id.toString(),
      question: doc.question,
      category: doc.category,
      order: doc.order,
      isActive: doc.isActive,
    }),
    { status: 201 }
  );
}

export const GET = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SETTINGS, ACTIONS.READ)(getHandler)))
  )
);
export const POST = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SETTINGS, ACTIONS.CREATE)(postHandler)))
  )
);

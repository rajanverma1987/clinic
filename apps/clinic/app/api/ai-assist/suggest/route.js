/**
 * GET /api/ai-assist/suggest
 * Returns smart documentation, auto-suggestions, and CDS hints for AI Assistance add-on.
 * Query: context = soap_subjective | soap_objective | soap_assessment | soap_plan | diagnosis | clinical_notes | cds
 * Requires tenant to have aiAssist add-on (or super_admin).
 */

import { getSuggestions } from '@/lib/constants/ai-assist-suggestions';
import { isTestAccount } from '@/lib/constants/test-account';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { getTenantSubscription } from '@/services/subscription.service';
import { NextResponse } from 'next/server';

const ALLOWED_CONTEXTS = [
  'soap_subjective',
  'soap_objective',
  'soap_assessment',
  'soap_plan',
  'diagnosis',
  'clinical_notes',
  'cds',
];

async function getHandler(req, user) {
  let searchParams = new URLSearchParams();
  try {
    if (req && typeof req.url === 'string' && req.url) {
      searchParams = new URL(req.url).searchParams;
    }
  } catch {
    // fallback: empty searchParams
  }
  if (user.role !== 'super_admin' && !isTestAccount(user?.email)) {
    const tenantId = user.tenantId?.toString?.() || user.tenantId;
    if (!tenantId) {
      return NextResponse.json(errorResponse('Tenant context required', 'UNAUTHORIZED'), {
        status: 401,
      });
    }
    const subscription = await getTenantSubscription(tenantId);
    const hasAiAssist =
      Array.isArray(subscription?.addons) &&
      subscription.addons.some((a) => a.addonKey === 'aiAssist');
    if (!hasAiAssist) {
      return NextResponse.json(
        errorResponse('AI Assistance add-on required', 'FEATURE_UNAVAILABLE'),
        { status: 403 },
      );
    }
  }

  const context = searchParams.get('context') || 'clinical_notes';
  const currentText = searchParams.get('text') || '';

  if (!ALLOWED_CONTEXTS.includes(context)) {
    return NextResponse.json(
      errorResponse(
        `Invalid context. Use one of: ${ALLOWED_CONTEXTS.join(', ')}`,
        'VALIDATION_ERROR',
      ),
      { status: 400 },
    );
  }

  const result = getSuggestions(context, currentText);
  return NextResponse.json(successResponse(result));
}

export const GET = withErrorHandler(apiRateLimit(withAuth(getHandler)));

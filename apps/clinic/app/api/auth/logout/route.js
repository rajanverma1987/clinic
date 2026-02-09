import { AuditAction, AuditLogger } from '@/lib/audit/audit-logger';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { successResponse } from '@/lib/utils/api-response';
import { NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * Logout user (clears refresh token cookie and logs audit event)
 */
export async function POST(req) {
  let userId = null;
  let tenantId = null;

  // Try to get user info from token for audit logging
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = verifyAccessToken(token);
      if (user) {
        userId = user.userId || user.id;
        tenantId = user.tenantId || 'system';
      }
    }
  } catch (error) {
    // Continue with logout even if token parsing fails
  }

  // Audit log logout event if we have user info
  if (userId) {
    try {
      await AuditLogger.auditWrite(
        'user',
        userId.toString(),
        userId.toString(),
        tenantId?.toString() || 'system',
        AuditAction.ACCESS,
        undefined,
        { action: 'logout' },
      );
    } catch (auditErr) {
      // Don't fail logout if audit fails
    }
  }

  const response = NextResponse.json(successResponse({ message: 'Logged out successfully' }), {
    status: 200,
  });

  // Clear refresh token cookie
  response.cookies.set('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  return response;
}

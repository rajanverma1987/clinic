import { NextRequest, NextResponse } from 'next/server';
import { successResponse } from '@/lib/utils/api-response';

/**
 * POST /api/auth/logout
 * Logout user (clears refresh token cookie)
 */
export async function POST(req: NextRequest) {
  const response = NextResponse.json(
    successResponse({ message: 'Logged out successfully' }),
    { status: 200 }
  );

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


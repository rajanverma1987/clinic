/**
 * Next.js Middleware
 * Clinic staff only; no patient portal or public routes in scope.
 */
import { NextResponse } from 'next/server';

export function middleware(request) {
  const response = NextResponse.next();

  // Remove server fingerprinting headers added by IIS/Next
  response.headers.delete('x-powered-by');

  // HSTS — tell browsers to always use HTTPS (1 year)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer policy — don't leak full URL to third parties
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy — camera/mic allowed for self (telemedicine WebRTC)
  response.headers.set(
    'Permissions-Policy',
    'camera=(self), microphone=(self), geolocation=(), payment=()',
  );

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

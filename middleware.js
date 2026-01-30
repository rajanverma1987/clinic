/**
 * Next.js Middleware
 * Redirects patient-portal routes to login when app is clinic/doctor-only.
 * This app is a clinic management tool for doctors and clinic staff; patients do not use it.
 * Patients receive video call links from the clinic when needed.
 */
import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/patient-portal')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('reason', 'clinic_only');
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/patient-portal', '/patient-portal/:path*'],
};

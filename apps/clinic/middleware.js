/**
 * Next.js Middleware
 * Clinic staff only; no patient portal or public routes in scope.
 */
import { NextResponse } from 'next/server';

export function middleware(request) {
  return NextResponse.next();
}

/**
 * Security Headers Middleware
 * Sets security headers for all API responses
 * Based on NEW-PLANS.md security requirements
 */

import { NextResponse } from 'next/server';

/**
 * Security headers configuration
 */
const SECURITY_HEADERS = {
  // Prevent XSS attacks
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts for Next.js
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
  
  // Strict Transport Security (HSTS) - only in production
  ...(process.env.NODE_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  }),
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy (formerly Feature Policy)
  'Permissions-Policy': [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=()',
    'usb=()',
  ].join(', '),
};

/**
 * Add security headers to response
 * @param {NextResponse} response - Response object
 * @returns {NextResponse} - Response with security headers
 */
export function addSecurityHeaders(response) {
  if (!(response instanceof NextResponse)) {
    return response;
  }

  // Add all security headers
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    if (value) {
      response.headers.set(header, value);
    }
  }

  return response;
}

/**
 * Security headers middleware
 * Wraps a handler to add security headers
 */
export function withSecurityHeaders(handler) {
  return async (req, ...args) => {
    const response = await handler(req, ...args);
    return addSecurityHeaders(response);
  };
}

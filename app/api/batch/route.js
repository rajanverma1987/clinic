/**
 * Batch API: run multiple GET requests in one round-trip.
 * Request body: { endpoints: string[] } (e.g. ['/patients?page=1&limit=10', '/appointments?date=2025-01-29']).
 * Response: { success: true, data: [result1, result2, ...] }.
 */

import { NextResponse } from 'next/server';

const BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function POST(request) {
  try {
    const body = await request.json();
    const endpoints = Array.isArray(body.endpoints) ? body.endpoints : [];
    if (endpoints.length === 0 || endpoints.length > 20) {
      return NextResponse.json(
        { success: false, error: { message: 'endpoints array required (max 20)' } },
        { status: 400 },
      );
    }
    const auth = request.headers.get('authorization') || '';
    const origin = request.nextUrl?.origin || request.headers.get('origin') || '';
    const base =
      BASE && BASE.startsWith('http')
        ? BASE
        : origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5053';
    const results = await Promise.all(
      endpoints.map(async (path) => {
        const url = path.startsWith('http')
          ? path
          : `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : '/' + path}`;
        try {
          const res = await fetch(url, {
            headers: {
              ...(auth ? { Authorization: auth } : {}),
              'Content-Type': 'application/json',
            },
          });
          const data = await res.json();
          return { success: res.ok, data, status: res.status };
        } catch (e) {
          return { success: false, error: e.message, status: 500 };
        }
      }),
    );
    return NextResponse.json({ success: true, data: results });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: { message: e?.message || 'Batch request failed' } },
      { status: 500 },
    );
  }
}

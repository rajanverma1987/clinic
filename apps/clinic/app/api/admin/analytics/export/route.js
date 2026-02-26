/**
 * GET /api/admin/analytics/export?startDate=&endDate=
 * Returns platform analytics as CSV (Super Admin only).
 * Enterprise: consistent error shape via errorResponse.
 */

import { errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger.js';
import { NextResponse } from 'next/server';

function escapeCsv(val) {
  if (val == null) return '';
  const s = String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function getHandler(req, user) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(errorResponse('Unauthorized', 'FORBIDDEN'), { status: 403 });
    }
    const url = req.url || '';
    const searchParams = new URL(url).searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const origin = req.headers.get('origin') || req.headers.get('host') || 'localhost:5053';
    const protocol = origin.includes('localhost') ? 'http' : 'https';
    const base = `${protocol}://${origin.replace(/^https?:\/\//, '').split('/')[0]}`;
    const fetchUrl = `${base}/api/admin/analytics?${params.toString()}`;
    const headers = {};
    const cookie = req.headers.get('cookie');
    if (cookie) headers.Cookie = cookie;
    const auth = req.headers.get('authorization');
    if (auth) headers.Authorization = auth;
    const res = await fetch(fetchUrl, { headers });
    const data = await res.json().catch(() => ({}));
    if (!data.success || !data.data) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics' },
        { status: 500 },
      );
    }
    const d = data.data;
    const rows = [];
    rows.push(['Section', 'Key', 'Value']);
    (d.userGrowth || []).forEach((m) => rows.push(['User Growth', m.label, m.value]));
    (d.revenueTrends || []).forEach((m) => rows.push(['Revenue', m.label, m.value]));
    (d.appointmentTrends || []).forEach((m) => rows.push(['Appointments', m.label, m.value]));
    if (d.appointmentStats) {
      rows.push(['Appointment Stats', 'Total', d.appointmentStats.total]);
      rows.push(['Appointment Stats', 'Completed', d.appointmentStats.completed]);
      rows.push(['Appointment Stats', 'Cancelled', d.appointmentStats.cancelled]);
      rows.push(['Appointment Stats', 'No-show', d.appointmentStats.no_show]);
    }
    (d.popularSpecialties || []).forEach((s) => rows.push(['Specialty', s.name, s.count]));
    (d.peakHours || []).forEach((h) => rows.push(['Peak Hour', `${h.hour}:00`, h.count]));
    const csv = rows.map((r) => r.map(escapeCsv).join(',')).join('\r\n');
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="platform-analytics-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    logger.error('Admin analytics export failed', { message: err?.message });
    return NextResponse.json(
      errorResponse(err instanceof Error ? err.message : 'Export failed', 'INTERNAL_ERROR'),
      { status: 500 },
    );
  }
}

export async function GET(req) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  return getHandler(req, authResult.user);
}

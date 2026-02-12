/**
 * GET /api/maintenance-status
 * Public endpoint — returns whether platform is in maintenance mode.
 * Used by Layout to redirect non–super_admin users when maintenance is on.
 */

import connectDB from '@/lib/db/connection';
import SystemSettings from '@/models/SystemSettings';
import { NextResponse } from 'next/server';

const SLUG = 'platform';

export async function GET() {
  try {
    await connectDB();
    const doc = await SystemSettings.findOne({ slug: SLUG })
      .select('maintenanceMode')
      .lean();
    const maintenanceMode = !!doc?.maintenanceMode;
    return NextResponse.json({ success: true, maintenanceMode });
  } catch {
    return NextResponse.json({ success: true, maintenanceMode: false });
  }
}

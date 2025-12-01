import { NextRequest, NextResponse } from 'next/server';
import { processPendingReminders } from '@/services/reminder.service';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

/**
 * POST /api/cron/reminders
 * Process pending appointment reminders
 * 
 * This endpoint should be called by a cron job or scheduled task
 * In production, protect this with a secret token or use a proper cron service
 */
export async function POST(req: NextRequest) {
  try {
    // TODO: Add authentication/authorization for cron endpoint
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 });
    // }

    const result = await processPendingReminders();

    return NextResponse.json(
      successResponse({
        message: 'Reminders processed',
        ...result,
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse('Failed to process reminders', 'CRON_ERROR'),
      { status: 500 }
    );
  }
}


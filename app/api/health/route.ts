import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import { successResponse } from '@/lib/utils/api-response';

/**
 * Health check endpoint
 */
export async function GET() {
  try {
    // Test database connection
    await connectDB();
    
    return NextResponse.json(
      successResponse({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
      })
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Service unhealthy',
          code: 'HEALTH_CHECK_FAILED',
        },
      },
      { status: 503 }
    );
  }
}


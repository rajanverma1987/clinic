import { NextRequest } from 'next/server';
import { authenticate } from '@/middleware/auth';
import connectDB from '@/lib/db/connection';
import Queue, { QueueStatus } from '@/models/Queue';
import { withTenant } from '@/lib/db/tenant-helper';

/**
 * GET /api/queue/stream
 * Server-Sent Events (SSE) endpoint for real-time queue updates
 * 
 * Query parameters:
 * - doctorId: Filter by doctor ID (optional)
 * - tenantId: Will be extracted from JWT token
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authenticate(req);
    if ('error' in authResult) {
      return authResult.error;
    }

    const user = authResult.user;
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get('doctorId');

    await connectDB();

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // Send initial connection message
        const send = (data: string) => {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };

        send(JSON.stringify({ type: 'connected', message: 'Queue stream connected' }));

        // Function to fetch and send queue updates
        const sendQueueUpdate = async () => {
          try {
            const filter: any = withTenant(user.tenantId, {
              status: { $in: [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_PROGRESS] },
              deletedAt: null,
            });

            if (doctorId) {
              filter.doctorId = doctorId;
            }

            const queueEntries = await Queue.find(filter)
              .populate('patientId', 'firstName lastName patientId')
              .populate('doctorId', 'firstName lastName')
              .sort({ priority: -1, position: 1, joinedAt: 1 })
              .lean();

            send(
              JSON.stringify({
                type: 'queue_update',
                data: queueEntries,
                timestamp: new Date().toISOString(),
              })
            );
          } catch (error) {
            send(
              JSON.stringify({
                type: 'error',
                message: 'Failed to fetch queue updates',
              })
            );
          }
        };

        // Send initial queue state
        await sendQueueUpdate();

        // Set up polling interval (every 5 seconds)
        const interval = setInterval(async () => {
          await sendQueueUpdate();
        }, 5000);

        // Send heartbeat every 30 seconds to keep connection alive
        const heartbeatInterval = setInterval(() => {
          send(JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() }));
        }, 30000);

        // Clean up on close
        req.signal.addEventListener('abort', () => {
          clearInterval(interval);
          clearInterval(heartbeatInterval);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable buffering in nginx
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: 'Failed to establish queue stream',
          code: 'STREAM_ERROR',
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}


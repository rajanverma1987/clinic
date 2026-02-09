/**
 * Server-Sent Events fallback when WebSocket is unavailable.
 * Keeps connection alive with heartbeat comments; client uses polling for data.
 */

const HEARTBEAT_INTERVAL_MS = 15000;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || '';

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let intervalId;
      const send = (data) => {
        try {
          controller.enqueue(encoder.encode(typeof data === 'string' ? data : `data: ${JSON.stringify(data)}\n\n`));
        } catch (_) {}
      };
      send(`: connected tenant=${tenantId}\n\n`);
      intervalId = setInterval(() => {
        try {
          send(`: heartbeat ${Date.now()}\n\n`);
        } catch (_) {
          if (intervalId) clearInterval(intervalId);
        }
      }, HEARTBEAT_INTERVAL_MS);
      if (request.signal) {
        request.signal.addEventListener('abort', () => {
          if (intervalId) clearInterval(intervalId);
          try {
            controller.close();
          } catch (_) {}
        });
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

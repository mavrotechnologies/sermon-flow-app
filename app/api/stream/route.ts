import { NextRequest } from 'next/server';
import { broadcastManager } from '@/lib/broadcast';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * SSE endpoint for broadcasting to audience clients
 * Clients connect here to receive real-time updates
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Add client to broadcast manager
      broadcastManager.addClient(controller);

      // Send initial keep-alive
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keep-alive\n\n'));
        } catch {
          clearInterval(keepAlive);
        }
      }, 30000);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        broadcastManager.removeClient(controller);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

/**
 * POST endpoint for admin to send broadcast messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, payload } = body;

    switch (type) {
      case 'transcript':
        broadcastManager.broadcastTranscript(payload);
        break;
      case 'scripture':
        broadcastManager.broadcastScripture(payload);
        break;
      case 'status':
        broadcastManager.broadcastStatus(payload);
        break;
      case 'clear':
        broadcastManager.broadcastClear();
        break;
      default:
        return Response.json({ error: 'Invalid message type' }, { status: 400 });
    }

    return Response.json({
      success: true,
      clientCount: broadcastManager.getClientCount(),
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    return Response.json({ error: 'Failed to broadcast' }, { status: 500 });
  }
}

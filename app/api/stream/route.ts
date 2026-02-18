import { NextRequest } from 'next/server';
import { broadcastManager } from '@/lib/broadcast';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * SSE endpoint for broadcasting to audience clients
 * Clients connect here to receive real-time updates for a specific room
 */
export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get('room');

  if (!roomId) {
    return Response.json({ error: 'Room code is required' }, { status: 400 });
  }

  // Ensure the room exists so clients can connect before admin starts broadcasting
  broadcastManager.ensureRoom(roomId);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Add client to the room
      broadcastManager.addClient(roomId, controller);

      // Send initial keep-alive
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keep-alive\n\n'));
        } catch {
          clearInterval(keepAlive);
          broadcastManager.removeClient(roomId, controller);
        }
      }, 30000);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        broadcastManager.removeClient(roomId, controller);
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
 * POST endpoint for admin to send broadcast messages to a room
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, payload, room } = body;

    if (!room) {
      return Response.json({ error: 'Room code is required' }, { status: 400 });
    }

    // Ensure room exists for broadcasting
    broadcastManager.ensureRoom(room);

    switch (type) {
      case 'transcript':
        broadcastManager.broadcastTranscript(room, payload);
        break;
      case 'scripture':
        broadcastManager.broadcastScripture(room, payload);
        break;
      case 'status':
        broadcastManager.broadcastStatus(room, payload);
        break;
      case 'clear':
        broadcastManager.broadcastClear(room);
        break;
      case 'notes':
        broadcastManager.broadcastNotes(room, payload);
        break;
      case 'summary':
        broadcastManager.broadcastSummary(room, payload);
        break;
      case 'vmix':
        broadcastManager.broadcastVmix(room, payload);
        break;
      default:
        return Response.json({ error: 'Invalid message type' }, { status: 400 });
    }

    return Response.json({
      success: true,
      clientCount: broadcastManager.getClientCount(room),
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    return Response.json({ error: 'Failed to broadcast' }, { status: 500 });
  }
}

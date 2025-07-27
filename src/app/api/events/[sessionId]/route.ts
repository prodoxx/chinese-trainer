import { NextRequest } from 'next/server';
import { getConnections } from '@/lib/events/sse';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params;
  const connections = getConnections();
  
  const stream = new ReadableStream({
    start(controller) {
      // Store the controller for this session
      connections.set(sessionId, controller);
      
      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));
    },
    cancel() {
      // Remove the connection when client disconnects
      connections.delete(sessionId);
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
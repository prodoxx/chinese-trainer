import { NextRequest, NextResponse } from 'next/server';

// Store active connections
const connections = new Map<string, ReadableStreamDefaultController>();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await context.params;
  
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

// Helper function to send events to a specific session
export function sendEvent(sessionId: string, event: any) {
  const controller = connections.get(sessionId);
  if (controller) {
    const encoder = new TextEncoder();
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
  }
}
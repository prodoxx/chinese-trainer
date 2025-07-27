// Store active connections
const connections = new Map<string, ReadableStreamDefaultController>();

export function getConnections() {
  return connections;
}

// Helper function to send events to a specific session
export function sendEvent(sessionId: string, event: any) {
  const controller = connections.get(sessionId);
  if (controller) {
    const encoder = new TextEncoder();
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
  }
}
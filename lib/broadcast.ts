import type { BroadcastMessage, TranscriptSegment, DetectedScripture, StatusPayload } from '@/types';

/**
 * Broadcast manager for Server-Sent Events (SSE)
 * Manages connected clients and message broadcasting
 */

type ClientController = ReadableStreamDefaultController<Uint8Array>;

class BroadcastManager {
  private clients: Set<ClientController> = new Set();
  private encoder = new TextEncoder();
  private messageId = 0;

  /**
   * Add a new client connection
   */
  addClient(controller: ClientController): void {
    this.clients.add(controller);
    console.log(`Client connected. Total clients: ${this.clients.size}`);

    // Send initial connection confirmation
    this.sendToClient(controller, {
      type: 'status',
      payload: { isRecording: false, isConnected: true },
      timestamp: Date.now(),
    });
  }

  /**
   * Remove a client connection
   */
  removeClient(controller: ClientController): void {
    this.clients.delete(controller);
    console.log(`Client disconnected. Total clients: ${this.clients.size}`);
  }

  /**
   * Send message to a specific client
   */
  private sendToClient(controller: ClientController, message: BroadcastMessage): void {
    try {
      const data = this.formatSSE(message);
      controller.enqueue(this.encoder.encode(data));
    } catch (error) {
      console.error('Failed to send to client:', error);
      this.clients.delete(controller);
    }
  }

  /**
   * Format message as SSE event
   */
  private formatSSE(message: BroadcastMessage): string {
    this.messageId++;
    return `id: ${this.messageId}\nevent: ${message.type}\ndata: ${JSON.stringify(message)}\n\n`;
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: BroadcastMessage): void {
    const data = this.formatSSE(message);
    const encoded = this.encoder.encode(data);

    for (const client of this.clients) {
      try {
        client.enqueue(encoded);
      } catch (error) {
        console.error('Failed to broadcast to client:', error);
        this.clients.delete(client);
      }
    }
  }

  /**
   * Broadcast a transcript update
   */
  broadcastTranscript(segment: TranscriptSegment): void {
    this.broadcast({
      type: 'transcript',
      payload: segment,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast a detected scripture
   */
  broadcastScripture(scripture: DetectedScripture): void {
    this.broadcast({
      type: 'scripture',
      payload: scripture,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast status update
   */
  broadcastStatus(status: StatusPayload): void {
    this.broadcast({
      type: 'status',
      payload: status,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast clear command
   */
  broadcastClear(): void {
    this.broadcast({
      type: 'clear',
      payload: null,
      timestamp: Date.now(),
    });
  }

  /**
   * Get number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }
}

// Singleton instance for server-side use
export const broadcastManager = new BroadcastManager();

/**
 * Client-side SSE connection manager
 */
export class SSEClient {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(
    private url: string,
    private callbacks: {
      onTranscript?: (segment: TranscriptSegment) => void;
      onScripture?: (scripture: DetectedScripture) => void;
      onStatus?: (status: StatusPayload) => void;
      onClear?: () => void;
      onConnect?: () => void;
      onDisconnect?: () => void;
      onError?: (error: string) => void;
    } = {}
  ) {}

  /**
   * Connect to SSE stream
   */
  connect(): void {
    if (typeof window === 'undefined') return;

    try {
      this.eventSource = new EventSource(this.url);

      this.eventSource.onopen = () => {
        this.reconnectAttempts = 0;
        this.callbacks.onConnect?.();
      };

      this.eventSource.onerror = () => {
        this.callbacks.onDisconnect?.();
        this.handleReconnect();
      };

      // Listen for specific event types
      this.eventSource.addEventListener('transcript', (event) => {
        const message: BroadcastMessage = JSON.parse(event.data);
        if (message.payload) {
          this.callbacks.onTranscript?.(message.payload as TranscriptSegment);
        }
      });

      this.eventSource.addEventListener('scripture', (event) => {
        const message: BroadcastMessage = JSON.parse(event.data);
        if (message.payload) {
          this.callbacks.onScripture?.(message.payload as DetectedScripture);
        }
      });

      this.eventSource.addEventListener('status', (event) => {
        const message: BroadcastMessage = JSON.parse(event.data);
        if (message.payload) {
          this.callbacks.onStatus?.(message.payload as StatusPayload);
        }
      });

      this.eventSource.addEventListener('clear', () => {
        this.callbacks.onClear?.();
      });
    } catch (error) {
      this.callbacks.onError?.(`Failed to connect: ${error}`);
    }
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.callbacks.onError?.('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Disconnect from SSE stream
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

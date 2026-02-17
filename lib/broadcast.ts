import type {BroadcastMessage, DetectedScripture, SermonNotesPayload, SermonSummaryPayload, StatusPayload, TranscriptSegment, VmixCommandPayload} from '@/types';

/**
 * Room-aware Broadcast manager for Server-Sent Events (SSE)
 * Manages connected clients per room and message broadcasting
 */

type ClientController = ReadableStreamDefaultController<Uint8Array>;

/**
 * Generate a random 6-character alphanumeric room code
 */
export function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes confusing chars: I,O,0,1
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

class BroadcastManager {
    // Map of roomId -> Set of connected client controllers
    private rooms: Map<string, Set<ClientController>> = new Map();
    private encoder = new TextEncoder();
    private messageId = 0;

    /**
     * Add a new client connection to a room
     */
    addClient(roomId: string, controller: ClientController): void {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }
        this.rooms.get(roomId)!.add(controller);
        console.log(`Client connected to room ${roomId}. Room clients: ${this.rooms.get(roomId)!.size}`);

        // Send initial connection confirmation
        this.sendToClient(controller, {
            type: 'status',
            payload: {isRecording: false, isConnected: true},
            timestamp: Date.now(),
        });
    }

    /**
     * Remove a client connection from a room
     */
    removeClient(roomId: string, controller: ClientController): void {
        const room = this.rooms.get(roomId);
        if (room) {
            room.delete(controller);
            console.log(`Client disconnected from room ${roomId}. Room clients: ${room.size}`);
            // Clean up empty rooms
            if (room.size === 0) {
                this.rooms.delete(roomId);
            }
        }
    }

    /**
     * Check if a room exists (has at least been created)
     */
    hasRoom(roomId: string): boolean {
        return this.rooms.has(roomId);
    }

    /**
     * Ensure a room exists (admin creates it on page load)
     */
    ensureRoom(roomId: string): void {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }
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
     * Broadcast message to all connected clients in a room
     */
    broadcast(roomId: string, message: BroadcastMessage): void {
        const room = this.rooms.get(roomId);
        if (!room) return;

        const data = this.formatSSE(message);
        const encoded = this.encoder.encode(data);

        for (const client of room) {
            try {
                client.enqueue(encoded);
            } catch (error) {
                console.error('Failed to broadcast to client:', error);
                room.delete(client);
            }
        }
    }

    /**
     * Broadcast a transcript update to a room
     */
    broadcastTranscript(roomId: string, segment: TranscriptSegment): void {
        this.broadcast(roomId, {
            type: 'transcript',
            payload: segment,
            timestamp: Date.now(),
        });
    }

    /**
     * Broadcast a detected scripture to a room
     */
    broadcastScripture(roomId: string, scripture: DetectedScripture): void {
        this.broadcast(roomId, {
            type: 'scripture',
            payload: scripture,
            timestamp: Date.now(),
        });
    }

    /**
     * Broadcast status update to a room
     */
    broadcastStatus(roomId: string, status: StatusPayload): void {
        this.broadcast(roomId, {
            type: 'status',
            payload: status,
            timestamp: Date.now(),
        });
    }

    /**
     * Broadcast clear command to a room
     */
    broadcastClear(roomId: string): void {
        this.broadcast(roomId, {
            type: 'clear',
            payload: null,
            timestamp: Date.now(),
        });
    }

    /**
     * Broadcast sermon notes to a room
     */
    broadcastNotes(roomId: string, payload: SermonNotesPayload): void {
        this.broadcast(roomId, {
            type: 'notes',
            payload,
            timestamp: Date.now(),
        });
    }

    /**
     * Broadcast sermon summary to a room
     */
    broadcastSummary(roomId: string, payload: SermonSummaryPayload): void {
        this.broadcast(roomId, {
            type: 'summary',
            payload,
            timestamp: Date.now(),
        });
    }

    /**
     * Broadcast vMix command to a room (picked up by bridge script)
     */
    broadcastVmix(roomId: string, payload: VmixCommandPayload): void {
        this.broadcast(roomId, {
            type: 'vmix',
            payload,
            timestamp: Date.now(),
        });
    }

    /**
     * Get number of connected clients in a room
     */
    getClientCount(roomId: string): number {
        return this.rooms.get(roomId)?.size ?? 0;
    }

    /**
     * Get total connected clients across all rooms
     */
    getTotalClientCount(): number {
        let total = 0;
        for (const room of this.rooms.values()) {
            total += room.size;
        }
        return total;
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
            onNotes?: (payload: SermonNotesPayload) => void;
            onSummary?: (payload: SermonSummaryPayload) => void;
            onConnect?: () => void;
            onDisconnect?: () => void;
            onError?: (error: string) => void;
        } = {}
    ) {
    }

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

            this.eventSource.addEventListener('notes', (event) => {
                const message: BroadcastMessage = JSON.parse(event.data);
                if (message.payload) {
                    this.callbacks.onNotes?.(message.payload as SermonNotesPayload);
                }
            });

            this.eventSource.addEventListener('summary', (event) => {
                const message: BroadcastMessage = JSON.parse(event.data);
                if (message.payload) {
                    this.callbacks.onSummary?.(message.payload as SermonSummaryPayload);
                }
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

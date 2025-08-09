import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';

// Core gameplay & sync messages (host authoritative pattern)
export type PeerMessage = 
  // Legacy action (kept for backward compatibility – host used to broadcast this). Prefer CLIENT_ACTION/ACTION_APPLIED now.
  | { type: 'GAME_ACTION'; action: Record<string, unknown>; timestamp: number }
  // Guest -> Host: request to perform an action
  | { type: 'CLIENT_ACTION'; action: Record<string, unknown>; actionId: string; timestamp: number }
  // Host -> All: authoritative result of an action just applied (includes version)
  | { type: 'ACTION_APPLIED'; action: Record<string, unknown>; actionId: string; version: number; gameState?: Record<string, unknown>; timestamp: number }
  // Host -> Guest (or response to STATE_REQUEST): full state snapshot with version
  | { type: 'GAME_STATE_SYNC'; gameState: Record<string, unknown>; version: number; completionStatus?: [string, boolean][]; timestamp: number }
  // Guest -> Host: ask for a full state (e.g., version gap or mismatch)
  | { type: 'STATE_REQUEST'; sinceVersion?: number; reason?: string; timestamp: number }
  | { type: 'PLAYER_JOINED'; playerName: string; timestamp: number }
  | { type: 'PLAYER_LIST_SYNC'; players: string[]; timestamp: number }
  | { type: 'GAME_START'; timestamp: number }
  | { type: 'PLAYER_READY'; ready: boolean; playerId: string; timestamp: number }
  | { type: 'SIDE_DECK_SELECTED'; cardIds: string[]; playerId: string; timestamp: number }
  | { type: 'SIDE_DECK_COMPLETE'; playerId: string; timestamp: number }
  | { type: 'PHASE_TRANSITION'; newPhase: string; timestamp: number }
  | { type: 'HEARTBEAT'; gamePhase: string; completionStatus: [string, boolean][]; timestamp: number }
  | { type: 'CONNECTION_TEST'; timestamp: number };

export interface PeerConnectionOptions {
  onMessage: (message: PeerMessage, peerId: string) => void;
  onPeerConnected: (peerId: string) => void;
  onPeerDisconnected: (peerId: string, playerName?: string) => void;
  onError: (error: Error) => void;
}

export class PeerConnectionManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private options: PeerConnectionOptions;
  private isHost: boolean = false;
  private peerIdToPlayerName: Map<string, string> = new Map();
  private messageQueue: Map<string, PeerMessage[]> = new Map();
  
  /** Track basic connection metrics */
  getConnectionHealth(): {
    totalConnections: number;
    openConnections: number;
    connectionStates: Record<string, string>;
    queuedMessages: Record<string, number>;
  } {
    const connectionStates: Record<string, string> = {};
    const queuedMessages: Record<string, number> = {};
    let openConnections = 0;
    this.connections.forEach((conn, id) => {
      const state = conn.open ? 'open' : 'closed';
      if (conn.open) openConnections++;
      connectionStates[id] = state;
    });
    this.messageQueue.forEach((queue, id) => { queuedMessages[id] = queue.length; });
    return {
      totalConnections: this.connections.size,
      openConnections,
      connectionStates,
      queuedMessages
    };
  }

  constructor(options: PeerConnectionOptions) {
    this.options = options;
  }

  /**
   * Initialize as host - creates a new peer with a random ID
   * Uses the free PeerJS cloud service at 0.peerjs.com
   */
  async initializeAsHost(): Promise<string> {
    try {
      console.log('👑 Initializing as host...');
      if (this.peer) this.disconnect();

      return new Promise((resolve, reject) => {
        // ID is assigned by PeerJS server
        this.peer = new Peer({ debug: 2 });
        this.isHost = true;

        const timeout = setTimeout(() => {
          reject(new Error('Host initialization timed out.'));
        }, 10000);

        this.peer.on('open', (id) => {
          clearTimeout(timeout);
          console.log(`👑 Host peer is open with ID: ${id}`);
          this.setupPeerListeners();
          resolve(id);
        });

        this.peer.on('error', (error) => {
          clearTimeout(timeout);
          console.error('❌ Host peer error:', error);
          this.options.onError(error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('❌ Failed to initialize as host:', error);
      throw error;
    }
  }

  /**
   * Initialize as guest - creates a new peer and connects to the host
   */
  async initializeAsGuest(roomId: string, playerName: string): Promise<void> {
    try {
      console.log(`👋 Initializing as guest to connect to room: ${roomId}`);
      if (this.peer) this.disconnect();

      return new Promise((resolve, reject) => {
        this.peer = new Peer({ debug: 2 });
        this.isHost = false;

        const timeout = setTimeout(() => {
          reject(new Error(`Connection to room ${roomId} timed out.`));
        }, 10000);

        this.peer.on('open', (id) => {
          console.log(`👋 Guest peer is open with ID: ${id}. Connecting to host: ${roomId}`);
          
          const connection = this.peer!.connect(roomId, {
            reliable: true,
            metadata: { playerName },
          });

          connection.on('open', () => {
            clearTimeout(timeout);
            console.log(`✅ Connection to host ${roomId} is open.`);
            this.connections.set(roomId, connection);
            this.setupConnectionListeners(connection);
            
            // Announce joining to the host
            this.sendToHost({ type: 'PLAYER_JOINED', playerName, timestamp: Date.now() });
            
            this.options.onPeerConnected(roomId);
            this.flushMessageQueue(roomId);
            resolve();
          });

          connection.on('error', (err) => {
            clearTimeout(timeout);
            console.error(`❌ Connection to host ${roomId} failed:`, err);
            this.options.onError(err);
            reject(err);
          });
        });

        this.peer.on('error', (error) => {
          clearTimeout(timeout);
          console.error('❌ Guest peer error:', error);
          this.options.onError(error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('❌ Failed to initialize as guest:', error);
      throw error;
    }
  }

  /**
   * Set up listeners for the peer
   */
  private setupPeerListeners(): void {
    if (!this.peer) return;

    // Only hosts listen for incoming connections
    if (this.isHost) {
      this.peer.on('connection', (connection) => {
        const peerId = connection.peer;
        const playerName = connection.metadata.playerName;
        console.log(`📞 Incoming connection from: ${peerId} (${playerName})`);
        this.peerIdToPlayerName.set(peerId, playerName);

        connection.on('open', () => {
          console.log(`✅ Connection established with: ${peerId}`);
          this.connections.set(peerId, connection);
          this.setupConnectionListeners(connection);
          this.options.onPeerConnected(peerId);
          this.flushMessageQueue(peerId);
          // Defensive: immediately emit a synthetic PLAYER_JOINED in case the guest's own
          // PLAYER_JOINED message is lost or arrives before listeners attach.
          // Host handler is idempotent due to duplicate guard.
          try {
            this.options.onMessage({ type: 'PLAYER_JOINED', playerName, timestamp: Date.now() }, peerId);
          } catch (e) {
            console.warn('Failed to inject synthetic PLAYER_JOINED:', e);
          }
        });
      });
    }

    this.peer.on('disconnected', () => {
      console.log('🔌 Peer disconnected, attempting to reconnect...');
      this.peer?.reconnect();
    });

    this.peer.on('close', () => {
      console.log('🔌 Peer connection closed');
    });
  }

  /**
   * Set up listeners for a data connection
   */
  private setupConnectionListeners(connection: DataConnection): void {
    const peerId = connection.peer;
    
    connection.on('data', (data) => {
      try {
        const message = data as PeerMessage;
        console.log(`📨 Received message from ${peerId}:`, message);
        this.options.onMessage(message, peerId);
      } catch (error) {
        console.error('❌ Error processing received data:', error);
      }
    });

    connection.on('close', () => {
      console.log(`🔌 Connection closed with ${peerId}`);
      this.connections.delete(peerId);
      this.options.onPeerDisconnected(peerId, this.peerIdToPlayerName.get(peerId));
      this.peerIdToPlayerName.delete(peerId);
    });

    connection.on('error', (error) => {
      console.error(`❌ Connection error with ${peerId}:`, error);
      this.connections.delete(peerId);
      this.options.onPeerDisconnected(peerId, this.peerIdToPlayerName.get(peerId));
      this.peerIdToPlayerName.delete(peerId);
    });
  }

  /**
   * Send message to a specific peer
   */
  sendToPeer(peerId: string, message: PeerMessage): void {
    const connection = this.connections.get(peerId);
    
    if (connection && connection.open) {
      try {
        connection.send(message);
      } catch (error) {
        console.error(`❌ Error sending message to ${peerId}:`, error);
      }
    } else {
      console.log(`⏳ Queuing message for ${peerId} (connection not open):`, message.type);
      if (!this.messageQueue.has(peerId)) {
        this.messageQueue.set(peerId, []);
      }
      this.messageQueue.get(peerId)!.push(message);
    }
  }

  /**
   * Send all queued messages for a peer
   */
  private flushMessageQueue(peerId: string): void {
    const queuedMessages = this.messageQueue.get(peerId);
    if (queuedMessages && queuedMessages.length > 0) {
      console.log(`📤 Sending ${queuedMessages.length} queued messages to ${peerId}`);
      queuedMessages.forEach(message => {
        this.sendToPeer(peerId, message);
      });
      this.messageQueue.delete(peerId);
    }
  }

  /**
   * Send message to all connected peers
   */
  sendToAll(message: PeerMessage): void {
    console.log(`📤 Broadcasting message to ${this.connections.size} peers:`, message);
    this.connections.forEach((_, peerId) => {
      this.sendToPeer(peerId, message);
    });
  }

  /**
   * Send message to host (used by guests)
   */
  sendToHost(message: PeerMessage): void {
    const hostConnection = Array.from(this.connections.values())[0];
    const hostPeerId = Array.from(this.connections.keys())[0];
    
    if (hostConnection && hostPeerId) {
      console.log(`📤 Sending message to host:`, message);
      this.sendToPeer(hostPeerId, message);
    } else {
      console.warn('⚠️ No connection to host available');
    }
  }

  /**
   * Get list of connected peer IDs
   */
  getConnectedPeers(): string[] {
    return Array.from(this.connections.keys()).filter(peerId => {
      const connection = this.connections.get(peerId);
      return connection && connection.open;
    });
  }

  /**
   * Check if we are the host
   */
  getIsHost(): boolean {
    return this.isHost;
  }

  /**
   * Get our peer ID
   */
  getPeerId(): string | null {
    return this.peer?.id || null;
  }

  /**
   * Get peer connection status
   */
  getPeerStatus(): { hasPeer: boolean; peerOpen: boolean; peerId: string | null } {
    return {
      hasPeer: !!this.peer,
      peerOpen: this.peer?.open || false,
      peerId: this.peer?.id || null
    };
  }

  /**
   * Disconnect from all peers and destroy the peer
   */
  disconnect(): void {
    console.log('🔌 Disconnecting peer and all connections...');
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.connections.clear();
    this.peerIdToPlayerName.clear();
    this.messageQueue.clear();
  }
}

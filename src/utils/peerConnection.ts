import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';

export type PeerMessage = 
  | { type: 'GAME_ACTION'; action: Record<string, unknown>; timestamp: number }
  | { type: 'GAME_STATE_SYNC'; gameState: Record<string, unknown>; completionStatus?: [string, boolean][]; timestamp: number }
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
  onPeerDisconnected: (peerId: string) => void;
  onError: (error: Error) => void;
}

export class PeerConnectionManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private options: PeerConnectionOptions;
  private isHost: boolean = false;
  private connectionStates: Map<string, 'connecting' | 'open' | 'closed'> = new Map();
  private messageQueue: Map<string, PeerMessage[]> = new Map();

  constructor(options: PeerConnectionOptions) {
    this.options = options;
  }

  /**
   * Initialize as host - creates a new peer with a random ID
   * Uses the free PeerJS cloud service at 0.peerjs.com
   */
  async initializeAsHost(): Promise<string> {
    try {
      console.log('🎮 Initializing as host...');
      
      // Create peer with auto-generated ID, using default PeerJS service like the working example
      this.peer = new Peer({
        debug: 2 // Enable debugging
      });

      this.isHost = true;

      return new Promise((resolve, reject) => {
        this.peer!.on('open', (id) => {
          console.log(`🎮 Host peer opened with ID: ${id}`);
          this.setupPeerListeners();
          resolve(id);
        });

        this.peer!.on('error', (error) => {
          console.error('❌ Peer initialization error:', error);
          this.options.onError(error);
          reject(error);
        });
        
        // Add timeout to detect connection issues
        setTimeout(() => {
          if (!this.peer?.open) {
            const timeoutError = new Error('Timeout: Could not connect to PeerJS service');
            console.error('❌ Peer connection timeout');
            this.options.onError(timeoutError);
            reject(timeoutError);
          }
        }, 10000); // 10 second timeout
      });
    } catch (error) {
      console.error('❌ Failed to initialize as host:', error);
      throw error;
    }
  }

  /**
   * Initialize as guest - connects to an existing peer
   * Uses the free PeerJS cloud service at 0.peerjs.com
   */
  async initializeAsGuest(roomId: string, playerName: string): Promise<void> {
    try {
      const guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`🎮 Initializing guest with ID: ${guestId}, connecting to room: ${roomId}`);
      
      this.peer = new Peer({
        debug: 2 // Enable debugging
      });

      this.isHost = false;

      return new Promise((resolve, reject) => {
        this.peer!.on('open', () => {
          console.log(`🎮 Guest peer opened, connecting to room: ${roomId}`);
          this.connectToHost(roomId, playerName);
          resolve();
        });

        this.peer!.on('error', (error) => {
          console.error('❌ Guest peer error:', error);
          this.options.onError(error);
          reject(error);
        });
        
        // Add timeout to detect connection issues
        setTimeout(() => {
          if (!this.peer?.open) {
            const timeoutError = new Error('Timeout: Could not connect to PeerJS service');
            console.error('❌ Guest peer connection timeout');
            this.options.onError(timeoutError);
            reject(timeoutError);
          }
        }, 10000); // 10 second timeout
      });
    } catch (error) {
      console.error('❌ Failed to initialize as guest:', error);
      throw error;
    }
  }

  /**
   * Connect to the host peer (used by guests)
   */
  private connectToHost(hostId: string, playerName: string): void {
    if (!this.peer) return;

    console.log(`🔗 Guest attempting to connect to host: ${hostId}`);
    
    const connection = this.peer.connect(hostId, {
      reliable: true,
      metadata: { playerName }
    });

    // Set initial connection state
    this.connectionStates.set(hostId, 'connecting');

    connection.on('open', () => {
      console.log(`✅ Connected to host: ${hostId}`);
      this.connections.set(hostId, connection);
      this.connectionStates.set(hostId, 'open');
      this.setupConnectionListeners(connection, hostId);
      
      // Send player joined message
      this.sendToHost({
        type: 'PLAYER_JOINED',
        playerName,
        timestamp: Date.now()
      });
      
      this.options.onPeerConnected(hostId);
    });

    connection.on('error', (error) => {
      console.error(`❌ Connection error to host ${hostId}:`, error);
      this.connectionStates.set(hostId, 'closed');
      this.options.onError(error);
    });
  }

  /**
   * Set up listeners for the peer
   */
  private setupPeerListeners(): void {
    if (!this.peer) return;

    // Only hosts listen for incoming connections
    if (this.isHost) {
      this.peer.on('connection', (connection) => {
        console.log(`📞 Incoming connection from: ${connection.peer}`);
        
        // Set initial connection state
        this.connectionStates.set(connection.peer, 'connecting');
        
        connection.on('open', () => {
          console.log(`✅ Connection established with: ${connection.peer}`);
          this.connections.set(connection.peer, connection);
          this.connectionStates.set(connection.peer, 'open');
          this.setupConnectionListeners(connection, connection.peer);
          this.options.onPeerConnected(connection.peer);
        });
        
        connection.on('error', (error) => {
          console.error(`❌ Incoming connection error from ${connection.peer}:`, error);
          this.connectionStates.set(connection.peer, 'closed');
          this.options.onError(error);
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
   * Set up listeners for individual data connections
   */
  private setupConnectionListeners(connection: DataConnection, peerId: string): void {
    // Connection should already be open when this is called
    // Don't override the existing state
    
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
      this.connectionStates.set(peerId, 'closed');
      this.connections.delete(peerId);
      this.options.onPeerDisconnected(peerId);
    });

    connection.on('error', (error) => {
      console.error(`❌ Connection error with ${peerId}:`, error);
      this.connectionStates.set(peerId, 'closed');
      this.connections.delete(peerId);
      this.options.onPeerDisconnected(peerId);
    });
    
    // Send any queued messages now that connection is ready
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
   * Queue message for later delivery
   */
  private queueMessage(peerId: string, message: PeerMessage): void {
    if (!this.messageQueue.has(peerId)) {
      this.messageQueue.set(peerId, []);
    }
    this.messageQueue.get(peerId)!.push(message);
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
   * Send message to specific peer
   */
  sendToPeer(peerId: string, message: PeerMessage): void {
    const connection = this.connections.get(peerId);
    const connectionState = this.connectionStates.get(peerId);
    
    if (connection && connectionState === 'open' && connection.open) {
      try {
        connection.send(message);
        console.log(`📤 Message sent to ${peerId}:`, message.type);
      } catch (error) {
        console.error(`❌ Error sending message to ${peerId}:`, error);
        // Queue the message for retry
        this.queueMessage(peerId, message);
      }
    } else if (connectionState === 'connecting') {
      console.log(`⏳ Queuing message for ${peerId} (connection not ready):`, message.type);
      this.queueMessage(peerId, message);
    } else {
      console.warn(`⚠️ Cannot send message to ${peerId} - connection not available`);
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
    console.log('🔌 Disconnecting from all peers...');
    
    this.connections.forEach((connection) => {
      connection.close();
    });
    
    this.connections.clear();
    
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }

  /**
   * Get connection health information
   */
  getConnectionHealth(): { 
    totalConnections: number; 
    activeConnections: number; 
    connectionStates: Record<string, string>;
    queuedMessages: Record<string, number>;
  } {
    const connectionStates: Record<string, string> = {};
    const queuedMessages: Record<string, number> = {};
    
    this.connectionStates.forEach((state, peerId) => {
      connectionStates[peerId] = state;
    });
    
    this.messageQueue.forEach((messages, peerId) => {
      queuedMessages[peerId] = messages.length;
    });
    
    return {
      totalConnections: this.connections.size,
      activeConnections: this.getConnectedPeers().length,
      connectionStates,
      queuedMessages
    };
  }

}

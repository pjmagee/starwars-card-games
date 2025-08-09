import type { MultiplayerState } from './MultiplayerContext';

export const multiplayerInitialState: MultiplayerState = {
  isConnected: false,
  isHost: false,
  roomId: null,
  peerId: null,
  playerName: '',
  connectedPlayers: [],
  playersReady: new Map(),
  gameState: null,
  gamePhase: 'menu',
  playerSideDecks: new Map(),
  playerStageStatus: new Map(),
  lastSyncTimestamp: 0,
  connectionHealth: {
    totalConnections: 0,
    activeConnections: 0,
    connectionStates: {},
    queuedMessages: {}
  }
};

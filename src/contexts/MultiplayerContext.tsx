import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
  useRef,
  useReducer,
} from 'react';
import { PeerConnectionManager, type PeerMessage } from '../utils/peerConnection';
import { useNotifications } from '../hooks/useNotifications';
import type { GameState } from '../games/pazaak/types';
import { PazaakGame } from '../games/pazaak/gameLogic';
import { multiplayerInitialState } from './multiplayerState';
// Removed unused PazaakGame import after protocol refactor

export interface MultiplayerState {
  // Connection state
  isConnected: boolean;
  isHost: boolean;
  roomId: string | null;
  peerId: string | null;
  
  // Player management
  playerName: string;
  connectedPlayers: string[];
  playersReady: Map<string, boolean>;
  
  // Game state
  gameState: GameState | null;
  gamePhase: string;
  playerSideDecks: Map<string, string[]>; // <playerId, cardIds>
  playerStageStatus: Map<string, {
    ready: boolean;
    sideDecksSelected: boolean;
    gameReady: boolean;
  }>;
  lastSyncTimestamp: number;
  
  // Connection health
  connectionHealth: {
    totalConnections: number;
    activeConnections: number;
    connectionStates: Record<string, string>;
    queuedMessages: Record<string, number>;
  };
}

export interface MultiplayerContextValue {
  state: MultiplayerState;
  
  // Connection management
  createRoom: (playerName: string) => Promise<string>;
  joinRoom: (roomId: string, playerName: string) => Promise<void>;
  leaveRoom: () => void;
  
  // Game actions
  selectSideDeck: (cardIds: string[]) => void;
  sendGameAction: (action: Record<string, unknown>) => void;
  syncGameState: (gameState: GameState) => void;
  setPlayerReady: (ready: boolean) => void;
  startGame: () => void;
  restartGame: () => void;
  
  // Utilities
  isPlayerReady: (playerId: string) => boolean;
  areAllPlayersReady: () => boolean;
  
  // Stage tracking helpers
  getPlayerStageStatus: (playerName: string) => {
    ready: boolean;
    sideDecksSelected: boolean;
    gameReady: boolean;
  };
  areAllSideDecksSelected: () => boolean;
  getPlayerCount: () => number;
}

const MultiplayerContext = createContext<MultiplayerContextValue | null>(null);

const initialState: MultiplayerState = multiplayerInitialState;

export const MultiplayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<MultiplayerState>(initialState);
  const stateRef = useRef(state);
  stateRef.current = state; // Keep ref updated on every render

  const peerManagerRef = useRef<PeerConnectionManager | null>(null);
  const [, forceUpdate] = useReducer(x => x + 1, 0); // Force re-render on ref change
  const pazaakGameRef = useRef<PazaakGame | null>(null); // Host authoritative game instance
  const versionRef = useRef(0);

  const { showToast } = useNotifications();

  const handleMessage = useCallback((message: PeerMessage, peerId: string) => {
    console.log(`📬 Handling message from ${peerId}:`, message);
    const peerManager = peerManagerRef.current;
    const currentState = stateRef.current;

    switch (message.type) {
      case 'PLAYER_JOINED': {
        if (!currentState.isHost) return;

        console.log('🎮 Host received PLAYER_JOINED:', message.playerName);
        const newPlayerName = message.playerName;

        // Rebuild player list ensuring host is present (guards against rare render race)
        const rebuiltPlayers = new Set<string>();
        if (currentState.playerName) rebuiltPlayers.add(currentState.playerName);
        currentState.connectedPlayers.forEach(p => rebuiltPlayers.add(p));
        if (rebuiltPlayers.has(newPlayerName)) {
          console.warn(`Player ${newPlayerName} tried to join but is already in the room (ignored).`);
        } else {
          rebuiltPlayers.add(newPlayerName);
        }
        const updatedPlayers = Array.from(rebuiltPlayers.values());
        
        setState(prev => {
          // Initialize stage status for the new player
          const newStageStatus = new Map(prev.playerStageStatus);
          newStageStatus.set(newPlayerName, {
            ready: false,
            sideDecksSelected: false,
            gameReady: false
          });
          
          return { 
            ...prev, 
            connectedPlayers: updatedPlayers,
            playerStageStatus: newStageStatus
          };
        });
        
        if (peerManager) {
          console.log('📤 Host broadcasting PLAYER_LIST_SYNC to all peers.');
          const syncMessage: PeerMessage = {
            type: 'PLAYER_LIST_SYNC',
            players: updatedPlayers,
            timestamp: Date.now()
          };
          peerManager.sendToAll(syncMessage);
        }
        
        showToast({ type: 'info', title: 'Player Joined', message: `${newPlayerName} has joined the game` });
        break;
      }
        
      case 'PLAYER_LIST_SYNC':
        console.log('📥 Client received PLAYER_LIST_SYNC:', message.players);
        setState(prev => {
          // Initialize stage status for all players if not already present
          const newStageStatus = new Map(prev.playerStageStatus);
          message.players.forEach(player => {
            if (!newStageStatus.has(player)) {
              newStageStatus.set(player, {
                ready: false,
                sideDecksSelected: false,
                gameReady: false
              });
            }
          });
          
          return { 
            ...prev, 
            connectedPlayers: message.players, 
            isConnected: true,
            playerStageStatus: newStageStatus
          };
        });
        break;

      case 'PLAYER_READY': {
        console.log('📨 Received player ready:', message.playerId, 'ready:', message.ready);
        const { playerId, ready } = message;
        
        setState(prev => {
          const newPlayersReady = new Map(prev.playersReady);
          newPlayersReady.set(playerId, ready);
          
          // Update stage status
          const newStageStatus = new Map(prev.playerStageStatus);
          const currentStatus = newStageStatus.get(playerId) || { ready: false, sideDecksSelected: false, gameReady: false };
          newStageStatus.set(playerId, { ...currentStatus, ready });
          
          // Host is the authority and broadcasts the change to all clients
          if (prev.isHost && peerManager) {
            peerManager.sendToAll({ type: 'PLAYER_READY', playerId, ready, timestamp: Date.now() });
          }
          
          return { ...prev, playersReady: newPlayersReady, playerStageStatus: newStageStatus };
        });
        break;
      }
        
      case 'GAME_START': {
        console.log('🎉 Game is starting! Transitioning to side deck selection.');
        // Host creates game instance immediately so side deck IDs can map to actual generated sideCards
        if (currentState.isHost && !pazaakGameRef.current) {
          try {
            pazaakGameRef.current = new PazaakGame(currentState.connectedPlayers);
            console.log('🛠️ Host initialized game instance for side deck selection');
          } catch (e) {
            console.error('Failed to pre-initialize game:', e);
          }
        }
        setState(prev => ({ ...prev, gamePhase: 'side-deck', playersReady: new Map() }));
        break; }

  case 'SIDE_DECK_SELECTED': {
        const { playerId, cardIds } = message;
        console.log(`🃏 Player ${playerId} selected side deck`);

        setState(prev => {
          const newSideDecks = new Map(prev.playerSideDecks);
          newSideDecks.set(playerId, cardIds);

          // Update stage status for the player
          const newStageStatus = new Map(prev.playerStageStatus);
          newStageStatus.set(playerId, {
            ready: true,
            sideDecksSelected: true,
            gameReady: false
          });

          // Host broadcasts the update to ensure all clients have the same info
          if (prev.isHost && peerManager) {
            peerManager.sendToAll({ type: 'SIDE_DECK_SELECTED', playerId, cardIds, timestamp: Date.now() });
          }

          // Check if all players have selected their side decks
          const allPlayersSelected = prev.connectedPlayers.every(player => 
            newSideDecks.has(player)
          );

          console.log('🔍 Side deck selection check:', {
            connectedPlayers: prev.connectedPlayers,
            playersWithDecks: Array.from(newSideDecks.keys()),
            allPlayersSelected
          });

          if (prev.isHost && pazaakGameRef.current) {
            // Map player name to internal game player id
            const playerIndex = prev.connectedPlayers.indexOf(playerId);
            if (playerIndex >= 0) {
              try {
                pazaakGameRef.current.selectSideCards(`player-${playerIndex}`, cardIds);
              } catch (e) {
                console.error('Side deck selection rejected:', e);
              }
            }
            const currentGameState = pazaakGameRef.current.getState();
            // If game moved to playing (all selected), broadcast authoritative state
            if (currentGameState.gamePhase === 'playing') {
              versionRef.current += 1;
              peerManager?.sendToAll({
                type: 'GAME_STATE_SYNC',
                gameState: currentGameState as unknown as Record<string, unknown>,
                version: versionRef.current,
                timestamp: Date.now()
              });
              const playingStageStatus = new Map(newStageStatus);
              prev.connectedPlayers.forEach(player => playingStageStatus.set(player, { ready: true, sideDecksSelected: true, gameReady: true }));
              return { ...prev, playerSideDecks: newSideDecks, playerStageStatus: playingStageStatus, gameState: currentGameState as GameState, gamePhase: 'playing' };
            }
          }
          return { ...prev, playerSideDecks: newSideDecks, playerStageStatus: newStageStatus };
        });
        break;
      }

      case 'CLIENT_ACTION': {
        if (!currentState.isHost || !peerManager) break;
  const { action } = message as { action?: { type?: string; cardId?: string; modifier?: 'positive' | 'negative'; playerName?: string } };
        // Host applies action to game and broadcasts new state
        if (!pazaakGameRef.current) {
          console.warn('No game instance on host to apply action');
          break;
        }
        try {
          // Resolve player index by sender's declared playerName if provided (fallback second player)
          // We rely on action.playerName if present, else assume non-host is player-1.
          let actingPlayerId: string | undefined;
          if (action?.playerName) {
            const idx = currentState.connectedPlayers.indexOf(action.playerName);
            if (idx >= 0) actingPlayerId = `player-${idx}`;
          } else {
            // Distinguish: host actions processed via sendGameAction path below (not CLIENT_ACTION)
            actingPlayerId = `player-1`;
          }
          if (action && action.type === 'drawCard' && actingPlayerId) {
            pazaakGameRef.current.dealCard(actingPlayerId);
          } else if (action && action.type === 'useSideCard' && actingPlayerId && action.cardId) {
            pazaakGameRef.current.useSideCard(actingPlayerId, action.cardId, action.modifier);
          } else if (action && action.type === 'stand' && actingPlayerId) {
            pazaakGameRef.current.stand(actingPlayerId);
          } else if (action && action.type === 'endTurn') {
            (pazaakGameRef.current as unknown as { endTurn: () => void }).endTurn();
          } else if (action && action.type === 'nextRound') {
            pazaakGameRef.current.startNextRound();
          }
          const gameState = pazaakGameRef.current.getState();
          versionRef.current += 1;
          peerManager.sendToAll({
            type: 'GAME_STATE_SYNC',
            gameState: gameState as unknown as Record<string, unknown>,
            version: versionRef.current,
            timestamp: Date.now()
          });
          setState(prev => ({ ...prev, gameState }));
        } catch (e) {
          console.error('Failed to apply client action:', e);
        }
        break;
      }
      case 'ACTION_APPLIED': {
        // Placeholder: integrate with game state if needed
        break;
      }
        
      case 'GAME_STATE_SYNC':
        if (message.timestamp > currentState.lastSyncTimestamp) {
          setState(prev => ({
            ...prev,
            gameState: message.gameState as unknown as GameState,
            lastSyncTimestamp: message.timestamp,
            // Advance phase for clients when authoritative game state arrives
            gamePhase: prev.gamePhase === 'playing' ? prev.gamePhase : 'playing'
          }));
        }
        break;
      case 'NEW_GAME': {
        console.log('🆕 NEW_GAME received - resetting state to side deck selection');
        setState(prev => ({
          ...prev,
          gameState: null,
            gamePhase: 'side-deck',
            playerSideDecks: new Map(),
            playersReady: new Map(),
            playerStageStatus: new Map(Array.from(prev.connectedPlayers).map(p => [p, { ready: false, sideDecksSelected: false, gameReady: false }]))
        }));
        break;
      }
      
      default:
        console.warn('Unknown message type:', (message as PeerMessage).type);
    }
  }, [showToast]);

  const handlePeerConnected = useCallback((peerId: string) => {
    console.log('✅ Peer connected:', peerId);
    const currentState = stateRef.current;
    if (currentState.isHost) {
      console.log('➕ Host sees new client connected:', peerId);
    } else {
      console.log('🔗 Client is now connected to host.');
      // Client doesn't set isConnected here, waits for PLAYER_LIST_SYNC
    }
    forceUpdate();
  }, []);

  const handlePeerDisconnected = useCallback((peerId: string, playerName?: string) => {
    console.log(`❌ Peer disconnected: ${peerId} (${playerName || 'unknown'})`);
    const currentState = stateRef.current;
    
    const playerToDisconnect = playerName || currentState.connectedPlayers.find(p => p === peerId) || peerId;

    setState(prev => {
      const newPlayers = prev.connectedPlayers.filter(pName => pName !== playerToDisconnect);
      const newReady = new Map(prev.playersReady);
      newReady.delete(playerToDisconnect);
      const newSideDecks = new Map(prev.playerSideDecks);
      newSideDecks.delete(playerToDisconnect);
      
      // Host should notify other players
      if(prev.isHost && peerManagerRef.current) {
        peerManagerRef.current.sendToAll({
          type: 'PLAYER_LIST_SYNC',
          players: newPlayers,
          timestamp: Date.now()
        });
      }

      return {
        ...prev,
        connectedPlayers: newPlayers,
        playersReady: newReady,
        playerSideDecks: newSideDecks,
      };
    });
    showToast({ type: 'warning', title: 'Player Left', message: `${playerToDisconnect} has left the game` });
    forceUpdate();
  }, [showToast]);

  const handleError = useCallback((error: Error) => {
    console.error('💥 Multiplayer Error:', error);
    showToast({ type: 'error', title: 'Connection Error', message: error.message });
    setState(prev => ({ ...prev, isConnected: false }));
    forceUpdate();
  }, [showToast]);

  const createRoom = useCallback(async (playerName: string): Promise<string> => {
    console.log('👑 Creating room for:', playerName);
    if (peerManagerRef.current) {
      peerManagerRef.current.disconnect();
    }

    const manager = new PeerConnectionManager({
      onMessage: handleMessage,
      onPeerConnected: handlePeerConnected,
      onPeerDisconnected: handlePeerDisconnected,
      onError: handleError,
    });
    peerManagerRef.current = manager;

    try {
      const newRoomId = await manager.initializeAsHost();
      setState({
        ...initialState,
        isHost: true,
        roomId: newRoomId,
        peerId: newRoomId,
        playerName,
        isConnected: true,
        connectedPlayers: [playerName],
        playerStageStatus: new Map([[playerName, { ready: false, sideDecksSelected: false, gameReady: false }]])
      });
      forceUpdate();
      showToast({ type: 'success', title: 'Room Created', message: `Room ${newRoomId} is live!` });
      return newRoomId;
    } catch (error) {
      console.error('❌ Failed to create room:', error);
      handleError(error as Error);
      throw error;
    }
  }, [handleMessage, handlePeerConnected, handlePeerDisconnected, handleError, showToast]);

  const joinRoom = useCallback(async (roomId: string, playerName: string) => {
    console.log('🚪 Joining room:', roomId, 'as:', playerName);
    if (peerManagerRef.current) {
      peerManagerRef.current.disconnect();
    }

    const manager = new PeerConnectionManager({
      onMessage: handleMessage,
      onPeerConnected: handlePeerConnected,
      onPeerDisconnected: handlePeerDisconnected,
      onError: handleError,
    });
    peerManagerRef.current = manager;

    try {
      await manager.initializeAsGuest(roomId, playerName);
      setState(prev => ({
        ...prev,
        isHost: false,
        roomId,
        peerId: manager.getPeerId() || '',
        playerName,
        isConnected: false, // Will be true after PLAYER_LIST_SYNC
        connectedPlayers: [],
      }));
      forceUpdate();
      showToast({ type: 'info', title: 'Joining Room', message: `Connecting to ${roomId}...` });
    } catch (error) {
      console.error('❌ Failed to join room:', error);
      handleError(error as Error);
      throw error;
    }
  }, [handleMessage, handlePeerConnected, handlePeerDisconnected, handleError, showToast]);

  const leaveRoom = useCallback(() => {
    console.log('👋 Leaving room...');
    if (peerManagerRef.current) {
      peerManagerRef.current.disconnect();
      peerManagerRef.current = null;
    }
    setState(initialState);
    forceUpdate();
  }, []);

  const setPlayerReady = useCallback((ready: boolean) => {
    const peerManager = peerManagerRef.current;
    const { isHost, playerName, peerId } = stateRef.current;
    if (!peerManager || !playerName) return;

    console.log(`🙋 ${playerName} is setting ready status to: ${ready}`);
    const message: PeerMessage = {
      type: 'PLAYER_READY',
      ready,
      playerId: playerName,
      timestamp: Date.now(),
    };

    if (isHost) {
      // Host processes and broadcasts
      handleMessage(message, peerId!);
    } else {
      // Client sends to host
      peerManager.sendToHost(message);
    }
  }, [handleMessage]);

  const startGame = useCallback(() => {
    const peerManager = peerManagerRef.current;
    const { isHost, peerId } = stateRef.current;
    if (!isHost || !peerManager) return;

    console.log('🚀 Host is starting the game!');
    const message: PeerMessage = { type: 'GAME_START', timestamp: Date.now() };
    peerManager.sendToAll(message);
    handleMessage(message, peerId!); // Host processes it too
  }, [handleMessage]);

  const restartGame = useCallback(() => {
    const peerManager = peerManagerRef.current;
    const { isHost, peerId, connectedPlayers } = stateRef.current;
    if (!isHost || !peerManager) return;
    console.log('🔄 Restarting multiplayer game (NEW_GAME)');
    // Recreate authoritative game
    try {
      pazaakGameRef.current = new PazaakGame(connectedPlayers);
    } catch (e) {
      console.error('Failed to create new PazaakGame on restart:', e);
    }
    const msg: PeerMessage = { type: 'NEW_GAME', timestamp: Date.now() } as PeerMessage;
    peerManager.sendToAll(msg);
    handleMessage(msg, peerId!);
  }, [handleMessage]);

  const selectSideDeck = useCallback((cardIds: string[]) => {
    const peerManager = peerManagerRef.current;
    const { isHost, playerName, peerId } = stateRef.current;
    if (!peerManager || !playerName) return;

    const message: PeerMessage = { type: 'SIDE_DECK_SELECTED', playerId: playerName, cardIds, timestamp: Date.now() };

    if (isHost) {
      handleMessage(message, peerId!);
    } else {
      peerManager.sendToHost(message);
    }
  }, [handleMessage]);

  const sendGameAction = useCallback((action: Record<string, unknown>) => {
    const peerManager = peerManagerRef.current;
    const { isHost, playerName } = stateRef.current;
    if (!peerManager) return;
    if (isHost) {
      // Apply directly on host game
      if (pazaakGameRef.current) {
        try {
          type HostAction = 
            | { type: 'drawCard' }
            | { type: 'useSideCard'; cardId: string; modifier?: 'positive' | 'negative' }
            | { type: 'stand' }
            | { type: 'endTurn' }
            | { type: 'nextRound' };
          const a = action as HostAction;
          const hostPlayerId = 'player-0';
          switch (a.type) {
            case 'drawCard':
              pazaakGameRef.current.dealCard(hostPlayerId); break;
            case 'useSideCard':
              pazaakGameRef.current.useSideCard(hostPlayerId, a.cardId, a.modifier); break;
            case 'stand':
              pazaakGameRef.current.stand(hostPlayerId); break;
            case 'endTurn':
              (pazaakGameRef.current as unknown as { endTurn: () => void }).endTurn(); break;
            case 'nextRound':
              pazaakGameRef.current.startNextRound(); break;
          }
          const gameState = pazaakGameRef.current.getState();
          versionRef.current += 1;
          peerManager.sendToAll({
            type: 'GAME_STATE_SYNC',
            gameState: gameState as unknown as Record<string, unknown>,
            version: versionRef.current,
            timestamp: Date.now()
          });
          setState(prev => ({ ...prev, gameState }));
        } catch (e) {
          console.error('Host failed to process action:', e);
        }
      }
    } else {
      const actionId = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      const clientMsg: PeerMessage = { type: 'CLIENT_ACTION', action: { ...action, playerName }, actionId, timestamp: Date.now() };
      peerManager.sendToHost(clientMsg);
    }
  }, []);

  const syncGameState = useCallback((gameState: GameState) => {
    const peerManager = peerManagerRef.current;
    if (!state.isHost || !peerManager) return;
  versionRef.current += 1;
  const message: PeerMessage = { type: 'GAME_STATE_SYNC', gameState: gameState as unknown as Record<string, unknown>, version: versionRef.current, timestamp: Date.now() };
    peerManager.sendToAll(message);
  }, [state.isHost]);

  const value = useMemo(() => ({
    state,
    createRoom,
    joinRoom,
    leaveRoom,
    setPlayerReady,
    startGame,
  restartGame,
    selectSideDeck,
    sendGameAction,
    syncGameState,
    isPlayerReady: (playerId: string) => state.playersReady.get(playerId) || false,
    areAllPlayersReady: () => {
      if (state.connectedPlayers.length < 2) return false;
      return state.connectedPlayers.every(p => state.playersReady.get(p));
    },
    getPlayerStageStatus: (playerName: string) => {
      return state.playerStageStatus.get(playerName) || {
        ready: false,
        sideDecksSelected: false,
        gameReady: false,
      };
    },
    areAllSideDecksSelected: () => {
      if (state.connectedPlayers.length < 2) return false;
      return state.connectedPlayers.every(p => state.playerSideDecks.has(p));
    },
    getPlayerCount: () => state.connectedPlayers.length,
  }), [state, createRoom, joinRoom, leaveRoom, setPlayerReady, startGame, restartGame, selectSideDeck, sendGameAction, syncGameState]);

  return (
    <MultiplayerContext.Provider value={value}>
      {children}
    </MultiplayerContext.Provider>
  );
};

// eslint-disable-next-line
export const useMultiplayer = (): MultiplayerContextValue => {
  const context = useContext(MultiplayerContext);
  if (!context) {
    throw new Error('useMultiplayer must be used within a MultiplayerProvider');
  }
  return context;
};

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardHeader,
  Text,
  Button,
  Input,
  Badge,
  Title3,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  Copy24Regular,
  People24Regular,
  Wifi224Regular,
} from '@fluentui/react-icons';
import { PeerConnectionManager, type PeerMessage } from '../utils/peerConnection';
import { usePeerConnection } from '../contexts/PeerConnectionContext';

interface MultiplayerLobbyProps {
  onGameStart: (peerManager: PeerConnectionManager, isHost: boolean, players: string[], myPlayerName: string) => void;
  onBack: () => void;
}

const useStyles = makeStyles({
  lobbyContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingVerticalL,
    overflow: 'auto',
  },
  lobbyContent: {
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  modeSelection: {
    display: 'flex',
    gap: tokens.spacingHorizontalL,
    justifyContent: 'center',
  },
  modeCard: {
    flex: 1,
    maxWidth: '300px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      transform: 'translateY(-4px)',
    },
  },
  roomSetup: {
    textAlign: 'center',
  },
  roomIdDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'center',
    margin: `${tokens.spacingVerticalM} 0`,
  },
  roomIdText: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorNeutralBackground3,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  joinRoomForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    alignItems: 'center',
  },
  joinInputs: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'end',
  },
  playersWaiting: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    alignItems: 'center',
  },
  playersList: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  connectionStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'center',
    margin: `${tokens.spacingVerticalS} 0`,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  errorMessage: {
    color: tokens.colorPaletteRedForeground1,
    textAlign: 'center',
    padding: tokens.spacingVerticalM,
  },
  instructions: {
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalS,
  },
  nameInput: {
    textAlign: 'center',
    marginBottom: tokens.spacingVerticalM,
  },
  iconHeader: {
    textAlign: 'center',
  },
});

const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({ onGameStart, onBack }) => {
  const styles = useStyles();
  const { peerManager, initializePeerManager, resetPeerManager } = usePeerConnection();
  const [mode, setMode] = useState<'selection' | 'host' | 'join'>('selection');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [roomId, setRoomId] = useState<string>('');
  const [joinRoomId, setJoinRoomId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('Player');
  const [connectedPlayers, setConnectedPlayers] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);

  // Use refs to capture latest values for message handler
  const isHostRef = useRef(isHost);
  const peerManagerRef = useRef(peerManager);
  const connectedPlayersRef = useRef(connectedPlayers);
  const onGameStartRef = useRef(onGameStart);

  // Update refs when values change
  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  useEffect(() => {
    peerManagerRef.current = peerManager;
  }, [peerManager]);

  useEffect(() => {
    connectedPlayersRef.current = connectedPlayers;
  }, [connectedPlayers]);

  useEffect(() => {
    onGameStartRef.current = onGameStart;
  }, [onGameStart]);

  const handlePeerMessage = useCallback((message: PeerMessage, peerId: string) => {
    console.log(`📨 Received message from ${peerId}:`, message);
    
    switch (message.type) {
      case 'PLAYER_JOINED':
        console.log(`🎮 Player joined: ${message.playerName}`);
        setConnectedPlayers(prev => {
          const newPlayers = prev.includes(message.playerName) ? prev : [...prev, message.playerName];
          
          // Host should broadcast the updated player list to all connected clients
          if (isHost && peerManager && newPlayers.length > prev.length) {
            console.log('📤 Host broadcasting updated player list:', newPlayers);
            setTimeout(() => {
              peerManager.sendToAll({
                type: 'PLAYER_LIST_SYNC',
                players: newPlayers,
                timestamp: Date.now()
              });
            }, 100); // Small delay to ensure state update has occurred
          }
          
          return newPlayers;
        });
        break;
        
      case 'PLAYER_LIST_SYNC':
        console.log(`📋 Received player list sync:`, message.players);
        setConnectedPlayers(message.players);
        break;
        
      case 'GAME_START':
        console.log(`🎮 Game start received from host`);
        if (!isHostRef.current && peerManagerRef.current) {
          // Guest receives game start command from host
          onGameStartRef.current(peerManagerRef.current, isHostRef.current, connectedPlayersRef.current, playerName);
        }
        break;
        
      case 'CONNECTION_TEST':
        console.log('📡 Connection test received');
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  }, [isHost, peerManager, playerName]);

  const handlePeerConnected = useCallback((peerId: string) => {
    console.log(`✅ Peer connected: ${peerId}`);
    setConnectionStatus('connected');
  }, []);

  const handlePeerDisconnected = useCallback((peerId: string) => {
    console.log(`❌ Peer disconnected: ${peerId}`);
    setConnectedPlayers(prev => prev.filter(player => player !== peerId));
    
    if (peerManager?.getConnectedPeers().length === 0) {
      setConnectionStatus('disconnected');
    }
  }, [peerManager]);

  const handlePeerError = useCallback((error: Error) => {
    console.error('❌ Peer error:', error);
    console.error('❌ Peer error details:', {
      message: error.message,
      stack: error.stack,
      connectionStatus,
      mode,
      isHost,
      roomId,
      joinRoomId
    });
    setConnectionStatus('error');
    setErrorMessage(`Connection error: ${error.message}`);
  }, [connectionStatus, mode, isHost, roomId, joinRoomId]);

  const createPeerManager = useCallback(() => {
    const manager = initializePeerManager({
      onMessage: handlePeerMessage,
      onPeerConnected: handlePeerConnected,
      onPeerDisconnected: handlePeerDisconnected,
      onError: handlePeerError,
    });
    return manager;
  }, [initializePeerManager, handlePeerMessage, handlePeerConnected, handlePeerDisconnected, handlePeerError]);

  const handleHostGame = useCallback(async () => {
    setMode('host');
    setConnectionStatus('connecting');
    setErrorMessage('');
    setIsHost(true);
    
    try {
      console.log('🏠 Starting to host game...', { playerName });
      const manager = createPeerManager();
      console.log('🔧 Created peer manager, initializing as host...');
      const generatedRoomId = await manager.initializeAsHost();
      console.log('✅ Host initialized successfully:', { generatedRoomId });
      setRoomId(generatedRoomId);
      setConnectedPlayers([playerName]); // Host is always the first player
      setConnectionStatus('connected');
    } catch (error) {
      console.error('❌ Failed to host game:', error);
      console.error('❌ Host failure details:', {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : null,
        playerName
      });
      setErrorMessage(`Failed to create room: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setConnectionStatus('error');
    }
  }, [createPeerManager, playerName]);

  const handleJoinGame = useCallback(async () => {
    if (!joinRoomId.trim()) {
      setErrorMessage('Please enter a room ID');
      return;
    }
    
    setMode('join');
    setConnectionStatus('connecting');
    setErrorMessage('');
    setIsHost(false);
    
    try {
      console.log('🚪 Starting to join game...', { joinRoomId: joinRoomId.trim(), playerName });
      const manager = createPeerManager();
      console.log('🔧 Created peer manager, initializing as guest...');
      await manager.initializeAsGuest(joinRoomId.trim(), playerName);
      console.log('✅ Guest initialized successfully');
      setRoomId(joinRoomId.trim());
      // Don't set connectedPlayers here - wait for PLAYER_LIST_SYNC from host
    } catch (error) {
      console.error('❌ Failed to join game:', error);
      console.error('❌ Join failure details:', {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : null,
        joinRoomId: joinRoomId.trim(),
        playerName
      });
      setErrorMessage(`Failed to join room: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setConnectionStatus('error');
    }
  }, [joinRoomId, createPeerManager, playerName]);

  const handleStartGame = useCallback(() => {
    console.log('🎮 handleStartGame called:', { 
      peerManager: !!peerManager, 
      playerCount: connectedPlayers.length, 
      isHost,
      connectedPlayers 
    });
    
    if (peerManager && connectedPlayers.length >= 2) {
      console.log('✅ Starting game with valid conditions');
      
      if (isHost) {
        // Host sends game start message to all guests
        console.log('📤 Host sending GAME_START message to all peers');
        peerManager.sendToAll({
          type: 'GAME_START',
          timestamp: Date.now()
        });
      }
      // Both host and guest start the game
      console.log('🚀 Calling onGameStart with playerName:', playerName);
      onGameStart(peerManager, isHost, connectedPlayers, playerName);
    } else {
      console.log('❌ Cannot start game - missing requirements:', {
        hasPeerManager: !!peerManager,
        playerCount: connectedPlayers.length,
        needsAtLeast: 2,
        connectedPlayers
      });
    }
  }, [peerManager, connectedPlayers, isHost, onGameStart, playerName]);

  const handleCopyRoomId = useCallback(() => {
    navigator.clipboard.writeText(roomId);
    // Could add a toast notification here
  }, [roomId]);

  const handleBackToSelection = useCallback(() => {
    if (peerManager) {
      peerManager.disconnect();
    }
    setMode('selection');
    setConnectionStatus('disconnected');
    setConnectedPlayers([]);
    setErrorMessage('');
    setRoomId('');
    setJoinRoomId('');
  }, [peerManager]);

  // Send player list updates to all peers when it changes (host only)
  useEffect(() => {
    if (isHost && peerManager && connectedPlayers.length > 0) {
      setTimeout(() => {
        peerManager.sendToAll({
          type: 'PLAYER_LIST_SYNC',
          players: connectedPlayers,
          timestamp: Date.now()
        });
      }, 100);
    }
  }, [isHost, peerManager, connectedPlayers]);

  return (
    <div className={styles.lobbyContainer}>
      <div className={styles.lobbyContent}>
        <Button 
          appearance="secondary" 
          onClick={onBack}
          className={styles.backButton}
        >
          ← Back to Main Menu
        </Button>

        <Card>
          <CardHeader header={<Title3>🌌 Multiplayer Pazaak</Title3>} />
        </Card>

        {errorMessage && (
          <div className={styles.errorMessage}>
            <Text color="danger">
              {errorMessage}
            </Text>
            <Button
              appearance="secondary"
              size="small"
              onClick={() => {
                setErrorMessage('');
                setConnectionStatus('disconnected');
                resetPeerManager();
                setMode('selection');
              }}
              style={{ marginTop: tokens.spacingVerticalXS }}
            >
              Try Again
            </Button>
          </div>
        )}

        {mode === 'selection' && (
          <>
            <Text size={400} style={{ textAlign: 'center', marginBottom: tokens.spacingVerticalM }}>
              Choose how to play multiplayer Pazaak:
            </Text>
            
            <div className={styles.nameInput}>
              <Text size={300} weight="semibold">Your Name:</Text>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your player name"
                style={{ marginTop: tokens.spacingVerticalS, maxWidth: '200px' }}
              />
            </div>

            <div className={styles.modeSelection}>
              <Card className={styles.modeCard} onClick={handleHostGame}>
                <CardHeader
                  header={
                    <div className={styles.iconHeader}>
                      <People24Regular style={{ fontSize: '48px', marginBottom: tokens.spacingVerticalS }} />
                      <Title3>Host Game</Title3>
                      <Text>Create a new room and invite a friend</Text>
                    </div>
                  }
                />
              </Card>

              <Card className={styles.modeCard}>
                <CardHeader
                  header={
                    <div className={styles.iconHeader}>
                      <div className={styles.joinRoomForm}>
                        <Wifi224Regular style={{ fontSize: '48px', marginBottom: tokens.spacingVerticalS }} />
                        <Title3>Join Game</Title3>
                        <Text>Enter a room ID to join an existing game</Text>
                        <div className={styles.joinInputs}>
                          <Input
                            value={joinRoomId}
                            onChange={(e) => setJoinRoomId(e.target.value)}
                            placeholder="Enter room ID"
                            onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleJoinGame()}
                          />
                          <Button 
                            appearance="primary"
                            onClick={handleJoinGame}
                            disabled={!joinRoomId.trim()}
                          >
                            Join
                          </Button>
                        </div>
                      </div>
                    </div>
                  }
                />
              </Card>
            </div>

            <Text className={styles.instructions}>
              💡 Tip: Open two browser windows/tabs to test multiplayer by yourself!
            </Text>
          </>
        )}

        {(mode === 'host' || mode === 'join') && (
          <>
            {roomId && (
              <div className={styles.roomSetup}>
                <Text size={400} weight="semibold">Room ID:</Text>
                <div className={styles.roomIdDisplay}>
                  <div className={styles.roomIdText}>{roomId}</div>
                  <Button
                    appearance="subtle"
                    icon={<Copy24Regular />}
                    onClick={handleCopyRoomId}
                    title="Copy room ID"
                  />
                </div>
                {mode === 'host' && (
                  <Text size={300} className={styles.instructions}>
                    Share this room ID with your friend to join the game
                  </Text>
                )}
              </div>
            )}

            {connectionStatus === 'connected' && (
              <div className={styles.playersWaiting}>
                <Text size={400} weight="semibold">
                  Players in Room ({connectedPlayers.length}/2):
                </Text>
                <div className={styles.playersList}>
                  {connectedPlayers.map((player, index) => (
                    <Badge key={index} appearance="filled" color="brand" size="large">
                      {player} {index === 0 && isHost ? '(Host)' : ''}
                    </Badge>
                  ))}
                </div>

                {connectedPlayers.length < 2 ? (
                  <Text className={styles.instructions}>
                    Waiting for another player to join...
                  </Text>
                ) : (
                  <Button
                    appearance="primary"
                    size="large"
                    onClick={(e: React.MouseEvent) => {
                      try {
                        console.log('🎮 Start Pazaak Game button clicked!', e);
                        console.log('🎯 Button state:', {
                          connectedPlayers,
                          playerCount: connectedPlayers.length,
                          peerManager: !!peerManager,
                          isHost,
                          playerName,
                          onGameStart: typeof onGameStart
                        });
                        
                        // Prevent any default behavior
                        e.preventDefault();
                        e.stopPropagation();
                        
                        console.log('🚀 About to call handleStartGame...');
                        handleStartGame();
                        console.log('✅ handleStartGame called successfully');
                      } catch (error) {
                        console.error('❌ Error in button click handler:', error);
                      }
                    }}
                  >
                    Start Pazaak Game! 🎮
                  </Button>
                )}
              </div>
            )}

            <Button
              appearance="secondary"
              onClick={handleBackToSelection}
            >
              ← Back to Mode Selection
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default MultiplayerLobby;

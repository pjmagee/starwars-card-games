import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  Text,
  Button,
  Input,
  Field,
  Spinner,
  Badge,
  makeStyles,
  tokens,
  Tab,
  TabList,
  type SelectTabData,
  type SelectTabEvent,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Link24Regular,
  People24Regular,
  Copy24Regular,
} from '@fluentui/react-icons';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import SideDeckSelection from '../games/pazaak/SideDeckSelection';
import { PazaakGame } from '../games/pazaak/gameLogic';

interface MultiplayerSetupProps {
  onGameStart: () => void;
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    maxWidth: '600px',
    margin: '0 auto',
    padding: tokens.spacingVerticalXL,
  },
  containerFullWidth: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    width: '100%',
    maxWidth: 'none',
    margin: '0',
    padding: tokens.spacingVerticalM,
  },
  sessionIndicator: {
    position: 'fixed',
    top: tokens.spacingVerticalL,
    right: tokens.spacingVerticalL,
    zIndex: 1000,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorBrandBackground,
    borderRadius: tokens.borderRadiusLarge,
    border: `2px solid ${tokens.colorBrandStroke1}`,
    boxShadow: tokens.shadow16,
  },
  sessionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    alignItems: 'center',
  },
  tabPanel: {
    padding: tokens.spacingVerticalL,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  roomInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusLarge,
  },
  roomIdDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightBold,
  },
  playersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  playerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
  },
  connectionStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS,
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalL,
  },
  progressList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  progressItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
});

const MultiplayerSetup: React.FC<MultiplayerSetupProps> = ({ onGameStart }) => {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  const {
    state,
    createRoom,
    joinRoom,
    leaveRoom,
    setPlayerReady,
    startGame,
    isPlayerReady,
    areAllPlayersReady,
    selectSideDeck
  } = useMultiplayer();

  // Monitor game phase transitions and call onGameStart when appropriate
  useEffect(() => {
    console.log('🔄 Game phase changed to:', state.gamePhase);
    console.log('🔍 Current state:', {
      gamePhase: state.gamePhase,
      connectedPlayers: state.connectedPlayers,
      playerSideDecks: Array.from(state.playerSideDecks.entries()),
      playerStageStatus: Array.from(state.playerStageStatus.entries())
    });
    
    if (state.gamePhase === 'playing') {
      console.log('🎮 Transitioning to game layout!');
      onGameStart();
    }
  }, [state.gamePhase, state.connectedPlayers, state.playerSideDecks, state.playerStageStatus, onGameStart]);

  const handleTabSelect = (_: SelectTabEvent, data: SelectTabData) => {
    setSelectedTab(data.value as 'create' | 'join');
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim()) return;
    
    setIsConnecting(true);
    try {
      await createRoom(playerName.trim());
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim() || !roomId.trim()) return;
    
    setIsConnecting(true);
    try {
      await joinRoom(roomId.trim(), playerName.trim());
    } catch (error) {
      console.error('Failed to join room:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCopyRoomId = () => {
    if (state.roomId) {
      navigator.clipboard.writeText(state.roomId);
    }
  };

  const handleToggleReady = () => {
    // Use playerName as the consistent identifier
    const currentReady = isPlayerReady(state.playerName);
    console.log('🎯 Toggle ready for:', state.playerName, 'current:', currentReady, 'new:', !currentReady);
    setPlayerReady(!currentReady);
  };

  const handleStartGame = () => {
    startGame();
    // Don't call onGameStart() yet - wait until side deck selection is complete
  };

  const handleSelectSideDeck = (selectedCardIds: string[]) => {
    selectSideDeck(selectedCardIds);
    // Once side deck is selected, the game should transition to playing
    // We'll monitor the multiplayer state to call onGameStart when appropriate
  };

  // If game phase is side-deck selection
  if (state.gamePhase === 'side-deck') {
    return (
      <>
        {/* Session Indicator */}
        <div className={styles.sessionIndicator}>
          <div className={styles.sessionInfo}>
            <Badge appearance="filled" color="success">
              {state.isHost ? 'Hosting' : 'Client'}
            </Badge>
            <Text size={200}>Room: {state.roomId}</Text>
            <Text size={200}>
              {state.connectedPlayers.length} player{state.connectedPlayers.length !== 1 ? 's' : ''}
            </Text>
          </div>
        </div>
        
        {/* Stage Progress Indicators */}
        <div className={styles.container}>
          <Card>
            <CardHeader
              header={
                <Text size={400} weight="semibold">
                  Side Deck Selection Progress
                </Text>
              }
            />
            <div className={styles.progressList}>
              {state.connectedPlayers.map(player => {
                const hasSideDeck = state.playerSideDecks.has(player);
                return (
                  <div key={player} className={styles.progressItem}>
                    <Text size={300}>{player}</Text>
                    <Badge 
                      appearance={hasSideDeck ? "filled" : "outline"} 
                      color={hasSideDeck ? "success" : "warning"}
                    >
                      {hasSideDeck ? "✓ Side Deck Selected" : "⏳ Selecting..."}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
        
        <div className={styles.containerFullWidth}>
          <SideDeckSelection
            playerName={state.playerName}
            sideCards={PazaakGame.generateSideDeckForUI()}
            onSelectionComplete={handleSelectSideDeck}
          />
        </div>
      </>
    );
  }

  // If already connected, show room lobby
  if (state.isConnected) {
    return (
      <>
        {/* Session Indicator */}
        <div className={styles.sessionIndicator}>
          <div className={styles.sessionInfo}>
            <Badge appearance="filled" color="success">
              {state.isHost ? 'Hosting' : 'Client'}
            </Badge>
            <Text size={200}>Room: {state.roomId}</Text>
            <Text size={200}>
              {state.connectedPlayers.length} player{state.connectedPlayers.length !== 1 ? 's' : ''}
            </Text>
          </div>
        </div>
        
        <div className={styles.container}>
          <Card>
          <CardHeader
            header={
              <div>
                <Text size={500} weight="semibold">
                  {state.isHost ? 'Hosting Room' : 'Joined Room'}
                </Text>
                <div className={styles.connectionStatus}>
                  <Badge appearance="filled" color="success">
                    Connected
                  </Badge>
                  <Text size={300}>
                    {state.connectedPlayers.length} player{state.connectedPlayers.length !== 1 ? 's' : ''}
                  </Text>
                </div>
              </div>
            }
          />
          
          <div className={styles.tabPanel}>
            <div className={styles.roomInfo}>
              <div className={styles.roomIdDisplay}>
                <Text weight="semibold">Room ID:</Text>
                <Text>{state.roomId}</Text>
                <Button
                  appearance="subtle"
                  icon={<Copy24Regular />}
                  onClick={handleCopyRoomId}
                  size="small"
                />
              </div>
              
              <div className={styles.playersList}>
                <Text weight="semibold">Players:</Text>
                {state.connectedPlayers.map(player => (
                  <div key={player} className={styles.playerItem}>
                    <People24Regular />
                    <Text>{player}</Text>
                    {isPlayerReady(player) && (
                      <Badge appearance="filled" color="success" size="small">
                        Ready
                      </Badge>
                    )}
                    {player === state.playerName && (
                      <Badge appearance="outline" color="brand" size="small">
                        You
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.form}>
              <Button
                appearance={isPlayerReady(state.playerName) ? 'outline' : 'primary'}
                onClick={handleToggleReady}
                disabled={state.connectedPlayers.length < 2}
              >
                {isPlayerReady(state.playerName) ? 'Not Ready' : 'Ready'}
              </Button>

              {state.isHost && (
                <Button
                  appearance="primary"
                  onClick={handleStartGame}
                  disabled={!areAllPlayersReady() || state.connectedPlayers.length < 2}
                >
                  Start Game
                </Button>
              )}

              <Button
                appearance="secondary"
                onClick={leaveRoom}
              >
                Leave Room
              </Button>
            </div>

            <div className={styles.connectionStatus}>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                Connection Health: {state.connectionHealth.activeConnections}/{state.connectionHealth.totalConnections} active
              </Text>
            </div>
          </div>
        </Card>
        </div>
      </>
    );
  }

  // Show setup form
  return (
    <div className={styles.container}>
      <Card>
        <CardHeader
          header={
            <Text size={500} weight="semibold">
              Multiplayer Setup
            </Text>
          }
        />
        
        <div className={styles.tabPanel}>
          <TabList selectedValue={selectedTab} onTabSelect={handleTabSelect}>
            <Tab value="create" icon={<Add24Regular />}>
              Create Room
            </Tab>
            <Tab value="join" icon={<Link24Regular />}>
              Join Room
            </Tab>
          </TabList>

          {isConnecting ? (
            <div className={styles.loadingContainer}>
              <Spinner size="medium" />
              <Text>
                {selectedTab === 'create' ? 'Creating room...' : 'Joining room...'}
              </Text>
            </div>
          ) : (
            <div className={styles.form}>
              <Field label="Your Name" required>
                <Input
                  value={playerName}
                  onChange={(_, data) => setPlayerName(data.value)}
                  placeholder="Enter your name"
                />
              </Field>

              {selectedTab === 'join' && (
                <Field label="Room ID" required>
                  <Input
                    value={roomId}
                    onChange={(_, data) => setRoomId(data.value)}
                    placeholder="Enter room ID"
                  />
                </Field>
              )}

              <Button
                appearance="primary"
                onClick={selectedTab === 'create' ? handleCreateRoom : handleJoinRoom}
                disabled={!playerName.trim() || (selectedTab === 'join' && !roomId.trim())}
              >
                {selectedTab === 'create' ? 'Create Room' : 'Join Room'}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MultiplayerSetup;

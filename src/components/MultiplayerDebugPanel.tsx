import React from 'react';
import { Card, Text, Badge, Button, makeStyles, tokens } from '@fluentui/react-components';
import type { GameState } from '../games/pazaak/types';
import { MultiplayerPazaakGame } from '../utils/multiplayerGame';

const useStyles = makeStyles({
  debugContainer: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM,
    fontFamily: 'monospace',
    fontSize: '12px',
  },
  debugSection: {
    marginBottom: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalXS,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusSmall,
  },
  debugTitle: {
    fontWeight: 'bold',
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalXS,
  },
  stateRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  playerState: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
    padding: tokens.spacingVerticalXS,
    borderRadius: tokens.borderRadiusSmall,
    marginBottom: tokens.spacingVerticalXS,
  },
  hostState: {
    backgroundColor: tokens.colorPaletteBlueBackground2,
  },
  guestState: {
    backgroundColor: tokens.colorPaletteDarkOrangeBackground3,
  },
  connectionHealth: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    flexWrap: 'wrap',
  },
  testButtons: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalS,
  },
});

interface MultiplayerDebugPanelProps {
  gameState: GameState | null;
  multiplayerGame: MultiplayerPazaakGame | null;
  isHost: boolean;
  peerId: string | null;
  connectionHealth: {
    totalConnections: number;
    activeConnections: number;
    connectionStates: Record<string, string>;
    queuedMessages: Record<string, number>;
  } | null;
}

export const MultiplayerDebugPanel: React.FC<MultiplayerDebugPanelProps> = ({
  gameState,
  multiplayerGame,
  isHost,
  peerId,
  connectionHealth,
}) => {
  const styles = useStyles();

  const sendTestMessage = () => {
    // We can't directly access peerConnection from here, so let's add a method to multiplayerGame
    console.log('Test message request - would need to be implemented in MultiplayerPazaakGame');
  };

  const triggerStateSync = () => {
    // syncGameState is private, but getDebugInfo might trigger necessary updates
    if (multiplayerGame && isHost) {
      console.log('State sync request - would need to be implemented in MultiplayerPazaakGame');
    }
  };

  const debugInfo = multiplayerGame?.getDebugInfo();
  const completionStatus = multiplayerGame?.getSideDeckCompletionStatus();

  return (
    <Card className={styles.debugContainer}>
      <div className={styles.debugSection}>
        <div className={styles.debugTitle}>🔍 Connection Status</div>
        <div className={styles.stateRow}>
          <span>Role:</span>
          <Badge color={isHost ? 'brand' : 'success'}>
            {isHost ? 'HOST' : 'GUEST'}
          </Badge>
        </div>
        <div className={styles.stateRow}>
          <span>Peer ID:</span>
          <Text>{peerId || 'Not connected'}</Text>
        </div>
        <div className={styles.stateRow}>
          <span>Active Connections:</span>
          <Text>{connectionHealth?.activeConnections || 0}</Text>
        </div>
        
        <div className={styles.connectionHealth}>
          {connectionHealth?.connectionStates && Object.entries(connectionHealth.connectionStates).map(([peer, state]) => (
            <Badge key={peer} color={state === 'open' ? 'success' : state === 'connecting' ? 'warning' : 'danger'}>
              {peer.substring(0, 8)}...{state}
            </Badge>
          ))}
        </div>
      </div>

      {gameState && (
        <div className={styles.debugSection}>
          <div className={styles.debugTitle}>🎮 Game State</div>
          <div className={styles.stateRow}>
            <span>Phase:</span>
            <Badge color={gameState.gamePhase === 'playing' ? 'success' : 'warning'}>
              {gameState.gamePhase}
            </Badge>
          </div>
          <div className={styles.stateRow}>
            <span>Current Player:</span>
            <Text>{gameState.players[gameState.currentPlayerIndex]?.name || 'None'}</Text>
          </div>
          <div className={styles.stateRow}>
            <span>Players:</span>
            <Text>{gameState.players.length}</Text>
          </div>
          <div className={styles.stateRow}>
            <span>Game Status:</span>
            <Text>{gameState.gamePhase}</Text>
          </div>
        </div>
      )}

      {gameState && (
        <div className={styles.debugSection}>
          <div className={styles.debugTitle}>👥 Players</div>
          {gameState.players.map((player, index) => (
            <div key={player.id} className={`${styles.playerState} ${index === 0 ? styles.hostState : styles.guestState}`}>
              <div className={styles.stateRow}>
                <span>Name:</span>
                <Text>{player.name}</Text>
              </div>
              <div className={styles.stateRow}>
                <span>Score:</span>
                <Text>{player.score}</Text>
              </div>
              <div className={styles.stateRow}>
                <span>Side Cards:</span>
                <Text>{player.selectedSideCards.length}/10</Text>
              </div>
              <div className={styles.stateRow}>
                <span>Dealt Cards:</span>
                <Text>{player.dealtSideCards.length}/4</Text>
              </div>
              <div className={styles.stateRow}>
                <span>Standing:</span>
                <Badge color={player.isStanding ? 'success' : 'subtle'}>
                  {player.isStanding ? 'YES' : 'NO'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {multiplayerGame && (
        <div className={styles.debugSection}>
          <div className={styles.debugTitle}>🔄 Multiplayer Status</div>
          <div className={styles.stateRow}>
            <span>My Player:</span>
            <Text>{multiplayerGame.getMyPlayer()?.name || 'Unknown'}</Text>
          </div>
          <div className={styles.stateRow}>
            <span>Completion Status:</span>
            <div>
              {completionStatus && Array.from(completionStatus.entries()).map(([playerId, isComplete]) => (
                <Badge key={playerId} color={isComplete ? 'success' : 'warning'}>
                  {playerId.substring(0, 8)}...{isComplete ? '✅' : '❌'}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={styles.testButtons}>
        <Button size="small" onClick={sendTestMessage}>
          Send Test Message
        </Button>
        {isHost && (
          <Button size="small" onClick={triggerStateSync}>
            Force State Sync
          </Button>
        )}
      </div>
    </Card>
  );
};

export default MultiplayerDebugPanel;

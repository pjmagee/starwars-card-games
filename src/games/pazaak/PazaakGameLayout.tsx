import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  CardHeader,
  Text,
  Button,
  Badge,
  Title3,
  makeStyles,
  tokens,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@fluentui/react-components';
import {
  Bot24Regular,
  Person24Regular,
  Group24Regular,
} from '@fluentui/react-icons';
import { PazaakGame } from './gameLogic';
import PazaakCardComponent from '../../components/PazaakCard';
import SideDeckSelection from './SideDeckSelection';
import DualCardSelection from '../../components/DualCardSelection';
import { useMultiplayer } from '../../contexts/MultiplayerContext';
import RoundHistory from '../../components/RoundHistory';
import type { GameState } from './types';
import ActionLog from '../../components/ActionLog';

const useStyles = makeStyles({
  gameContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
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
  gameBoard: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 300px 1fr',
    gridTemplateRows: '1fr',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    height: 'calc(100vh - 60px)',
    width: '100%',
    overflow: 'hidden',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  playerArea: {
    gridColumn: '1',
    gridRow: '1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `2px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingVerticalL,
  },
  centerArea: {
    gridColumn: '2',
    gridRow: '1',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground3,
    border: `2px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingVerticalL,
  maxHeight: '100%',
  overflow: 'hidden',
  },
  primaryActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    justifyContent: 'flex-start',
    width: '180px',
    '& button': {
      height: '52px',
      fontSize: tokens.fontSizeBase400,
      fontWeight: tokens.fontWeightSemibold,
    },
  },
  secondaryActions: {
    display: 'flex',
    flexDirection: 'row',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'center',
    width: '100%',
  },
  opponentArea: {
    gridColumn: '3',
    gridRow: '1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `2px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingVerticalL,
  },
  playingField: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground3,
    border: `2px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingVerticalXL,
    overflow: 'auto',
    minHeight: '400px',
  },
  gameTable: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalL,
    width: '100%',
    maxWidth: '800px',
  },
  playerGameArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    width: '100%',
  },
  cardSequence: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gridTemplateRows: 'repeat(3, 1fr)',
    gap: tokens.spacingHorizontalXS,
    width: '100%',
    maxWidth: '300px',
    minHeight: '380px',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorSubtleBackground,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerHand: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'center',
    marginTop: tokens.spacingVerticalM,
  },
  scoreDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  rightSidebar: {
    gridColumn: '3',
    gridRow: '1 / 3',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM,
    overflow: 'hidden',
  },
  playerSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingVerticalM,
    minHeight: '280px',
  },
  playerInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalXS,
    marginBottom: tokens.spacingVerticalS,
  },
  playerName: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))',
    gap: tokens.spacingHorizontalXS,
    width: '100%',
    minHeight: '100px',
  },
  sideCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: tokens.spacingHorizontalXS,
    width: '100%',
    maxHeight: '200px',
    overflow: 'auto',
  },
  hiddenCard: {
    width: '60px',
    height: '84px',
    backgroundColor: tokens.colorNeutralBackground6,
    border: `2px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundIndicators: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS,
  },
  roundIndicator: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: `2px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  roundWon: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
    border: `2px solid ${tokens.colorPaletteGreenBorder2}`,
  },
  opponentSideCards: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalS,
  },
  opponentSideCard: {
    width: '50px',
    height: '70px',
    backgroundColor: tokens.colorNeutralBackground6,
    border: `2px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  usedOpponentCard: {
    opacity: 0.9,
    backgroundColor: tokens.colorPaletteGreenBackground2,
    border: `2px solid ${tokens.colorPaletteGreenBorder2}`,
  },
  deckCard: {
    width: '100px',
    height: '140px',
    backgroundColor: tokens.colorBrandBackground,
    border: `2px solid ${tokens.colorBrandStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    ':hover': {
      transform: 'scale(1.05)',
    },
  },
  deckCardDisabled: {
    width: '100px',
    height: '140px',
    backgroundColor: tokens.colorBrandBackground,
    border: `2px solid ${tokens.colorBrandStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  deckCardIcon: {
    fontSize: '32px',
    color: 'white',
  },
  deckArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalXS,
    marginBottom: tokens.spacingVerticalL,
  },
  centerActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
  },
  scoreBadge: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
  },
  gameStatus: {
    textAlign: 'center',
    padding: tokens.spacingVerticalM,
  },
  sidebarCard: {
    padding: tokens.spacingVerticalM,
  },
  sideCardsSection: {
    marginTop: tokens.spacingVerticalS,
  },
  deckAreaStyle: {
    cursor: 'default',
    opacity: 0.6,
  },
  winnerText: {
    display: 'block',
    margin: `${tokens.spacingVerticalM} 0`,
  },
  centerInfo: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    width: '100%',
    maxWidth: '280px',
  },
  compactHistory: {
    marginTop: tokens.spacingVerticalM,
    width: '100%',
    maxWidth: '280px',
  },
  aiThinking: {
    color: tokens.colorBrandForeground1,
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorBrandStroke1}`,
    textAlign: 'center',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  noCardsText: {
    color: tokens.colorNeutralForeground3,
  },
  gameOverOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000,
  },
  gameOverCard: {
    padding: tokens.spacingVerticalXL,
    textAlign: 'center',
    minWidth: '300px',
  },
  playAgainButton: {
    marginTop: tokens.spacingVerticalM,
  },
  selectionContainer: {
    padding: tokens.spacingVerticalL,
  },
  menuContainer: {
    padding: tokens.spacingVerticalXL,
    maxWidth: '600px',
    margin: '0 auto',
  },
  menuCardContent: {
    padding: tokens.spacingVerticalM,
  },
  menuActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    justifyContent: 'center',
  },
  menuDivider: {
    margin: `${tokens.spacingVerticalL} 0`,
  },
  menuDescription: {
    marginBottom: tokens.spacingVerticalL,
  },
  difficultySection: {
    marginBottom: tokens.spacingVerticalL,
    textAlign: 'center',
  },
  difficultyButtons: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'center',
    marginTop: tokens.spacingVerticalS,
  },
  gridSlot: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100px',
    border: `1px dashed ${tokens.colorNeutralStroke3}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  slotNumber: {
    color: tokens.colorNeutralForeground3,
  },
  aiAction: {
    color: tokens.colorPaletteBlueForeground2,
    backgroundColor: tokens.colorPaletteBlueBackground2,
    padding: tokens.spacingVerticalXS,
    borderRadius: tokens.borderRadiusSmall,
    textAlign: 'center',
    maxWidth: '250px',
    width: '100%',
  },
  // AI action history styles removed - actions now logged to console
  usedCardInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  activePlayer: {
    boxShadow: tokens.shadow16,
    border: `3px solid ${tokens.colorBrandStroke1}`,
    position: 'relative',
  },
  standingOutline: {
    border: `3px solid ${tokens.colorPaletteGreenBorder2}`,
  },
  inactivePlayer: {
    opacity: 0.85,
  },
  turnBadge: {
    position: 'absolute',
    top: tokens.spacingVerticalXS,
    left: tokens.spacingHorizontalXS,
    zIndex: 10,
  },
  statusBadge: {
    position: 'absolute',
    top: tokens.spacingVerticalXS,
    right: tokens.spacingHorizontalXS,
    zIndex: 10,
  },
});

interface PazaakGameLayoutProps {
  initialMode?: 'singleplayer' | 'multiplayer';
}

const PazaakGameLayout: React.FC<PazaakGameLayoutProps> = ({ initialMode = 'singleplayer' }) => {
  const styles = useStyles();
  const multiplayer = useMultiplayer();
  const [game, setGame] = useState<PazaakGame | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameMode, setGameMode] = useState<'menu' | 'vsAI' | 'multiplayer'>(
    initialMode === 'multiplayer' ? 'multiplayer' : 'menu'
  );
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [endTurnDialogOpen, setEndTurnDialogOpen] = useState(false);
  const [pendingEndTurnScore, setPendingEndTurnScore] = useState<number | null>(null);

  // Sync multiplayer state with local game state
  useEffect(() => {
    if (multiplayer.state.gamePhase === 'playing' && multiplayer.state.gameState) {
      setGameState(multiplayer.state.gameState);
    }
  }, [multiplayer.state.gameState, multiplayer.state.gamePhase]);

  // Auto-process AI turns when it's the AI's turn
  useEffect(() => {
    if (!game || !gameState) return;

    if (game.isAITurn() && gameState.gamePhase === 'playing') {
      const timeoutId = setTimeout(() => {
        const aiState = game.processAITurn();
        setGameState(aiState);
      }, 2000); // Increased to 2 seconds for better UX

      return () => clearTimeout(timeoutId);
    }
  }, [game, gameState]);

  const mapCardVariantForDisplay = (card: { isMainDeck: boolean; variant?: string; value: number }): 'positive' | 'negative' | 'dual' | 'flip_2_4' | 'flip_3_6' | 'double' | 'tiebreaker' | 'variable' | undefined => {
    if (card.isMainDeck) return undefined;

    // For effect cards created from side cards, map back to appropriate display variant
    if (card.variant === 'side') {
      return card.value > 0 ? 'positive' : 'negative';
    }

    return card.variant as 'positive' | 'negative' | 'dual' | 'flip_2_4' | 'flip_3_6' | 'double' | 'tiebreaker' | 'variable' | undefined;
  };

  const handleStartVsAI = useCallback(() => {
    const newGame = new PazaakGame(['Player'], difficulty);
    setGame(newGame);
    setGameState(newGame.getState());
    setGameMode('vsAI');
  }, [difficulty]);

  const handleStartMultiplayer = useCallback(() => {
    // Set mode to multiplayer to trigger the proper screen
    setGameMode('multiplayer');
  }, []);

  const handleSideCardsSelected = useCallback((selectedCardIds: string[]) => {
    if (game && gameState) {
      const humanPlayer = gameState.players.find(p => p.id !== 'ai-player') || gameState.players[0];
      const newState = game.selectSideCards(humanPlayer.id, selectedCardIds);
      setGameState(newState);
    }
  }, [game, gameState]);

  const handleDrawCard = useCallback(() => {
    if (gameMode === 'multiplayer' && multiplayer.state.isConnected) {
      multiplayer.sendGameAction({ type: 'drawCard' });
      return;
    }

    if (game && gameState) {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (currentPlayer.id !== 'ai-player') {
        const newState = game.dealCard(currentPlayer.id);
        setGameState(newState);
      }
    }
  }, [game, gameState, gameMode, multiplayer]);

  const handleUseSideCard = useCallback((cardId: string) => {
    console.log('🎴 handleUseSideCard called with:', cardId);

    if (gameMode === 'multiplayer' && multiplayer.state.isConnected) {
      multiplayer.sendGameAction({ type: 'useSideCard', cardId });
      return;
    }

    if (game && gameState) {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      console.log('🎴 Current player:', currentPlayer.name, 'id:', currentPlayer.id);

      if (currentPlayer.id !== 'ai-player') {
        const sideCard = currentPlayer.dealtSideCards.find(c => c.id === cardId);
        console.log('🎴 Side card found:', sideCard);
        console.log('🎴 Side card variant:', sideCard?.variant);

        if (sideCard && (sideCard.variant === 'dual' || sideCard.variant === 'tiebreaker' || sideCard.variant === 'variable')) {
          // Dialog will be handled by the DualCardSelection component wrapper
          console.log('🎴 Dual card click - dialog will be handled by DualCardSelection component');
        } else {
          // For non-dual cards, use with default positive modifier
          console.log('🎴 Using side card directly:', sideCard);
          const newState = game.useSideCard(currentPlayer.id, cardId, 'positive');
          setGameState(newState);
        }
      } else {
        console.log('🎴 Not human player turn, ignoring click');
      }
    } else {
      console.log('🎴 Game or gameState not available');
    }
  }, [game, gameState, gameMode, multiplayer]);

  const handleDualCardSelection = useCallback((cardId: string, modifier: 'positive' | 'negative', alternateValue?: number) => {
    console.log('🎴 handleDualCardSelection called with:', { cardId, modifier, alternateValue });

    if (gameMode === 'multiplayer' && multiplayer.state.isConnected) {
      multiplayer.sendGameAction({ type: 'useSideCard', cardId, modifier, alternateValue });
      return;
    }

    if (game && gameState) {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (currentPlayer.id !== 'ai-player') {
        const sideCard = currentPlayer.dealtSideCards.find(c => c.id === cardId);
        if (sideCard) {
          // For variable cards, we need to temporarily set the value
          if (sideCard.variant === 'variable' && alternateValue !== undefined) {
            const modifiedCard = { ...sideCard, value: alternateValue };
            // We need to update the card in the player's hand temporarily
            const cardIndex = currentPlayer.dealtSideCards.findIndex(c => c.id === cardId);
            if (cardIndex !== -1) {
              currentPlayer.dealtSideCards[cardIndex] = modifiedCard;
            }
          }

          const newState = game.useSideCard(currentPlayer.id, cardId, modifier);
          setGameState(newState);
        }
      }
    }
  }, [game, gameState, gameMode, multiplayer]);

  const handleStand = useCallback(() => {
    if (gameMode === 'multiplayer' && multiplayer.state.isConnected) {
      multiplayer.sendGameAction({ type: 'stand' });
      return;
    }

    if (game && gameState) {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (currentPlayer.id !== 'ai-player') {
        if (currentPlayer.score < 18) {
          if (!window.confirm(`Stand at ${currentPlayer.score}? You cannot draw again this round.`)) return;
        }
        const newState = game.stand(currentPlayer.id);
        setGameState(newState);
      }
    }
  }, [game, gameState, gameMode, multiplayer]);

  const handleEndTurn = useCallback(() => {
    if (gameMode === 'multiplayer' && multiplayer.state.isConnected) {
      multiplayer.sendGameAction({ type: 'endTurn' });
      return;
    }

    if (game && gameState) {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (currentPlayer.id !== 'ai-player') {
        if (currentPlayer.score >= 18) {
          setPendingEndTurnScore(currentPlayer.score);
          setEndTurnDialogOpen(true);
          return;
        }
        const newStateImmediate = game.endTurn();
        setGameState(newStateImmediate);
      }
    }
  }, [game, gameState, gameMode, multiplayer]);

  const confirmEndTurn = useCallback(() => {
    if (!game || !gameState) return;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id === 'ai-player') return;
    const newState = game.endTurn();
    setGameState(newState);
    setEndTurnDialogOpen(false);
    setPendingEndTurnScore(null);
  }, [game, gameState]);

  const handleNextRound = useCallback(() => {
    if (gameMode === 'multiplayer' && multiplayer.state.isConnected) {
      multiplayer.sendGameAction({ type: 'nextRound' });
      return;
    }

    if (game && gameState) {
      const newState = game.startNextRound();
      setGameState(newState);
    }
  }, [game, gameState, gameMode, multiplayer]);

  // Show initial singleplayer menu; allow multiplayer path even before a local game instance exists
  if (gameMode === 'menu' || (gameMode !== 'multiplayer' && !game)) {
    return (
      <div className={styles.gameContainer}>
        <div className={styles.menuContainer}>
          <Card>
            <CardHeader header={<Title3>Pazaak Game</Title3>} />
            <div className={styles.menuCardContent}>
              <Text className={styles.menuDescription}>
                Welcome to Pazaak, the classic Star Wars card game! Choose your game mode below.
              </Text>

              {/* Difficulty Selection */}
              <div className={styles.difficultySection}>
                <Text weight="semibold" size={400}>AI Difficulty</Text>
                <div className={styles.difficultyButtons}>
                  <Button
                    appearance={difficulty === 'easy' ? 'primary' : 'secondary'}
                    size="medium"
                    onClick={() => setDifficulty('easy')}
                  >
                    Easy
                  </Button>
                  <Button
                    appearance={difficulty === 'medium' ? 'primary' : 'secondary'}
                    size="medium"
                    onClick={() => setDifficulty('medium')}
                  >
                    Medium
                  </Button>
                  <Button
                    appearance={difficulty === 'hard' ? 'primary' : 'secondary'}
                    size="medium"
                    onClick={() => setDifficulty('hard')}
                  >
                    Hard
                  </Button>
                </div>
                <Text size={200} style={{ marginTop: tokens.spacingVerticalXS, color: tokens.colorNeutralForeground3 }}>
                  {difficulty === 'easy' && 'AI makes more mistakes and uses fewer side cards'}
                  {difficulty === 'medium' && 'Balanced AI with good strategic play'}
                  {difficulty === 'hard' && 'Expert AI with optimal decisions and strategic side card usage'}
                </Text>
              </div>

              <div className={styles.menuActions}>
                <Button
                  appearance="primary"
                  size="large"
                  onClick={handleStartVsAI}
                  icon={<Bot24Regular />}
                >
                  Play vs Computer
                </Button>
                <Button
                  appearance="secondary"
                  size="large"
                  onClick={handleStartMultiplayer}
                  icon={<Group24Regular />}
                >
                  Multiplayer
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Handle multiplayer mode
  if (gameMode === 'multiplayer') {
    console.log('🎮 PazaakGameLayout multiplayer mode - state check:', {
      isConnected: multiplayer.state.isConnected,
      gamePhase: multiplayer.state.gamePhase,
      connectedPlayers: multiplayer.state.connectedPlayers,
      isHost: multiplayer.state.isHost,
      hasGameState: !!multiplayer.state.gameState
    });

    // Check if we have an active multiplayer connection
    if (!multiplayer.state.isConnected) {
      console.log('❌ No multiplayer connection - redirecting to error screen');
      return (
        <div className={styles.gameContainer}>
          <div className={styles.menuContainer}>
            <Card>
              <CardHeader header={<Title3>Multiplayer Pazaak</Title3>} />
              <div className={styles.menuCardContent}>
                <Text className={styles.menuDescription}>
                  No active multiplayer connection. Please return to the main menu to create or join a game.
                </Text>
                <div className={styles.menuActions}>
                  <Button
                    appearance="primary"
                    size="large"
                    onClick={() => setGameMode('menu')}
                  >
                    Back to Menu
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    // Show waiting for game to start
    if (multiplayer.state.gamePhase === 'waiting' || multiplayer.state.gamePhase === 'menu') {
      return (
        <div className={styles.gameContainer}>
          <div className={styles.menuContainer}>
            <Card>
              <CardHeader header={<Title3>Multiplayer Pazaak</Title3>} />
              <div className={styles.menuCardContent}>
                <Text className={styles.menuDescription}>
                  Waiting for {multiplayer.state.isHost ? 'opponent' : 'host'} to start the game...
                </Text>
                <Text>
                  Room ID: {multiplayer.state.roomId}
                </Text>
                <Text>
                  Players: {multiplayer.state.connectedPlayers.length}/2
                </Text>
                {multiplayer.state.isHost && multiplayer.state.connectedPlayers.length === 2 && (
                  <div className={styles.menuActions}>
                    <Button
                      appearance="primary"
                      size="large"
                      onClick={() => multiplayer.startGame()}
                    >
                      Start Game
                    </Button>
                  </div>
                )}
                <div className={styles.menuActions}>
                  <Button
                    appearance="secondary"
                    size="large"
                    onClick={() => {
                      multiplayer.leaveRoom();
                      setGameMode('menu');
                    }}
                  >
                    Leave Game
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    // Show side deck selection if needed (support both naming styles)
    if (multiplayer.state.gamePhase === 'sideDeckSelection' || multiplayer.state.gamePhase === 'side-deck') {
      const playerHasSelected = multiplayer.state.playerSideDecks.has(multiplayer.state.playerName);
      const allSelected = multiplayer.state.connectedPlayers.length >= 2 && multiplayer.state.connectedPlayers.every(p => multiplayer.state.playerSideDecks.has(p));
      if (!playerHasSelected) {
        // For multiplayer, we need to create a mock player with side cards
        const mockPlayer = {
          id: multiplayer.state.peerId || 'player',
          name: multiplayer.state.playerName,
          hand: [],
          sideCards: [], // This will be populated by the component
          selectedSideCards: [],
          dealtSideCards: [],
          score: 0,
          sets: 0,
          isStanding: false
        };

        return (
          <div className={styles.gameContainer}>
            <div className={styles.selectionContainer}>
              <SideDeckSelection
                playerName={multiplayer.state.playerName}
                sideCards={mockPlayer.sideCards}
                onSelectionComplete={(selectedCardIds: string[]) => {
                  // Send authoritative side deck selection to host
                  multiplayer.selectSideDeck(selectedCardIds);
                }}
              />
            </div>
          </div>
        );
      }

      // Waiting for other player to select deck
      if (!allSelected) {
        return (
          <div className={styles.gameContainer}>
            <div className={styles.menuContainer}>
              <Card>
                <CardHeader header={<Title3>Waiting for Opponent</Title3>} />
                <div className={styles.menuCardContent}>
                  <Text className={styles.menuDescription}>
                    Your side deck is selected. Waiting for opponent to select their deck...
                  </Text>
                </div>
              </Card>
            </div>
          </div>
        );
      }
    }

    // If in playing phase and we have authoritative state, render board
    if (multiplayer.state.gamePhase === 'playing') {
      if (!multiplayer.state.gameState) {
        return (
          <div className={styles.gameContainer}>
            <div className={styles.menuContainer}>
              <Card>
                <CardHeader header={<Title3>Initializing Multiplayer Game</Title3>} />
                <div className={styles.menuCardContent}>
                  <Text>Waiting for host to broadcast game state...</Text>
                </div>
              </Card>
            </div>
          </div>
        );
      }
      const mState = multiplayer.state.gameState;
      if (mState.players.some(p => p.id === 'ai-player')) {
        // Fallback to singleplayer rendering below (should not happen in pure PvP)
      } else {
        const players = mState.players;
        const localPlayerIndex = multiplayer.state.connectedPlayers.indexOf(multiplayer.state.playerName);
        const localPlayer = players[localPlayerIndex] || players[0];
        const opponentPlayer = players[(localPlayerIndex === 0 ? 1 : 0)] || players[1];
        const isLocalTurn = mState.currentPlayerIndex === localPlayerIndex;
        const canDrawCard = mState.gamePhase === 'playing' && isLocalTurn && !localPlayer.isStanding && localPlayer.score < 20 && localPlayer.hand.length < 9 && !mState.turnHasDrawn;
        // Official rule: you may Stand only after you've drawn a main deck card this turn
        const canStand = mState.gamePhase === 'playing' && isLocalTurn && !localPlayer.isStanding && mState.turnHasDrawn;
        const canUseSideCard = mState.gamePhase === 'playing' && isLocalTurn && !localPlayer.isStanding && mState.turnHasDrawn && !mState.turnUsedSideCard && localPlayer.dealtSideCards.some(c => !c.isUsed) && localPlayer.hand.length < 9;
        const canEndTurn = mState.gamePhase === 'playing' && isLocalTurn && !localPlayer.isStanding && mState.turnHasDrawn;
        const mapVar = (card: { isMainDeck: boolean; variant?: string; value: number }): 'positive' | 'negative' | 'dual' | 'flip_2_4' | 'flip_3_6' | 'double' | 'tiebreaker' | 'variable' | undefined => {
          if (card.isMainDeck) return undefined;
          if (card.variant === 'side') return card.value > 0 ? 'positive' : 'negative';
          if (!card.variant) return undefined;
          type V = 'positive' | 'negative' | 'dual' | 'flip_2_4' | 'flip_3_6' | 'double' | 'tiebreaker' | 'variable';
          const guard = (v: string): v is V => (
            v === 'positive' || v === 'negative' || v === 'dual' || v === 'flip_2_4' || v === 'flip_3_6' || v === 'double' || v === 'tiebreaker' || v === 'variable'
          );
          return card.variant && guard(card.variant) ? card.variant : undefined;
        };
        return (
          <div className={styles.gameContainer}>
            <div className={styles.sessionIndicator}>
              <div className={styles.sessionInfo}>
                <Badge appearance="filled" color="success">{multiplayer.state.isHost ? 'Hosting' : 'Client'}</Badge>
                <Text size={200}>Room: {multiplayer.state.roomId}</Text>
                <Text size={200}>{multiplayer.state.connectedPlayers.length} player{multiplayer.state.connectedPlayers.length !== 1 ? 's' : ''}</Text>
              </div>
            </div>
            <div className={styles.gameBoard}>
              <div className={`${styles.playerArea} ${isLocalTurn ? styles.activePlayer : styles.inactivePlayer}`}>
                {isLocalTurn && <Badge color="brand" className={styles.turnBadge}>Your Turn</Badge>}
                <div className={styles.scoreDisplay}>
                  <div className={styles.playerName}>
                    <Person24Regular />
                    <Title3>{localPlayer.name}</Title3>
                  </div>
                  <Badge appearance="filled" color={localPlayer.score === 20 ? 'success' : localPlayer.score > 20 ? 'danger' : 'brand'} size="extra-large" className={styles.scoreBadge}>{localPlayer.score}</Badge>
                </div>
                <div>
                  <Text size={300} weight="semibold" style={{ textAlign: 'center', marginBottom: tokens.spacingVerticalXS }}>Rounds Won</Text>
                  <div className={styles.roundIndicators}>
                    {Array.from({ length: 3 }, (_, i) => <div key={i} className={`${styles.roundIndicator} ${i < localPlayer.sets ? styles.roundWon : ''}`} />)}
                  </div>
                </div>
                <div className={styles.cardSequence}>
                  {Array.from({ length: 9 }, (_, idx) => {
                    const card = localPlayer.hand[idx];
                    return (
                      <div key={idx} className={styles.gridSlot}>
                        {card ? <PazaakCardComponent value={card.value} isMainDeck={card.isMainDeck} variant={mapVar(card)} size="normal" /> : <Text size={200} className={styles.slotNumber}>{idx + 1}</Text>}
                      </div>
                    );
                  })}
                </div>
                <div>
                  <Text size={300} weight="semibold" style={{ textAlign: 'center', marginBottom: tokens.spacingVerticalS }}>Your Hand</Text>
                  <div className={styles.playerHand}>
                    {localPlayer.dealtSideCards.map((card, idx) => {
                      if (card.variant === 'dual' || card.variant === 'tiebreaker' || card.variant === 'variable') {
                        return (
                          <DualCardSelection key={idx} card={card} onSelect={(cardId, modifier, alternateValue) => multiplayer.sendGameAction({ type: 'useSideCard', cardId, modifier, alternateValue })}>
                            <PazaakCardComponent value={card.value} isMainDeck={false} variant={card.variant} disabled={!canUseSideCard || card.isUsed} isUsed={card.isUsed} />
                          </DualCardSelection>
                        );
                      }
                      return <PazaakCardComponent key={idx} value={card.value} isMainDeck={false} variant={card.variant} onClick={() => multiplayer.sendGameAction({ type: 'useSideCard', cardId: card.id })} disabled={!canUseSideCard || card.isUsed} isUsed={card.isUsed} />;
                    })}
                  </div>
                </div>
              </div>
              <div className={styles.centerArea}>
                <div className={styles.primaryActions}>
                  <Button appearance="primary" onClick={() => multiplayer.sendGameAction({ type: 'drawCard' })} disabled={!canDrawCard} title={canDrawCard ? 'Draw one main deck card' : 'You can only draw once per turn or after standing/busting'}>Draw</Button>
                  {!localPlayer.isStanding && <Button appearance="secondary" onClick={() => multiplayer.sendGameAction({ type: 'endTurn' })} disabled={!canEndTurn} title={canEndTurn ? 'End your turn without standing' : 'Must draw before you can end turn'}>End Turn</Button>}
                  <Button appearance="secondary" onClick={() => multiplayer.sendGameAction({ type: 'stand' })} disabled={!canStand} title={canStand ? 'Stand with your current total' : 'Draw first before you can stand'}>Stand</Button>
                </div>
                <div className={styles.centerInfo}>
                  <Text weight="semibold" size={400}>Round {mState.round}</Text>
                  <Text size={300}>Main Deck: {mState.mainDeck.length} cards</Text>
                  <Text size={300} weight="semibold">{mState.gamePhase === 'playing' ? `${players[mState.currentPlayerIndex].name}'s Turn` : 'Game Paused'}</Text>
                  {localPlayer.score > 20 && <Text size={300} color="red">BUSTED ({localPlayer.score})</Text>}
                  {opponentPlayer && opponentPlayer.score > 20 && <Text size={300} color="red">{opponentPlayer.name} BUSTED ({opponentPlayer.score})</Text>}
                  {mState.roundResults.length > 0 && (
                    <div className={styles.compactHistory}>
                      <RoundHistory players={players} roundResults={mState.roundResults} isCompact={true} />
                    </div>
                  )}
                </div>
                <div className={styles.secondaryActions}>
                  <Button appearance="outline" size="medium" onClick={() => multiplayer.leaveRoom()}>Leave</Button>
                </div>
              </div>
              {opponentPlayer && (
                <div className={`${styles.opponentArea} ${!isLocalTurn ? styles.activePlayer : styles.inactivePlayer}`}>
                  {!isLocalTurn && <Badge color="brand" className={styles.turnBadge}>Their Turn</Badge>}
                  <div className={styles.scoreDisplay}>
                    <div className={styles.playerName}>
                      <Group24Regular />
                      <Title3>{opponentPlayer.name}</Title3>
                    </div>
                    <Badge appearance="filled" color={opponentPlayer.score === 20 ? 'success' : opponentPlayer.score > 20 ? 'danger' : 'brand'} size="extra-large" className={styles.scoreBadge}>{opponentPlayer.score}</Badge>
                  </div>
                  <div>
                    <Text size={300} weight="semibold" style={{ textAlign: 'center', marginBottom: tokens.spacingVerticalXS }}>Rounds Won</Text>
                    <div className={styles.roundIndicators}>
                      {Array.from({ length: 3 }, (_, i) => <div key={i} className={`${styles.roundIndicator} ${i < opponentPlayer.sets ? styles.roundWon : ''}`} />)}
                    </div>
                  </div>
                  <div className={styles.cardSequence}>
                    {Array.from({ length: 9 }, (_, idx) => {
                      const card = opponentPlayer.hand[idx];
                      return (
                        <div key={idx} className={styles.gridSlot}>
                          {card ? <PazaakCardComponent value={card.value} isMainDeck={card.isMainDeck} variant={mapVar(card)} size="normal" /> : <Text size={200} className={styles.slotNumber}>{idx + 1}</Text>}
                        </div>
                      );
                    })}
                  </div>
                  <div>
                    <Text size={300} weight="semibold" style={{ textAlign: 'center', marginBottom: tokens.spacingVerticalS }}>{opponentPlayer.name}'s Hand</Text>
                    <div className={styles.opponentSideCards}>
                      {opponentPlayer.dealtSideCards.map((card, idx) => (
                        <div key={idx} className={`${styles.opponentSideCard} ${card.isUsed ? styles.usedOpponentCard : ''}`}>{card.isUsed ? <Text size={100}>✓</Text> : <Text size={200}>?</Text>}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {mState.gamePhase === 'roundEnd' && (
                <div className={styles.gameOverOverlay}>
                  <Card className={styles.gameOverCard}>
                    <Title3>Round {mState.round} Complete</Title3>
                    <Button appearance="primary" size="large" onClick={() => multiplayer.sendGameAction({ type: 'nextRound' })} className={styles.playAgainButton}>Next Round</Button>
                  </Card>
                </div>
              )}
              {mState.gamePhase === 'gameEnd' && mState.winner && (
                <div className={styles.gameOverOverlay}>
                  <Card className={styles.gameOverCard}>
                    <Title3>🎉 Game Over! 🎉</Title3>
                    <Text size={500} weight="bold" className={styles.winnerText}>{mState.winner.name} Wins!</Text>
                    <Button appearance="primary" size="large" onClick={() => multiplayer.leaveRoom()} className={styles.playAgainButton}>Exit</Button>
                  </Card>
                </div>
              )}
            </div>
          </div>
        );
      }
    }
    // If none of the above, show generic state
    return (
      <div className={styles.gameContainer}>
        <div className={styles.menuContainer}>
          <Card>
            <CardHeader header={<Title3>Multiplayer Pazaak</Title3>} />
            <div className={styles.menuCardContent}>
              <Text className={styles.menuDescription}>State: {multiplayer.state.gamePhase}</Text>
              <div className={styles.menuActions}>
                <Button appearance="primary" size="large" onClick={() => setGameMode('menu')}>Back to Menu</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!gameState) return null;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const humanPlayer = gameState.players.find(p => p.id !== 'ai-player') || gameState.players[0];
  const aiPlayer = gameState.players.find(p => p.id === 'ai-player');

  // Button logic based on game rules
  // After earlier multiplayer-specific returns, remaining UI logic is singleplayer vs AI
  const isMultiplayerMode = false;
  const isPlayerTurn = isMultiplayerMode
    ? (multiplayer.state.isHost ? gameState.currentPlayerIndex === 0 : gameState.currentPlayerIndex === 1)
    : (gameState.currentPlayerIndex === 0 ? humanPlayer.id === gameState.players[0].id : humanPlayer.id === gameState.players[gameState.currentPlayerIndex].id);

  const canDrawCard = gameState.gamePhase === 'playing' &&
    isPlayerTurn &&
    !humanPlayer.isStanding &&
    humanPlayer.score < 20 &&
    humanPlayer.hand.length < 9 &&
    !gameState.turnHasDrawn;

  const canUseSideCard = gameState.gamePhase === 'playing' &&
    isPlayerTurn &&
    !humanPlayer.isStanding &&
    gameState.turnHasDrawn &&
    !gameState.turnUsedSideCard &&
    humanPlayer.dealtSideCards.some(card => !card.isUsed) &&
    humanPlayer.hand.length < 9;

  // Official rule: Stand only after drawing this turn (turnHasDrawn)
  const canStand = gameState.gamePhase === 'playing' && isPlayerTurn && !humanPlayer.isStanding && gameState.turnHasDrawn;
  const standDisabledReason = !isPlayerTurn ? 'Not your turn' : humanPlayer.isStanding ? 'Already standing' : !gameState.turnHasDrawn ? 'Draw first this turn (you ended last turn without standing)' : '';

  const canEndTurn = gameState.gamePhase === 'playing' && isPlayerTurn && !humanPlayer.isStanding && gameState.turnHasDrawn;

  // Show side deck selection if:
  // 1. Game is in sideDeckSelection phase AND
  // 2. Human player hasn't selected their side cards yet (length !== 10) AND
  // 3. Human player doesn't have dealt side cards (not ready for main game)
  const shouldShowSideDeckSelection = (
    (gameState.gamePhase === 'sideDeckSelection' || gameState.gamePhase === 'side-deck') &&
    humanPlayer.selectedSideCards.length !== 10 &&
    humanPlayer.dealtSideCards.length === 0
  );

  // Debug logging for multiplayer troubleshooting
  console.log('🎮 PazaakGameLayout state check:', {
    gamePhase: gameState.gamePhase,
    humanPlayerSelectedCards: humanPlayer.selectedSideCards.length,
    humanPlayerDealtCards: humanPlayer.dealtSideCards.length,
    shouldShowSideDeckSelection
  });

  if (shouldShowSideDeckSelection) {
    return (
      <div className={styles.gameContainer}>
        <div className={styles.selectionContainer}>
          <SideDeckSelection
            playerName={humanPlayer.name}
            sideCards={humanPlayer.sideCards}
            onSelectionComplete={handleSideCardsSelected}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gameContainer}>
      {/* End Turn Confirmation Dialog */}
      <Dialog open={endTurnDialogOpen} onOpenChange={(_, data) => { if (!data.open) { setEndTurnDialogOpen(false); setPendingEndTurnScore(null); } }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>End Turn at {pendingEndTurnScore}</DialogTitle>
            <DialogContent>
              You'll be forced to draw at the start of your next turn (rule: must draw before standing). If you want to lock this score you must Stand now. Proceed to end turn?
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => { setEndTurnDialogOpen(false); setPendingEndTurnScore(null); }}>Cancel</Button>
              <Button appearance="primary" onClick={confirmEndTurn}>End Turn</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
      {/* Session Indicator - only show if in multiplayer mode */}
      {multiplayer.state.isConnected && (
        <div className={styles.sessionIndicator}>
          <div className={styles.sessionInfo}>
            <Badge appearance="filled" color="success">
              {multiplayer.state.isHost ? 'Hosting' : 'Client'}
            </Badge>
            <Text size={200}>Room: {multiplayer.state.roomId}</Text>
            <Text size={200}>
              {multiplayer.state.connectedPlayers.length} player{multiplayer.state.connectedPlayers.length !== 1 ? 's' : ''}
            </Text>
          </div>
        </div>
      )}

      {/* Game Board */}
      <div className={styles.gameBoard}>

        {/* Player Area - Left */}
        <div className={`${styles.playerArea} ${isPlayerTurn ? styles.activePlayer : styles.inactivePlayer} ${humanPlayer.isStanding ? styles.standingOutline : ''}`}>
          {isPlayerTurn && <Badge color="brand" className={styles.turnBadge}>Your Turn</Badge>}
          {humanPlayer.isStanding && <Badge color={humanPlayer.score>20?'danger':'success'} className={styles.statusBadge}>{humanPlayer.score>20?'Busted':'Standing'}</Badge>}
          <div className={styles.scoreDisplay}>
            <div className={styles.playerName}>
              <Person24Regular />
              <Title3>{humanPlayer.name}</Title3>
            </div>
            <Badge
              appearance="filled"
              color={humanPlayer.score === 20 ? 'success' : humanPlayer.score > 20 ? 'danger' : 'brand'}
              size="extra-large"
              className={styles.scoreBadge}
            >
              {humanPlayer.score}
            </Badge>
          </div>

          {/* Rounds Won Indicators */}
          <div>
            <Text size={300} weight="semibold" style={{ textAlign: 'center', marginBottom: tokens.spacingVerticalXS }}>
              Rounds Won
            </Text>
            <div className={styles.roundIndicators}>
              {Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className={`${styles.roundIndicator} ${index < humanPlayer.sets ? styles.roundWon : ''}`}
                />
              ))}
            </div>
          </div>

          {/* Player's Card Sequence - 3x3 Grid */}
          <div className={styles.cardSequence}>
            {Array.from({ length: 9 }, (_, index) => {
              const card = humanPlayer.hand[index];
              return (
                <div key={index} className={styles.gridSlot}>
                  {card ? (
                    <PazaakCardComponent value={card.value} isMainDeck={card.isMainDeck} variant={mapCardVariantForDisplay(card)} size="normal" />
                  ) : (
                    <Text size={200} className={styles.slotNumber}>
                      {index + 1}
                    </Text>
                  )}
                </div>
              );
            })}
          </div>

          {/* Player's Hand (Side Cards) */}
          <div>
            <Text size={300} weight="semibold" style={{ textAlign: 'center', marginBottom: tokens.spacingVerticalS }}>
              Your Hand
            </Text>
            <div className={styles.playerHand}>
              {humanPlayer.dealtSideCards && humanPlayer.dealtSideCards.length > 0 ? (humanPlayer.dealtSideCards.map((card, index) => {
                // For dual cards, wrap with dialog and remove onClick
                if (card.variant === 'dual' || card.variant === 'tiebreaker' || card.variant === 'variable') {
                  return (
                    <DualCardSelection
                      key={index}
                      card={card}
                      onSelect={handleDualCardSelection}
                    >
                      <PazaakCardComponent
                        value={card.value}
                        isMainDeck={false}
                        variant={card.variant}
                        disabled={!canUseSideCard || card.isUsed}
                        isUsed={card.isUsed}
                      // No onClick for dual cards - handled by DialogTrigger
                      />
                    </DualCardSelection>
                  );
                }

                // For regular cards, use normal onClick
                return (
                  <PazaakCardComponent
                    key={index}
                    value={card.value}
                    isMainDeck={false}
                    variant={card.variant}
                    onClick={() => handleUseSideCard(card.id)}
                    disabled={!canUseSideCard || card.isUsed}
                    isUsed={card.isUsed}
                  />
                );
              })
              ) : (
                Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className={styles.hiddenCard}>
                    <Text size={300}>?</Text>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Center Area - Game Controls */}
        <div className={styles.centerArea}>
          {/* Primary Game Controls */}
          <div className={styles.primaryActions}>
            <Button appearance="primary" onClick={handleDrawCard} disabled={!canDrawCard} title={canDrawCard ? 'Draw one main deck card' : 'Already drew this turn / cannot draw now'}>Draw</Button>
            {!humanPlayer.isStanding && <Button appearance="secondary" onClick={handleEndTurn} disabled={!canEndTurn} title={canEndTurn ? 'End your turn without standing' : 'Draw first to unlock'}>End Turn</Button>}
            <Button appearance="secondary" onClick={handleStand} disabled={!canStand} title={canStand ? 'Stand with current score' : standDisabledReason}>Stand</Button>
          </div>

          {/* Round Info */}
          <div className={styles.centerInfo}>
            <div>
              <Text weight="semibold" size={400}>Round {gameState.round}</Text>
            </div>
            <div>
              <Text size={300}>Main Deck: {gameState.mainDeck.length} cards</Text>
            </div>
            <div>
              <Text size={300} weight="semibold">
                {gameState.gamePhase === 'playing' ?
                  `${currentPlayer.name}'s Turn` :
                  'Game Paused'
                }
              </Text>
            </div>

            {/* Status Messages */}
            {humanPlayer.score > 20 && (
              <div>
                <Text size={300} color="red">
                  {humanPlayer.name} BUSTED! ({humanPlayer.score})
                </Text>
              </div>
            )}
            {aiPlayer && aiPlayer.score > 20 && (
              <div>
                <Text size={300} color="red">
                  {aiPlayer.name} BUSTED! ({aiPlayer.score})
                </Text>
              </div>
            )}

            {/* AI Feedback Section */}
            {currentPlayer.id === 'ai-player' && gameState.gamePhase === 'playing' && (
              <div className={styles.aiThinking}>
                <Text size={300} weight="semibold">
                  🤖 AI is thinking...
                </Text>
              </div>
            )}
            {gameState.aiLastAction && (
              <div className={styles.aiAction}>
                <Text size={300} weight="semibold">
                  {gameState.aiLastAction}
                </Text>
              </div>
            )}
            {!gameState.turnHasDrawn && !humanPlayer.isStanding && isPlayerTurn && (
              <Text size={200}>Must draw: you didn't stand last turn.</Text>
            )}

            {/* Compact Round History */}
            {gameState.roundResults.length > 0 && (
              <div className={styles.compactHistory}>
                <RoundHistory
                  players={gameState.players}
                  roundResults={gameState.roundResults}
                  isCompact={true}
                />
              </div>
            )}
          </div>

          <ActionLog gameState={gameState} />
          <div className={styles.secondaryActions}>
            <Button appearance="outline" size="medium" onClick={() => window.location.reload()}>Forfeit</Button>
          </div>
        </div>

        {/* Opponent Area - Right */}
        {aiPlayer && (
          <div className={`${styles.opponentArea} ${!isPlayerTurn ? styles.activePlayer : styles.inactivePlayer} ${aiPlayer.isStanding ? styles.standingOutline : ''}`}>
            {!isPlayerTurn && <Badge color="brand" className={styles.turnBadge}>Their Turn</Badge>}
            {aiPlayer.isStanding && <Badge color={aiPlayer.score>20?'danger':'success'} className={styles.statusBadge}>{aiPlayer.score>20?'Busted':'Standing'}</Badge>}
            <div className={styles.scoreDisplay}>
              <div className={styles.playerName}>
                <Bot24Regular />
                <Title3>{aiPlayer.name}</Title3>
              </div>
              <Badge
                appearance="filled"
                color={aiPlayer.score === 20 ? 'success' : aiPlayer.score > 20 ? 'danger' : 'brand'}
                size="extra-large"
                className={styles.scoreBadge}
              >
                {aiPlayer.score}
              </Badge>
            </div>

            {/* Rounds Won Indicators */}
            <div>
              <Text size={300} weight="semibold" style={{ textAlign: 'center', marginBottom: tokens.spacingVerticalXS }}>
                Rounds Won
              </Text>
              <div className={styles.roundIndicators}>
                {Array.from({ length: 3 }, (_, index) => (
                  <div
                    key={index}
                    className={`${styles.roundIndicator} ${index < aiPlayer.sets ? styles.roundWon : ''}`}
                  />
                ))}
              </div>
            </div>

            {/* Opponent's Card Sequence - 3x3 Grid */}
            <div className={styles.cardSequence}>
              {Array.from({ length: 9 }, (_, index) => {
                const card = aiPlayer.hand[index];
                return (
                  <div key={index} className={styles.gridSlot}>
                    {card ? (
                      <PazaakCardComponent value={card.value} isMainDeck={card.isMainDeck} variant={mapCardVariantForDisplay(card)} size="normal" />
                    ) : (
                      <Text size={200} className={styles.slotNumber}>
                        {index + 1}
                      </Text>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Opponent's Side Cards (Hidden/Used) */}
            <div>
              <Text size={300} weight="semibold" style={{ textAlign: 'center', marginBottom: tokens.spacingVerticalS }}>
                Computer's Hand ({aiPlayer.dealtSideCards.filter(c => !c.isUsed).length}/4 left)
              </Text>
              <div className={styles.opponentSideCards}>
                {aiPlayer.dealtSideCards && aiPlayer.dealtSideCards.length > 0 ? (
                  aiPlayer.dealtSideCards.map((card, index) => (
                    <div
                      key={index}
                      className={`${styles.opponentSideCard} ${card.isUsed ? styles.usedOpponentCard : ''}`}
                      title={card.isUsed ? `Used: ${card.description || card.variant}` : 'Unused side card'}
                    >
                      {card.isUsed ? (
                        <div className={styles.usedCardInfo}>
                          <Text size={100}>✓</Text>
                          <Text size={100}>
                            {card.variant === 'positive' ? `+${card.value}` :
                              card.variant === 'negative' ? `-${card.value}` :
                                card.variant === 'dual' ? `±${card.value}` :
                                  card.variant === 'flip_2_4' ? '2&4' :
                                    card.variant === 'flip_3_6' ? '3&6' :
                                      card.variant === 'double' ? 'D' :
                                        card.variant === 'tiebreaker' ? 'T' :
                                          card.variant === 'variable' ? 'V' : '?'}
                          </Text>
                        </div>
                      ) : (
                        <Text size={200}>?</Text>
                      )}
                    </div>
                  ))
                ) : (
                  Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className={styles.opponentSideCard}>
                      <Text size={200}>?</Text>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI Action History - Removed from UI, now logged to console */}

        {/* Round End Overlay */}
        {gameState.gamePhase === 'roundEnd' && (
          <div className={styles.gameOverOverlay}>
            <Card className={styles.gameOverCard}>
              <Title3>
                {(() => {
                  const lastResult = gameState.roundResults[gameState.roundResults.length - 1];
                  if (lastResult?.isVoid) {
                    return `🔄 Round ${gameState.round} - Void! 🔄`;
                  }
                  return `🎯 Round ${gameState.round} Complete! 🎯`;
                })()}
              </Title3>
              {gameState.roundResults.length > 0 && (
                <Text size={400} className={styles.winnerText}>
                  {(() => {
                    const lastResult = gameState.roundResults[gameState.roundResults.length - 1];
                    if (lastResult.isVoid) return 'Round was void - tied without tiebreaker! Round will be restarted.';
                    if (lastResult.isDraw) return 'Round was a draw!';
                    if (lastResult.winnerId) {
                      const winner = gameState.players.find(p => p.id === lastResult.winnerId);
                      return `${winner?.name} wins the round!`;
                    }
                    return 'Round complete!';
                  })()}
                </Text>
              )}
              <Button
                appearance="primary"
                size="large"
                onClick={handleNextRound}
                className={styles.playAgainButton}
              >
                {(() => {
                  const lastResult = gameState.roundResults[gameState.roundResults.length - 1];
                  return lastResult?.isVoid ? 'Restart Round' : 'Next Round';
                })()}
              </Button>
            </Card>
          </div>
        )}

        {/* Game End Overlay */}
        {gameState.gamePhase === 'gameEnd' && gameState.winner && (
          <div className={styles.gameOverOverlay}>
            <Card className={styles.gameOverCard}>
              <Title3>🎉 Game Over! 🎉</Title3>
              <Text size={500} weight="bold" className={styles.winnerText}>
                {gameState.winner.name} Wins!
              </Text>
              <Text size={300}>
                First to win 3 rounds wins the game!
              </Text>
              <Button
                appearance="primary"
                size="large"
                onClick={() => window.location.reload()}
                className={styles.playAgainButton}
              >
                Play Again
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PazaakGameLayout;

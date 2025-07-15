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
import RoundHistory from '../../components/RoundHistory';
import type { GameState } from './types';

const useStyles = makeStyles({
  gameContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
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
  },
  primaryActions: {
    display: 'flex',
    flexDirection: 'row',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'center',
    width: '100%',
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
    maxWidth: '240px',
    minHeight: '320px',
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
});

interface PazaakGameLayoutProps {
  initialMode?: 'singleplayer' | 'multiplayer';
}

const PazaakGameLayout: React.FC<PazaakGameLayoutProps> = ({ initialMode = 'singleplayer' }) => {
  const styles = useStyles();
  const [game, setGame] = useState<PazaakGame | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameMode, setGameMode] = useState<'menu' | 'vsAI' | 'multiplayer'>(
    initialMode === 'multiplayer' ? 'multiplayer' : 'menu'
  );
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

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
    if (game && gameState) {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (currentPlayer.id !== 'ai-player') {
        const newState = game.dealCard(currentPlayer.id);
        setGameState(newState);
      }
    }
  }, [game, gameState]);

  const handleUseSideCard = useCallback((cardId: string) => {
    console.log('🎴 handleUseSideCard called with:', cardId);
    
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
  }, [game, gameState]);

  const handleDualCardSelection = useCallback((cardId: string, modifier: 'positive' | 'negative', alternateValue?: number) => {
    console.log('🎴 handleDualCardSelection called with:', { cardId, modifier, alternateValue });
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
  }, [game, gameState]);

  const handleStand = useCallback(() => {
    if (game && gameState) {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (currentPlayer.id !== 'ai-player') {
        const newState = game.stand(currentPlayer.id);
        setGameState(newState);
      }
    }
  }, [game, gameState]);

  const handleNextRound = useCallback(() => {
    if (game && gameState) {
      const newState = game.startNextRound();
      setGameState(newState);
    }
  }, [game, gameState]);

  // Show initial menu
  if (gameMode === 'menu' || !game) {
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
    return (
      <div className={styles.gameContainer}>
        <div className={styles.menuContainer}>
          <Card>
            <CardHeader header={<Title3>Multiplayer Pazaak</Title3>} />
            <div className={styles.menuCardContent}>
              <Text className={styles.menuDescription}>
                Multiplayer mode is under development. Please use the main menu to access full multiplayer features.
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

  if (!gameState) return null;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const humanPlayer = gameState.players.find(p => p.id !== 'ai-player') || gameState.players[0];
  const aiPlayer = gameState.players.find(p => p.id === 'ai-player');

  // Button logic based on game rules
  const canDrawCard = gameState.gamePhase === 'playing' && 
                     currentPlayer.id === humanPlayer.id && 
                     !humanPlayer.isStanding && 
                     humanPlayer.score < 20 && // Can't draw if already at 20
                     humanPlayer.hand.length < 9; // Can't draw if grid is full
  
  const canStand = gameState.gamePhase === 'playing' && 
                  currentPlayer.id === humanPlayer.id && 
                  !humanPlayer.isStanding && 
                  humanPlayer.hand.length > 0; // Can only stand after drawing at least one card
  
  const canUseSideCard = gameState.gamePhase === 'playing' && 
                        currentPlayer.id === humanPlayer.id && 
                        !humanPlayer.isStanding && 
                        humanPlayer.dealtSideCards.some(card => !card.isUsed) &&
                        humanPlayer.hand.length < 9; // Can't use side card if grid is full

  // Show side deck selection if:
  // 1. Game is in sideDeckSelection phase AND
  // 2. Human player hasn't selected their side cards yet (length !== 10) AND
  // 3. Human player doesn't have dealt side cards (not ready for main game)
  const shouldShowSideDeckSelection = (
    gameState.gamePhase === 'sideDeckSelection' &&
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
      {/* Game Board */}
      <div className={styles.gameBoard}>
        
        {/* Player Area - Left */}
        <div className={styles.playerArea}>
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
                    <PazaakCardComponent
                      value={card.value}
                      isMainDeck={card.isMainDeck}
                      variant={mapCardVariantForDisplay(card)}
                      size="small"
                    />
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
              {humanPlayer.dealtSideCards && humanPlayer.dealtSideCards.length > 0 ? (                  humanPlayer.dealtSideCards.map((card, index) => {
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
            <Button
              appearance="primary"
              size="large"
              onClick={handleDrawCard}
              disabled={!canDrawCard}
            >
              Draw Card
            </Button>
            <Button
              appearance="secondary"
              size="large"
              onClick={handleStand}
              disabled={!canStand}
            >
              Stand
            </Button>
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
          
          {/* Secondary Actions */}
          <div className={styles.secondaryActions}>
            <Button
              appearance="outline"
              size="medium"
              onClick={() => window.location.reload()}
            >
              Forfeit
            </Button>
          </div>
        </div>

        {/* Opponent Area - Right */}
        {aiPlayer && (
          <div className={styles.opponentArea}>
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
                      <PazaakCardComponent
                        value={card.value}
                        isMainDeck={card.isMainDeck}
                        variant={mapCardVariantForDisplay(card)}
                        size="small"
                      />
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

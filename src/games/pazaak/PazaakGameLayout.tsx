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
} from '@fluentui/react-icons';
import { PazaakGame } from './gameLogic';
import PazaakCardComponent from '../../components/PazaakCard';
import SideDeckSelection from './SideDeckSelection';
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
    gap: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground3,
    border: `2px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingVerticalL,
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
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    justifyContent: 'center',
    minHeight: '120px',
    alignItems: 'flex-start',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorSubtleBackground,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
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
    opacity: 0.3,
    backgroundColor: tokens.colorNeutralBackground4,
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
    gap: tokens.spacingVerticalS,
  },
  aiThinking: {
    color: tokens.colorBrandForeground1,
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
});

const PazaakGameLayout: React.FC = () => {
  const styles = useStyles();
  const [game, setGame] = useState<PazaakGame | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameMode, setGameMode] = useState<'menu' | 'vsAI'>('menu');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Auto-process AI turns when it's the AI's turn
  useEffect(() => {
    if (!game || !gameState) return;
    
    if (game.isAITurn() && gameState.gamePhase === 'playing') {
      const timeoutId = setTimeout(() => {
        const aiState = game.processAITurn();
        setGameState(aiState);
      }, 1500); // Give player time to see the board state
      
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
    if (game && gameState) {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (currentPlayer.id !== 'ai-player') {
        // For now, using default positive modifier. In real game, player would choose
        const newState = game.useSideCard(currentPlayer.id, cardId, 'positive');
        setGameState(newState);
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
                >
                  Play vs Computer
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

  // If we're in side deck selection phase, show the selection component
  if (gameState.gamePhase === 'sideDeckSelection') {
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
          
          {/* Player's Card Sequence */}
          <div className={styles.cardSequence}>
            {humanPlayer.hand.length === 0 ? (
              <Text size={300} className={styles.noCardsText}>No cards played yet</Text>
            ) : (
              humanPlayer.hand.map((card, index) => (
                <PazaakCardComponent
                  key={index}
                  value={card.value}
                  isMainDeck={card.isMainDeck}
                  variant={mapCardVariantForDisplay(card)}
                />
              ))
            )}
          </div>

          {/* Player's Hand (Side Cards) */}
          <div>
            <Text size={300} weight="semibold" style={{ textAlign: 'center', marginBottom: tokens.spacingVerticalS }}>
              Your Hand
            </Text>
            <div className={styles.playerHand}>
              {humanPlayer.dealtSideCards && humanPlayer.dealtSideCards.length > 0 ? (
                humanPlayer.dealtSideCards.map((card, index) => (
                  <PazaakCardComponent
                    key={index}
                    value={card.value}
                    isMainDeck={false}
                    variant={card.variant}
                    onClick={() => handleUseSideCard(card.id)}
                    disabled={currentPlayer.id !== humanPlayer.id || gameState.gamePhase !== 'playing' || card.isUsed}
                    isUsed={card.isUsed}
                  />
                ))
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
          {/* Game Controls */}
          <div className={styles.centerActions}>
            <Button
              appearance="primary"
              size="large"
              onClick={handleDrawCard}
              disabled={currentPlayer.id !== humanPlayer.id || gameState.gamePhase !== 'playing'}
            >
              Draw Card
            </Button>
            <Button
              appearance="secondary"
              size="large"
              onClick={handleStand}
              disabled={currentPlayer.id !== humanPlayer.id || gameState.gamePhase !== 'playing'}
            >
              Stand
            </Button>
            <Button
              appearance="outline"
              size="large"
              onClick={() => window.location.reload()}
            >
              Forfeit Game
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
            {currentPlayer.id === 'ai-player' && gameState.gamePhase === 'playing' && (
              <div>
                <Text size={200} className={styles.aiThinking}>
                  AI is thinking...
                </Text>
              </div>
            )}
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
            
            {/* Opponent's Card Sequence */}
            <div className={styles.cardSequence}>
              {aiPlayer.hand.length === 0 ? (
                <Text size={300} className={styles.noCardsText}>No cards played yet</Text>
              ) : (
                aiPlayer.hand.map((card, index) => (
                  <PazaakCardComponent
                    key={index}
                    value={card.value}
                    isMainDeck={card.isMainDeck}
                    variant={mapCardVariantForDisplay(card)}
                  />
                ))
              )}
            </div>

            {/* Opponent's Side Cards (Hidden/Used) */}
            <div>
              <Text size={300} weight="semibold" style={{ textAlign: 'center', marginBottom: tokens.spacingVerticalS }}>
                Computer's Hand
              </Text>
              <div className={styles.opponentSideCards}>
                {aiPlayer.dealtSideCards && aiPlayer.dealtSideCards.length > 0 ? (
                  aiPlayer.dealtSideCards.map((card, index) => (
                    <div 
                      key={index} 
                      className={`${styles.opponentSideCard} ${card.isUsed ? styles.usedOpponentCard : ''}`}
                    >
                      <Text size={200}>{card.isUsed ? '✓' : '?'}</Text>
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

        {/* Game End Overlay */}
        {gameState.gamePhase === 'gameEnd' && gameState.winner && (
          <div className={styles.gameOverOverlay}>
            <Card className={styles.gameOverCard}>
              <Title3>🎉 Game Over! 🎉</Title3>
              <Text size={500} weight="bold" className={styles.winnerText}>
                {gameState.winner.name} Wins!
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

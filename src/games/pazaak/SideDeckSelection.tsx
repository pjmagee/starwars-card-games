import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  Text,
  Button,
  Badge,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  CheckmarkCircle24Filled,
} from '@fluentui/react-icons';
import PazaakCardComponent from '../../components/PazaakCard';
import type { SideCard } from './types';
import { soundEffects } from '../../utils/soundEffects';

interface SideDeckSelectionProps {
  playerName: string;
  sideCards: SideCard[];
  onSelectionComplete: (selectedCardIds: string[]) => void;
}

const useStyles = makeStyles({
  content: {
    flex: 1,
    display: 'flex',
    gap: tokens.spacingHorizontalS, // Reduced gap between sections
    padding: tokens.spacingVerticalM,
    overflow: 'hidden',
    minHeight: 0,
    height: 'calc(100vh - 120px)',
  },
  availableSection: {
    flex: 1.2, // Reduced from 2 to balance more equally (60/40 split)
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    minHeight: 0,
    minWidth: 0,
    height: '100%',
  },
  cardGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusLarge,
    border: `2px solid ${tokens.colorNeutralStroke1}`,
    overflow: 'auto',
    flex: 1,
    minHeight: 0,
    height: '100%',
    scrollbarWidth: 'thin',
  },
  cardWrapper: {
    position: 'relative',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    ':hover': {
      transform: 'translateY(-4px)',
    },
  },
  cardWrapperSelected: {
    position: 'relative',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    transform: 'translateY(-4px) scale(1.05)',
    filter: 'brightness(1.2) drop-shadow(0 0 8px rgba(0, 200, 0, 0.6))',
    border: '3px solid #00ff00',
    borderRadius: '8px',
    ':hover': {
      transform: 'translateY(-6px) scale(1.08)',
    },
  },
  cardWrapperDisabled: {
    position: 'relative',
    cursor: 'not-allowed',
    opacity: 0.5,
  },
  selectionBadge: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    zIndex: 10,
    pointerEvents: 'none',
    transform: 'scale(1.2)',
  },
  selectedSection: {
    flex: 1, // Balanced with availableSection for better 60/40 split
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    minHeight: 0,
    minWidth: '450px', // Increased minimum width for better balance
    maxWidth: 'none', // Removed max width constraint
    height: '100%',
  },
  selectedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorBrandBackground2,
    borderRadius: tokens.borderRadiusLarge,
    border: `2px solid ${tokens.colorBrandStroke1}`,
    minHeight: '220px',
    overflow: 'visible',
    justifyItems: 'center',
    alignItems: 'center',
  },
  confirmSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flexShrink: 0,
  },
  emptySlot: {
    width: '95px', // Increased from 80px
    height: '125px', // Increased from 110px
    border: `2px dashed ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  emptySlotText: {
    color: tokens.colorNeutralForeground3,
    fontSize: '0.6rem',
    textAlign: 'center',
    fontWeight: '500',
  },
  progressText: {
    textAlign: 'center',
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
  },
  cardGroupContainer: {
    marginBottom: tokens.spacingVerticalS,
  },
  cardGroupTitle: {
    marginBottom: tokens.spacingVerticalXS,
    display: 'block',
  },
  cardGroupDescription: {
    marginBottom: tokens.spacingVerticalXS,
    display: 'block',
    color: tokens.colorNeutralForeground3,
  },
  cardGroupGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(85px, max-content))', // Increased from 70px
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
    width: '100%',
    justifyContent: 'start',
  },
});

const SideDeckSelection: React.FC<SideDeckSelectionProps> = ({
  playerName,
  sideCards,
  onSelectionComplete
}) => {
  const styles = useStyles();
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  const handleCardClick = (cardId: string) => {
    if (selectedCards.includes(cardId)) {
      setSelectedCards(prev => prev.filter(id => id !== cardId));
    } else if (selectedCards.length < 10) {
      setSelectedCards(prev => [...prev, cardId]);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedCards.length === 10) {
      // Play shuffle sound effect when transitioning to game
      soundEffects.playShuffle();
      onSelectionComplete(selectedCards);
    }
  };

  const getCardVariant = (sideCard: SideCard): 'positive' | 'negative' | 'dual' | 'flip_2_4' | 'flip_3_6' | 'double' | 'tiebreaker' | 'variable' => {
    return sideCard.variant;
  };

  const isCardSelected = (cardId: string) => selectedCards.includes(cardId);
  const isCardDisabled = (cardId: string) => !isCardSelected(cardId) && selectedCards.length >= 10;

  // Group cards by type for better organization (following official rules)
  const groupedCards = {
    positive: sideCards.filter(card => card.variant === 'positive'),
    negative: sideCards.filter(card => card.variant === 'negative'),
    dual: sideCards.filter(card => card.variant === 'dual'),
    flip: sideCards.filter(card => ['flip_2_4', 'flip_3_6'].includes(card.variant)),
    special: sideCards.filter(card => ['double', 'tiebreaker', 'variable'].includes(card.variant))
  };

  const renderCardGroup = (title: string, cards: SideCard[], description: string) => {
    if (cards.length === 0) return null;
    
    return (
      <div className={styles.cardGroupContainer}>
        <Text size={400} weight="semibold" className={styles.cardGroupTitle}>
          {title} ({cards.length} cards)
        </Text>
        <Text size={200} className={styles.cardGroupDescription}>
          {description}
        </Text>
        <div className={styles.cardGroupGrid}>
          {cards.map(sideCard => (
            <div 
              key={sideCard.id} 
              className={
                isCardSelected(sideCard.id) ? styles.cardWrapperSelected : 
                isCardDisabled(sideCard.id) ? styles.cardWrapperDisabled : 
                styles.cardWrapper
              }
              onClick={() => !isCardDisabled(sideCard.id) && handleCardClick(sideCard.id)}
            >
              <PazaakCardComponent
                value={sideCard.value}
                isMainDeck={false}
                variant={getCardVariant(sideCard)}
                disabled={isCardDisabled(sideCard.id)}
                size="small" // Increased from "tiny" to "small"
              />
              {isCardSelected(sideCard.id) && (
                <div className={styles.selectionBadge}>
                  <Badge 
                    appearance="filled" 
                    color="success"
                    icon={<CheckmarkCircle24Filled />}
                    size="small"
                  >
                    ✓
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.content}>
      {/* Available Cards Section */}
      <div className={styles.availableSection}>
        <Card>
          <CardHeader
            header={
              <div>
                <Text size={500} weight="semibold">{playerName} - Select 10 Side Cards</Text>
                <Badge 
                  appearance="filled" 
                  color={selectedCards.length === 10 ? 'success' : 'brand'}
                >
                  Selected: {selectedCards.length}/10
                </Badge>
              </div>
            }
          />
          
          <div className={styles.cardGrid}>
            {renderCardGroup(
              "Blue Plus Cards", 
              groupedCards.positive, 
              "Add points to your total (+1 to +6) — 12 cards in your deck"
            )}
            {renderCardGroup(
              "Red Minus Cards", 
              groupedCards.negative, 
              "Subtract points from your total (-1 to -6) — 12 cards in your deck"
            )}
            {renderCardGroup(
              "Red/Blue Dual Cards", 
              groupedCards.dual, 
              "Choose positive or negative when played (±1 to ±6) — 12 cards in your deck"
            )}
            {renderCardGroup(
              "Yellow Flip Cards", 
              groupedCards.flip, 
              "Turn target numbers positive/negative (2&4 or 3&6) — 4 cards in your deck"
            )}
            {renderCardGroup(
              "Yellow Special Cards", 
              groupedCards.special, 
              "Double, Tiebreaker, and Variable effects — 3 cards in your deck"
            )}
          </div>
        </Card>
      </div>

      {/* Selected Cards Section */}
      <div className={styles.selectedSection}>
        <Card>
          <CardHeader
            header={
              <Text size={400} weight="semibold">
                Selected Side Deck ({selectedCards.length}/10)
              </Text>
            }
          />
          
          <div className={styles.selectedGrid}>
            {Array.from({ length: 10 }, (_, index) => {
              const cardId = selectedCards[index];
              const card = cardId ? sideCards.find(sc => sc.id === cardId) : null;
              
              return (
                <div key={index}>
                  {card ? (
                    <PazaakCardComponent
                      value={card.value}
                      isMainDeck={false}
                      variant={getCardVariant(card)}
                      size="normal" // Increased from "small" to "normal"
                    />
                  ) : (
                    <div className={styles.emptySlot}>
                      <Text size={200} className={styles.emptySlotText}>
                        Empty Slot
                      </Text>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Confirm Selection */}
        <div className={styles.confirmSection}>
          <Text className={styles.progressText}>
            {selectedCards.length === 10 
              ? "Ready to start the game!" 
              : `Select ${10 - selectedCards.length} more card${10 - selectedCards.length !== 1 ? 's' : ''}`
            }
          </Text>
          <Button
            appearance="primary"
            size="large"
            onClick={handleConfirmSelection}
            disabled={selectedCards.length !== 10}
          >
            {selectedCards.length === 10 ? "Confirm Selection" : `Confirm Selection (${selectedCards.length}/10)`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SideDeckSelection;

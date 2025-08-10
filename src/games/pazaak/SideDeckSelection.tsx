import React, { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  Text,
  Button,
  Badge,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
// Icon imports no longer needed after grouped selection redesign
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
  overflowWrap: 'anywhere',
  whiteSpace: 'normal',
  lineHeight: '1.25',
  },
  cardGroupDescription: {
  marginBottom: tokens.spacingVerticalXS,
  display: 'block',
  color: tokens.colorNeutralForeground3,
  overflowWrap: 'anywhere',
  whiteSpace: 'normal',
  lineHeight: '1.2',
  fontSize: tokens.fontSizeBase200,
  },
  cardGroupGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
    width: '100%',
    justifyContent: 'start',
  },
  constraintsBar: {
    display: 'flex',
    gap: tokens.spacingHorizontalL,
    alignItems: 'center',
    flexWrap: 'wrap',
    padding: `${tokens.spacingVerticalXS} 0`,
  },
  capBadge: {
    fontWeight: 600,
  },
  groupCardWrapper: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalXS,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  groupControls: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBadge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    pointerEvents: 'none',
  },
});

const SideDeckSelection: React.FC<SideDeckSelectionProps> = ({
  playerName,
  sideCards,
  onSelectionComplete
}) => {
  const styles = useStyles();
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  // Balance tweak: Dual (±) cards are strong because they compress decision space.
  // Limiting to 2 aligns closer to traditional Pazaak community rules (often 2 copies per specific card)
  // and curbs variance spikes from over-flexible decks.
  const MAX_DUAL_CARDS = 2; // Reduced cap for balance

  // Helper to count how many dual cards currently selected
  const countSelectedByVariant = (variant: string) => {
    return selectedCards.reduce((acc, id) => {
      const card = sideCards.find(sc => sc.id === id);
      return acc + (card && card.variant === variant ? 1 : 0);
    }, 0);
  };
  const selectedDualCount = countSelectedByVariant('dual');


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


  // Pre-group duplicates: key by variant+value (and variant subtype)
  interface CardGroup { key: string; sample: SideCard; cards: SideCard[]; selectedCount: number; remaining: number; }
  const allGroups = useMemo(() => {
    const map = new Map<string, { sample: SideCard; cards: SideCard[] }>();
    sideCards.forEach(c => {
      const key = `${c.variant}:${c.value}${c.variant.startsWith('flip') ? ':' + (c.flipTargets?.join('-') || '') : ''}`;
      if (!map.has(key)) map.set(key, { sample: c, cards: [] });
      map.get(key)!.cards.push(c);
    });
    const groups: CardGroup[] = [];
    map.forEach((v, k) => {
      const selectedCount = v.cards.filter(c => selectedCards.includes(c.id)).length;
      groups.push({ key: k, sample: v.sample, cards: v.cards, selectedCount, remaining: v.cards.length - selectedCount });
    });
    return groups;
  }, [sideCards, selectedCards]);

  const groupedCards = useMemo(() => ({
    positive: allGroups.filter(g => g.sample.variant === 'positive'),
    negative: allGroups.filter(g => g.sample.variant === 'negative'),
    dual: allGroups.filter(g => g.sample.variant === 'dual'),
    flip: allGroups.filter(g => ['flip_2_4', 'flip_3_6'].includes(g.sample.variant)),
    special: allGroups.filter(g => ['double', 'tiebreaker', 'variable'].includes(g.sample.variant))
  }), [allGroups]);

  const dualCapReached = selectedDualCount >= MAX_DUAL_CARDS;

  const addFromGroup = (group: CardGroup) => {
    if (selectedCards.length >= 10) return;
    if (group.sample.variant === 'dual' && selectedDualCount >= MAX_DUAL_CARDS) return;
    const availableCard = group.cards.find(c => !selectedCards.includes(c.id));
    if (availableCard) setSelectedCards(prev => [...prev, availableCard.id]);
  };
  const removeFromGroup = (group: CardGroup) => {
    const selectedInGroup = group.cards.filter(c => selectedCards.includes(c.id));
    if (selectedInGroup.length === 0) return;
    // remove last selected of this group for intuitive undo
    const removeId = selectedInGroup[selectedInGroup.length - 1].id;
    setSelectedCards(prev => prev.filter(id => id !== removeId));
  };

  const renderCardGroup = (title: string, groups: CardGroup[], description: string) => {
    if (groups.length === 0) return null;
    const totalCards = groups.reduce((acc, g) => acc + g.cards.length, 0);
    return (
      <div className={styles.cardGroupContainer}>
        <Text size={400} weight="semibold" className={styles.cardGroupTitle}>
          {title} ({totalCards} cards)
        </Text>
        <Text size={200} className={styles.cardGroupDescription}>{description}</Text>
        <div className={styles.cardGroupGrid}>
          {groups.map(group => {
            const g = group; // alias
            const full = g.selectedCount === g.cards.length;
            const addDisabled = full || selectedCards.length >= 10 || (g.sample.variant === 'dual' && selectedDualCount >= MAX_DUAL_CARDS);
            const removeDisabled = g.selectedCount === 0;
            return (
              <div key={g.key} className={styles.groupCardWrapper}>
                <div>
                  <PazaakCardComponent
                    value={g.sample.value}
                    isMainDeck={false}
                    variant={getCardVariant(g.sample)}
                    size="small"
                    disabled={addDisabled}
                  />
                  <Badge appearance={g.selectedCount>0? 'filled':'outline'} color={full? 'success':'brand'} className={styles.counterBadge} size="small">
                    {g.selectedCount}/{g.cards.length}
                  </Badge>
                </div>
                <div className={styles.groupControls}>
                  <Button size="small" appearance="secondary" onClick={() => removeFromGroup(g)} disabled={removeDisabled}>-</Button>
                  <Button size="small" appearance="primary" onClick={() => addFromGroup(g)} disabled={addDisabled}>+</Button>
                </div>
              </div>
            );
          })}
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
                <div className={styles.constraintsBar}>
                  <Badge 
                    appearance="filled" 
                    color={selectedCards.length === 10 ? 'success' : 'brand'}
                  >
                    Selected: {selectedCards.length}/10
                  </Badge>
                  <Badge appearance="filled" color={dualCapReached ? 'danger' : 'brand'} className={styles.capBadge}>
                    Dual (±) Cards: {selectedDualCount}/{MAX_DUAL_CARDS} {dualCapReached ? '(Cap Reached)' : ''}
                  </Badge>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Dual cards are flexible (+ or -). Cap limits deck volatility.
                  </Text>
                </div>
              </div>
            }
          />
          
          <div className={styles.cardGrid}>
            {renderCardGroup(
              "Blue Plus Cards",
              groupedCards.positive,
              "Add points to your total (+1 to +6). Select duplicates via + button."
            )}
            {renderCardGroup(
              "Red Minus Cards",
              groupedCards.negative,
              "Subtract points (-1 to -6). Select duplicates via + button."
            )}
            {renderCardGroup(
              "Red/Blue Dual Cards",
              groupedCards.dual,
              `Choose + or - when played (±1 to ±6). Cap: ${selectedDualCount}/${MAX_DUAL_CARDS}.`
            )}
            {renderCardGroup(
              "Yellow Flip Cards",
              groupedCards.flip,
              "Flip 2&4 or 3&6 values. Only one per card instance."
            )}
            {renderCardGroup(
              "Yellow Special Cards",
              groupedCards.special,
              "Double last card, Tiebreaker wins ties, Variable ± values."
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
          <Text size={200} style={{ textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
            After you confirm, 4 random cards from your 10-card side deck are dealt to your hand. The other 6 are not used again in this match (current implementation). You will NOT start the game holding all 10.
          </Text>
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

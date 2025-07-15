import React, { useState } from 'react';
import {
  Button,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import type { SideCard } from '../games/pazaak/types';

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  cardDisplay: {
    textAlign: 'center',
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  triggerButton: {
    padding: '0',
    border: 'none',
    background: 'transparent',
    minWidth: 'auto',
    minHeight: 'auto',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalXL,
    maxWidth: '400px',
    width: '90%',
    boxShadow: tokens.shadow64,
  },
  modalHeader: {
    marginBottom: tokens.spacingVerticalL,
  },
  modalBody: {
    marginBottom: tokens.spacingVerticalL,
  },
  modalActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    justifyContent: 'flex-end',
  },
});

interface DualCardSelectionProps {
  card: SideCard;
  onSelect: (cardId: string, modifier: 'positive' | 'negative', alternateValue?: number) => void;
  children: React.ReactElement; // The trigger button (the card itself)
}

const DualCardSelection: React.FC<DualCardSelectionProps> = ({
  card,
  children,
  onSelect,
}) => {
  const styles = useStyles();
  const [isOpen, setIsOpen] = useState(false);

  console.log('🎴 DualCardSelection render:', { 
    cardVariant: card?.variant,
    cardValue: card?.value,
    cardId: card?.id
  });

  // Test if the component is even being called
  React.useEffect(() => {
    console.log('🎴 DualCardSelection mounted for card:', card.id);
  }, [card.id]);

  const handlePositiveClick = () => {
    console.log('🎴 Positive button clicked');
    onSelect(card.id, 'positive');
    setIsOpen(false);
  };

  const handleNegativeClick = () => {
    console.log('🎴 Negative button clicked');
    onSelect(card.id, 'negative');
    setIsOpen(false);
  };

  const handleVariableClick = (value: number, modifier: 'positive' | 'negative') => {
    console.log('🎴 Variable button clicked:', { value, modifier });
    onSelect(card.id, modifier, value);
    setIsOpen(false);
  };

  const getTitle = () => {
    switch (card.variant) {
      case 'dual':
        return 'Dual Card Selection';
      case 'tiebreaker':
        return 'Tiebreaker Card';
      case 'variable':
        return 'Variable Card Selection';
      default:
        return 'Card Selection';
    }
  };

  const getDescription = () => {
    switch (card.variant) {
      case 'dual':
        return `This card can be used as either +${card.value} or -${card.value}. Choose how you want to use it.`;
      case 'tiebreaker':
        return 'This tiebreaker card can be used as +1 or -1 and wins tied rounds.';
      case 'variable':
        return `This variable card can be used as different values. Choose the value and whether to add or subtract it.`;
      default:
        return 'Choose how to use this card.';
    }
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
      
      {isOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <Text size={500} weight="semibold">
                {getTitle()}
              </Text>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.cardDisplay}>
                <Text size={500} weight="bold">
                  {card.variant === 'dual' ? `±${card.value}` : 
                   card.variant === 'tiebreaker' ? '±1' :
                   card.variant === 'variable' ? 'Variable' : 
                   `${card.value}`}
                </Text>
              </div>
              <Text>
                {getDescription()}
              </Text>
            </div>
            
            <div className={styles.modalActions}>
              {card.variant === 'variable' && card.alternateValue !== undefined ? (
                <>
                  <Button
                    appearance="primary"
                    onClick={() => handleVariableClick(card.value, 'positive')}
                  >
                    +{card.value}
                  </Button>
                  <Button
                    appearance="primary"
                    onClick={() => handleVariableClick(card.value, 'negative')}
                  >
                    -{card.value}
                  </Button>
                  <Button 
                    appearance="secondary"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    appearance="primary"
                    onClick={handlePositiveClick}
                  >
                    +{card.variant === 'tiebreaker' ? 1 : card.value}
                  </Button>
                  <Button
                    appearance="primary"
                    onClick={handleNegativeClick}
                  >
                    -{card.variant === 'tiebreaker' ? 1 : card.value}
                  </Button>
                  <Button 
                    appearance="secondary"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DualCardSelection;

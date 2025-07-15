import React from 'react';
import {
  Text,
  makeStyles,
} from '@fluentui/react-components';

export interface PazaakCardProps {
  value: number;
  isMainDeck: boolean;
  isUsed?: boolean;
  variant?: 'positive' | 'negative' | 'dual' | 'flip_2_4' | 'flip_3_6' | 'double' | 'tiebreaker' | 'variable';
  onClick?: () => void;
  disabled?: boolean;
  alternateValue?: number; // For variable cards
  flipTargets?: number[]; // For flip cards
  size?: 'normal' | 'small' | 'tiny'; // For different card sizes
}

const useStyles = makeStyles({
  card: {
    width: '120px',
    height: '160px',
    borderRadius: '12px',
    border: '3px solid',
    background: 'linear-gradient(145deg, #f0f0f0, #e0e0e0)',
    boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    userSelect: 'none',
    fontFamily: '"Orbitron", "Consolas", monospace',
    ':hover': {
      transform: 'translateY(-4px) scale(1.05)',
      boxShadow: '6px 6px 12px rgba(0, 0, 0, 0.3), inset 1px 1px 2px rgba(255, 255, 255, 0.8)',
    },
    ':active': {
      transform: 'translateY(-2px) scale(1.02)',
    },
  },
  cardSmall: {
    width: '80px',
    height: '110px',
    borderRadius: '8px',
    border: '2px solid',
    background: 'linear-gradient(145deg, #f0f0f0, #e0e0e0)',
    boxShadow: '3px 3px 6px rgba(0, 0, 0, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    userSelect: 'none',
    fontFamily: '"Orbitron", "Consolas", monospace',
    fontSize: '0.8em',
    ':hover': {
      transform: 'translateY(-2px) scale(1.03)',
      boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.3), inset 1px 1px 2px rgba(255, 255, 255, 0.8)',
    },
    ':active': {
      transform: 'translateY(-1px) scale(1.01)',
    },
  },
  cardTiny: {
    width: '70px',
    height: '90px',
    borderRadius: '6px',
    border: '1px solid',
    background: 'linear-gradient(145deg, #f0f0f0, #e0e0e0)',
    boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    userSelect: 'none',
    fontFamily: '"Orbitron", "Consolas", monospace',
    fontSize: '0.7em',
    ':hover': {
      transform: 'translateY(-1px) scale(1.02)',
      boxShadow: '3px 3px 6px rgba(0, 0, 0, 0.3), inset 1px 1px 2px rgba(255, 255, 255, 0.8)',
    },
    ':active': {
      transform: 'translateY(0px) scale(1.01)',
    },
  },
  mainDeckCard: {
    border: '3px solid #2e7d32',
    background: 'linear-gradient(145deg, #e8f5e8, #c8e6c8)',
    color: '#1b5e20',
  },
  positiveCard: {
    border: '3px solid #1976d2',
    background: 'linear-gradient(145deg, #e3f2fd, #bbdefb)',
    color: '#0d47a1',
  },
  negativeCard: {
    border: '3px solid #d32f2f',
    background: 'linear-gradient(145deg, #ffebee, #ffcdd2)',
    color: '#b71c1c',
  },
  dualCard: {
    border: '3px solid #7b1fa2',
    background: 'linear-gradient(145deg, #f3e5f5, #e1bee7)',
    color: '#4a148c',
  },
  variableCard: {
    border: '3px solid #f57c00',
    background: 'linear-gradient(145deg, #fff3e0, #ffe0b2)',
    color: '#e65100',
  },
  flipCard: {
    border: '3px solid #00796b',
    background: 'linear-gradient(145deg, #e0f7fa, #b2ebf2)',
    color: '#004d40',
  },
  doubleCard: {
    border: '3px solid #6a1b9a',
    background: 'linear-gradient(145deg, #f8e5ff, #e1bee7)',
    color: '#4a148c',
  },
  tiebreakerCard: {
    border: '3px solid #388e3c',
    background: 'linear-gradient(145deg, #e8f5e8, #c8e6c8)',
    color: '#1b5e20',
  },
  disabledCard: {
    opacity: 0.4,
    cursor: 'not-allowed',
    ':hover': {
      transform: 'none',
      boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 0.8)',
    },
  },
  usedCard: {
    opacity: 0.3,
    filter: 'grayscale(0.8)',
    cursor: 'default',
    ':hover': {
      transform: 'none',
      boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 0.8)',
    },
  },
  cardValue: {
    fontSize: '32px',
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: '1',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
    marginBottom: '8px',
  },
  cardValueSmall: {
    fontSize: '20px',
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: '1.1',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
    marginBottom: '4px',
  },
  cardLabel: {
    position: 'absolute',
    top: '4px',
    left: '4px',
    fontSize: '8px',
    fontWeight: '600',
    padding: '2px 4px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  cardDescription: {
    position: 'absolute',
    bottom: '4px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '7px',
    textAlign: 'center',
    width: '90%',
    lineHeight: '1',
    opacity: 0.8,
  },
  cornerValue: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    fontSize: '12px',
    fontWeight: '600',
    opacity: 0.7,
  },
});

const PazaakCardComponent = React.forwardRef<HTMLDivElement, PazaakCardProps>(({ 
  value, 
  isMainDeck, 
  isUsed = false,
  variant = 'positive',
  onClick,
  disabled = false,
  alternateValue,
  flipTargets, // For future flip card implementations
  size = 'normal'
}, ref) => {
  const styles = useStyles();

  const getDisplayValue = () => {
    if (isMainDeck) {
      return `${value}`;
    }

    switch (variant) {
      case 'positive':
        return `+${Math.abs(value)}`;
      case 'negative':
        return `-${Math.abs(value)}`;
      case 'dual':
        return `±${Math.abs(value)}`;
      case 'variable':
        return alternateValue ? `±${Math.abs(value)}/${Math.abs(alternateValue)}` : `±${Math.abs(value)}`;
      case 'flip_2_4':
        return flipTargets ? `${flipTargets.join('&')}\nFLIP` : '2&4\nFLIP';
      case 'flip_3_6':
        return flipTargets ? `${flipTargets.join('&')}\nFLIP` : '3&6\nFLIP';
      case 'double':
        return 'x2\nDOUBLE';
      case 'tiebreaker':
        return '±1\nTIE';
      default:
        return `${value}`;
    }
  };

  const getCardStyles = () => {
    let baseCardStyle = styles.card;
    if (size === 'small') {
      baseCardStyle = styles.cardSmall;
    } else if (size === 'tiny') {
      baseCardStyle = styles.cardTiny;
    }
    
    const cardStyles = [baseCardStyle];
    
    if (isMainDeck) {
      cardStyles.push(styles.mainDeckCard);
    } else {
      switch (variant) {
        case 'positive':
          cardStyles.push(styles.positiveCard);
          break;
        case 'negative':
          cardStyles.push(styles.negativeCard);
          break;
        case 'dual':
          cardStyles.push(styles.dualCard);
          break;
        case 'variable':
          cardStyles.push(styles.variableCard);
          break;
        case 'flip_2_4':
        case 'flip_3_6':
          cardStyles.push(styles.flipCard);
          break;
        case 'double':
          cardStyles.push(styles.doubleCard);
          break;
        case 'tiebreaker':
          cardStyles.push(styles.tiebreakerCard);
          break;
      }
    }

    if (disabled) cardStyles.push(styles.disabledCard);
    if (isUsed) cardStyles.push(styles.usedCard);

    return cardStyles.join(' ');
  };

  const getCardLabel = () => {
    if (isMainDeck) return 'MAIN';
    
    switch (variant) {
      case 'positive':
        return 'PLUS';
      case 'negative':
        return 'MINUS';
      case 'dual':
        return 'DUAL';
      case 'variable':
        return 'VAR';
      case 'flip_2_4':
      case 'flip_3_6':
        return 'FLIP';
      case 'double':
        return 'DBL';
      case 'tiebreaker':
        return 'TIE';
      default:
        return 'SIDE';
    }
  };

  const getCardDescription = () => {
    switch (variant) {
      case 'flip_2_4':
        return 'Converts all 2s and 4s to opposite values';
      case 'flip_3_6':
        return 'Converts all 3s and 6s to opposite values';
      case 'double':
        return 'Doubles the last main deck card';
      case 'tiebreaker':
        return 'Wins tied rounds when played';
      case 'variable':
        return `Can be ±${Math.abs(value)} or ±${alternateValue || 2}`;
      default:
        return undefined;
    }
  };

  const handleClick = () => {
    if (onClick && !disabled && !isUsed) {
      onClick();
    }
  };

  const isMultiLine = getDisplayValue().includes('\n');

  return (
    <div 
      ref={ref}
      className={getCardStyles()}
      onClick={handleClick}
    >
      {/* Corner Label */}
      <div className={styles.cardLabel}>
        <Text size={100} weight="semibold">
          {getCardLabel()}
        </Text>
      </div>

      {/* Corner Value (for side cards) */}
      {!isMainDeck && (
        <div className={styles.cornerValue}>
          <Text size={200} weight="semibold">
            {Math.abs(value)}
          </Text>
        </div>
      )}

      {/* Main Value */}
      <div className={isMultiLine ? styles.cardValueSmall : styles.cardValue}>
        <Text 
          size={isMainDeck ? 900 : (isMultiLine ? 500 : 800)} 
          weight="bold"
          style={{ whiteSpace: 'pre-line', textAlign: 'center' }}
        >
          {getDisplayValue()}
        </Text>
      </div>

      {/* Description (for special cards) */}
      {getCardDescription() && (
        <div className={styles.cardDescription}>
          <Text size={100}>
            {getCardDescription()}
          </Text>
        </div>
      )}
    </div>
  );
});

export default PazaakCardComponent;

import React from 'react';
import { makeStyles, tokens, Title1, Text, Button, Body1 } from '@fluentui/react-components';

interface PazaakRulesProps {
  onBack: () => void;
  onPlayAI: () => void;
  onPlayPvP: () => void;
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: tokens.spacingVerticalXL,
    gap: tokens.spacingVerticalL,
    overflowY: 'auto',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  list: {
    marginTop: 0,
    marginBottom: tokens.spacingVerticalM,
  },
});

const PazaakRules: React.FC<PazaakRulesProps> = ({ onBack, onPlayAI, onPlayPvP }) => {
  const styles = useStyles();
  return (
    <div className={styles.container}>
      <div className={styles.actions}>
        <Button onClick={onBack}>Back</Button>
        <Button appearance="primary" onClick={onPlayAI}>Play vs AI</Button>
        <Button appearance="secondary" onClick={onPlayPvP}>Multiplayer</Button>
      </div>
      <div className={styles.section}>
        <Title1>Pazaak Rules</Title1>
        <Body1>Pazaak is a strategic number card game. Reach a total as close to 20 as possible without going over. Win 3 rounds to claim victory.</Body1>
      </div>
      <div className={styles.section}>
        <Text weight="semibold">Objective</Text>
        <Text size={200}>Accumulate a total ≤ 20 that is higher than your opponent's. Going over 20 is a bust.</Text>
      </div>
      <div className={styles.section}>
        <Text weight="semibold">Round Flow</Text>
        <ol className={styles.list}>
          <li><Text size={200}>Start of your turn: draw exactly one main deck card (unless Standing or already busted).</Text></li>
          <li><Text size={200}>Optional: play ONE side card from your side deck (after drawing).</Text></li>
          <li><Text size={200}>Choose: Stand to lock your total, or End Turn to continue next round of turns.</Text></li>
        </ol>
        <Text size={200}>When both players have stood, or one busts, the round resolves.</Text>
      </div>
      <div className={styles.section}>
        <Text weight="semibold">Side Card Types</Text>
        <ul className={styles.list}>
          <li><Text size={200}>Plus (+X): Add X to your total.</Text></li>
          <li><Text size={200}>Minus (-X): Subtract X from your total.</Text></li>
          <li><Text size={200}>Dual (±X): Choose +X or -X when played.</Text></li>
          <li><Text size={200}>Variable (±X / ±Y): Choose one of two magnitudes and polarities.</Text></li>
          <li><Text size={200}>Flip (2&4 or 3&6): Inverts those specific main deck card values already on your board.</Text></li>
          <li><Text size={200}>Double (x2): Doubles the value of the most recently drawn main deck card.</Text></li>
          <li><Text size={200}>Tiebreaker (±1 TIE): Adjusts your total by 1 to break a tie in your favor.</Text></li>
        </ul>
      </div>
      <div className={styles.section}>
        <Text weight="semibold">Standing & Busting</Text>
        <Text size={200}>Standing freezes your score; you cannot draw or play more side cards. A bust (&gt;20) immediately ends your participation in that round.</Text>
      </div>
      <div className={styles.section}>
        <Text weight="semibold">Winning a Round</Text>
        <Text size={200}>Highest non-busted total wins. Exact 20 auto-stands. If both bust, the round is void. If both stand at the same total and no tiebreaker applies, the round is a draw (implementation dependent).</Text>
      </div>
      <div className={styles.section}>
        <Text weight="semibold">Multiplayer Notes</Text>
        <Text size={200}>Side decks are hidden from the opponent until cards are played. Turn structure mirrors solo play; strategic timing of side cards is key.</Text>
      </div>
      <div className={styles.actions}>
        <Button onClick={onBack}>Back</Button>
        <Button appearance="primary" onClick={onPlayAI}>Play vs AI</Button>
        <Button appearance="secondary" onClick={onPlayPvP}>Multiplayer</Button>
      </div>
    </div>
  );
};

export default PazaakRules;

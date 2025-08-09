import React, { useState } from 'react';
import { Card, Text, Divider, Button } from '@fluentui/react-components';
import type { GameState } from '../games/pazaak/types';

interface ActionLogProps {
  gameState: GameState;
  /** Optional max items (defaults to all). Scrolling container handles overflow. */
  max?: number;
}

const actionIcon = (action: string) => {
  switch (action) {
    case 'draw': return '🎴';
    case 'side': return '🂠';
    case 'stand': return '✋';
    case 'endTurn': return '➡️';
    case 'bust': return '💥';
    case 'autoStand': return '✅';
    default: return '•';
  }
};

export const ActionLog: React.FC<ActionLogProps> = ({ gameState, max }) => {
  const history = [...(gameState.actionHistory || [])];
  const [expanded, setExpanded] = useState(false);
  const effectiveMax = max || 25; // show last 25 by default
  const visible = expanded ? history : history.slice(-effectiveMax);
  const actions = visible.reverse();
  if (actions.length === 0) return null;
  return (
    <Card appearance="subtle">
      <Text weight="semibold">Recent Actions (latest first)</Text>
      <Divider />
      <div className="action-log-scroll" aria-label="Recent actions list">
        {actions.map(a => (
          <div key={a.ts} className="action-log-row">
            <Text size={200}>
              {actionIcon(a.action)} {a.playerName}: {a.action}{a.detail ? ` (${a.detail})` : ''} → {a.scoreAfter}
            </Text>
          </div>
        ))}
      </div>
      {history.length > effectiveMax && (
        <>
          <Divider />
          <Button appearance="subtle" size="small" onClick={() => setExpanded(e => !e)}>
            {expanded ? 'Show Fewer' : `Show All (${history.length})`}
          </Button>
        </>
      )}
    </Card>
  );
};

export default ActionLog;

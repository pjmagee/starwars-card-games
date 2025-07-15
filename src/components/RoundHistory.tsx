import React from 'react';
import {
  Card,
  CardHeader,
  Text,
  Badge,
  makeStyles,
  tokens,
  Title3,
} from '@fluentui/react-components';
import type { RoundResult, Player } from '../games/pazaak/types';

const useStyles = makeStyles({
  historyCard: {
    marginBottom: tokens.spacingVerticalM,
    width: '100%',
    maxWidth: '350px',
  },
  compactHistory: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalM,
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalS,
  },
  roundEntry: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 8px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusSmall,
    marginBottom: '4px',
    '&:last-child': {
      borderBottom: 'none',
      marginBottom: 0,
    },
  },
  roundNumber: {
    fontWeight: tokens.fontWeightSemibold,
    minWidth: '50px',
  },
  scoreDisplay: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  playerScore: {
    fontSize: tokens.fontSizeBase200,
  },
  resultBadge: {
    minWidth: '70px',
    textAlign: 'center',
  },
  summary: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: tokens.spacingVerticalS,
    gap: tokens.spacingHorizontalS,
  },
  summaryItem: {
    textAlign: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
  },
  gameStatus: {
    textAlign: 'center',
    marginBottom: tokens.spacingVerticalS,
  },
  historyList: {
    maxHeight: '200px',
    overflowY: 'auto' as const,
    marginTop: tokens.spacingVerticalS,
  },
});

interface RoundHistoryProps {
  roundResults: RoundResult[];
  players: Player[];
  isCompact?: boolean;
}

const RoundHistory: React.FC<RoundHistoryProps> = ({ roundResults, players, isCompact = false }) => {
  const styles = useStyles();

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Unknown';
  };

  const getResultText = (result: RoundResult) => {
    if (result.isVoid) return 'Void';
    if (result.isDraw) return 'Draw';
    if (result.winnerId) return getPlayerName(result.winnerId).charAt(0); // Just initial for compact
    return '?';
  };

  const getPlayerScoreColor = (result: RoundResult, playerId: string): 'brand' | 'success' | 'danger' | 'warning' | 'subtle' => {
    const score = result.playerScores[playerId];
    if (score > 20) return 'danger'; // Busted
    if (score === 20) return 'success'; // Perfect score
    if (result.winnerId === playerId) return 'success'; // Winner
    return 'subtle'; // Normal score
  };

  // Calculate statistics
  const stats = players.map(player => {
    const wins = roundResults.filter(r => r.winnerId === player.id).length;
    const losses = roundResults.filter(r => r.winnerId && r.winnerId !== player.id).length;
    
    return {
      player,
      wins,
      losses,
    };
  });

  if (roundResults.length === 0) {
    return (
      <div className={isCompact ? styles.compactHistory : styles.historyCard}>
        <Text size={300} weight="semibold">No rounds played yet</Text>
      </div>
    );
  }

  if (isCompact) {
    return (
      <div className={styles.compactHistory}>
        <div className={styles.historyHeader}>
          <Text size={300} weight="semibold">Round History</Text>
          <Text size={200}>({roundResults.length} rounds)</Text>
        </div>
        
        {/* Compact Summary */}
        <div className={styles.summary}>
          {stats.map(stat => (
            <div key={stat.player.id} className={styles.summaryItem}>
              <Text size={200}>{stat.player.name}</Text>
              <div className={styles.summaryValue}>
                <Text size={200} color="green">{stat.wins}</Text>
                <Text size={200}> - </Text>
                <Text size={200} color="red">{stat.losses}</Text>
              </div>
            </div>
          ))}
        </div>

        {/* Compact Round List */}
        <div className={styles.historyList}>
          {roundResults.slice(-5).map(result => (
            <div key={result.roundNumber} className={styles.roundEntry}>
              <Text size={200} className={styles.roundNumber}>R{result.roundNumber}</Text>
              
              <div className={styles.scoreDisplay}>
                {players.map(player => {
                  const score = result.playerScores[player.id];
                  const isWinner = result.winnerId === player.id;
                  
                  return (
                    <Text 
                      key={player.id} 
                      size={200} 
                      className={styles.playerScore}
                      style={{
                        color: getPlayerScoreColor(result, player.id) === 'success' ? 'green' : 
                               getPlayerScoreColor(result, player.id) === 'danger' ? 'red' : 'inherit',
                        fontWeight: isWinner ? 'bold' : 'normal'
                      }}
                    >
                      {score}{isWinner && !result.isVoid && !result.isDraw ? '🏆' : ''}
                    </Text>
                  );
                })}
              </div>

              <div className={styles.resultBadge}>
                <Badge
                  appearance="outline"
                  color={result.isVoid ? 'warning' : result.isDraw ? 'subtle' : 'success'}
                  size="small"
                >
                  {getResultText(result)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full version (for sidebar if needed)
  return (
    <Card className={styles.historyCard}>
      <CardHeader header={<Title3>Round History</Title3>} />
      
      {/* Game Status */}
      <div className={styles.gameStatus}>
        <Text size={300} weight="semibold">
          Game Progress: {roundResults.length} rounds played
        </Text>
        <Text size={200}>
          First to win 3 rounds wins the game!
        </Text>
      </div>
      
      {/* Summary Statistics */}
      <div className={styles.summary}>
        {stats.map(stat => (
          <div key={stat.player.id} className={styles.summaryItem}>
            <Text size={300} weight="semibold">{stat.player.name}</Text>
            <div className={styles.summaryValue}>
              <Text color="green">{stat.wins}W</Text>
              <Text> - </Text>
              <Text color="red">{stat.losses}L</Text>
            </div>
          </div>
        ))}
      </div>

      {/* Round Details */}
      <div className={styles.historyList}>
        {roundResults.map(result => (
          <div key={result.roundNumber} className={styles.roundEntry}>
            <Text className={styles.roundNumber}>R{result.roundNumber}</Text>
            
            <div className={styles.scoreDisplay}>
              {players.map(player => {
                const score = result.playerScores[player.id];
                const isWinner = result.winnerId === player.id;
                
                return (
                  <Badge
                    key={player.id}
                    appearance="outline"
                    color={getPlayerScoreColor(result, player.id)}
                    size="small"
                  >
                    {player.name}: {score}
                    {isWinner && !result.isVoid && !result.isDraw ? ' �' : ''}
                  </Badge>
                );
              })}
            </div>

            <div className={styles.resultBadge}>
              <Badge
                appearance="filled"
                color={result.isVoid ? 'warning' : result.isDraw ? 'subtle' : 'success'}
                size="medium"
              >
                {result.isVoid ? 'Void' : result.isDraw ? 'Draw' : 'Win'}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default RoundHistory;

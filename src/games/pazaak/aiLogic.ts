// AI logic for Pazaak computer opponent

import type { Player, SideCard } from './types';

export class PazaakAI {
  private difficultySettings: {
    standThreshold: number;
    sideCardUsageRate: number;
    optimalPlayRate: number;
  };

  constructor(difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.difficultySettings = PazaakAI.getDifficultySettings(difficulty);
  }
  
  /**
   * AI side card selection strategy
   * Prioritizes balanced deck with good control options
   */
  selectSideCards(sideCards: SideCard[]): string[] {
    const scoredCards = sideCards.map(card => ({
      card,
      score: this.scoreSideCard(card)
    }));
    
    // Sort by score and take top 10
    scoredCards.sort((a, b) => b.score - a.score);
    return scoredCards.slice(0, 10).map(item => item.card.id);
  }

  /**
   * Score a side card based on its utility
   */
  private scoreSideCard(card: SideCard): number {
    let score = 0;
    
    // Prefer dual cards (most flexible)
    if (card.variant === 'dual') {
      score += 10;
    }
    
    // Prefer negative cards for better control
    if (card.variant === 'negative') {
      score += 7;
    }
    
    // Positive cards are useful but less flexible
    if (card.variant === 'positive') {
      score += 5;
    }
    
    // Special cards get bonus points
    if (['flip_2_4', 'flip_3_6', 'double', 'tiebreaker', 'variable'].includes(card.variant)) {
      score += 8;
    }
    
    // Prefer mid-range values (3-6) for better control
    const absValue = Math.abs(card.value);
    if (absValue >= 3 && absValue <= 6) {
      score += 3;
    } else if (absValue >= 2 && absValue <= 7) {
      score += 1;
    }
    
    return score;
  }

  /**
   * AI decision making for main gameplay
   * Returns 'draw', 'stand', or side card to use
   */
  makeDecision(player: Player, gameState?: { players: Player[] }): { action: 'draw' | 'stand' | 'useSideCard', cardId?: string, modifier?: 'positive' | 'negative' } {
    const currentScore = player.score;
    
    // Get opponent info if available
    const opponent = gameState?.players.find(p => p.id !== player.id);
    const opponentScore = opponent?.score || 0;
    const opponentStanding = opponent?.isStanding || false;
    
    // Debug logging
    console.log(`🤖 AI Decision Making:`, {
      aiScore: currentScore,
      opponentScore,
      opponentStanding,
      opponentName: opponent?.name
    });
    
    // If we're already at 20, stand
    if (currentScore === 20) {
      console.log(`🤖 Standing at perfect 20`);
      return { action: 'stand' };
    }
    
    // If we're over 20, we should try to use a side card if possible
    if (currentScore > 20) {
      const sideCardToUse = this.findSideCardToFix(player, currentScore);
      if (sideCardToUse) {
        return sideCardToUse;
      }
      // If no side card can help, we're busted - stand (game will handle bust)
      return { action: 'stand' };
    }
    
    // If opponent is standing, we need to beat their score or get as close as possible
    if (opponentStanding && opponentScore <= 20) {
      console.log(`🤖 Opponent is standing at ${opponentScore}, AI needs to respond`);
      // We need to beat the opponent's score
      if (currentScore > opponentScore) {
        // We're already winning, stand
        console.log(`🤖 Already winning (${currentScore} > ${opponentScore}), standing`);
        return { action: 'stand' };
      } else if (currentScore === opponentScore) {
        // We're tied - need to get 1 more point or use tiebreaker
        const tiebreakerCard = player.dealtSideCards?.find(c => !c.isUsed && c.variant === 'tiebreaker');
        if (tiebreakerCard) {
          return { action: 'useSideCard', cardId: tiebreakerCard.id, modifier: 'positive' };
        }
        // Try to get exactly 1 more point
        const plusOneCard = this.findSpecificSideCard(player, 1, 'positive');
        if (plusOneCard) {
          return { action: 'useSideCard', cardId: plusOneCard.id };
        }
        // If no safe way to improve, stand (accept the tie)
        return { action: 'stand' };
      } else {
        // We're losing - need to improve our score
        const needed = opponentScore + 1 - currentScore;
        
        // If opponent is at 20, we can't win - just get as close as possible
        if (opponentScore === 20) {
          console.log(`🤖 Opponent has perfect 20, AI at ${currentScore} - trying to get close`);
          // Try to get as close to 20 as possible without busting
          const neededFor20 = 20 - currentScore;
          if (neededFor20 > 0) {
            // Try to find a side card that gets us exactly to 20
            const perfectCard = this.findSpecificSideCard(player, neededFor20, 'positive');
            if (perfectCard) {
              console.log(`🤖 Found perfect +${neededFor20} card to reach 20`);
              return { action: 'useSideCard', cardId: perfectCard.id };
            }
            // Or a dual card
            const dualCard = player.dealtSideCards?.find(c => !c.isUsed && c.variant === 'dual' && c.value === neededFor20);
            if (dualCard) {
              console.log(`🤖 Found dual ±${neededFor20} card to reach 20`);
              return { action: 'useSideCard', cardId: dualCard.id, modifier: 'positive' };
            }
          }
          
          // If we can't get to 20 exactly, be very conservative
          // Only draw if we're very safe (score <= 15) or if we have a good chance
          if (currentScore <= 14) {
            console.log(`🤖 Score ${currentScore} is safe, drawing`);
            return { action: 'draw' };
          } else if (currentScore <= 17 && Math.random() < 0.3) {
            console.log(`🤖 Score ${currentScore} - taking 30% risk to draw`);
            return { action: 'draw' }; // 30% chance to risk it
          } else {
            console.log(`🤖 Score ${currentScore} too risky against perfect 20, standing`);
            return { action: 'stand' }; // Too risky, accept the loss
          }
        }
        
        // Opponent is not at 20, try to beat them
        if (needed <= 10) { // Can potentially get it with one main deck card
          // Look for a side card that gets us exactly what we need
          const perfectCard = this.findSpecificSideCard(player, needed, 'positive');
          if (perfectCard) {
            return { action: 'useSideCard', cardId: perfectCard.id };
          }
          // Or a dual card
          const dualCard = player.dealtSideCards?.find(c => !c.isUsed && c.variant === 'dual' && c.value === needed);
          if (dualCard) {
            return { action: 'useSideCard', cardId: dualCard.id, modifier: 'positive' };
          }
        }
        // If we can't get the exact score, try to draw if safe
        if (currentScore <= 15) {
          return { action: 'draw' };
        } else {
          return { action: 'stand' }; // Too risky to draw
        }
      }
    }
    
    // Use difficulty-based thresholds for decision making
    const { standThreshold, sideCardUsageRate, optimalPlayRate } = this.difficultySettings;
    
    // Risk assessment based on current score and difficulty
    if (currentScore >= standThreshold) {
      // High risk zone - consider standing or using side cards strategically
      if (currentScore === 19) {
        // Very risky to draw, might want to stand or use +1 side card
        if (Math.random() < sideCardUsageRate) {
          const plusOneCard = this.findSpecificSideCard(player, 1, 'positive');
          if (plusOneCard) {
            return { action: 'useSideCard', cardId: plusOneCard.id };
          }
        }
        return { action: 'stand' };
      }
      
      if (currentScore === 18) {
        // Could use +2 side card or stand
        if (Math.random() < sideCardUsageRate) {
          const plusTwoCard = this.findSpecificSideCard(player, 2, 'positive');
          if (plusTwoCard) {
            return { action: 'useSideCard', cardId: plusTwoCard.id };
          }
        }
        // Difficulty affects stand probability at 18
        const standProbability = optimalPlayRate * 0.6;
        return Math.random() < standProbability ? { action: 'stand' } : { action: 'draw' };
      }
      
      // At stand threshold: more likely to stand on higher difficulties
      const standProbability = optimalPlayRate * 0.5;
      return Math.random() < standProbability ? { action: 'stand' } : { action: 'draw' };
    }
    
    // Medium risk zone (13-16 or below stand threshold)
    if (currentScore >= 13) {
      // Consider strategic side card usage even in medium risk
      if (Math.random() < sideCardUsageRate * 0.3) {
        // Look for beneficial side card plays
        const beneficialCard = this.findBeneficialSideCard(player, currentScore, gameState);
        if (beneficialCard) {
          return beneficialCard;
        }
      }
      
      // Usually draw, but consider standing based on difficulty
      const standProbability = (1 - optimalPlayRate) * 0.15;
      return Math.random() < standProbability ? { action: 'stand' } : { action: 'draw' };
    }
    
    // Low risk zone (below 13) - always draw
    return { action: 'draw' };
  }

  /**
   * Evaluate flip cards for strategic advantage
   */
  private evaluateFlipCards(player: Player, gameState: { players: Player[] }): { action: 'useSideCard', cardId: string } | null {
    const availableCards = player.dealtSideCards || player.selectedSideCards;
    
    if (!gameState) return null;
    
    // Get opponent info
    const opponent = gameState.players.find((p: Player) => p.id !== player.id);
    if (!opponent) return null;
    
    // Check flip 2&4 card
    const flip24Card = availableCards.find(card => 
      !card.isUsed && card.variant === 'flip_2_4'
    );
    
    if (flip24Card) {
      const benefit = this.calculateFlipCardBenefit(player, opponent, [2, 4]);
      if (benefit > 0) {
        return { action: 'useSideCard', cardId: flip24Card.id };
      }
    }
    
    // Check flip 3&6 card
    const flip36Card = availableCards.find(card => 
      !card.isUsed && card.variant === 'flip_3_6'
    );
    
    if (flip36Card) {
      const benefit = this.calculateFlipCardBenefit(player, opponent, [3, 6]);
      if (benefit > 0) {
        return { action: 'useSideCard', cardId: flip36Card.id };
      }
    }
    
    return null;
  }

  /**
   * Calculate the net benefit of using a flip card
   */
  private calculateFlipCardBenefit(aiPlayer: Player, opponent: Player, targetValues: number[]): number {
    let aiBenefit = 0;
    let opponentBenefit = 0;
    
    // Calculate AI benefit/cost
    aiPlayer.hand.forEach(card => {
      if (targetValues.includes(Math.abs(card.value))) {
        const currentValue = card.value;
        const newValue = currentValue > 0 ? -Math.abs(currentValue) : Math.abs(currentValue);
        aiBenefit += (newValue - currentValue);
      }
    });
    
    // Calculate opponent benefit/cost
    opponent.hand.forEach(card => {
      if (targetValues.includes(Math.abs(card.value))) {
        const currentValue = card.value;
        const newValue = currentValue > 0 ? -Math.abs(currentValue) : Math.abs(currentValue);
        opponentBenefit += (newValue - currentValue);
      }
    });
    
    let netBenefit = aiBenefit - opponentBenefit;
    
    // Additional strategic considerations
    const aiNewScore = aiPlayer.score + aiBenefit;
    const opponentNewScore = opponent.score + opponentBenefit;
    
    // Bonus if it helps us get closer to 20
    if (aiNewScore <= 20 && aiNewScore > aiPlayer.score) {
      netBenefit += 2;
    }
    
    // Bonus if it makes opponent bust
    if (opponentNewScore > 20 && opponent.score <= 20) {
      netBenefit += 10;
    }
    
    // Bonus if it helps us when we're over 20
    if (aiPlayer.score > 20 && aiNewScore <= 20) {
      netBenefit += 8;
    }
    
    return netBenefit;
  }

  /**
   * Find a beneficial side card to play strategically
   */
  private findBeneficialSideCard(player: Player, currentScore: number, gameState?: { players: Player[] }): { action: 'useSideCard', cardId: string, modifier?: 'positive' | 'negative' } | null {
    const availableCards = player.dealtSideCards || player.selectedSideCards;
    const targetScore = 20;
    const needed = targetScore - currentScore;
    
    // First, check flip cards for strategic advantage
    if (gameState) {
      const flipCardResult = this.evaluateFlipCards(player, gameState);
      if (flipCardResult) {
        return flipCardResult;
      }
    }
    
    // Look for cards that can get us exactly to 20
    for (const sideCard of availableCards) {
      if (sideCard.isUsed) continue;
      
      if (sideCard.variant === 'positive' && sideCard.value === needed) {
        return { action: 'useSideCard', cardId: sideCard.id };
      }
      
      if (sideCard.variant === 'dual' && sideCard.value === needed) {
        return { action: 'useSideCard', cardId: sideCard.id, modifier: 'positive' };
      }
    }
    
    // If we can't get exactly to 20, look for beneficial plays that get us closer without busting
    for (const sideCard of availableCards) {
      if (sideCard.isUsed) continue;
      
      // Consider positive cards that get us closer but don't bust
      if (sideCard.variant === 'positive' && currentScore + sideCard.value <= 20) {
        return { action: 'useSideCard', cardId: sideCard.id };
      }
      
      // Consider dual cards used positively
      if (sideCard.variant === 'dual' && currentScore + sideCard.value <= 20) {
        return { action: 'useSideCard', cardId: sideCard.id, modifier: 'positive' };
      }
    }
    
    return null;
  }

  /**
   * Find a side card that can fix an over-20 situation
   */
  private findSideCardToFix(player: Player, currentScore: number): { action: 'useSideCard', cardId: string, modifier?: 'positive' | 'negative' } | null {
    const overage = currentScore - 20;
    const availableCards = player.dealtSideCards || player.selectedSideCards;
    
    for (const sideCard of availableCards) {
      if (sideCard.isUsed) continue;
      
      // Look for negative cards that can fix the overage
      if (sideCard.variant === 'negative' && Math.abs(sideCard.value) >= overage) {
        return { action: 'useSideCard', cardId: sideCard.id };
      }
      
      // Look for dual cards that can be used negatively
      if (sideCard.variant === 'dual' && Math.abs(sideCard.value) >= overage) {
        return { action: 'useSideCard', cardId: sideCard.id, modifier: 'negative' };
      }
    }
    
    return null;
  }

  /**
   * Find a specific side card by value and type
   */
  private findSpecificSideCard(player: Player, value: number, type: 'positive' | 'negative'): SideCard | null {
    const availableCards = player.dealtSideCards || player.selectedSideCards;
    
    for (const sideCard of availableCards) {
      if (sideCard.isUsed) continue;
      
      if (sideCard.variant === type && Math.abs(sideCard.value) === value) {
        return sideCard;
      }
      
      // Also check dual cards
      if (sideCard.variant === 'dual' && Math.abs(sideCard.value) === value) {
        return sideCard;
      }
    }
    
    return null;
  }

  /**
   * Get AI difficulty settings
   */
  static getDifficultySettings(difficulty: 'easy' | 'medium' | 'hard') {
    switch (difficulty) {
      case 'easy':
        return {
          standThreshold: 16, // AI stands at lower scores
          sideCardUsageRate: 0.3, // Uses side cards less often
          optimalPlayRate: 0.6, // Makes optimal decisions 60% of the time
        };
      case 'medium':
        return {
          standThreshold: 17,
          sideCardUsageRate: 0.6,
          optimalPlayRate: 0.8,
        };
      case 'hard':
        return {
          standThreshold: 18, // AI is more aggressive
          sideCardUsageRate: 0.9, // Uses side cards very strategically
          optimalPlayRate: 0.95, // Nearly perfect play
        };
      default:
        return {
          standThreshold: 17,
          sideCardUsageRate: 0.6,
          optimalPlayRate: 0.8,
        };
    }
  }
}

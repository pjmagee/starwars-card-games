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
    
    // Get difficulty settings early
    const { standThreshold, sideCardUsageRate, optimalPlayRate } = this.difficultySettings;
    
    // Get opponent info if available
    const opponent = gameState?.players.find(p => p.id !== player.id);
    const opponentScore = opponent?.score || 0;
    const opponentStanding = opponent?.isStanding || false;
    
    // Debug logging
    console.log(`🤖 AI Decision Making:`, {
      aiScore: currentScore,
      opponentScore,
      opponentStanding,
      opponentName: opponent?.name,
      aiCards: player.dealtSideCards?.filter(c => !c.isUsed).length || 0,
      opponentCards: opponent?.dealtSideCards?.filter(c => !c.isUsed).length || 0,
      difficulty: { standThreshold, sideCardUsageRate, optimalPlayRate }
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
    
    // Strategic assessment: analyze all available options
    const strategicAnalysis = this.analyzeGameSituation(player, opponent, gameState);
    
    // Apply difficulty-based confidence threshold for strategic moves
    const confidenceThreshold = 0.5 + (optimalPlayRate * 0.3); // Easy: 0.68, Medium: 0.74, Hard: 0.785
    
    // If we have a high-value strategic play that meets difficulty threshold, execute it
    if (strategicAnalysis.bestMove && strategicAnalysis.bestMove.confidence > confidenceThreshold) {
      console.log(`🤖 Executing strategic move (confidence: ${strategicAnalysis.bestMove.confidence.toFixed(2)}, threshold: ${confidenceThreshold.toFixed(2)}): ${strategicAnalysis.bestMove.reasoning}`);
      return strategicAnalysis.bestMove.action;
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
   * Comprehensive strategic analysis of the current game situation
   * Evaluates all available options and their risks/rewards
   */
  private analyzeGameSituation(aiPlayer: Player, opponent: Player | undefined, gameState?: { players: Player[] }): {
    bestMove: { action: { action: 'draw' | 'stand' | 'useSideCard', cardId?: string, modifier?: 'positive' | 'negative' }, confidence: number, reasoning: string } | null,
    riskAssessment: { drawRisk: number, standRisk: number, sideCardRisks: { [cardId: string]: number } },
    opportunities: string[]
  } {
    const currentScore = aiPlayer.score;
    const opponentScore = opponent?.score || 0;
    const opponentStanding = opponent?.isStanding || false;
    const availableCards = aiPlayer.dealtSideCards?.filter(c => !c.isUsed) || [];
    const mainDeckValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Possible next draws
    
    // Apply difficulty settings to strategic analysis
    const { standThreshold, sideCardUsageRate, optimalPlayRate } = this.difficultySettings;
    
    let bestMove: { action: { action: 'draw' | 'stand' | 'useSideCard', cardId?: string, modifier?: 'positive' | 'negative' }, confidence: number, reasoning: string } | null = null;
    const opportunities: string[] = [];
    const riskAssessment = {
      drawRisk: this.calculateDrawRisk(currentScore, mainDeckValues),
      standRisk: this.calculateStandRisk(currentScore, opponentScore, opponentStanding),
      sideCardRisks: {} as { [cardId: string]: number }
    };
    
    // Analyze each available side card with difficulty-adjusted thresholds
    for (const card of availableCards) {
      const cardAnalysis = this.analyzeSideCard(aiPlayer, opponent, card, gameState);
      riskAssessment.sideCardRisks[card.id] = cardAnalysis.risk;
      
      // Apply difficulty-based confidence adjustment
      let adjustedConfidence = cardAnalysis.confidence;
      
      // On easier difficulties, reduce confidence in complex plays
      if (optimalPlayRate < 0.8) {
        // Reduce confidence for special card plays on easier difficulties
        if (['flip_2_4', 'flip_3_6', 'double'].includes(card.variant)) {
          adjustedConfidence *= optimalPlayRate;
        }
      }
      
      // Apply side card usage rate as a multiplier
      if (currentScore >= standThreshold) {
        adjustedConfidence *= sideCardUsageRate;
      }
      
      if (cardAnalysis.shouldUse && adjustedConfidence > 0.5) {
        opportunities.push(cardAnalysis.opportunity);
        
        // Update best move if this card is better
        if (!bestMove || adjustedConfidence > bestMove.confidence) {
          bestMove = {
            action: cardAnalysis.action,
            confidence: adjustedConfidence,
            reasoning: `${cardAnalysis.reasoning} (difficulty-adjusted confidence: ${adjustedConfidence.toFixed(2)})`
          };
        }
      }
    }
    
    // Consider offensive flip card strategies with difficulty adjustment
    if (opponent && gameState && optimalPlayRate > 0.7) { // Only on medium/hard
      const flipAnalysis = this.analyzeOffensiveFlipStrategies(aiPlayer, opponent);
      if (flipAnalysis.shouldUse) {
        const adjustedConfidence = flipAnalysis.confidence * optimalPlayRate;
        opportunities.push(flipAnalysis.opportunity);
        
        if (!bestMove || adjustedConfidence > bestMove.confidence) {
          bestMove = {
            action: flipAnalysis.action,
            confidence: adjustedConfidence,
            reasoning: `${flipAnalysis.reasoning} (difficulty-adjusted)`
          };
        }
      }
    }
    
    // Consider if we should force opponent to use their cards (advanced strategy)
    if (opponent && this.shouldForceOpponentResponse(aiPlayer, opponent) && optimalPlayRate > 0.8) {
      opportunities.push("Force opponent to use defensive cards");
    }
    
    return { bestMove, riskAssessment, opportunities };
  }

  /**
   * Calculate the risk of drawing a card from the main deck
   */
  private calculateDrawRisk(currentScore: number, mainDeckValues: number[]): number {
    if (currentScore >= 20) return 1.0; // 100% risk if already at/over 20
    
    let bustCount = 0;
    for (const value of mainDeckValues) {
      if (currentScore + value > 20) {
        bustCount++;
      }
    }
    
    return bustCount / mainDeckValues.length;
  }

  /**
   * Calculate the risk of standing at current score
   */
  private calculateStandRisk(currentScore: number, opponentScore: number, opponentStanding: boolean): number {
    if (currentScore === 20) return 0.0; // No risk at perfect score
    if (currentScore > 20) return 1.0; // Already busted
    
    if (opponentStanding) {
      // If opponent is standing, risk is based on whether we can beat them
      if (currentScore > opponentScore) return 0.1; // Low risk if winning
      if (currentScore === opponentScore) return 0.5; // Medium risk if tied
      return 0.9; // High risk if losing
    }
    
    // If opponent is still playing, risk depends on how close we are to 20
    return (20 - currentScore) / 20; // Higher risk the further from 20
  }

  /**
   * Analyze a specific side card for strategic value
   */
  private analyzeSideCard(aiPlayer: Player, opponent: Player | undefined, card: SideCard, gameState?: { players: Player[] }): {
    shouldUse: boolean,
    confidence: number,
    reasoning: string,
    opportunity: string,
    action: { action: 'draw' | 'stand' | 'useSideCard', cardId?: string, modifier?: 'positive' | 'negative' },
    risk: number
  } {
    const currentScore = aiPlayer.score;
    const opponentScore = opponent?.score || 0;
    const opponentStanding = opponent?.isStanding || false;
    
    // Analyze different card types
    switch (card.variant) {
      case 'positive':
        return this.analyzePositiveCard(card, currentScore, opponentScore, opponentStanding);
      
      case 'negative':
        return this.analyzeNegativeCard(card, currentScore);
      
      case 'dual':
        return this.analyzeDualCard(card, currentScore, opponentScore, opponentStanding);
      
      case 'flip_2_4':
      case 'flip_3_6':
        return this.analyzeFlipCard(aiPlayer, opponent, card, gameState);
      
      case 'double':
        return this.analyzeDoubleCard(aiPlayer, card, currentScore, opponentScore, opponentStanding);
      
      case 'tiebreaker':
        return this.analyzeTiebreakerCard(card, currentScore, opponentScore, opponentStanding);
      
      default:
        return {
          shouldUse: false,
          confidence: 0,
          reasoning: 'Unknown card type',
          opportunity: '',
          action: { action: 'stand' },
          risk: 0.5
        };
    }
  }

  /**
   * Analyze positive card usage
   */
  private analyzePositiveCard(card: SideCard, currentScore: number, opponentScore: number, opponentStanding: boolean): {
    shouldUse: boolean, confidence: number, reasoning: string, opportunity: string, action: { action: 'draw' | 'stand' | 'useSideCard', cardId?: string, modifier?: 'positive' | 'negative' }, risk: number
  } {
    const newScore = currentScore + card.value;
    const risk = newScore > 20 ? 1.0 : 0.0;
    
    // Perfect score opportunity
    if (newScore === 20) {
      return {
        shouldUse: true,
        confidence: 0.95,
        reasoning: `Using +${card.value} card achieves perfect score of 20`,
        opportunity: `Perfect score with +${card.value} card`,
        action: { action: 'useSideCard', cardId: card.id },
        risk: 0.0
      };
    }
    
    // Good improvement without busting
    if (newScore < 20 && newScore > currentScore) {
      let confidence = 0.6;
      
      // Higher confidence if opponent is standing and we need to catch up
      if (opponentStanding && newScore > opponentScore && opponentScore <= 20) {
        confidence = 0.8;
      }
      
      // Higher confidence if we're far from 20 and this gets us closer
      if (currentScore <= 15 && newScore <= 18) {
        confidence = 0.7;
      }
      
      return {
        shouldUse: true,
        confidence,
        reasoning: `Using +${card.value} improves score to ${newScore} without risk`,
        opportunity: `Safe improvement to ${newScore}`,
        action: { action: 'useSideCard', cardId: card.id },
        risk: 0.0
      };
    }
    
    return {
      shouldUse: false,
      confidence: 0,
      reasoning: `+${card.value} card would cause bust (${newScore})`,
      opportunity: '',
      action: { action: 'stand' },
      risk
    };
  }

  /**
   * Analyze negative card usage
   */
  private analyzeNegativeCard(card: SideCard, currentScore: number): {
    shouldUse: boolean, confidence: number, reasoning: string, opportunity: string, action: { action: 'draw' | 'stand' | 'useSideCard', cardId?: string, modifier?: 'positive' | 'negative' }, risk: number
  } {
    const newScore = currentScore - Math.abs(card.value);
    
    // If we're over 20, negative cards can save us
    if (currentScore > 20 && newScore <= 20) {
      return {
        shouldUse: true,
        confidence: 0.9,
        reasoning: `Using ${card.value} card saves from bust (${currentScore} → ${newScore})`,
        opportunity: `Bust recovery with ${card.value} card`,
        action: { action: 'useSideCard', cardId: card.id },
        risk: 0.0
      };
    }
    
    // Generally negative cards are defensive and less valuable when not busted
    return {
      shouldUse: false,
      confidence: 0,
      reasoning: `${card.value} card not beneficial at current score`,
      opportunity: '',
      action: { action: 'stand' },
      risk: 0.3
    };
  }

  /**
   * Analyze dual card usage (can be positive or negative)
   */
  private analyzeDualCard(card: SideCard, currentScore: number, opponentScore: number, opponentStanding: boolean): {
    shouldUse: boolean, confidence: number, reasoning: string, opportunity: string, action: { action: 'draw' | 'stand' | 'useSideCard', cardId?: string, modifier?: 'positive' | 'negative' }, risk: number
  } {
    const positiveScore = currentScore + card.value;
    const negativeScore = currentScore - card.value;
    
    // Perfect score with positive
    if (positiveScore === 20) {
      return {
        shouldUse: true,
        confidence: 0.95,
        reasoning: `Using dual ±${card.value} card positively achieves perfect score of 20`,
        opportunity: `Perfect score with dual ±${card.value} card`,
        action: { action: 'useSideCard', cardId: card.id, modifier: 'positive' },
        risk: 0.0
      };
    }
    
    // Save from bust with negative
    if (currentScore > 20 && negativeScore <= 20) {
      return {
        shouldUse: true,
        confidence: 0.9,
        reasoning: `Using dual ±${card.value} card negatively saves from bust (${currentScore} → ${negativeScore})`,
        opportunity: `Bust recovery with dual ±${card.value} card`,
        action: { action: 'useSideCard', cardId: card.id, modifier: 'negative' },
        risk: 0.0
      };
    }
    
    // Good positive improvement
    if (positiveScore < 20 && positiveScore > currentScore) {
      let confidence = 0.7;
      
      if (opponentStanding && positiveScore > opponentScore && opponentScore <= 20) {
        confidence = 0.8;
      }
      
      return {
        shouldUse: true,
        confidence,
        reasoning: `Using dual ±${card.value} card positively improves score to ${positiveScore}`,
        opportunity: `Safe improvement to ${positiveScore}`,
        action: { action: 'useSideCard', cardId: card.id, modifier: 'positive' },
        risk: 0.0
      };
    }
    
    return {
      shouldUse: false,
      confidence: 0,
      reasoning: `Dual ±${card.value} card not beneficial at current score`,
      opportunity: '',
      action: { action: 'stand' },
      risk: 0.2
    };
  }

  /**
   * Analyze flip card usage with enhanced strategic considerations
   */
  private analyzeFlipCard(aiPlayer: Player, opponent: Player | undefined, card: SideCard, gameState?: { players: Player[] }): {
    shouldUse: boolean, confidence: number, reasoning: string, opportunity: string, action: { action: 'draw' | 'stand' | 'useSideCard', cardId?: string, modifier?: 'positive' | 'negative' }, risk: number
  } {
    if (!opponent || !gameState) {
      return {
        shouldUse: false,
        confidence: 0,
        reasoning: 'No opponent data for flip card analysis',
        opportunity: '',
        action: { action: 'stand' },
        risk: 0.5
      };
    }
    
    const flipTargets = card.variant === 'flip_2_4' ? [2, 4] : [3, 6];
    const benefit = this.calculateFlipCardBenefit(aiPlayer, opponent, flipTargets);
    
    // Enhanced flip card analysis
    const aiTargetCards = aiPlayer.hand.filter(c => flipTargets.includes(Math.abs(c.value)));
    const opponentTargetCards = opponent.hand.filter(c => flipTargets.includes(Math.abs(c.value)));
    
    let strategicValue = benefit;
    
    // Bonus for disrupting opponent's good position
    if (opponent.score >= 16 && opponent.score <= 20 && opponentTargetCards.length > 0) {
      strategicValue += 3;
    }
    
    // Bonus for helping us when we're in trouble
    if (aiPlayer.score > 20 && aiTargetCards.length > 0) {
      strategicValue += 5;
    }
    
    // Bonus for creating pressure on opponent
    if (opponent.dealtSideCards?.filter(c => !c.isUsed).length === 0 && opponentTargetCards.length > 0) {
      strategicValue += 2; // Opponent has no cards to respond with
    }
    
    if (strategicValue > 2) {
      return {
        shouldUse: true,
        confidence: Math.min(0.9, 0.6 + (strategicValue * 0.1)),
        reasoning: `Flip ${flipTargets.join('&')} card provides strategic advantage (value: ${strategicValue})`,
        opportunity: `Disrupt opponent with ${flipTargets.join('&')} flip`,
        action: { action: 'useSideCard', cardId: card.id },
        risk: 0.1
      };
    }
    
    return {
      shouldUse: false,
      confidence: 0,
      reasoning: `Flip ${flipTargets.join('&')} card not strategically beneficial`,
      opportunity: '',
      action: { action: 'stand' },
      risk: 0.3
    };
  }

  /**
   * Analyze double card usage
   */
  private analyzeDoubleCard(aiPlayer: Player, card: SideCard, currentScore: number, opponentScore: number, opponentStanding: boolean): {
    shouldUse: boolean, confidence: number, reasoning: string, opportunity: string, action: { action: 'draw' | 'stand' | 'useSideCard', cardId?: string, modifier?: 'positive' | 'negative' }, risk: number
  } {
    const lastCard = aiPlayer.hand[aiPlayer.hand.length - 1];
    if (!lastCard || !lastCard.isMainDeck) {
      return {
        shouldUse: false,
        confidence: 0,
        reasoning: 'No main deck card to double',
        opportunity: '',
        action: { action: 'stand' },
        risk: 0.5
      };
    }
    
    const doubledValue = lastCard.value * 2;
    const newScore = currentScore + doubledValue - lastCard.value; // Replace last card's value with doubled
    
    // Perfect score with double
    if (newScore === 20) {
      return {
        shouldUse: true,
        confidence: 0.9,
        reasoning: `Doubling ${lastCard.value} achieves perfect score of 20`,
        opportunity: `Perfect score by doubling ${lastCard.value}`,
        action: { action: 'useSideCard', cardId: card.id },
        risk: 0.0
      };
    }
    
    // Good improvement without busting
    if (newScore < 20 && newScore > currentScore) {
      let confidence = 0.6;
      
      if (opponentStanding && newScore > opponentScore && opponentScore <= 20) {
        confidence = 0.8;
      }
      
      return {
        shouldUse: true,
        confidence,
        reasoning: `Doubling ${lastCard.value} improves score to ${newScore}`,
        opportunity: `Double ${lastCard.value} for score ${newScore}`,
        action: { action: 'useSideCard', cardId: card.id },
        risk: 0.0
      };
    }
    
    return {
      shouldUse: false,
      confidence: 0,
      reasoning: `Doubling ${lastCard.value} would cause bust (${newScore})`,
      opportunity: '',
      action: { action: 'stand' },
      risk: newScore > 20 ? 1.0 : 0.2
    };
  }

  /**
   * Analyze tiebreaker card usage
   */
  private analyzeTiebreakerCard(card: SideCard, currentScore: number, opponentScore: number, opponentStanding: boolean): {
    shouldUse: boolean, confidence: number, reasoning: string, opportunity: string, action: { action: 'draw' | 'stand' | 'useSideCard', cardId?: string, modifier?: 'positive' | 'negative' }, risk: number
  } {
    // Tiebreaker is most valuable when scores are tied
    if (currentScore === opponentScore && opponentStanding) {
      return {
        shouldUse: true,
        confidence: 0.95,
        reasoning: `Tiebreaker card wins tied round at ${currentScore}`,
        opportunity: `Win tied round with tiebreaker`,
        action: { action: 'useSideCard', cardId: card.id, modifier: 'positive' },
        risk: 0.0
      };
    }
    
    // Also good for getting exactly one point when tied
    if (currentScore + 1 === opponentScore && opponentStanding && opponentScore <= 20) {
      return {
        shouldUse: true,
        confidence: 0.8,
        reasoning: `Tiebreaker +1 ties the round at ${opponentScore}`,
        opportunity: `Tie round with tiebreaker +1`,
        action: { action: 'useSideCard', cardId: card.id, modifier: 'positive' },
        risk: 0.0
      };
    }
    
    return {
      shouldUse: false,
      confidence: 0,
      reasoning: 'Tiebreaker not needed in current situation',
      opportunity: '',
      action: { action: 'stand' },
      risk: 0.1
    };
  }

  /**
   * Analyze offensive flip card strategies to disrupt opponent
   */
  private analyzeOffensiveFlipStrategies(aiPlayer: Player, opponent: Player): {
    shouldUse: boolean, confidence: number, reasoning: string, opportunity: string, action: { action: 'draw' | 'stand' | 'useSideCard', cardId?: string, modifier?: 'positive' | 'negative' }
  } {
    const availableCards = aiPlayer.dealtSideCards?.filter(c => !c.isUsed) || [];
    
    for (const card of availableCards) {
      if (card.variant === 'flip_2_4' || card.variant === 'flip_3_6') {
        const flipTargets = card.variant === 'flip_2_4' ? [2, 4] : [3, 6];
        
        // Check if opponent has many target cards that are positive
        const opponentTargetCards = opponent.hand.filter(c => 
          flipTargets.includes(Math.abs(c.value)) && c.value > 0
        );
        
        // If opponent has 2+ positive target cards and is in good position
        if (opponentTargetCards.length >= 2 && opponent.score >= 16 && opponent.score <= 20) {
          const potentialDamage = opponentTargetCards.reduce((sum, c) => sum + (c.value * 2), 0);
          
          if (potentialDamage >= 4) { // Significant disruption
            return {
              shouldUse: true,
              confidence: 0.8,
              reasoning: `Flip ${flipTargets.join('&')} will disrupt opponent's strong position`,
              opportunity: `Offensive flip to damage opponent`,
              action: { action: 'useSideCard', cardId: card.id }
            };
          }
        }
      }
    }
    
    return {
      shouldUse: false,
      confidence: 0,
      reasoning: 'No offensive flip opportunities',
      opportunity: '',
      action: { action: 'stand' }
    };
  }

  /**
   * Determine if we should try to force opponent to use their defensive cards
   */
  private shouldForceOpponentResponse(aiPlayer: Player, opponent: Player): boolean {
    // If opponent has few cards left and we have good cards, we might want to pressure them
    const opponentCardsLeft = opponent.dealtSideCards?.filter(c => !c.isUsed).length || 0;
    const aiCardsLeft = aiPlayer.dealtSideCards?.filter(c => !c.isUsed).length || 0;
    
    // If we have more cards and opponent is in vulnerable position
    return aiCardsLeft > opponentCardsLeft && opponent.score >= 16 && opponent.score < 20;
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

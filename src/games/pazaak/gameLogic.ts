// Pazaak game logic and rules

import type { PazaakCard, SideCard, Player, GameState } from './types';
import { PazaakAI } from './aiLogic';

export class PazaakGame {
  private state: GameState;
  private ai: PazaakAI;
  private isAIGame: boolean;

  constructor(playerNames: string[], aiDifficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.ai = new PazaakAI(aiDifficulty);
    this.isAIGame = playerNames.length === 1; // Single player = vs AI
    this.state = this.initializeGame(playerNames);
  }

  private initializeGame(playerNames: string[]): GameState {
    const players: Player[] = [];
    
    // Add human player(s)
    playerNames.forEach((name, index) => {
      players.push({
        id: `player-${index}`,
        name,
        hand: [],
        sideCards: this.generateSideDeck(),
        selectedSideCards: [],
        dealtSideCards: [],
        score: 0,
        sets: 0,
        isStanding: false,
        isDealer: index === 0
      });
    });

    // Add AI player if this is a single-player game
    if (this.isAIGame) {
      players.push({
        id: 'ai-player',
        name: 'Computer',
        hand: [],
        sideCards: this.generateSideDeck(),
        selectedSideCards: [],
        dealtSideCards: [],
        score: 0,
        sets: 0,
        isStanding: false,
        isDealer: false
      });
    }

    return {
      players,
      currentPlayerIndex: 0,
      mainDeck: this.createMainDeck(),
      gamePhase: 'sideDeckSelection',
      round: 1,
      cardsDealtThisRound: 0
    };
  }

  private createMainDeck(): PazaakCard[] {
    const deck: PazaakCard[] = [];
    // Main deck has 4 cards of each value from +1 to +10 (40 cards total)
    for (let value = 1; value <= 10; value++) {
      for (let copy = 0; copy < 4; copy++) {
        deck.push({
          id: `main-${value}-${copy}`,
          value,
          isMainDeck: true,
          variant: 'default'
        });
      }
    }
    return this.shuffleDeck(deck);
  }

  private shuffleDeck(deck: PazaakCard[]): PazaakCard[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private generateSideDeck(): SideCard[] {
    const sideCards: SideCard[] = [];
    let cardId = 0;
    
    // Generate one complete side deck collection per player (43 cards each)
    // Based on commercial breakdown: each player gets their own set to choose from
    
    // Red Minus Cards: 1-6 (12 cards - 2x each value for variety)
    for (let value = 1; value <= 6; value++) {
      for (let copy = 0; copy < 2; copy++) {
        sideCards.push({
          id: `side-${cardId++}`,
          value: value,
          variant: 'negative',
          isUsed: false,
          description: `-${value} card`
        });
      }
    }
    
    // Blue Plus Cards: 1-6 (12 cards - 2x each value for variety)
    for (let value = 1; value <= 6; value++) {
      for (let copy = 0; copy < 2; copy++) {
        sideCards.push({
          id: `side-${cardId++}`,
          value: value,
          variant: 'positive',
          isUsed: false,
          description: `+${value} card`
        });
      }
    }
    
    // Red/Blue Dual Cards: ±1-6 (12 cards - 2x each value for variety)
    for (let value = 1; value <= 6; value++) {
      for (let copy = 0; copy < 2; copy++) {
        sideCards.push({
          id: `side-${cardId++}`,
          value: value,
          variant: 'dual',
          isUsed: false,
          description: `±${value} card (choose + or - when played)`
        });
      }
    }
    
    // Yellow Specialty Cards: 2&4 Flip (2 cards)
    for (let copy = 0; copy < 2; copy++) {
      sideCards.push({
        id: `side-${cardId++}`,
        value: 0,
        variant: 'flip_2_4',
        isUsed: false,
        flipTargets: [2, 4],
        description: 'Flip: Turn all 2s to -2s and 4s to -4s (and vice versa)'
      });
    }
    
    // Yellow Specialty Cards: 3&6 Flip (2 cards)
    for (let copy = 0; copy < 2; copy++) {
      sideCards.push({
        id: `side-${cardId++}`,
        value: 0,
        variant: 'flip_3_6',
        isUsed: false,
        flipTargets: [3, 6],
        description: 'Flip: Turn all 3s to -3s and 6s to -6s (and vice versa)'
      });
    }
    
    // Yellow Specialty Cards: Double (1 card)
    sideCards.push({
      id: `side-${cardId++}`,
      value: 0,
      variant: 'double',
      isUsed: false,
      description: 'Double: Doubles the value of the last main deck card'
    });
    
    // Yellow Specialty Cards: Tiebreaker (1 card)
    sideCards.push({
      id: `side-${cardId++}`,
      value: 1,
      variant: 'tiebreaker',
      isUsed: false,
      description: 'Tiebreaker: ±1 that wins tied rounds'
    });
    
    // Yellow Specialty Cards: Variable ±1/2 (1 card)
    sideCards.push({
      id: `side-${cardId++}`,
      value: 1,
      variant: 'variable',
      isUsed: false,
      alternateValue: 2,
      description: 'Variable: Choose ±1 or ±2 when played'
    });

    return sideCards; // 43 total cards per player - their personal collection to choose from
  }

  public selectSideCards(playerId: string, cardIds: string[]): GameState {
    if (cardIds.length !== 10) {
      throw new Error('Must select exactly 10 side cards');
    }

    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return this.state;

    const selectedCards = cardIds.map(id => 
      player.sideCards.find(card => card.id === id)
    ).filter(card => card !== undefined) as SideCard[];

    if (selectedCards.length !== 10) {
      throw new Error('Invalid side card selection');
    }

    player.selectedSideCards = selectedCards;

    // Auto-select for AI player if this is an AI game
    if (this.isAIGame) {
      this.autoSelectAISideCards();
    }

    // Check if all players have selected their side cards
    const allSelected = this.state.players.every(p => p.selectedSideCards.length === 10);
    if (allSelected) {
      // Deal 4 random cards from each player's selected 10-card side deck
      this.state.players.forEach(player => {
        const shuffledSideDeck = this.shuffleArray([...player.selectedSideCards]);
        player.dealtSideCards = shuffledSideDeck.slice(0, 4);
        // Initialize hand as empty - cards will be added when drawn from main deck or side cards are used
        player.hand = [];
      });
      this.state.gamePhase = 'playing';
    }

    return { ...this.state };
  }

  private autoSelectAISideCards(): void {
    const aiPlayer = this.state.players.find(p => p.id === 'ai-player');
    if (aiPlayer && aiPlayer.selectedSideCards.length === 0) {
      const selectedIds = this.ai.selectSideCards(aiPlayer.sideCards);
      const selectedCards = selectedIds.map(id => 
        aiPlayer.sideCards.find(card => card.id === id)
      ).filter(card => card !== undefined) as SideCard[];
      aiPlayer.selectedSideCards = selectedCards;
    }
  }

  /**
   * Process AI turn automatically
   */
  public processAITurn(): GameState {
    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.id !== 'ai-player') {
      return this.state;
    }

    const decision = this.ai.makeDecision(currentPlayer, this.state);
    
    // Debug logging for AI decisions
    console.log(`AI Decision: ${decision.action}`, {
      currentScore: currentPlayer.score,
      availableSideCards: currentPlayer.dealtSideCards.filter(c => !c.isUsed).length,
      cardId: decision.cardId,
      modifier: decision.modifier,
      opponentScore: this.state.players.find(p => p.id !== currentPlayer.id)?.score,
      opponentStanding: this.state.players.find(p => p.id !== currentPlayer.id)?.isStanding
    });
    
    switch (decision.action) {
      case 'draw':
        return this.dealCard(currentPlayer.id);
      case 'stand':
        return this.stand(currentPlayer.id);
      case 'useSideCard':
        if (decision.cardId) {
          return this.useSideCard(currentPlayer.id, decision.cardId, decision.modifier);
        }
        break;
    }

    return this.state;
  }

  /**
   * Check if current player is AI and needs to make a move
   */
  public isAITurn(): boolean {
    const currentPlayer = this.getCurrentPlayer();
    return currentPlayer?.id === 'ai-player' && this.state.gamePhase === 'playing';
  }

  private calculateScore(player: Player): number {
    return player.hand.reduce((sum, card) => sum + card.value, 0);
  }

  public dealCard(playerId: string): GameState {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || this.state.mainDeck.length === 0 || player.isStanding) {
      return this.state;
    }

    const card = this.state.mainDeck.pop()!;
    player.hand.push(card);
    player.score = this.calculateScore(player);
    this.state.cardsDealtThisRound++;

    // Check for automatic stand on exactly 20 (per official rules)
    if (player.score === 20) {
      player.isStanding = true;
    }
    // Check for bust (over 20)
    else if (player.score > 20) {
      player.isStanding = true;
    }

    // Always advance turn after drawing a card
    this.nextTurn();

    return { ...this.state };
  }

  public useSideCard(playerId: string, cardId: string, modifier?: 'positive' | 'negative'): GameState {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return this.state;

    // Find the side card in the player's dealt side cards (their 4-card hand)
    const sideCard = player.dealtSideCards.find(card => card.id === cardId && !card.isUsed);
    if (!sideCard) return this.state;

    console.log(`${player.name} used side card:`, {
      cardVariant: sideCard.variant,
      cardValue: sideCard.value,
      modifier: modifier,
      scoreBefore: player.score
    });

    sideCard.isUsed = true;

    // Apply special card effects
    this.applySideCardEffect(player, sideCard, modifier);
    
    console.log(`${player.name} score after side card:`, player.score);
    
    // Always advance turn after using a side card, regardless of standing status
    // The game will handle round ending in nextTurn() if needed
    this.nextTurn();
    
    return { ...this.state };
  }

  private applySideCardEffect(player: Player, sideCard: SideCard, modifier?: 'positive' | 'negative'): void {
    let effectValue = sideCard.value;
    const cardVariant = sideCard.variant;

    switch (sideCard.variant) {
      case 'positive':
        effectValue = Math.abs(sideCard.value);
        break;
      
      case 'negative':
        effectValue = -Math.abs(sideCard.value);
        break;
      
      case 'dual':
        if (modifier) {
          effectValue = modifier === 'positive' ? Math.abs(sideCard.value) : -Math.abs(sideCard.value);
        } else {
          // If no modifier specified (shouldn't happen), default to positive
          effectValue = Math.abs(sideCard.value);
        }
        break;
      
      case 'flip_2_4':
        // Flip all 2s and 4s on the entire game board (all players' hands)
        this.state.players.forEach(p => {
          p.hand.forEach(card => {
            if (Math.abs(card.value) === 2) {
              card.value = card.value > 0 ? -2 : 2;
            } else if (Math.abs(card.value) === 4) {
              card.value = card.value > 0 ? -4 : 4;
            }
          });
        });
        effectValue = 0; // No direct value addition
        break;
      
      case 'flip_3_6':
        // Flip all 3s and 6s on the entire game board (all players' hands)
        this.state.players.forEach(p => {
          p.hand.forEach(card => {
            if (Math.abs(card.value) === 3) {
              card.value = card.value > 0 ? -3 : 3;
            } else if (Math.abs(card.value) === 6) {
              card.value = card.value > 0 ? -6 : 6;
            }
          });
        });
        effectValue = 0; // No direct value addition
        break;
      
      case 'double': {
        // Double the value of the last main deck card drawn
        // Find the last main deck card in the player's hand
        const mainDeckCards = player.hand.filter(card => card.isMainDeck);
        if (mainDeckCards.length > 0) {
          const lastMainCard = mainDeckCards[mainDeckCards.length - 1];
          // Add the value of the last main card again (effectively doubling it)
          effectValue = lastMainCard.value;
        } else {
          effectValue = 0; // No main deck cards to double
        }
        break;
      }
      
      case 'tiebreaker':
        // Tiebreaker card: ±1 that wins tied rounds (per official rules)
        // Apply the modifier if specified, otherwise default to +1
        effectValue = modifier === 'negative' ? -1 : 1;
        // Mark that this player has played a tiebreaker
        player.tiebreaker = true;
        break;
      
      case 'variable': {
        // For variable cards (±1/2), player chooses both sign and value
        // Use alternateValue if specified in the UI
        const variableValue = sideCard.alternateValue || sideCard.value;
        effectValue = modifier === 'negative' ? -variableValue : variableValue;
        break;
      }
    }

    // Create effect card only if there's a direct value to add
    if (effectValue !== 0) {
      const effectCard: PazaakCard = {
        id: `effect-${sideCard.id}`,
        value: effectValue,
        isMainDeck: false,
        variant: cardVariant === 'positive' || cardVariant === 'negative' ? 'side' : cardVariant
      };
      
      player.hand.push(effectCard);
    }

    // Recalculate score after all effects
    player.score = this.calculateScore(player);

    // Check for automatic stand on exactly 20 (per official rules)
    if (player.score === 20) {
      player.isStanding = true;
    }
    // Check for bust (over 20)
    else if (player.score > 20) {
      player.isStanding = true;
    }
  }

  public stand(playerId: string): GameState {
    const player = this.state.players.find(p => p.id === playerId);
    if (player) {
      player.isStanding = true;
    }

    // Always advance turn after standing - let the other player continue
    this.nextTurn();

    return { ...this.state };
  }

  public nextTurn(): GameState {
    // Check if all players are standing or busted
    const allStanding = this.state.players.every(p => p.isStanding || p.score > 20);
    
    if (allStanding) {
      return this.endRound();
    }

    // Move to next player
    let attempts = 0;
    const maxAttempts = this.state.players.length;
    
    do {
      this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
      attempts++;
    } while (
      this.state.players[this.state.currentPlayerIndex].isStanding && 
      attempts < maxAttempts
    );

    // Double check - if we couldn't find a non-standing player, end the round
    if (attempts >= maxAttempts) {
      return this.endRound();
    }

    return { ...this.state };
  }

  private endRound(): GameState {
    // Determine round winner
    const validPlayers = this.state.players.filter(p => p.score <= 20);
    
    if (validPlayers.length === 0) {
      // All players busted - no winner this round
    } else {
      // Find player(s) closest to 20
      const maxScore = Math.max(...validPlayers.map(p => p.score));
      const roundWinners = validPlayers.filter(p => p.score === maxScore);
      
      if (roundWinners.length === 1) {
        roundWinners[0].sets++;
      } else if (roundWinners.length > 1) {
        // Handle ties - check for tiebreaker cards
        const tiebreakerWinners = roundWinners.filter(p => p.tiebreaker);
        if (tiebreakerWinners.length === 1) {
          // Only one player played a tiebreaker - they win
          tiebreakerWinners[0].sets++;
        }
        // If multiple or no tiebreakers, round is void (no winner)
      }
    }

    // Check for game winner (first to 3 rounds per official rules)
    const gameWinner = this.state.players.find(p => p.sets >= 3);
    
    if (gameWinner) {
      this.state.gamePhase = 'gameEnd';
      this.state.winner = gameWinner;
    } else {
      // Reset for next round
      this.state.players.forEach(p => {
        p.hand = [];
        p.score = 0;
        p.isStanding = false;
        p.tiebreaker = false; // Reset tiebreaker flag
        // DO NOT reset side card usage - they are single-use per GAME, not per round
        // p.dealtSideCards.forEach(sc => sc.isUsed = false); // REMOVED
      });
      this.state.round++;
      this.state.currentPlayerIndex = 0;
      this.state.gamePhase = 'playing';
      this.state.cardsDealtThisRound = 0;
      // Reshuffle main deck
      this.state.mainDeck = this.createMainDeck();
    }

    return { ...this.state };
  }

  public getState(): GameState {
    return { ...this.state };
  }

  public getCurrentPlayer(): Player | undefined {
    return this.state.players[this.state.currentPlayerIndex];
  }
}

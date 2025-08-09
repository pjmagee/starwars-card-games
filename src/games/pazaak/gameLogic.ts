// Pazaak game logic and rules

import type { PazaakCard, SideCard, Player, GameState, RoundResult } from './types';
import { PazaakAI } from './aiLogic';
import { soundEffects } from '../../utils/soundEffects';

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
      cardsDealtThisRound: 0,
      roundResults: [],
      actionHistory: []
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
  // Based on official pazaak-cards-breakdown.md: "Two Side Decks" means one deck per player
  // So each player gets half of the total counts shown
    
    // Red Minus Cards: 1-6 (12 cards - 2x each value per player)
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
    
    // Blue Plus Cards: 1-6 (12 cards - 2x each value per player)
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
    
    // Red/Blue Dual Cards: ±1-6 (12 cards - 2x each value per player)
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
    
    // Yellow Flip Cards: 2&4 Flip (2 cards per player)
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
    
    // Yellow Flip Cards: 3&6 Flip (2 cards per player)
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
    
    // Yellow Special Cards: Double (1 card per player)
    sideCards.push({
      id: `side-${cardId++}`,
      value: 0,
      variant: 'double',
      isUsed: false,
      description: 'Double: Doubles the value of the last main deck card'
    });
    
    // Yellow Special Cards: Tiebreaker (1 card per player)
    sideCards.push({
      id: `side-${cardId++}`,
      value: 1,
      variant: 'tiebreaker',
      isUsed: false,
      description: 'Tiebreaker: ±1 that wins tied rounds'
    });
    
    // Yellow Special Cards: Variable ±1/2 (1 card per player)
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

  // Static method to generate side cards for UI purposes
  public static generateSideDeckForUI(): SideCard[] {
    const tempGame = new PazaakGame(['temp']);
    return tempGame.generateSideDeck();
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
    // Reset per-turn flags for new game start
    this.state.turnHasDrawn = false;
    this.state.turnUsedSideCard = false;
      
      // Per Pazaak rules, each round starts with each player drawing a card
      this.state.players.forEach(player => {
        if (this.state.mainDeck.length > 0) {
          const card = this.state.mainDeck.pop()!;
          player.hand.push(card);
          player.score = this.calculateScore(player);
          this.state.cardsDealtThisRound++;
        }
      });
    // After initial automatic card, first active player still must draw this turn
    this.state.turnHasDrawn = false;
    this.state.turnUsedSideCard = false;
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
    
    let actionMessage = '';
    
  switch (decision.action) {
      case 'draw': {
        // If AI already drew this turn (should not request second draw), convert to endTurn
        if (this.state.turnHasDrawn) {
          actionMessage = `➡️ Ending turn (already drew)`;
          this.state.aiLastAction = actionMessage;
          this.addToAIActionHistory(actionMessage);
          return this.endTurn();
        }
        actionMessage = `🎴 Drawing a card...`;
        this.state.aiLastAction = actionMessage;
        const newState = this.dealCard(currentPlayer.id);
        // After a draw, the AI's turnHasDrawn will be true unless auto-ended; AI may optionally use a side card on a subsequent invocation
        const drawnCard = currentPlayer.hand[currentPlayer.hand.length - 1];
        if (drawnCard) {
          actionMessage = `🎴 Drew ${drawnCard.value} (Score: ${currentPlayer.score})`;
          this.state.aiLastAction = actionMessage;
        }
        this.addToAIActionHistory(actionMessage);
        // If AI is neither standing nor busted and hasn't used a side card, we'll wait for next processAITurn cycle to decide side card / stand / endTurn
        return newState;
      }
        
      case 'stand': {
        actionMessage = `✋ Standing at ${currentPlayer.score}`;
        this.state.aiLastAction = actionMessage;
        this.addToAIActionHistory(actionMessage);
        return this.stand(currentPlayer.id);
      }
      case 'endTurn': {
        actionMessage = `➡️ Ending turn at ${currentPlayer.score}`;
        this.state.aiLastAction = actionMessage;
        this.addToAIActionHistory(actionMessage);
        return this.endTurn();
      }
        
      case 'useSideCard': {
        if (decision.cardId) {
          const sideCard = currentPlayer.dealtSideCards?.find(c => c.id === decision.cardId);
          if (sideCard) {
            switch (sideCard.variant) {
              case 'positive':
                actionMessage = `🔵 Using +${sideCard.value} card`;
                break;
              case 'negative':
                actionMessage = `🔴 Using -${sideCard.value} card`;
                break;
              case 'dual': {
                const modifierText = decision.modifier === 'negative' ? '-' : '+';
                actionMessage = `🟡 Using ±${sideCard.value} card as ${modifierText}${sideCard.value}`;
                break;
              }
              case 'flip_2_4':
                actionMessage = `🔄 Using 2&4 Flip card - reversing all 2s and 4s!`;
                break;
              case 'flip_3_6':
                actionMessage = `🔄 Using 3&6 Flip card - reversing all 3s and 6s!`;
                break;
              case 'double':
                actionMessage = `⚡ Using Double card - doubling last main card!`;
                break;
              case 'tiebreaker': {
                const tiebreakerText = decision.modifier === 'negative' ? '-1' : '+1';
                actionMessage = `🏆 Using Tiebreaker card as ${tiebreakerText}`;
                break;
              }
              case 'variable': {
                const variableText = decision.modifier === 'negative' ? '-' : '+';
                actionMessage = `🎯 Using Variable card as ${variableText}${sideCard.value}`;
                break;
              }
              default:
                actionMessage = `🎴 Using special card`;
            }
            this.state.aiLastAction = actionMessage;
            this.addToAIActionHistory(actionMessage);
          }
          const stateAfterCard = this.useSideCard(currentPlayer.id, decision.cardId, decision.modifier);
          // If side card didn't auto-end turn (not standing/bust), end turn now to respect one action sequence per turn
          const stillActive = !currentPlayer.isStanding && currentPlayer.score <= 20;
          if (stillActive) {
            this.endTurn();
          }
          return stateAfterCard;
        }
        break;
      }
    }

  // Fallback: if AI has already drawn this turn and is not standing, end turn to pass play back
  if (this.state.turnHasDrawn && !currentPlayer.isStanding) {
      this.endTurn();
    }
    return this.state;
  }

  /**
   * Add action to AI action history (keep last 3 actions) and log to console
   */
  private addToAIActionHistory(action: string): void {
    if (!this.state.aiActionHistory) {
      this.state.aiActionHistory = [];
    }
    this.state.aiActionHistory.unshift(action);
    if (this.state.aiActionHistory.length > 3) {
      this.state.aiActionHistory.pop();
    }
    
    // Log AI action to console for debugging
    console.log('🤖 AI Action:', action);
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
  // Only the current player may draw; enforce one draw per turn using turnHasDrawn flag
  const isCurrentPlayer = this.state.players[this.state.currentPlayerIndex]?.id === playerId;
  if (!player || !isCurrentPlayer || this.state.mainDeck.length === 0 || player.isStanding || player.hand.length >= 9 || this.state.turnHasDrawn) {
      return this.state;
    }

    // Play draw sound effect
    soundEffects.playDrawStand();

    const card = this.state.mainDeck.pop()!;
    player.hand.push(card);
    player.score = this.calculateScore(player);
    this.state.cardsDealtThisRound++;
  this.state.actionHistory?.push({ ts: Date.now(), playerId, playerName: player.name, action: 'draw', detail: `${card.value}`, scoreAfter: player.score });

    // Update AI action display if it's AI player
    if (playerId === 'ai-player') {
      this.state.aiLastAction = `🎴 Drew ${card.value} → Total: ${player.score}`;
    }

    // Check for automatic stand on exactly 20 (per official rules)
    if (player.score === 20) {
      player.isStanding = true;
      console.log(`${player.name} stands at 20`);
  this.state.actionHistory?.push({ ts: Date.now(), playerId, playerName: player.name, action: 'autoStand', detail: '20', scoreAfter: player.score });
      if (playerId === 'ai-player') {
        this.state.aiLastAction = `🎯 Drew ${card.value} → Perfect 20! Standing.`;
      }
  // Advance immediately since player auto-stood at 20
  this.endTurnInternal();
  return { ...this.state };
    }
    // Check for bust (over 20)
    else if (player.score > 20) {
      player.isStanding = true;
      console.log(`${player.name} busts with ${player.score}`);
  this.state.actionHistory?.push({ ts: Date.now(), playerId, playerName: player.name, action: 'bust', detail: `${player.score}`, scoreAfter: player.score });
      if (playerId === 'ai-player') {
        this.state.aiLastAction = `💥 Drew ${card.value} → BUSTED with ${player.score}!`;
      }
      
      // Immediately check if round should end when someone busts
      const shouldEndRound = this.state.players.some(p => p.score > 20);
      if (shouldEndRound) {
        console.log('Player busted, ending round immediately');
        return this.endRound();
      }
    }
    // Check if board is full (9 cards) - player automatically stands
    else if (player.hand.length >= 9) {
      player.isStanding = true;
      console.log(`${player.name} stands with full board (9 cards)`);
  this.state.actionHistory?.push({ ts: Date.now(), playerId, playerName: player.name, action: 'autoStand', detail: 'fullBoard', scoreAfter: player.score });
      if (playerId === 'ai-player') {
        this.state.aiLastAction = `📋 Board full → Standing at ${player.score}`;
      }
  // Advance to next player when board fills
  this.endTurnInternal();
  return { ...this.state };
    }

  // Mark draw so player can optionally use a side card before ending turn or standing
  this.state.turnHasDrawn = true;
  this.state.turnUsedSideCard = false;

    return { ...this.state };
  }

  public useSideCard(playerId: string, cardId: string, modifier?: 'positive' | 'negative'): GameState {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return this.state;

    // Find the side card in the player's dealt side cards (their 4-card hand)
    const sideCard = player.dealtSideCards.find(card => card.id === cardId && !card.isUsed);
    if (!sideCard) return this.state;

    // If board is full (9 cards), only allow flip cards (they don't add a new card)
    if (player.hand.length >= 9 && !['flip_2_4','flip_3_6'].includes(sideCard.variant)) {
      return this.state; // Cannot use non-flip side card on full board
    }

    sideCard.isUsed = true;
  this.state.actionHistory?.push({ ts: Date.now(), playerId, playerName: player.name, action: 'side', detail: `${sideCard.variant}${modifier ? ':'+modifier : ''}`, scoreAfter: player.score });

    // Apply special card effects
    this.applySideCardEffect(player, sideCard, modifier);
    
  // Mark that a side card was used this turn; player can now stand or end turn
  this.state.turnUsedSideCard = true;
  // If side card caused automatic standing or bust, process turn/round end
  if (player.score > 20) {
    // Bust ends the round immediately
    return this.endRound();
  }
  if (player.isStanding) {
    this.endTurnInternal();
    return { ...this.state };
  }
    
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
        console.log('🔄 FLIP 2&4 activated - affecting all players');
        this.state.players.forEach(p => {
          const oldScore = p.score;
          p.hand.forEach(card => {
            if (Math.abs(card.value) === 2) {
              card.value = card.value > 0 ? -2 : 2;
            } else if (Math.abs(card.value) === 4) {
              card.value = card.value > 0 ? -4 : 4;
            }
          });
          // Recalculate score for all affected players
          p.score = this.calculateScore(p);
          console.log(`  ${p.name}: ${oldScore} → ${p.score}`);
          // Reset standing status if score changed - they may need to make new decisions
          if (p.score <= 20 && p.isStanding) {
            p.isStanding = false; // Allow them to continue playing if flip helped them
            console.log(`  ${p.name}: Standing reset - can continue playing`);
          }
          // Auto-stand on exactly 20 or bust
          if (p.score === 20 || p.score > 20) {
            p.isStanding = true;
          }
        });
        effectValue = 0; // No direct value addition
        break;
      
      case 'flip_3_6':
        // Flip all 3s and 6s on the entire game board (all players' hands)
        console.log('🔄 FLIP 3&6 activated - affecting all players');
        this.state.players.forEach(p => {
          const oldScore = p.score;
          p.hand.forEach(card => {
            if (Math.abs(card.value) === 3) {
              card.value = card.value > 0 ? -3 : 3;
            } else if (Math.abs(card.value) === 6) {
              card.value = card.value > 0 ? -6 : 6;
            }
          });
          // Recalculate score for all affected players
          p.score = this.calculateScore(p);
          console.log(`  ${p.name}: ${oldScore} → ${p.score}`);
          // Reset standing status if score changed - they may need to make new decisions
          if (p.score <= 20 && p.isStanding) {
            p.isStanding = false; // Allow them to continue playing if flip helped them
            console.log(`  ${p.name}: Standing reset - can continue playing`);
          }
          // Auto-stand on exactly 20 or bust
          if (p.score === 20 || p.score > 20) {
            p.isStanding = true;
          }
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

    // Create effect card only if there's a direct value to add and space on the board
  if (effectValue !== 0 && player.hand.length < 9) {
      const effectCard: PazaakCard = {
        id: `effect-${sideCard.id}`,
        value: effectValue,
        isMainDeck: false,
        variant: cardVariant === 'positive' || cardVariant === 'negative' ? 'side' : cardVariant
      };
      
      player.hand.push(effectCard);
    }

    // Recalculate score after all effects (skip for flip cards since they already recalculated all players)
    if (!['flip_2_4', 'flip_3_6'].includes(sideCard.variant)) {
      player.score = this.calculateScore(player);

      // Check for automatic stand on exactly 20 (per official rules)
      if (player.score === 20) {
        player.isStanding = true;
      }
      // Check for bust (over 20)
      else if (player.score > 20) {
        player.isStanding = true;
      }
      // Check if board is full (9 cards) - player automatically stands
      else if (player.hand.length >= 9) {
        player.isStanding = true;
      }
    }
  }

  public stand(playerId: string): GameState {
    const player = this.state.players.find(p => p.id === playerId);
    if (player) {
      // Play stand sound effect
      soundEffects.playDrawStand();
      
      player.isStanding = true;
  this.state.actionHistory?.push({ ts: Date.now(), playerId, playerName: player.name, action: 'stand', scoreAfter: player.score });
    }
    // Standing ends the turn immediately
    this.endTurnInternal();

    return { ...this.state };
  }

  public endTurn(): GameState {
    // Only allow end turn if current player has drawn (per rules you must draw first)
    if (!this.state.turnHasDrawn) return this.state;
    const current = this.getCurrentPlayer();
    if (current) {
      this.state.actionHistory?.push({ ts: Date.now(), playerId: current.id, playerName: current.name, action: 'endTurn', scoreAfter: current.score });
    }
    this.endTurnInternal();
    return { ...this.state };
  }

  private endTurnInternal(): void {
    this.state.turnHasDrawn = false;
    this.state.turnUsedSideCard = false;
    // If all OTHER players are standing/busted and current player is not standing, keep turn (they may draw again next turn).
    const current = this.getCurrentPlayer();
    if (current && !current.isStanding && current.score <= 20) {
      const othersActive = this.state.players.some(p => p.id !== current.id && !p.isStanding && p.score <= 20);
      if (!othersActive) {
        // No active opponents; player may continue drawing until they choose to stand/bust/fill board.
        console.log('Only one active player remains – retaining turn for continued play');
        return;
      }
    }
    this.nextTurn();
  }

  public forfeit(playerId: string): GameState {
    const player = this.state.players.find(p => p.id === playerId);
    if (player) {
      // Mark player as forfeited and eliminate them from the game
      player.isStanding = true;
      player.score = 21; // Set score to 21 to ensure they lose
      console.log(`Player ${player.name} has forfeited`);
    }

    // Check if this ends the round
    const allStanding = this.state.players.every(p => p.isStanding || p.score > 20);
    
    if (allStanding) {
      console.log('Ending round due to forfeit');
      this.endRound();
    } else {
      this.nextTurn();
    }

    return { ...this.state };
  }

  public nextTurn(): GameState {
    // Check if all players are standing or busted
    const allStanding = this.state.players.every(p => p.isStanding || p.score > 20);
    
    console.log('nextTurn - player states:', this.state.players.map(p => ({
      name: p.name,
      score: p.score,
      isStanding: p.isStanding,
      busted: p.score > 20
    })));
    console.log('All standing or busted:', allStanding);
    
    if (allStanding) {
      console.log('Ending round due to all players standing or busted');
      return this.endRound();
    }

    // Find next player who is NOT standing/busted. Important: it's valid to return to the same
    // player immediately (e.g. opponent stood) so we loop up to player count times looking.
    let found = false;
    for (let i = 0; i < this.state.players.length; i++) {
      this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
      const candidate = this.state.players[this.state.currentPlayerIndex];
      if (!candidate.isStanding && candidate.score <= 20) {
        found = true;
        break;
      }
    }
    if (!found) {
      console.log('No active player found (all standing/busted) during rotation – ending round');
      return this.endRound();
    }

    console.log(`Next player: ${this.state.players[this.state.currentPlayerIndex].name}`);
    return { ...this.state };
  }

  private endRound(): GameState {
    // Create round result object
    const roundResult: RoundResult = {
      roundNumber: this.state.round,
      winnerId: undefined,
      isDraw: false,
      isVoid: false,
      playerScores: {}
    };
    
    // Record player scores
    this.state.players.forEach(p => {
      roundResult.playerScores[p.id] = p.score;
    });
    
    // Determine round winner
    const validPlayers = this.state.players.filter(p => p.score <= 20);
    
    if (validPlayers.length === 0) {
      roundResult.isVoid = true;
      console.log('Round void - all players busted');
    } else {
      // Find player(s) closest to 20
      const maxScore = Math.max(...validPlayers.map(p => p.score));
      const roundWinners = validPlayers.filter(p => p.score === maxScore);
      
      if (roundWinners.length === 1) {
        roundWinners[0].sets++;
        roundResult.winnerId = roundWinners[0].id;
        console.log(`Round ${this.state.round}: ${roundWinners[0].name} wins with score ${maxScore}`);
        
        // Play win sound if it's the human player who won
        if (roundWinners[0].id !== 'ai-player') {
          soundEffects.playWin();
        }
      } else if (roundWinners.length > 1) {
        // Handle ties - check for tiebreaker cards
        const tiebreakerWinners = roundWinners.filter(p => p.tiebreaker);
        if (tiebreakerWinners.length === 1) {
          // Only one player played a tiebreaker - they win
          tiebreakerWinners[0].sets++;
          roundResult.winnerId = tiebreakerWinners[0].id;
          console.log(`Round ${this.state.round}: ${tiebreakerWinners[0].name} wins with tiebreaker`);
          
          // Play win sound if it's the human player who won
          if (tiebreakerWinners[0].id !== 'ai-player') {
            soundEffects.playWin();
          }
        } else {
          // No tiebreaker or multiple tiebreakers - round is void and must be restarted
          roundResult.isVoid = true;
          console.log(`Round ${this.state.round}: Void due to tie (tied at ${maxScore}) - round will be restarted`);
        }
      }
    }
    
    // Add round result to history
    this.state.roundResults.push(roundResult);

    // Check for game winner (first to 3 rounds per official rules)
    const gameWinner = this.state.players.find(p => p.sets >= 3);
    
    if (gameWinner) {
      this.state.gamePhase = 'gameEnd';
      this.state.winner = gameWinner;
      console.log(`Game over: ${gameWinner.name} wins!`);
      
      // Play win sound if it's the human player who won the game
      if (gameWinner.id !== 'ai-player') {
        soundEffects.playWin();
      }
    } else if (roundResult.isVoid) {
      // For void rounds (ties without tiebreaker), restart the round immediately
      this.state.gamePhase = 'roundEnd';
      console.log(`Round ${this.state.round} was void. Same round will be restarted.`);
    } else {
      // Set phase to roundEnd to allow UI to show results
      this.state.gamePhase = 'roundEnd';
      console.log(`Round ${this.state.round} ended. Advancing to round ${this.state.round + 1}`);
    }

    return { ...this.state };
  }

  public startNextRound(): GameState {
    if (this.state.gamePhase !== 'roundEnd') {
      return this.state;
    }

    // Check if the last round was void (tied without tiebreaker)
    const lastResult = this.state.roundResults[this.state.roundResults.length - 1];
    const isVoidRound = lastResult && lastResult.isVoid;

    // Reset for next round
    this.state.players.forEach(p => {
      p.hand = [];
      p.score = 0;
      p.isStanding = false;
      p.tiebreaker = false; // Reset tiebreaker flag
    });
    
    // Only advance round number if the last round wasn't void
    if (!isVoidRound) {
      this.state.round++;
    }
    
    this.state.currentPlayerIndex = 0;
    this.state.gamePhase = 'playing';
    this.state.cardsDealtThisRound = 0;
    this.state.aiLastAction = undefined; // Clear AI action for new round
    // Reshuffle main deck
    this.state.mainDeck = this.createMainDeck();
  // Reset per-turn flags at new round start
  this.state.turnHasDrawn = false;
  this.state.turnUsedSideCard = false;

    // Per Pazaak rules, each round starts with each player drawing a card
    this.state.players.forEach(player => {
      if (this.state.mainDeck.length > 0) {
        const card = this.state.mainDeck.pop()!;
        player.hand.push(card);
        player.score = this.calculateScore(player);
        this.state.cardsDealtThisRound++;
      }
    });
  // First player still needs to draw this turn
  this.state.turnHasDrawn = false;
  this.state.turnUsedSideCard = false;

    return { ...this.state };
  }

  public getState(): GameState {
    return { ...this.state };
  }

  public getCurrentPlayer(): Player | undefined {
    return this.state.players[this.state.currentPlayerIndex];
  }
}

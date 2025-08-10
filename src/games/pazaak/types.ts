// Pazaak game types and interfaces

export interface PazaakCard {
  value: number; // 1-10 for main deck, varies for side deck
  isMainDeck: boolean;
  variant?: 'default' | 'side' | 'dual' | 'flip_2_4' | 'flip_3_6' | 'double' | 'tiebreaker' | 'variable' | 'special';
  id: string; // Unique identifier
}

export interface SideCard {
  value: number; // Can be positive, negative, or dual
  variant: 'positive' | 'negative' | 'dual' | 'flip_2_4' | 'flip_3_6' | 'double' | 'tiebreaker' | 'variable';
  isUsed: boolean;
  id: string;
  description?: string; // For special cards
  // For variable cards that can be different values
  alternateValue?: number; // For ±1/2 cards
  // For flip cards
  flipTargets?: number[]; // [2, 4] or [3, 6]
}

export interface Player {
  id: string;
  name: string;
  hand: PazaakCard[]; // Cards played this round (main deck + side cards used)
  sideCards: SideCard[]; // Full collection of available side cards
  selectedSideCards: SideCard[]; // 10 cards selected from collection for this game
  dealtSideCards: SideCard[]; // 4 cards dealt from selected side deck for this set
  score: number;
  sets: number; // Pazaak is best of 3 sets
  isStanding: boolean;
  isStartingPlayer?: boolean; // True only for the player who begins the current round
  tiebreaker?: boolean; // For tiebreaker card effects
}

export interface RoundResult {
  roundNumber: number;
  winnerId?: string; // undefined if tie/void
  isDraw: boolean;
  playerScores: { [playerId: string]: number };
  isVoid: boolean; // true if all players busted
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  mainDeck: PazaakCard[]; // Shared 40-card deck (+1 to +10, four of each)
  gamePhase: 'setup' | 'sideDeckSelection' | 'side-deck' | 'waitingToStart' | 'playing' | 'roundEnd' | 'gameEnd';
  winner?: Player;
  round: number;
  cardsDealtThisRound: number;
  roundResults: RoundResult[]; // Track history of round results
  startingPlayerId?: string; // Who started the current round (after coin flip / rotation)
  nextRoundStarterId?: string; // Precomputed who should start next round (dealer rotation)
  aiLastAction?: string; // Track AI's last action for display
  aiActionHistory?: string[]; // Track AI's recent actions for display
  actionHistory?: Array<{
    ts: number;            // epoch ms
    playerId: string;
    playerName: string;
    action: string;        // draw | side | stand | endTurn | bust | autoStand
    detail?: string;       // optional extra info (card values etc.)
    scoreAfter?: number;   // score after action
  }>;
  // Per-turn flags (support proper Pazaak flow: draw then optional side card then stand or end)
  turnHasDrawn?: boolean;
  turnUsedSideCard?: boolean;
}

export type GameAction = 
  | { type: 'SELECT_SIDE_CARDS'; playerId: string; cardIds: string[] }
  | { type: 'DEAL_CARD'; playerId: string }
  | { type: 'USE_SIDE_CARD'; playerId: string; cardId: string; modifier?: 'positive' | 'negative' }
  | { type: 'STAND'; playerId: string }
  | { type: 'FORFEIT'; playerId: string }
  | { type: 'END_TURN'; playerId: string }
  | { type: 'NEW_ROUND' }
  | { type: 'NEW_GAME' };

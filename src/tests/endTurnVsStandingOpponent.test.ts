import { describe, it, expect } from 'vitest';
import { PazaakGame } from '../games/pazaak/gameLogic';

function setupTwoPlayerGame(): PazaakGame {
  const game = new PazaakGame(['P1','P2']);
  // Select first 10 side cards for both players for simplicity
  const s1 = game.getState();
  const p1Deck = s1.players[0].sideCards.slice(0,10).map(c=>c.id);
  game.selectSideCards('player-0', p1Deck);
  const s2 = game.getState();
  const p2Deck = s2.players[1].sideCards.slice(0,10).map(c=>c.id);
  game.selectSideCards('player-1', p2Deck);
  return game;
}

describe('End Turn vs standing opponent should not prematurely end round', () => {
  it('player behind may end turn and continue drawing next cycle until stand/bust', () => {
    const game = setupTwoPlayerGame();
    const state = game.getState();
    const p1 = state.players[0];
    const p2 = state.players[1];
    // Simulate scores like screenshot: P1 = 12 (3,6,3) P2 = 19 (9,10)
    p1.hand = [
      {id:'a', value:3, isMainDeck:true},
      {id:'b', value:6, isMainDeck:true},
      {id:'c', value:3, isMainDeck:true}
    ];
    p1.score = 12; p1.isStanding = false;
    p2.hand = [
      {id:'d', value:9, isMainDeck:true},
      {id:'e', value:10, isMainDeck:true}
    ];
    p2.score = 19; p2.isStanding = true;

  // Force internal state turn (cannot rely on mutating shallow copy from getState)
  game._forceTurn(p1.id, true);

    // Player chooses to end turn instead of standing
    game.endTurn();
    const afterEnd = game.getState();
    expect(afterEnd.gamePhase).toBe('playing');
    expect(afterEnd.roundResults.length).toBe(0); // Round not ended
  // Turn should remain with player 0 because opponent is standing (retained turn logic)
  expect(afterEnd.currentPlayerIndex).toBe(0);
    expect(afterEnd.turnHasDrawn).toBe(false); // New turn so can draw again

  // Now player draws again on new turn; ensure still not forced end
  afterEnd.mainDeck.push({ id: 'forced-2', value: 2, isMainDeck: true, variant: 'default' });
  game.dealCard(p1.id);
    const afterDraw = game.getState();
    expect(afterDraw.players[0].hand.length).toBe(4);
    expect(afterDraw.gamePhase).toBe('playing');
  });
});

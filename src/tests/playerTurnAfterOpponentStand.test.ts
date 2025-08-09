import { describe, it, expect } from 'vitest';
import { PazaakGame } from '../games/pazaak/gameLogic';

function setupGame(): PazaakGame {
  const game = new PazaakGame(['Host', 'Guest']);
  const st = game.getState();
  const deckA = st.players[0].sideCards.slice(0, 10).map(c => c.id);
  game.selectSideCards('player-0', deckA);
  const st2 = game.getState();
  const deckB = st2.players[1].sideCards.slice(0, 10).map(c => c.id);
  game.selectSideCards('player-1', deckB);
  return game;
}

describe('Turn continuity when one player stands below 20', () => {
  it('other player should still be able to draw next turn', () => {
    const game = setupGame();
    const state = game.getState();
    const p0 = state.players[0];
    const p1 = state.players[1];
    // Give p0 score 18 (two cards) and p1 score 13 (two cards)
    p0.hand = [{id:'a', value:9, isMainDeck:true},{id:'b', value:9, isMainDeck:true}];
    p0.score = 18; p0.isStanding = false;
    p1.hand = [{id:'c', value:6, isMainDeck:true},{id:'d', value:7, isMainDeck:true}];
    p1.score = 13; p1.isStanding = false;
    state.currentPlayerIndex = 0; // p0 turn

    // p0 stands at 18
    game.stand(p0.id);
    const afterStand = game.getState();
    expect(afterStand.players[0].isStanding).toBe(true);
    expect(afterStand.players[1].isStanding).toBe(false);
    expect(afterStand.currentPlayerIndex).toBe(1);
    expect(afterStand.gamePhase).toBe('playing');

    // Simulate p1 drawing a card now; ensure turnHasDrawn is false so draw allowed
    const beforeDraw = game.getState();
    expect(beforeDraw.turnHasDrawn).toBe(false);
  // Control next card so it will not bust or auto-stand
  afterStand.mainDeck.push({ id: 'forced-2', value: 2, isMainDeck: true, variant: 'default' });
  game.dealCard(p1.id);
    const afterDraw = game.getState();
    expect(afterDraw.players[1].hand.length).toBe(3);
    expect(afterDraw.players[1].isStanding).toBe(false);
    // Action history should contain a stand then a draw
    const lastActions = afterDraw.actionHistory?.slice(-2).map(a => a.action) || [];
    expect(lastActions).toContain('stand');
    expect(lastActions).toContain('draw');
  });
});

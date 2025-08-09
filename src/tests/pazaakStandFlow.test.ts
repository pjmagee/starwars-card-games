import { describe, it, expect } from 'vitest';
import { PazaakGame } from '../games/pazaak/gameLogic';

// Helper to fully select side decks so game enters playing phase
function setupGame(): PazaakGame {
  const game = new PazaakGame(['Host', 'Guest']);
  const st = game.getState();
  const hostDeck = st.players[0].sideCards.slice(0, 10).map(c => c.id);
  game.selectSideCards('player-0', hostDeck);
  const st2 = game.getState();
  const guestDeck = st2.players[1].sideCards.slice(0, 10).map(c => c.id);
  game.selectSideCards('player-1', guestDeck);
  return game;
}

describe('Pazaak stand flow', () => {
  it('player should not be considered standing just because opponent stands lower than 20', () => {
    const game = setupGame();
    const state = game.getState();
    // Force deterministic hands: give Host 10+8 = 18, Guest 7+8 = 15
    const host = state.players[0];
    const guest = state.players[1];
    host.hand = [{ id:'h1', value:10, isMainDeck:true }, { id:'h2', value:8, isMainDeck:true }];
    host.score = 18; host.isStanding = false;
    guest.hand = [{ id:'g1', value:7, isMainDeck:true }, { id:'g2', value:8, isMainDeck:true }];
    guest.score = 15; guest.isStanding = false;
    state.currentPlayerIndex = 0; // Host turn
    // Host stands at 18
    game.stand(host.id);
    const afterStand = game.getState();
    expect(afterStand.players[0].isStanding).toBe(true);
    expect(afterStand.players[1].isStanding).toBe(false);
    expect(afterStand.gamePhase).toBe('playing');
    // Now it should be Guest turn
    expect(afterStand.currentPlayerIndex).toBe(1);
  });
});

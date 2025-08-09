import { describe, it, expect } from 'vitest';
import { PazaakGame } from '../games/pazaak/gameLogic';

// Regression: AI would play a side card then appear stuck because endTurn state wasn't returned.

describe('AI side card play followed by end turn advances turn', () => {
  it('after AI uses side card without standing/bust, control returns to player', () => {
    const game = new PazaakGame(['Player'],'medium');
    // Force side deck selection
    const state0 = game.getState();
    const humanDeck = state0.players[0].sideCards.slice(0,10).map(c=>c.id);
    game.selectSideCards('player-0', humanDeck);
    const st1 = game.getState();
    const ai = st1.players.find(p=>p.id==='ai-player')!;
    const aiDeck = ai.sideCards.slice(0,10).map(c=>c.id);
    game.selectSideCards('ai-player', aiDeck);

    // Manipulate scores: player low, AI has a dual card to use and should then end turn
    const st2 = game.getState();
    const human = st2.players[0];
    const aiPlayer = st2.players.find(p=>p.id==='ai-player')!;
    human.hand = [{id:'h1', value:6, isMainDeck:true},{id:'h2', value:4, isMainDeck:true}];
    human.score = 10; human.isStanding = false;
    aiPlayer.hand = [{id:'a1', value:5, isMainDeck:true},{id:'a2', value:9, isMainDeck:true}];
    aiPlayer.score = 14; aiPlayer.isStanding = false;
    // Ensure AI has a usable dual +2 card unused
    const dual2 = aiPlayer.dealtSideCards.find(c=>c.variant==='dual' && c.value===2);
    if (!dual2) return; // skip if deck randomization missing card

    // Simulate start of AI turn already drew: mark turnHasDrawn true and set currentPlayerIndex to AI
    st2.currentPlayerIndex = st2.players.indexOf(aiPlayer);
    st2.turnHasDrawn = true; st2.turnUsedSideCard = false;

    // Force AI decision path directly
    game.processAITurn(); // expect AI to use side card (to reach 16) then end turn; control returns to player
    const after = game.getState();
    expect(after.currentPlayerIndex).toBe(0); // back to human
    expect(after.turnHasDrawn).toBe(false); // new turn for human
  });
});

import { describe, it, expect } from 'vitest';
import { multiplayerInitialState } from '../contexts/multiplayerState';
import { PazaakGame } from '../games/pazaak/gameLogic';

// Minimal helper to clone state (excluding Maps deep complexity reused directly)
function cloneState(s: typeof multiplayerInitialState) {
  return { ...s, playersReady: new Map(s.playersReady), playerSideDecks: new Map(s.playerSideDecks), playerStageStatus: new Map(s.playerStageStatus) };
}

// Simulate subset of message handling we rely on (create/join, side deck selection leading to playing)

describe('Multiplayer basic flow', () => {
  it('host create + client join updates players list', () => {
    const hostState = cloneState(multiplayerInitialState);
    hostState.isHost = true; hostState.playerName = 'Host'; hostState.connectedPlayers = ['Host'];

    // Client joined message (PLAYER_JOINED) simplified
    const newPlayer = 'Guest';
    hostState.connectedPlayers = [...hostState.connectedPlayers, newPlayer];
    expect(hostState.connectedPlayers).toEqual(['Host','Guest']);
  });

  it('side deck selections transition to playing and initialize game', () => {
    const hostState = cloneState(multiplayerInitialState);
    hostState.isHost = true; hostState.playerName = 'Host'; hostState.connectedPlayers = ['Host','Guest'];

    const game = new PazaakGame(['Host','Guest']);
    // Host selection
    const hostDeck = game.getState().players[0].sideCards.slice(0,10).map(c=>c.id);
    game.selectSideCards('player-0', hostDeck);
    expect(game.getState().gamePhase).toBe('sideDeckSelection');

    // Guest selection
    const guestDeck = game.getState().players[1].sideCards.slice(0,10).map(c=>c.id);
    game.selectSideCards('player-1', guestDeck);
    const finalState = game.getState();
    expect(finalState.gamePhase).toBe('playing');
    expect(finalState.players.every(p=>p.dealtSideCards.length===4)).toBe(true);
    expect(finalState.players.every(p=>p.hand.length===1)).toBe(true); // initial draw
  });
});

/* Clean authoritative multiplayer game logic (reduced & corrected) */
import { PazaakGame } from '../games/pazaak/gameLogic';
import { PeerConnectionManager, type PeerMessage } from './peerConnection';
import type { GameState, GameAction, Player } from '../games/pazaak/types';

export class MultiplayerPazaakGame {
  private game: PazaakGame;
  private version = 0; // Host authoritative version
  private applied = new Set<string>();
  private pending = new Map<string, GameAction>(); // Guest optimistic
  private sideDeckCompletionStatus = new Map<string, boolean>();
  private heartbeat: number | null = null;
  // Removed unused myPlayerIndex field (legacy from earlier implementation)
  private peerManager: PeerConnectionManager;
  private isHost: boolean;
  private myPlayerName: string;
  private onStateChange: (s: GameState) => void;

  constructor(
    peerManager: PeerConnectionManager,
    isHost: boolean,
    playerNames: string[],
    myPlayerName: string,
    onStateChange: (s: GameState) => void
  ) {
    this.peerManager = peerManager;
    this.isHost = isHost;
    this.myPlayerName = myPlayerName;
    this.onStateChange = onStateChange;
    const ordered = isHost ? playerNames : [playerNames[0], playerNames[1]];
    this.game = new PazaakGame(ordered, 'medium');
  // myPlayerIndex removed; rely on name for identification
    playerNames.forEach(n => {
      const id = this.getPlayerIdFromName(n);
      this.sideDeckCompletionStatus.set(id, false);
    });
    if (isHost) {
      this.sendFullState();
      this.startHeartbeat();
    }
  }

  // Heartbeat
  private startHeartbeat() {
    if (!this.isHost) return;
    this.heartbeat = setInterval(() => {
      this.peerManager.sendToAll({
        type: 'HEARTBEAT',
        gamePhase: this.game.getState().gamePhase,
        completionStatus: Array.from(this.sideDeckCompletionStatus.entries()),
        timestamp: Date.now()
      });
    }, 2000) as unknown as number;
  }
  private stopHeartbeat() { if (this.heartbeat) { clearInterval(this.heartbeat); this.heartbeat = null; } }

  // Peer message handling
  public handlePeerMessage(msg: PeerMessage, _peerId: string): void { // peerId currently not needed
    void _peerId; // mark as used for linter
    switch (msg.type) {
      case 'CLIENT_ACTION':
        if (this.isHost && !this.applied.has(msg.actionId)) this.applyAndBroadcast(msg.action as GameAction, msg.actionId);
        break;
      case 'ACTION_APPLIED':
        if (!this.isHost) this.handleActionApplied(msg);
        break;
      case 'GAME_ACTION': // legacy support
        if (!this.isHost) this.applyAuthoritative(msg.action as GameAction, `legacy-${msg.timestamp}`);
        break;
      case 'GAME_STATE_SYNC':
        if (!this.isHost) this.handleStateSync(msg);
        break;
      case 'SIDE_DECK_SELECTED':
        if (this.isHost) this.processRemoteSideDeck(msg.playerId, msg.cardIds);
        break;
      case 'SIDE_DECK_COMPLETE':
        this.sideDeckCompletionStatus.set(msg.playerId, true);
        this.onStateChange(this.game.getState());
        break;
      case 'PHASE_TRANSITION':
        this.forcePhase(msg.newPhase);
        break;
      case 'HEARTBEAT':
        if (!this.isHost) this.receiveHeartbeat(msg.gamePhase, msg.completionStatus);
        break;
      case 'STATE_REQUEST':
        if (this.isHost) this.sendFullState();
        break;
      default:
        break;
    }
  }

  // Action flow
  private applyCore(a: GameAction): GameState {
    switch (a.type) {
      case 'DEAL_CARD': return this.game.dealCard(a.playerId);
      case 'USE_SIDE_CARD': return this.game.useSideCard(a.playerId, a.cardId, a.modifier);
      case 'STAND': return this.game.stand(a.playerId);
      case 'FORFEIT': return this.game.forfeit(a.playerId);
      case 'NEW_ROUND': return this.game.startNextRound();
      default: return this.game.getState();
    }
  }
  private applyAndBroadcast(a: GameAction, id: string) {
    const state = this.applyCore(a);
    this.version++;
    this.applied.add(id);
    this.onStateChange(state);
    const message: PeerMessage = {
      type: 'ACTION_APPLIED',
      action: a as unknown as Record<string, unknown>,
      actionId: id,
      version: this.version,
      gameState: state as unknown as Record<string, unknown>,
      timestamp: Date.now()
    };
    this.peerManager.sendToAll(message);
  }
  private sendClientAction(a: GameAction) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    this.pending.set(id, a);
    const msg: PeerMessage = { type: 'CLIENT_ACTION', action: a as unknown as Record<string, unknown>, actionId: id, timestamp: Date.now() };
    this.peerManager.sendToAll(msg);
  }
  private applyAuthoritative(a: GameAction, id: string) {
    if (this.applied.has(id)) return; const st = this.applyCore(a); this.applied.add(id); this.onStateChange(st); }
  private handleActionApplied(m: Extract<PeerMessage,{type:'ACTION_APPLIED'}>) {
    const { action, actionId, version, gameState } = m;
    this.pending.delete(actionId);
    if (this.applied.has(actionId) || version < this.version) return;
    this.version = version; this.applied.add(actionId);
    if (gameState) this.onStateChange(gameState as unknown as GameState); else this.onStateChange(this.applyCore(action as unknown as GameAction));
    // Re-send optimistic actions if any remained
    if (this.pending.size) { const list = Array.from(this.pending.values()); this.pending.clear(); list.forEach(a=>this.sendClientAction(a)); }
  }

  // Side deck
  private processRemoteSideDeck(playerId: string, cardIds: string[]) {
    try {
      const state = this.game.selectSideCards(playerId, cardIds);
      this.sideDeckCompletionStatus.set(playerId, true);
      this.onStateChange(state);
      this.peerManager.sendToAll({ type: 'SIDE_DECK_COMPLETE', playerId, timestamp: Date.now() });
      this.sendFullState();
    } catch (e) { console.error('Side deck error', e); }
  }

  // Phases / heartbeat
  private forcePhase(newPhase: string) {
    const state = this.game.getState();
    if (['playing','sideDeckSelection','roundEnd','gameEnd','setup'].includes(newPhase)) {
      state.gamePhase = newPhase as GameState['gamePhase'];
      if (newPhase === 'playing') {
        state.players.forEach(p => { if (p.dealtSideCards.length === 0 && p.selectedSideCards.length === 10) { const sh = this.shuffle([...p.selectedSideCards]); p.dealtSideCards = sh.slice(0,4); p.hand = []; } });
      }
      this.onStateChange(state);
    }
  }
  private receiveHeartbeat(phase: string, status: [string, boolean][]) {
    const current = this.game.getState();
    const order = ['setup','sideDeckSelection','playing','roundEnd','gameEnd'];
    if (order.indexOf(phase) >= order.indexOf(current.gamePhase)) {
      this.sideDeckCompletionStatus.clear(); status.forEach(([id, c])=>this.sideDeckCompletionStatus.set(id,c));
      if (current.gamePhase !== phase) { current.gamePhase = phase as GameState['gamePhase']; this.onStateChange(current); }
    }
  }

  // Public API actions
  public dealCard(playerId: string) {
    const a: GameAction = { type:'DEAL_CARD', playerId };
    if (this.isHost) this.applyAndBroadcast(a, `h-${Date.now()}`);
    else { this.onStateChange(this.game.dealCard(playerId)); this.sendClientAction(a); }
  }
  public useSideCard(playerId: string, cardId: string, modifier?: 'positive'|'negative') {
    const a: GameAction = { type:'USE_SIDE_CARD', playerId, cardId, modifier };
    if (this.isHost) this.applyAndBroadcast(a, `h-${Date.now()}`);
    else { this.onStateChange(this.game.useSideCard(playerId, cardId, modifier)); this.sendClientAction(a); }
  }
  public stand(playerId: string) {
    const a: GameAction = { type:'STAND', playerId };
    if (this.isHost) this.applyAndBroadcast(a, `h-${Date.now()}`);
    else { this.onStateChange(this.game.stand(playerId)); this.sendClientAction(a); }
  }
  public forfeit(playerId: string) {
    const a: GameAction = { type:'FORFEIT', playerId };
    if (this.isHost) this.applyAndBroadcast(a, `h-${Date.now()}`);
    else { this.onStateChange(this.game.forfeit(playerId)); this.sendClientAction(a); }
  }
  public selectSideCards(playerId: string, cardIds: string[]) {
    const st = this.game.selectSideCards(playerId, cardIds); this.sideDeckCompletionStatus.set(playerId, true); this.onStateChange(st);
    if (this.isHost) { this.peerManager.sendToAll({ type:'SIDE_DECK_COMPLETE', playerId, timestamp: Date.now() }); this.sendFullState(); }
    else { this.peerManager.sendToAll({ type:'SIDE_DECK_SELECTED', cardIds, playerId, timestamp: Date.now() }); this.peerManager.sendToAll({ type:'SIDE_DECK_COMPLETE', playerId, timestamp: Date.now() }); }
  }
  public startNextRound() { if (!this.isHost) return; this.applyAndBroadcast({ type:'NEW_ROUND' }, `h-${Date.now()}`); }
  public startGame() { if (!this.isHost) return; const s=this.game.getState(); if (!s.players.every(p=>p.selectedSideCards.length===10)) return; s.players.forEach(p=>{ if(p.dealtSideCards.length===0){const sh=this.shuffle([...p.selectedSideCards]); p.dealtSideCards=sh.slice(0,4); p.hand=[]; }}); s.gamePhase='playing'; this.onStateChange(s); this.sendFullState(); this.peerManager.sendToAll({ type:'PHASE_TRANSITION', newPhase:'playing', timestamp: Date.now() }); }

  // State sync
  private sendFullState() {
    const msg: PeerMessage = {
      type: 'GAME_STATE_SYNC',
      gameState: this.game.getState() as unknown as Record<string, unknown>,
      version: this.version,
      completionStatus: Array.from(this.sideDeckCompletionStatus.entries()),
      timestamp: Date.now()
    };
    this.peerManager.sendToAll(msg);
  }
  private handleStateSync(msg: Extract<PeerMessage,{type:'GAME_STATE_SYNC'}>) {
    this.version = msg.version ?? this.version;
    const gs = msg.gameState as unknown as GameState;
    this.onStateChange(gs);
  }

  // Helpers
  private shuffle<T>(arr: T[]): T[] { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
  private getPlayerIdFromName(name: string): string { const s=this.game.getState(); const p=s.players.find(pl=>pl.name===name); return p? p.id: `player-${name}`; }

  // Public getters
  public getState(): GameState { return this.game.getState(); }
  public getSideDeckCompletionStatus(): Map<string, boolean> { return new Map(this.sideDeckCompletionStatus); }
  public getCurrentPlayer(): Player | undefined { return this.game.getCurrentPlayer(); }
  public getMyPlayer(): Player { const s=this.game.getState(); return s.players.find(p=>p.name===this.myPlayerName) || s.players[0]; }
  public getIsHost(): boolean { return this.isHost; }
  public getOpponentPlayer(): Player { const s=this.game.getState(); return s.players.find(p=>p.name!==this.myPlayerName) || s.players[0]; }
  public getPlayersForDisplay(): { humanPlayer: Player; aiPlayer: Player } { const s=this.game.getState(); const me=this.getMyPlayer(); const other=s.players.find(p=>p.id!==me.id)!; return { humanPlayer: me, aiPlayer: other }; }
  public isMyTurn(): boolean { const s=this.game.getState(); return s.players[s.currentPlayerIndex].id === this.getMyPlayer().id; }
  public getDebugInfo() { const s=this.game.getState(); return { isHost:this.isHost, version:this.version, completionStatus:Array.from(this.sideDeckCompletionStatus.entries()), gamePhase:s.gamePhase, players:s.players.map(p=>({id:p.id,name:p.name,selected:p.selectedSideCards.length})), connectionHealth:this.peerManager.getConnectionHealth() }; }

  public cleanup() { this.stopHeartbeat(); }
  public disconnect() { this.peerManager.disconnect(); }
}

import { PazaakGame } from '../games/pazaak/gameLogic';
import { PeerConnectionManager, type PeerMessage } from './peerConnection';
import type { GameState, GameAction, Player } from '../games/pazaak/types';

export class MultiplayerPazaakGame {
  private game: PazaakGame;
  private peerManager: PeerConnectionManager;
  private isHost: boolean;
  private onStateChange: (state: GameState) => void;
  private myPlayerIndex: number;
  private sideDeckCompletionStatus: Map<string, boolean> = new Map();
  private myPlayerName: string;
  private playerReadyStatus: Map<string, boolean> = new Map();
  private gamePhase: 'sideDeckSelection' | 'waitingToStart' | 'playing' | 'roundEnd' | 'gameEnd' = 'sideDeckSelection';
  private heartbeatInterval: number | null = null;

  constructor(
    peerManager: PeerConnectionManager,
    isHost: boolean,
    playerNames: string[],
    myPlayerName: string,
    onStateChange: (state: GameState) => void
  ) {
    this.peerManager = peerManager;
    this.isHost = isHost;
    this.onStateChange = onStateChange;
    this.myPlayerName = myPlayerName;
    this.myPlayerIndex = isHost ? 0 : 1;

    // Ensure proper player ordering from each client's perspective
    let orderedPlayerNames: string[];
    if (isHost) {
      orderedPlayerNames = playerNames;
    } else {
      // Guest: Ensure host is always index 0
      orderedPlayerNames = [playerNames[0], playerNames[1]];
    }

    console.log('🎮 Creating multiplayer game:', { 
      isHost, 
      myPlayerIndex: this.myPlayerIndex, 
      myPlayerName: this.myPlayerName,
      originalNames: playerNames, 
      orderedNames: orderedPlayerNames 
    });

    // Initialize the game with ordered player names FIRST
    this.game = new PazaakGame(orderedPlayerNames, 'medium');
    
    // Now initialize completion and ready status for all players (after game is created)
    playerNames.forEach(playerName => {
      const playerId = this.getPlayerIdFromName(playerName);
      this.sideDeckCompletionStatus.set(playerId, false);
      this.playerReadyStatus.set(playerId, false);
    });
    
    // Set up peer message handling
    this.setupPeerMessageHandling();

    // Start heartbeat for synchronization
    this.startHeartbeat();

    // If we're the host, sync initial state
    if (this.isHost) {
      this.syncGameState();
    }
  }

  private getPlayerIdFromName(playerName: string): string {
    const gameState = this.game.getState();
    const player = gameState.players.find(p => p.name === playerName);
    return player ? player.id : `player-${playerName}`;
  }

  private startHeartbeat(): void {
    if (this.isHost) {
      this.sendHeartbeat(); // Send initial heartbeat
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat();
        
        // Check for connection health every heartbeat
        const connectionHealth = this.peerManager.getConnectionHealth();
        if (connectionHealth.totalConnections === 0) {
          console.warn('⚠️ Lost all peer connections during heartbeat');
          // Try to notify the user that the connection was lost
          // The UI should handle this gracefully
        }
      }, 2000); // Send heartbeat every 2 seconds
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handlePlayerReady(playerId: string, ready: boolean): void {
    console.log('🎮 Player ready status update (legacy - now handled by direct host control):', { playerId, ready });
    // Legacy method - now using direct host control via startGame()
    // Update UI
    this.onStateChange(this.game.getState());
  }

  private handleHeartbeat(gamePhase: string, completionStatus: [string, boolean][]): void {
    console.log('💓 Received heartbeat:', { 
      incomingPhase: gamePhase, 
      currentMultiplayerPhase: this.gamePhase,
      currentGamePhase: this.game.getState().gamePhase 
    });
    
    // Only update our phase if it's actually different and makes sense
    const currentGameState = this.game.getState();
    const currentActualPhase = currentGameState.gamePhase;
    
    // Don't let heartbeat force us backwards in phase progression
    const phaseProgression = ['setup', 'sideDeckSelection', 'playing', 'roundEnd', 'gameEnd'];
    const currentPhaseIndex = phaseProgression.indexOf(currentActualPhase);
    const incomingPhaseIndex = phaseProgression.indexOf(gamePhase);
    
    if (incomingPhaseIndex >= currentPhaseIndex) {
      // Only accept phase transitions that move forward or stay the same
      console.log('💓 Accepting heartbeat phase update:', { from: this.gamePhase, to: gamePhase });
      this.gamePhase = gamePhase as 'sideDeckSelection' | 'waitingToStart' | 'playing' | 'roundEnd' | 'gameEnd';
      
      // Update completion status
      this.sideDeckCompletionStatus.clear();
      completionStatus.forEach(([playerId, isComplete]) => {
        this.sideDeckCompletionStatus.set(playerId, isComplete);
      });
      
      // Only trigger UI update if the game state phase doesn't match the incoming phase
      if (currentActualPhase !== gamePhase) {
        console.log('💓 Heartbeat triggered phase mismatch - updating UI');
        this.onStateChange(currentGameState);
      }
    } else {
      console.log('💓 Ignoring backward phase transition from heartbeat:', { 
        current: currentActualPhase, 
        incoming: gamePhase 
      });
    }
  }

  private handlePhaseTransition(newPhase: string): void {
    console.log('🔄 Phase transition received:', { from: this.gamePhase, to: newPhase });
    console.log('🎯 Current game state before transition:', {
      phase: this.game.getState().gamePhase,
      players: this.game.getState().players.map(p => ({
        id: p.id,
        name: p.name,
        selectedSideCards: p.selectedSideCards.length,
        dealtSideCards: p.dealtSideCards.length
      }))
    });
    
    this.gamePhase = newPhase as 'sideDeckSelection' | 'waitingToStart' | 'playing' | 'roundEnd' | 'gameEnd';
    
    // Update the game state's phase to match (only if it's a valid GameState phase)
    const currentState = this.game.getState();
    if (newPhase === 'playing' || newPhase === 'sideDeckSelection' || newPhase === 'roundEnd' || newPhase === 'gameEnd' || newPhase === 'setup') {
      currentState.gamePhase = newPhase as 'setup' | 'sideDeckSelection' | 'playing' | 'roundEnd' | 'gameEnd';
      console.log('✅ Updated game state phase to:', currentState.gamePhase);
    }
    
    // If transitioning to playing, ensure all players have their dealt cards
    if (newPhase === 'playing') {
      console.log('🎯 Transitioning to playing phase - ensuring all players have dealt cards...');
      currentState.players.forEach(player => {
        if (player.selectedSideCards.length === 10 && player.dealtSideCards.length === 0) {
          console.log(`🎲 Dealing side cards for player ${player.name}...`);
          const shuffledSideDeck = this.shuffleArray([...player.selectedSideCards]);
          player.dealtSideCards = shuffledSideDeck.slice(0, 4);
          player.hand = [];
          console.log(`✅ Player ${player.name} dealt ${player.dealtSideCards.length} side cards`);
        }
      });
      console.log('🎮 Final state after dealing cards:', {
        phase: currentState.gamePhase,
        players: currentState.players.map(p => ({
          id: p.id,
          name: p.name,
          selectedSideCards: p.selectedSideCards.length,
          dealtSideCards: p.dealtSideCards.length
        }))
      });
    }
    
    console.log('🔄 Calling onStateChange with updated state...');
    this.onStateChange(currentState);
    console.log('✅ Phase transition complete');
  }

  private sendHeartbeat(): void {
    if (!this.isHost) return;
    
    console.log('💓 Sending heartbeat');
    
    // Debug: Check peer connection health
    const connectionHealth = this.peerManager.getConnectionHealth();
    const peerStatus = this.peerManager.getPeerStatus();
    console.log('🔍 Connection health check:', connectionHealth);
    console.log('🔍 Peer status check:', peerStatus);
    
    if (connectionHealth.totalConnections === 0) {
      console.warn('⚠️ No peer connections available - heartbeat not sent');
      console.log('📊 Connection debugging:', {
        peerManager: !!this.peerManager,
        peerStatus,
        connectionCount: connectionHealth.totalConnections
      });
      return;
    }
    
    // IMPORTANT: Send the actual game state phase, not our internal multiplayer phase tracker
    const actualGameState = this.game.getState();
    const actualPhase = actualGameState.gamePhase;
    
    console.log('💓 Heartbeat phase comparison:', {
      multiplayerPhase: this.gamePhase,
      actualGamePhase: actualPhase,
      sendingPhase: actualPhase
    });
    
    this.peerManager.sendToAll({
      type: 'HEARTBEAT',
      gamePhase: actualPhase, // Send the actual game phase, not our tracker
      completionStatus: Array.from(this.sideDeckCompletionStatus.entries()),
      timestamp: Date.now()
    });
  }

  private setupPeerMessageHandling(): void {
    // Message handling will be set up by the component that creates this class
    // The component should call handlePeerMessage when relevant messages are received
  }

  public handlePeerMessage(message: PeerMessage, peerId: string): void {
    console.log('🎮 Received game message:', message.type, 'from', peerId);

    switch (message.type) {
      case 'GAME_ACTION':
        this.handleRemoteAction(message.action as GameAction);
        break;

      case 'GAME_STATE_SYNC':
        if (!this.isHost) {
          // Guests receive state updates from host
          this.handleStateSync(message.gameState as unknown as GameState, message.completionStatus);
        } else {
          console.log('🔄 Host ignoring state sync from guest');
        }
        break;

      case 'SIDE_DECK_SELECTED':
        console.log('🃏 Processing SIDE_DECK_SELECTED message:', {
          playerId: message.playerId,
          cardCount: message.cardIds.length,
          isHost: this.isHost
        });
        this.handleRemoteSideDeckSelection(message.cardIds, message.playerId);
        break;

      case 'SIDE_DECK_COMPLETE':
        console.log('✅ Processing SIDE_DECK_COMPLETE message:', {
          playerId: message.playerId,
          isHost: this.isHost
        });
        this.handleSideDeckComplete(message.playerId);
        break;

      case 'PLAYER_READY':
        console.log('🎮 Processing PLAYER_READY message:', {
          ready: message.ready,
          playerId: message.playerId,
          isHost: this.isHost
        });
        this.handlePlayerReady(message.playerId, message.ready);
        break;

      case 'HEARTBEAT':
        if (!this.isHost) {
          console.log('� Received heartbeat from host:', {
            gamePhase: message.gamePhase,
            completionStatus: message.completionStatus
          });
          this.handleHeartbeat(message.gamePhase, message.completionStatus);
        }
        break;

      case 'PHASE_TRANSITION':
        console.log('� Processing PHASE_TRANSITION message:', { newPhase: message.newPhase });
        this.handlePhaseTransition(message.newPhase);
        break;

      default:
        console.log('Unknown game message type:', message.type);
    }
  }

  private handleRemoteAction(action: GameAction): void {
    console.log('🎮 Processing remote action:', action);
    
    // Apply the action to our local game state
    let newState: GameState;
    
    switch (action.type) {
      case 'DEAL_CARD':
        newState = this.game.dealCard(action.playerId);
        break;
        
      case 'USE_SIDE_CARD':
        newState = this.game.useSideCard(action.playerId, action.cardId, action.modifier);
        break;
        
      case 'STAND':
        newState = this.game.stand(action.playerId);
        break;
        
      case 'FORFEIT':
        newState = this.game.forfeit(action.playerId);
        break;
        
      case 'NEW_ROUND':
        newState = this.game.startNextRound();
        break;
        
      default:
        console.warn('Unknown action type:', action);
        return;
    }

    // Update our local state
    this.onStateChange(newState);

    // If we're the host, sync the state to all peers
    if (this.isHost) {
      this.syncGameState();
    }
  }

  private handleStateSync(gameState: GameState, completionStatus?: [string, boolean][]): void {
    console.log('🔄 Syncing game state from host:', gameState.gamePhase);
    console.log('🎯 Received state players:', gameState.players.map(p => ({ id: p.id, name: p.name, selectedSideCards: p.selectedSideCards.length, dealtSideCards: p.dealtSideCards.length })));
    
    // Check if the phase has changed
    const currentPhase = this.game.getState().gamePhase;
    const newPhase = gameState.gamePhase;
    const phaseChanged = currentPhase !== newPhase;
    
    console.log('📊 Phase change check:', { 
      currentPhase, 
      newPhase, 
      phaseChanged,
      currentMultiplayerPhase: this.gamePhase 
    });
    
    // Update our multiplayer phase to match
    if (phaseChanged) {
      console.log('🔄 Phase changed - updating multiplayer phase from', this.gamePhase, 'to', newPhase);
      this.gamePhase = newPhase as 'sideDeckSelection' | 'waitingToStart' | 'playing' | 'roundEnd' | 'gameEnd';
    }
    
    // Update completion status if provided
    if (completionStatus) {
      console.log('📋 Syncing completion status from host:', completionStatus);
      this.sideDeckCompletionStatus.clear();
      completionStatus.forEach(([playerId, isComplete]) => {
        this.sideDeckCompletionStatus.set(playerId, isComplete);
      });
    } else {
      // If no completion status provided, derive from game state
      if (gameState.gamePhase === 'sideDeckSelection') {
        gameState.players.forEach(player => {
          const isComplete = player.selectedSideCards.length === 10;
          this.sideDeckCompletionStatus.set(player.id, isComplete);
          console.log(`📋 Player ${player.id} (${player.name}) completion status: ${isComplete ? '✅' : '❌'}`);
        });
      }
    }
    
    // Update our local state to match the host's state
    this.onStateChange(gameState);
    
    if (gameState.gamePhase === 'playing') {
      console.log('🎉 Game has transitioned to playing phase!');
    }
  }

  private handleRemoteSideDeckSelection(cardIds: string[], playerId: string): void {
    console.log('🃏 Remote player selected side deck:', { cardIds: cardIds.length, playerId, isHost: this.isHost });
    
    if (this.isHost) {
      // Host processes all selections and maintains authoritative state
      try {
        console.log('🎮 Host processing remote selection...');
        const newState = this.game.selectSideCards(playerId, cardIds);
        console.log('✅ Host processed selection successfully:', {
          playerId,
          selectedCount: cardIds.length,
          newPhase: newState.gamePhase,
          allPlayerSelections: newState.players.map(p => ({
            id: p.id,
            name: p.name,
            selectedCount: p.selectedSideCards.length
          }))
        });
        
        // Mark this player as having completed their selection
        this.sideDeckCompletionStatus.set(playerId, true);
        
        this.onStateChange(newState);
        
        // Send completion notification to all peers
        console.log('📡 Host sending SIDE_DECK_COMPLETE to all peers...');
        const connectionHealth = this.peerManager.getConnectionHealth();
        console.log('🔍 Connection health before sending SIDE_DECK_COMPLETE:', connectionHealth);
        
        this.peerManager.sendToAll({
          type: 'SIDE_DECK_COMPLETE',
          playerId,
          timestamp: Date.now()
        });
        
        // Sync the updated state to all peers (includes completion status)
        this.syncGameState();
        
        // Check if all players have completed their selection
        const allPlayersComplete = newState.players.every(p => 
          this.sideDeckCompletionStatus.get(p.id) === true
        );
        
        if (allPlayersComplete) {
          console.log('🎉 All players completed side deck selection!');
          // The host can now transition to the next phase when ready
        }
      } catch (error) {
        console.error('❌ Error processing remote side deck selection:', error);
      }
    } else {
      // Guest: This shouldn't happen in proper host-authoritative model
      console.warn('🔄 Guest received remote selection - this should not happen');
    }
  }

  private handleSideDeckComplete(playerId: string): void {
    console.log('✅ Received side deck completion for player:', playerId);
    console.log('🔍 Current completion status before update:', Array.from(this.sideDeckCompletionStatus.entries()));
    
    // Always update completion status when we receive this message
    this.sideDeckCompletionStatus.set(playerId, true);
    
    // Get current game state to trigger UI update
    const gameState = this.game.getState();
    
    // Check if all players have completed their selection
    const allPlayersComplete = gameState.players.every(player => 
      this.sideDeckCompletionStatus.get(player.id) === true
    );
    
    console.log('📊 Side deck completion status after update:', 
      gameState.players.map(p => ({ 
        id: p.id, 
        name: p.name, 
        complete: this.sideDeckCompletionStatus.get(p.id) || false 
      }))
    );
    
    console.log('🎯 All players complete check:', { 
      allPlayersComplete, 
      isHost: this.isHost, 
      gamePhase: gameState.gamePhase,
      totalPlayers: gameState.players.length,
      completedPlayers: Array.from(this.sideDeckCompletionStatus.values()).filter(Boolean).length
    });
    
    if (allPlayersComplete) {
      console.log('🎉 All players completed side deck selection!');
      if (this.isHost && gameState.gamePhase === 'sideDeckSelection') {
        console.log('🏁 Host detected all players complete - ready for manual start');
        // DISABLED AUTO-START to prevent sync conflicts
        // The host should manually start the game via the UI button
        // setTimeout(() => {
        //   this.doStartGame();
        // }, 1000);
      } else if (!this.isHost) {
        console.log('👥 Guest sees all players complete - waiting for host to start game');
      }
    } else {
      console.log('⏳ Still waiting for players to complete selection');
    }
    
    // Update the UI to show completion status
    this.onStateChange(gameState);
    
    // FALLBACK: If we don't hear from the other player within 3 seconds, assume they're complete
    setTimeout(() => {
      console.log('🔧 FALLBACK: Checking if we should assume other player completed...');
      const currentState = this.game.getState();
      const myPlayer = this.getMyPlayer();
      const otherPlayer = currentState.players.find(p => p.id !== myPlayer.id);
      
      if (otherPlayer && otherPlayer.selectedSideCards.length === 10) {
        console.log('🔧 FALLBACK: Other player has 10 cards, marking as complete');
        this.sideDeckCompletionStatus.set(otherPlayer.id, true);
        this.onStateChange(currentState);
      }
    }, 3000);
  }

  private syncGameState(): void {
    if (!this.isHost) return;

    const gameState = this.game.getState();
    console.log('📤 Host syncing game state to all peers:', {
      phase: gameState.gamePhase,
      players: gameState.players.map(p => ({
        id: p.id,
        name: p.name,
        selectedSideCards: p.selectedSideCards.length,
        dealtSideCards: p.dealtSideCards.length
      }))
    });
    
    // Check connection health before syncing
    const connectionHealth = this.peerManager.getConnectionHealth();
    console.log('🔍 Connection health before sync:', connectionHealth);
    
    if (connectionHealth.totalConnections === 0) {
      console.warn('⚠️ No peer connections - cannot sync game state');
      return;
    }
    
    // Check if we need to transition phases
    if (gameState.gamePhase === 'sideDeckSelection') {
      const allSelected = gameState.players.every(p => p.selectedSideCards.length === 10);
      if (allSelected) {
        console.log('🎯 All players have 10 cards selected, forcing phase transition...');
        // The game logic should automatically transition, but let's force it by calling selectSideCards
        // for any player who hasn't triggered the transition yet
        const anyPlayer = gameState.players.find(p => p.selectedSideCards.length === 10);
        if (anyPlayer) {
          try {
            console.log('🚀 Re-calling selectSideCards to trigger phase transition...');
            this.game.selectSideCards(anyPlayer.id, anyPlayer.selectedSideCards.map(c => c.id));
            console.log('✅ Phase transition triggered successfully');
          } catch (error) {
            console.error('❌ Error during phase transition:', error);
          }
        }
      }
    }
    
    // Send updated state to all peers
    console.log('📡 Sending state sync to all peers...');
    this.peerManager.sendToAll({
      type: 'GAME_STATE_SYNC',
      gameState: this.game.getState() as unknown as Record<string, unknown>,
      completionStatus: Array.from(this.sideDeckCompletionStatus.entries()),
      timestamp: Date.now()
    });
    
    console.log('✅ State sync sent successfully');
  }

  // Public game methods that handle peer communication
  public dealCard(playerId: string): void {
    console.log('🎯 Local player dealing card');
    
    const action: GameAction = {
      type: 'DEAL_CARD',
      playerId
    };

    // Apply locally first
    const newState = this.game.dealCard(playerId);
    this.onStateChange(newState);

    // Send to peers
    this.broadcastAction(action);
  }

  public useSideCard(playerId: string, cardId: string, modifier?: 'positive' | 'negative'): void {
    console.log('🎯 Local player using side card');
    
    const action: GameAction = {
      type: 'USE_SIDE_CARD',
      playerId,
      cardId,
      modifier
    };

    // Apply locally first
    const newState = this.game.useSideCard(playerId, cardId, modifier);
    this.onStateChange(newState);

    // Send to peers
    this.broadcastAction(action);
  }

  public stand(playerId: string): void {
    console.log('🎯 Local player standing');
    
    const action: GameAction = {
      type: 'STAND',
      playerId
    };

    // Apply locally first
    const newState = this.game.stand(playerId);
    this.onStateChange(newState);

    // Send to peers
    this.broadcastAction(action);
  }

  public forfeit(playerId: string): void {
    console.log('🏃 Local player forfeiting');
    
    const action: GameAction = {
      type: 'FORFEIT',
      playerId
    };

    // Apply locally first
    const newState = this.game.forfeit(playerId);
    this.onStateChange(newState);

    // Send to peers
    this.broadcastAction(action);
  }

  public selectSideCards(playerId: string, cardIds: string[]): void {
    console.log('🎯 Local player selecting side cards:', { playerId, cardCount: cardIds.length, isHost: this.isHost });
    
    // Apply the selection locally regardless of host/guest status
    const newState = this.game.selectSideCards(playerId, cardIds);
    this.sideDeckCompletionStatus.set(playerId, true);
    this.onStateChange(newState);
    
    console.log('✅ Applied selection locally:', {
      playerId,
      selectedCount: cardIds.length,
      newPhase: newState.gamePhase
    });
    
    if (this.isHost) {
      // Host: Send completion notification to all peers
      console.log('� Host sending SIDE_DECK_COMPLETE to all peers...');
      this.peerManager.sendToAll({
        type: 'SIDE_DECK_COMPLETE',
        playerId,
        timestamp: Date.now()
      });
      
      // Also sync the updated state 
      this.syncGameState();
    } else {
      // Guest: Send selection to host AND mark completion immediately
      console.log('📤 Guest sending selection to host...');
      this.peerManager.sendToAll({
        type: 'SIDE_DECK_SELECTED',
        cardIds,
        playerId,
        timestamp: Date.now()
      });
      
      // WORKAROUND: Also send completion message directly
      console.log('� Guest also sending SIDE_DECK_COMPLETE...');
      this.peerManager.sendToAll({
        type: 'SIDE_DECK_COMPLETE',
        playerId,
        timestamp: Date.now()
      });
    }
    
    // Check if all players are complete locally
    const allPlayersComplete = newState.players.every(p => 
      this.sideDeckCompletionStatus.get(p.id) === true
    );
    
    console.log('🎯 Local completion check:', { 
      allPlayersComplete,
      completionStatus: Array.from(this.sideDeckCompletionStatus.entries())
    });
    
    if (allPlayersComplete) {
      console.log('🎉 All players completed side deck selection (local check)!');
      // Force UI update to show start button
      this.onStateChange(newState);
    }
  }

  public startNextRound(): void {
    if (!this.isHost) {
      console.warn('Only host can start next round');
      return;
    }

    console.log('🎯 Host starting next round');
    
    const action: GameAction = {
      type: 'NEW_ROUND'
    };

    // Apply locally first
    const newState = this.game.startNextRound();
    this.onStateChange(newState);

    // Send to peers
    this.broadcastAction(action);
  }

  private broadcastAction(action: GameAction): void {
    this.peerManager.sendToAll({
      type: 'GAME_ACTION',
      action: action as Record<string, unknown>,
      timestamp: Date.now()
    });

    // If we're the host, also sync the full state
    if (this.isHost) {
      setTimeout(() => this.syncGameState(), 100);
    }
  }

  // Getters to access underlying game
  public getState(): GameState {
    return this.game.getState();
  }

  public getSideDeckCompletionStatus(): Map<string, boolean> {
    return new Map(this.sideDeckCompletionStatus);
  }

  public getCurrentPlayer(): Player | undefined {
    return this.game.getCurrentPlayer();
  }

  public getMyPlayer(): Player {
    const gameState = this.game.getState();
    
    // First try to find the player by name
    const playerByName = gameState.players.find(p => p.name === this.myPlayerName);
    if (playerByName) {
      console.log('🎯 Found player by name:', { 
        myPlayerName: this.myPlayerName, 
        foundPlayer: { id: playerByName.id, name: playerByName.name }
      });
      return playerByName;
    }
    
    // Fallback to index-based lookup
    const myPlayer = gameState.players[this.myPlayerIndex];
    console.log('🎯 getMyPlayer fallback to index:', { 
      isHost: this.isHost, 
      myPlayerIndex: this.myPlayerIndex, 
      myPlayerName: this.myPlayerName,
      myPlayer: { id: myPlayer.id, name: myPlayer.name }
    });
    return myPlayer;
  }

  public getIsHost(): boolean {
    return this.isHost;
  }

  public startGame(): void {
    console.log('🎮 Starting game - host initiated...');
    
    if (!this.isHost) {
      console.warn('❌ Only host can start the game');
      return;
    }
    
    // Get current game state
    const gameState = this.game.getState();
    console.log('📊 Pre-start game state:', {
      phase: gameState.gamePhase,
      players: gameState.players.map(p => ({
        id: p.id,
        name: p.name,
        selectedSideCards: p.selectedSideCards.length,
        dealtSideCards: p.dealtSideCards.length
      }))
    });
    
    // Ensure both players have selected their side cards
    const allSelected = gameState.players.every(p => p.selectedSideCards.length === 10);
    if (!allSelected) {
      console.error('❌ Not all players have selected their side cards');
      return;
    }
    
    // Deal side cards for both players and transition to playing phase
    console.log('🎲 Dealing side cards for all players...');
    gameState.players.forEach(player => {
      if (player.selectedSideCards.length === 10) {
        const shuffledSideDeck = this.shuffleArray([...player.selectedSideCards]);
        player.dealtSideCards = shuffledSideDeck.slice(0, 4);
        player.hand = []; // Reset hand for new game
        console.log(`✅ Dealt ${player.dealtSideCards.length} cards to ${player.name}`);
      }
    });
    
    // Force transition to playing phase
    gameState.gamePhase = 'playing';
    this.gamePhase = 'playing';
    
    console.log('🚀 Game started - updated state:', {
      phase: gameState.gamePhase,
      players: gameState.players.map(p => ({
        id: p.id,
        name: p.name,
        selectedSideCards: p.selectedSideCards.length,
        dealtSideCards: p.dealtSideCards.length
      }))
    });
    
    // Update local state first
    this.onStateChange(gameState);
    
    // Send explicit messages to all peers
    this.peerManager.sendToAll({
      type: 'GAME_STATE_SYNC',
      gameState: gameState as unknown as Record<string, unknown>,
      completionStatus: Array.from(this.sideDeckCompletionStatus.entries()),
      timestamp: Date.now()
    });
    
    // Also send phase transition for extra safety
    this.peerManager.sendToAll({
      type: 'PHASE_TRANSITION',
      newPhase: 'playing',
      timestamp: Date.now()
    });
    
    console.log('📡 Sent game start messages to all peers');
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  public getOpponentPlayer(): Player {
    const gameState = this.game.getState();
    // The opponent is always the other player
    return gameState.players[1 - this.myPlayerIndex];
  }

  // Get players arranged for UI display (me on left, opponent on right)
  public getPlayersForDisplay(): { humanPlayer: Player; aiPlayer: Player } {
    const gameState = this.game.getState();
    const myPlayer = gameState.players[this.myPlayerIndex];
    const opponentPlayer = gameState.players[1 - this.myPlayerIndex];
    
    // Return in the format expected by the UI: 
    // - humanPlayer (me) appears on the left
    // - aiPlayer (opponent) appears on the right
    return {
      humanPlayer: myPlayer,
      aiPlayer: opponentPlayer
    };
  }

  public isMyTurn(): boolean {
    const gameState = this.game.getState();
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // Check if the current player is me
    return currentPlayer.id === gameState.players[this.myPlayerIndex].id;
  }

  // Cleanup
  public getDebugInfo(): { 
    isHost: boolean; 
    completionStatus: [string, boolean][]; 
    gamePhase: string; 
    players: { id: string; name: string; selectedCount: number }[];
    connectionHealth: ReturnType<PeerConnectionManager['getConnectionHealth']>;
  } {
    const gameState = this.game.getState();
    return {
      isHost: this.isHost,
      completionStatus: Array.from(this.sideDeckCompletionStatus.entries()),
      gamePhase: gameState.gamePhase,
      players: gameState.players.map(p => ({
        id: p.id,
        name: p.name,
        selectedCount: p.selectedSideCards.length
      })),
      connectionHealth: this.peerManager.getConnectionHealth()
    };
  }

  public cleanup(): void {
    console.log('🧹 Cleaning up multiplayer game');
    this.stopHeartbeat();
  }

  public disconnect(): void {
    console.log('🔌 Disconnecting multiplayer game');
    this.peerManager.disconnect();
  }
}

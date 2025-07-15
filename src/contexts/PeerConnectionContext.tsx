import React, { createContext, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { PeerConnectionManager } from '../utils/peerConnection';
import type { PeerConnectionOptions } from '../utils/peerConnection';

interface PeerConnectionContextType {
  peerManager: PeerConnectionManager | null;
  initializePeerManager: (options: PeerConnectionOptions) => PeerConnectionManager;
  resetPeerManager: () => void;
}

const PeerConnectionContext = createContext<PeerConnectionContextType | undefined>(undefined);

export const PeerConnectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const peerManagerRef = useRef<PeerConnectionManager | null>(null);
  const [, forceUpdate] = useState({});

  const initializePeerManager = (options: PeerConnectionOptions) => {
    // Always create a fresh connection for better reliability
    if (peerManagerRef.current) {
      console.log('� Cleaning up existing PeerConnectionManager...');
      peerManagerRef.current.disconnect();
      peerManagerRef.current = null;
    }
    
    console.log('� Creating fresh PeerConnectionManager...');
    peerManagerRef.current = new PeerConnectionManager(options);
    forceUpdate({}); // Force re-render to update components using this context
    
    return peerManagerRef.current;
  };

  const resetPeerManager = () => {
    console.log('🧹 Resetting PeerConnectionManager...');
    if (peerManagerRef.current) {
      peerManagerRef.current.disconnect();
      peerManagerRef.current = null;
      forceUpdate({});
    }
  };

  const value = {
    peerManager: peerManagerRef.current,
    initializePeerManager,
    resetPeerManager,
  };

  return (
    <PeerConnectionContext.Provider value={value}>
      {children}
    </PeerConnectionContext.Provider>
  );
};

export const usePeerConnection = (): PeerConnectionContextType => {
  const context = useContext(PeerConnectionContext);
  if (context === undefined) {
    throw new Error('usePeerConnection must be used within a PeerConnectionProvider');
  }
  return context;
};

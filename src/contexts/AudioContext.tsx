'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAudioManager } from '@/hooks/useAudioManager';

interface AudioContextValue {
  playAudio: (url: string) => Promise<void>;
  stopAudio: () => void;
  isPlaying: boolean;
  isUnlocked: boolean;
  unlockAudio: () => Promise<void>;
}

const AudioContext = createContext<AudioContextValue | undefined>(undefined);

interface AudioProviderProps {
  children: ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  const audioManager = useAudioManager();

  return (
    <AudioContext.Provider value={audioManager}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
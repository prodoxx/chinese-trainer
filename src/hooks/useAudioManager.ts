'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

interface UseAudioManagerReturn {
  playAudio: (url: string) => Promise<void>;
  stopAudio: () => void;
  isPlaying: boolean;
  isUnlocked: boolean;
  unlockAudio: () => Promise<void>;
}

/**
 * Custom hook for managing audio playback with iOS compatibility
 * Handles audio unlocking, reusable audio element, and proper cleanup
 */
export function useAudioManager(): UseAudioManagerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Initialize audio element on mount
  useEffect(() => {
    // Create a single audio element to reuse
    const audio = new Audio();
    
    // Pre-configure audio for iOS
    audio.preload = 'auto';
    // Remove crossOrigin for now as it might conflict with CORS
    // audio.crossOrigin = 'anonymous';
    audio.volume = 1.0;
    
    // Add to DOM for iOS (hidden)
    audio.style.display = 'none';
    document.body.appendChild(audio);
    
    // Event handlers
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
    };
    
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    audioRef.current = audio;
    
    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.removeEventListener('error', handleError);
        audioRef.current.pause();
        
        // Clean up blob URL if any
        if (audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        
        audioRef.current.src = '';
        
        // Remove from DOM
        if (audioRef.current.parentNode) {
          audioRef.current.parentNode.removeChild(audioRef.current);
        }
        audioRef.current = null;
      }
    };
  }, []);

  // Unlock audio on first user interaction (for iOS)
  const unlockAudio = useCallback(async (): Promise<void> => {
    if (isUnlocked || !audioRef.current) return;
    
    try {
      // Play silent audio to unlock
      // This is a tiny silent WAV file
      audioRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT......';
      await audioRef.current.play();
      setIsUnlocked(true);
      console.log('Audio unlocked for iOS');
    } catch (error) {
      console.log('Audio unlock failed - will try on next interaction');
    }
  }, [isUnlocked]);

  // Play audio with proper error handling
  const playAudio = useCallback(async (url: string): Promise<void> => {
    if (!audioRef.current || !url) return;
    
    try {
      // Stop any currently playing audio
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
      // If the URL is an API endpoint, fetch it with credentials
      if (url.startsWith('/api/')) {
        try {
          const response = await fetch(url, {
            credentials: 'include' // Include cookies for authentication
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch audio: ${response.status}`);
          }
          
          // Create blob URL from the response
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          
          // Clean up previous blob URL if any
          if (audioRef.current.src.startsWith('blob:')) {
            URL.revokeObjectURL(audioRef.current.src);
          }
          
          audioRef.current.src = blobUrl;
        } catch (fetchError) {
          console.error('Failed to fetch audio file:', fetchError);
          throw fetchError;
        }
      } else {
        // For external URLs, use directly
        audioRef.current.src = url;
      }
      
      setIsPlaying(true);
      await audioRef.current.play();
    } catch (error: any) {
      console.error('Audio playback failed:', error);
      setIsPlaying(false);
      
      // On iOS, we might need user interaction first
      if (error.name === 'NotAllowedError') {
        console.log('Audio blocked - needs user interaction');
        // Try to unlock on next interaction
        setIsUnlocked(false);
      }
      throw error; // Re-throw so caller can handle
    }
  }, []);

  // Stop audio playback
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  return {
    playAudio,
    stopAudio,
    isPlaying,
    isUnlocked,
    unlockAudio
  };
}
'use client';

import { useState, useEffect } from 'react';
import { useAudio } from '@/contexts/AudioContext';

interface Card {
  id: string;
  hanzi: string;
  meaning: string;
  pinyin: string;
  imageUrl?: string;
  imageAttribution?: string;
  imageAttributionUrl?: string;
  audioUrl?: string;
}

interface FlashCardProps {
  card: Card;
  showAnswer: boolean;
  onAudioComplete?: () => void;
  onMediaReady?: () => void;
}

export default function FlashCard({ card, showAnswer, onAudioComplete, onMediaReady }: FlashCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { playAudio, stopAudio, isPlaying, unlockAudio } = useAudio();
  
  // Reset state when card changes
  useEffect(() => {
    setImageLoaded(false);
    
    // Stop any playing audio when card changes
    stopAudio();
    
    // Preload image when card changes with cache-busting
    if (card.imageUrl) {
      const img = new Image();
      img.src = `${card.imageUrl}${card.imageUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
      img.onload = () => {
        setImageLoaded(true);
      };
    }
  }, [card.id, card.imageUrl, stopAudio]);
  
  // Handle media ready state
  useEffect(() => {
    if (showAnswer && imageLoaded && !isPlaying) {
      onMediaReady?.();
    }
  }, [showAnswer, imageLoaded, isPlaying, onMediaReady]);
  
  // Play audio when answer is shown
  useEffect(() => {
    if (showAnswer && card.audioUrl) {
      console.log('Attempting to play audio:', card.audioUrl);
      
      const audioUrlWithTimestamp = `${card.audioUrl}${card.audioUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
      playAudio(audioUrlWithTimestamp)
        .then(() => {
          console.log('Audio playing successfully');
        })
        .catch((error) => {
          console.error('Failed to play audio:', error);
          console.error('Audio URL:', card.audioUrl);
          onAudioComplete?.();
        });
    } else if (showAnswer && !card.audioUrl) {
      // No audio, immediately signal completion
      onAudioComplete?.();
    }
  }, [showAnswer, card.audioUrl, card.id, playAudio]); // Remove onAudioComplete from deps to avoid re-running
  
  // Monitor audio completion
  useEffect(() => {
    if (!isPlaying && showAnswer && card.audioUrl) {
      onAudioComplete?.();
    }
  }, [isPlaying, showAnswer, card.audioUrl]); // Remove onAudioComplete from deps
  
  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);
  
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center" onClick={unlockAudio}>
      <div className="text-center">
        {!showAnswer ? (
          <div className="text-9xl font-bold">{card.hanzi}</div>
        ) : (
          <div className="space-y-8">
            <div className="text-9xl font-bold">{card.hanzi}</div>
            
            {card.imageUrl && (
              <div className="relative w-96 h-96 mx-auto bg-gray-900 rounded-lg overflow-hidden">
                {!imageLoaded && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 space-y-2">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
                    <div>Loading image...</div>
                  </div>
                )}
                <img
                  src={`${card.imageUrl}${card.imageUrl.includes('?') ? '&' : '?'}t=${Date.now()}`}
                  alt={card.hanzi}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
                {card.imageAttribution && imageLoaded && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-xs text-gray-300 p-2">
                    {card.imageAttributionUrl ? (
                      <a 
                        href={card.imageAttributionUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-white"
                      >
                        {card.imageAttribution}
                      </a>
                    ) : (
                      card.imageAttribution
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="text-4xl">{card.pinyin}</div>
              <div className="text-3xl text-gray-300">{card.meaning}</div>
              {isPlaying && (
                <div className="flex items-center justify-center space-x-2 text-gray-400">
                  <svg className="animate-pulse w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" />
                  </svg>
                  <span className="text-sm">Playing audio...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="fixed bottom-8 right-8 text-sm text-gray-500">
        Press SPACE to continue • R to restart • Q/ESC to exit
      </div>
    </div>
  );
}
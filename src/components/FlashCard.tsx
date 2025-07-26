'use client';

import { useState, useEffect } from 'react';

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
  const [audioPlaying, setAudioPlaying] = useState(false);
  
  // Reset state when card changes
  useEffect(() => {
    setImageLoaded(false);
    setAudioPlaying(false);
    
    // Preload image when card changes
    if (card.imageUrl) {
      const img = new Image();
      img.src = card.imageUrl;
      img.onload = () => {
        setImageLoaded(true);
      };
    }
  }, [card.id, card.imageUrl]);
  
  // Handle media ready state
  useEffect(() => {
    if (showAnswer && imageLoaded && !audioPlaying) {
      onMediaReady?.();
    }
  }, [showAnswer, imageLoaded, audioPlaying, onMediaReady]);
  
  // Create audio instance outside of effect to persist it
  const [audioInstance, setAudioInstance] = useState<HTMLAudioElement | null>(null);
  
  // Play audio when answer is shown
  useEffect(() => {
    if (showAnswer && card.audioUrl) {
      setAudioPlaying(true);
      const audio = new Audio();
      audio.src = card.audioUrl;
      
      const handleEnded = () => {
        setAudioPlaying(false);
        onAudioComplete?.();
      };
      
      const handleError = (e: Event) => {
        console.error('Failed to play audio:', e);
        setAudioPlaying(false);
        onAudioComplete?.();
      };
      
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      
      // Store the audio instance
      setAudioInstance(audio);
      
      // Play audio with proper error handling
      console.log('Attempting to play audio:', card.audioUrl);
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Audio playing successfully');
          })
          .catch((error) => {
            console.error('Failed to play audio:', error);
            console.error('Audio URL:', card.audioUrl);
            setAudioPlaying(false);
            onAudioComplete?.();
          });
      }
      
      // Cleanup function
      return () => {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        // Don't immediately pause and clear src, let it play
      };
    } else if (showAnswer && !card.audioUrl) {
      // No audio, immediately signal completion
      onAudioComplete?.();
    }
  }, [showAnswer, card.audioUrl, card.id]); // Remove onAudioComplete from deps to avoid re-running
  
  // Cleanup audio when card changes or component unmounts
  useEffect(() => {
    return () => {
      if (audioInstance) {
        audioInstance.pause();
        audioInstance.src = '';
        setAudioInstance(null);
      }
    };
  }, [card.id, audioInstance]);
  
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
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
                  src={card.imageUrl}
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
              {audioPlaying && (
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
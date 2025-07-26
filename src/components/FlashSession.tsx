'use client';

import { useState, useEffect, useCallback } from 'react';
import Quiz from './Quiz';

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

interface FlashSessionProps {
  deckId: string;
  onExit: () => void;
}

export default function FlashSession({ deckId, onExit }: FlashSessionProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'flash' | 'quiz'>('loading');
  const [blockCards, setBlockCards] = useState<Card[]>([]);
  const [quizResults, setQuizResults] = useState<boolean[]>([]);
  const [currentBlockSize, setCurrentBlockSize] = useState(0);
  const [currentBlockStartIndex, setCurrentBlockStartIndex] = useState(0);
  
  // New states for the enhanced flash system
  const [viewPhase, setViewPhase] = useState<'character' | 'image1' | 'pinyin' | 'image2' | 'flash' | 'transition'>('character');
  const [cycleCount, setCycleCount] = useState(0);
  const [flashCount, setFlashCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Timing constants - much slower for better learning
  const CHARACTER_VIEW_TIME = 2000; // 2s - Show character with audio
  const IMAGE_VIEW_TIME = 2000; // 2s - Show image alone
  const PINYIN_VIEW_TIME = 2000; // 2s - Show pinyin with audio
  const FLASH_TIME = 800; // 800ms per flash
  const TRANSITION_TIME = 500; // 500ms between views
  const CYCLES_PER_CARD = 3; // Repeat each card 3 times
  const FLASH_REPETITIONS = 3; // Flash 3 times after cycles
  
  useEffect(() => {
    fetchCards();
  }, [deckId]);
  
  const fetchCards = async () => {
    try {
      const response = await fetch(`/api/cards/${deckId}?cached=true`);
      const data = await response.json();
      
      console.log('Fetched cards:', data.cards?.length, 'cards');
      console.log('Sample card:', data.cards?.[0]);
      
      if (data.cards && data.cards.length > 0) {
        setCards(data.cards);
        const blockSize = Math.floor(Math.random() * 3) + 4; // 4, 5, or 6
        setCurrentBlockSize(blockSize);
        setBlockCards(data.cards.slice(0, blockSize));
        setCycleCount(0);
        setFlashCount(0);
        setViewPhase('character');
        setPhase('flash');
      } else {
        alert('No cached cards available. Please wait for enrichment to complete.');
        onExit();
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error);
      onExit();
    }
  };
  
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key.toLowerCase() === 'q') {
      if (confirm('Are you sure you want to exit the flash session?')) {
        onExit();
      }
    } else if (e.key.toLowerCase() === 'r') {
      if (confirm('Are you sure you want to restart the flash session?')) {
        // Reset all state to initial values
        setCurrentIndex(0);
        setPhase('loading');
        setBlockCards([]);
        setQuizResults([]);
        setCurrentBlockSize(0);
        setCurrentBlockStartIndex(0);
        setCycleCount(0);
        setFlashCount(0);
        setViewPhase('character');
        // Refetch cards and start over
        fetchCards();
      }
    } else if (e.key === ' ' && phase === 'flash') {
      e.preventDefault();
      // Skip to next card
      nextCard();
    } else if (e.key.toLowerCase() === 'p' && phase === 'flash') {
      // Toggle pause
      setIsPaused(!isPaused);
    }
  }, [phase, onExit, isPaused]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
  
  // New flash logic with separate views and cycles
  useEffect(() => {
    if (phase === 'flash' && currentIndex < blockCards.length && !isPaused) {
      let timer: NodeJS.Timeout;
      
      switch (viewPhase) {
        case 'character':
          // Character + audio -> Image1 (or skip to pinyin if no image)
          timer = setTimeout(() => {
            setViewPhase('transition');
            const nextPhase = blockCards[currentIndex]?.imageUrl ? 'image1' : 'pinyin';
            setTimeout(() => setViewPhase(nextPhase), TRANSITION_TIME);
          }, CHARACTER_VIEW_TIME);
          break;
          
        case 'image1':
          // Image1 -> Pinyin
          timer = setTimeout(() => {
            setViewPhase('transition');
            setTimeout(() => setViewPhase('pinyin'), TRANSITION_TIME);
          }, IMAGE_VIEW_TIME);
          break;
          
        case 'pinyin':
          // Pinyin + audio -> Image2 (or back to character if no image)
          timer = setTimeout(() => {
            if (blockCards[currentIndex]?.imageUrl) {
              // Has image: go to image2
              setViewPhase('transition');
              setTimeout(() => setViewPhase('image2'), TRANSITION_TIME);
            } else {
              // No image: check if we've completed all cycles
              if (cycleCount + 1 >= CYCLES_PER_CARD) {
                setViewPhase('flash');
                setFlashCount(0);
              } else {
                setCycleCount(cycleCount + 1);
                setViewPhase('transition');
                setTimeout(() => setViewPhase('character'), TRANSITION_TIME);
              }
            }
          }, PINYIN_VIEW_TIME);
          break;
          
        case 'image2':
          // Image2 -> Character (next cycle) or Flash
          timer = setTimeout(() => {
            if (cycleCount + 1 >= CYCLES_PER_CARD) {
              setViewPhase('flash');
              setFlashCount(0);
            } else {
              setCycleCount(cycleCount + 1);
              setViewPhase('transition');
              setTimeout(() => setViewPhase('character'), TRANSITION_TIME);
            }
          }, IMAGE_VIEW_TIME);
          break;
          
        case 'flash':
          // Flash the complete card
          timer = setTimeout(() => {
            if (flashCount + 1 >= FLASH_REPETITIONS) {
              // Move to next card
              nextCard();
            } else {
              setFlashCount(flashCount + 1);
            }
          }, FLASH_TIME);
          break;
      }
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex, phase, blockCards.length, viewPhase, cycleCount, flashCount, isPaused]);
  
  
  // Preload next card's assets
  useEffect(() => {
    if (currentIndex + 1 < blockCards.length) {
      const nextCard = blockCards[currentIndex + 1];
      
      // Preload image
      if (nextCard.imageUrl) {
        const img = new Image();
        img.src = nextCard.imageUrl;
      }
      
      // Preload audio
      if (nextCard.audioUrl) {
        const audio = new Audio();
        audio.src = nextCard.audioUrl;
        audio.load();
      }
    }
  }, [currentIndex, blockCards]);
  
  const nextCard = () => {
    // Reset all states for the next card
    setCycleCount(0);
    setFlashCount(0);
    setViewPhase('character');
    
    if (currentIndex + 1 >= blockCards.length) {
      // Start quiz for this block
      setPhase('quiz');
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const handleQuizComplete = (results: boolean[]) => {
    setQuizResults([...quizResults, ...results]);
    
    // Move to next block
    const nextBlockStart = currentBlockStartIndex + currentBlockSize;
    if (nextBlockStart < cards.length) {
      const nextBlockSize = Math.floor(Math.random() * 3) + 4; // 4, 5, or 6
      const actualBlockSize = Math.min(nextBlockSize, cards.length - nextBlockStart);
      setCurrentBlockSize(actualBlockSize);
      setCurrentBlockStartIndex(nextBlockStart);
      setBlockCards(cards.slice(nextBlockStart, nextBlockStart + actualBlockSize));
      setCurrentIndex(0);
      setCycleCount(0);
      setFlashCount(0);
      setViewPhase('character');
      setPhase('flash');
    } else {
      // Session complete
      const allResults = [...quizResults, ...results];
      alert(`Session complete! Score: ${allResults.filter(r => r).length}/${allResults.length}`);
      onExit();
    }
  };
  
  if (phase === 'loading') {
    return <div className="fixed inset-0 bg-black flex items-center justify-center">Loading cards...</div>;
  }
  
  if (phase === 'quiz') {
    return (
      <Quiz 
        cards={blockCards} 
        onComplete={handleQuizComplete} 
        onExit={() => {
          // Check if this is a restart request by checking if R was pressed
          // For now, just exit - parent component can handle restart
          onExit();
        }} 
      />
    );
  }
  
  // Show transition screen
  if (viewPhase === 'transition') {
    return (
      <div className="fixed inset-0 bg-black">
        <div className="fixed bottom-8 right-8 text-sm text-gray-500">
          Cycle {cycleCount + 1} of {CYCLES_PER_CARD}
        </div>
      </div>
    );
  }
  
  // Render different views based on current phase
  const currentCard = blockCards[currentIndex];
  
  return (
    <div className={`fixed inset-0 flex items-center justify-center transition-colors duration-300 ${
      viewPhase === 'flash' && flashCount % 2 === 1 ? 'bg-white' : 'bg-black'
    }`}>
      <div className="text-center">
        {viewPhase === 'character' && (
          <div className="text-9xl font-bold text-white">{currentCard.hanzi}</div>
        )}
        
        {(viewPhase === 'image1' || viewPhase === 'image2') && currentCard.imageUrl && (
          <div className="w-96 h-96 mx-auto">
            <img
              src={currentCard.imageUrl}
              alt={currentCard.hanzi}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        )}
        
        {viewPhase === 'pinyin' && (
          <div className="space-y-4">
            <div className="text-6xl text-white">{currentCard.pinyin}</div>
            <div className="text-4xl text-gray-300">{currentCard.meaning}</div>
          </div>
        )}
        
        {viewPhase === 'flash' && (
          <div className={`space-y-8 ${flashCount % 2 === 1 ? 'text-black' : 'text-white'}`}>
            <div className="text-9xl font-bold">{currentCard.hanzi}</div>
            <div className="text-4xl">{currentCard.pinyin}</div>
            <div className="text-3xl">{currentCard.meaning}</div>
          </div>
        )}
      </div>
      
      <div className={`fixed bottom-8 right-8 text-sm ${
        viewPhase === 'flash' && flashCount % 2 === 1 ? 'text-gray-600' : 'text-gray-500'
      }`}>
        Press SPACE to skip • P to {isPaused ? 'resume' : 'pause'} • R to restart • Q/ESC to exit
      </div>
      
      {/* Pause indicator */}
      {isPaused && (
        <div className="fixed top-8 right-8 text-yellow-500 text-lg">
          ⏸ PAUSED
        </div>
      )}
      
      {/* Play audio for character and pinyin phases */}
      {(viewPhase === 'character' || viewPhase === 'pinyin') && currentCard.audioUrl && !isPaused && (
        <audio src={currentCard.audioUrl} autoPlay />
      )}
    </div>
  );
}
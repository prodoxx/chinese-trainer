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
  
  // New states for the segmented flash system
  const [viewPhase, setViewPhase] = useState<'orthographic' | 'phonological' | 'semantic' | 'retrieval' | 'blank' | 'consolidation'>('orthographic');
  const [currentBlock, setCurrentBlock] = useState(1); // Track which block we're in (1, 2, or 3)
  const [isPaused, setIsPaused] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [flashState, setFlashState] = useState<'black' | 'white'>('black');
  
  // Timing constants - slower for better learning
  const ORTHOGRAPHIC_TIME = 800; // 800ms - Show character alone (was 200ms)
  const ORTHOGRAPHIC_BLANK = 200; // 200ms blank after orthographic (was 100ms)
  const PHONOLOGICAL_TIME = 2000; // 2s - Character + pinyin + audio (was 800ms)
  const PHONOLOGICAL_BLANK = 300; // 300ms blank after phonological (was 100ms)
  const SEMANTIC_TIME = 2000; // 2s - Image + meaning (was 800ms)
  const SEMANTIC_BLANK = 500; // 500ms blank after semantic
  const RETRIEVAL_TIME = 1500; // 1.5s - Character alone for retrieval check (was 500ms)
  const BETWEEN_CARDS = 300; // Gap between cards (was 100ms)
  const BETWEEN_BLOCKS = 5000; // 5s consolidation period between blocks (2s + 3s flash)
  
  useEffect(() => {
    fetchCards();
  }, [deckId]);
  
  const fetchCards = async () => {
    try {
      // First try to get cards with audio and images
      const response = await fetch(`/api/cards/${deckId}`);
      const data = await response.json();
      
      console.log('API Response:', data);
      console.log('Fetched cards:', data.cards?.length, 'cards');
      console.log('Sample card:', data.cards?.[0]);
      
      // Filter for cards that have at least audio (required for flash sessions)
      const cardsWithAudio = data.cards?.filter((card: Card) => card.audioUrl) || [];
      console.log('Cards with audio:', cardsWithAudio.length);
      
      if (cardsWithAudio.length > 0) {
        setCards(cardsWithAudio);
        const blockSize = Math.floor(Math.random() * 3) + 4; // 4, 5, or 6
        setCurrentBlockSize(blockSize);
        setBlockCards(cardsWithAudio.slice(0, blockSize));
        setCurrentBlock(1);
        setViewPhase('orthographic');
        setPhase('flash');
      } else {
        alert('No cards with audio available yet. Please wait for enrichment to complete.');
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
        setCurrentBlock(1);
        setViewPhase('orthographic');
        // Refetch cards and start over
        fetchCards();
      }
    } else if (e.key.toLowerCase() === 'p' && phase === 'flash') {
      // Toggle pause
      setIsPaused(!isPaused);
    }
  }, [phase, onExit, isPaused]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
  
  // New segmented flash logic based on research
  useEffect(() => {
    if (phase === 'flash' && currentIndex < blockCards.length && !isPaused) {
      let timer: NodeJS.Timeout;
      
      // Block 1: Full segmented approach (orthographic, phonological, semantic)
      if (currentBlock === 1) {
        switch (viewPhase) {
          case 'orthographic':
            // Show character alone (orthographic focus)
            timer = setTimeout(() => {
              setViewPhase('blank');
              setTimeout(() => setViewPhase('phonological'), ORTHOGRAPHIC_BLANK);
            }, ORTHOGRAPHIC_TIME);
            break;
            
          case 'phonological':
            // Show character + pinyin + audio (phonological focus)
            timer = setTimeout(() => {
              setViewPhase('blank');
              setTimeout(() => {
                // Only show semantic if we have an image
                if (blockCards[currentIndex]?.imageUrl) {
                  setViewPhase('semantic');
                } else {
                  // Skip semantic, go straight to retrieval
                  setViewPhase('retrieval');
                }
              }, PHONOLOGICAL_BLANK);
            }, PHONOLOGICAL_TIME);
            break;
            
          case 'semantic':
            // Show image + meaning (semantic/visual focus)
            timer = setTimeout(() => {
              setViewPhase('blank');
              setTimeout(() => setViewPhase('retrieval'), SEMANTIC_BLANK);
            }, SEMANTIC_TIME);
            break;
            
          case 'retrieval':
            // Show character alone for mini-retrieval check
            timer = setTimeout(() => {
              // Add a blank between cards
              setViewPhase('blank');
              setTimeout(() => nextCard(), BETWEEN_CARDS);
            }, RETRIEVAL_TIME);
            break;
        }
      }
      
      // Block 2: Combined phonology + semantics in single exposure
      else if (currentBlock === 2) {
        switch (viewPhase) {
          case 'orthographic':
            // Skip orthographic in block 2, go straight to combined
            setViewPhase('phonological');
            break;
            
          case 'phonological':
            // Show everything together for longer in block 2
            timer = setTimeout(() => {
              nextCard();
            }, 2000); // 2s combined exposure (was 1s)
            break;
        }
      }
      
      // Block 3: Quick recognition check
      else if (currentBlock === 3) {
        switch (viewPhase) {
          case 'orthographic':
            // Show character for recognition
            timer = setTimeout(() => {
              setViewPhase('phonological');
            }, 1000); // 1s character (was 500ms)
            break;
            
          case 'phonological':
            // Flash of full info
            timer = setTimeout(() => {
              nextCard();
            }, 1500); // 1.5s full info (was 500ms)
            break;
        }
      }
      
      // Handle consolidation phase
      if (viewPhase === 'consolidation' && !isFlashing) {
        // Show text for 2 seconds, then start flashing
        timer = setTimeout(() => {
          setIsFlashing(true);
        }, 2000); // Wait 2s before starting flash
      }
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex, phase, blockCards.length, viewPhase, isPaused, currentBlock, isFlashing]);
  
  // Handle flashing animation during consolidation
  useEffect(() => {
    if (isFlashing) {
      let flashCount = 0;
      const flashInterval = setInterval(() => {
        // Toggle between black and white
        setFlashState(prev => prev === 'black' ? 'white' : 'black');
        flashCount++;
        
        if (flashCount >= 4) { // 4 transitions over 3 seconds (slower)
          clearInterval(flashInterval);
          setIsFlashing(false);
          setFlashState('black'); // Reset to black
          // Move to next block
          setCurrentBlock(prev => prev + 1);
          setCurrentIndex(0);
          setViewPhase('orthographic');
        }
      }, 750); // Toggle every 750ms (was 500ms)
      
      return () => clearInterval(flashInterval);
    }
  }, [isFlashing]);
  
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
    if (currentIndex + 1 >= blockCards.length) {
      // Check if we should move to next block or start quiz
      if (currentBlock < 3) {
        // Show consolidation screen before next block
        setViewPhase('consolidation');
      } else {
        // Start quiz after all 3 blocks
        setPhase('quiz');
      }
    } else {
      // Move to next card in current block
      setCurrentIndex(currentIndex + 1);
      setViewPhase('orthographic');
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
      setCurrentBlock(1);
      setViewPhase('orthographic');
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
  
  const currentCard = blockCards[currentIndex];
  
  // Show blank screen
  if (viewPhase === 'blank') {
    return <div className="fixed inset-0 bg-black" />;
  }
  
  // Show consolidation screen between blocks
  if (viewPhase === 'consolidation') {
    return (
      <div className={`fixed inset-0 transition-colors duration-200 flex items-center justify-center ${
        isFlashing ? (flashState === 'white' ? 'bg-white' : 'bg-black') : 'bg-black'
      }`}>
        {!isFlashing && (
          <div className="text-center">
            <div className="w-2 h-2 bg-gray-600 rounded-full mx-auto mb-8" />
            <div className="text-gray-500 text-sm">
              Block {currentBlock} complete
            </div>
            <div className="text-gray-600 text-xs mt-2">
              Consolidating...
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Render different views based on current phase
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-center">
        {/* Orthographic focus - character alone */}
        {viewPhase === 'orthographic' && (
          <div className="text-9xl font-bold text-white">{currentCard.hanzi}</div>
        )}
        
        {/* Phonological focus - varies by block */}
        {viewPhase === 'phonological' && (
          <div className="space-y-4">
            {/* Block 1: Character + pinyin + audio */}
            {currentBlock === 1 && (
              <>
                <div className="text-8xl font-bold text-white">{currentCard.hanzi}</div>
                <div className="text-6xl text-gray-300">{currentCard.pinyin}</div>
              </>
            )}
            
            {/* Block 2: Combined view - everything together */}
            {currentBlock === 2 && (
              <>
                <div className="text-7xl font-bold text-white">{currentCard.hanzi}</div>
                <div className="text-5xl text-gray-300">{currentCard.pinyin}</div>
                {currentCard.imageUrl && (
                  <div className="w-64 h-64 mx-auto my-4">
                    <img
                      src={currentCard.imageUrl}
                      alt={currentCard.hanzi}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="text-3xl text-gray-300">{currentCard.meaning}</div>
              </>
            )}
            
            {/* Block 3: Quick full info flash */}
            {currentBlock === 3 && (
              <>
                <div className="text-6xl font-bold text-white">{currentCard.hanzi}</div>
                <div className="text-4xl text-gray-300">{currentCard.pinyin}</div>
                <div className="text-3xl text-gray-400">{currentCard.meaning}</div>
              </>
            )}
          </div>
        )}
        
        {/* Semantic/visual focus - image + meaning */}
        {viewPhase === 'semantic' && currentCard.imageUrl && (
          <div className="space-y-4">
            <div className="w-96 h-96 mx-auto mb-4">
              <img
                src={currentCard.imageUrl}
                alt={currentCard.hanzi}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="text-4xl text-gray-300">{currentCard.meaning}</div>
          </div>
        )}
        
        {/* Retrieval check - character alone for mental recall */}
        {viewPhase === 'retrieval' && (
          <div className="text-9xl font-bold text-white">{currentCard.hanzi}</div>
        )}
      </div>
      
      {/* Status indicators */}
      <div className="fixed bottom-8 right-8 text-sm text-gray-500">
        Block {currentBlock}/3 • Card {currentIndex + 1}/{blockCards.length}
      </div>
      
      <div className="fixed bottom-8 left-8 text-sm text-gray-500">
        Press P to {isPaused ? 'resume' : 'pause'} • R to restart • Q/ESC to exit
      </div>
      
      {/* Block indicator for second and third passes */}
      {currentBlock > 1 && (
        <div className="fixed top-8 left-8 text-sm text-gray-500">
          Pass {currentBlock} - {currentBlock === 2 ? 'Reinforcement' : 'Final consolidation'}
        </div>
      )}
      
      {/* Pause indicator */}
      {isPaused && (
        <div className="fixed top-8 right-8 text-yellow-500 text-lg">
          ⏸ PAUSED
        </div>
      )}
      
      {/* Play audio only during phonological phase, but not in block 3 (too fast) */}
      {viewPhase === 'phonological' && currentBlock !== 3 && currentCard.audioUrl && !isPaused && (
        <audio src={currentCard.audioUrl} autoPlay />
      )}
    </div>
  );
}
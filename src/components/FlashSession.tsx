'use client';

import { useState, useEffect, useCallback } from 'react';
import Quiz from './Quiz';
import FlashSessionDemo from './FlashSessionDemo';
import { useAlert } from '@/hooks/useAlert';
// Removed Eye, EyeOff, Zap, ZapOff icons - accessibility controls moved to settings

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
  mode: 'new' | 'review' | 'practice';
  onExit: () => void;
}

export default function FlashSession({ deckId, mode, onExit }: FlashSessionProps) {
  const { showAlert, showConfirm } = useAlert();
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'idle' | 'flash' | 'quiz' | 'countdown' | 'initial-countdown'>('loading');
  const [blockCards, setBlockCards] = useState<Card[]>([]);
  const [quizResults, setQuizResults] = useState<boolean[]>([]);
  const [currentBlockSize, setCurrentBlockSize] = useState(0);
  const [currentBlockStartIndex, setCurrentBlockStartIndex] = useState(0);
  const [countdownSeconds, setCountdownSeconds] = useState(10);
  
  // New states for the segmented flash system
  const [viewPhase, setViewPhase] = useState<'preview' | 'orthographic' | 'phonological' | 'semantic' | 'self-test' | 'blank' | 'inter-block' | 'consolidation'>('orthographic');
  const [currentBlock, setCurrentBlock] = useState(1); // Track which block we're in (1, 2, or 3)
  const [isPaused, setIsPaused] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [fadeIntensity, setFadeIntensity] = useState(1.0); // From user settings
  const [reduceMotion, setReduceMotion] = useState(false); // From user settings
  const [consolidationCountdown, setConsolidationCountdown] = useState(3); // Countdown between blocks
  
  // Practice mode states
  const [practiceRound, setPracticeRound] = useState(1);
  const [practiceBlockResults, setPracticeBlockResults] = useState<boolean[][]>([]);
  const [showPracticeBreak, setShowPracticeBreak] = useState(false);
  const [missedCardIds] = useState<Set<string>>(new Set());
  const [showPracticeModeSelection, setShowPracticeModeSelection] = useState(false);
  const [selectedPracticeMode, setSelectedPracticeMode] = useState<'quick' | 'full' | 'focused'>('full');
  
  // Progress tracking
  const [totalCardsStudied, setTotalCardsStudied] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [pausedTime, setPausedTime] = useState(0); // Track total paused time
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const [showSessionSizeWarning, setShowSessionSizeWarning] = useState(false);
  const [totalAvailableCards, setTotalAvailableCards] = useState(0);
  const [actualSessionCards, setActualSessionCards] = useState(0); // Track actual cards for this session
  const [isInitialized, setIsInitialized] = useState(false); // Track if cards have been loaded
  const [showDemo, setShowDemo] = useState<boolean | null>(true); // Default to true, will be updated by preference
  const [demoCompleted, setDemoCompleted] = useState(false);
  
  // Cognitive load constants based on research
  const OPTIMAL_SESSION_SIZE = 8; // Optimized for modern attention spans
  const MINI_QUIZ_INTERVAL = 3; // Quiz after every 3 characters to maintain engagement
  
  // Optimized timing constants based on cognitive science (slower for better learning)
  const PREVIEW_TIME = 3500; // 3.5s preview of upcoming characters (increased from 2s)
  const ORTHOGRAPHIC_TIME = 800; // 800ms - Character alone
  const PHONOLOGICAL_TIME = 2000; // 2s - Character + pinyin + audio
  const SEMANTIC_TIME = 2000; // 2s - Image + meaning
  const SELF_TEST_TIME = 1500; // 1.5s - Character alone for retrieval
  const BETWEEN_CARDS_BLANK = 800; // 800ms blank between different cards (longer pause)
  const BETWEEN_PHASES_BLANK = 200; // 200ms blank between phases of same card
  const INTER_BLOCK_BLANK = 1000; // 1s between blocks
  const FADE_DURATION = 250; // 250ms fade transitions
  
  useEffect(() => {
    fetchCards();
    fetchDemoPreference();
  }, [deckId]);

  const fetchDemoPreference = async () => {
    try {
      const response = await fetch('/api/user/settings/flash-session');
      if (response.ok) {
        const data = await response.json();
        setShowDemo(data.showFlashDemo);
        setReduceMotion(data.reduceMotion);
        setFadeIntensity(data.brightness);
      } else {
        // Default settings if fetch fails
        setShowDemo(true);
        setReduceMotion(false);
        setFadeIntensity(1.0);
      }
    } catch (error) {
      console.error('Failed to fetch flash session preferences:', error);
      setShowDemo(true);
    }
  };
  
  // Elapsed time tracker
  useEffect(() => {
    if (sessionStartTime && phase !== 'loading' && !isPaused && !showContinuePrompt) {
      const interval = setInterval(() => {
        // Calculate elapsed time excluding paused time
        const totalElapsed = Date.now() - sessionStartTime - pausedTime;
        setElapsedTime(Math.floor(totalElapsed / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sessionStartTime, phase, isPaused, showContinuePrompt, pausedTime]);
  
  // Countdown timer
  useEffect(() => {
    if (phase === 'countdown' || phase === 'initial-countdown') {
      const timer = setInterval(() => {
        setCountdownSeconds(prev => {
          if (prev <= 1) {
            if (phase === 'initial-countdown') {
              // Start the flash session with preview
              setPhase('flash');
              setSessionStartTime(Date.now());
              setViewPhase('preview');
              setShowPreview(true);
            } else {
              // Move to next block when countdown finishes
              continueToNextBlock();
            }
            return 10; // Reset for next time
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [phase, countdownSeconds]);
  
  const fetchCards = async () => {
    try {
      // Fetch cards based on mode
      let endpoint = `/api/cards/${deckId}`;
      if (mode === 'review') {
        endpoint = `/api/cards/${deckId}/review`;
      } else if (mode === 'practice') {
        endpoint = `/api/cards/${deckId}/practice`;
      }
      const response = await fetch(endpoint);
      const data = await response.json();
      
      console.log('API Response:', data);
      console.log('Fetched cards:', data.cards?.length, 'cards');
      console.log('Total cards from API:', data.totalCards);
      console.log('Mode:', mode);
      console.log('Sample card:', data.cards?.[0]);
      
      // Filter for cards that have at least audio (required for flash sessions)
      const cardsWithAudio = data.cards?.filter((card: Card) => card.audioUrl) || [];
      console.log('Cards with audio:', cardsWithAudio.length);
      
      if (cardsWithAudio.length > 0) {
        // Store total available cards for reference
        // For review/practice modes, use the totalCards from API response if available
        const apiTotalCards = data.totalCards ?? cardsWithAudio.length;
        setTotalAvailableCards(apiTotalCards);
        console.log('Setting totalAvailableCards to:', apiTotalCards);
        
        // Determine optimal session size based on mode and available cards
        let sessionCards = cardsWithAudio;
        let showWarning = false;
        
        if (mode === 'new') {
          // For new learning, strictly limit to optimal size
          if (cardsWithAudio.length > OPTIMAL_SESSION_SIZE) {
            sessionCards = cardsWithAudio.slice(0, OPTIMAL_SESSION_SIZE);
            showWarning = true;
            setShowSessionSizeWarning(true);
          }
        } else if (mode === 'practice') {
          // For practice mode, use all available cards (no limit)
          sessionCards = cardsWithAudio;
        }
        // Review mode uses all due cards as scheduled by spaced repetition
        
        setCards(sessionCards);
        setActualSessionCards(sessionCards.length); // Set the actual number of cards for this session
        setIsInitialized(true); // Mark as initialized
        console.log('Setting actualSessionCards to:', sessionCards.length);
        
        // For practice mode, show mode selection first
        if (mode === 'practice') {
          console.log('Practice mode - Setting up with cards:', sessionCards.length);
          setPhase('idle'); // Change from loading
          setShowPracticeModeSelection(true);
        } else {
          // Normal flash session for new and review modes
          // Use smaller blocks for more frequent engagement
          const blockSize = Math.min(MINI_QUIZ_INTERVAL, sessionCards.length); // 3 cards max per block
          setCurrentBlockSize(blockSize);
          setBlockCards(sessionCards.slice(0, blockSize));
          setCurrentBlock(1);
          setViewPhase('preview');
          setShowPreview(true);
          
          // Always check for demo first
          if (showDemo !== false && !demoCompleted) {
            // Show demo unless explicitly disabled
            setPhase('idle'); // Wait for demo to complete
          } else if (showWarning && mode === 'new') {
            setPhase('initial-countdown'); // We'll add the warning to this phase
          } else {
            setCountdownSeconds(10);
            setPhase('initial-countdown');
          }
        }
      } else {
        let message = 'No cards with audio available yet. Please wait for enrichment to complete.';
        if (mode === 'review') {
          message = 'No cards due for review! Great job keeping up with your studies.';
        } else if (mode === 'practice') {
          message = 'No studied cards available for practice. Study some cards first!';
        }
        showAlert(message, { type: 'info' });
        onExit();
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error);
      onExit();
    }
  };
  
  const handleKeyPress = useCallback(async (e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key.toLowerCase() === 'q') {
      // Pause the session before showing confirm
      const wasPaused = isPaused;
      if (!wasPaused && phase === 'flash') {
        setIsPaused(true);
        setPauseStartTime(Date.now());
      }
      
      const confirmed = await showConfirm('Are you sure you want to exit the flash session?', {
        type: 'warning',
        confirmText: 'Exit',
        cancelText: 'Continue'
      });
      
      if (confirmed) {
        onExit();
      } else if (!wasPaused && phase === 'flash') {
        // Resume if we paused it
        const pauseDuration = Date.now() - (pauseStartTime || Date.now());
        setPausedTime(prev => prev + pauseDuration);
        setPauseStartTime(null);
        setIsPaused(false);
      }
    } else if (e.key.toLowerCase() === 'r') {
      // Pause the session before showing confirm
      const wasPaused = isPaused;
      if (!wasPaused && phase === 'flash') {
        setIsPaused(true);
        setPauseStartTime(Date.now());
      }
      
      const confirmed = await showConfirm('Are you sure you want to restart the flash session?', {
        type: 'warning',
        confirmText: 'Restart',
        cancelText: 'Continue'
      });
      
      if (confirmed) {
        // Reset all state to initial values
        setCurrentIndex(0);
        setPhase('loading');
        setBlockCards([]);
        setQuizResults([]);
        setCurrentBlockSize(0);
        setCurrentBlockStartIndex(0);
        setCurrentBlock(1);
        setViewPhase('preview');
        setShowPreview(true);
        setTotalCardsStudied(0);
        setElapsedTime(0);
        setPausedTime(0);
        setPauseStartTime(null);
        setRoundsCompleted(0);
        // Refetch cards and start over
        fetchCards();
      } else if (!wasPaused && phase === 'flash') {
        // Resume if we paused it
        const pauseDuration = Date.now() - (pauseStartTime || Date.now());
        setPausedTime(prev => prev + pauseDuration);
        setPauseStartTime(null);
        setIsPaused(false);
      }
    } else if (e.key.toLowerCase() === 'p' && phase === 'flash') {
      // Toggle pause
      if (isPaused) {
        // Resuming - calculate how long we were paused
        if (pauseStartTime) {
          const pauseDuration = Date.now() - pauseStartTime;
          setPausedTime(prev => prev + pauseDuration);
          setPauseStartTime(null);
        }
        setIsPaused(false);
      } else {
        // Pausing - record when we started pausing
        setPauseStartTime(Date.now());
        setIsPaused(true);
      }
    }
  }, [phase, onExit, isPaused, pauseStartTime, showConfirm]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
  
  // New segmented flash logic with 3 blocks
  useEffect(() => {
    if (phase === 'flash' && !isPaused && currentIndex < blockCards.length) {
      let timer: NodeJS.Timeout;
      
      // Block 1: Full segmented approach (ortho → phono → semantic → self-test)
      if (currentBlock === 1) {
        switch (viewPhase) {
          case 'preview':
            // Show preview grid of upcoming characters
            timer = setTimeout(() => {
              setViewPhase('blank');
              setTimeout(() => {
                setCurrentIndex(0);
                setViewPhase('orthographic');
              }, BETWEEN_PHASES_BLANK);
            }, PREVIEW_TIME);
            break;
            
          case 'orthographic':
            // Show character alone
            timer = setTimeout(() => {
              setViewPhase('blank');
              setTimeout(() => setViewPhase('phonological'), BETWEEN_PHASES_BLANK);
            }, ORTHOGRAPHIC_TIME);
            break;
            
          case 'phonological':
            // Show character + pinyin + audio
            timer = setTimeout(() => {
              setViewPhase('blank');
              setTimeout(() => {
                if (blockCards[currentIndex]?.imageUrl) {
                  setViewPhase('semantic');
                } else {
                  setViewPhase('self-test');
                }
              }, BETWEEN_PHASES_BLANK);
            }, PHONOLOGICAL_TIME);
            break;
            
          case 'semantic':
            // Show image + meaning
            timer = setTimeout(() => {
              setViewPhase('blank');
              setTimeout(() => setViewPhase('self-test'), BETWEEN_PHASES_BLANK);
            }, SEMANTIC_TIME);
            break;
            
          case 'self-test':
            // Show character alone for retrieval
            timer = setTimeout(() => {
              setViewPhase('blank');
              setTimeout(() => {
                if (currentIndex + 1 < blockCards.length) {
                  setCurrentIndex(currentIndex + 1);
                  setViewPhase('orthographic');
                } else {
                  // End of block 1
                  setViewPhase('consolidation');
                }
              }, BETWEEN_CARDS_BLANK); // Longer pause between different cards
            }, SELF_TEST_TIME);
            break;
        }
      }
      
      // Block 2: Combined view (everything together for reinforcement)
      else if (currentBlock === 2) {
        switch (viewPhase) {
          case 'orthographic':
            // Skip straight to combined view
            setViewPhase('phonological');
            break;
            
          case 'phonological':
            // Show everything together for longer
            timer = setTimeout(() => {
              setViewPhase('blank');
              setTimeout(() => {
                if (currentIndex + 1 < blockCards.length) {
                  setCurrentIndex(currentIndex + 1);
                  setViewPhase('orthographic');
                } else {
                  setViewPhase('consolidation');
                }
              }, BETWEEN_CARDS_BLANK);
            }, 3000); // 3s for combined view
            break;
        }
      }
      
      // Block 3: Quick recognition (char → full info)
      else if (currentBlock === 3) {
        switch (viewPhase) {
          case 'orthographic':
            // Show character for recognition
            timer = setTimeout(() => {
              setViewPhase('phonological');
            }, 1000); // 1s for recognition
            break;
            
          case 'phonological':
            // Quick flash of full info
            timer = setTimeout(() => {
              setViewPhase('blank');
              setTimeout(() => {
                if (currentIndex + 1 < blockCards.length) {
                  setCurrentIndex(currentIndex + 1);
                  setViewPhase('orthographic');
                } else {
                  // All blocks complete, start quiz
                  setPhase('quiz');
                }
              }, BETWEEN_CARDS_BLANK);
            }, 1500); // 1.5s for quick review
            break;
        }
      }
      
      // Handle consolidation between blocks
      if (viewPhase === 'consolidation') {
        // Start countdown when entering consolidation
        if (consolidationCountdown === 3) {
          timer = setTimeout(() => {
            setConsolidationCountdown(2);
          }, 1000);
        } else if (consolidationCountdown === 2) {
          timer = setTimeout(() => {
            setConsolidationCountdown(1);
          }, 1000);
        } else if (consolidationCountdown === 1) {
          timer = setTimeout(() => {
            // Reset countdown and move to next block
            setConsolidationCountdown(3);
            setCurrentBlock(currentBlock + 1);
            setCurrentIndex(0);
            setViewPhase('orthographic');
          }, 1000);
        }
      }
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex, phase, blockCards.length, viewPhase, isPaused, currentBlock, consolidationCountdown]);
  
  
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
  
  
  const handleQuizComplete = async (results: boolean[]) => {
    // For practice mode, handle chunked completion
    if (mode === 'practice') {
      // Track results for this block
      const newBlockResults = [...practiceBlockResults, results];
      setPracticeBlockResults(newBlockResults);
      
      // Track missed cards
      results.forEach((correct, index) => {
        if (!correct) {
          missedCardIds.add(blockCards[index].id);
        }
      });
      
      // Calculate cumulative results
      const allResults = newBlockResults.flat();
      const totalCorrect = allResults.filter(r => r).length;
      const totalAnswered = allResults.length;
      
      // For quick practice, complete immediately
      if (selectedPracticeMode === 'quick') {
        const percentage = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
        const completionMessage = `Quick practice complete!\n\nPracticed: ${totalAnswered} cards\nCorrect: ${totalCorrect}/${totalAnswered} (${percentage}%)\nTime: ${formatTime(elapsedTime)}`;
        
        showAlert(completionMessage, { 
          type: 'success', 
          title: 'Quick Practice Complete!' 
        });
        onExit();
        return;
      }
      
      // For full review, check if there are more chunks to practice
      const nextStartIndex = currentBlockStartIndex + currentBlockSize;
      const remainingCards = cards.length - nextStartIndex;
      
      if (remainingCards > 0) {
        // Show break screen between chunks
        setShowPracticeBreak(true);
        return;
      } else if (missedCardIds.size > 0 && practiceRound === 1) {
        // After all chunks, do a focused review of missed cards
        setShowPracticeBreak(true);
        return;
      } else {
        // Practice complete
        const percentage = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
        const completionMessage = `Practice quiz complete!\n\nPracticed: ${cards.length} cards\nCorrect: ${totalCorrect}/${totalAnswered} (${percentage}%)\nTime: ${formatTime(elapsedTime)}\n\n${missedCardIds.size > 0 ? `Reviewed ${missedCardIds.size} difficult cards` : 'Perfect score!'}`;
        
        showAlert(completionMessage, { 
          type: 'success', 
          title: 'Practice Complete!' 
        });
        onExit();
        return;
      }
    }
    
    // Regular flow for new and review modes
    setQuizResults([...quizResults, ...results]);
    
    // Update progress
    const newTotalStudied = currentBlockStartIndex + currentBlockSize;
    setTotalCardsStudied(newTotalStudied);
    setRoundsCompleted(roundsCompleted + 1);
    
    // Check if we should prompt to continue
    // For new mode: always prompt after OPTIMAL_SESSION_SIZE
    // For other modes: prompt after every 3 rounds
    if (mode === 'new' && newTotalStudied >= OPTIMAL_SESSION_SIZE && newTotalStudied < actualSessionCards) {
      setShowContinuePrompt(true);
      return;
    } else if (mode !== 'new' && (roundsCompleted + 1) % 3 === 0 && newTotalStudied < actualSessionCards) {
      setShowContinuePrompt(true);
      return;
    }
    
    // Check if there are more cards to study
    const nextBlockStart = currentBlockStartIndex + currentBlockSize;
    if (nextBlockStart < cards.length) {
      // Show countdown before next block
      setCountdownSeconds(10);
      setPhase('countdown');
    } else {
      // Session complete - mark all cards as studied
      const allResults = [...quizResults, ...results];
      
      // Only mark cards as studied in 'new' mode (not review or practice mode)
      if (mode === 'new') {
        try {
          const cardIds = cards.map(card => card.id);
          console.log('Marking cards as studied:', { cardIds, deckId, count: cardIds.length });
          const response = await fetch('/api/cards/mark-studied', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardIds, deckId }),
          });
          const data = await response.json();
          console.log('Mark studied response:', data);
        } catch (error) {
          console.error('Failed to mark cards as studied:', error);
        }
      }
      
      const finalScore = allResults.filter(r => r).length;
      const percentage = allResults.length > 0 ? Math.round((finalScore / allResults.length) * 100) : 0;
      
      const completionMessage = `Session complete!\n\nStudied: ${actualSessionCards} cards\nCorrect: ${finalScore}/${allResults.length} (${percentage}%)\nTime: ${formatTime(elapsedTime)}`;
      
      showAlert(completionMessage, { 
        type: 'success', 
        title: 'Session Complete!' 
      });
      onExit();
    }
  };
  
  const continueToNextBlock = () => {
    const nextBlockStart = currentBlockStartIndex + currentBlockSize;
    // Use mini-quiz interval for frequent engagement
    const nextBlockSize = Math.min(MINI_QUIZ_INTERVAL, cards.length - nextBlockStart);
    setCurrentBlockSize(nextBlockSize);
    setCurrentBlockStartIndex(nextBlockStart);
    setBlockCards(cards.slice(nextBlockStart, nextBlockStart + nextBlockSize));
    setCurrentIndex(0);
    setCurrentBlock(1);
    setViewPhase('preview');
    setShowPreview(true);
    setPhase('flash');
  };
  
  const handleContinueChoice = (continueSession: boolean) => {
    setShowContinuePrompt(false);
    
    if (continueSession) {
      // Show countdown before continuing
      setCountdownSeconds(10);
      setPhase('countdown');
    } else {
      // End session early
      handleSessionEnd();
    }
  };
  
  const handleSessionEnd = async () => {
    // Mark studied cards (only in 'new' mode)
    if (mode === 'new' && totalCardsStudied > 0) {
      try {
        const studiedCardIds = cards.slice(0, totalCardsStudied).map(card => card.id);
        await fetch('/api/cards/mark-studied', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardIds: studiedCardIds, deckId }),
        });
      } catch (error) {
        console.error('Failed to mark cards as studied:', error);
      }
    }
    
    const finalScore = quizResults.filter(r => r).length;
    const percentage = quizResults.length > 0 ? Math.round((finalScore / quizResults.length) * 100) : 0;
    
    const completionMessage = `Session complete!\n\nStudied: ${totalCardsStudied} cards\nCorrect: ${finalScore}/${quizResults.length} (${percentage}%)\nTime: ${formatTime(elapsedTime)}`;
    
    showAlert(completionMessage, { 
      type: 'success', 
      title: 'Session Complete!' 
    });
    onExit();
  };
  
  // Format elapsed time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDemoComplete = () => {
    setDemoCompleted(true);
    
    // Start appropriate phase based on mode
    if (mode === 'practice' && selectedPracticeMode) {
      // For practice mode, start quiz directly
      if (selectedPracticeMode === 'quick') {
        const quickCards = [...cards].sort(() => Math.random() - 0.5).slice(0, Math.min(7, cards.length));
        setCards(quickCards);
        setBlockCards(quickCards);
        setCurrentBlockSize(quickCards.length);
        setCurrentBlockStartIndex(0);
        setPracticeRound(1);
        setPhase('quiz');
        setSessionStartTime(Date.now());
      } else {
        const practiceChunkSize = Math.min(7, cards.length);
        const firstChunk = cards.slice(0, practiceChunkSize);
        setBlockCards(firstChunk);
        setCurrentBlockSize(practiceChunkSize);
        setCurrentBlockStartIndex(0);
        setPracticeRound(1);
        setPhase('quiz');
        setSessionStartTime(Date.now());
      }
    } else {
      // For new/review modes, start countdown
      setCountdownSeconds(10);
      setPhase('initial-countdown');
    }
  };

  const handleDemoSkip = () => {
    handleDemoComplete();
  };

  const handleDemoDontShowAgain = async () => {
    try {
      await fetch('/api/user/settings/flash-demo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showFlashDemo: false }),
      });
    } catch (error) {
      console.error('Failed to update demo preference:', error);
    }
    handleDemoComplete();
  };
  
  // Handle continuing practice after break
  const continuePractice = () => {
    setShowPracticeBreak(false);
    
    const nextStartIndex = currentBlockStartIndex + currentBlockSize;
    const remainingCards = cards.length - nextStartIndex;
    
    if (remainingCards > 0) {
      // Continue with next chunk
      const chunkSize = Math.min(7, remainingCards);
      const nextChunk = cards.slice(nextStartIndex, nextStartIndex + chunkSize);
      
      setBlockCards(nextChunk);
      setCurrentBlockSize(chunkSize);
      setCurrentBlockStartIndex(nextStartIndex);
      setPhase('quiz');
    } else if (missedCardIds.size > 0 && practiceRound === 1) {
      // Start focused review of missed cards
      const missedCards = cards.filter(card => missedCardIds.has(card.id));
      
      setPracticeRound(2);
      setBlockCards(missedCards);
      setCurrentBlockSize(missedCards.length);
      setCurrentBlockStartIndex(0);
      setPhase('quiz');
    }
  };
  
  if (phase === 'loading' || showDemo === null) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center">Loading...</div>;
  }

  // Show demo if needed (before any countdown or flash session)
  if (showDemo && !demoCompleted && phase === 'idle' && cards.length > 0) {
    return (
      <FlashSessionDemo
        onComplete={handleDemoComplete}
        onSkip={handleDemoSkip}
        onDontShowAgain={handleDemoDontShowAgain}
        onQuit={onExit}
      />
    );
  }
  
  // Show practice mode selection (but not if demo should show first)
  if (showPracticeModeSelection && mode === 'practice' && !(!demoCompleted && showDemo !== false)) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
        <div className="bg-gray-900 p-6 sm:p-8 rounded-lg max-w-2xl w-full text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Choose Practice Mode</h2>
          
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <button
              onClick={() => setSelectedPracticeMode('quick')}
              className={`w-full p-3 sm:p-4 rounded-lg border-2 transition-all text-left ${
                selectedPracticeMode === 'quick'
                  ? 'border-violet-500 bg-violet-900/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1">🚀 Quick Practice</h3>
              <p className="text-gray-300 text-xs sm:text-sm">5-7 random cards for a fast review</p>
              <p className="text-gray-500 text-xs mt-1">~2-3 minutes</p>
            </button>
            
            <button
              onClick={() => setSelectedPracticeMode('full')}
              className={`w-full p-3 sm:p-4 rounded-lg border-2 transition-all text-left ${
                selectedPracticeMode === 'full'
                  ? 'border-violet-500 bg-violet-900/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1">📚 Full Review</h3>
              <p className="text-gray-300 text-xs sm:text-sm">All {cards.length} cards in chunks of 7 with breaks</p>
              <p className="text-gray-500 text-xs mt-1">Optimal for learning with cognitive breaks</p>
            </button>
            
            <button
              onClick={() => setSelectedPracticeMode('focused')}
              className={`w-full p-3 sm:p-4 rounded-lg border-2 transition-all text-left ${
                selectedPracticeMode === 'focused'
                  ? 'border-violet-500 bg-violet-900/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              disabled={true}
            >
              <h3 className="text-base sm:text-lg font-semibold text-gray-500 mb-1">🎯 Focused Practice</h3>
              <p className="text-gray-500 text-xs sm:text-sm">Review only previously missed cards</p>
              <p className="text-gray-600 text-xs mt-1">Available after completing some reviews</p>
            </button>
          </div>
          
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 text-left">
            <p className="text-blue-300 font-semibold mb-1 sm:mb-2 text-sm sm:text-base">💡 Recommendation</p>
            <p className="text-gray-300 text-xs sm:text-sm">
              Full Review mode follows cognitive science best practices with optimal chunk sizes
              and memory consolidation breaks between rounds.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={onExit}
              className="px-4 sm:px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowPracticeModeSelection(false);
                
                // Check if demo should be shown first
                if (showDemo !== false && !demoCompleted) {
                  // Keep phase as 'idle' to show demo
                  return;
                }
                
                // Start practice based on selected mode
                if (selectedPracticeMode === 'quick') {
                  // Quick practice - just 5-7 random cards
                  const quickCards = [...cards].sort(() => Math.random() - 0.5).slice(0, Math.min(7, cards.length));
                  setCards(quickCards);
                  setBlockCards(quickCards);
                  setCurrentBlockSize(quickCards.length);
                  setCurrentBlockStartIndex(0);
                  setPracticeRound(1);
                  setPhase('quiz');
                  setSessionStartTime(Date.now());
                } else {
                  // Full review - chunks of 7
                  const practiceChunkSize = Math.min(7, cards.length);
                  const firstChunk = cards.slice(0, practiceChunkSize);
                  setBlockCards(firstChunk);
                  setCurrentBlockSize(practiceChunkSize);
                  setCurrentBlockStartIndex(0);
                  setPracticeRound(1);
                  setPhase('quiz');
                  setSessionStartTime(Date.now());
                }
              }}
              className="px-4 sm:px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded transition-colors font-semibold text-sm sm:text-base"
            >
              Start Practice
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Show practice break screen
  if (showPracticeBreak && mode === 'practice') {
    const allResults = practiceBlockResults.flat();
    const totalCorrect = allResults.filter(r => r).length;
    const totalAnswered = allResults.length;
    const percentage = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    
    const nextStartIndex = currentBlockStartIndex + currentBlockSize;
    const remainingCards = cards.length - nextStartIndex;
    const isReviewRound = remainingCards === 0 && missedCardIds.size > 0 && practiceRound === 1;
    
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
        <div className="bg-gray-900 p-6 sm:p-8 rounded-lg max-w-lg w-full text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
            {isReviewRound ? '📝 Ready for Focused Review?' : '✨ Great Progress!'}
          </h2>
          
          <div className="mb-4 sm:mb-6 space-y-2">
            <p className="text-gray-300 text-sm sm:text-base">
              Round {practiceRound} Progress
            </p>
            <p className="text-base sm:text-lg text-white">
              Completed: {totalAnswered} cards
            </p>
            <p className="text-base sm:text-lg text-green-400">
              Correct: {totalCorrect} / {totalAnswered} ({percentage}%)
            </p>
            <p className="text-gray-400 text-sm sm:text-base">
              Time: {formatTime(elapsedTime)}
            </p>
          </div>
          
          {isReviewRound ? (
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 text-left">
              <p className="text-yellow-300 font-semibold mb-1 sm:mb-2 text-sm sm:text-base">
                🎯 Focused Review Round
              </p>
              <p className="text-gray-300 text-xs sm:text-sm">
                Let&apos;s review the {missedCardIds.size} cards you found challenging.
                This targeted practice will help reinforce these specific characters.
              </p>
            </div>
          ) : (
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 text-left">
              <p className="text-blue-300 font-semibold mb-1 sm:mb-2 text-sm sm:text-base">
                🧠 Cognitive Break
              </p>
              <p className="text-gray-300 text-xs sm:text-sm">
                Taking short breaks between chunks helps consolidate memory.
                Ready for the next {Math.min(7, remainingCards)} cards?
              </p>
              <p className="text-gray-400 text-xs mt-2">
                {Math.ceil(remainingCards / 7)} more rounds to go
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={onExit}
              className="px-4 sm:px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-sm sm:text-base"
            >
              End Practice
            </button>
            <button
              onClick={continuePractice}
              className="px-4 sm:px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded transition-colors font-semibold text-sm sm:text-base"
            >
              {isReviewRound ? 'Start Review' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Show continue prompt
  if (showContinuePrompt) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
        <div className="bg-gray-900 p-6 sm:p-8 rounded-lg max-w-lg w-full text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
            {mode === 'new' && totalCardsStudied >= OPTIMAL_SESSION_SIZE 
              ? '🎯 Optimal Session Size Reached!' 
              : 'Great progress!'}
          </h2>
          <p className="text-gray-300 mb-2 text-sm sm:text-base">
            You&apos;ve studied {totalCardsStudied} out of {actualSessionCards} cards
          </p>
          {quizResults.length > 0 && (
            <p className="text-green-400 mb-2 text-sm sm:text-base">
              Correct: {quizResults.filter(r => r).length} / {quizResults.length} 
              ({Math.round((quizResults.filter(r => r).length / quizResults.length) * 100)}%)
            </p>
          )}
          <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
            Time elapsed: {formatTime(elapsedTime)}
          </p>
          {mode === 'new' && totalCardsStudied >= OPTIMAL_SESSION_SIZE && (
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 text-left">
              <p className="text-yellow-300 text-xs sm:text-sm font-semibold mb-1 sm:mb-2">
                ⚠️ Cognitive Load Warning
              </p>
              <p className="text-gray-300 text-xs sm:text-sm">
                You&apos;ve reached the optimal learning capacity for one session. 
                Research shows that learning effectiveness decreases beyond 7±2 items.
              </p>
              <p className="text-gray-400 text-xs sm:text-sm mt-2">
                Recommendation: End this session and return later for better retention.
              </p>
            </div>
          )}
          <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
            Would you like to continue or end the session here?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => handleContinueChoice(false)}
              className={`px-4 sm:px-6 py-2 rounded transition-colors text-sm sm:text-base ${
                mode === 'new' && totalCardsStudied >= OPTIMAL_SESSION_SIZE
                  ? 'bg-green-600 hover:bg-green-700 text-white font-semibold'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              {mode === 'new' && totalCardsStudied >= OPTIMAL_SESSION_SIZE
                ? '✓ End Session (Recommended)'
                : 'End Session'}
            </button>
            <button
              onClick={() => handleContinueChoice(true)}
              className={`px-4 sm:px-6 py-2 rounded transition-colors text-sm sm:text-base ${
                mode === 'new' && totalCardsStudied >= OPTIMAL_SESSION_SIZE
                  ? 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                  : 'bg-violet-600 hover:bg-violet-700 text-white'
              }`}
            >
              Continue{mode === 'new' && totalCardsStudied >= OPTIMAL_SESSION_SIZE ? ' Anyway' : ''}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (phase === 'quiz') {
    return (
      <Quiz 
        cards={blockCards} 
        deckId={deckId}
        onComplete={handleQuizComplete} 
        onExit={() => {
          // Check if this is a restart request by checking if R was pressed
          // For now, just exit - parent component can handle restart
          onExit();
        }}
      />
    );
  }
  
  // Show countdown screen
  if (phase === 'countdown') {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl text-white mb-6 sm:mb-8">Get ready for the next drill</h2>
          <div className="text-6xl sm:text-7xl md:text-8xl font-bold text-gray-400">{countdownSeconds}</div>
        </div>
      </div>
    );
  }
  
  // Show initial countdown screen
  if (phase === 'initial-countdown') {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-2xl px-4 sm:px-8">
          {showSessionSizeWarning && mode === 'new' ? (
            <>
              <h2 className="text-xl sm:text-2xl text-yellow-400 mb-3 sm:mb-4">⚠️ Session Size Optimized</h2>
              <p className="text-gray-300 mb-3 sm:mb-4 text-sm sm:text-base">
                Based on cognitive science research, we&apos;ve limited this session to {OPTIMAL_SESSION_SIZE} characters 
                for optimal learning. Working memory can effectively handle 7±2 items at once.
              </p>
              <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
                You can study the remaining {totalAvailableCards - cards.length} characters 
                in your next session for better retention.
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">
                Tip: Multiple smaller sessions are more effective than one large session!
              </p>
            </>
          ) : (
            <h2 className="text-xl sm:text-2xl md:text-3xl text-white mb-6 sm:mb-8">Your flash session is about to start</h2>
          )}
          <div className="text-6xl sm:text-7xl md:text-8xl font-bold text-gray-400">{countdownSeconds}</div>
          {mode === 'new' && (
            <p className="text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6">
              Studying {cards.length} {cards.length === 1 ? 'character' : 'characters'}
            </p>
          )}
        </div>
      </div>
    );
  }
  
  const currentCard = blockCards[currentIndex];
  
  // Show blank screen
  if (viewPhase === 'blank') {
    return <div className={`fixed inset-0 bg-black ${reduceMotion ? '' : `transition-opacity duration-${FADE_DURATION}`}`} />;
  }
  
  // Show consolidation countdown between blocks
  if (viewPhase === 'consolidation') {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl font-bold text-gray-600 mb-4">
            {consolidationCountdown}
          </div>
          <div className="w-2 h-2 bg-gray-700 rounded-full mx-auto animate-pulse" />
        </div>
      </div>
    );
  }
  
  // Show preview grid
  if (viewPhase === 'preview' && showPreview) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-sm mb-4">Upcoming characters</div>
          <div className="grid grid-cols-3 gap-4">
            {blockCards.slice(0, 6).map((card, idx) => (
              <div key={idx} className="text-4xl text-gray-600">{card.hanzi}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Render different views based on current phase
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center" style={{ opacity: fadeIntensity }}>
      
      <div className="text-center">
        {/* Orthographic focus - character alone */}
        {viewPhase === 'orthographic' && currentCard && (
          <div className={`text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-white ${reduceMotion ? '' : `transition-opacity duration-${FADE_DURATION}`}`}>
            {currentCard.hanzi}
          </div>
        )}
        
        {/* Phonological focus - varies by block */}
        {viewPhase === 'phonological' && currentCard && (
          <div className="space-y-4">
            {/* Block 1 & 3: Character + pinyin + audio */}
            {(currentBlock === 1 || currentBlock === 3) && (
              <>
                <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white">{currentCard.hanzi}</div>
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#f7cc48]">{currentCard.pinyin}</div>
              </>
            )}
            
            {/* Block 2: Combined view - everything together */}
            {currentBlock === 2 && (
              <>
                <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white">{currentCard.hanzi}</div>
                <div className="text-3xl sm:text-4xl md:text-5xl text-[#f7cc48]">{currentCard.pinyin}</div>
                {currentCard.imageUrl && (
                  <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 mx-auto my-4">
                    <img
                      src={currentCard.imageUrl}
                      alt={currentCard.hanzi}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="text-xl sm:text-2xl md:text-3xl text-gray-300">{currentCard.meaning}</div>
              </>
            )}
          </div>
        )}
        
        {/* Semantic/visual focus - image + meaning */}
        {viewPhase === 'semantic' && currentCard?.imageUrl && (
          <div className="space-y-4">
            <div className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 mx-auto mb-4">
              <img
                src={currentCard.imageUrl}
                alt={currentCard.hanzi}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl text-gray-300">{currentCard.meaning}</div>
          </div>
        )}
        
        {/* Self-test - character alone for retrieval practice */}
        {viewPhase === 'self-test' && currentCard && (
          <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-white">{currentCard.hanzi}</div>
        )}
      </div>
      
      {/* Progress and status indicators - only show during active phases */}
      {(['flash', 'quiz', 'countdown', 'initial-countdown'] as const).includes(phase as any) && actualSessionCards > 0 && (
        <div className="fixed top-4 sm:top-8 right-4 sm:right-8 text-xs sm:text-sm text-gray-500 text-right">
          <div className="text-violet-400 font-medium mb-1">
            {mode === 'new' ? 'New Cards' : mode === 'review' ? 'Review Session' : 'Practice Mode'}
          </div>
          <div>Studied: {totalCardsStudied} / {actualSessionCards} cards</div>
          {quizResults.length > 0 && (
            <div className="text-green-400">
              Correct: {quizResults.filter(r => r).length} / {quizResults.length} 
              ({Math.round((quizResults.filter(r => r).length / quizResults.length) * 100)}%)
            </div>
          )}
          <div>Time: {formatTime(elapsedTime)}</div>
        </div>
      )}
      
      {/* Status indicators */}
      {phase === 'flash' && (
        <div className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 text-xs sm:text-sm text-gray-500">
          Block {currentBlock}/3 • Card {currentIndex + 1}/{blockCards.length}
        </div>
      )}
      
      <div className="fixed bottom-4 sm:bottom-8 left-4 sm:left-8 text-xs sm:text-sm text-gray-500">
        <span className="hidden sm:inline">Press P to {isPaused ? 'resume' : 'pause'} • R to restart • Q/ESC to exit</span>
        <span className="sm:hidden">P: {isPaused ? 'Resume' : 'Pause'} • Q: Exit</span>
      </div>
      
      {/* Block indicator for second and third passes */}
      {currentBlock > 1 && phase === 'flash' && (
        <div className="fixed top-4 sm:top-8 left-4 sm:left-8 text-xs sm:text-sm text-gray-500">
          Pass {currentBlock} - {currentBlock === 2 ? 'Reinforcement' : 'Final consolidation'}
        </div>
      )}
      
      {/* Pause indicator */}
      {isPaused && (
        <div className="fixed top-4 sm:top-8 left-1/2 transform -translate-x-1/2 text-yellow-500 text-base sm:text-lg">
          ⏸ PAUSED
        </div>
      )}
      
      {/* Play audio during phonological phase - but not in Block 3 (mental pronunciation) */}
      {viewPhase === 'phonological' && currentCard?.audioUrl && !isPaused && currentBlock !== 3 && (
        <audio src={currentCard.audioUrl} autoPlay />
      )}
    </div>
  );
}
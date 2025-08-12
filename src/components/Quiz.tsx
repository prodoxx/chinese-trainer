'use client';

import { useState, useEffect, useCallback } from 'react';
import { playBuzzSound } from '@/lib/audio/buzz';
import { useAlert } from '@/hooks/useAlert';
import { useAudio } from '@/contexts/AudioContext';

interface Card {
  id: string;
  hanzi: string;
  meaning: string;
  pinyin: string;
  imageUrl?: string;
  audioUrl?: string;
}

interface QuizProps {
  cards: Card[];
  deckId: string;
  onComplete: (results: boolean[]) => void;
  onExit: () => void;
}

interface Question {
  type: 'meaning-to-hanzi' | 'image-match' | 'type-in' | 'audio-to-hanzi';
  correctCard: Card;
  options: Card[];
}

interface QuizResult {
  cardId: string;
  correct: boolean;
  responseTimeMs: number;
  timedOut: boolean;
}

export default function Quiz({ cards, deckId, onComplete, onExit }: QuizProps) {
  const { showConfirm } = useAlert();
  const { playAudio, stopAudio, unlockAudio } = useAudio();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [detailedResults, setDetailedResults] = useState<QuizResult[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [timedOut, setTimedOut] = useState(false);
  const [audioPlayed, setAudioPlayed] = useState(false);
  
  // Time limits per spec
  const getTimeLimit = (type: Question['type']) => {
    switch (type) {
      case 'meaning-to-hanzi':
      case 'image-match':
      case 'audio-to-hanzi':
        return 10000; // 10 seconds for multiple choice questions
      case 'type-in':
        return 15000; // 15 seconds for type-in (optional MVP)
      default:
        return 10000;
    }
  };
  
  useEffect(() => {
    generateQuestions();
  }, [cards, deckId]);
  
  useEffect(() => {
    setQuestionStartTime(Date.now());
    setTimedOut(false);
    setAudioPlayed(false);
    // Stop any playing audio when question changes
    stopAudio();
    // Reset time remaining when question changes
    if (questions.length > 0) {
      setTimeRemaining(getTimeLimit(questions[currentQuestion].type) / 1000);
    }
  }, [currentQuestion, questions, stopAudio]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);
  
  // Play audio for audio-to-hanzi questions
  useEffect(() => {
    if (questions.length > 0 && 
        questions[currentQuestion].type === 'audio-to-hanzi' && 
        !audioPlayed && 
        !showResult) {
      const correctCard = questions[currentQuestion].correctCard;
      if (correctCard.audioUrl) {
        playAudio(correctCard.audioUrl).catch(err => {
          console.error('Failed to play question audio:', err);
        });
        setAudioPlayed(true);
      }
    }
  }, [currentQuestion, questions, audioPlayed, showResult, playAudio]);
  
  const generateQuestions = async () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    // Quiz all cards that are passed in
    const numQuestions = cards.length;
    const questions: Question[] = [];
    
    // Define question types to cycle through
    const questionTypes: Question['type'][] = ['meaning-to-hanzi', 'audio-to-hanzi', 'image-match'];
    
    // Fetch commonly confused characters for better distractors
    let confusedCharactersMap: Record<string, string[]> = {};
    try {
      const response = await fetch('/api/cards/confused-characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          characters: cards.map(c => c.hanzi),
          limit: 5 // Get more confused characters to ensure we have enough
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        confusedCharactersMap = data.confusables || {};
      }
    } catch (error) {
      console.error('Failed to fetch confused characters:', error);
    }
    
    // Fetch all cards from deck for better distractor pool
    let allDeckCards: Card[] = [];
    try {
      const response = await fetch(`/api/decks/${deckId}/cards`);
      if (response.ok) {
        const data = await response.json();
        allDeckCards = data.cards || [];
      }
    } catch (error) {
      console.error('Failed to fetch all deck cards:', error);
    }
    
    // Pre-fetch cards by semantic category for cards that need them
    const semanticCategoryMap: Record<string, Card[]> = {};
    for (const card of shuffled) {
      // Get semantic category from the card (assuming it's available)
      const semanticCategory = (card as any).semanticCategory;
      if (semanticCategory && !semanticCategoryMap[semanticCategory]) {
        try {
          const response = await fetch('/api/cards/similar-category', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              semanticCategory,
              excludeIds: cards.map(c => c.id),
              limit: 10
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            semanticCategoryMap[semanticCategory] = data.cards || [];
          }
        } catch (error) {
          console.error(`Failed to fetch cards for category ${semanticCategory}:`, error);
        }
      }
    }
    
    for (let i = 0; i < numQuestions; i++) {
      const correctCard = shuffled[i];
      const options = [correctCard];
      
      // First, try to use commonly confused characters as distractors
      const confusedChars = confusedCharactersMap[correctCard.hanzi] || [];
      const confusedDistractors = cards
        .filter(c => c.id !== correctCard.id && confusedChars.includes(c.hanzi))
        .slice(0, 3);
      
      // If not enough from current session, look in all deck cards
      if (confusedDistractors.length < 3 && allDeckCards.length > 0) {
        const additionalConfused = allDeckCards
          .filter(c => 
            c.id !== correctCard.id && 
            confusedChars.includes(c.hanzi) &&
            !confusedDistractors.some(d => d.id === c.id)
          )
          .slice(0, 3 - confusedDistractors.length);
        confusedDistractors.push(...additionalConfused);
      }
      
      // If still not enough, add random distractors from session cards
      let remainingCount = 3 - confusedDistractors.length;
      const sessionDistractors = remainingCount > 0 
        ? cards
            .filter(c => c.id !== correctCard.id && !confusedDistractors.some(d => d.id === c.id))
            .sort(() => Math.random() - 0.5)
            .slice(0, remainingCount)
        : [];
      
      options.push(...confusedDistractors, ...sessionDistractors);
      
      // If still not 4 options, add from all deck cards
      if (options.length < 4 && allDeckCards.length > 0) {
        remainingCount = 4 - options.length;
        const deckDistractors = allDeckCards
          .filter(c => !options.some(o => o.id === c.id))
          .sort(() => Math.random() - 0.5)
          .slice(0, remainingCount);
        options.push(...deckDistractors);
      }
      
      // If still not 4 options, fetch cards from same semantic category
      if (options.length < 4) {
        const semanticCategory = (correctCard as any).semanticCategory;
        if (semanticCategory && semanticCategoryMap[semanticCategory]) {
          remainingCount = 4 - options.length;
          const categoryDistractors = semanticCategoryMap[semanticCategory]
            .filter(c => !options.some(o => o.id === c.id))
            .slice(0, remainingCount);
          options.push(...categoryDistractors);
        }
      }
      
      // Final fallback: use any enriched cards from the database
      if (options.length < 4) {
        try {
          // Fetch random enriched cards as last resort
          const response = await fetch('/api/cards/similar-category', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              semanticCategory: 'general', // Use a generic category
              excludeIds: options.map(o => o.id),
              limit: 4 - options.length
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.cards && data.cards.length > 0) {
              options.push(...data.cards.slice(0, 4 - options.length));
            }
          }
        } catch (error) {
          console.error('Failed to fetch fallback cards:', error);
        }
      }
      
      // Ensure we have exactly 4 options
      options.splice(4);
      options.sort(() => Math.random() - 0.5);
      
      // Cycle through question types
      const questionType = questionTypes[i % questionTypes.length];
      
      // Skip image-match if the card has no image
      const finalType = (questionType === 'image-match' && !correctCard.imageUrl) 
        ? 'meaning-to-hanzi' 
        : questionType;
      
      questions.push({
        type: finalType,
        correctCard,
        options,
      });
    }
    
    setQuestions(questions);
  };
  
  const handleKeyPress = useCallback(async (e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key.toLowerCase() === 'q') {
      const confirmed = await showConfirm('Are you sure you want to exit the quiz?', {
        type: 'warning',
        confirmText: 'Exit',
        cancelText: 'Continue'
      });
      if (confirmed) {
        onExit();
      }
    } else if (e.key.toLowerCase() === 'r') {
      const confirmed = await showConfirm('Are you sure you want to restart the entire flash session?', {
        type: 'warning',
        confirmText: 'Restart',
        cancelText: 'Continue'
      });
      if (confirmed) {
        // Exit quiz and trigger restart from parent
        onExit();
      }
    } else if (!showResult && ['1', '2', '3', '4'].includes(e.key)) {
      const index = parseInt(e.key) - 1;
      if (index < questions[currentQuestion].options.length) {
        handleAnswer(questions[currentQuestion].options[index].id);
      }
    } else if (showResult && e.key === ' ') {
      e.preventDefault();
      nextQuestion();
    }
  }, [showResult, currentQuestion, questions, onExit, showConfirm]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
  
  // Timer countdown effect
  useEffect(() => {
    if (!showResult && questions.length > 0 && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            handleAnswer(null); // Time's up
            return 0;
          }
          return newTime;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [currentQuestion, showResult, questions, timeRemaining]);
  
  const handleAnswer = (answerId: string | null) => {
    if (showResult) return;
    
    const responseTimeMs = Date.now() - questionStartTime;
    setSelectedAnswer(answerId);
    setShowResult(true);
    
    const isCorrect = answerId === questions[currentQuestion].correctCard.id;
    setResults([...results, isCorrect]);
    
    // Mark if this was a timeout
    const wasTimeout = answerId === null;
    if (wasTimeout) {
      setTimedOut(true);
    }
    
    // Track detailed result
    const detailedResult: QuizResult = {
      cardId: questions[currentQuestion].correctCard.id,
      correct: isCorrect,
      responseTimeMs,
      timedOut: wasTimeout,
    };
    setDetailedResults([...detailedResults, detailedResult]);
    
    // Handle audio feedback
    if (answerId && !isCorrect) {
      // Wrong answer: play buzz, then correct audio after delay
      playBuzzSound();
      
      // Play correct audio after buzz
      setTimeout(() => {
        const correctCard = questions[currentQuestion].correctCard;
        if (correctCard.audioUrl) {
          playAudio(correctCard.audioUrl).catch(err => console.error('Failed to play correct audio:', err));
        }
      }, 400); // Wait for buzz to finish
    } else if (isCorrect) {
      // Correct answer: play the audio immediately
      const correctCard = questions[currentQuestion].correctCard;
      if (correctCard.audioUrl) {
        playAudio(correctCard.audioUrl).catch(err => console.error('Failed to play audio:', err));
      }
    }
  };
  
  const nextQuestion = async () => {
    if (currentQuestion + 1 >= questions.length) {
      // Submit reviews before completing
      try {
        await submitReviews();
      } catch (error) {
        console.error('Failed to submit reviews:', error);
      }
      onComplete(results);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setAudioPlayed(false);
    }
  };
  
  const submitReviews = async () => {
    const submissions = detailedResults.map(result => ({
      ...result,
      deckId,
    }));
    
    console.log('Submitting reviews:', submissions);
    
    try {
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissions),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Review submission failed:', response.status, errorData);
        throw new Error(`Failed to submit reviews: ${response.status} ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      console.log('Reviews submitted successfully:', data);
    } catch (error) {
      console.error('Error submitting reviews:', error);
      throw error;
    }
  };
  
  // Auto-advance after answer selection (but not on timeout)
  useEffect(() => {
    if (showResult && !timedOut) {
      const timer = setTimeout(() => {
        nextQuestion();
      }, 2000); // 2 seconds to review the answer
      
      return () => clearTimeout(timer);
    }
  }, [showResult, timedOut]);
  
  if (questions.length === 0) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center">Preparing quiz...</div>;
  }
  
  const question = questions[currentQuestion];
  
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-4" onClick={unlockAudio}>
      <div className="max-w-4xl w-full px-4 sm:px-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <div className="text-base sm:text-xl">Question {currentQuestion + 1} of {questions.length}</div>
            <div className={`text-base sm:text-xl ${timeRemaining < 5 ? 'text-red-500' : ''}`}>
              {Math.ceil(timeRemaining)}s
            </div>
          </div>
          
          <div className="text-xl sm:text-2xl md:text-3xl text-center mb-6 sm:mb-8">
            {question.type === 'meaning-to-hanzi' ? (
              <div>Which character means &ldquo;{question.correctCard.meaning}&rdquo;?</div>
            ) : question.type === 'audio-to-hanzi' ? (
              <div className="space-y-4">
                <div>Which character did you hear?</div>
                <button
                  onClick={() => {
                    unlockAudio();
                    playAudio(question.correctCard.audioUrl!).catch(err => console.error('Failed to replay audio:', err));
                  }}
                  className="mx-auto px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" />
                  </svg>
                  Play Again
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>Which image matches this character?</div>
                <div className="text-5xl sm:text-6xl">{question.correctCard.hanzi}</div>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {question.options.map((option, index) => (
            <button
              key={option.id}
              onClick={() => handleAnswer(option.id)}
              disabled={showResult}
              className={`
                p-4 sm:p-6 rounded-lg border-2 transition-all cursor-pointer relative overflow-hidden
                ${showResult && option.id === question.correctCard.id
                  ? 'border-green-400 bg-green-900 text-green-100'
                  : showResult && option.id !== question.correctCard.id
                  ? 'border-red-400 bg-red-900 text-red-100'
                  : 'border-gray-700 hover:border-gray-500'
                }
                ${!showResult && 'hover:bg-gray-900'}
              `}
            >
              {showResult && option.id === question.correctCard.id && (
                <div className="absolute inset-0 bg-green-500 opacity-20 pointer-events-none" />
              )}
              {showResult && option.id !== question.correctCard.id && (
                <div className="absolute inset-0 bg-red-500 opacity-20 pointer-events-none" />
              )}
              <div className="flex items-center space-x-2 relative z-10">
                <span className={showResult ? '' : 'text-gray-500'}>{index + 1}.</span>
                {question.type === 'meaning-to-hanzi' || question.type === 'audio-to-hanzi' ? (
                  <span className="text-3xl sm:text-4xl">{option.hanzi}</span>
                ) : (
                  option.imageUrl ? (
                    <img src={option.imageUrl} alt="" className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded" />
                  ) : (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-800 rounded flex items-center justify-center">
                      {option.hanzi}
                    </div>
                  )
                )}
              </div>
            </button>
          ))}
        </div>
        
        {showResult && (
          <div className="mt-6 sm:mt-8 text-center">
            <div className="text-lg sm:text-xl md:text-2xl mb-3 sm:mb-4">
              {timedOut ? '⏰ Time\'s up!' : selectedAnswer === question.correctCard.id ? '✓ Correct!' : '✗ Incorrect'}
            </div>
            <div className="text-gray-400">
              {timedOut ? 'Press SPACE to continue' : 'Auto-advancing...'}
            </div>
          </div>
        )}
      </div>
      
      <div className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 text-xs sm:text-sm text-gray-500">
        <span className="hidden sm:inline">{!showResult && 'Press 1-4 to answer • '}R to restart • Q/ESC to exit</span>
        <span className="sm:hidden">Q: Exit</span>
      </div>
    </div>
  );
}
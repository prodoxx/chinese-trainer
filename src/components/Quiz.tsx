'use client';

import { useState, useEffect, useCallback } from 'react';
import { playBuzzSound } from '@/lib/audio/buzz';

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
  onComplete: (results: boolean[]) => void;
  onExit: () => void;
}

interface Question {
  type: 'meaning-to-hanzi' | 'image-match' | 'type-in';
  correctCard: Card;
  options: Card[];
}

export default function Quiz({ cards, onComplete, onExit }: QuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [timedOut, setTimedOut] = useState(false);
  
  // Time limits per spec
  const getTimeLimit = (type: Question['type']) => {
    switch (type) {
      case 'meaning-to-hanzi':
      case 'image-match':
        return 10000; // 10 seconds for multiple choice and image match
      case 'type-in':
        return 15000; // 15 seconds for type-in (optional MVP)
      default:
        return 10000;
    }
  };
  
  useEffect(() => {
    generateQuestions();
  }, [cards]);
  
  useEffect(() => {
    setStartTime(Date.now());
    setTimedOut(false);
    // Reset time remaining when question changes
    if (questions.length > 0) {
      setTimeRemaining(getTimeLimit(questions[currentQuestion].type) / 1000);
    }
  }, [currentQuestion, questions]);
  
  const generateQuestions = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    const numQuestions = Math.min(3, cards.length);
    const questions: Question[] = [];
    
    for (let i = 0; i < numQuestions; i++) {
      const correctCard = shuffled[i];
      const options = [correctCard];
      
      // Add 3 distractors
      const distractors = cards
        .filter(c => c.id !== correctCard.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      options.push(...distractors);
      options.sort(() => Math.random() - 0.5);
      
      questions.push({
        type: i % 2 === 0 ? 'meaning-to-hanzi' : 'image-match',
        correctCard,
        options,
      });
    }
    
    setQuestions(questions);
  };
  
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key.toLowerCase() === 'q') {
      if (confirm('Are you sure you want to exit the quiz?')) {
        onExit();
      }
    } else if (e.key.toLowerCase() === 'r') {
      if (confirm('Are you sure you want to restart the entire flash session?')) {
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
  }, [showResult, currentQuestion, questions, onExit]);
  
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
    
    setSelectedAnswer(answerId);
    setShowResult(true);
    
    const isCorrect = answerId === questions[currentQuestion].correctCard.id;
    setResults([...results, isCorrect]);
    
    // Mark if this was a timeout
    if (answerId === null) {
      setTimedOut(true);
    }
    
    // Handle audio feedback
    if (answerId && !isCorrect) {
      // Wrong answer: play buzz, then correct audio after delay
      playBuzzSound();
      
      // Play correct audio after buzz
      setTimeout(() => {
        const correctCard = questions[currentQuestion].correctCard;
        if (correctCard.audioUrl) {
          const audio = new Audio(correctCard.audioUrl);
          audio.play().catch(err => console.error('Failed to play correct audio:', err));
        }
      }, 400); // Wait for buzz to finish
    } else if (isCorrect) {
      // Correct answer: play the audio immediately
      const correctCard = questions[currentQuestion].correctCard;
      if (correctCard.audioUrl) {
        const audio = new Audio(correctCard.audioUrl);
        audio.play().catch(err => console.error('Failed to play audio:', err));
      }
    }
  };
  
  const nextQuestion = () => {
    if (currentQuestion + 1 >= questions.length) {
      onComplete(results);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
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
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="max-w-4xl w-full px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="text-xl">Question {currentQuestion + 1} of {questions.length}</div>
            <div className={`text-xl ${timeRemaining < 5 ? 'text-red-500' : ''}`}>
              {Math.ceil(timeRemaining)}s
            </div>
          </div>
          
          <div className="text-3xl text-center mb-8">
            {question.type === 'meaning-to-hanzi' ? (
              <div>Which character means &ldquo;{question.correctCard.meaning}&rdquo;?</div>
            ) : (
              <div className="space-y-4">
                <div>Which image matches this character?</div>
                <div className="text-6xl">{question.correctCard.hanzi}</div>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {question.options.map((option, index) => (
            <button
              key={option.id}
              onClick={() => handleAnswer(option.id)}
              disabled={showResult}
              className={`
                p-6 rounded-lg border-2 transition-all cursor-pointer
                ${showResult && option.id === question.correctCard.id
                  ? 'border-green-500 bg-green-900/30'
                  : showResult && option.id !== question.correctCard.id
                  ? 'border-red-500 bg-red-900/30'
                  : 'border-gray-700 hover:border-gray-500'
                }
                ${!showResult && 'hover:bg-gray-900'}
              `}
            >
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">{index + 1}.</span>
                {question.type === 'meaning-to-hanzi' ? (
                  <span className="text-4xl">{option.hanzi}</span>
                ) : (
                  option.imageUrl ? (
                    <img src={option.imageUrl} alt="" className="w-32 h-32 object-cover rounded" />
                  ) : (
                    <div className="w-32 h-32 bg-gray-800 rounded flex items-center justify-center">
                      {option.hanzi}
                    </div>
                  )
                )}
              </div>
            </button>
          ))}
        </div>
        
        {showResult && (
          <div className="mt-8 text-center">
            <div className="text-2xl mb-4">
              {timedOut ? '⏰ Time\'s up!' : selectedAnswer === question.correctCard.id ? '✓ Correct!' : '✗ Incorrect'}
            </div>
            <div className="text-gray-400">
              {timedOut ? 'Press SPACE to continue' : 'Auto-advancing...'}
            </div>
          </div>
        )}
      </div>
      
      <div className="fixed bottom-8 right-8 text-sm text-gray-500">
        {!showResult && 'Press 1-4 to answer • '}R to restart • Q/ESC to exit
      </div>
    </div>
  );
}
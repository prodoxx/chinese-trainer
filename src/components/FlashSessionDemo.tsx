'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface FlashSessionDemoProps {
  onComplete: () => void;
  onSkip: () => void;
  onDontShowAgain: () => void;
  onQuit: () => void;
}

export default function FlashSessionDemo({ onComplete, onSkip, onDontShowAgain, onQuit }: FlashSessionDemoProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showDontShowAgain, setShowDontShowAgain] = useState(false);

  const slides = [
    {
      title: "Welcome to Flash Sessions! 🎯",
      content: "Let's quickly show you how this works...",
      diagram: `
    Flash Session Overview:
    
    📚 8 characters per session
    ⚡ 3 characters at a time  
    🧠 Quiz after each block
    
    Designed for optimal learning
    and modern attention spans!
      `,
      typingSpeed: 8
    },
    {
      title: "Flash Cards Structure 📋",
      content: "Each character goes through 4 phases:",
      diagram: `
    1. CHARACTER (0.8s)
       [ 大 ]
    
    2. + SOUND (2s)
       [ 大 ]
       [ dà ]
    
    3. + MEANING (2s)
       [IMG]
       [big]
    
    4. SELF-TEST (1.5s)
       [ 大 ]
       [ ? ]
      `,
      typingSpeed: 6
    },
    {
      title: "Three Learning Blocks 🔄",
      content: "Each set of 3 characters goes through 3 blocks:",
      diagram: `
    BLOCK 1: Initial Exposure
    • See all 4 phases separately
    • Build recognition slowly
    • Audio support included
    
    BLOCK 2: Reinforcement  
    • Everything shown together
    • Strengthen connections
    • 3 seconds per character
    
    BLOCK 3: Mental Practice
    • Quick recognition test
    • No audio (mental pronunciation)
    • Prepare for quiz
      `,
      typingSpeed: 7
    },
    {
      title: "Mini Quizzes Keep You Sharp! 🎮",
      content: "After every 3 characters, test your memory:",
      diagram: `
    Session Flow:
    
    [大][小][中] → 3 Blocks → Quiz!
         ↓
    [上][下][左] → 3 Blocks → Quiz!
         ↓
    [右][前] → 3 Blocks → Final Quiz!
    
    Total: 8 characters, 3 quizzes
    Keeps you engaged throughout!
      `,
      typingSpeed: 8
    },
    {
      title: "Quiz Format 💡",
      content: "We use smart distractors to challenge you:",
      diagram: `
    Question: Which character means "big"?
    
    [1] 大    [2] 太    [3] 天    [4] 犬
    
    • Similar-looking characters
    • Common confusions  
    • Helps strengthen recognition
    
    Press 1-4 or click to answer!
      `,
      typingSpeed: 7
    },
    {
      title: "Ready to Start? 🚀",
      content: "Remember: Focus, learn, and have fun!",
      diagram: `
    Tips for Success:
    
    • Stay focused during blocks
    • Trust your memory in quizzes
    • Learn from mistakes
    • Take breaks between sessions
    
    Press START when ready!
    
    (Press Q anytime to quit)
      `,
      typingSpeed: 10
    }
  ];

  useEffect(() => {
    if (currentSlide >= slides.length) return;

    const slide = slides[currentSlide];
    const fullText = slide.content + '\n' + slide.diagram;
    
    if (isTyping && typedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText(fullText.slice(0, typedText.length + 1));
      }, slide.typingSpeed);
      
      return () => clearTimeout(timeout);
    } else if (typedText.length >= fullText.length) {
      setIsTyping(false);
      
      // Show "don't show again" option on last slide
      if (currentSlide === slides.length - 1) {
        setShowDontShowAgain(true);
      }
    }
  }, [typedText, currentSlide, isTyping]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      setTypedText('');
      setIsTyping(true);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const handleDontShowAgain = async () => {
    onDontShowAgain();
  };

  const handleReplay = () => {
    setCurrentSlide(0);
    setTypedText('');
    setIsTyping(true);
    setShowDontShowAgain(false);
  };

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.key.toLowerCase() === 'q') {
      onQuit();
    }
  }, [onQuit]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const slide = slides[currentSlide];

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-[#f7cc48] w-8' 
                  : index < currentSlide 
                  ? 'bg-[#f7cc48]/50' 
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Slide content */}
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#f7cc48] mb-4">
            {slide.title}
          </h2>
          
          <div className="text-left">
            <pre className="font-mono text-xs sm:text-sm text-gray-300 whitespace-pre-wrap">
              {typedText}
              {isTyping && <span className="animate-pulse">▊</span>}
            </pre>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          {currentSlide < slides.length - 1 ? (
            <>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-white transition-colors text-sm order-2 sm:order-1"
              >
                Skip Tutorial
              </button>
              <button
                onClick={handleNext}
                disabled={isTyping}
                className={`px-6 py-2 rounded-lg font-medium transition-all order-1 sm:order-2 ${
                  isTyping 
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                    : 'bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black'
                }`}
              >
                Next →
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <div className="flex items-center gap-3 flex-1">
                  {showDontShowAgain && (
                    <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleDontShowAgain();
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#f7cc48] focus:ring-[#f7cc48] focus:ring-offset-0"
                      />
                      Don't show this again
                    </label>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleReplay}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
                  >
                    ↺ Replay Demo
                  </button>
                  <button
                    onClick={onComplete}
                    className="px-8 py-3 bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black rounded-lg font-bold text-lg transition-all transform hover:scale-105"
                  >
                    Start Flash Session
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Keyboard shortcut hint */}
        <div className="absolute bottom-4 right-4 text-xs text-gray-500">
          Press Q to quit
        </div>
      </motion.div>
    </div>
  );
}
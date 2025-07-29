'use client';

import { useState } from 'react';
import DeckImport from '@/components/DeckImport';
import DeckList from '@/components/DeckList';
import FlashSession from '@/components/FlashSession';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Target, Brain } from 'lucide-react';

export default function HomeContent() {
  const { data: session } = useSession();
  const [view, setView] = useState<'home' | 'session'>('home');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [sessionMode, setSessionMode] = useState<'new' | 'review' | 'practice'>('new');
  const [refreshDecks, setRefreshDecks] = useState(0);
  
  const handleSelectDeck = (deckId: string, mode: 'new' | 'review' | 'practice') => {
    setSelectedDeckId(deckId);
    setSessionMode(mode);
    setView('session');
  };
  
  const handleExitSession = () => {
    setView('home');
    setSelectedDeckId(null);
  };
  
  const handleImportComplete = () => {
    setRefreshDecks(prev => prev + 1);
  };
  
  if (view === 'session' && selectedDeckId) {
    return <FlashSession deckId={selectedDeckId} mode={sessionMode} onExit={handleExitSession} />;
  }

  // Landing page for unauthenticated users
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black">
        <div className="max-w-7xl mx-auto px-8 py-20">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Master Traditional Chinese
              <span className="block text-blue-500">Through Focused Practice</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              Science-backed learning system designed for optimal retention and 
              comfortable study sessions. Built for serious learners.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all transform hover:scale-105 inline-flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/auth/signin"
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-all border border-gray-700"
              >
                Sign In
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-8">
              <BookOpen className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Smart Flash Cards
              </h3>
              <p className="text-gray-400">
                Dual-phase learning system with visual recognition and multi-modal integration
              </p>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-8">
              <Brain className="w-12 h-12 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Science-Based Design
              </h3>
              <p className="text-gray-400">
                Built on cognitive science research for optimal memory retention
              </p>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-8">
              <Target className="w-12 h-12 text-purple-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Progress Tracking
              </h3>
              <p className="text-gray-400">
                Detailed analytics to monitor your learning journey and achievements
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Original authenticated view
  return (
    <div className="min-h-screen bg-black">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-950 to-black opacity-50" />
      
      <div className="relative z-10 min-h-screen">
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Decks Section - Takes up 2 columns */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Your Learning Decks</h2>
                <p className="text-sm text-gray-500">Select a deck to begin your focused study session</p>
              </div>
              <DeckList key={refreshDecks} onSelectDeck={handleSelectDeck} />
            </div>
            
            {/* Import Section - Takes up 1 column */}
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Add New Deck</h2>
                <p className="text-sm text-gray-500">Import CSV files with Traditional Chinese characters</p>
              </div>
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-6">
                <DeckImport onImportComplete={handleImportComplete} />
              </div>
            </div>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="mt-auto border-t border-gray-900">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <p className="text-center text-sm text-gray-600">
              Focus mode learning environment • Optimized for retention
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
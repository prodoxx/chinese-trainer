'use client';

import { useState } from 'react';
import DeckImport from '@/components/DeckImport';
import DeckList from '@/components/DeckList';
import FlashSession from '@/components/FlashSession';
import Analytics from '@/components/Analytics';

export default function Home() {
  const [view, setView] = useState<'home' | 'session' | 'analytics'>('home');
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
  
  if (view === 'analytics') {
    return <Analytics onBack={() => setView('home')} />;
  }
  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">Chinese Character Trainer</h1>
              <p className="text-gray-400">Learn Traditional Chinese characters with spaced repetition</p>
            </div>
            <button
              onClick={() => setView('analytics')}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Analytics
            </button>
          </div>
        </header>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Your Decks</h2>
            <DeckList key={refreshDecks} onSelectDeck={handleSelectDeck} />
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-4">Import New Deck</h2>
            <DeckImport onImportComplete={handleImportComplete} />
          </div>
        </div>
      </div>
    </div>
  );
}
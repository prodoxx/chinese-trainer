'use client';

import { useState } from 'react';
import DeckImport from '@/components/DeckImport';
import DeckList from '@/components/DeckList';
import FlashSession from '@/components/FlashSession';
import Header from '@/components/Header';

export default function Home() {
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
  
  return (
    <div className="min-h-screen bg-black">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-950 to-black opacity-50" />
      
      <div className="relative z-10 min-h-screen">
        <Header />
        
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
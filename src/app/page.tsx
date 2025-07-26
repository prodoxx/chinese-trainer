'use client';

import { useState } from 'react';
import DeckImport from '@/components/DeckImport';
import DeckList from '@/components/DeckList';
import FlashSession from '@/components/FlashSession';

export default function Home() {
  const [view, setView] = useState<'home' | 'session'>('home');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [refreshDecks, setRefreshDecks] = useState(0);
  
  const handleSelectDeck = (deckId: string) => {
    setSelectedDeckId(deckId);
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
    return <FlashSession deckId={selectedDeckId} onExit={handleExitSession} />;
  }
  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Chinese Character Trainer</h1>
          <p className="text-gray-400">Learn Traditional Chinese characters with spaced repetition</p>
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
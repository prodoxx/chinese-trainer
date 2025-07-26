'use client';

import { useEffect, useState } from 'react';

interface Deck {
  id: string;
  name: string;
  cardsCount: number;
  status: 'importing' | 'enriching' | 'ready';
  enrichmentProgress?: {
    totalCards: number;
    processedCards: number;
    currentCard?: string;
    currentOperation?: string;
  };
  updatedAt: string;
}

interface DeckListProps {
  onSelectDeck: (deckId: string) => void;
}

export default function DeckList({ onSelectDeck }: DeckListProps) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrichingDeck, setEnrichingDeck] = useState<string | null>(null);
  const [deletingDeck, setDeletingDeck] = useState<string | null>(null);
  
  useEffect(() => {
    fetchDecks();
  }, []);
  
  useEffect(() => {
    // Poll for deck updates every 2 seconds if any deck is importing/enriching
    const hasNonReadyDecks = decks.some(d => d.status !== 'ready');
    
    if (hasNonReadyDecks) {
      const interval = setInterval(fetchDecks, 2000);
      return () => clearInterval(interval);
    }
  }, [decks]);
  
  const fetchDecks = async () => {
    try {
      const response = await fetch('/api/decks');
      const data = await response.json();
      setDecks(data.decks || []);
    } catch (error) {
      console.error('Failed to fetch decks:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleReEnrich = async (e: React.MouseEvent, deckId: string) => {
    e.stopPropagation(); // Prevent deck selection
    
    const isForce = e.shiftKey;
    const message = isForce 
      ? 'Force re-enrich ALL images in this deck? This will update ALL images (but only add missing audio).'
      : 'Re-enrich cards with missing/placeholder images and audio in this deck?';
    
    if (!confirm(message)) {
      return;
    }
    
    setEnrichingDeck(deckId);
    
    try {
      const response = await fetch(`/api/decks/${deckId}/re-enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: isForce, sessionId: `session-${Date.now()}` }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log(`Re-enrichment job queued: ${data.jobId}`);
        // Refresh decks to show the updated status
        await fetchDecks();
      } else {
        alert(`Re-enrichment failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Re-enrichment error:', error);
      alert('Re-enrichment failed. Please try again.');
    } finally {
      setEnrichingDeck(null);
    }
  };
  
  const handleDelete = async (e: React.MouseEvent, deckId: string, deckName: string) => {
    e.stopPropagation(); // Prevent deck selection
    
    if (!confirm(`Delete deck "${deckName}"?\n\nNote: Characters will be preserved if they're used in other decks.`)) {
      return;
    }
    
    setDeletingDeck(deckId);
    
    try {
      const response = await fetch(`/api/decks/${deckId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Remove deck from local state
        setDecks(decks.filter(d => d.id !== deckId));
        alert(`Deck "${deckName}" deleted successfully`);
      } else {
        alert(`Failed to delete deck: ${data.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete deck. Please try again.');
    } finally {
      setDeletingDeck(null);
    }
  };
  
  if (loading) {
    return <div className="text-gray-400">Loading decks...</div>;
  }
  
  if (decks.length === 0) {
    return <div className="text-gray-400">No decks yet. Import a deck to get started!</div>;
  }
  
  return (
    <>
      <div className="space-y-3">
        {decks.map((deck) => (
        <div
          key={deck.id}
          className="border border-gray-800 rounded-lg p-4 transition-colors"
        >
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{deck.name}</h3>
                {deck.status !== 'ready' && (
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    deck.status === 'importing' ? 'bg-blue-900 text-blue-300' : 'bg-yellow-900 text-yellow-300'
                  }`}>
                    {deck.status}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400">{deck.cardsCount} cards</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleDelete(e, deck.id, deck.name)}
                disabled={deletingDeck === deck.id || deck.status !== 'ready'}
                className="px-3 py-1 text-xs bg-red-900/50 hover:bg-red-800/50 rounded transition-colors disabled:opacity-50 cursor-pointer"
                title="Delete deck"
              >
                {deletingDeck === deck.id ? '...' : '🗑'}
              </button>
              <button
                onClick={(e) => handleReEnrich(e, deck.id)}
                disabled={enrichingDeck === deck.id || deck.status !== 'ready'}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors disabled:opacity-50 cursor-pointer"
                title="Re-enrich missing images/audio (Shift+click to force update ALL)"
              >
                {enrichingDeck === deck.id ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
              <button 
                onClick={() => deck.status === 'ready' && onSelectDeck(deck.id)}
                disabled={deck.status !== 'ready'}
                className={`${
                  deck.status === 'ready' 
                    ? 'text-violet-400 hover:text-violet-300 cursor-pointer' 
                    : 'text-gray-600 cursor-not-allowed'
                }`}
              >
                Study →
              </button>
            </div>
          </div>
          
          {deck.status !== 'ready' && deck.enrichmentProgress && (
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>{deck.enrichmentProgress.currentOperation || 'Processing...'}</span>
                <span>{deck.enrichmentProgress.processedCards}/{deck.enrichmentProgress.totalCards}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div 
                  className="bg-violet-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(deck.enrichmentProgress.processedCards / deck.enrichmentProgress.totalCards) * 100}%` 
                  }}
                />
              </div>
              {deck.enrichmentProgress.currentCard && (
                <p className="text-xs text-gray-500">
                  Current: {deck.enrichmentProgress.currentCard}
                </p>
              )}
            </div>
          )}
        </div>
        ))}
      </div>
      <div className="mt-4 text-xs text-gray-500">
        Tip: Hold Shift while clicking 🔄 to force re-enrich all cards
      </div>
    </>
  );
}
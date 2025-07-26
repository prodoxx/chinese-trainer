'use client';

import { useState } from 'react';

interface DeckImportProps {
  onImportComplete: () => void;
}

export default function DeckImport({ onImportComplete }: DeckImportProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name.replace('.csv', ''));
    
    try {
      const response = await fetch('/api/decks/import', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }
      
      if (data.errors?.length > 0) {
        console.warn('Import errors:', data.errors);
      }
      
      // Start enrichment process
      await fetch('/api/cards/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId: data.deck.id, limit: 50 }),
      });
      
      onImportComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <div className="border border-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Import Deck</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Upload CSV file with &quot;hanzi&quot; header
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isImporting}
            className="block w-full text-sm text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-900 file:text-violet-100
              hover:file:bg-violet-800
              file:cursor-pointer cursor-pointer
              disabled:opacity-50"
          />
        </div>
        
        {isImporting && (
          <div className="text-sm text-gray-400">Importing and enriching cards...</div>
        )}
        
        {error && (
          <div className="text-sm text-red-500">{error}</div>
        )}
      </div>
    </div>
  );
}
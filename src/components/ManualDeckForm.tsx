'use client';

import { useState } from 'react';
import { Plus, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface ManualDeckFormProps {
  onDeckCreated: () => void;
}

export default function ManualDeckForm({ onDeckCreated }: ManualDeckFormProps) {
  const [deckName, setDeckName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateDeckName = (name: string): string | null => {
    // Trim the name
    const trimmedName = name.trim();
    
    // Check if empty
    if (!trimmedName) {
      return 'Deck name cannot be empty';
    }
    
    // Check length
    if (trimmedName.length < 2) {
      return 'Deck name must be at least 2 characters';
    }
    
    if (trimmedName.length > 50) {
      return 'Deck name must be less than 50 characters';
    }
    
    // Check for special characters (allow letters, numbers, spaces, and basic punctuation)
    const validNameRegex = /^[\p{L}\p{N}\s\-_.,!?()]+$/u;
    if (!validNameRegex.test(trimmedName)) {
      return 'Deck name contains invalid characters';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate deck name
    const validationError = validateDeckName(deckName);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    const trimmedName = deckName.trim();
    
    setIsCreating(true);
    setError('');
    setSuccess(false);
    
    try {
      // Create the deck
      const response = await fetch('/api/decks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          description: `Manually created deck: ${trimmedName}`,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create deck');
      }
      
      // Success
      setSuccess(true);
      setDeckName('');
      onDeckCreated();
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deck');
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeckName(e.target.value);
    // Clear error when user starts typing
    if (error) setError('');
    if (success) setSuccess(false);
  };

  return (
    <div className="bg-[#21262d] rounded-2xl border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 p-4 sm:p-6 shadow-lg shadow-[#f7cc48]/10 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-[#f7cc48]/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <form onSubmit={handleSubmit} className="relative space-y-4">
        <div>
          <label htmlFor="deckName" className="block text-sm font-medium text-gray-300 mb-2">
            Deck Name
          </label>
          <div className="relative">
            <input
              type="text"
              id="deckName"
              value={deckName}
              onChange={handleInputChange}
              placeholder="Enter deck name..."
              disabled={isCreating}
              className={`
                w-full px-4 py-3 bg-[#1a1f2e] border rounded-lg text-white placeholder-gray-500
                transition-all duration-200 outline-none
                ${error 
                  ? 'border-red-500 focus:border-red-400' 
                  : 'border-gray-700 hover:border-gray-600 focus:border-[#f7cc48] focus:ring-1 focus:ring-[#f7cc48]/20'
                }
                ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              autoComplete="off"
              maxLength={50}
            />
            {deckName && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                {deckName.trim().length}/50
              </div>
            )}
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isCreating || !deckName.trim()}
          className={`
            w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold
            transition-all duration-200 transform shadow-lg
            ${isCreating || !deckName.trim()
              ? 'bg-[#f7cc48]/30 text-black/40 cursor-not-allowed shadow-none'
              : 'bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black hover:scale-[1.02] active:scale-[0.98] shadow-[#f7cc48]/20 hover:shadow-[#f7cc48]/30'
            }
          `}
        >
          {isCreating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Create Deck
            </>
          )}
        </button>
        
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/20 border border-red-900/30 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="flex items-center gap-2 text-sm text-green-400 bg-green-900/20 border border-green-900/30 rounded-lg p-3">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>Deck created successfully!</span>
          </div>
        )}
      </form>
    </div>
  );
}
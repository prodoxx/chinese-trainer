'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

interface CharacterMeaning {
  pinyin: string;
  meaning: string;
  frequency?: string;
}

interface SingleCardDisambiguationProps {
  character: {
    hanzi: string;
    cardId: string;
    meanings: CharacterMeaning[];
  };
  onSelect: (selection: { pinyin: string; meaning: string }) => void;
  onCancel: () => void;
}

export default function SingleCardDisambiguation({ 
  character, 
  onSelect, 
  onCancel 
}: SingleCardDisambiguationProps) {
  const [selectedMeaning, setSelectedMeaning] = useState<number | null>(null);

  const handleConfirm = () => {
    if (selectedMeaning === null) return;
    
    const selected = character.meanings[selectedMeaning];
    onSelect({
      pinyin: selected.pinyin,
      meaning: selected.meaning
    });
  };

  const getFrequencyBadge = (frequency?: string) => {
    if (!frequency) return null;
    
    const colors: Record<string, string> = {
      'very common': 'bg-green-500/20 text-green-400 border-green-500/30',
      'common': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'less common': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };

    return (
      <span className={`px-2 py-0.5 text-xs rounded-full border ${colors[frequency] || colors['common']}`}>
        {frequency}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a1f2e] rounded-2xl max-w-md w-full border border-[#2d3548] shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#2d3548]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#f7cc48]" />
                Select Meaning
              </h2>
              <p className="text-gray-400 mt-1 text-sm">
                This character has multiple meanings. Which one do you want to use?
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 hover:bg-[#2d3548] rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-4">
            <div className="text-6xl font-bold text-white">{character.hanzi}</div>
          </div>

          <div className="space-y-2">
            {character.meanings.map((meaning, index) => (
              <button
                key={index}
                onClick={() => setSelectedMeaning(index)}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                  selectedMeaning === index
                    ? 'border-[#f7cc48] bg-[#f7cc48]/10'
                    : 'border-[#2d3548] hover:border-[#3d4558] bg-[#232937]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-lg font-semibold text-[#f7cc48]">{meaning.pinyin}</span>
                      {getFrequencyBadge(meaning.frequency)}
                    </div>
                    <p className="text-sm text-gray-300">{meaning.meaning}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 ${
                    selectedMeaning === index
                      ? 'border-[#f7cc48] bg-[#f7cc48]'
                      : 'border-gray-600'
                  }`}>
                    {selectedMeaning === index && (
                      <CheckCircle className="w-3 h-3 text-[#1a1f2e]" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-[#232937] hover:bg-[#2d3548] text-gray-300 rounded-lg transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedMeaning === null}
            className={`flex-1 px-4 py-2.5 rounded-lg transition-all font-medium text-sm ${
              selectedMeaning === null
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-[#1a1f2e] shadow-lg hover:shadow-xl'
            }`}
          >
            Re-enrich with Selection
          </button>
        </div>
      </div>
    </div>
  );
}
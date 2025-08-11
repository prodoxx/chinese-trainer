'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import { convertPinyinToneNumbersToMarks } from '@/lib/utils/pinyin';

interface CharacterMeaning {
  pinyin: string;
  meaning: string;
  frequency?: string;
}

interface MultiMeaningCharacter {
  hanzi: string;
  position: number;
  meanings: CharacterMeaning[];
}

interface DisambiguationModalProps {
  characters: MultiMeaningCharacter[];
  onComplete: (selections: Record<string, { pinyin: string; meaning: string }>) => void;
  onCancel: () => void;
  isImport?: boolean;
}

export default function DisambiguationModal({ 
  characters, 
  onComplete, 
  onCancel,
  isImport = true 
}: DisambiguationModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, { pinyin: string; meaning: string }>>({});
  const [selectedMeaning, setSelectedMeaning] = useState<number | null>(null);

  const currentCharacter = characters[currentIndex];
  const isLastCharacter = currentIndex === characters.length - 1;

  const handleNext = () => {
    if (selectedMeaning === null) return;

    const selected = currentCharacter.meanings[selectedMeaning];
    const updatedSelections = {
      ...selections,
      [currentCharacter.hanzi]: {
        pinyin: selected.pinyin,
        meaning: selected.meaning
      }
    };
    
    setSelections(updatedSelections);

    if (isLastCharacter) {
      onComplete(updatedSelections);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedMeaning(null);
    }
  };

  const handleUseCommonForAll = () => {
    const allSelections: Record<string, { pinyin: string; meaning: string }> = {};
    
    characters.forEach(char => {
      // Select the first meaning (usually most common) or the one marked as "very common"
      const commonMeaning = char.meanings.find(m => m.frequency === 'very common') || char.meanings[0];
      allSelections[char.hanzi] = {
        pinyin: commonMeaning.pinyin,
        meaning: commonMeaning.meaning
      };
    });

    onComplete(allSelections);
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
      <div className="bg-[#1a1f2e] rounded-2xl max-w-2xl w-full border border-[#2d3548] shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#2d3548]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-[#f7cc48]" />
                Multiple Meanings Found
              </h2>
              <p className="text-gray-400 mt-1">
                Some characters have multiple pronunciations and meanings. Please select which one you want to study.
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-[#2d3548] rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>Character {currentIndex + 1} of {characters.length}</span>
              <button
                onClick={handleUseCommonForAll}
                className="text-[#f7cc48] hover:text-[#f7cc48]/80 transition-colors"
              >
                Use most common for all →
              </button>
            </div>
            <div className="w-full bg-[#2d3548] rounded-full h-2">
              <div 
                className="bg-[#f7cc48] h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / characters.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative">
          <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="text-center mb-6 sticky top-0 bg-[#1a1f2e] pb-4 z-10">
              <div className="text-8xl font-bold text-white mb-4">{currentCharacter.hanzi}</div>
              <p className="text-gray-400">
                {isImport 
                  ? `Row ${currentCharacter.position} in your CSV`
                  : 'Select the meaning for this character'
                }
              </p>
              {currentCharacter.meanings.length > 4 && (
                <p className="text-sm text-gray-500 mt-2">
                  {currentCharacter.meanings.length} meanings available • Scroll to see all
                </p>
              )}
            </div>

            <div className="space-y-3">
            {currentCharacter.meanings.map((meaning, index) => (
              <button
                key={index}
                onClick={() => setSelectedMeaning(index)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedMeaning === index
                    ? 'border-[#f7cc48] bg-[#f7cc48]/10'
                    : 'border-[#2d3548] hover:border-[#3d4558] bg-[#232937]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-2xl font-semibold text-[#f7cc48]">{convertPinyinToneNumbersToMarks(meaning.pinyin)}</span>
                      {getFrequencyBadge(meaning.frequency)}
                    </div>
                    <p className="text-gray-300">{meaning.meaning}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedMeaning === index
                      ? 'border-[#f7cc48] bg-[#f7cc48]'
                      : 'border-gray-600'
                  }`}>
                    {selectedMeaning === index && (
                      <CheckCircle className="w-4 h-4 text-[#1a1f2e]" />
                    )}
                  </div>
                </div>
              </button>
            ))}
            </div>
          </div>
          {/* Scroll indicator */}
          {currentCharacter.meanings.length > 4 && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#1a1f2e] to-transparent pointer-events-none" />
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#2d3548] flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-[#232937] hover:bg-[#2d3548] text-gray-300 rounded-lg transition-colors"
          >
            Cancel {isImport ? 'Import' : ''}
          </button>
          <button
            onClick={handleNext}
            disabled={selectedMeaning === null}
            className={`flex-1 px-4 py-3 rounded-lg transition-all font-medium ${
              selectedMeaning === null
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-[#1a1f2e] shadow-lg hover:shadow-xl'
            }`}
          >
            {isLastCharacter 
              ? (isImport ? 'Complete & Start Import' : 'Add Character')
              : 'Next Character →'
            }
          </button>
        </div>
      </div>
    </div>
  );
}
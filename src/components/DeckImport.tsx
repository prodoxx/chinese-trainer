'use client';

import { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import DisambiguationModal from './DisambiguationModal';

interface DeckImportProps {
  onImportComplete: () => void;
}

interface MultiMeaningCharacter {
  hanzi: string;
  position: number;
  meanings: Array<{
    pinyin: string;
    meaning: string;
    frequency?: string;
  }>;
}

export default function DeckImport({ onImportComplete }: DeckImportProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [pendingImport, setPendingImport] = useState<{
    file: File;
    hanziList: string[];
  } | null>(null);
  const [disambiguationData, setDisambiguationData] = useState<MultiMeaningCharacter[] | null>(null);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };
  
  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    
    setIsImporting(true);
    setError('');
    
    try {
      // First, parse the CSV to extract hanzi list
      const text = await file.text();
      const lines = text.trim().split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('CSV file is empty');
      }
      
      // Check if first line is a header or a character
      let startIndex = 0;
      const firstLine = lines[0].trim();
      
      // If first line contains "hanzi" or doesn't look like Chinese characters, skip it
      if (firstLine.toLowerCase().includes('hanzi') || 
          !/^[\u4e00-\u9fff]+$/.test(firstLine)) {
        startIndex = 1;
      }
      
      const hanziList: string[] = [];
      for (let i = startIndex; i < lines.length; i++) {
        const hanzi = lines[i].trim();
        if (hanzi && /^[\u4e00-\u9fff]+$/.test(hanzi) && hanzi.length <= 4) {
          hanziList.push(hanzi);
        }
      }
      
      if (hanziList.length === 0) {
        throw new Error('No valid characters found in CSV');
      }
      
      // Check for disambiguation needs
      const disambiguationResponse = await fetch('/api/decks/check-disambiguation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanziList }),
      });
      
      const disambiguationResult = await disambiguationResponse.json();
      
      if (!disambiguationResponse.ok) {
        throw new Error(disambiguationResult.error || 'Failed to check disambiguation');
      }
      
      if (disambiguationResult.needsDisambiguation) {
        // Show disambiguation modal
        setPendingImport({ file, hanziList });
        setDisambiguationData(disambiguationResult.charactersNeedingClarification);
        setIsImporting(false);
      } else {
        // No disambiguation needed, proceed with import
        await proceedWithImport(file, null);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setIsImporting(false);
    }
  };

  const proceedWithImport = async (
    file: File, 
    disambiguationSelections: Record<string, { pinyin: string; meaning: string }> | null
  ) => {
    setIsImporting(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name.replace('.csv', ''));
    formData.append('sessionId', `session-${Date.now()}`);
    
    if (disambiguationSelections) {
      formData.append('disambiguationSelections', JSON.stringify(disambiguationSelections));
    }
    
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
      
      // Import job has been queued
      console.log(`Import job queued: ${data.jobId}`);
      
      // Deck created successfully
      onImportComplete();
      setIsImporting(false);
      
      // Clear pending import data
      setPendingImport(null);
      setDisambiguationData(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setIsImporting(false);
    }
  };

  const handleDisambiguationComplete = (selections: Record<string, { pinyin: string; meaning: string }>) => {
    if (pendingImport) {
      proceedWithImport(pendingImport.file, selections);
    }
  };

  const handleDisambiguationCancel = () => {
    setPendingImport(null);
    setDisambiguationData(null);
    setError('Import cancelled');
  };
  
  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all duration-200
          ${dragActive 
            ? 'border-[#f7cc48] bg-[#f7cc48]/10' 
            : 'border-gray-800 hover:border-gray-700 hover:bg-gray-900/30'
          }
          ${isImporting ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={isImporting}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          id="file-upload"
        />
        
        <div className="space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#f7cc48]/20 to-[#f7cc48]/10 rounded-2xl flex items-center justify-center mx-auto">
            {isImporting ? (
              <RefreshCw className="w-8 h-8 text-[#f7cc48] animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-[#f7cc48]" />
            )}
          </div>
          
          <div>
            <p className="text-white font-medium mb-1">
              {isImporting ? 'Importing...' : 'Drop CSV file here'}
            </p>
            <p className="text-sm text-gray-500">
              or <label htmlFor="file-upload" className="text-[#f7cc48] hover:text-[#f7cc48]/80 cursor-pointer">browse</label> to upload
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>CSV format</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>One character per line</span>
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/20 border border-red-900/30 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="text-xs text-gray-600 space-y-1">
        <p>• Each line should contain one Chinese character (1-4 characters)</p>
        <p>• No header required - just list the characters</p>
        <p>• The system will auto-enrich with meanings, pinyin, images & audio</p>
      </div>

      {/* Disambiguation Modal */}
      {disambiguationData && (
        <DisambiguationModal
          characters={disambiguationData}
          onComplete={handleDisambiguationComplete}
          onCancel={handleDisambiguationCancel}
        />
      )}
    </div>
  );
}
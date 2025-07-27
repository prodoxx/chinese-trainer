'use client';

import { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface DeckImportProps {
  onImportComplete: () => void;
}

export default function DeckImport({ onImportComplete }: DeckImportProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
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
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name.replace('.csv', ''));
    formData.append('sessionId', `session-${Date.now()}`);
    
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
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setIsImporting(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${dragActive 
            ? 'border-violet-600 bg-violet-900/10' 
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
          <div className="w-16 h-16 bg-gradient-to-br from-violet-600/20 to-purple-600/20 rounded-2xl flex items-center justify-center mx-auto">
            {isImporting ? (
              <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-violet-400" />
            )}
          </div>
          
          <div>
            <p className="text-white font-medium mb-1">
              {isImporting ? 'Importing...' : 'Drop CSV file here'}
            </p>
            <p className="text-sm text-gray-500">
              or <label htmlFor="file-upload" className="text-violet-400 hover:text-violet-300 cursor-pointer">browse</label> to upload
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>CSV format</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>&quot;hanzi&quot; header required</span>
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
        <p>• Each row should contain one Chinese character</p>
        <p>• The system will auto-enrich with meanings, pinyin, images & audio</p>
      </div>
    </div>
  );
}
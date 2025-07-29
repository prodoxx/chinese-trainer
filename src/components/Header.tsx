'use client';

import Link from 'next/link';
import { Brain, Sparkles, BarChart3 } from 'lucide-react';

interface HeaderProps {
  onBack?: () => void;
  showAnalyticsLink?: boolean;
}

export default function Header({ onBack, showAnalyticsLink = true }: HeaderProps) {
  return (
    <header className="border-b border-gray-900">
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
            <Link href="/" className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  Danbing
                  <Sparkles className="w-5 h-5 text-violet-400" />
                </h1>
                <p className="text-sm text-gray-500">Master Traditional Chinese characters with Taiwan pronunciation</p>
              </div>
            </Link>
          </div>
          {showAnalyticsLink && (
            <Link
              href="/analytics"
              className="group px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl transition-all duration-200 flex items-center gap-2 border border-gray-800 hover:border-gray-700"
            >
              <BarChart3 className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span className="text-sm font-medium">Analytics</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
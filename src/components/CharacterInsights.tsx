'use client';

import { useState } from 'react';
import { EnhancedCharacterComplexity } from '@/lib/analytics/enhanced-linguistic-complexity';
import { DeepLinguisticAnalysis } from '@/lib/analytics/openai-linguistic-analysis';

interface CharacterInsightsProps {
  characterId: string;
  character: string;
  onClose: () => void;
}

interface InsightsData {
  character: {
    hanzi: string;
    pinyin: string;
    meaning: string;
    imageUrl?: string;
  };
  complexity: EnhancedCharacterComplexity;
  reviewHistory: {
    seen: number;
    correct: number;
    accuracy: number;
    avgResponseTime: number;
    lastReviewed: string;
    nextDue: string;
    difficulty: number;
  } | null;
  confusionAnalysis: Array<{
    character: string;
    meaning: string;
    pinyin: string;
    confusion: {
      visual: number;
      semantic: number;
      phonetic: number;
      tonal: number;
      total: number;
    };
  }>;
  aiInsights: DeepLinguisticAnalysis | null;
}

export default function CharacterInsights({ characterId, character, onClose }: CharacterInsightsProps) {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [includeAI, setIncludeAI] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/character-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId, includeAI }),
      });
      
      const data = await response.json();
      if (data.success) {
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useState(() => {
    fetchInsights();
  });

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 0.3) return 'text-green-400';
    if (difficulty < 0.5) return 'text-yellow-400';
    if (difficulty < 0.7) return 'text-orange-400';
    return 'text-red-400';
  };

  const getProgressBar = (value: number, max: number = 1) => {
    const percentage = (value / max) * 100;
    return (
      <div className="bg-[#2d3548] rounded-full h-2 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#f7cc48] to-orange-400"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  const formatTonePattern = (pattern: string, pinyin: string) => {
    if (!pattern) return 'No tones';
    
    // If pattern contains dash (e.g., "4-4"), it's already formatted
    if (pattern.includes('-')) {
      const toneNames = {
        '1': 'high level',
        '2': 'rising',
        '3': 'dipping',
        '4': 'falling',
        '5': 'neutral'
      };
      
      const tones = pattern.split('-');
      return tones.map(t => `${t} (${toneNames[t as keyof typeof toneNames] || 'unknown'})`).join(' + ');
    }
    
    // Legacy format without dashes
    const toneNames = {
      '1': '1st (high)',
      '2': '2nd (rising)',
      '3': '3rd (dipping)',
      '4': '4th (falling)',
      '5': 'neutral'
    };
    
    // For compound words, show each syllable's tone
    const syllables = pinyin.split(' ');
    const tones = pattern.split('');
    
    if (syllables.length === tones.length) {
      return syllables.map((syl, i) => {
        const tone = tones[i];
        const toneName = toneNames[tone as keyof typeof toneNames] || tone;
        return `${syl} (${toneName})`;
      }).join(' + ');
    }
    
    // Fallback to just showing the pattern with descriptions
    return tones.map(t => toneNames[t as keyof typeof toneNames] || t).join(' + ');
  };

  // Process text to add pinyin for Chinese characters
  const processTextWithPinyin = (text: string) => {
    if (!text) return text;
    
    // For the current character being studied
    const currentChar = insights?.character.hanzi;
    const currentPinyin = insights?.character.pinyin;
    
    if (currentChar && currentPinyin && text.includes(currentChar)) {
      text = text.replace(new RegExp(currentChar, 'g'), `${currentChar} (${currentPinyin})`);
    }
    
    // For confused characters
    if (insights?.confusionAnalysis) {
      insights.confusionAnalysis.forEach(item => {
        if (text.includes(item.character)) {
          text = text.replace(new RegExp(item.character, 'g'), `${item.character} (${item.pinyin})`);
        }
      });
    }
    
    return text;
  };

  return (
    <div className="fixed inset-0 bg-[#0f1419]/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a1f2e]/95 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-[#2d3548] shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#2d3548] bg-[#232937] flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              <span className="text-[#f7cc48]">Character Insights: </span>
              <span className="text-white">{character}</span>
            </h2>
            <p className="text-gray-300">Deep linguistic analysis and learning patterns</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2d3548] rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-[#2d3548] rounded-lg"></div>
              <div className="h-48 bg-[#2d3548] rounded-lg"></div>
              <div className="h-64 bg-[#2d3548] rounded-lg"></div>
            </div>
          ) : insights ? (
            <div className="space-y-6">
              {/* Character Overview */}
              <div className="bg-[#232937] rounded-lg p-6 border border-[#2d3548]">
                <div className="flex items-start gap-6">
                  {insights.character.imageUrl && (
                    <img 
                      src={insights.character.imageUrl} 
                      alt={insights.character.hanzi}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <div className="text-5xl font-bold mb-2">{insights.character.hanzi}</div>
                    <div className="text-2xl text-[#f7cc48] mb-1">{insights.character.pinyin}</div>
                    <div className="text-lg text-gray-300">{insights.character.meaning}</div>
                  </div>
                </div>
              </div>

              {/* Complexity Analysis */}
              <div className="bg-[#232937] rounded-lg p-6 border border-[#2d3548]">
                <h3 className="text-xl font-semibold mb-4 text-[#f7cc48]">Complexity Analysis</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-300 mb-1">Overall Difficulty</div>
                    <div className={`text-2xl font-bold ${getDifficultyColor(insights.complexity.overallDifficulty)}`}>
                      {(insights.complexity.overallDifficulty * 100).toFixed(0)}%
                    </div>
                    {getProgressBar(insights.complexity.overallDifficulty)}
                  </div>
                  <div>
                    <div className="text-sm text-gray-300 mb-1">Visual Complexity</div>
                    <div className="text-2xl font-bold">{(insights.complexity.visualComplexity * 100).toFixed(0)}%</div>
                    {getProgressBar(insights.complexity.visualComplexity)}
                  </div>
                  <div>
                    <div className="text-sm text-gray-300 mb-1">Stroke Count</div>
                    <div className="text-2xl font-bold">{insights.complexity.strokeCount}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-300 mb-1">Components</div>
                    <div className="text-2xl font-bold">{insights.complexity.componentCount}</div>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Semantic Category</span>
                    <span className="text-[#f7cc48] capitalize">{insights.complexity.semanticCategory || 'Not detected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Concept Type</span>
                    <span className="capitalize">{
                      insights.complexity.concreteAbstract === 'concrete' ? 'Concrete' :
                      insights.complexity.concreteAbstract === 'abstract' ? 'Abstract' :
                      'Mixed (Concrete & Abstract)'
                    }</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Tone Pattern</span>
                    <span>{formatTonePattern(insights.complexity.tonePattern, insights.character.pinyin)}</span>
                  </div>
                </div>
              </div>

              {/* Review Performance */}
              {insights.reviewHistory && (
                <div className="bg-[#232937] rounded-lg p-6 border border-[#2d3548]">
                  <h3 className="text-xl font-semibold mb-4 text-[#f7cc48]">Your Performance</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-300">Times Seen</div>
                      <div className="text-2xl font-bold">{insights.reviewHistory.seen}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-300">Accuracy</div>
                      <div className={`text-2xl font-bold ${
                        insights.reviewHistory.accuracy >= 80 ? 'text-green-400' :
                        insights.reviewHistory.accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {insights.reviewHistory.accuracy.toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-300">Avg Response</div>
                      <div className="text-2xl font-bold">{(insights.reviewHistory.avgResponseTime / 1000).toFixed(1)}s</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-300">Difficulty</div>
                      <div className="text-2xl font-bold">{insights.reviewHistory.difficulty.toFixed(1)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Confusion Analysis */}
              {insights.confusionAnalysis.length > 0 && (
                <div className="bg-[#232937] rounded-lg p-6 border border-[#2d3548]">
                  <h3 className="text-xl font-semibold mb-4 text-[#f7cc48]">Commonly Confused With</h3>
                  <div className="space-y-3">
                    {insights.confusionAnalysis.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-[#1a1f2e] rounded-lg border border-[#2d3548]">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold">{item.character}</div>
                          <div>
                            <div className="text-sm text-[#f7cc48]/80">{item.pinyin}</div>
                            <div className="text-xs text-gray-400">{item.meaning}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-300">Confusion Risk</div>
                          <div className={`text-lg font-bold ${getDifficultyColor(item.confusion.total)}`}>
                            {(item.confusion.total * 100).toFixed(0)}%
                          </div>
                          <div className="flex gap-2 text-xs text-gray-400">
                            <span>V:{(item.confusion.visual * 100).toFixed(0)}%</span>
                            <span>P:{(item.confusion.phonetic * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Memory Aids (from enrichment) */}
              {insights.complexity.mnemonics && insights.complexity.mnemonics.length > 0 && (
                <div className="bg-[#232937] rounded-lg p-6 border border-[#2d3548]">
                  <h3 className="text-xl font-semibold mb-4 text-[#f7cc48]">Memory Aids</h3>
                  <div className="space-y-3">
                    {insights.complexity.mnemonics.map((mnemonic, index) => (
                      <div key={index} className="p-3 bg-[#1a1f2e] rounded-lg border border-[#2d3548]">
                        <p className="text-gray-100">{processTextWithPinyin(mnemonic)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Etymology (from enrichment) */}
              {insights.complexity.etymology && (
                <div className="bg-[#232937] rounded-lg p-6 border border-[#2d3548]">
                  <h3 className="text-xl font-semibold mb-4 text-[#f7cc48]">Etymology</h3>
                  <p className="text-gray-100">{processTextWithPinyin(insights.complexity.etymology)}</p>
                </div>
              )}

              {/* AI Insights Toggle */}
              {!insights.aiInsights && (
                <div className="bg-[#232937] rounded-lg p-6 text-center border border-[#2d3548]">
                  <h3 className="text-xl font-semibold mb-2 text-[#f7cc48]">Want Deeper Insights?</h3>
                  <p className="text-gray-300 mb-4">Get AI-powered mnemonics, etymology, and personalized learning tips</p>
                  <button
                    onClick={() => {
                      setIncludeAI(true);
                      fetchInsights();
                    }}
                    className="px-6 py-2 bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-semibold rounded-lg transition-all hover:shadow-[0_0_20px_rgba(247,204,72,0.4)]"
                  >
                    Generate AI Insights
                  </button>
                </div>
              )}

              {/* AI Insights */}
              {insights.aiInsights && (
                <>
                  {/* Mnemonics */}
                  <div className="bg-[#232937] rounded-lg p-6 border border-[#2d3548]">
                    <h3 className="text-xl font-semibold mb-4 text-[#f7cc48]">Memory Aids</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm text-gray-300 mb-1">Visual Mnemonic</h4>
                        <p className="text-gray-100">{processTextWithPinyin(insights.aiInsights.mnemonics.visual)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm text-gray-300 mb-1">Story</h4>
                        <p className="text-gray-100">{processTextWithPinyin(insights.aiInsights.mnemonics.story)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm text-gray-300 mb-1">Component Analysis</h4>
                        <p className="text-gray-100">{processTextWithPinyin(insights.aiInsights.mnemonics.components)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Etymology */}
                  {insights.aiInsights.etymology && (
                    <div className="bg-[#232937] rounded-lg p-6 border border-[#2d3548]">
                      <h3 className="text-xl font-semibold mb-4 text-[#f7cc48]">Etymology</h3>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm text-gray-300 mb-1">Origin</h4>
                          <p className="text-gray-100">{insights.aiInsights.etymology.origin}</p>
                        </div>
                        <div>
                          <h4 className="text-sm text-gray-300 mb-1">Evolution</h4>
                          <ol className="list-decimal list-inside space-y-1">
                            {insights.aiInsights.etymology.evolution.map((stage, i) => (
                              <li key={i} className="text-gray-100">{stage}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Learning Tips */}
                  <div className="bg-[#232937] rounded-lg p-6 border border-[#2d3548]">
                    <h3 className="text-xl font-semibold mb-4 text-[#f7cc48]">Learning Tips</h3>
                    <div className="space-y-3">
                      {insights.aiInsights.learningTips.forBeginners.length > 0 && (
                        <div>
                          <h4 className="text-sm text-gray-300 mb-1">For Beginners</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {insights.aiInsights.learningTips.forBeginners.map((tip, i) => (
                              <li key={i} className="text-gray-100">{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400">Failed to load insights</div>
          )}
        </div>
      </div>
    </div>
  );
}
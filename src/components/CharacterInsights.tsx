'use client';

import { useState, useEffect } from 'react';
import { EnhancedCharacterComplexity } from '@/lib/analytics/enhanced-linguistic-complexity';
import { DeepLinguisticAnalysis } from '@/lib/analytics/openai-linguistic-analysis';

interface CharacterInsightsProps {
  characterId: string;
  character: string;
  onClose: () => void;
  cardData?: any; // Pre-loaded card data to avoid re-fetching
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

export default function CharacterInsights({ characterId, character, onClose, cardData }: CharacterInsightsProps) {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/character-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          characterId, 
          includeAI: false // Don't request AI insights by default - they're slow
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setInsights(data.insights);
        
        // If AI insights are not already cached, fetch them in the background
        if (!data.insights.aiInsights) {
          fetchAIInsights();
        }
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };

  // Separate function to fetch AI insights in the background
  const fetchAIInsights = async () => {
    try {
      const response = await fetch('/api/analytics/character-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          characterId, 
          includeAI: true
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.insights.aiInsights) {
        setInsights(prev => prev ? {
          ...prev,
          aiInsights: data.insights.aiInsights
        } : null);
      }
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
    }
  };

  // Fetch on mount
  useEffect(() => {
    // If we have card data with enriched information, use it for immediate display
    if (cardData && cardData.semanticCategory && cardData.tonePattern) {
      const quickInsights: InsightsData = {
        character: {
          hanzi: cardData.hanzi,
          pinyin: cardData.pinyin,
          meaning: cardData.meaning || cardData.english?.join(', '),
          imageUrl: cardData.imageUrl,
        },
        complexity: {
          character: cardData.hanzi,
          pinyin: cardData.pinyin,
          definitions: [cardData.meaning || cardData.english?.join(', ')],
          strokeCount: cardData.strokeCount || 0,
          radicalCount: 0,
          componentCount: cardData.componentCount || 0,
          characterLength: cardData.hanzi.length,
          isPhonetic: false,
          isSemantic: true,
          semanticCategory: cardData.semanticCategory,
          phoneticComponent: undefined,
          tonePattern: cardData.tonePattern,
          toneDifficulty: 0.5,
          semanticFields: [],
          concreteAbstract: 'concrete',
          polysemy: 1,
          frequency: 3,
          contextDiversity: 1,
          visualComplexity: cardData.visualComplexity || 0.5,
          phoneticTransparency: 0.5,
          semanticTransparency: 0.7,
          overallDifficulty: cardData.overallDifficulty || 0.5,
          // Include mnemonics and etymology if available
          ...(cardData.mnemonics && { mnemonics: cardData.mnemonics }),
          ...(cardData.etymology && { etymology: cardData.etymology }),
        } as any,
        reviewHistory: cardData.stats ? {
          seen: cardData.stats.totalReviews || 0,
          correct: cardData.stats.correctReviews || 0,
          accuracy: cardData.stats.accuracy || 0,
          avgResponseTime: 0,
          lastReviewed: cardData.stats.lastReviewed,
          nextDue: '',
          difficulty: cardData.stats.difficulty || 2.5,
        } : null,
        confusionAnalysis: [],
        aiInsights: cardData.aiInsights || null,
      };
      
      setInsights(quickInsights);
      // Still fetch full insights in background for confusion analysis
      fetchInsights();
    } else {
      fetchInsights();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    
    // Common character-to-pinyin mappings for frequently used characters
    const commonPinyin: Record<string, string> = {
      '固': 'gù',
      '執': 'zhí', 
      '堅': 'jiān',
      '持': 'chí',
      '頑': 'wán',
      '岩': 'yán',
      '石': 'shí',
      '人': 'rén',
      '手': 'shǒu',
      '握': 'wò',
      '拿': 'ná',
      '拒': 'jù',
      '絕': 'jué',
      '放': 'fàng',
      '棄': 'qì',
      '改': 'gǎi',
      '變': 'biàn',
      '心': 'xīn',
      '意': 'yì',
      '見': 'jiàn',
      '想': 'xiǎng',
      '法': 'fǎ',
      '念': 'niàn',
      '信': 'xìn',
      '仰': 'yǎng',
      '物': 'wù',
      '體': 'tǐ',
      '東': 'dōng',
      '西': 'xī',
      '時': 'shí',
      '候': 'hòu',
      '代': 'dài',
      '表': 'biǎo',
      '示': 'shì',
      '現': 'xiàn',
      '當': 'dāng',
      '今': 'jīn',
      '在': 'zài'
    };
    
    // For the current character being studied
    const currentChar = insights?.character.hanzi;
    const currentPinyin = insights?.character.pinyin;
    
    if (currentChar && currentPinyin && text.includes(currentChar)) {
      text = text.replace(new RegExp(`(?<!\\()${currentChar}(?!\\s*\\()`, 'g'), `${currentChar} (${currentPinyin})`);
    }
    
    // For confused characters
    if (insights?.confusionAnalysis) {
      insights.confusionAnalysis.forEach(item => {
        if (text.includes(item.character) && item.pinyin) {
          text = text.replace(new RegExp(`(?<!\\()${item.character}(?!\\s*\\()`, 'g'), `${item.character} (${item.pinyin})`);
        }
      });
    }
    
    // Add pinyin for other common Chinese characters
    Object.entries(commonPinyin).forEach(([char, pinyin]) => {
      if (text.includes(char)) {
        text = text.replace(new RegExp(`(?<!\\()${char}(?!\\s*\\()`, 'g'), `${char} (${pinyin})`);
      }
    });
    
    return text;
  };

  return (
    <div className="fixed inset-0 bg-[#0f1419]/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-[#1a1f2e]/95 rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-[#2d3548] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-4 sm:p-6 border-b border-[#2d3548] bg-[#232937] flex justify-between items-start flex-shrink-0">
          <div className="pr-2">
            <h2 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">
              <span className="text-[#f7cc48]">Character Insights: </span>
              <span className="text-white">{character}</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-300 hidden sm:block">Deep linguistic analysis and learning patterns</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-[#2d3548] rounded-lg transition-colors text-gray-400 hover:text-white flex-shrink-0"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 pb-safe">
          {loading && !insights ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="mb-6">
                <svg className="animate-spin h-12 w-12 text-[#f7cc48] mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-[#f7cc48]">Analyzing Character</h3>
              <p className="text-gray-300 mb-6 max-w-md">
                Loading linguistic analysis, complexity metrics, and learning patterns for this character
              </p>
              <div className="bg-[#232937] rounded-lg p-4 border border-[#2d3548] max-w-sm">
                <div className="flex items-center justify-center gap-3 text-sm text-gray-400">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-[#f7cc48] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#f7cc48] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-[#f7cc48] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span>Preparing insights...</span>
                </div>
              </div>
            </div>
          ) : insights ? (
            <div className="space-y-4 sm:space-y-6 pb-8">
              {/* Character Overview */}
              <div className="bg-[#232937] rounded-lg p-4 sm:p-4 sm:p-6 border border-[#2d3548]">
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
              <div className="bg-[#232937] rounded-lg p-4 sm:p-4 sm:p-6 border border-[#2d3548]">
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
                <div className="bg-[#232937] rounded-lg p-4 sm:p-6 border border-[#2d3548]">
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
                <div className="bg-[#232937] rounded-lg p-4 sm:p-6 border border-[#2d3548]">
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

              {/* Memory Aids (from enrichment) - only show if no AI insights */}
              {(insights.complexity as any).mnemonics && (insights.complexity as any).mnemonics.length > 0 && !insights.aiInsights && (
                <div className="bg-[#232937] rounded-lg p-4 sm:p-6 border border-[#2d3548]">
                  <h3 className="text-xl font-semibold mb-4 text-[#f7cc48]">Memory Aids</h3>
                  <div className="space-y-3">
                    {(insights.complexity as any).mnemonics.map((mnemonic: string, index: number) => (
                      <div key={index} className="p-3 bg-[#1a1f2e] rounded-lg border border-[#2d3548]">
                        <p className="text-gray-100">{processTextWithPinyin(mnemonic)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Etymology (from enrichment) - only show if no AI insights */}
              {(insights.complexity as any).etymology && !insights.aiInsights && (
                <div className="bg-[#232937] rounded-lg p-4 sm:p-6 border border-[#2d3548]">
                  <h3 className="text-xl font-semibold mb-4 text-[#f7cc48]">Etymology</h3>
                  <p className="text-gray-100">{processTextWithPinyin((insights.complexity as any).etymology)}</p>
                </div>
              )}

              {/* AI Insights Note (only if no AI insights available) */}
              {!insights.aiInsights && (
                <div className="bg-[#232937] rounded-lg p-4 sm:p-6 text-center border border-[#2d3548]">
                  <h3 className="text-lg font-semibold mb-2 text-gray-300">💡 AI Insights Coming Soon</h3>
                  <p className="text-gray-400 text-sm">
                    AI-powered mnemonics, etymology, and learning tips will be automatically generated when this character is re-enriched.
                  </p>
                </div>
              )}

              {/* AI Insights */}
              {insights.aiInsights && (
                <>
                  {/* Mnemonics */}
                  <div className="bg-[#232937] rounded-lg p-4 sm:p-6 border border-[#2d3548]">
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
                    <div className="bg-[#232937] rounded-lg p-4 sm:p-6 border border-[#2d3548]">
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
                  <div className="bg-[#232937] rounded-lg p-4 sm:p-6 border border-[#2d3548]">
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
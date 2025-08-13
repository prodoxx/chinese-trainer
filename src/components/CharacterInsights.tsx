'use client';

import { useState, useEffect } from 'react';
import { EnhancedCharacterComplexity } from '@/lib/analytics/enhanced-linguistic-complexity';
import { DeepLinguisticAnalysis } from '@/lib/analytics/openai-linguistic-analysis';
import { convertPinyinToneNumbersToMarks } from '@/lib/utils/pinyin';

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
    reasons?: string[];
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
          characterId
          // AI insights are now only generated during enrichment, not on-demand
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setInsights(data.insights);
        
        // Debug logging to check AI insights
        console.log('Character Insights received for', character, ':', {
          hasAiInsights: !!data.insights.aiInsights,
          aiInsightsKeys: data.insights.aiInsights ? Object.keys(data.insights.aiInsights) : [],
          commonErrors: data.insights.aiInsights?.commonErrors,
          usage: data.insights.aiInsights?.usage,
          learningTips: data.insights.aiInsights?.learningTips,
          etymology: data.insights.aiInsights?.etymology,
          mnemonics: data.insights.aiInsights?.mnemonics
        });
        
        // Check what will be displayed
        const willShowCommonErrors = data.insights.aiInsights?.commonErrors && (
          data.insights.aiInsights.commonErrors.similarCharacters?.length > 0 || 
          data.insights.aiInsights.commonErrors.wrongContexts?.length > 0 || 
          data.insights.aiInsights.commonErrors.toneConfusions?.length > 0
        );
        
        const willShowUsage = data.insights.aiInsights?.usage && (
          data.insights.aiInsights.usage.commonCollocations?.length > 0 || 
          data.insights.aiInsights.usage.registerLevel || 
          data.insights.aiInsights.usage.frequency || 
          data.insights.aiInsights.usage.domains?.length > 0
        );
        
        console.log('Sections that will display:', {
          etymology: !!data.insights.aiInsights?.etymology,
          commonErrors: willShowCommonErrors,
          usage: willShowUsage,
          learningTips: !!data.insights.aiInsights?.learningTips
        });
        
        // AI insights are now only generated during enrichment, not on-demand
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };

  // AI insights are now generated during enrichment, not on-demand

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

  // Generate confusion reason based on the confusion scores
  const getConfusionReason = (item: any, currentChar: string) => {
    const reasons = [];
    
    // Check for visual similarity
    if (item.confusion.visual > 0.6) {
      // Common confusions with specific reasons
      const specificReasons: Record<string, Record<string, string>> = {
        '包子': {
          '房子': 'Both end with 子 (zi) suffix',
          '餃子': 'Both are food items ending with 子',
          '饅頭': 'Both are steamed foods'
        },
        '房子': {
          '包子': 'Both end with 子 (zi) suffix',
          '箱子': 'Both end with 子 and relate to containers/spaces',
          '孩子': 'Both end with 子 (zi) suffix'
        },
        '餃子': {
          '包子': 'Both are dumpling-type foods ending with 子',
          '筷子': 'Both end with 子, often used together',
          '粽子': 'Both are wrapped foods ending with 子'
        },
        '饅頭': {
          '包子': 'Both are steamed buns (one with filling, one without)',
          '麵包': 'Both are bread-like foods',
          '饅': 'Shares the same first character'
        }
      };
      
      // Check for specific known confusion reasons
      if (specificReasons[currentChar]?.[item.character]) {
        reasons.push(specificReasons[currentChar][item.character]);
      } else if (specificReasons[item.character]?.[currentChar]) {
        reasons.push(specificReasons[item.character][currentChar]);
      } else {
        // Generic visual similarity reasons
        if (item.confusion.visual > 0.8) {
          reasons.push('Very similar character structure');
        } else if (item.confusion.visual > 0.6) {
          reasons.push('Similar visual appearance');
        }
        
        // Check for shared components
        const currentChars = currentChar.split('');
        const itemChars = item.character.split('');
        const shared = currentChars.filter(c => itemChars.includes(c));
        if (shared.length > 0) {
          reasons.push(`Share character(s): ${shared.join(', ')}`);
        }
      }
    }
    
    // Check for phonetic similarity
    if (item.confusion.phonetic > 0.5) {
      if (item.pinyin && insights?.character.pinyin) {
        const currentPinyin = insights.character.pinyin.toLowerCase().replace(/[0-9āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, '');
        const itemPinyin = item.pinyin.toLowerCase().replace(/[0-9āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, '');
        
        if (currentPinyin === itemPinyin) {
          reasons.push('Same pronunciation (different tones)');
        } else if (currentPinyin.includes(itemPinyin) || itemPinyin.includes(currentPinyin)) {
          reasons.push('Similar pronunciation');
        }
      }
    }
    
    // Check for semantic similarity
    if (item.confusion.semantic > 0.5) {
      reasons.push('Similar meaning or context');
    }
    
    // Check for tonal confusion
    if (item.confusion.tonal > 0.5) {
      reasons.push('Same sound with different tones');
    }
    
    // If no specific reason found, provide a generic one based on highest score
    if (reasons.length === 0) {
      const scores = {
        'visual': item.confusion.visual,
        'phonetic': item.confusion.phonetic,
        'semantic': item.confusion.semantic,
        'tonal': item.confusion.tonal
      };
      
      const highest = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b);
      if (highest[1] > 0) {
        const reasonMap = {
          'visual': 'Similar appearance',
          'phonetic': 'Similar sound',
          'semantic': 'Related meaning',
          'tonal': 'Tone confusion'
        };
        reasons.push(reasonMap[highest[0] as keyof typeof reasonMap]);
      }
    }
    
    return reasons.join('; ');
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

  // Process text to add pinyin for Chinese characters and convert tone numbers to marks
  const processTextWithPinyin = (text: string) => {
    if (!text) return text;
    
    // First, convert any pinyin with tone numbers to tone marks
    // Pattern to match Chinese characters followed by pinyin in parentheses with tone numbers
    // e.g., 晚 (wan3) -> 晚 (wǎn)
    text = text.replace(/([一-龥]+)\s*\(([a-zA-Z0-9]+)\)/g, (match, chinese, pinyin) => {
      // Check if pinyin contains tone numbers
      if (/[0-9]/.test(pinyin)) {
        // Convert tone numbers to marks
        const convertedPinyin = convertPinyinToneNumbersToMarks(pinyin);
        return `${chinese} (${convertedPinyin})`;
      }
      return match;
    });
    
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
      '在': 'zài',
      // Add characters from the screenshot
      '晚': 'wǎn',
      '安': 'ān',
      '晚安': 'wǎn ān'
    };
    
    // For the current character being studied
    const currentChar = insights?.character.hanzi;
    const currentPinyin = insights?.character.pinyin;
    
    if (currentChar && currentPinyin && text.includes(currentChar)) {
      // Don't add pinyin if it already has it in parentheses
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
      <div className="bg-[#1a1f2e]/95 rounded-2xl max-w-4xl w-full h-[95vh] sm:h-[90vh] overflow-hidden border border-[#2d3548] shadow-2xl flex flex-col">
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
                    <div className="text-2xl text-[#f7cc48] mb-1">{insights.character.pinyin}</div>
                    <div className="text-5xl font-bold mb-2">{insights.character.hanzi}</div>
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
                    {insights.confusionAnalysis.map((item, index) => {
                      // Use AI-generated reasons if available, otherwise fallback to heuristic
                      const aiReasons = item.reasons && item.reasons.length > 0 ? 
                        item.reasons.join('; ') : null;
                      const fallbackReason = !aiReasons ? 
                        getConfusionReason(item, insights.character.hanzi) : null;
                      const reason = aiReasons || fallbackReason;
                      
                      return (
                        <div key={index} className="p-3 bg-[#1a1f2e] rounded-lg border border-[#2d3548]">
                          <div className="flex items-center justify-between mb-2">
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
                          {reason && (
                            <div className="mt-2 pt-2 border-t border-[#2d3548]/50">
                              <div className="text-xs text-gray-500">Why confused:</div>
                              <div className="text-sm text-gray-300 mt-1">{reason}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Memory Aids - Show AI insights if available, otherwise show character analysis */}
              {(insights.aiInsights?.mnemonics || ((insights.complexity as any).mnemonics && (insights.complexity as any).mnemonics.length > 0)) && (
                <div className="bg-[#232937] rounded-lg p-4 sm:p-6 border border-[#2d3548]">
                  <h3 className="text-xl font-semibold mb-4 text-[#f7cc48]">Memory Aids</h3>
                  {insights.aiInsights?.mnemonics ? (
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
                  ) : (
                    <div className="space-y-3">
                      {(insights.complexity as any).mnemonics.map((mnemonic: string, index: number) => (
                        <div key={index} className="p-3 bg-[#1a1f2e] rounded-lg border border-[#2d3548]">
                          <p className="text-gray-100">{processTextWithPinyin(mnemonic)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Etymology - Show AI insights if available, otherwise show character analysis */}
              {(insights.aiInsights?.etymology || (insights.complexity as any).etymology) && (
                <div className="bg-[#232937] rounded-lg p-4 sm:p-6 border border-[#2d3548]">
                  <h3 className="text-xl font-semibold mb-4 text-[#f7cc48]">Etymology</h3>
                  {insights.aiInsights?.etymology ? (
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm text-gray-300 mb-1">Origin</h4>
                        <p className="text-gray-100">{processTextWithPinyin(insights.aiInsights.etymology.origin)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm text-gray-300 mb-1">Evolution</h4>
                        <ol className="list-decimal list-inside space-y-1">
                          {insights.aiInsights.etymology.evolution.map((stage, i) => (
                            <li key={i} className="text-gray-100">{processTextWithPinyin(stage)}</li>
                          ))}
                        </ol>
                      </div>
                      {insights.aiInsights.etymology.culturalContext && (
                        <div>
                          <h4 className="text-sm text-gray-300 mb-1">Cultural Context</h4>
                          <p className="text-gray-100">{processTextWithPinyin(insights.aiInsights.etymology.culturalContext)}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-100">{processTextWithPinyin((insights.complexity as any).etymology)}</p>
                  )}
                </div>
              )}

              {/* Common Errors - Show if AI insights are available */}
              {insights.aiInsights?.commonErrors && (
                <div className="bg-[#232937] rounded-lg p-4 sm:p-6 border border-[#2d3548]">
                  <h3 className="text-xl font-semibold mb-4 text-[#f7cc48]">Common Errors & Confusions</h3>
                  <div className="space-y-4">
                    {insights.aiInsights.commonErrors.similarCharacters?.length > 0 && (
                      <div>
                        <h4 className="text-sm text-gray-300 mb-2">Similar Characters (Often Confused)</h4>
                        <div className="space-y-2">
                          {insights.aiInsights.commonErrors.similarCharacters.map((char, i) => {
                            // Parse the format: "房子 (fáng zi) - house - [Both end with 子 suffix]"
                            const match = typeof char === 'string' ? 
                              char.match(/^(.+?)\s*-\s*(.+?)\s*-\s*\[(.+?)\]$/) : null;
                            
                            let displayText = processTextWithPinyin(typeof char === 'string' ? char : (char as any).character || '');
                            let reason = null;
                            
                            if (match) {
                              // Extract the character part and reason
                              displayText = processTextWithPinyin(match[1] + ' - ' + match[2]);
                              reason = match[3];
                            } else if (typeof char === 'object' && (char as any).reason) {
                              displayText = processTextWithPinyin((char as any).character || '');
                              reason = (char as any).reason;
                            }
                            
                            return (
                              <div key={i} className="flex flex-col gap-1">
                                <div className="flex items-start gap-2">
                                  <span className="text-[#f7cc48] font-bold">•</span>
                                  <span className="text-gray-100">{displayText}</span>
                                </div>
                                {reason && (
                                  <div className="ml-6 text-xs text-gray-400 italic">
                                    {reason}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {insights.aiInsights.commonErrors.wrongContexts?.length > 0 && (
                      <div>
                        <h4 className="text-sm text-gray-300 mb-2">Common Mistakes in Usage</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {insights.aiInsights.commonErrors.wrongContexts.map((context, i) => (
                            <li key={i} className="text-gray-100">{processTextWithPinyin(context)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insights.aiInsights.commonErrors.toneConfusions?.length > 0 && (
                      <div>
                        <h4 className="text-sm text-gray-300 mb-2">Tone Confusions</h4>
                        <div className="space-y-1">
                          {insights.aiInsights.commonErrors.toneConfusions.map((confusion, i) => (
                            <div key={i} className="text-gray-100">{processTextWithPinyin(confusion)}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Usage Information - Show if AI insights are available */}
              {insights.aiInsights?.usage && (
                <div className="bg-[#232937] rounded-lg p-4 sm:p-6 border border-[#2d3548]">
                  <h3 className="text-xl font-semibold mb-4 text-[#f7cc48]">Usage Information</h3>
                  <div className="space-y-3">
                    {insights.aiInsights.usage.commonCollocations?.length > 0 && (
                      <div>
                        <h4 className="text-sm text-gray-300 mb-2">Common Collocations</h4>
                        <div className="flex flex-wrap gap-2">
                          {insights.aiInsights.usage.commonCollocations.map((collocation, i) => (
                            <span key={i} className="px-3 py-1 bg-[#1a1f2e] rounded-lg text-gray-100 border border-[#2d3548]">
                              {processTextWithPinyin(collocation)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {insights.aiInsights.usage.registerLevel && (
                        <div>
                          <h4 className="text-sm text-gray-300 mb-1">Register Level</h4>
                          <p className="text-gray-100 capitalize">{insights.aiInsights.usage.registerLevel}</p>
                        </div>
                      )}
                      {insights.aiInsights.usage.frequency && (
                        <div>
                          <h4 className="text-sm text-gray-300 mb-1">Frequency</h4>
                          <p className="text-gray-100 capitalize">{insights.aiInsights.usage.frequency}</p>
                        </div>
                      )}
                    </div>
                    {insights.aiInsights.usage.domains?.length > 0 && (
                      <div>
                        <h4 className="text-sm text-gray-300 mb-2">Common Domains</h4>
                        <div className="flex flex-wrap gap-2">
                          {insights.aiInsights.usage.domains.map((domain, i) => (
                            <span key={i} className="px-2 py-1 bg-[#2d3548]/50 rounded text-sm text-gray-200">
                              {domain}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DEBUG: Show raw AI insights data */}
              {process.env.NODE_ENV === 'development' && insights.aiInsights && (
                <div className="bg-red-900/20 rounded-lg p-4 border border-red-500 mb-4">
                  <h3 className="text-red-400 font-bold mb-2">DEBUG: AI Insights Available</h3>
                  <div className="text-xs text-gray-300">
                    <p>Etymology: {insights.aiInsights.etymology ? '✓' : '✗'}</p>
                    <p>Common Errors: {insights.aiInsights.commonErrors ? '✓' : '✗'}</p>
                    <p>- Similar chars: {insights.aiInsights.commonErrors?.similarCharacters?.length || 0}</p>
                    <p>- Wrong contexts: {insights.aiInsights.commonErrors?.wrongContexts?.length || 0}</p>
                    <p>- Tone confusions: {insights.aiInsights.commonErrors?.toneConfusions?.length || 0}</p>
                    <p>Usage: {insights.aiInsights.usage ? '✓' : '✗'}</p>
                    <p>- Collocations: {insights.aiInsights.usage?.commonCollocations?.length || 0}</p>
                    <p>- Register: {insights.aiInsights.usage?.registerLevel || 'none'}</p>
                    <p>- Frequency: {insights.aiInsights.usage?.frequency || 'none'}</p>
                    <p>Learning Tips: {insights.aiInsights.learningTips ? '✓' : '✗'}</p>
                    <p>- Beginners: {insights.aiInsights.learningTips?.forBeginners?.length || 0}</p>
                    <p>- Intermediate: {insights.aiInsights.learningTips?.forIntermediate?.length || 0}</p>
                    <p>- Advanced: {insights.aiInsights.learningTips?.forAdvanced?.length || 0}</p>
                  </div>
                </div>
              )}

              {/* Learning Tips - Only show if AI insights are available */}
              {insights.aiInsights?.learningTips && (
                <div className="bg-[#232937] rounded-lg p-4 sm:p-6 border border-[#2d3548]">
                  <h3 className="text-xl font-semibold mb-4 text-[#f7cc48]">Learning Tips</h3>
                  <div className="space-y-3">
                    {insights.aiInsights.learningTips.forBeginners.length > 0 && (
                      <div>
                        <h4 className="text-sm text-gray-300 mb-1">For Beginners</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {insights.aiInsights.learningTips.forBeginners.map((tip, i) => (
                            <li key={i} className="text-gray-100">{processTextWithPinyin(tip)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insights.aiInsights.learningTips.forIntermediate?.length > 0 && (
                      <div>
                        <h4 className="text-sm text-gray-300 mb-1">For Intermediate</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {insights.aiInsights.learningTips.forIntermediate.map((tip, i) => (
                            <li key={i} className="text-gray-100">{processTextWithPinyin(tip)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insights.aiInsights.learningTips.forAdvanced?.length > 0 && (
                      <div>
                        <h4 className="text-sm text-gray-300 mb-1">For Advanced</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {insights.aiInsights.learningTips.forAdvanced.map((tip, i) => (
                            <li key={i} className="text-gray-100">{processTextWithPinyin(tip)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
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
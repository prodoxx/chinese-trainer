'use client';

import { useState, useEffect } from 'react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

interface LearningInsightsProps {
  deckId?: string;
}

export default function LearningInsights({ deckId }: LearningInsightsProps) {
  const [recommendations, setRecommendations] = useState<any>(null);
  const [complexityData, setComplexityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'difficulty' | 'recommendations'>('overview');

  useEffect(() => {
    fetchData();
  }, [deckId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch recommendations
      const recResponse = await fetch(`/api/analytics/recommendations${deckId ? `?deckId=${deckId}` : ''}`);
      const recData = await recResponse.json();
      if (recData.success) {
        setRecommendations(recData);
      }

      // Fetch complexity analysis
      const complexResponse = await fetch(`/api/cards/complexity${deckId ? `?deckId=${deckId}` : ''}`);
      const complexData = await complexResponse.json();
      if (complexData.success) {
        setComplexityData(complexData);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-800 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-32 bg-gray-800 rounded"></div>
            <div className="h-48 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-6">Learning Insights & Recommendations</h2>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'overview'
              ? 'text-violet-400 border-b-2 border-violet-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('difficulty')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'difficulty'
              ? 'text-violet-400 border-b-2 border-violet-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Difficulty Analysis
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'recommendations'
              ? 'text-violet-400 border-b-2 border-violet-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Recommendations
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && recommendations && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Average Accuracy</div>
              <div className={`text-2xl font-bold ${
                recommendations.summary.avgAccuracy >= 80 ? 'text-green-400' :
                recommendations.summary.avgAccuracy >= 60 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {recommendations.summary.avgAccuracy.toFixed(1)}%
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Total Characters</div>
              <div className="text-2xl font-bold">{recommendations.summary.totalCharacters}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Need Work</div>
              <div className="text-2xl font-bold text-orange-400">{recommendations.summary.needsWork}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400">Need Review</div>
              <div className="text-2xl font-bold text-yellow-400">{recommendations.summary.needsReview}</div>
            </div>
          </div>

          {/* Learning Patterns */}
          {recommendations.recommendations.patterns && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">{recommendations.recommendations.patterns.title}</h3>
              <ul className="space-y-2">
                {recommendations.recommendations.patterns.insights.map((insight: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-violet-400 mt-1">•</span>
                    <span className="text-gray-300">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'difficulty' && complexityData && (
        <div className="space-y-6">
          {/* Difficulty Distribution */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Character Difficulty Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name: 'Easy', count: complexityData.summary.distribution.easy },
                { name: 'Medium', count: complexityData.summary.distribution.medium },
                { name: 'Hard', count: complexityData.summary.distribution.hard },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#9ca3af' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '0.5rem' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Most Complex Characters */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Most Complex Characters</h3>
            <div className="space-y-2">
              {complexityData.cards.slice(0, 5).map((card: any) => (
                <div key={card.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold">{card.hanzi}</span>
                    <div>
                      <div className="text-sm text-gray-300">{card.pinyin}</div>
                      <div className="text-xs text-gray-500">{card.meaning}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Difficulty</div>
                    <div className={`text-lg font-bold ${
                      card.complexity.overall > 0.7 ? 'text-red-400' :
                      card.complexity.overall > 0.5 ? 'text-orange-400' :
                      'text-yellow-400'
                    }`}>
                      {(card.complexity.overall * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {card.complexity.strokeCount} strokes
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Complexity Radar Chart */}
          {complexityData.cards.length > 0 && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Average Complexity Factors</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={[
                  {
                    metric: 'Visual',
                    value: complexityData.cards.reduce((sum: number, c: any) => sum + c.complexity.visual, 0) / complexityData.cards.length * 100,
                  },
                  {
                    metric: 'Phonetic',
                    value: complexityData.cards.reduce((sum: number, c: any) => sum + c.complexity.phonetic, 0) / complexityData.cards.length * 100,
                  },
                  {
                    metric: 'Semantic',
                    value: complexityData.cards.reduce((sum: number, c: any) => sum + c.complexity.semantic, 0) / complexityData.cards.length * 100,
                  },
                  {
                    metric: 'Frequency',
                    value: complexityData.cards.reduce((sum: number, c: any) => sum + (c.complexity.frequency / 5), 0) / complexityData.cards.length * 100,
                  },
                ]}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="metric" stroke="#6b7280" tick={{ fill: '#9ca3af' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" tick={{ fill: '#9ca3af' }} />
                  <Radar name="Complexity" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {activeTab === 'recommendations' && recommendations && (
        <div className="space-y-6">
          {/* Immediate Focus */}
          {recommendations.recommendations.immediate && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">{recommendations.recommendations.immediate.title}</h3>
              <p className="text-sm text-gray-400 mb-3">{recommendations.recommendations.immediate.description}</p>
              <div className="space-y-2">
                {recommendations.recommendations.immediate.characters.map((char: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-900/50 rounded">
                    <span className="text-xl font-bold">{char.hanzi}</span>
                    <div className="text-right">
                      <div className="text-sm text-red-400">{(char.accuracy * 100).toFixed(0)}% accuracy</div>
                      <div className="text-xs text-gray-500">{char.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Queue */}
          {recommendations.recommendations.review && recommendations.recommendations.review.characters.length > 0 && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">{recommendations.recommendations.review.title}</h3>
              <p className="text-sm text-gray-400 mb-3">{recommendations.recommendations.review.description}</p>
              <div className="space-y-2">
                {recommendations.recommendations.review.characters.map((char: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-900/50 rounded">
                    <span className="text-xl font-bold">{char.hanzi}</span>
                    <span className="text-sm text-yellow-400">{char.daysSince} days ago</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learning Strategies */}
          {recommendations.recommendations.strategies && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">{recommendations.recommendations.strategies.title}</h3>
              <div className="space-y-3">
                {recommendations.recommendations.strategies.tips.map((tip: string, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-violet-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-violet-400">{index + 1}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          {recommendations.recommendations.nextSteps && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">{recommendations.recommendations.nextSteps.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendations.recommendations.nextSteps.suggestions.map((suggestion: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-900/50 rounded">
                    <span className="text-violet-400">→</span>
                    <p className="text-sm text-gray-300">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
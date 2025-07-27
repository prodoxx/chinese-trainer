'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import CharacterInsights from './CharacterInsights';
import LearningInsights from './LearningInsights';

interface AnalyticsData {
  summary: {
    totalCards: number;
    totalReviews: number;
    accuracy: number;
    currentStreak: number;
    longestStreak: number;
    studiedToday: number;
  };
  dailyStats: Array<{
    date: string;
    cardsStudied: number;
    correctAnswers: number;
    totalAnswers: number;
    studyTimeMs: number;
  }>;
  deckStats: Array<{
    deckId: string;
    deckName: string;
    totalCards: number;
    studiedCards: number;
    totalReviews: number;
    correctReviews: number;
    accuracy: number;
  }>;
  learningCurve: Array<{
    date: string;
    accuracy: number;
    cardsStudied: number;
  }>;
  retentionData: Array<{
    interval: number;
    retention: number;
    sampleSize: number;
  }>;
}

interface AnalyticsProps {
  onBack?: () => void;
}

export default function Analytics({ onBack }: AnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30); // days
  const [selectedCharacter, setSelectedCharacter] = useState<{ id: string; hanzi: string } | null>(null);
  const [difficultyPatterns, setDifficultyPatterns] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
    fetchDifficultyPatterns();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?days=${timeRange}`);
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDifficultyPatterns = async () => {
    try {
      const response = await fetch('/api/analytics/character-insights');
      const data = await response.json();
      if (data.success) {
        setDifficultyPatterns(data.patterns);
      }
    } catch (error) {
      console.error('Failed to fetch difficulty patterns:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-gray-800 rounded mb-8"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-900 rounded-lg p-4 h-24"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.summary.totalCards === 0) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Learning Analytics</h1>
          <div className="bg-gray-900 rounded-lg p-12 text-center">
            <svg className="w-24 h-24 mx-auto mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-2xl font-semibold mb-2 text-gray-300">No analytics data yet</h2>
            <p className="text-gray-500 mb-4">Start studying to see your progress here!</p>
            <p className="text-sm text-gray-600">Complete some flash sessions and quizzes to generate analytics data.</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Home
              </button>
            )}
            <h1 className="text-3xl font-bold">Learning Analytics</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange(7)}
              className={`px-4 py-2 rounded ${timeRange === 7 ? 'bg-violet-600' : 'bg-gray-800'} hover:bg-violet-700 transition-colors`}
            >
              7 days
            </button>
            <button
              onClick={() => setTimeRange(30)}
              className={`px-4 py-2 rounded ${timeRange === 30 ? 'bg-violet-600' : 'bg-gray-800'} hover:bg-violet-700 transition-colors`}
            >
              30 days
            </button>
            <button
              onClick={() => setTimeRange(90)}
              className={`px-4 py-2 rounded ${timeRange === 90 ? 'bg-violet-600' : 'bg-gray-800'} hover:bg-violet-700 transition-colors`}
            >
              90 days
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-4 hover:bg-gray-900/70 transition-colors">
            <div className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wider">Total Cards</div>
            <div className="text-xl sm:text-2xl font-bold mt-1">{analytics.summary.totalCards}</div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-4 hover:bg-gray-900/70 transition-colors">
            <div className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wider">Total Reviews</div>
            <div className="text-xl sm:text-2xl font-bold mt-1">{analytics.summary.totalReviews}</div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-4 hover:bg-gray-900/70 transition-colors">
            <div className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wider">Accuracy</div>
            <div className="text-xl sm:text-2xl font-bold mt-1">
              <span className={analytics.summary.accuracy >= 80 ? 'text-green-400' : analytics.summary.accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'}>
                {analytics.summary.accuracy.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-4 hover:bg-gray-900/70 transition-colors">
            <div className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wider">Current Streak</div>
            <div className="text-xl sm:text-2xl font-bold mt-1">
              {analytics.summary.currentStreak > 0 ? (
                <span className="text-orange-400">{analytics.summary.currentStreak}</span>
              ) : (
                <span className="text-gray-500">{analytics.summary.currentStreak}</span>
              )}
              <span className="text-sm text-gray-500 ml-1">days</span>
            </div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-4 hover:bg-gray-900/70 transition-colors">
            <div className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wider">Longest Streak</div>
            <div className="text-xl sm:text-2xl font-bold mt-1">
              {analytics.summary.longestStreak}
              <span className="text-sm text-gray-500 ml-1">days</span>
            </div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-4 hover:bg-gray-900/70 transition-colors">
            <div className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wider">Studied Today</div>
            <div className="text-xl sm:text-2xl font-bold mt-1">
              {analytics.summary.studiedToday > 0 ? (
                <span className="text-violet-400">{analytics.summary.studiedToday}</span>
              ) : (
                <span className="text-gray-500">{analytics.summary.studiedToday}</span>
              )}
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Daily Study Activity */}
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-4 sm:p-6">
            <h2 className="text-xl font-semibold mb-4">Daily Study Activity</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af' }}
                />
                <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '0.5rem' }}
                  labelFormatter={(value) => `Date: ${formatDate(value as string)}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="cardsStudied" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.6}
                  name="Cards Studied"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Learning Curve */}
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-4 sm:p-6">
            <h2 className="text-xl font-semibold mb-4">Accuracy Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.learningCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#9ca3af"
                />
                <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af' }} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '0.5rem' }}
                  labelFormatter={(value) => `Date: ${formatDate(value as string)}`}
                  formatter={(value: any) => `${value.toFixed(1)}%`}
                />
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  name="Accuracy"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Deck Performance */}
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-4 sm:p-6">
            <h2 className="text-xl font-semibold mb-4">Deck Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.deckStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="deckName" 
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '0.5rem' }}
                />
                <Legend />
                <Bar 
                  dataKey="studiedCards" 
                  fill="#8b5cf6" 
                  name="Studied"
                />
                <Bar 
                  dataKey="totalCards" 
                  fill="#374151" 
                  name="Total"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Retention by Interval */}
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-4 sm:p-6">
            <h2 className="text-xl font-semibold mb-4">Retention by Review Interval</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.retentionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="interval" 
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af' }}
                  label={{ value: 'Days', position: 'insideBottom', offset: -5, style: { fill: '#9ca3af' } }}
                />
                <YAxis 
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af' }}
                  domain={[0, 100]}
                  label={{ value: 'Retention %', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '0.5rem' }}
                  formatter={(value: any) => `${value.toFixed(1)}%`}
                  labelFormatter={(value) => `${value} days`}
                />
                <Line 
                  type="monotone" 
                  dataKey="retention" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 4 }}
                  name="Retention Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deck Accuracy Breakdown */}
        <div className="bg-gray-900 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Deck Accuracy Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.deckStats.map((deck, index) => (
              <div key={deck.deckId} className="border border-gray-800 rounded-lg p-4">
                <h3 className="font-semibold mb-2">{deck.deckName}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cards:</span>
                    <span>{deck.studiedCards} / {deck.totalCards}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reviews:</span>
                    <span>{deck.totalReviews}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Accuracy:</span>
                    <span className={deck.accuracy >= 80 ? 'text-green-400' : deck.accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'}>
                      {deck.accuracy.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full ${deck.accuracy >= 80 ? 'bg-green-500' : deck.accuracy >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${deck.accuracy}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Study Time Distribution */}
        <div className="bg-gray-900 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Recent Study Sessions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 px-4">Date</th>
                  <th className="text-right py-2 px-4">Cards Studied</th>
                  <th className="text-right py-2 px-4">Correct</th>
                  <th className="text-right py-2 px-4">Accuracy</th>
                  <th className="text-right py-2 px-4">Study Time</th>
                </tr>
              </thead>
              <tbody>
                {analytics.dailyStats.slice(-10).reverse().map((day, index) => (
                  <tr key={day.date} className="border-b border-gray-800">
                    <td className="py-2 px-4">{formatDate(day.date)}</td>
                    <td className="text-right py-2 px-4">{day.cardsStudied}</td>
                    <td className="text-right py-2 px-4">{day.correctAnswers}/{day.totalAnswers}</td>
                    <td className="text-right py-2 px-4">
                      <span className={
                        day.totalAnswers > 0 
                          ? (day.correctAnswers / day.totalAnswers) >= 0.8 ? 'text-green-400' 
                          : (day.correctAnswers / day.totalAnswers) >= 0.6 ? 'text-yellow-400' 
                          : 'text-red-400'
                          : ''
                      }>
                        {day.totalAnswers > 0 ? `${((day.correctAnswers / day.totalAnswers) * 100).toFixed(1)}%` : '-'}
                      </span>
                    </td>
                    <td className="text-right py-2 px-4">{formatTime(day.studyTimeMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Character Difficulty Insights */}
        {difficultyPatterns && (
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-4 sm:p-6 mt-8">
            <h2 className="text-xl font-semibold mb-4">Character Difficulty Insights</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Most Difficult Characters */}
              {difficultyPatterns.mostDifficult && difficultyPatterns.mostDifficult.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3 text-gray-300">Most Challenging Characters</h3>
                  <div className="space-y-2">
                    {difficultyPatterns.mostDifficult.slice(0, 5).map((item: any, index: number) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors cursor-pointer"
                        onClick={() => {
                          // Find the character card to get its ID
                          if (analytics?.deckStats[0]) {
                            setSelectedCharacter({ id: item.characterId || '', hanzi: item.character });
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold">{item.character}</span>
                          <span className="text-sm text-gray-500">Click for insights</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Error Rate</div>
                          <div className={`text-lg font-bold ${
                            item.errorRate > 0.5 ? 'text-red-400' :
                            item.errorRate > 0.3 ? 'text-orange-400' :
                            'text-yellow-400'
                          }`}>
                            {(item.errorRate * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Difficulty Distribution */}
              {difficultyPatterns.difficultyDistribution && (
                <div>
                  <h3 className="text-lg font-medium mb-3 text-gray-300">Difficulty Distribution</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Easy', value: difficultyPatterns.difficultyDistribution.easy },
                          { name: 'Medium', value: difficultyPatterns.difficultyDistribution.medium },
                          { name: 'Hard', value: difficultyPatterns.difficultyDistribution.hard },
                          { name: 'Very Hard', value: difficultyPatterns.difficultyDistribution.veryHard },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#ef4444" />
                        <Cell fill="#991b1b" />
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '0.5rem' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Learning Insights & Recommendations */}
        <div className="mt-8">
          <LearningInsights />
        </div>
      </div>

      {/* Character Insights Modal */}
      {selectedCharacter && (
        <CharacterInsights
          characterId={selectedCharacter.id}
          character={selectedCharacter.hanzi}
          onClose={() => setSelectedCharacter(null)}
        />
      )}
    </div>
  );
}
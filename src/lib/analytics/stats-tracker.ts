import LearningStats from '@/lib/db/models/LearningStats';
import StudySession from '@/lib/db/models/StudySession';
import { analyzeCharacterWithDictionary, calculateEnhancedConfusionProbability } from './enhanced-linguistic-complexity';
import { 
  calculateCognitiveLoad, 
  calculateAttentionLevel, 
  calculateFatigueLevel,
  detectFlowState,
  calculateLearningEfficiency,
  ResponsePattern
} from './cognitive-metrics';
import mongoose from 'mongoose';

export interface SessionData {
  deckId: string;
  sessionType: 'new' | 'review';
  startTime: Date;
  endTime: Date;
  cards: Array<{
    cardId: string;
    hanzi: string;
    exposures: number; // Flash cycles
    quizResult?: {
      correct: boolean;
      responseTimeMs: number;
      timedOut: boolean;
      wrongAnswerId?: string;
    };
  }>;
  pauseEvents: Array<{ timestamp: Date; durationMs: number }>;
}

/**
 * Update comprehensive learning statistics after a study session
 */
export async function updateLearningStats(sessionData: SessionData) {
  const session = await createStudySession(sessionData);
  
  // Update stats for each card
  for (const cardData of sessionData.cards) {
    await updateCardStats(cardData, sessionData, session._id.toString());
  }
  
  // Update session quality score
  await updateSessionQuality(session._id.toString(), sessionData);
}

/**
 * Create a new study session record
 */
async function createStudySession(sessionData: SessionData) {
  const { deckId, sessionType, startTime, endTime, cards, pauseEvents } = sessionData;
  
  // Calculate session metrics
  const durationMs = endTime.getTime() - startTime.getTime();
  const hour = startTime.getHours();
  const timeOfDay = 
    hour >= 5 && hour < 9 ? 'early_morning' :
    hour >= 9 && hour < 12 ? 'morning' :
    hour >= 12 && hour < 17 ? 'afternoon' :
    hour >= 17 && hour < 21 ? 'evening' : 'night';
  
  // Performance metrics
  const quizResults = cards.map(c => c.quizResult).filter(Boolean);
  const correctCount = quizResults.filter(r => r!.correct).length;
  const quizScore = quizResults.length > 0 ? correctCount / quizResults.length : 0;
  const avgResponseTime = quizResults.length > 0 
    ? quizResults.reduce((sum, r) => sum + r!.responseTimeMs, 0) / quizResults.length
    : 0;
  
  // Calculate cognitive metrics
  const responses: ResponsePattern[] = cards
    .filter(c => c.quizResult)
    .map(c => ({
      responseTimeMs: c.quizResult!.responseTimeMs,
      correct: c.quizResult!.correct,
      timestamp: new Date(), // Simplified - in reality, track actual timestamps
    }));
  
  const cognitiveLoad = calculateCognitiveLoad(responses, avgResponseTime);
  const attentionLevel = calculateAttentionLevel(responses);
  const fatigueScore = calculateFatigueLevel(responses, durationMs);
  const flowState = detectFlowState(responses, cognitiveLoad, attentionLevel);
  
  // Create session record
  const session = new StudySession({
    deckId: new mongoose.Types.ObjectId(deckId),
    sessionType,
    startTime,
    endTime,
    durationMs,
    timeOfDay,
    dayOfWeek: startTime.getDay(),
    cardsStudied: cards.map(c => new mongoose.Types.ObjectId(c.cardId)),
    newCardsCount: sessionType === 'new' ? cards.length : 0,
    reviewCardsCount: sessionType === 'review' ? cards.length : 0,
    totalFlashCycles: cards.reduce((sum, c) => sum + c.exposures, 0),
    quizScore,
    avgResponseTimeMs: avgResponseTime,
    fatigueScore,
    focusScore: attentionLevel,
    flowStateIndicators: {
      consistentTiming: flowState,
      highAccuracy: quizScore > 0.7,
      lowVariability: cognitiveLoad < 0.5,
    },
    pauseEvents: pauseEvents.length,
    totalPauseTimeMs: pauseEvents.reduce((sum, p) => sum + p.durationMs, 0),
  });
  
  await session.save();
  return session;
}

/**
 * Update stats for individual card
 */
async function updateCardStats(
  cardData: {
    cardId: string;
    hanzi: string;
    exposures: number;
    quizResult?: {
      correct: boolean;
      responseTimeMs: number;
      timedOut: boolean;
      wrongAnswerId?: string;
    };
  },
  sessionData: SessionData,
  _sessionId: string
) {
  const { cardId, hanzi, exposures, quizResult } = cardData;
  
  // Find or create learning stats
  let stats = await LearningStats.findOne({ 
    cardId: new mongoose.Types.ObjectId(cardId),
    deckId: new mongoose.Types.ObjectId(sessionData.deckId)
  });
  
  if (!stats) {
    // Analyze character complexity on first encounter using dictionary
    const complexity = await analyzeCharacterWithDictionary(hanzi);
    
    stats = new LearningStats({
      deckId: new mongoose.Types.ObjectId(sessionData.deckId),
      cardId: new mongoose.Types.ObjectId(cardId),
      characterComplexity: {
        strokeCount: complexity.strokeCount,
        radicalCount: complexity.radicalCount,
        componentCount: complexity.componentCount,
        isPhonetic: complexity.isPhonetic,
        isSemantic: complexity.isSemantic,
        frequency: complexity.frequency,
      },
      firstSeen: sessionData.startTime,
    });
  }
  
  // Update exposure counts
  stats.totalExposures += exposures;
  stats.studySessions += 1;
  stats.lastSeen = sessionData.endTime;
  
  // Update quiz results if available
  if (quizResult) {
    if (sessionData.sessionType === 'review') {
      stats.recallAttempts += 1;
      if (quizResult.correct) {
        stats.recallAccuracy = 
          (stats.recallAccuracy * (stats.recallAttempts - 1) + 1) / stats.recallAttempts;
      } else {
        stats.recallAccuracy = 
          (stats.recallAccuracy * (stats.recallAttempts - 1)) / stats.recallAttempts;
      }
    } else {
      stats.recognitionAttempts += 1;
      if (quizResult.correct) {
        stats.recognitionAccuracy = 
          (stats.recognitionAccuracy * (stats.recognitionAttempts - 1) + 1) / stats.recognitionAttempts;
      } else {
        stats.recognitionAccuracy = 
          (stats.recognitionAccuracy * (stats.recognitionAttempts - 1)) / stats.recognitionAttempts;
      }
    }
    
    // Update response times
    if (quizResult.correct) {
      stats.lastSuccess = sessionData.endTime;
      const prevAvg = sessionData.sessionType === 'review' 
        ? stats.avgRecallTimeMs 
        : stats.avgRecognitionTimeMs;
      const attempts = sessionData.sessionType === 'review'
        ? stats.recallAttempts
        : stats.recognitionAttempts;
      
      if (sessionData.sessionType === 'review') {
        stats.avgRecallTimeMs = 
          (prevAvg * (attempts - 1) + quizResult.responseTimeMs) / attempts;
      } else {
        stats.avgRecognitionTimeMs = 
          (prevAvg * (attempts - 1) + quizResult.responseTimeMs) / attempts;
      }
      
      // Update fastest/slowest
      stats.fastestResponseMs = Math.min(stats.fastestResponseMs, quizResult.responseTimeMs);
      stats.slowestResponseMs = Math.max(stats.slowestResponseMs, quizResult.responseTimeMs);
    } else {
      stats.lastError = sessionData.endTime;
      
      // Track error types
      if (quizResult.timedOut) {
        stats.errorTypes.timeout += 1;
      } else if (quizResult.wrongAnswerId) {
        // Analyze confusion with dictionary data
        const wrongCard = sessionData.cards.find(c => c.cardId === quizResult.wrongAnswerId);
        if (wrongCard) {
          const confusion = await calculateEnhancedConfusionProbability(hanzi, wrongCard.hanzi);
          if (confusion.visual > 0.5) stats.visualSimilarityErrors += 1;
          if (confusion.semantic > 0.5) stats.semanticSimilarityErrors += 1;
          if (confusion.phonetic > 0.5) stats.phoneticSimilarityErrors += 1;
          
          // Update confusion matrix
          const currentCount = stats.confusionMatrix.get(wrongCard.hanzi) || 0;
          stats.confusionMatrix.set(wrongCard.hanzi, currentCount + 1);
        }
      }
    }
  }
  
  // Update mastery tracking
  if (!stats.masteryDate && stats.recallAttempts >= 3) {
    const recentAttempts = await getRecentAttempts(cardId, 3);
    if (recentAttempts.every(a => a.correct)) {
      stats.masteryDate = new Date();
      stats.trialsToMastery = stats.recognitionAttempts + stats.recallAttempts;
    }
  }
  
  // Calculate total study time (simplified - in production, track actual viewing time)
  const avgTimePerExposure = 5000; // 5 seconds average
  stats.totalStudyTimeMs += exposures * avgTimePerExposure;
  
  await stats.save();
}

/**
 * Update session quality score based on comprehensive metrics
 */
async function updateSessionQuality(sessionId: string, _sessionData: SessionData) {
  const session = await StudySession.findById(sessionId);
  if (!session) return;
  
  // Calculate quality factors
  const accuracyScore = session.quizScore;
  const efficiencyScore = calculateLearningEfficiency(
    Math.round(session.quizScore * session.cardsStudied.length),
    session.cardsStudied.length,
    session.avgResponseTimeMs,
    0.8, // Placeholder retention rate
    session.durationMs
  );
  
  const engagementScore = 1 - (session.pauseEvents / (session.cardsStudied.length + 1));
  const flowScore = session.flowStateIndicators.consistentTiming ? 1 : 0.5;
  
  // Weighted quality score
  session.qualityScore = 
    accuracyScore * 0.3 +
    efficiencyScore * 0.3 +
    engagementScore * 0.2 +
    flowScore * 0.2;
  
  await session.save();
}

/**
 * Helper to get recent attempts for a card
 */
async function getRecentAttempts(_cardId: string, _limit: number): Promise<{ correct: boolean }[]> {
  // Simplified - in production, query from a attempts collection
  return [];
}
/**
 * Cognitive metrics and learning analytics based on cognitive science research
 */

export interface ResponsePattern {
  responseTimeMs: number;
  correct: boolean;
  confidence?: number; // 0-1 scale
  timestamp: Date;
}

export interface CognitiveMetrics {
  cognitiveLoad: number; // 0-1 scale
  attentionLevel: number; // 0-1 scale
  fatigueLevel: number; // 0-1 scale
  flowState: boolean;
  learningEfficiency: number; // 0-1 scale
}

/**
 * Calculate cognitive load based on response patterns
 * Based on Cognitive Load Theory (Sweller, 1988)
 */
export function calculateCognitiveLoad(
  responses: ResponsePattern[],
  averageResponseTime: number
): number {
  if (responses.length < 3) return 0.5; // Not enough data
  
  // Factor 1: Response time variability (high variability = high load)
  const responseTimes = responses.map(r => r.responseTimeMs);
  const variance = calculateVariance(responseTimes);
  const normalizedVariance = Math.min(variance / (averageResponseTime * averageResponseTime), 1);
  
  // Factor 2: Error rate increase over time (indicates overload)
  const recentErrors = responses.slice(-5).filter(r => !r.correct).length;
  const initialErrors = responses.slice(0, 5).filter(r => !r.correct).length;
  const errorIncrease = Math.max(0, (recentErrors - initialErrors) / 5);
  
  // Factor 3: Response time degradation
  const recentAvgTime = average(responses.slice(-5).map(r => r.responseTimeMs));
  const initialAvgTime = average(responses.slice(0, 5).map(r => r.responseTimeMs));
  const timeDegradation = Math.max(0, (recentAvgTime - initialAvgTime) / initialAvgTime);
  
  // Weighted combination
  return Math.min(1, 
    normalizedVariance * 0.3 + 
    errorIncrease * 0.4 + 
    timeDegradation * 0.3
  );
}

/**
 * Detect attention level based on consistency of responses
 * Based on attention restoration theory
 */
export function calculateAttentionLevel(
  responses: ResponsePattern[]
): number {
  if (responses.length < 5) return 0.7; // Default medium attention
  
  const recent = responses.slice(-10);
  
  // Factor 1: Consistency in response times
  const times = recent.map(r => r.responseTimeMs);
  const avgTime = average(times);
  const consistency = 1 - (calculateStandardDeviation(times) / avgTime);
  
  // Factor 2: Sustained accuracy
  const accuracy = recent.filter(r => r.correct).length / recent.length;
  
  // Factor 3: No extreme outliers (very fast or very slow responses)
  const outliers = times.filter(t => t < avgTime * 0.3 || t > avgTime * 3).length;
  const outlierPenalty = 1 - (outliers / times.length);
  
  return Math.max(0, Math.min(1,
    consistency * 0.4 + 
    accuracy * 0.4 + 
    outlierPenalty * 0.2
  ));
}

/**
 * Calculate fatigue level based on performance degradation
 * Based on cognitive fatigue research
 */
export function calculateFatigueLevel(
  responses: ResponsePattern[],
  sessionDurationMs: number
): number {
  if (responses.length < 10) return 0; // Too early for fatigue
  
  // Factor 1: Time-based fatigue (increases after 20 minutes)
  const timeFatigue = Math.min(1, Math.max(0, (sessionDurationMs - 1200000) / 1800000)); // 20-50 min range
  
  // Factor 2: Performance degradation
  const firstThird = responses.slice(0, Math.floor(responses.length / 3));
  const lastThird = responses.slice(-Math.floor(responses.length / 3));
  
  const earlyAccuracy = firstThird.filter(r => r.correct).length / firstThird.length;
  const lateAccuracy = lastThird.filter(r => r.correct).length / lastThird.length;
  const accuracyDrop = Math.max(0, earlyAccuracy - lateAccuracy);
  
  // Factor 3: Response time increase
  const earlyAvgTime = average(firstThird.map(r => r.responseTimeMs));
  const lateAvgTime = average(lastThird.map(r => r.responseTimeMs));
  const timeIncrease = Math.max(0, (lateAvgTime - earlyAvgTime) / earlyAvgTime);
  
  return Math.min(1,
    timeFatigue * 0.3 +
    accuracyDrop * 0.4 +
    timeIncrease * 0.3
  );
}

/**
 * Detect flow state (optimal learning state)
 * Based on Flow Theory (Csikszentmihalyi, 1990)
 */
export function detectFlowState(
  responses: ResponsePattern[],
  cognitiveLoad: number,
  attentionLevel: number
): boolean {
  if (responses.length < 10) return false;
  
  const recent = responses.slice(-10);
  
  // Flow state indicators:
  // 1. High accuracy (70-90%) - not too easy, not too hard
  const accuracy = recent.filter(r => r.correct).length / recent.length;
  const optimalChallenge = accuracy >= 0.7 && accuracy <= 0.9;
  
  // 2. Consistent response times
  const times = recent.map(r => r.responseTimeMs);
  const cv = calculateCoefficientOfVariation(times); // Low CV = consistent
  const consistentTiming = cv < 0.3;
  
  // 3. Moderate cognitive load (0.3-0.7)
  const optimalLoad = cognitiveLoad >= 0.3 && cognitiveLoad <= 0.7;
  
  // 4. High attention (> 0.7)
  const highAttention = attentionLevel > 0.7;
  
  return optimalChallenge && consistentTiming && optimalLoad && highAttention;
}

/**
 * Calculate learning efficiency based on multiple factors
 */
export function calculateLearningEfficiency(
  correctResponses: number,
  totalResponses: number,
  averageResponseTimeMs: number,
  retentionRate: number,
  sessionDurationMs: number
): number {
  // Accuracy component
  const accuracy = totalResponses > 0 ? correctResponses / totalResponses : 0;
  
  // Speed component (normalized to expected response time)
  const expectedResponseTime = 4000; // 4 seconds expected
  const speedEfficiency = Math.min(1, expectedResponseTime / averageResponseTimeMs);
  
  // Retention component
  const retentionScore = retentionRate;
  
  // Time efficiency (cards per minute)
  const cardsPerMinute = (totalResponses / sessionDurationMs) * 60000;
  const timeEfficiency = Math.min(1, cardsPerMinute / 15); // 15 cards/min is excellent
  
  // Weighted combination
  return accuracy * 0.3 + 
         speedEfficiency * 0.2 + 
         retentionScore * 0.3 + 
         timeEfficiency * 0.2;
}

/**
 * Analyze learning curve and predict mastery
 */
export function analyzeLearningCurve(
  attempts: Array<{ timestamp: Date; correct: boolean; responseTimeMs: number }>
): {
  masteryLevel: number; // 0-1 scale
  learningRate: number; // Speed of improvement
  predictedMasteryDate?: Date;
  plateauDetected: boolean;
} {
  if (attempts.length < 3) {
    return {
      masteryLevel: 0,
      learningRate: 0,
      plateauDetected: false,
    };
  }
  
  // Calculate rolling accuracy
  const windowSize = Math.min(5, Math.floor(attempts.length / 2));
  const accuracies: number[] = [];
  
  for (let i = windowSize; i <= attempts.length; i++) {
    const window = attempts.slice(i - windowSize, i);
    const accuracy = window.filter(a => a.correct).length / windowSize;
    accuracies.push(accuracy);
  }
  
  // Current mastery level (recent performance)
  const recentAccuracy = accuracies[accuracies.length - 1] || 0;
  const consistentCorrect = attempts.slice(-3).every(a => a.correct);
  const masteryLevel = consistentCorrect ? 1 : recentAccuracy;
  
  // Learning rate (improvement over time)
  const learningRate = accuracies.length > 1 
    ? (accuracies[accuracies.length - 1] - accuracies[0]) / accuracies.length
    : 0;
  
  // Plateau detection (no improvement in last 5 attempts)
  const plateauDetected = accuracies.length > 5 && 
    Math.abs(accuracies[accuracies.length - 1] - accuracies[accuracies.length - 5]) < 0.1;
  
  // Predict mastery date (if improving)
  let predictedMasteryDate: Date | undefined;
  if (learningRate > 0 && masteryLevel < 0.9) {
    const attemptsToMastery = (0.9 - masteryLevel) / learningRate;
    const avgTimeBetweenAttempts = 
      (attempts[attempts.length - 1].timestamp.getTime() - attempts[0].timestamp.getTime()) / 
      (attempts.length - 1);
    
    predictedMasteryDate = new Date(
      Date.now() + (attemptsToMastery * avgTimeBetweenAttempts)
    );
  }
  
  return {
    masteryLevel,
    learningRate: Math.max(0, Math.min(1, learningRate)),
    predictedMasteryDate,
    plateauDetected,
  };
}

// Utility functions
function average(numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

function calculateVariance(numbers: number[]): number {
  const avg = average(numbers);
  return average(numbers.map(n => Math.pow(n - avg, 2)));
}

function calculateStandardDeviation(numbers: number[]): number {
  return Math.sqrt(calculateVariance(numbers));
}

function calculateCoefficientOfVariation(numbers: number[]): number {
  const avg = average(numbers);
  return avg === 0 ? 0 : calculateStandardDeviation(numbers) / avg;
}
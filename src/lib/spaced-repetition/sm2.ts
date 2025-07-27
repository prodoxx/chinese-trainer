/**
 * SM-2 Spaced Repetition Algorithm
 * Based on SuperMemo 2 algorithm with modifications for decay tracking
 */

export interface ReviewResult {
  quality: number; // 0-5 scale (0=complete blackout, 5=perfect recall)
  responseTimeMs: number;
}

export interface SM2State {
  ease: number; // Ease factor (E-Factor) - starts at 2.5
  intervalDays: number; // Current interval in days
  repetitions: number; // Number of consecutive correct responses
  due: Date; // Next review date
  lastReviewedAt: Date;
}

/**
 * Calculate the next review state based on SM-2 algorithm
 */
export function calculateNextReview(
  currentState: SM2State,
  result: ReviewResult
): SM2State {
  const { quality } = result;
  
  // Create new state object
  const newState: SM2State = {
    ...currentState,
    lastReviewedAt: new Date()
  };
  
  // Update ease factor
  newState.ease = Math.max(1.3, currentState.ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // Reset if quality is below 3 (incorrect response)
  if (quality < 3) {
    newState.repetitions = 0;
    newState.intervalDays = 1;
  } else {
    newState.repetitions = currentState.repetitions + 1;
    
    // Calculate interval based on repetitions
    if (newState.repetitions === 1) {
      newState.intervalDays = 1;
    } else if (newState.repetitions === 2) {
      newState.intervalDays = 6;
    } else {
      newState.intervalDays = Math.round(currentState.intervalDays * newState.ease);
    }
  }
  
  // Calculate next due date
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + newState.intervalDays);
  newState.due = dueDate;
  
  return newState;
}

/**
 * Calculate quality score based on quiz performance
 * @param correct - Whether the answer was correct
 * @param responseTimeMs - Response time in milliseconds
 * @param timedOut - Whether the question timed out
 */
export function calculateQuality(
  correct: boolean,
  responseTimeMs: number,
  timedOut: boolean = false
): number {
  if (timedOut) return 0; // Complete blackout
  if (!correct) return 2; // Incorrect but attempted
  
  // Correct answer - quality based on response time
  if (responseTimeMs < 2000) return 5; // Perfect - instant recall
  if (responseTimeMs < 4000) return 4; // Good - quick recall
  if (responseTimeMs < 8000) return 3; // Pass - slow recall
  return 3; // Very slow but correct
}

/**
 * Calculate memory strength (0-1) based on current state and time since last review
 * This represents how well the item is likely remembered right now
 */
export function calculateMemoryStrength(state: SM2State): number {
  if (!state.lastReviewedAt) return 0;
  
  const now = new Date();
  const daysSinceReview = (now.getTime() - state.lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24);
  const daysUntilDue = (state.due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  
  // If overdue, strength decays exponentially
  if (daysUntilDue < 0) {
    const overdueDays = Math.abs(daysUntilDue);
    return Math.max(0, Math.exp(-overdueDays / state.intervalDays) * 0.5);
  }
  
  // If not due yet, calculate based on forgetting curve
  const progress = daysSinceReview / state.intervalDays;
  const strength = Math.exp(-progress * Math.log(2)); // Exponential decay
  
  return Math.max(0, Math.min(1, strength));
}

/**
 * Get cards that need review, sorted by priority
 */
export function getCardsForReview(
  reviews: Array<SM2State & { cardId: string }>,
  limit: number = 20
): Array<{ cardId: string; overdueDays: number; strength: number }> {
  const now = new Date();
  
  return reviews
    .map(review => {
      const overdueDays = (now.getTime() - review.due.getTime()) / (1000 * 60 * 60 * 24);
      const strength = calculateMemoryStrength(review);
      return {
        cardId: review.cardId,
        overdueDays: Math.max(0, overdueDays),
        strength
      };
    })
    .filter(item => item.overdueDays >= 0 || item.strength < 0.8) // Due or weak memory
    .sort((a, b) => {
      // Priority: most overdue first, then weakest memory
      if (a.overdueDays > 0 && b.overdueDays > 0) {
        return b.overdueDays - a.overdueDays;
      }
      if (a.overdueDays > 0) return -1;
      if (b.overdueDays > 0) return 1;
      return a.strength - b.strength;
    })
    .slice(0, limit);
}

/**
 * Calculate deck-level statistics
 */
export interface DeckStats {
  totalCards: number;
  newCards: number; // Cards not yet studied
  dueToday: number;
  overdue: number;
  learning: number; // Cards with < 3 repetitions
  mature: number; // Cards with >= 3 repetitions
  averageEase: number;
  averageStrength: number;
  nextReviewDate: Date | null;
}

export function calculateDeckStats(
  reviews: Array<SM2State & { cardId: string }>
): DeckStats {
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  
  let dueToday = 0;
  let overdue = 0;
  let learning = 0;
  let mature = 0;
  let totalEase = 0;
  let totalStrength = 0;
  let nextReviewDate: Date | null = null;
  
  reviews.forEach(review => {
    // Count due status
    if (review.due <= now) {
      overdue++;
    } else if (review.due <= todayEnd) {
      dueToday++;
    }
    
    // Count learning status
    if (review.repetitions < 3) {
      learning++;
    } else {
      mature++;
    }
    
    // Sum for averages
    totalEase += review.ease;
    totalStrength += calculateMemoryStrength(review);
    
    // Track next review date
    if (!nextReviewDate || review.due < nextReviewDate) {
      nextReviewDate = review.due;
    }
  });
  
  return {
    totalCards: reviews.length,
    newCards: 0, // This should be calculated by the caller since we only have studied reviews here
    dueToday,
    overdue,
    learning,
    mature,
    averageEase: reviews.length > 0 ? totalEase / reviews.length : 2.5,
    averageStrength: reviews.length > 0 ? totalStrength / reviews.length : 0,
    nextReviewDate
  };
}
import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Session-level metrics for tracking learning patterns and cognitive load
 */
export interface IStudySession extends Document {
  userId?: string;
  deckId: Types.ObjectId;
  sessionType: 'new' | 'review' | 'mixed';
  
  // Session Timing
  startTime: Date;
  endTime?: Date;
  durationMs: number;
  timeOfDay: 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number; // 0-6
  
  // Cards Studied
  cardsStudied: Types.ObjectId[];
  newCardsCount: number;
  reviewCardsCount: number;
  totalFlashCycles: number; // Total flash exposures
  
  // Performance Metrics
  quizScore: number; // % correct in quiz
  avgResponseTimeMs: number;
  avgConfidence: number; // Self-reported or calculated
  performanceTrend: 'improving' | 'stable' | 'declining';
  
  // Cognitive Load Indicators
  fatigueScore: number; // Based on response time degradation
  focusScore: number; // Based on consistency of responses
  flowStateIndicators: {
    consistentTiming: boolean;
    highAccuracy: boolean;
    lowVariability: boolean;
  };
  
  // Learning Efficiency
  learningVelocity: number; // New cards mastered / time
  retentionRate: number; // % cards retained from previous session
  interferenceEvents: number; // Times confused similar cards
  
  // Attention and Engagement
  pauseEvents: number; // Times paused during session
  totalPauseTimeMs: number;
  earlyExitFlag: boolean; // Session ended early
  skippedCards: number; // Cards skipped (future feature)
  
  // Multimodal Engagement
  audioInteractions: number; // Times audio played
  visualFocusTimeMs: number; // Time spent on visual elements
  activeRecallAttempts: number; // Times attempted recall before seeing answer
  
  // Session Quality Score (calculated)
  qualityScore: number; // 0-1, based on multiple factors
  
  // Environmental Context
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  sessionContext?: 'focused' | 'casual' | 'cramming';
  
  createdAt: Date;
  updatedAt: Date;
}

const StudySessionSchema = new Schema<IStudySession>(
  {
    userId: { type: String, index: true },
    deckId: { type: Schema.Types.ObjectId, ref: 'Deck', required: true, index: true },
    sessionType: { type: String, enum: ['new', 'review', 'mixed'], required: true },
    
    // Session Timing
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    durationMs: { type: Number, default: 0 },
    timeOfDay: {
      type: String,
      enum: ['early_morning', 'morning', 'afternoon', 'evening', 'night'],
      required: true
    },
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    
    // Cards Studied
    cardsStudied: [{ type: Schema.Types.ObjectId, ref: 'Card' }],
    newCardsCount: { type: Number, default: 0 },
    reviewCardsCount: { type: Number, default: 0 },
    totalFlashCycles: { type: Number, default: 0 },
    
    // Performance Metrics
    quizScore: { type: Number, default: 0, min: 0, max: 1 },
    avgResponseTimeMs: { type: Number, default: 0 },
    avgConfidence: { type: Number, default: 0, min: 0, max: 1 },
    performanceTrend: {
      type: String,
      enum: ['improving', 'stable', 'declining'],
      default: 'stable'
    },
    
    // Cognitive Load Indicators
    fatigueScore: { type: Number, default: 0, min: 0, max: 1 },
    focusScore: { type: Number, default: 0, min: 0, max: 1 },
    flowStateIndicators: {
      consistentTiming: { type: Boolean, default: false },
      highAccuracy: { type: Boolean, default: false },
      lowVariability: { type: Boolean, default: false },
    },
    
    // Learning Efficiency
    learningVelocity: { type: Number, default: 0 },
    retentionRate: { type: Number, default: 0, min: 0, max: 1 },
    interferenceEvents: { type: Number, default: 0 },
    
    // Attention and Engagement
    pauseEvents: { type: Number, default: 0 },
    totalPauseTimeMs: { type: Number, default: 0 },
    earlyExitFlag: { type: Boolean, default: false },
    skippedCards: { type: Number, default: 0 },
    
    // Multimodal Engagement
    audioInteractions: { type: Number, default: 0 },
    visualFocusTimeMs: { type: Number, default: 0 },
    activeRecallAttempts: { type: Number, default: 0 },
    
    // Session Quality Score
    qualityScore: { type: Number, default: 0, min: 0, max: 1 },
    
    // Environmental Context
    deviceType: { type: String, enum: ['desktop', 'tablet', 'mobile'] },
    sessionContext: { type: String, enum: ['focused', 'casual', 'cramming'] },
  },
  { timestamps: true }
);

// Indexes for analytics queries
StudySessionSchema.index({ userId: 1, startTime: -1 });
StudySessionSchema.index({ deckId: 1, startTime: -1 });
StudySessionSchema.index({ deckId: 1, sessionType: 1, quizScore: -1 });
StudySessionSchema.index({ timeOfDay: 1, qualityScore: -1 });

// Helper method to calculate time of day
StudySessionSchema.methods.calculateTimeOfDay = function() {
  const hour = this.startTime.getHours();
  if (hour >= 5 && hour < 9) return 'early_morning';
  if (hour >= 9 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

export default mongoose.models.StudySession || mongoose.model<IStudySession>('StudySession', StudySessionSchema);
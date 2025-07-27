import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Comprehensive learning statistics based on cognitive science and linguistics research
 */
export interface ILearningStats extends Document {
  userId?: string; // Optional for future multi-user support
  deckId: Types.ObjectId;
  cardId: Types.ObjectId;
  
  // Core Learning Metrics
  totalExposures: number; // Total times card was shown
  recognitionAttempts: number; // Times tested for recognition
  recallAttempts: number; // Times tested for active recall
  productionAttempts: number; // Times user had to produce/write (future feature)
  
  // Accuracy Metrics
  recognitionAccuracy: number; // % correct in multiple choice
  recallAccuracy: number; // % correct in active recall
  firstAttemptAccuracy: number; // % correct on first exposure
  
  // Time-based Metrics (Cognitive Processing)
  avgRecognitionTimeMs: number; // Avg time to recognize
  avgRecallTimeMs: number; // Avg time to recall
  fastestResponseMs: number; // Best response time
  slowestResponseMs: number; // Worst response time
  
  // Learning Curve Metrics
  trialsToMastery: number; // Number of attempts to reach 3 correct in a row
  masteryDate?: Date; // When card was first mastered
  retentionDuration: number; // Days retained after mastery
  forgettingEvents: number; // Times card was forgotten after mastery
  
  // Interference and Confusion Metrics
  confusionMatrix: Map<string, number>; // Which cards this is confused with
  interferenceScore: number; // How much this card interferes with others
  semanticSimilarityErrors: number; // Errors due to similar meanings
  visualSimilarityErrors: number; // Errors due to similar appearance
  phoneticSimilarityErrors: number; // Errors due to similar sound
  
  // Linguistic Complexity Metrics
  characterComplexity: {
    strokeCount: number;
    radicalCount: number;
    componentCount: number; // Number of semantic/phonetic components
    isPhonetic: boolean; // Has phonetic component
    isSemantic: boolean; // Has semantic component
    frequency: number; // Character frequency in language (1-5 scale)
  };
  
  // Context and Usage Metrics
  contextsSeen: number; // Different contexts/sentences seen
  collocationsLearned: string[]; // Common word combinations learned
  productiveUse: boolean; // Whether user can use in context
  
  // Cognitive Load Indicators
  cognitiveLoadScore: number; // Calculated based on response patterns
  attentionFatigueEvents: number; // Times performance dropped in session
  optimalStudyTimeMs: number; // Best time of day for this card
  
  // Spacing and Consolidation Metrics
  totalStudyTimeMs: number; // Cumulative study time
  studySessions: number; // Number of separate study sessions
  averageSessionGap: number; // Avg days between sessions
  consolidationScore: number; // How well consolidated in long-term memory
  
  // Multimodal Learning Metrics
  audioPlayCount: number; // Times audio was played
  visualDwellTimeMs: number; // Time spent looking at character
  imageAssociationStrength: number; // How well image helps recall
  
  // Error Analysis
  errorTypes: {
    timeout: number;
    wrongTone: number;
    wrongMeaning: number;
    partialMeaning: number;
    wrongCharacter: number;
    phoneticGuess: number; // Guessed based on sound
  };
  
  // Timestamps
  firstSeen: Date;
  lastSeen: Date;
  lastError?: Date;
  lastSuccess?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LearningStatsSchema = new Schema<ILearningStats>(
  {
    userId: { type: String, index: true },
    deckId: { type: Schema.Types.ObjectId, ref: 'Deck', required: true, index: true },
    cardId: { type: Schema.Types.ObjectId, ref: 'Card', required: true, index: true },
    
    // Core Learning Metrics
    totalExposures: { type: Number, default: 0 },
    recognitionAttempts: { type: Number, default: 0 },
    recallAttempts: { type: Number, default: 0 },
    productionAttempts: { type: Number, default: 0 },
    
    // Accuracy Metrics
    recognitionAccuracy: { type: Number, default: 0, min: 0, max: 1 },
    recallAccuracy: { type: Number, default: 0, min: 0, max: 1 },
    firstAttemptAccuracy: { type: Number, default: 0, min: 0, max: 1 },
    
    // Time-based Metrics
    avgRecognitionTimeMs: { type: Number, default: 0 },
    avgRecallTimeMs: { type: Number, default: 0 },
    fastestResponseMs: { type: Number, default: Infinity },
    slowestResponseMs: { type: Number, default: 0 },
    
    // Learning Curve Metrics
    trialsToMastery: { type: Number, default: 0 },
    masteryDate: { type: Date },
    retentionDuration: { type: Number, default: 0 },
    forgettingEvents: { type: Number, default: 0 },
    
    // Interference and Confusion
    confusionMatrix: { type: Map, of: Number, default: new Map() },
    interferenceScore: { type: Number, default: 0 },
    semanticSimilarityErrors: { type: Number, default: 0 },
    visualSimilarityErrors: { type: Number, default: 0 },
    phoneticSimilarityErrors: { type: Number, default: 0 },
    
    // Linguistic Complexity
    characterComplexity: {
      strokeCount: { type: Number, default: 0 },
      radicalCount: { type: Number, default: 0 },
      componentCount: { type: Number, default: 0 },
      isPhonetic: { type: Boolean, default: false },
      isSemantic: { type: Boolean, default: false },
      frequency: { type: Number, default: 3, min: 1, max: 5 },
    },
    
    // Context and Usage
    contextsSeen: { type: Number, default: 0 },
    collocationsLearned: [{ type: String }],
    productiveUse: { type: Boolean, default: false },
    
    // Cognitive Load
    cognitiveLoadScore: { type: Number, default: 0 },
    attentionFatigueEvents: { type: Number, default: 0 },
    optimalStudyTimeMs: { type: Number, default: 0 },
    
    // Spacing and Consolidation
    totalStudyTimeMs: { type: Number, default: 0 },
    studySessions: { type: Number, default: 0 },
    averageSessionGap: { type: Number, default: 0 },
    consolidationScore: { type: Number, default: 0, min: 0, max: 1 },
    
    // Multimodal Learning
    audioPlayCount: { type: Number, default: 0 },
    visualDwellTimeMs: { type: Number, default: 0 },
    imageAssociationStrength: { type: Number, default: 0, min: 0, max: 1 },
    
    // Error Analysis
    errorTypes: {
      timeout: { type: Number, default: 0 },
      wrongTone: { type: Number, default: 0 },
      wrongMeaning: { type: Number, default: 0 },
      partialMeaning: { type: Number, default: 0 },
      wrongCharacter: { type: Number, default: 0 },
      phoneticGuess: { type: Number, default: 0 },
    },
    
    // Timestamps
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    lastError: { type: Date },
    lastSuccess: { type: Date },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
LearningStatsSchema.index({ deckId: 1, cardId: 1 }, { unique: true });
LearningStatsSchema.index({ deckId: 1, masteryDate: 1 });
LearningStatsSchema.index({ deckId: 1, consolidationScore: 1 });
LearningStatsSchema.index({ userId: 1, totalExposures: -1 });

export default mongoose.models.LearningStats || mongoose.model<ILearningStats>('LearningStats', LearningStatsSchema);
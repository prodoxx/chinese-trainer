import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICard extends Document {
  hanzi: string;
  meaning: string;
  pinyin: string;
  imageUrl?: string;
  imageSource?: 'unsplash' | 'pexels' | 'placeholder' | 'dalle' | 'fal';
  imageSourceId?: string;
  imageFileId?: string;
  audioFileId?: string;
  audioUrl?: string;
  audioPath?: string; // R2 storage path for audio file
  imagePath?: string; // R2 storage path for image file
  imageAttribution?: string;
  imageAttributionUrl?: string;
  unsplashImageId?: string; // Keep for backward compatibility
  // AI Processing Information
  imagePrompt?: string; // The prompt used to generate the image
  interpretationPrompt?: string; // The prompt used for AI interpretation (meaning, pinyin, context)
  linguisticAnalysisPrompt?: string; // The prompt used for linguistic analysis (AI insights)
  imageSearchQueryPrompt?: string; // The prompt used to generate image search queries
  confusionGenerationPrompt?: string; // The prompt used to generate commonly confused characters
  comprehensiveAnalysisPrompt?: string; // The prompt used for comprehensive character analysis
  
  // AI Provider Information
  interpretationProvider?: 'OpenAI';
  analysisProvider?: 'OpenAI';
  queryProvider?: 'OpenAI';
  
  // AI Results Storage
  interpretationResult?: {
    meaning: string;
    pinyin: string;
    context: string;
    imagePrompt: string;
    provider: string;
    timestamp: Date;
  };
  linguisticAnalysisResult?: {
    etymology?: any;
    mnemonics?: any;
    commonErrors?: any;
    usage?: any;
    learningTips?: any;
    provider: string;
    timestamp: Date;
  };
  imageSearchQueryResult?: {
    query: string;
    provider: string;
    timestamp: Date;
  };
  
  cached: boolean;
  disambiguated?: boolean; // True if user manually selected from multiple meanings
  // Linguistic analysis fields
  semanticCategory?: string;
  tonePattern?: string;
  strokeCount?: number;
  componentCount?: number;
  visualComplexity?: number;
  overallDifficulty?: number;
  mnemonics?: string[];
  etymology?: string;
  // AI Insights (cached from OpenAI)
  aiInsights?: {
    etymology?: {
      origin: string;
      evolution: string[];
      culturalContext: string;
    };
    mnemonics: {
      visual: string;
      story: string;
      components: string;
    };
    commonErrors: {
      similarCharacters: string[];
      wrongContexts: string[];
      toneConfusions: string[];
    };
    usage: {
      commonCollocations: string[];
      registerLevel: 'formal' | 'informal' | 'neutral' | 'literary';
      frequency: 'high' | 'medium' | 'low';
      domains: string[];
    };
    learningTips: {
      forBeginners: string[];
      forIntermediate: string[];
      forAdvanced: string[];
    };
  };
  aiInsightsGeneratedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Virtual field for deck associations
  decks?: Types.ObjectId[];
}

const CardSchema = new Schema<ICard>(
  {
    hanzi: { type: String, required: true },
    meaning: { type: String, default: '' },
    pinyin: { type: String, default: '' },
    imageUrl: { type: String },
    imageSource: { type: String, enum: ['unsplash', 'pexels', 'placeholder', 'dalle', 'fal'] },
    imageSourceId: { type: String },
    imageFileId: { type: String },
    audioFileId: { type: String },
    audioUrl: { type: String },
    audioPath: { type: String }, // R2 storage path for audio file
    imagePath: { type: String }, // R2 storage path for image file
    imageAttribution: { type: String },
    imageAttributionUrl: { type: String },
    unsplashImageId: { type: String }, // Keep for backward compatibility
    // AI Processing Information
    imagePrompt: { type: String }, // The prompt used to generate the image
    interpretationPrompt: { type: String }, // The prompt used for AI interpretation
    linguisticAnalysisPrompt: { type: String }, // The prompt used for linguistic analysis
    imageSearchQueryPrompt: { type: String }, // The prompt used to generate image search queries
    confusionGenerationPrompt: { type: String }, // The prompt used to generate commonly confused characters
    comprehensiveAnalysisPrompt: { type: String }, // The prompt used for comprehensive character analysis
    
    // AI Provider Information
    interpretationProvider: { type: String, enum: ['OpenAI'] },
    analysisProvider: { type: String, enum: ['OpenAI'] },
    queryProvider: { type: String, enum: ['OpenAI'] },
    
    // AI Results Storage
    interpretationResult: {
      meaning: { type: String },
      pinyin: { type: String },
      context: { type: String },
      imagePrompt: { type: String },
      provider: { type: String },
      timestamp: { type: Date }
    },
    linguisticAnalysisResult: {
      etymology: { type: Schema.Types.Mixed },
      mnemonics: { type: Schema.Types.Mixed },
      commonErrors: { type: Schema.Types.Mixed },
      usage: { type: Schema.Types.Mixed },
      learningTips: { type: Schema.Types.Mixed },
      provider: { type: String },
      timestamp: { type: Date }
    },
    imageSearchQueryResult: {
      query: { type: String },
      provider: { type: String },
      timestamp: { type: Date }
    },
    
    cached: { type: Boolean, default: false },
    disambiguated: { type: Boolean, default: false },
    // Linguistic analysis fields
    semanticCategory: { type: String },
    tonePattern: { type: String },
    strokeCount: { type: Number },
    componentCount: { type: Number },
    visualComplexity: { type: Number },
    overallDifficulty: { type: Number },
    mnemonics: [{ type: String }],
    etymology: { type: String },
    // AI Insights (cached from OpenAI)
    aiInsights: {
      etymology: {
        origin: { type: String },
        evolution: [{ type: String }],
        culturalContext: { type: String },
      },
      mnemonics: {
        visual: { type: String },
        story: { type: String },
        components: { type: String },
      },
      commonErrors: {
        similarCharacters: [{ type: String }],
        wrongContexts: [{ type: String }],
        toneConfusions: [{ type: String }],
      },
      usage: {
        commonCollocations: [{ type: String }],
        registerLevel: { type: String, enum: ['formal', 'informal', 'neutral', 'literary'] },
        frequency: { type: String, enum: ['high', 'medium', 'low'] },
        domains: [{ type: String }],
      },
      learningTips: {
        forBeginners: [{ type: String }],
        forIntermediate: [{ type: String }],
        forAdvanced: [{ type: String }],
      },
    },
    aiInsightsGeneratedAt: { type: Date },
  },
  { timestamps: true }
);

// Create a compound unique index on hanzi + pinyin
// This allows the same character with different pronunciations/meanings
CardSchema.index({ hanzi: 1, pinyin: 1 }, { unique: true });

// Keep a non-unique index on hanzi for efficient lookups
CardSchema.index({ hanzi: 1 });

export default mongoose.models.Card || mongoose.model<ICard>('Card', CardSchema);
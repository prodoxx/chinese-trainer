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
  imageAttribution?: string;
  imageAttributionUrl?: string;
  unsplashImageId?: string; // Keep for backward compatibility
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
    hanzi: { type: String, required: true, unique: true },
    meaning: { type: String, default: '' },
    pinyin: { type: String, default: '' },
    imageUrl: { type: String },
    imageSource: { type: String, enum: ['unsplash', 'pexels', 'placeholder', 'dalle', 'fal'] },
    imageSourceId: { type: String },
    imageFileId: { type: String },
    audioFileId: { type: String },
    audioUrl: { type: String },
    imageAttribution: { type: String },
    imageAttributionUrl: { type: String },
    unsplashImageId: { type: String }, // Keep for backward compatibility
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

CardSchema.index({ hanzi: 1 }, { unique: true });

export default mongoose.models.Card || mongoose.model<ICard>('Card', CardSchema);
import mongoose, { Schema, Document } from 'mongoose';

export interface ICharacterAnalysis extends Document {
  character: string;
  pinyin: string;
  
  // Semantic analysis
  semanticCategory: string;
  semanticFields: string[];
  conceptType: 'concrete' | 'abstract' | 'mixed';
  
  // Linguistic features
  strokeCount: number;
  componentCount: number;
  radicals: Array<{
    radical: string;
    category: string;
    position: string;
  }>;
  
  // Tone analysis
  tonePattern: string;
  toneDescription: string;
  toneDifficulty: number;
  
  // Learning insights
  mnemonics: string[];
  etymology: string;
  commonConfusions: Array<{
    character: string;
    reason: string;
    similarity: number;
  }>;
  
  // Difficulty metrics
  visualComplexity: number;
  phoneticTransparency: number;
  semanticTransparency: number;
  overallDifficulty: number;
  
  // Usage and frequency
  frequency: number;
  contextExamples: string[];
  collocations: string[];
  
  // OpenAI analysis metadata
  openAIModel: string;
  analysisVersion: string;
  lastAnalyzedAt: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const CharacterAnalysisSchema = new Schema<ICharacterAnalysis>(
  {
    character: { type: String, required: true, unique: true, index: true },
    pinyin: { type: String, required: true },
    
    // Semantic analysis
    semanticCategory: { type: String },
    semanticFields: [{ type: String }],
    conceptType: { type: String, enum: ['concrete', 'abstract', 'mixed'] },
    
    // Linguistic features
    strokeCount: { type: Number },
    componentCount: { type: Number },
    radicals: [{
      radical: String,
      category: String,
      position: String
    }],
    
    // Tone analysis
    tonePattern: { type: String },
    toneDescription: { type: String },
    toneDifficulty: { type: Number },
    
    // Learning insights
    mnemonics: [{ type: String }],
    etymology: { type: String },
    commonConfusions: [{
      character: String,
      reason: String,
      similarity: Number
    }],
    
    // Difficulty metrics
    visualComplexity: { type: Number },
    phoneticTransparency: { type: Number },
    semanticTransparency: { type: Number },
    overallDifficulty: { type: Number },
    
    // Usage and frequency
    frequency: { type: Number },
    contextExamples: [{ type: String }],
    collocations: [{ type: String }],
    
    // OpenAI analysis metadata
    openAIModel: { type: String },
    analysisVersion: { type: String, default: '1.0' },
    lastAnalyzedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// TTL index to refresh analysis after 90 days
CharacterAnalysisSchema.index({ lastAnalyzedAt: 1 }, { expireAfterSeconds: 7776000 });

export default mongoose.models.CharacterAnalysis || mongoose.model<ICharacterAnalysis>('CharacterAnalysis', CharacterAnalysisSchema);
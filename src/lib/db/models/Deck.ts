import mongoose, { Schema, Document } from 'mongoose';

export interface IDeck extends Document {
  userId: string; // Reference to User in PostgreSQL
  name: string;
  slug: string;
  description?: string;
  isPublic: boolean;
  cardsCount: number;
  status: 'importing' | 'enriching' | 'ready' | 'error';
  enrichmentProgress?: {
    totalCards: number;
    processedCards: number;
    currentCard?: string;
    currentOperation?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DeckSchema = new Schema<IDeck>(
  {
    userId: { type: String, required: true, index: true }, // User ID from PostgreSQL
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String },
    isPublic: { type: Boolean, default: false },
    cardsCount: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ['importing', 'enriching', 'ready', 'error'],
      default: 'importing' 
    },
    enrichmentProgress: {
      totalCards: { type: Number },
      processedCards: { type: Number },
      currentCard: { type: String },
      currentOperation: { type: String },
    },
  },
  { timestamps: true }
);

// Compound index for unique deck names per user
DeckSchema.index({ userId: 1, slug: 1 }, { unique: true });

export default mongoose.models.Deck || mongoose.model<IDeck>('Deck', DeckSchema);
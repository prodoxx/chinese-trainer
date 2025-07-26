import mongoose, { Schema, Document } from 'mongoose';

export interface IDeck extends Document {
  name: string;
  slug: string;
  cardsCount: number;
  status: 'importing' | 'enriching' | 'ready';
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
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    cardsCount: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ['importing', 'enriching', 'ready'],
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

export default mongoose.models.Deck || mongoose.model<IDeck>('Deck', DeckSchema);
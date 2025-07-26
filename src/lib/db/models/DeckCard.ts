import mongoose, { Schema, Document, Types } from 'mongoose';

// Junction table to link decks and cards (many-to-many relationship)
export interface IDeckCard extends Document {
  deckId: Types.ObjectId;
  cardId: Types.ObjectId;
  addedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeckCardSchema = new Schema<IDeckCard>(
  {
    deckId: { type: Schema.Types.ObjectId, ref: 'Deck', required: true },
    cardId: { type: Schema.Types.ObjectId, ref: 'Card', required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound unique index to prevent duplicate entries
DeckCardSchema.index({ deckId: 1, cardId: 1 }, { unique: true });
// Index for efficient queries
DeckCardSchema.index({ deckId: 1 });
DeckCardSchema.index({ cardId: 1 });

export default mongoose.models.DeckCard || mongoose.model<IDeckCard>('DeckCard', DeckCardSchema);
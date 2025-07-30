import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReview extends Document {
  userId: string; // Reference to User in PostgreSQL
  cardId: Types.ObjectId;
  deckId: Types.ObjectId;
  ease: number;
  intervalDays: number;
  repetitions: number;
  due: Date;
  seen: number;
  correct: number;
  avgResponseMs: number;
  lastReviewedAt?: Date;
  memoryStrength?: number; // Cached value for display
  firstStudiedAt?: Date; // When card was first seen in flash session
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    userId: { type: String, required: true, index: true }, // User ID from PostgreSQL
    cardId: { type: Schema.Types.ObjectId, ref: 'Card', required: true },
    deckId: { type: Schema.Types.ObjectId, ref: 'Deck', required: true },
    ease: { type: Number, default: 2.5, min: 1.3 },
    intervalDays: { type: Number, default: 1 },
    repetitions: { type: Number, default: 0 },
    due: { type: Date, default: Date.now },
    seen: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    avgResponseMs: { type: Number, default: 0 },
    lastReviewedAt: { type: Date },
    memoryStrength: { type: Number, min: 0, max: 1 },
    firstStudiedAt: { type: Date }, // Set when card completes first flash session
  },
  { timestamps: true }
);

// Compound index for unique reviews per user/card combination
ReviewSchema.index({ userId: 1, cardId: 1 }, { unique: true });
ReviewSchema.index({ userId: 1, deckId: 1, due: 1 });
ReviewSchema.index({ userId: 1, deckId: 1, memoryStrength: 1 });

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
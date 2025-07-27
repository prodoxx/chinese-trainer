import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReview extends Document {
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
    cardId: { type: Schema.Types.ObjectId, ref: 'Card', required: true, unique: true },
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

ReviewSchema.index({ cardId: 1 }, { unique: true });
ReviewSchema.index({ deckId: 1, due: 1 });
ReviewSchema.index({ deckId: 1, memoryStrength: 1 });

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
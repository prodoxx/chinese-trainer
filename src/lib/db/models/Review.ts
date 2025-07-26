import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReview extends Document {
  cardId: Types.ObjectId;
  ease: number;
  intervalDays: number;
  due: Date;
  seen: number;
  correct: number;
  avgResponseMs: number;
  lastReviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    cardId: { type: Schema.Types.ObjectId, ref: 'Card', required: true, unique: true },
    ease: { type: Number, default: 2.5, min: 1.3 },
    intervalDays: { type: Number, default: 1 },
    due: { type: Date, default: Date.now },
    seen: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    avgResponseMs: { type: Number, default: 0 },
    lastReviewedAt: { type: Date },
  },
  { timestamps: true }
);

ReviewSchema.index({ cardId: 1 }, { unique: true });
ReviewSchema.index({ due: 1 });

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
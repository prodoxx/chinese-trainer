import mongoose, { Schema, Document } from 'mongoose';

export interface IDeck extends Document {
  name: string;
  slug: string;
  cardsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const DeckSchema = new Schema<IDeck>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    cardsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

DeckSchema.index({ name: 1 }, { unique: true });
DeckSchema.index({ slug: 1 }, { unique: true });

export default mongoose.models.Deck || mongoose.model<IDeck>('Deck', DeckSchema);
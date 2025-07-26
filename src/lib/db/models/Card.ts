import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICard extends Document {
  hanzi: string;
  meaning: string;
  pinyin: string;
  imageUrl?: string;
  imageSource?: 'unsplash' | 'pexels' | 'placeholder';
  imageSourceId?: string;
  imageFileId?: string;
  audioFileId?: string;
  audioUrl?: string;
  imageAttribution?: string;
  imageAttributionUrl?: string;
  unsplashImageId?: string; // Keep for backward compatibility
  cached: boolean;
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
    imageSource: { type: String, enum: ['unsplash', 'pexels', 'placeholder'] },
    imageSourceId: { type: String },
    imageFileId: { type: String },
    audioFileId: { type: String },
    audioUrl: { type: String },
    imageAttribution: { type: String },
    imageAttributionUrl: { type: String },
    unsplashImageId: { type: String }, // Keep for backward compatibility
    cached: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CardSchema.index({ hanzi: 1 }, { unique: true });

export default mongoose.models.Card || mongoose.model<ICard>('Card', CardSchema);
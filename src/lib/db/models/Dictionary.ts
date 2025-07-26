import mongoose, { Schema, Document } from 'mongoose';

export interface IDictionary extends Document {
  traditional: string;
  simplified: string;
  pinyin: string;
  definitions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DictionarySchema = new Schema<IDictionary>(
  {
    traditional: { type: String, required: true, index: true },
    simplified: { type: String, required: true },
    pinyin: { type: String, required: true },
    definitions: { type: [String], required: true },
  },
  { timestamps: true }
);

// Compound index for lookups
DictionarySchema.index({ traditional: 1 });
DictionarySchema.index({ simplified: 1 });

export default mongoose.models.Dictionary || mongoose.model<IDictionary>('Dictionary', DictionarySchema);
import { Schema, model, Document } from "mongoose";

export interface IWord extends Document {
  id: string;
  newari_word: string;
  nepali_meaning: string;
  category: string;
  expertise_lvl: number;
  type: string;
}

const wordSchema = new Schema<IWord>({
  id: { type: String, required: true, unique: true },
  newari_word: { type: String, required: true },
  nepali_meaning: { type: String, required: true },
  category: { type: String, required: true },
  expertise_lvl: { type: Number, required: true },
  type: { type: String, required: true },
});

export const Word = model<IWord>("Word", wordSchema);

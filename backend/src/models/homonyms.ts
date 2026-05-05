import { Schema, model, Document, Types } from "mongoose";

export interface IHomonym extends Document {
  newari_word: string;
  wordIds: Types.ObjectId[];
  meanings: string[];
  createdAt: Date;
  updatedAt: Date;
}

const homonymsSchema = new Schema<IHomonym>(
  {
    newari_word: { type: String, required: true, unique: true, index: true },
    wordIds: { type: [Schema.Types.ObjectId], required: true },
    meanings: { type: [String], required: true },
  },
  { timestamps: true },
);

export const Homonym = model<IHomonym>("Homonym", homonymsSchema);

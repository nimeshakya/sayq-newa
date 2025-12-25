import { Schema, Document } from "mongoose";
import mongoose from "mongoose";

export interface ResultProp extends Document {
  userID: mongoose.Types.ObjectId;
  questionID: string;
  wordID: mongoose.Types.ObjectId;
  difficulty_lvl?: number | undefined;
  selected_answer: string;
  attempts: number;
  responseTime: number;
  isCorrect: boolean;
  createdDate: Date;
}
export interface ExamProp extends Document {
  userID: mongoose.Types.ObjectId;
  total_questions: number;
  correct_answers?: number;
  accuracy: number;
  easy_accuracy: number;
  medium_accuracy: number;
  hard_accuracy: number;
  average_time: number;
  createdDate: Date;
}

export const resultSchema = new Schema<ResultProp>({
  userID: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  questionID: { type: String, required: true },
  wordID: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Word" },
  difficulty_lvl: { type: Number, required: true },
  selected_answer: { type: String, required: true },
  attempts: { type: Number, required: true },
  responseTime: { type: Number, required: true },
  isCorrect: { type: Boolean, required: true },
  createdDate: { type: Date, default: Date.now },
});

export const examSchema = new Schema<ExamProp>({
  userID: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  total_questions: { type: Number, required: true },
  correct_answers: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  easy_accuracy: { type: Number, required: true },
  medium_accuracy: { type: Number, required: true },
  hard_accuracy: { type: Number, required: true },
  average_time: { type: Number, required: true },
  createdDate: { type: Date, default: Date.now },
});

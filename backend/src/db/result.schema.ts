import { Schema, Document } from "mongoose";

export interface ResultProp extends Document {
  userID: string;
  questionID: string;
  difficulty_lvl?: number | undefined;
  selected_answer: string;
  attempts: number;
  responseTime: number;
  isCorrect: boolean;
}
export interface ExamProp extends Document {
  userID: string;
  total_questions: number;
  correct_answers?: number;
  accuracy: number;
  easy_accuracy: number;
  medium_accuracy: number;
  hard_accuracy: number;
  average_time: number;
}

export const resultSchema = new Schema<ResultProp>({
  userID: { type: String, required: true },
  questionID: { type: String, required: true },
  difficulty_lvl: { type: Number, required: true },
  selected_answer: { type: String, required: true },
  attempts: { type: Number, required: true },
  responseTime: { type: Number, required: true },
  isCorrect: { type: Boolean, required: true },
});

export const examSchema = new Schema<ExamProp>({
  userID: { type: String, required: true },
  total_questions: { type: Number, required: true },
  correct_answers: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  easy_accuracy: { type: Number, required: true },
  medium_accuracy: { type: Number, required: true },
  hard_accuracy: { type: Number, required: true },
  average_time: { type: Number, required: true },
});

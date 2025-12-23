import mongoose from "mongoose";

import {
  examSchema,
  resultSchema,
  ResultProp,
  ExamProp,
} from "../db/result.schema";

export const ResultModel = mongoose.model<ResultProp>("Result", resultSchema);
export const ExamModel = mongoose.model<ExamProp>("Exam", examSchema);

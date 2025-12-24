import fs from "fs";
import path from "path";
import { ResultModel, ExamModel } from "../models/result.model";
import UserWordProgressModel from "../models/userWordProgress.model";
import { calculateNextReview } from "../utils/reviewSchedule.util";

export interface UserResultProp {
  userID?: string;
  questionID: string;
  wordID: string;
  difficulty_lvl?: number | undefined;
  selected_answer: string;
  attempts: number;
  responseTime: number;
  isCorrect: boolean;
  createdAt: string;
}

const FILE_PATH = path.resolve(process.cwd(), "..", "data", "userResult.json");

// Save to JSON file
export const saveUserStatResult = (data: UserResultProp[]): void => {
  let existingData: UserResultProp[] = [];

  if (fs.existsSync(FILE_PATH)) {
    const raw = fs.readFileSync(FILE_PATH, "utf-8");
    try {
      existingData = JSON.parse(raw);
      if (!Array.isArray(existingData)) {
        existingData = [];
      }
    } catch {
      existingData = [];
    }
  }

  const updatedData = [...existingData, ...data];
  fs.writeFileSync(FILE_PATH, JSON.stringify(updatedData, null, 2));
};

// Calculate exam statistics
const calculateExamStats = (data: UserResultProp[]) => {
  const total_questions = data.length;
  const correct_answers = data.filter((r) => r.isCorrect).length;
  const accuracy =
    total_questions > 0 ? (correct_answers / total_questions) * 100 : 0;

  // Separate by difficulty: easy (0,1), medium (2,3), hard (4,5)
  const easy = data.filter(
    (r) => r.difficulty_lvl === 0 || r.difficulty_lvl === 1
  );
  const medium = data.filter(
    (r) => r.difficulty_lvl === 2 || r.difficulty_lvl === 3
  );
  const hard = data.filter(
    (r) => r.difficulty_lvl === 4 || r.difficulty_lvl === 5
  );

  const easy_correct = easy.filter((r) => r.isCorrect).length;
  const medium_correct = medium.filter((r) => r.isCorrect).length;
  const hard_correct = hard.filter((r) => r.isCorrect).length;

  const easy_accuracy =
    easy.length > 0 ? (easy_correct / easy.length) * 100 : 0;
  const medium_accuracy =
    medium.length > 0 ? (medium_correct / medium.length) * 100 : 0;
  const hard_accuracy =
    hard.length > 0 ? (hard_correct / hard.length) * 100 : 0;

  const total_time = data.reduce((sum, r) => sum + r.responseTime, 0);
  const average_time = total_questions > 0 ? total_time / total_questions : 0;

  return {
    total_questions,
    correct_answers,
    accuracy,
    easy_accuracy,
    medium_accuracy,
    hard_accuracy,
    average_time,
  };
};

// Save to MongoDB
export const saveUserResultToMongoDB = async (
  data: UserResultProp[]
): Promise<void> => {
  try {
    if (data.length === 0) return;

    const userID = data[0].userID || "unknown";

    // Save individual results
    const resultsToInsert = data.map((result) => ({
      userID: result.userID || "unknown",
      questionID: result.questionID,
      wordID: result.wordID,
      difficulty_lvl: result.difficulty_lvl,
      selected_answer: result.selected_answer,
      attempts: result.attempts,
      responseTime: result.responseTime,
      isCorrect: result.isCorrect,
      createdDate: result.createdAt ? new Date(result.createdAt) : new Date(),
    }));

    if (resultsToInsert.length > 0) {
      await ResultModel.insertMany(resultsToInsert);
      console.log(`Saved ${resultsToInsert.length} results to MongoDB`);
    }

    // Calculate and save exam statistics
    const examStats = calculateExamStats(data);
    const examData = {
      userID,
      ...examStats,
      createdDate: new Date(),
    };

    await ExamModel.create(examData);
    console.log(`Saved exam statistics for user ${userID}`);

    // Update user word progress for each answered word
    for (const r of data) {
      const uid = r.userID || userID;
      const wid = r.wordID;
      if (!uid || !wid) continue;

      const existing = await UserWordProgressModel.findOne({
        userId: uid,
        wordId: wid,
      });
      if (existing) {
        existing.attempts += 1;
        if (r.isCorrect) {
          existing.correct += 1;
          existing.boxLevel = Math.min(existing.boxLevel + 1, 5);
        } else {
          existing.boxLevel = Math.max(1, existing.boxLevel - 1);
        }
        existing.mastery = Math.round(
          (existing.correct / existing.attempts) * 100
        );
        existing.avgResponseTime = Math.round(
          (existing.avgResponseTime * (existing.attempts - 1) +
            r.responseTime) /
            existing.attempts
        );
        existing.nextReviewAt = calculateNextReview(existing.boxLevel);
        existing.lastReviewedAt = new Date();
        await existing.save();
      } else {
        await UserWordProgressModel.create({
          userId: uid,
          wordId: wid,
          boxLevel: r.isCorrect ? 1 : 1,
          mastery: r.isCorrect ? 100 : 0,
          attempts: 1,
          correct: r.isCorrect ? 1 : 0,
          avgResponseTime: r.responseTime,
          nextReviewAt: calculateNextReview(1),
          lastReviewedAt: new Date(),
        });
      }
    }
    console.log(`Updated user word progress for ${data.length} records`);
  } catch (error: any) {
    console.error("Error saving results to MongoDB:", error);
    throw error;
  }
};

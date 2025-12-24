import { Request, Response } from "express";
import UserWordProgressModel from "../models/userWordProgress.model";

interface WordProgressData {
  userId: string;
  wordId: string;
  isCorrect: boolean;
  responseTime: number;
  boxLevel?: number;
}

// Leitner Box intervals in milliseconds
const LEITNER_INTERVALS = [
  1000 * 60 * 60 * 24, // Box 1: 1 day
  1000 * 60 * 60 * 24 * 3, // Box 2: 3 days
  1000 * 60 * 60 * 24 * 7, // Box 3: 7 days
  1000 * 60 * 60 * 24 * 14, // Box 4: 14 days
  1000 * 60 * 60 * 24 * 30, // Box 5: 30 days
];

// Calculate next review date based on Leitner box system
const calculateNextReview = (boxLevel: number): Date => {
  const safeBoxLevel = Math.min(Math.max(1, boxLevel), 5);
  const interval = LEITNER_INTERVALS[safeBoxLevel - 1];
  return new Date(Date.now() + interval);
};

// Save or update word progress
export const saveProgress = async (
  req: Request<{}, {}, WordProgressData>,
  res: Response
) => {
  try {
    const { userId, wordId, isCorrect, responseTime, boxLevel } = req.body;

    // Validate required fields
    if (!userId || !wordId) {
      return res.status(400).json({
        message: "userId and wordId are required",
      });
    }

    // Find existing progress or create new
    let progress = await UserWordProgressModel.findOne({ userId, wordId });

    if (progress) {
      // Update existing progress
      progress.attempts += 1;
      if (isCorrect) {
        progress.correct += 1;
        progress.boxLevel = Math.min(progress.boxLevel + 1, 5);
      } else {
        progress.boxLevel = Math.max(1, progress.boxLevel - 1);
      }

      // Calculate mastery percentage
      progress.mastery = Math.round(
        (progress.correct / progress.attempts) * 100
      );

      // Update average response time
      progress.avgResponseTime = Math.round(
        (progress.avgResponseTime * (progress.attempts - 1) + responseTime) /
          progress.attempts
      );

      progress.nextReviewAt = calculateNextReview(progress.boxLevel);
      progress.lastReviewedAt = new Date();

      await progress.save();
    } else {
      // Create new progress record
      progress = await UserWordProgressModel.create({
        userId,
        wordId,
        boxLevel: isCorrect ? 1 : 1,
        mastery: isCorrect ? 100 : 0,
        attempts: 1,
        correct: isCorrect ? 1 : 0,
        avgResponseTime: responseTime,
        nextReviewAt: calculateNextReview(1),
        lastReviewedAt: new Date(),
      });
    }

    res.status(200).json({
      message: "Word progress saved successfully",
      data: progress,
    });
  } catch (error: any) {
    console.error("Error saving word progress:", error);
    res.status(500).json({
      message: "Failed to save word progress",
      error: error.message,
    });
  }
};

// Get user progress for a specific word
export const getWordProgress = async (
  req: Request<{ userId: string; wordId: string }>,
  res: Response
) => {
  try {
    const { userId, wordId } = req.params;

    const progress = await UserWordProgressModel.findOne({ userId, wordId });

    if (!progress) {
      return res.status(404).json({
        message: "No progress found for this word",
      });
    }

    res.status(200).json({
      message: "Word progress retrieved successfully",
      data: progress,
    });
  } catch (error: any) {
    console.error("Error retrieving word progress:", error);
    res.status(500).json({
      message: "Failed to retrieve word progress",
      error: error.message,
    });
  }
};

// Get all progress for a user
export const getUserProgress = async (
  req: Request<{ userId: string }>,
  res: Response
) => {
  try {
    const { userId } = req.params;

    const progressList = await UserWordProgressModel.find({ userId });

    res.status(200).json({
      message: "User progress retrieved successfully",
      count: progressList.length,
      data: progressList,
    });
  } catch (error: any) {
    console.error("Error retrieving user progress:", error);
    res.status(500).json({
      message: "Failed to retrieve user progress",
      error: error.message,
    });
  }
};

// Get words due for review
export const getWordsForReview = async (
  req: Request<{ userId: string }>,
  res: Response
) => {
  try {
    const { userId } = req.params;
    const now = new Date();

    const wordsForReview = await UserWordProgressModel.find({
      userId,
      nextReviewAt: { $lte: now },
    }).sort({ nextReviewAt: 1 });

    res.status(200).json({
      message: "Words for review retrieved successfully",
      count: wordsForReview.length,
      data: wordsForReview,
    });
  } catch (error: any) {
    console.error("Error retrieving words for review:", error);
    res.status(500).json({
      message: "Failed to retrieve words for review",
      error: error.message,
    });
  }
};

// Get user statistics
export const getUserStats = async (
  req: Request<{ userId: string }>,
  res: Response
) => {
  try {
    const { userId } = req.params;

    const allProgress = await UserWordProgressModel.find({ userId });

    if (allProgress.length === 0) {
      return res.status(200).json({
        message: "No progress data found",
        data: {
          totalWords: 0,
          averageMastery: 0,
          boxDistribution: { box1: 0, box2: 0, box3: 0, box4: 0, box5: 0 },
          averageResponseTime: 0,
          totalAttempts: 0,
          correctAnswers: 0,
          accuracy: 0,
        },
      });
    }

    const totalWords = allProgress.length;
    const totalAttempts = allProgress.reduce((sum, p) => sum + p.attempts, 0);
    const correctAnswers = allProgress.reduce((sum, p) => sum + p.correct, 0);
    const averageMastery = Math.round(
      allProgress.reduce((sum, p) => sum + p.mastery, 0) / totalWords
    );
    const averageResponseTime = Math.round(
      allProgress.reduce((sum, p) => sum + p.avgResponseTime, 0) / totalWords
    );
    const accuracy =
      totalAttempts > 0
        ? Math.round((correctAnswers / totalAttempts) * 100)
        : 0;

    const boxDistribution = {
      box1: allProgress.filter((p) => p.boxLevel === 1).length,
      box2: allProgress.filter((p) => p.boxLevel === 2).length,
      box3: allProgress.filter((p) => p.boxLevel === 3).length,
      box4: allProgress.filter((p) => p.boxLevel === 4).length,
      box5: allProgress.filter((p) => p.boxLevel === 5).length,
    };

    res.status(200).json({
      message: "User statistics retrieved successfully",
      data: {
        totalWords,
        averageMastery,
        boxDistribution,
        averageResponseTime,
        totalAttempts,
        correctAnswers,
        accuracy,
      },
    });
  } catch (error: any) {
    console.error("Error retrieving user statistics:", error);
    res.status(500).json({
      message: "Failed to retrieve user statistics",
      error: error.message,
    });
  }
};

// Delete user progress (for testing/reset)
export const deleteUserProgress = async (
  req: Request<{ userId: string }>,
  res: Response
) => {
  try {
    const { userId } = req.params;

    const result = await UserWordProgressModel.deleteMany({ userId });

    res.status(200).json({
      message: "User progress deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error("Error deleting user progress:", error);
    res.status(500).json({
      message: "Failed to delete user progress",
      error: error.message,
    });
  }
};

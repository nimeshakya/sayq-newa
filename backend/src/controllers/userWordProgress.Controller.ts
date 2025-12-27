import { Request, Response } from "express";
import mongoose from "mongoose";
import UserWordProgressModel from "../models/userWordProgress.model";
import { calculateNextReview } from "../utils/reviewSchedule.util";

interface WordProgressData {
  userId: string;
  wordId: string;
  isCorrect: boolean;
  responseTime: number;
  boxLevel?: number;
}

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

    // Convert userId and wordId to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const wordObjectId = new mongoose.Types.ObjectId(wordId);

    // Find existing progress or create new
    let progress = await UserWordProgressModel.findOne({
      userId: userObjectId,
      wordId: wordObjectId,
    });

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
      // For newly introduced words (isCorrect=false, responseTime=0), set immediate review
      const isNewIntroduction = !isCorrect && responseTime === 0;
      progress = await UserWordProgressModel.create({
        userId: userObjectId,
        wordId: wordObjectId,
        boxLevel: isCorrect ? 1 : 1,
        mastery: isCorrect ? 100 : 0,
        attempts: isNewIntroduction ? 0 : 1,
        correct: isCorrect ? 1 : 0,
        avgResponseTime: responseTime,
        nextReviewAt: isNewIntroduction ? new Date() : calculateNextReview(1),
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

    // Convert userId and wordId to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const wordObjectId = new mongoose.Types.ObjectId(wordId);

    const progress = await UserWordProgressModel.findOne({
      userId: userObjectId,
      wordId: wordObjectId,
    });

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

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const progressList = await UserWordProgressModel.find({
      userId: userObjectId,
    });

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

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const wordsForReview = await UserWordProgressModel.find({
      userId: userObjectId,
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

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const allProgress = await UserWordProgressModel.find({
      userId: userObjectId,
    });

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

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const result = await UserWordProgressModel.deleteMany({
      userId: userObjectId,
    });

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

// Mark word as introduced
export const markIntroduced = async (req: Request, res: Response) => {
  try {
    const { userId, wordId } = req.body;

    if (!userId || !wordId) {
      return res.status(400).json({
        message: "userId and wordId are required",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const wordObjectId = new mongoose.Types.ObjectId(wordId);

    let progress = await UserWordProgressModel.findOne({
      userId: userObjectId,
      wordId: wordObjectId,
    });

    if (!progress) {
      // Create new progress entry with introduced status
      progress = new UserWordProgressModel({
        userId: userObjectId,
        wordId: wordObjectId,
        boxLevel: 1,
        mastery: 20, // Mark as introduced (20% mastery)
        attempts: 0,
        correct: 0,
        avgResponseTime: 0,
        nextReviewAt: new Date(Date.now()), // Review today
      });
    } else {
      // Update existing progress
      progress.mastery = Math.max(progress.mastery, 20); // At least 20% if introduced
      progress.attempts += 1;
    }

    progress.lastReviewedAt = new Date();
    await progress.save();

    res.status(200).json({
      message: "Word marked as introduced",
      data: progress,
    });
  } catch (error: any) {
    console.error("Error marking word as introduced:", error);
    res.status(500).json({
      message: "Failed to mark word as introduced",
      error: error.message,
    });
  }
};

// Mark word as learned
export const markLearned = async (req: Request, res: Response) => {
  try {
    const { userId, wordId } = req.body;

    if (!userId || !wordId) {
      return res.status(400).json({
        message: "userId and wordId are required",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const wordObjectId = new mongoose.Types.ObjectId(wordId);

    let progress = await UserWordProgressModel.findOne({
      userId: userObjectId,
      wordId: wordObjectId,
    });

    if (!progress) {
      // Create new progress entry with learned status
      progress = new UserWordProgressModel({
        userId: userObjectId,
        wordId: wordObjectId,
        boxLevel: 5, // Highest level for learned
        mastery: 60, // Set partial mastery when marked learned
        attempts: 0,
        correct: 0,
        avgResponseTime: 0,
        nextReviewAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Review in a 2 days
      });
    } else {
      // Update existing progress
      progress.mastery = 60; // Set partial mastery when marked learned
      progress.boxLevel = 5; // Highest level
      progress.correct = progress.attempts; // Mark all as correct
    }

    progress.lastReviewedAt = new Date();
    await progress.save();

    res.status(200).json({
      message: "Word marked as learned",
      data: progress,
    });
  } catch (error: any) {
    console.error("Error marking word as learned:", error);
    res.status(500).json({
      message: "Failed to mark word as learned",
      error: error.message,
    });
  }
};

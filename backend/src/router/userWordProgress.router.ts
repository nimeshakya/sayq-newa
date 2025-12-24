import express from "express";
import {
  saveProgress,
  getWordProgress,
  getUserProgress,
  getWordsForReview,
  getUserStats,
  deleteUserProgress,
} from "../controllers/userWordProgress.Controller";

export default (router: express.Router): void => {
  // Save or update word progress
  router.post("/word-progress", saveProgress);

  // Get progress for a specific word
  router.get("/word-progress/:userId/:wordId", getWordProgress);

  // Get all progress for a user
  router.get("/word-progress/:userId", getUserProgress);

  // Get words due for review
  router.get("/word-progress/:userId/review", getWordsForReview);

  // Get user statistics
  router.get("/word-progress/:userId/stats", getUserStats);

  // Delete user progress (for testing/reset)
  router.delete("/word-progress/:userId", deleteUserProgress);
};

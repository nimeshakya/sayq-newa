import express from "express";
import {
  saveProgress,
  getWordProgress,
  getUserProgress,
  getWordsForReview,
  getUserStats,
  deleteUserProgress,
  markIntroduced,
  markLearned,
} from "../controllers/userWordProgress.Controller";

export default (router: express.Router): void => {
  // Save or update word progress
  router.post("/word-progress", saveProgress);

  // Get user statistics (must come before the general :userId route)
  router.get("/word-progress/:userId/stats", getUserStats);

  // Get words due for review (must come before the general :userId route)
  router.get("/word-progress/:userId/review", getWordsForReview);

  // Get progress for a specific word
  router.get("/word-progress/:userId/:wordId", getWordProgress);

  // Get all progress for a user (general - must come last)
  router.get("/word-progress/:userId", getUserProgress);

  // Delete user progress (for testing/reset)
  router.delete("/word-progress/:userId", deleteUserProgress);

  // Mark word as introduced
  router.post("/mark-introduced", markIntroduced);

  // Alias with explicit resource prefix for frontend consistency
  router.post("/userWordProgress/mark-introduced", markIntroduced);

  // Mark word as learned
  router.post("/mark-learned", markLearned);

  // Alias with explicit resource prefix for frontend consistency
  router.post("/userWordProgress/mark-learned", markLearned);
};

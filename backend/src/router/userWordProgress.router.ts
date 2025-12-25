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

  // Mark word as introduced
  router.post("/mark-introduced", markIntroduced);

  // Alias with explicit resource prefix for frontend consistency
  router.post("/userWordProgress/mark-introduced", markIntroduced);

  // Mark word as learned
  router.post("/mark-learned", markLearned);

  // Alias with explicit resource prefix for frontend consistency
  router.post("/userWordProgress/mark-learned", markLearned);
};

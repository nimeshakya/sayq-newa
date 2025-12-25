import express from "express";
import {
  updateUserExpertiseLevel,
  getUserExpertiseInfo,
} from "../controllers/expertise.controller";

const router = express.Router();

/**
 * POST /api/expertise/update/:userId
 * Updates user expertise level based on latest exam
 */
router.post("/update/:userId", updateUserExpertiseLevel);

/**
 * GET /api/expertise/:userId
 * Get user expertise level and exam statistics
 */
router.get("/:userId", getUserExpertiseInfo);

export default router;

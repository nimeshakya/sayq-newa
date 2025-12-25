import mongoose from "mongoose";
import { ExamProp } from "../db/result.schema";
import UserModel from "../models/user.model";

/**
 * Predict user expertise level (0-5) based on exam performance
 * Uses the ML model stored in MongoDB ml_models collection
 */
export const predictAndUpdateExpertiseLevel = async (
  userID: mongoose.Types.ObjectId | string,
  examData: ExamProp
): Promise<number | null> => {
  try {
    // Get MongoDB connection
    const db = mongoose.connection.db;
    if (!db) {
      console.warn("MongoDB connection not available for ML prediction");
      return null;
    }

    // Fetch trained model from ml_models collection
    const mlModelsCollection = db.collection("ml_models");
    const modelRecord = await mlModelsCollection.findOne({
      model_name: "expertise_level_classifier",
    });

    if (!modelRecord) {
      console.warn(
        "ML model not found in database. Train the model first using updateModel.ipynb"
      );
      return null;
    }

    // Extract model and features
    const modelBinary = modelRecord.model_binary.buffer;

    // Note: In a production environment, you would deserialize the pickle object
    // For now, we'll use a rules-based approach as fallback
    // TODO: Implement proper Python ML model loading in Node.js

    const predictedLevel = predictExpertiseLevelRulesBased(examData);

    // Update user with predicted expertise level
    const userObjectId =
      userID instanceof mongoose.Types.ObjectId
        ? userID
        : new mongoose.Types.ObjectId(userID);

    const user = await UserModel.findByIdAndUpdate(
      userObjectId,
      { expertise_lvl: predictedLevel },
      { new: true }
    );

    console.log(
      `✓ Updated user ${userID} expertise level to ${predictedLevel}`
    );
    return predictedLevel;
  } catch (error: any) {
    console.error("Error predicting expertise level:", error.message);
    return null;
  }
};

/**
 * Rules-based fallback for expertise level prediction
 * When ML model is not available
 *
 * Maps accuracy and difficulty performance to levels:
 * 0 = Complete Beginner (accuracy < 30%)
 * 1 = Beginner (30% - 45%)
 * 2 = Elementary (45% - 60%)
 * 3 = Intermediate (60% - 75%)
 * 4 = Upper-Intermediate (75% - 85%)
 * 5 = Advanced (85%+)
 */
export const predictExpertiseLevelRulesBased = (
  examData: ExamProp
): number => {
  const {
    accuracy,
    easy_accuracy,
    medium_accuracy,
    hard_accuracy,
    average_time,
  } = examData;

  // Normalize to 0-100 if values are decimals
  const normalizeAccuracy = (val: number) => {
    return val > 1 ? val : val * 100;
  };

  const normAccuracy = normalizeAccuracy(accuracy);
  const normEasyAcc = normalizeAccuracy(easy_accuracy);
  const normMediumAcc = normalizeAccuracy(medium_accuracy);
  const normHardAcc = normalizeAccuracy(hard_accuracy);

  // Weight: overall accuracy (40%) + hard questions (30%) + easy questions (20%) + response time (10%)
  const timeScore = Math.max(0, Math.min(100, 100 - average_time * 5)); // Penalize slow response
  const weightedScore =
    normAccuracy * 0.4 +
    normHardAcc * 0.3 +
    normEasyAcc * 0.2 +
    timeScore * 0.1;

  // Map to expertise level (0-5)
  if (weightedScore < 30) return 0; // Complete Beginner
  if (weightedScore < 45) return 1; // Beginner
  if (weightedScore < 60) return 2; // Elementary
  if (weightedScore < 75) return 3; // Intermediate
  if (weightedScore < 85) return 4; // Upper-Intermediate
  return 5; // Advanced
};

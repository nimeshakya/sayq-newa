import { Request, Response } from "express";
import { ExamModel } from "../models/result.model";
import UserModel from "../models/user.model";
import { predictAndUpdateExpertiseLevel } from "../utils/predictExpertiseLevel.util";
import mongoose from "mongoose";

/**
 * Endpoint: POST /api/expertise/update/:userId
 * Updates user expertise level based on their latest exam performance
 */
export const updateUserExpertiseLevel = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.params as { userId: string };

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Fetch user's latest exam data
    const latestExam = await ExamModel.findOne({
      userID: userObjectId,
    }).sort({ createdDate: -1 });

    if (!latestExam) {
      return res.status(404).json({
        message: "No exam data found for user. Complete an exam first.",
      });
    }

    // Predict and update expertise level
    const newExpertiseLevel = await predictAndUpdateExpertiseLevel(
      userObjectId,
      latestExam
    );

    if (newExpertiseLevel === null) {
      return res.status(500).json({
        message:
          "Failed to predict expertise level. ML model may not be trained.",
      });
    }

    // Fetch updated user
    const updatedUser = await UserModel.findById(userObjectId);

    res.status(200).json({
      message: "Expertise level updated successfully",
      expertise_level: newExpertiseLevel,
      user: updatedUser,
      examData: {
        accuracy: latestExam.accuracy,
        easy_accuracy: latestExam.easy_accuracy,
        medium_accuracy: latestExam.medium_accuracy,
        hard_accuracy: latestExam.hard_accuracy,
        average_time: latestExam.average_time,
      },
    });
  } catch (error: any) {
    console.error("Error updating expertise level:", error);
    res.status(500).json({
      message: "Failed to update expertise level",
      error: error.message,
    });
  }
};

/**
 * Endpoint: GET /api/expertise/:userId
 * Get current expertise level and exam statistics for a user
 */
export const getUserExpertiseInfo = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get user info
    const user = await UserModel.findById(userObjectId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get latest exam
    const latestExam = await ExamModel.findOne({
      userID: userObjectId,
    }).sort({ createdDate: -1 });

    // Get all exams for progress tracking
    const allExams = await ExamModel.find({
      userID: userObjectId,
    }).sort({ createdDate: -1 });

    res.status(200).json({
      user: {
        id: user._id,
        expertise_level: user.expertise_lvl,
        name: user.name,
        email: user.email,
      },
      latestExam: latestExam
        ? {
            accuracy: latestExam.accuracy,
            easy_accuracy: latestExam.easy_accuracy,
            medium_accuracy: latestExam.medium_accuracy,
            hard_accuracy: latestExam.hard_accuracy,
            average_time: latestExam.average_time,
            total_questions: latestExam.total_questions,
            correct_answers: latestExam.correct_answers,
            createdDate: latestExam.createdDate,
          }
        : null,
      examHistory: {
        total_exams: allExams.length,
        recent_exams: allExams.slice(0, 5),
      },
    });
  } catch (error: any) {
    console.error("Error fetching expertise info:", error);
    res.status(500).json({
      message: "Failed to fetch expertise information",
      error: error.message,
    });
  }
};

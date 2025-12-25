import { Request, Response } from "express";
import {
  saveUserStatResult,
  saveUserResultToMongoDB,
  UserResultProp,
} from "../utils/userResultStore.util";
import { ResultModel, ExamModel } from "../models/result.model";
import fs from "fs";
import path from "path";

// Save user results to MongoDB only
export const saveUserResult = async (
  req: Request<{}, {}, UserResultProp[]>,
  res: Response
) => {
  try {
    // Save to MongoDB only
    await saveUserResultToMongoDB(req.body);

    res.status(201).json({
      message: "User results saved successfully to MongoDB",
    });
  } catch (error: any) {
    console.error("Error saving user results:", error);
    res.status(500).json({ message: "Failed to save user results" });
  }
};

// Pull data from MongoDB and store to JSON
export const pullResultsFromMongoToJSON = async (
  req: Request,
  res: Response
) => {
  try {
    // Fetch all results from MongoDB
    const results = await ResultModel.find({});
    // Fetch all exam data from MongoDB
    const exams = await ExamModel.find({});

    if (results.length === 0 && exams.length === 0) {
      return res.status(404).json({ message: "No data found in MongoDB" });
    }

    // Convert MongoDB results to UserResultProp format
    const formattedResults: UserResultProp[] = results.map((result) => ({
      id: result.id,
      userID: result.userID.toString(),
      questionID: result.questionID,
      wordID: result.wordID.toString(),
      difficulty_lvl: parseInt(result.difficulty_lvl?.toString() || "0"),
      selected_answer: result.selected_answer,
      attempts: result.attempts,
      responseTime: result.responseTime,
      isCorrect: result.isCorrect,
      createdAt: new Date().toISOString(),
    }));

    // Save results to JSON file
    saveUserStatResult(formattedResults);

    // Save exam data to JSON file
    const EXAM_FILE_PATH = path.resolve(
      process.cwd(),
      "..",
      "data",
      "examData.json"
    );
    const examData = exams.map((exam) => ({
      id: exam.id,
      userID: exam.userID,
      total_questions: exam.total_questions,
      correct_answers: exam.correct_answers,
      accuracy: exam.accuracy,
      easy_accuracy: exam.easy_accuracy,
      medium_accuracy: exam.medium_accuracy,
      hard_accuracy: exam.hard_accuracy,
      average_time: exam.average_time,
      createdAt: new Date().toISOString(),
    }));

    fs.writeFileSync(EXAM_FILE_PATH, JSON.stringify(examData, null, 2));

    res.status(200).json({
      message: `Successfully pulled data from MongoDB and saved to JSON`,
      resultsCount: results.length,
      examsCount: exams.length,
    });
  } catch (error: any) {
    console.error("Error pulling data from MongoDB:", error);
    res.status(500).json({ message: "Failed to pull data from MongoDB" });
  }
};

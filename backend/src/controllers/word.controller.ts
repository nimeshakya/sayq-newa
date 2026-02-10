import { Request, Response } from "express";
import mongoose from "mongoose";
import { Word } from "../models/word.model";
import { searchDataWord } from "../utils/wordSearch.util";
import UserWordProgressModel from "../models/userWordProgress.model";
import UserModel from "../models/user.model";

interface AuthenticatedRequest extends Request {
  user?: { sub?: string } | string;
}

const getUserFromRequest = async (req: AuthenticatedRequest) => {
  // Resolve the authenticated user record using JWT subject (googleId).
  const payload = req.user;
  const subject = typeof payload === "string" ? payload : payload?.sub;
  if (!subject) return null;
  return UserModel.findOne({ googleId: subject }).lean();
};

// Create a new word entry after validating required fields.
export const addWord = async (req: Request, res: Response) => {
  console.log("Received body:", req.body);
  try {
    const { id, newari_word, nepali_meaning, category, expertise_lvl, type } =
      req.body;

    if (
      !id ||
      !newari_word ||
      !nepali_meaning ||
      !category ||
      !expertise_lvl ||
      !type
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingWord = await Word.findOne({ id });
    if (existingWord) {
      return res
        .status(400)
        .json({ message: "Word with this id already exists" });
    }

    const word = new Word({
      id,
      newari_word,
      nepali_meaning,
      category,
      expertise_lvl,
      type,
    });

    const savedWord = await word.save();
    res.status(201).json(savedWord);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Fetch words matching optional category/count, limited by user's expertise level.
export const fetchDataWord = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user || !user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { category, count } = req.query;
    const userExpertiseLevel =
      typeof user.expertise_lvl === "number" ? user.expertise_lvl : undefined;

    const result = await searchDataWord({
      category: category as string | undefined,
      expertise_lvl: userExpertiseLevel,
      count: count ? Number(count) : undefined,
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Fetch words the user has not yet mastered, within their expertise level.
export const fetchLearningWords = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user || !user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { count } = req.query;
    const requestedCount = count ? Number(count) : 10;

    const expertiseLevel =
      typeof user.expertise_lvl === "number" ? user.expertise_lvl : undefined;

    const wordFilter: Record<string, any> = {};
    if (typeof expertiseLevel === "number") {
      wordFilter.expertise_lvl = { $lte: expertiseLevel };
    }

    // Fetch ALL words from database with expertise level filter
    const allWords = await Word.find(wordFilter).lean();

    if (!allWords || allWords.length === 0) {
      return res.status(404).json({ message: "No words found" });
    }

    // Fetch user's progress
    const userObjectId = new mongoose.Types.ObjectId(String(user._id));
    const progressList = await UserWordProgressModel.find({
      userId: userObjectId,
    }).lean();

    // Filter words with mastery > 45%
    const highMasteryWordIds = new Set(
      progressList
        .filter((p: any) => p.mastery > 45)
        .map((p: any) => String(p.wordId)),
    );

    console.log(
      `[fetchAllWords] User expertise: ${expertiseLevel ?? "unknown"}, Total words: ${allWords.length}, High mastery: ${highMasteryWordIds.size}`,
    );

    // Remove words with mastery > 45%
    const unlearnedWords = allWords.filter(
      (word: any) => !highMasteryWordIds.has(String(word._id)),
    );

    console.log(
      `[fetchAllWords] Unlearned words: ${unlearnedWords.length}, Requested: ${requestedCount}`,
    );

    // If no unlearned words, return empty array
    if (unlearnedWords.length === 0) {
      return res.status(200).json([]);
    }

    // Randomly sample the requested count from remaining pool
    const shuffled = [...unlearnedWords].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(
      0,
      Math.min(requestedCount, shuffled.length),
    );

    res.status(200).json(selectedWords);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Return the list of unique word categories.
export const fetchCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Word.distinct("category");
    res.status(200).json(categories);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Return the list of unique expertise levels found in the word set.
export const fetchExpertiseLevel = async (req: Request, res: Response) => {
  try {
    const expertise_levels = await Word.distinct("expertise_lvl");
    res.status(200).json(expertise_levels);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const searchWords = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Search by newari_word or nepali_meaning (case-insensitive)
    const searchRegex = new RegExp(query, "i");
    const results = await Word.find({
      $or: [
        { newari_word: searchRegex },
        { nepali_meaning: searchRegex },
        { id: searchRegex },
        { category: searchRegex },
      ],
    }).limit(20);

    res.status(200).json(results);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

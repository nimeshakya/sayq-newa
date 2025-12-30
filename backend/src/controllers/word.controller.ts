import { Request, Response } from "express";
import mongoose from "mongoose";
import { Word } from "../models/word.model";
import { searchDataWord } from "../utils/wordSearch.util";
import UserWordProgressModel from "../models/userWordProgress.model";

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

export const fetchDataWord = async (req: Request, res: Response) => {
  try {
    const { category, expertise_lvl, count } = req.query;

    const result = await searchDataWord({
      category: category as string | undefined,
      expertise_lvl: expertise_lvl ? Number(expertise_lvl) : undefined,
      count: count ? Number(count) : undefined,
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Fetch words filtered by user mastery
export const fetchAllWords = async (req: Request, res: Response) => {
  try {
    const { count, userId, userExpertiseLevel } = req.query;
    const requestedCount = count ? Number(count) : 10;
    const expertiseLevel = userExpertiseLevel ? Number(userExpertiseLevel) : 5;

    // If no userId provided, return random sample (backward compatibility)
    if (!userId || typeof userId !== "string") {
      const result = await searchDataWord({
        count: requestedCount,
      });
      return res.status(200).json(result);
    }

    // Fetch ALL words from database with expertise level filter
    const allWords = await Word.find({
      expertise_lvl: { $lte: expertiseLevel }
    }).lean();

    if (!allWords || allWords.length === 0) {
      return res.status(404).json({ message: "No words found" });
    }

    // Fetch user's progress
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const progressList = await UserWordProgressModel.find({
      userId: userObjectId,
    }).lean();

    // Filter words with mastery > 45%
    const highMasteryWordIds = new Set(
      progressList
        .filter((p: any) => p.mastery > 45)
        .map((p: any) => String(p.wordId))
    );

    console.log(`[fetchAllWords] User expertise: ${expertiseLevel}, Total words (expertise <= ${expertiseLevel}): ${allWords.length}, High mastery: ${highMasteryWordIds.size}`);

    // Remove words with mastery > 45%
    const unlearnedWords = allWords.filter(
      (word: any) => !highMasteryWordIds.has(String(word._id))
    );

    console.log(`[fetchAllWords] Unlearned words: ${unlearnedWords.length}, Requested: ${requestedCount}`);

    // If no unlearned words, return empty array
    if (unlearnedWords.length === 0) {
      return res.status(200).json([]);
    }

    // Randomly sample the requested count from remaining pool
    const shuffled = [...unlearnedWords].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, Math.min(requestedCount, shuffled.length));

    res.status(200).json(selectedWords);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

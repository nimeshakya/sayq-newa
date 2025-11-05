import { Request, Response } from "express";
import { Word } from "../models/word.model";

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

export const getWords = async (req: Request, res: Response) => {
  try {
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : null;
    let words;
    if (pageSize && pageSize > 0) {
      words = await Word.find().limit(pageSize);
    } else {
      words = await Word.find();
    }
    res.status(200).json({
      success: true,
      count: words.length,
      data: words,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getWordById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const word = await Word.findOne({ id });

    if (!word) {
      return res.status(404).json({ message: "Word not found." });
    }

    res.status(200).json(word);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

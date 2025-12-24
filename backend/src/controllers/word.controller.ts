import { Request, Response } from "express";
import { Word } from "../models/word.model";
import { searchDataWord } from "../utils/wordSearch.util";

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

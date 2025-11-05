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

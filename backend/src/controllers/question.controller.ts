import { Request, Response } from "express";
import { createQuestion } from "../utils/question.utils";

export const generateQuestion = async (req: Request, res: Response) => {
  try {
    const { category, expertise_lvl, count } = req.query;

    const result = createQuestion({
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

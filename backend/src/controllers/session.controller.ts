import { Request, Response } from "express";
import { buildSessionQuestions } from "../utils/sessionQuestion.util";

export const getSessionQuestions = async (req: Request, res: Response) => {
  try {
    const { userId, category, expertise_lvl, count } = req.query;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ message: "userId is required" });
    }

    const questions = await buildSessionQuestions({
      userId,
      category: category as string | undefined,
      expertise_lvl: expertise_lvl ? Number(expertise_lvl) : undefined,
      count: count ? Number(count) : undefined,
    });

    return res.status(200).json(questions);
  } catch (error: any) {
    console.error("getSessionQuestions error:", error);
    return res.status(500).json({ message: error.message });
  }
};

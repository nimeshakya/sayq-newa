import { Request, Response } from "express";
import { buildSessionQuestions } from "../utils/sessionQuestion.util";

export const getSessionQuestions = async (req: Request, res: Response) => {
  try {
    const { userId, category, expertise_lvl, count } = req.query;

    if (!userId || typeof userId !== "string") {
      // Signal auth requirement so client can redirect to login
      return res.status(401).json({ message: "AUTH_REQUIRED" });
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
    // Map specific errors to client-understood signals
    if (error?.message === "INSUFFICIENT_PROGRESS_POOL") {
      return res.status(409).json({ message: "LEARNING_REQUIRED" });
    }
    if (error?.message === "FILTERED_POOL_TOO_SMALL") {
      return res.status(409).json({ message: "LEARNING_REQUIRED" });
    }
    return res.status(500).json({ message: error.message });
  }
};

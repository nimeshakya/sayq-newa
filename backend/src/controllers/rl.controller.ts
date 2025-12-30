import { Request, Response } from "express";
import mongoose from "mongoose";
import { Word } from "../models/word.model";
import UserWordProgressModel from "../models/userWordProgress.model";

// Use native fetch (available in Node 18+) instead of node-fetch
const fetch = globalThis.fetch;

const RL_SERVICE_URL = process.env.RL_SERVICE_URL || "http://localhost:8000";
const DQN_SERVICE_URL = process.env.DQN_SERVICE_URL || "http://localhost:8001";

const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));

export const recommendWords = async (req: Request, res: Response) => {
  try {
    const { userId, category, k } = req.query;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ message: "userId is required" });
    }

    const limit = k ? Math.max(1, Number(k)) : 5;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const wordFilter: Record<string, any> = {};
    if (category && typeof category === "string") {
      wordFilter.category = category;
    }

    const words = await Word.find(wordFilter).lean();
    if (!words || words.length === 0) {
      return res.status(404).json({ message: "No words found" });
    }

    const progressList = await UserWordProgressModel.find({
      userId: userObjectId,
    }).lean();

    // Filter out fully learned words (mastery >= 90)
    const learnedWordIds = new Set(
      progressList
        .filter((p: any) => p.mastery >= 90)
        .map((p: any) => String(p.wordId))
    );

    const unlearnedWords = words.filter(
      (w: any) => !learnedWordIds.has(String(w._id))
    );

    if (unlearnedWords.length === 0) {
      return res.status(200).json({
        recommendations: [],
        message: "All words have been learned. Great job!",
      });
    }

    // Calculate user level from non-learned words only
    const inProgressList = progressList.filter((p: any) => p.mastery < 90);
    const avgMastery = inProgressList.length
      ? inProgressList.reduce(
          (sum: number, p: any) => sum + (p.mastery ?? 0),
          0
        ) / inProgressList.length
      : 0;
    const totalAttempts = progressList.reduce(
      (sum: number, p: any) => sum + (p.attempts ?? 0),
      0
    );
    const totalCorrect = progressList.reduce(
      (sum: number, p: any) => sum + (p.correct ?? 0),
      0
    );
    const recentAccuracy =
      totalAttempts > 0 ? totalCorrect / totalAttempts : 0.6;

    const userLevel = clamp(Math.round(avgMastery / 20), 1, 5) || 2;

    console.log(
      `[ML Recommend] userLevel: ${userLevel}, avgMastery: ${avgMastery.toFixed(
        1
      )}, unlearnedWords: ${unlearnedWords.length}/${words.length}`
    );

    const payload = {
      userLevel,
      k: limit,
      recentAccuracy,
      words: unlearnedWords.map((w: any) => ({
        id: String(w._id),
        difficulty: w.expertise_lvl ?? 3,
        category: w.category,
      })),
    };

    const resp = await fetch(`${RL_SERVICE_URL}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res
        .status(502)
        .json({ message: "RL service error", detail: text });
    }

    const data = (await resp.json()) as {
      recommendations?: Array<{ wordId: string; score: number }>;
    };

    // Enrich recommendations with full word data
    const enrichedRecommendations = (data.recommendations ?? []).map((rec) => {
      const word = words.find((w: any) => String(w._id) === rec.wordId);
      return {
        ...rec,
        word: word || null,
      };
    });

    return res.status(200).json({
      recommendations: enrichedRecommendations.map((r) => ({
        ...r.word,
        score: r.score,
      })),
    });
  } catch (error: any) {
    console.error("recommendWords error:", error);
    return res
      .status(500)
      .json({ message: "Failed to get recommendations", error: error.message });
  }
};

// DQN-based recommendations endpoint
export const recommendWordsDQN = async (req: Request, res: Response) => {
  try {
    const { userId, category, k } = req.query;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ message: "userId is required" });
    }

    const limit = k ? Math.max(1, Number(k)) : 5;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const wordFilter: Record<string, any> = {};
    if (category && typeof category === "string") {
      wordFilter.category = category;
    }

    const words = await Word.find(wordFilter).lean();
    if (!words || words.length === 0) {
      return res.status(404).json({ message: "No words found" });
    }

    const progressList = await UserWordProgressModel.find({
      userId: userObjectId,
    }).lean();

    // Filter out fully learned words (mastery >= 90)
    const learnedWordIds = new Set(
      progressList
        .filter((p: any) => p.mastery >= 90)
        .map((p: any) => String(p.wordId))
    );

    const unlearnedWords = words.filter(
      (w: any) => !learnedWordIds.has(String(w._id))
    );

    if (unlearnedWords.length === 0) {
      return res.status(200).json({
        recommendations: [],
        message: "All words have been learned. Great job!",
      });
    }

    // Calculate user level from non-learned words only
    const inProgressList = progressList.filter((p: any) => p.mastery < 90);
    const avgMastery = inProgressList.length
      ? inProgressList.reduce(
          (sum: number, p: any) => sum + (p.mastery ?? 0),
          0
        ) / inProgressList.length
      : 0;
    const totalAttempts = progressList.reduce(
      (sum: number, p: any) => sum + (p.attempts ?? 0),
      0
    );
    const totalCorrect = progressList.reduce(
      (sum: number, p: any) => sum + (p.correct ?? 0),
      0
    );
    const recentAccuracy =
      totalAttempts > 0 ? totalCorrect / totalAttempts : 0.6;

    const userLevel = clamp(Math.round(avgMastery / 20), 1, 5) || 2;

    console.log(
      `[DQN Recommend] userLevel: ${userLevel}, avgMastery: ${avgMastery.toFixed(
        1
      )}, unlearnedWords: ${unlearnedWords.length}/${words.length}`
    );

    const payload = {
      userLevel,
      k: limit,
      recentAccuracy,
      words: unlearnedWords.map((w: any) => ({
        id: String(w._id),
        difficulty: w.expertise_lvl ?? 3,
        category: w.category,
      })),
    };

    // Try DQN service first, fallback to Scorer service if unavailable
    let resp;
    let serviceName = "DQN";
    try {
      resp = await fetch(`${DQN_SERVICE_URL}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        throw new Error(`DQN service returned ${resp.status}`);
      }
    } catch (dqnError) {
      console.warn(
        "DQN service unavailable, falling back to Scorer service:",
        dqnError
      );
      serviceName = "Scorer (fallback)";
      resp = await fetch(`${RL_SERVICE_URL}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const text = await resp.text();
        return res.status(502).json({
          message: "Both DQN and Scorer services unavailable",
          detail: text,
        });
      }
    }

    const data = (await resp.json()) as {
      recommendations?: Array<{ wordId: string; score: number }>;
    };

    // Enrich recommendations with full word data
    const enrichedRecommendations = (data.recommendations ?? []).map((rec) => {
      const word = unlearnedWords.find(
        (w: any) => String(w._id) === rec.wordId
      );
      return {
        ...rec,
        word: word || null,
      };
    });

    return res.status(200).json({
      recommendations: enrichedRecommendations.map((r) => ({
        ...r.word,
        score: r.score,
      })),
      service: serviceName,
    });
  } catch (error: any) {
    console.error("recommendWordsDQN error:", error);
    return res.status(500).json({
      message: "Failed to get DQN recommendations",
      error: error.message,
    });
  }
};

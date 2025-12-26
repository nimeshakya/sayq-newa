import mongoose from "mongoose";
import { Word as WordModel } from "../models/word.model";
import UserWordProgressModel from "../models/userWordProgress.model";
import UserModel from "../models/user.model";

export interface SessionQuestion {
  id: string;
  question: string;
  wordId: string;
  sub_question?: string | undefined;
  difficulty_lvl?: number | undefined;
  correct_answer: string;
  category: string;
  options: string[];
}

export interface WordDoc {
  _id: any;
  id?: string;
  newari_word: string;
  nepali_meaning: string;
  category: string;
  expertise_lvl: number;
  type: string;
}

interface BuildParams {
  userId: string;
  category?: string;
  expertise_lvl?: number;
  count?: number; // requested count, min 10 enforced
}

const shuffle = <T>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const pickDistractors = (
  pool: WordDoc[],
  excludeId: string,
  amount: number,
  category: string
): string[] => {
  const primary = pool.filter(
    (w) => String(w._id) !== excludeId && w.category === category
  );
  const extras = pool.filter(
    (w) => String(w._id) !== excludeId && w.category !== category
  );
  const ordered = [...shuffle(primary), ...shuffle(extras)];
  return ordered.slice(0, amount).map((w) => w.nepali_meaning);
};

export const buildSessionQuestions = async ({
  userId,
  category,
  expertise_lvl,
  count = 10,
}: BuildParams): Promise<SessionQuestion[]> => {
  const effectiveCount = Math.max(count, 10);
  // Fetch user progress first
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const progressList = await UserWordProgressModel.find({
    userId: userObjectId,
  }).lean();

  // Fetch user's expertise level from User schema
  let userExpertiseLevel: number | null = null;
  const progressWordIds = progressList.map((p: any) => p.wordId);
  const userDoc = await UserModel.findById(userObjectId).lean();
  if (userDoc && typeof (userDoc as any).expertise_lvl === "number") {
    userExpertiseLevel = (userDoc as any).expertise_lvl;
  }

  // Decide filter mode
  const hasExplicitFilters = !!category || expertise_lvl !== undefined;

  let wordsPool: WordDoc[] = [];
  if (hasExplicitFilters) {
    // Explicit filters: build pool from category/expertise
    const filter: Record<string, any> = {};
    if (category) filter.category = category;
    if (expertise_lvl !== undefined) filter.expertise_lvl = expertise_lvl;
    wordsPool = (await WordModel.find(filter).lean()) as unknown as WordDoc[];
    // Require minimum pool size of 15
    if (!wordsPool || wordsPool.length < 15) {
      throw new Error("FILTERED_POOL_TOO_SMALL");
    }
  } else {
    // No explicit filters: build pool strictly from user's progress
    if (progressWordIds.length === 0) {
      // No progress yet; send to learning page
      throw new Error("INSUFFICIENT_PROGRESS_POOL");
    }
    wordsPool = (await WordModel.find({
      _id: { $in: progressWordIds },
    }).lean()) as unknown as WordDoc[];
    if (!wordsPool || wordsPool.length < 15) {
      // Not enough words reviewed/learned; send to learning page
      throw new Error("INSUFFICIENT_PROGRESS_POOL");
    }
  }
  // Shuffle for randomness
  wordsPool = shuffle(wordsPool);
  const knownIds = new Set<string>(
    progressList.map((p: any) => String(p.wordId))
  );
  const learnedNotReviewedIds = new Set<string>(
    progressList
      .filter((p: any) => (p.attempts ?? 0) === 0)
      .map((p: any) => String(p.wordId))
  );
  const now = new Date();
  const srsReviewIds = new Set<string>(
    progressList
      .filter(
        (p: any) => (p.attempts ?? 0) > 0 && new Date(p.nextReviewAt) <= now
      )
      .map((p: any) => String(p.wordId))
  );

  // Create candidate pools constrained to available words in wordsPool
  const learnedNotReviewedPool = wordsPool.filter((w) =>
    learnedNotReviewedIds.has(String(w._id))
  );
  const srsReviewPool = wordsPool.filter((w) =>
    srsReviewIds.has(String(w._id))
  );

  // Build new word pool
  let newPool: WordDoc[];
  if (hasExplicitFilters) {
    // Respect explicit filters: new words must match filter and be unknown
    newPool = wordsPool.filter((w) => !knownIds.has(String(w._id)));
  } else {
    // No explicit filters: new words at or below user's level and unknown
    const levelFilter: Record<string, any> = {};
    if (userExpertiseLevel !== null) {
      levelFilter.expertise_lvl = { $lte: userExpertiseLevel };
    }
    const potentialNew = (await WordModel.find(
      levelFilter
    ).lean()) as unknown as WordDoc[];
    newPool = shuffle(potentialNew.filter((w) => !knownIds.has(String(w._id))));
  }

  const hasSrsDue = srsReviewPool.length > 0;
  const hasLearnedNotReviewed = learnedNotReviewedPool.length > 0;

  const seen = new Set<string>();
  const pickUniqueWords = (arr: WordDoc[], max: number) => {
    const picked: WordDoc[] = [];
    for (const w of arr) {
      if (picked.length >= max) break;
      if (seen.has(String(w._id))) continue;
      picked.push(w);
      seen.add(String(w._id));
    }
    return picked;
  };

  const fillRemainder = (
    target: number,
    selectedSoFar: WordDoc[],
    poolsInPriority: Array<WordDoc[]>
  ): WordDoc[] => {
    for (const pool of poolsInPriority) {
      if (selectedSoFar.length >= target) break;
      const need = target - selectedSoFar.length;
      const add = pickUniqueWords(pool, need);
      selectedSoFar = [...selectedSoFar, ...add];
    }
    if (selectedSoFar.length < target) {
      const anyPool = shuffle(wordsPool);
      const need = target - selectedSoFar.length;
      const add = pickUniqueWords(anyPool, need);
      selectedSoFar = [...selectedSoFar, ...add];
    }
    return selectedSoFar;
  };

  let selected: WordDoc[] = [];

  if (hasSrsDue && hasLearnedNotReviewed) {
    // Both present: 50% learned-not-reviewed, 30% SRS due, 20% new
    const learnedCap = Math.max(0, Math.floor(effectiveCount * 0.5));
    const srsCap = Math.max(0, Math.floor(effectiveCount * 0.3));
    const newCap = Math.max(0, effectiveCount - learnedCap - srsCap);

    const learnedWords = pickUniqueWords(learnedNotReviewedPool, learnedCap);
    const srsWords = pickUniqueWords(srsReviewPool, srsCap);
    const newWords = pickUniqueWords(newPool, newCap);
    selected = [...learnedWords, ...srsWords, ...newWords];

    selected = fillRemainder(effectiveCount, selected, [
      learnedNotReviewedPool,
      srsReviewPool,
      newPool,
    ]);
  } else if (hasLearnedNotReviewed) {
    // No SRS due: 80% learned-not-reviewed, 20% new
    const learnedCap = Math.max(0, Math.floor(effectiveCount * 0.8));
    const newCap = Math.max(0, effectiveCount - learnedCap);
    const learnedWords = pickUniqueWords(learnedNotReviewedPool, learnedCap);
    const newWords = pickUniqueWords(newPool, newCap);
    selected = [...learnedWords, ...newWords];

    selected = fillRemainder(effectiveCount, selected, [
      learnedNotReviewedPool,
      newPool,
    ]);
  } else if (hasSrsDue) {
    // Only SRS due: 80% SRS, 20% new
    const srsCap = Math.max(0, Math.floor(effectiveCount * 0.8));
    const newCap = Math.max(0, effectiveCount - srsCap);
    const srsWords = pickUniqueWords(srsReviewPool, srsCap);
    const newWords = pickUniqueWords(newPool, newCap);
    selected = [...srsWords, ...newWords];

    selected = fillRemainder(effectiveCount, selected, [
      srsReviewPool,
      newPool,
    ]);
  } else {
    // Neither learned nor SRS present: redirect to learning page
    throw new Error("INSUFFICIENT_PROGRESS_POOL");
  }

  // Build question objects
  const questions: SessionQuestion[] = selected.map((word, idx) => {
    const distractors = pickDistractors(
      wordsPool,
      String(word._id),
      3,
      word.category
    );
    const options = shuffle([word.nepali_meaning, ...distractors]);
    return {
      id: (idx + 1).toString(),
      wordId: String(word._id),
      question: word.newari_word,
      sub_question: undefined,
      category: word.category,
      difficulty_lvl: word.expertise_lvl,
      correct_answer: word.nepali_meaning,
      options,
    };
  });

  return questions;
};

import { Word as WordModel } from "../models/word.model";

export interface Word {
  id: string;
  newari_word: string;
  nepali_meaning: string;
  category: string;
  expertise_lvl: number;
  type: string;
}

interface SearchQuery {
  category?: string;
  expertise_lvl?: number;
  count?: number;
}

// Words are fetched from MongoDB via the Word model

export const searchDataWord = async ({
  category,
  expertise_lvl,
  count = 10, // default
}: SearchQuery): Promise<Word[]> => {
  // Build aggregation pipeline for random sampling
  const pipeline: Record<string, any>[] = [];

  const match: Record<string, any> = {};
  if (category) match.category = category;
  if (expertise_lvl !== undefined) match.expertise_lvl = expertise_lvl;
  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  // Randomly sample documents
  pipeline.push({ $sample: { size: count } });

  const words = await (WordModel as any).aggregate(pipeline);
  return words as Word[];
};

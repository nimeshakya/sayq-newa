import { Word as WordModel } from "../models/word.model";

export interface Question {
  id: string;
  question: string;
  wordId: string;
  sub_question: string | undefined;
  difficulty_lvl?: number | undefined;
  correct_answer: string;
  category: string;
  options: string[];
}

export interface Word {
  _id: any; // MongoDB ObjectId
  id?: string; // custom reference ID if present
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

// Words are now fetched directly from MongoDB via the Word model

const shuffleArray = <T>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const pickRandomMeanings = (
  pool: Word[],
  excludeId: string,
  amount: number,
  category: string
): string[] => {
  const getIdStr = (w: Word) => String(w._id);

  const primary = pool.filter(
    (word) => getIdStr(word) !== excludeId && word.category === category
  );

  const extras = pool.filter(
    (word) => getIdStr(word) !== excludeId && word.category !== category
  );

  const ordered = [...shuffleArray(primary), ...shuffleArray(extras)];

  return ordered.slice(0, amount).map((word) => word.nepali_meaning);
};

export const createQuestion = async ({
  category,
  expertise_lvl,
  count = 10,
}: SearchQuery): Promise<Question[]> => {
  // Build filter for MongoDB
  const filter: Record<string, any> = {};
  if (category) filter.category = category;
  if (expertise_lvl !== undefined) filter.expertise_lvl = expertise_lvl;

  // Fetch words from MongoDB; fallback to all words if filtered is empty
  let questionPool: Word[] = (await WordModel.find(
    filter
  ).lean()) as unknown as Word[];
  if (!questionPool || questionPool.length === 0) {
    questionPool = (await WordModel.find({}).lean()) as unknown as Word[];
  }

  const selected = shuffleArray(questionPool).slice(0, count);

  return selected.map((word, index) => {
    const distractors = pickRandomMeanings(
      questionPool,
      String((word as Word)._id),
      3,
      word.category
    );
    const options = shuffleArray([word.nepali_meaning, ...distractors]);

    return {
      id: (index + 1).toString(),
      wordId: String((word as Word)._id),
      question: word.newari_word,
      sub_question: undefined,
      category: word.category,
      difficulty_lvl: word.expertise_lvl,
      correct_answer: word.nepali_meaning,
      options,
    };
  });
};

import fs from "fs";
import path from "path";

export interface Question {
  id: string;
  question: string;
  sub_question: string | undefined;
  difficulty_lvl?: number | undefined;
  correct_answer: string;
  category: string;
  options: string[];
}

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

const DATA_PATH = path.resolve(process.cwd(), "..", "data", "data.json");

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
  const primary = pool.filter(
    (word) => word.id !== excludeId && word.category === category
  );

  const extras = pool.filter(
    (word) => word.id !== excludeId && word.category !== category
  );

  const ordered = [...shuffleArray(primary), ...shuffleArray(extras)];

  return ordered.slice(0, amount).map((word) => word.nepali_meaning);
};

export const createQuestion = ({
  category,
  expertise_lvl,
  count = 10,
}: SearchQuery): Question[] => {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  const words: Word[] = JSON.parse(raw);

  let filtered = words;

  if (category) {
    filtered = filtered.filter((w) => w.category === category);
  }

  if (expertise_lvl !== undefined) {
    filtered = filtered.filter((w) => w.expertise_lvl === expertise_lvl);
  }

  const questionPool = filtered.length > 0 ? filtered : words;
  const selected = shuffleArray(questionPool).slice(0, count);

  return selected.map((word, index) => {
    const distractors = pickRandomMeanings(
      questionPool,
      word.id,
      3,
      word.category
    );
    const options = shuffleArray([word.nepali_meaning, ...distractors]);

    return {
      id: (index + 1).toString(),
      question: word.newari_word,
      sub_question: undefined,
      category: word.category,
      difficulty_lvl: word.expertise_lvl,
      correct_answer: word.nepali_meaning,
      options,
    };
  });
};

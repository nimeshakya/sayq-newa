import fs from "fs";
import path from "path";

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

export const searchDataWord = ({
  category,
  expertise_lvl,
  count = 10, // ✅ default
}: SearchQuery): Word[] => {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  const words: Word[] = JSON.parse(raw);

  let result = words;

  // ✅ filter only if provided
  if (category) {
    result = result.filter((w) => w.category === category);
  }

  if (expertise_lvl !== undefined) {
    result = result.filter((w) => w.expertise_lvl === expertise_lvl);
  }

  // ✅ limit result count
  return result.slice(0, count);
};

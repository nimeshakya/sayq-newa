import React, { createContext, useContext, useState } from "react";
import { BACKEND_API } from "../constants";

/* ================= TYPES ================= */

type WordProp = {
  id: string; // ✅ fixed
  newari_word: string;
  nepali_meaning: string;
  category: string;
  expertise_lvl: number;
  type: string;
};

type FetchWordsOptions = {
  category?: string;
  expertise_lvl?: number;
  count?: number;
};

type WordContextType = {
  words: WordProp[];
  fetchWords: (options?: FetchWordsOptions) => Promise<void>;
  resetWords: () => void;
};

/* ================= CONTEXT ================= */

const WordContext = createContext<WordContextType | undefined>(undefined);

export const WordProvider = ({ children }: { children: React.ReactNode }) => {
  const [words, setWords] = useState<WordProp[]>([]);

  const resetWords = () => {
    setWords([]);
  };

  const fetchWords = async (options: FetchWordsOptions = {}): Promise<void> => {
    const query = new URLSearchParams();

    if (options.category) {
      query.append("category", options.category);
    }

    if (options.expertise_lvl !== undefined) {
      query.append("expertise_lvl", options.expertise_lvl.toString());
    }

    if (options.count) {
      query.append("count", options.count.toString());
    }

    const res = await fetch(`${BACKEND_API}/words?${query.toString()}`);

    if (!res.ok) {
      console.error("Failed to fetch words");
      throw new Error("Failed to fetch words");
    }

    const data: WordProp[] = await res.json();
    setWords(data); // ✅ update context state
  };

  return (
    <WordContext.Provider
      value={{
        words,
        fetchWords,
        resetWords,
      }}
    >
      {children}
    </WordContext.Provider>
  );
};

/* ================= HOOK ================= */

export const useWordContext = () => {
  const context = useContext(WordContext);
  if (!context) {
    throw new Error("useWordContext must be used inside WordProvider");
  }
  return context;
};

import React, { createContext, useContext, useState } from "react";

type WordProp = {
  id: number;
  newari_word: string;
  nepali_meaning: string;
  category: string;
  expertise_lvl: number;
  type: string;
};

type WordContextType = {
  words: WordProp[];
  setWords: React.Dispatch<React.SetStateAction<WordProp[]>>;
  ResetWords: () => void;
  fetchRandomWords: (options?: {
    category?: string;
    level?: number;
    count?: number;
  }) => Promise<void>;
};

const WordContext = createContext<WordContextType | undefined>(undefined);

export const WordProvider = ({ children }: { children: React.ReactNode }) => {
  const [words, setWords] = useState<WordProp[]>([]);

  const ResetWords = () => {
    setWords([]);
  };

  const fetchRandomWords = async (options?: {
    category?: string;
    level?: number;
    count?: number;
  }) => {
    try {
      const response = await fetch("/data.json");
      if (!response.ok) throw new Error("Failed to fetch data.json");

      let allData: WordProp[] = await response.json();

      // Filter by category
      if (options?.category) {
        allData = allData.filter(
          (word) =>
            word.category.toLowerCase() === options.category?.toLowerCase()
        );
      }

      // Filter by level (numeric)
      if (options?.level !== undefined) {
        allData = allData.filter(
          (word) => word.expertise_lvl === options.level
        );
      }

      // Shuffle and get N random items
      const shuffled = allData.sort(() => Math.random() - 0.5);
      const count = options?.count || allData.length;
      const selected = shuffled.slice(0, count);

      setWords(selected);
    } catch (err) {
      console.error("Error fetching words:", err);
    }
  };

  return (
    <WordContext.Provider
      value={{
        words,
        setWords,
        ResetWords,
        fetchRandomWords,
      }}
    >
      {children}
    </WordContext.Provider>
  );
};

export const useWordContext = () => {
  const context = useContext(WordContext);
  if (!context) {
    throw new Error("useWordContext must be used inside WordProvider");
  }
  return context;
};

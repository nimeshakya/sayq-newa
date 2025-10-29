import { createContext, useContext } from "react";
import React from "react";
import { useState } from "react";

type TestType = {
  id: string;
  question: string;
  answers: string[];
  correct: string;
  difficulty_lvl?: string;
  category?: string;
  marks?: number;
};

type ResultType = {
  id: string;
  selected: string;
  attempts?: number;
  responseTime?: string;
  isCorrect?: boolean;
};

type MCQContextType = {
  test: TestType[];
  results: ResultType[];
  scores: number;

  setResults: React.Dispatch<React.SetStateAction<ResultType[]>>;
  setTest: React.Dispatch<React.SetStateAction<TestType[]>>;
  setScores: React.Dispatch<React.SetStateAction<number>>;

  clearTest: () => void;
};

export const MCQContext = createContext<MCQContextType | undefined>(undefined);

export const MCQProvider = ({ children }: { children: React.ReactNode }) => {
  const [test, setTest] = useState<TestType[]>([]);
  const [results, setResults] = useState<ResultType[]>([]);
  const [scores, setScores] = useState<number>(0);

  const clearTest = () => {
    setTest([]);
    setResults([]);
    setScores(0);
  };

  return (
    <MCQContext.Provider
      value={{
        test,
        results,
        scores,

        setTest,
        setResults,
        setScores,

        clearTest,
      }}
    >
      {children}
    </MCQContext.Provider>
  );
};

export const useMCQContext = () => {
  const context = useContext(MCQContext);
  if (!context) {
    throw new Error("useMCQContext must be used inside MCQProvider");
  }
  return context;
};

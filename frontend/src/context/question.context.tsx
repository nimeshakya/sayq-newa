import React, { createContext, useContext, useState } from "react";
import { API_BASE_URL } from "../constants";

type QuestionProp = {
  id: string;
  wordId: string;
  question: string;
  sub_question?: string | undefined;
  category?: string | undefined;
  difficulty_lvl?: number | undefined;
  correct_answer: string;
  options: string[];
};
type ResultProp = {
  id: string;
  userID: string;
  questionID: string;
  wordID: string;
  difficulty_lvl?: number | undefined;
  selected_answer: string;
  attempts: number;
  responseTime: number;
  isCorrect: boolean;
};

type FetchQuestionProps = {
  category?: string;
  expertise_lvl?: number;
  count?: number;
};

type QuestionContextType = {
  setQuestions: React.Dispatch<React.SetStateAction<QuestionProp[]>>;
  setResults: React.Dispatch<React.SetStateAction<ResultProp[]>>;
  ResetQuestions: () => void;
  ResetResult: () => void;

  FetchQuestion: (params: FetchQuestionProps) => Promise<void>;

  Questions: QuestionProp[];
  Results: ResultProp[];
};

const QuestionContext = createContext<QuestionContextType | undefined>(
  undefined
);

export const QuestionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [Questions, setQuestions] = useState<QuestionProp[]>([]);
  const [Results, setResults] = useState<ResultProp[]>([]);

  const ResetResult = () => {
    setResults([]);
  };
  const ResetQuestions = () => {
    setQuestions([]);
  };

  const FetchQuestion = async (
    params: FetchQuestionProps = {}
  ): Promise<void> => {
    const query = new URLSearchParams();

    if (params.category) {
      query.append("category", params.category);
    }

    if (params.expertise_lvl !== undefined) {
      query.append("expertise_lvl", params.expertise_lvl.toString());
    }

    if (params.count) {
      query.append("count", params.count.toString());
    }

    const res = await fetch(`${API_BASE_URL}/questions?${query.toString()}`);

    if (!res.ok) {
      console.error("Failed to fetch words");
      throw new Error("Failed to fetch words");
    }

    const data: QuestionProp[] = await res.json();
    setQuestions(data); // ✅ update context state
  };

  return (
    <QuestionContext.Provider
      value={{
        Questions,
        Results,

        setQuestions,
        setResults,

        FetchQuestion,

        ResetQuestions,
        ResetResult,
      }}
    >
      {children}
    </QuestionContext.Provider>
  );
};

export const useQuestionContext = () => {
  const context = useContext(QuestionContext);
  if (!context) {
    throw new Error("useQuestionContext must be used inside QuestionProvider");
  }
  return context;
};

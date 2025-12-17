import React, { createContext, useContext, useState } from "react";

type QuestionProp = {
  id: number;
  question: string;
  sub_question: string | undefined;
  difficulty_lvl?: number | undefined;
  correct_answer: string;
  options: string[];
};
type ResultProp = {
  id: number;
  userID: string;
  questionID: string;
  difficulty_lvl?: number | undefined;
  selected_answer: string;
  attempts: number;
  responseTime: number;
  isCorrect: boolean;
};

type QuestionContextType = {
  setQuestions: React.Dispatch<React.SetStateAction<QuestionProp[]>>;
  setResults: React.Dispatch<React.SetStateAction<ResultProp[]>>;
  ResetQuestions: () => void;
  ResetResult: () => void;

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

  return (
    <QuestionContext.Provider
      value={{
        Questions,
        Results,

        setQuestions,
        setResults,

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

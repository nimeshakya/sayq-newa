import "../styles/_shared.scss";
import "../styles/question.style.scss";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TimeTracker from "./timer.component";
import { useQuestionContext } from "../context/question.context";

import { API_BASE_URL } from "../constants";

import { useUserContext } from "../context/user.context";
import type { ResultProp } from "../context/question.context";

interface QuestionProps {
  category?: string; // e.g., "animals", "food"
  expertise_lvl?: number; // e.g., "beginner", "intermediate", "advanced"
  count?: number; // e.g., 10
  headingDisplay?: string;
}

export default function Question({
  category,
  expertise_lvl,
  count,
  headingDisplay,
}: QuestionProps) {
  const { Questions, Results, setResults, ResetResult, FetchQuestion } =
    useQuestionContext();
  const { user } = useUserContext();
  const navigate = useNavigate();

  useEffect(() => {
    // Only fetch if session inputs are provided; otherwise assume preloaded questions
    if (
      category !== undefined ||
      expertise_lvl !== undefined ||
      count !== undefined
    ) {
      FetchQuestion({
        category,
        expertise_lvl,
        count,
      });
    }
  }, [category, expertise_lvl, count]);

  useEffect(() => {
    ResetResult();
  }, []);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const currentQuestion = Questions[currentIndex];
  const isLastQuestion = currentIndex === Questions.length - 1;

  //for response time
  const [reset, setReset] = useState<boolean>(false);
  const [response, setResponse] = useState<number>(0);

  //for saving user test result
  const saveResult = async (resultsToSave: any[]) => {
    await fetch(`${API_BASE_URL}/user-stat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resultsToSave),
    });
    console.log("save request sent");
  };

  // also save per-word progress to userWordProgress
  const saveWordProgress = async (resultsToSave: any[]) => {
    try {
      const requests = resultsToSave.map((r) =>
        fetch(`${API_BASE_URL}/word-progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: r.userID,
            wordId: r.wordID,
            isCorrect: r.isCorrect,
            responseTime: r.responseTime,
          }),
        })
      );
      await Promise.all(requests);
      console.log("word progress saved");
    } catch (e) {
      console.error("failed to save word progress", e);
    }
  };

  const handleAnswerSelect = (option: string) => {
    console.log(option);
    setSelectedAnswer(option);
  };

  const handleNextQuestion = async () => {
    if (selectedAnswer === null) {
      alert("Please select an answer before proceeding");
      return;
    }

    // Ensure we have a valid user id
    const userId = user?.id;
    if (!userId) {
      alert("You are not signed in. Please sign in to continue.");
      return;
    }

    //for tracking response time
    setReset(true);
    // turn reset off immediately
    setTimeout(() => setReset(false), 0);

    // Store the answer in Results context
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;

    const newResult: ResultProp = {
      id: (Results.length + 1).toString(),
      userID: userId,
      questionID: String(currentQuestion.id),
      wordID: currentQuestion.wordId,
      difficulty_lvl: currentQuestion.difficulty_lvl ?? 0,
      selected_answer: selectedAnswer,
      attempts: 1,
      responseTime: response,
      isCorrect,
      createdAt: new Date().toISOString(),
    };

    if (!isLastQuestion) {
      setResults([...Results, newResult]);
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
    } else {
      // Handle quiz completion - pass updated results directly
      const finalResults = [...Results, newResult];
      alert("Quiz completed!");
      console.log("Final Results:", finalResults);
      // Save results and progress
      await saveResult(finalResults);
      await saveWordProgress(finalResults);
      navigate("/dashboard");
    }
  };

  if (Questions.length === 0) {
    return <div className="questionContainer">No questions available</div>;
  }

  return (
    <div className="questionContainer">
      <div className="modelType">{headingDisplay}</div>
      <div className="questionProgress">
        <div>
          USER ID: {user?.id}
          Name:{user?.given_name}
        </div>
        Question {currentIndex + 1} of {Questions.length}
        <br /> Category:
        {currentQuestion.category}
        <br />
        difficulty_lvl:{currentQuestion.difficulty_lvl}
        <TimeTracker reset={reset} trackedTime={setResponse} />
      </div>
      {currentQuestion && (
        <div className="questionGroup">
          <div className="question">
            {currentQuestion.id}. {currentQuestion.question}
          </div>
          <div className="sub-question">{currentQuestion.sub_question}</div>
          <div className="optionContainer">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              return (
                <div
                  className={`option ${isSelected ? "selected" : ""}`}
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                >
                  {option}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <button className="button" onClick={handleNextQuestion}>
        {isLastQuestion ? "Submit" : "Next"}
      </button>
    </div>
  );
}

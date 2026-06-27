import "../styles/_shared.scss";
import "../styles/question.style.scss";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuestionContext } from "../context/question.context";

import { BACKEND_API } from "../constants";

import { useUserContext } from "../context/user.context";
import type { ResultProp } from "../context/question.context";
import CircularTimer from "./timer.component";
import Toast from "./common/Toast";
import type { ToastType } from "./common/Toast";

interface QuestionProps {
  category?: string;
  expertise_lvl?: number;
  count?: number;
  headingDisplay?: string;
}

export default function Question({
  category,
  expertise_lvl,
  count,
}: QuestionProps) {
  const { Questions, Results, setResults, ResetResult, FetchQuestion } =
    useQuestionContext();
  const [quizCompleted, setQuizCompleted] = useState(false);
  const { user } = useUserContext();
  const navigate = useNavigate();

  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  useEffect(() => {
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

  const [reset, setReset] = useState<boolean>(false);
  const [response, setResponse] = useState<number>(0);

  //for viewing result
  const [score, setScore] = useState<number>(0);

  const saveResult = async (resultsToSave: any[]) => {
    try {
      const res = await fetch(`${BACKEND_API}/user-stat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resultsToSave),
      });
      if (res.ok) console.log("save request sent");
    } catch (e) {
      console.error("Error saving result:", e);
    }
  };

  const saveWordProgress = async (resultsToSave: any[]) => {
    try {
      const requests = resultsToSave.map((r) =>
        fetch(`${BACKEND_API}/word-progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: r.userID,
            wordId: r.wordID,
            isCorrect: r.isCorrect,
            responseTime: r.responseTime,
          }),
        }),
      );
      await Promise.all(requests);
      console.log("word progress saved");
    } catch (e) {
      console.error("failed to save word progress", e);
    }
  };

  const handleAnswerSelect = (option: string) => {
    setSelectedAnswer(option);
  };

  const handleNextQuestion = async () => {
    if (selectedAnswer === null) {
      setToast({
        message: "Please select an answer before proceeding",
        type: "warning",
      });
      return;
    }

    const userId = user?.id;
    if (!userId) {
      setToast({
        message: "You are not signed in. Please sign in to continue.",
        type: "error",
      });
      return;
    }

    setReset(true);
    setTimeout(() => setReset(false), 0);

    const isCorrect = selectedAnswer === currentQuestion.correct_answer;

    if (isCorrect) {
      setScore((prevScore) => prevScore + 1);
    }

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
      const finalResults = [...Results, newResult];
      setResults(finalResults);
      setQuizCompleted(true); // <-- show completion screen
      await saveResult(finalResults);
      await saveWordProgress(finalResults);
    }
  };

  if (Questions.length === 0) {
    return (
      <div className="questionContainer">
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No Questions Available</h3>
          <p>Please try again later or select different options.</p>
          <button className="button proceed" onClick={() => navigate("/")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="questionContainer">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {/* Header Section */}
      <div className="quiz-header">
        {/* <div className="header-content">
          <h2 className="quiz-title">{headingDisplay}</h2>
          <CircularTimer
            reset={reset}
            trackedTime={setResponse}
            maxTime={300}
          />
        </div> */}

        {/* Progress Bar */}
        {/* <div className="progress-section">
          <div className="progress-info">
            <span className="progress-text">
              Question {currentIndex + 1} of {Questions.length}
            </span>
            <span className="progress-percentage">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div> */}

        {/* User & Question Info */}
        <div className="info-badges">
          {/* <div className="info-badge">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {user?.given_name || "User"}
          </div> */}

          <div className="info-badge">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            {currentQuestion.category}
          </div>

          <div className="info-badge difficulty">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Level {currentQuestion.difficulty_lvl}
          </div>
        </div>
      </div>
      {/* Question Card */}
      <div className="question-card">
        <div className="question-card-inner">
          {/* Question Header */}
          <div
            className="question-main-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div className="question-number-text">
              <div className="question-number">
                Question {currentQuestion.id}
              </div>
              <h3 className="question-text">{currentQuestion.question}</h3>
              {currentQuestion.sub_question && (
                <p className="sub-question">{currentQuestion.sub_question}</p>
              )}
            </div>

            {/* Timer in the right corner */}
            <div className="question-timer">
              <CircularTimer
                reset={reset}
                trackedTime={setResponse}
                maxTime={300}
              />
            </div>
          </div>

          {/* Options */}
          <div className="options-grid">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const optionLetter = String.fromCharCode(65 + index); // A, B, C, D

              return (
                <button
                  className={`option-card ${isSelected ? "selected" : ""}`}
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                >
                  <div className="option-letter">{optionLetter}</div>
                  <div className="option-text">{option}</div>
                  <div className="option-check">
                    {isSelected && (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Submit Button */}
          <button
            className={`submit-button ${!selectedAnswer ? "disabled" : ""}`}
            onClick={handleNextQuestion}
            disabled={!selectedAnswer}
          >
            {isLastQuestion ? (
              <>
                Submit Quiz
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </>
            ) : (
              <>
                Next Question
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
      {/* Question Dots */}
      <div className="question-dots">
        {Questions.slice(0, Math.min(15, Questions.length)).map((_, idx) => (
          <div
            key={idx}
            className={`dot ${idx === currentIndex ? "active" : ""} ${
              idx < currentIndex ? "completed" : ""
            }`}
          />
        ))}
        {Questions.length > 15 && (
          <span className="dots-more">+{Questions.length - 15}</span>
        )}
      </div>
      {/* {quizCompleted && (
        <div className="quiz-completed-overlay">
          <div className="completion-card">
            <div className="confetti">🎉🎊✨</div>
            <h2>Congratulations, {user?.given_name || "User"}!</h2>
            <p>You have successfully completed the quiz.</p>
            <p>
              Your Score: {score}/{currentIndex + 1}
            </p>

            <button className="button dashboard" onClick={() => navigate("/")}>
              Back to Dashboard
            </button>
          </div>
        </div>
      )} */}
      {quizCompleted && (
        <div className="quiz-completed-overlay">
          <div className="completion-card">
            <div className="success-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M8 12.5l2.5 2.5 5.5-5.5"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h2>Quiz Completed!</h2>

            <div className="score-display">
              <div className="score-number">
                {score}/{currentIndex + 1}
              </div>
              <div className="score-label">Correct Answers</div>
            </div>

            <div className="score-percentage">
              {Math.round((score / (currentIndex + 1)) * 100)}% Accuracy
            </div>

            <button className="button dashboard" onClick={() => navigate("/")}>
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import "../styles/_shared.scss";
import "../styles/question.style.scss";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TimeTracker from "./timer.component";
import { useQuestionContext } from "../context/question.context";

interface QuestionProps {
  model_type: string;
}

export default function Question({ model_type }: QuestionProps) {
  const { Questions, Results, setResults, ResetResult } = useQuestionContext();
  const navigate = useNavigate();

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

  const handleAnswerSelect = (option: string) => {
    console.log(option);
    setSelectedAnswer(option);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) {
      alert("Please select an answer before proceeding");
      return;
    }

    //for tracking response time
    setReset(true);
    // turn reset off immediately
    setTimeout(() => setReset(false), 0);

    // Store the answer in Results context
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    const newResult = {
      id: Results.length + 1,
      questionID: String(currentQuestion.id),
      selected_answer: selectedAnswer,
      attempts: 1,
      responseTime: response,
      isCorrect: isCorrect,
    };
    setResults([...Results, newResult]);

    if (!isLastQuestion) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
    } else {
      // Handle quiz completion
      alert("Quiz completed!");
      console.log("Final Results:", [...Results, newResult]);
      navigate("/dashboard");
    }
  };

  if (Questions.length === 0) {
    return <div className="questionContainer">No questions available</div>;
  }

  return (
    <div className="questionContainer">
      <div className="modelType">{model_type}</div>
      <div className="questionProgress">
        Question {currentIndex + 1} of {Questions.length}
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

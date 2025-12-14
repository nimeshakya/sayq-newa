import { useEffect } from "react";
import "../styles/question.style.scss";
import { useQuestionContext } from "../context/question.context";
import Question from "../components/questions.components";

export default function InitialQuestion() {
  const { setQuestions } = useQuestionContext();
  const questions = [
    {
      id: 1,
      question: "hellow 1 question?",
      sub_question: undefined,
      correct_answer: "a",
      options: ["a", "s", "d", "f"],
    },
    {
      id: 2,
      question: "hellow  question what bnext?",
      sub_question: undefined,
      correct_answer: "a",
      options: ["a", "s", "d", "f"],
    },
    {
      id: 3,
      question: "hellow  question?",
      sub_question: undefined,
      correct_answer: "a",
      options: ["a", "s", "d", "f"],
    },
    {
      id: 4,
      question: "hellow  question?",
      sub_question: undefined,
      correct_answer: "a",
      options: ["a", "s", "d", "f"],
    },
  ];
  useEffect(() => {
    setQuestions(questions);
  }, []);

  return (
    <div
      style={{
        backgroundColor: "green",
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: " translate(-50%, -50%)",
      }}
    >
      <Question model_type="mcq" />
    </div>
  );
}

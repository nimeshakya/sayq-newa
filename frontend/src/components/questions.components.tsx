import "../styles/_shared.scss";
import "../styles/question.style.scss";

import { useQuestionContext } from "../context/question.context";

interface QuestionProps {
  model_type: string;
}

export default function Question({ model_type }: QuestionProps) {
  const { Questions } = useQuestionContext();
  return (
    <div className="questionContainer">
      {model_type}
      {Questions.map((test) => {
        return (
          <div className="questionGroup" key={test.id}>
            <div className="question">
              {test.id}. {test.question}
            </div>
            <div className="sub-question">{test.sub_question}</div>
            <div className="optionContainer">
              {test.options.map((option, index) => {
                return (
                  <div className="option" key={index}>
                    {option}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <button className="button">Next</button>
    </div>
  );
}

import "../styles/question.style.scss";
import "../styles/_shared.scss";
import Question from "../components/questions.components";

export default function InitialQuestion() {
  return (
    <div className="main-centered-container">
      <Question headingDisplay="mcq" count={4} />
    </div>
  );
}

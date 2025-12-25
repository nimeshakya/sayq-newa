import "../styles/question.style.scss";
import "../styles/_shared.scss";
import MLLearnComponent from "../components/ml-learn.component";

export default function MLLearnPage() {
  return (
    <div>
      <div className="main-centered-container">
        <MLLearnComponent headingDisplay="AI-Recommended Words" count={10} />
      </div>
    </div>
  );
}

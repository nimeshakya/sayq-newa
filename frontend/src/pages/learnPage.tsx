import "../styles/question.style.scss";
import "../styles/_shared.scss";
import DataPrint from "../components/learn.component";

export default function LearnPage() {
  return (
    <div>
      <div className="main-centered-container">
        <DataPrint headingDisplay="Random word" />
      </div>
    </div>
  );
}

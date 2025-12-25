import "../styles/question.style.scss";
import "../styles/_shared.scss";
import RLLearnComponent from "../components/rl-learn.component";

export default function RLLearnPage() {
  return (
    <div>
      <div className="main-centered-container">
        <RLLearnComponent headingDisplay="RL Agent Recommended Words" count={10} />
      </div>
    </div>
  );
}

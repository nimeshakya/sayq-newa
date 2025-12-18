import { useEffect, useState } from "react";
import { useWordContext } from "../context/newariWord.context";
import { useNavigate } from "react-router-dom";

import TimeTracker from "../components/timer.component";

import "../styles/_shared.scss";
import "../styles/learn.style.scss";

interface DataPrintProps {
  category?: string; // e.g., "animals", "food"
  expertise_lvl?: number; // e.g., "beginner", "intermediate", "advanced"
  count?: number; // e.g., 10
  headingDisplay?: string;
}

export default function DataPrint({
  category,
  expertise_lvl,
  count = 10,
  headingDisplay,
}: DataPrintProps) {
  const navigate = useNavigate();

  const { words, fetchWords } = useWordContext();
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    fetchWords({
      category,
      expertise_lvl,
      count,
    });
  }, [category, expertise_lvl, count]);

  if (words.length === 0) {
    return <div>No words found matching criteria</div>;
  }

  //to display words for learning

  const currentWord = words[currentIndex];
  const isLastWord = currentIndex === words.length - 1;

  const handleNext = () => {
    if (!isLastWord) {
      setCurrentIndex(currentIndex + 1);
    } else {
      alert("Done learning for the day");
      navigate("/dashboard");
    }
  };

  const handleBack = () => {
    if (currentIndex !== 0) setCurrentIndex(currentIndex - 1);
  };

  return (
    <div className="dataPrintContainer">
      <h2>{headingDisplay}</h2>
      <TimeTracker />
      <div>
        {currentIndex + 1} of {words.length}
      </div>
      <div className="dataList">
        <div className="dataItem">
          <div className="heading-word">{currentWord.newari_word}</div>
          <div className="section">
            <span className="title-word">Meaning:</span>{" "}
            <span className="section-word">{currentWord.nepali_meaning}</span>
          </div>
          <div className="section">
            <span className="title-word">Category:</span>{" "}
            <span className="section-word">{currentWord.category}</span>
          </div>
          <div hidden={true}>Level: {currentWord.expertise_lvl}</div>
          <div hidden={true}>Type: {currentWord.type}</div>
        </div>
        <div className="dual-button-group">
          <button
            className="button recede"
            onClick={handleBack}
            hidden={currentIndex === 0}
          >
            Back
          </button>
          <button className="button proceed" onClick={handleNext}>
            {isLastWord ? "Complete" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

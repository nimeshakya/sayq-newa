import { useEffect, useState } from "react";
import { useWordContext } from "../context/newariWord.context";
import { useNavigate } from "react-router-dom";

import TimeTracker from "../components/timer.component";

import "../styles/_shared.scss";
import "../styles/learn.style.scss";

import { API_BASE_URL } from "../constants";
import { useUserContext } from "../context/user.context";

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
  const { user } = useUserContext();

  const { words, fetchWords } = useWordContext();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [unlearnedWords, setUnlearnedWords] = useState<typeof words>([]);

  useEffect(() => {
    const loadWords = async () => {
      await fetchWords({
        category,
        expertise_lvl,
        count: count * 3, // Fetch more to account for filtering
      });
    };
    loadWords();
  }, [category, expertise_lvl, count]);

  useEffect(() => {
    const filterLearnedWords = async () => {
      if (!user?.id || words.length === 0) {
        setUnlearnedWords(words);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/word-progress/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          const learnedIds = new Set(
            (data.data || []).map((p: any) => String(p.wordId))
          );
          const filtered = words.filter((w) => !learnedIds.has(w.id));
          setUnlearnedWords(filtered.slice(0, count));
        } else {
          setUnlearnedWords(words.slice(0, count));
        }
      } catch (e) {
        console.error("Failed to fetch learned words", e);
        setUnlearnedWords(words.slice(0, count));
      }
    };
    filterLearnedWords();
  }, [words, user?.id, count]);

  if (unlearnedWords.length === 0) {
    return <div>No new words to learn. Great job!</div>;
  }

  const currentWord = unlearnedWords[currentIndex];
  const isLastWord = currentIndex === unlearnedWords.length - 1;

  const markIntroduced = async () => {
    try {
      if (!user?.id) return;
      await fetch(`${API_BASE_URL}/word-progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          wordId: currentWord._id,
          isCorrect: false,
          responseTime: 0,
        }),
      });
    } catch (e) {
      console.error("Failed to mark word introduced", e);
    }
  };

  const handleNext = async () => {
    // Introduce current word into SRS
    await markIntroduced();

    if (!isLastWord) {
      setCurrentIndex((idx) => idx + 1);
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
        {currentIndex + 1} of {unlearnedWords.length}
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

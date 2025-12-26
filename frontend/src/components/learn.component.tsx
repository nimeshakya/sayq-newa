import { useEffect, useState } from "react";
import { useWordContext } from "../context/newariWord.context";
import { useNavigate } from "react-router-dom";

import TimeTracker from "../components/timer.component";

import "../styles/_shared.scss";
import "../styles/learn.style.scss";

import { API_BASE_URL } from "../constants";
import { useUserContext } from "../context/user.context";

interface DataPrintProps {
  category?: string;
  expertise_lvl?: number;
  count?: number;
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
        count: count * 3,
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
    return (
      <div className="dataPrintContainer">
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <h3>No New Words to Learn</h3>
          <p>You've completed all available words. Great job!</p>
          <button
            className="button proceed"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentWord = unlearnedWords[currentIndex];
  const isLastWord = currentIndex === unlearnedWords.length - 1;
  const progressPercentage = ((currentIndex + 1) / unlearnedWords.length) * 100;

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
    await markIntroduced();

    if (!isLastWord) {
      setCurrentIndex((idx) => idx + 1);
    } else {
      alert("Done learning for the day");
      // navigate("/dashboard");
      navigate("/");
    }
  };

  const handleBack = () => {
    if (currentIndex !== 0) setCurrentIndex(currentIndex - 1);
  };

  return (
    <div className="dataPrintContainer">
      {/* Header Section */}
      <div className="learn-header">
        {/* <div className="header-content">
          <h2 className="learn-title">{headingDisplay}</h2>
        </div> */}

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-info">
            <span className="progress-text">
              Word {currentIndex + 1} of {unlearnedWords.length}
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
        </div>
      </div>

      {/* Word Card */}
      <div className="word-card">
        <div className="word-card-inner">
          {/* Main Word Display */}
          <div className="word-main">
            <div className="word-badge">नेवारी शब्द</div>
            <h1 className="newari-word">{currentWord.newari_word}</h1>
          <TimeTracker />
          </div>

          {/* Word Details */}
          <div className="word-details">
            <div className="detail-item">
              <div className="detail-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="detail-content">
                <span className="detail-label">Meaning</span>
                <span className="detail-value">
                  {currentWord.nepali_meaning}
                </span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className="detail-content">
                <span className="detail-label">Category</span>
                <span className="detail-value category-tag">
                  {currentWord.category}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="navigation-buttons">
            {currentIndex > 0 && (
              <button className="nav-button back-button" onClick={handleBack}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
              </button>
            )}
            <button
              className={`nav-button next-button ${
                currentIndex === 0 ? "full-width" : ""
              }`}
              onClick={handleNext}
            >
              {isLastWord ? "Complete" : "Next"}
              {!isLastWord && (
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
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Word Counter Dots */}
      <div className="word-dots">
        {unlearnedWords
          .slice(0, Math.min(10, unlearnedWords.length))
          .map((_, idx) => (
            <div
              key={idx}
              className={`dot ${idx === currentIndex ? "active" : ""} ${
                idx < currentIndex ? "completed" : ""
              }`}
            />
          ))}
        {unlearnedWords.length > 10 && (
          <span className="dots-more">+{unlearnedWords.length - 10}</span>
        )}
      </div>
    </div>
  );
}

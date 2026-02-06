import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import TimeTracker from "../timer.component";

import "../../styles/_shared.scss";
import "../../styles/learn.style.scss";

import { API_BASE_URL } from "../../constants";
import { useUserContext } from "../../context/user.context";

interface LearnAgentProp {
  headingDisplay?: string;
  questionaries?: any[];
}

export default function LearnAgentComponent({
  headingDisplay,
  questionaries,
}: LearnAgentProp) {
  const navigate = useNavigate();
  const { user } = useUserContext();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [recommendedWords, setRecommendedWords] = useState<any[]>([]);

  useEffect(() => {
    setRecommendedWords(questionaries ?? []);
  }, [questionaries]);

  const currentWord = recommendedWords[currentIndex];
  const isLastWord = currentIndex === recommendedWords.length - 1;
  const expertiseLevel = Math.max(
    1,
    Math.min(5, Number(currentWord?.expertise_lvl) || 1),
  );

  const markIntroduced = async () => {
    if (!user?.id || !currentWord) return;
    try {
      await fetch(`${API_BASE_URL}/userWordProgress/mark-introduced`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          wordId: currentWord._id,
        }),
      });
    } catch (e) {
      console.error("Error marking word introduced:", e);
    }
    if (isLastWord) navigate("/");
    else setCurrentIndex((prev) => prev + 1);
  };

  const markLearned = async () => {
    if (!user?.id || !currentWord) return;
    try {
      await fetch(`${API_BASE_URL}/userWordProgress/mark-learned`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          wordId: currentWord._id,
        }),
      });
    } catch (e) {
      console.error("Error marking word learned:", e);
    }
    if (isLastWord) navigate("/");
    else setCurrentIndex((prev) => prev + 1);
  };

  const markSkipped = () => {
    if (isLastWord) navigate("/");
    else setCurrentIndex((prev) => prev + 1);
  };

  if (!currentWord) {
    return (
      <div className="dataPrintContainer empty-state">
        <p>No recommended words at this time.</p>
        <button
          className="button proceed"
          onClick={() => navigate("/learnPage")}
        >
          Go to Regular Learning
        </button>
      </div>
    );
  }

  return (
    <div className="dataPrintContainer dummy-learn">
      {/* Word Card */}
      <div className="word-card">
        {/* top */}
        <div className="word-main">
          <div className="divider">
            <div className="word-badge ai-badge">{headingDisplay}</div>

            <div className="divide-right">
              <TimeTracker />
            </div>
          </div>
        </div>

        {/* learning word */}
        <div className="newari-word">{currentWord.newari_word}</div>

        {/* bottom */}
        <div className="word-card-inner">
          {/* Word Details */}
          <div className="word-details">
            <div className="detail-item">
              <div className="detail-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="#8B1538"
                  stroke="#fff"
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

            {currentWord.category && (
              <div className="detail-item">
                <div className="detail-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ transform: "translateX(-2px)" }}
                  >
                    <path d="M20 12V7a2 2 0 0 0-2-2h-5L6 12l6 6 7-7a2 2 0 0 0 1-1z" />
                    <circle cx="15" cy="9" r="1" />
                  </svg>
                </div>
                <div className="detail-content">
                  <span className="detail-label">Category</span>
                  <span className="detail-value category-tag">
                    {currentWord.category}
                  </span>
                </div>
              </div>
            )}

            {currentWord.expertise_lvl && (
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
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <div className="detail-content">
                  <span className="detail-label">Difficulty</span>
                  <div className="detail-value difficulty-value">
                    <span className="difficulty-pill">
                      Level {currentWord.expertise_lvl}
                    </span>
                    <div className="difficulty-bars">
                      {Array.from({ length: 5 }, (_, index) => (
                        <span
                          key={index}
                          className={`difficulty-bar ${
                            index < expertiseLevel ? "active" : ""
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="navigation-buttons">
            <button className="nav-button back-button" onClick={markSkipped}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
                <line x1="21" y1="5" x2="21" y2="19" />
              </svg>
              Skip
            </button>
            <button className="nav-button next-button" onClick={markIntroduced}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M2 4h8a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" />
                <path d="M22 4h-8a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h9z" />
              </svg>
              Introduced
            </button>
            <button className="nav-button next-button" onClick={markLearned}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4" />
                <path d="M6 16l6-6 6 6" />
                <path d="M12 10v10" />
              </svg>
              {isLastWord ? "Finish" : "Learned"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

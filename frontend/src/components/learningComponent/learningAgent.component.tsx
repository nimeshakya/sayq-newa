import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import TimeTracker from "../timer.component";

import "../../styles/_shared.scss";
import "../../styles/learn.style.scss";

import { API_BASE_URL } from "../../constants";
import { useUserContext } from "../../context/user.context";
import Toast from "../common/Toast";
import type { ToastType } from "../common/Toast";

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
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

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
      const res = await fetch(`${API_BASE_URL}/userWordProgress/mark-introduced`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          wordId: currentWord._id,
        }),
      });
      if (!res.ok) throw new Error();
    } catch (e) {
      setToast({ message: "Failed to mark word as introduced", type: "error" });
      console.error("Error marking word introduced:", e);
    }
    if (isLastWord) navigate("/");
    else setCurrentIndex((prev) => prev + 1);
  };

  const markLearned = async () => {
    if (!user?.id || !currentWord) return;
    try {
      const res = await fetch(`${API_BASE_URL}/userWordProgress/mark-learned`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          wordId: currentWord._id,
        }),
      });
      if (!res.ok) throw new Error();
    } catch (e) {
      setToast({ message: "Failed to mark word as learned", type: "error" });
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
      <div className="dataPrintContainer learn-container empty-state">
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
    <div className="dataPrintContainer learn-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {/* Word Card */}
      <div className="word-card">
        {/* Header */}
        <div className="word-header">
          <div className="word-badge">{headingDisplay}</div>
          <div className="header-right">
            <TimeTracker />
          </div>
        </div>

        {/* Main Word Display */}
        <div className="word-display-area">
          <h1 className="newari-word">{currentWord.newari_word}</h1>
        </div>

        {/* Inner Content */}
        <div className="word-card-inner">
          {/* Word Details (Compact Grid) */}
          <div className="word-details">
            <div className="detail-item">
              <div className="detail-icon">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
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
              <div className="detail-item category-item">
                <div className="detail-icon">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  </svg>
                </div>
                <div className="detail-content">
                  <span className="detail-label">Category</span>
                  <span className="detail-value">
                    <span className="category-tag">{currentWord.category}</span>
                  </span>
                </div>
              </div>
            )}

            {Boolean(currentWord.expertise_lvl) && (
              <div className="detail-item difficulty-item">
                <div className="detail-icon">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
            <button className="nav-button skip-button" onClick={markSkipped}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
                <line x1="21" y1="5" x2="21" y2="19" />
              </svg>
              Skip
            </button>
            <button className="nav-button introduced-button" onClick={markIntroduced}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              Introduced
            </button>
            <button className="nav-button learned-button" onClick={markLearned}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {isLastWord ? "Finish" : "Learned"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

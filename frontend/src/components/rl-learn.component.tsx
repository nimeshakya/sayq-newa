import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import TimeTracker from "../components/timer.component";

// import "../styles/_shared.scss";
// import "../styles/learn.style.scss";
// import "../styles/ss.scss";
import { API_BASE_URL } from "../constants";
import { useUserContext } from "../context/user.context";

interface RLLearnProps {
  count?: number;
  headingDisplay?: string;
}

export default function RLLearnComponent({
  count = 10,
  headingDisplay = "RL Agent Recommended Words",
}: RLLearnProps) {
  const navigate = useNavigate();
  const { user } = useUserContext();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [recommendedWords, setRecommendedWords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchRLRecommendations = async () => {
      if (!user?.id) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(
          `${API_BASE_URL}/rl/dqn-recommend?userId=${user.id}&k=${count}`
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch`);

        const data = await res.json();
        const recommended = data.recommendations || [];

        if (recommended.length === 0) {
          setError("No RL recommended words available");
          setRecommendedWords([]);
        } else {
          setRecommendedWords(recommended);
          setError("");
        }
      } catch (e) {
        console.error("Error fetching RL recommendations:", e);
        setError(`Failed to load RL recommendations: ${(e as Error).message}`);
        setRecommendedWords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRLRecommendations();
  }, [user?.id, count]);

  if (loading)
    return (
      <div className="dataPrintContainer empty-state">
        <p>Loading RL agent recommendations...</p>
      </div>
    );

  if (error)
    return (
      <div className="dataPrintContainer empty-state">
        <p>{error}</p>
        <button
          className="button proceed"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    );

  if (recommendedWords.length === 0)
    return (
      <div className="dataPrintContainer empty-state">
        <p>No RL recommended words at this time.</p>
        <button
          className="button proceed"
          onClick={() => navigate("/mlLearnPage")}
        >
          Go to ML Learning
        </button>
      </div>
    );

  const currentWord = recommendedWords[currentIndex];
  const isLastWord = currentIndex === recommendedWords.length - 1;
  const progressPercentage =
    ((currentIndex + 1) / recommendedWords.length) * 100;

  const markWord = async (type: "introduced" | "learned") => {
    if (!user?.id) return;

    try {
      await fetch(`${API_BASE_URL}/userWordProgress/mark-${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, wordId: currentWord._id }),
      });
    } catch (e) {
      console.error(`Error marking word ${type}:`, e);
    }

    if (isLastWord) {
      navigate("/dashboard");
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const skipWord = () => {
    if (isLastWord) navigate("/dashboard");
    else setCurrentIndex((prev) => prev + 1);
  };

  return (
    <div className="dataPrintContainer">
      {/* Header */}
      <div className="learn-header">
        <div className="header-content">
          <h2 className="learn-title">{headingDisplay}</h2>
          <TimeTracker />
        </div>

        <div className="progress-section">
          <div className="progress-info">
            <span className="progress-text">
              Word {currentIndex + 1} of {recommendedWords.length}
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
          <div className="word-main">
            <div
              className="word-badge"
              style={{ background: "#8b0038", color: "#fff" }}
            >
               DQN RL Agent
            </div>
            <h1 className="newari-word">{currentWord.newari_word}</h1>
          </div>

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

            {currentWord.category && (
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
            )}

            {currentWord.expertise_lvl && (
              <div className="detail-item">
                <div className="detail-icon">⚡</div>
                <div className="detail-content">
                  <span className="detail-label">Difficulty</span>
                  <span className="detail-value">
                    Level {currentWord.expertise_lvl}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="navigation-buttons">
            <button className="nav-button back-button" onClick={skipWord}>
              Skip
            </button>
            <button
              className="nav-button next-button"
              onClick={() => markWord("introduced")}
            >
              Introduced
            </button>
            <button
              className="nav-button next-button"
              onClick={() => markWord("learned")}
            >
              {isLastWord ? "Learned & Finish" : "Learned"}
            </button>
          </div>
        </div>
      </div>

      {/* Word Dots */}
      <div className="word-dots">
        {recommendedWords
          .slice(0, Math.min(10, recommendedWords.length))
          .map((_, idx) => (
            <div
              key={idx}
              className={`dot ${idx === currentIndex ? "active" : ""} ${
                idx < currentIndex ? "completed" : ""
              }`}
            />
          ))}
        {recommendedWords.length > 10 && (
          <span className="dots-more">+{recommendedWords.length - 10}</span>
        )}
      </div>
    </div>
  );
}

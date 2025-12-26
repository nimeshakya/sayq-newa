import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import TimeTracker from "../components/timer.component";

import "../styles/_shared.scss";
import "../styles/learn.style.scss";

import { API_BASE_URL } from "../constants";
import { useUserContext } from "../context/user.context";

interface MLLearnProps {
  count?: number;
  headingDisplay?: string;
}

export default function MLLearnComponent({
  count = 10,
  headingDisplay = "AI-Recommended Words",
}: MLLearnProps) {
  const navigate = useNavigate();
  const { user } = useUserContext();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [recommendedWords, setRecommendedWords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchRecommendedWords = async () => {
      if (!user?.id) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(
          `${API_BASE_URL}/rl/recommend?userId=${user.id}&k=${count}`
        );

        if (!res.ok) {
          throw new Error(
            `HTTP ${res.status}: Failed to fetch recommendations`
          );
        }

        const data = await res.json();
        const recommended = data.recommendations || [];

        if (recommended.length === 0) {
          setError("No recommended words available");
          setRecommendedWords([]);
        } else {
          setRecommendedWords(recommended);
          setError("");
        }
      } catch (e) {
        console.error("Error fetching recommendations:", e);
        setError(`Failed to load recommendations: ${(e as Error).message}`);
        setRecommendedWords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedWords();
  }, [user?.id, count]);

  const currentWord = recommendedWords[currentIndex];
  const isLastWord = currentIndex === recommendedWords.length - 1;

  const markIntroduced = async () => {
    if (!user?.id) return;
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
    if (!user?.id) return;
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

  if (loading)
    return (
      <div className="dataPrintContainer empty-state">
        <p>Loading AI-recommended words...</p>
      </div>
    );

  if (error)
    return (
      <div className="dataPrintContainer empty-state">
        <p>{error}</p>
        <button
          className="button proceed"
          onClick={() => navigate("/")}
        >
          Back to Dashboard
        </button>
      </div>
    );

  if (recommendedWords.length === 0)
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

  const progressPercentage =
    ((currentIndex + 1) / recommendedWords.length) * 100;

  return (
    <div className="dataPrintContainer">
      {/* Header */}
      <div className="learn-header">
        {/* <div className="header-content">
          <h2 className="learn-title">{headingDisplay}</h2>
          <TimeTracker />
        </div> */}
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
            <div className="word-badge ai-badge">AI Recommended</div>
            <h1 className="newari-word">{currentWord.newari_word}</h1>
            <TimeTracker />
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
            <button className="nav-button back-button" onClick={markSkipped}>
              Skip
            </button>
            <button className="nav-button next-button" onClick={markIntroduced}>
              Introduced
            </button>
            <button className="nav-button next button" onClick={markLearned}>
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

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
          throw new Error(`HTTP ${res.status}: Failed to fetch recommendations`);
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

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading AI-recommended words...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (recommendedWords.length === 0) {
    return (
      <div className="no-words-container">
        <p>No recommended words at this time.</p>
        <button onClick={() => navigate("/learnPage")}>
          Go to Regular Learning
        </button>
      </div>
    );
  }

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

    if (isLastWord) {
      navigate("/dashboard");
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
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

    if (isLastWord) {
      navigate("/dashboard");
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const markSkipped = () => {
    if (isLastWord) {
      navigate("/dashboard");
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="data-print-container">
      <TimeTracker />

      <div className="word-display-section">
        <h2>{headingDisplay}</h2>
        <p className="progress-indicator">
          {currentIndex + 1} of {recommendedWords.length}
        </p>

        <div className="word-card">
          <div className="newari-word">
            <span className="label">Newari Word:</span>
            <h3>{currentWord.newari_word}</h3>
          </div>

          <div className="english-meaning">
            <span className="label">Meaning:</span>
            <p>{currentWord.nepali_meaning}</p>
          </div>

          {currentWord.category && (
            <div className="category">
              <span className="label">Category:</span>
              <p>{currentWord.category}</p>
            </div>
          )}

          {currentWord.expertise_lvl && (
            <div className="difficulty">
              <span className="label">Difficulty:</span>
              <p>Level {currentWord.expertise_lvl}</p>
            </div>
          )}

          <div className="ai-badge">
            <span>🤖 AI Recommended</span>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn-skip" onClick={markSkipped}>
          Skip
        </button>
        <button className="btn-introduced" onClick={markIntroduced}>
          Introduced
        </button>
        <button className="btn-learned" onClick={markLearned}>
          {isLastWord ? "Learned & Finish" : "Learned"}
        </button>
      </div>
    </div>
  );
}

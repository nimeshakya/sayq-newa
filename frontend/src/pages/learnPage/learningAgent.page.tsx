import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../../context/user.context";
import "../../styles/learn.style.scss";
import "../../styles/_shared.scss";
import LearnAgentComponent from "../../components/learningComponent/learningAgent.component";

import { API_BASE_URL } from "../../constants";

type PageProps = { modelType?: "supervised" | "unsupervised" };

export default function LearnAgentPage({
  modelType = "unsupervised",
}: PageProps) {
  const count = 10;
  const { user } = useUserContext();
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const modelOptions = {
    supervised: `${API_BASE_URL}/rl/recommend?userId=${user?.id}&k=${count}`,
    unsupervised: `${API_BASE_URL}/rl/dqn-recommend?userId=${user?.id}&k=${count}`,
  };

  const URL_link = modelOptions[modelType];

  const [recommendedWords, setRecommendedWords] = useState<any[]>([]);
  const [error, setError] = useState<string>("");

  //   set url
  const url = `${URL_link}`;

  //   fetch the recommended words from ml agent in backend
  useEffect(() => {
    const fetchRecommendedWords = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(
            `HTTP ${res.status}: Failed to fetch recommendations`,
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
  }, [user?.id, count, URL_link]);

  //   api loading
  if (loading)
    return (
      <div className="dataPrintContainer empty-state">
        <p>Loading AI-recommended words...</p>
      </div>
    );

  //   api returns error
  if (error)
    return (
      <div className="dataPrintContainer empty-state">
        <p>{error}</p>
        <button className="button proceed" onClick={() => navigate("/")}>
          Back to Dashboard
        </button>
      </div>
    );

  return (
    <div>
      <div className="main-centered-container">
        <LearnAgentComponent
          headingDisplay={`${modelType}`}
          questionaries={recommendedWords}
        />
      </div>
    </div>
  );
}

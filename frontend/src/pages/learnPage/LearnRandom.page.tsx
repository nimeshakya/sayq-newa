import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/question.style.scss";
import "../../styles/_shared.scss";
import LearnAgentComponent from "../../components/learningComponent/learningAgent.component";
import axios from "axios";
import { API_BASE_URL } from "../../constants";

export default function LearnRandomPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [unLearnedWords, setUnlearnedWords] = useState<any[]>([]);
  const count = 10;
  const url = `${API_BASE_URL}/words/learn`;
  useEffect(() => {
    const fetchLearnWords = async () => {
      try {
        setLoading(true);
        // Fetch filtered words from backend (backend handles mastery filtering)
        const wordsRespond = await axios.get(url, {
          params: {
            count,
          },
          withCredentials: true,
        });
        const fetchedWords = wordsRespond.data;
        console.log("   → Received", fetchedWords.length, "unlearned words");

        // Set the words directly (backend already filtered)
        setUnlearnedWords(fetchedWords);
      } catch (e) {
        console.error("Error fetching words:", e);
        setError(`Failed to load words: ${(e as Error).message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchLearnWords();
  }, []);

  //   api loading
  if (loading)
    return (
      <div className="dataPrintContainer empty-state">
        <p>Loading learning words...</p>
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
          headingDisplay="Learning"
          questionaries={unLearnedWords}
        />
      </div>
    </div>
  );
}

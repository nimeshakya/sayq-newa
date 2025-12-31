import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/user.context";
import SessionComponent from "../components/session.component";
import { API_BASE_URL } from "../constants";
import "../styles/_shared.scss";
import "../styles/session.style.scss";

export default function SessionPage() {
  const navigate = useNavigate();
  const { isLoggedin, loading } = useUserContext();
  const [count, setCount] = useState<number>(10);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState<string>("");
  const [expertise_levels, setExpertise_levels] = useState<number[]>([]);
  const [expertise, setExpertise] = useState<number>(0);
  const [start, setStart] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/words/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchExpertiseLevel = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/words/expertise-level`);
        if (res.ok) {
          const data = await res.json();
          setExpertise_levels(data);
        }
      } catch (error) {
        console.error("Failed to fetch expertise level", error);
      }
    };
    fetchExpertiseLevel();
  }, []);

  useEffect(() => {
    if (!loading && !isLoggedin) {
      navigate("/redirectPage", { state: { type: "auth-required" } });
    }
  }, [isLoggedin, loading, navigate]);

  if (loading) {
    return (
      <div className="pageContainer">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isLoggedin) {
    return null;
  }

  return (
    <div className="pageContainer sessionPage">
      {/* Header */}
      <div className="pageHeader">
        <h2>Configure Session</h2>
        <p>Set parameters before starting your question session</p>
      </div>

      {/* =====================
          CONFIG FORM (ONLY BEFORE START)
      ====================== */}
      {!start && (
        <div className="formCard">
          <div className="formRow">
            <div className="formGroup">
              <label>Question Count</label>
              <input
                type="number"
                min={1}
                value={count}
                onChange={(e) =>
                  setCount(parseInt(e.target.value || "0", 10))
                }
              />
            </div>

            <div className="formGroup">
              <label>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="category-select"
              >
                <option value="">Any</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="formGroup">
              <label>Expertise Level</label>
              {/* <input
                type="number"
                min={0}
                max={5}
                value={expertise}
                onChange={(e) =>
                  setExpertise(parseInt(e.target.value || "0", 10))
                }
              /> */}

                            <select
                value={expertise  }
                onChange={(e) => setExpertise(parseInt(e.target.value || "0", 10))}
                className="category-select"
              >
                <option value="">Any</option>
                {expertise_levels.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="formActions">
            <button
              className="start-session-btn"
              onClick={() => setStart(true)}
            >
              Start Session
            </button>
          </div>
        </div>
      )}

      {/* =====================
          INFO PANEL + SESSION (AFTER START)
      ====================== */}
      {start && (
        <>
          {/* Info Panel (Read-only) */}
          <div className="infoPanel">
            <div className="infoItem">
              <span>Questions</span>
              <strong>{count}</strong>
            </div>

            <div className="infoItem">
              <span>Category</span>
              <strong>{category || "Any"}</strong>
            </div>

            <div className="infoItem">
              <span>Expertise</span>
              <strong>{expertise || 0}</strong>
            </div>
          </div>

          {/* Session Content */}
          <div className="sessionContent">
            <SessionComponent
              count={count}
              category={category || undefined}
              expertise_lvl={
                Number.isFinite(expertise) ? expertise : undefined
              }
              headingDisplay="Review + New"
            />
          </div>
        </>
      )}
    </div>
  );
}

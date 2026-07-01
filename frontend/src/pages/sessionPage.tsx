import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/user.context";
import SessionComponent from "../components/session.component";
import { BACKEND_API } from "../constants";
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
        const res = await fetch(`${BACKEND_API}/words/categories`);
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
        const res = await fetch(`${BACKEND_API}/words/expertise-level`);
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
      {/* =====================
          CONFIG FORM (ONLY BEFORE START)
      ====================== */}
      {!start && (
        <>
          {/* Header */}
          <div className="pageHeader">
            <div className="header-icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8b0038"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <h2>Configure Session</h2>
            <p>Tailor your practice session to your current learning needs</p>
          </div>

          {/* session cutomizer */}
          <div className="formCard">
            <div className="formRow">
              <div className="formGroup">
                <label>Question Count</label>
                <div className="input-with-icon">
                  <input
                    type="number"
                    min={1}
                    value={count}
                    onChange={(e) =>
                      setCount(parseInt(e.target.value || "0", 10))
                    }
                  />
                </div>
              </div>

              <div className="formGroup">
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="category-select"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="formGroup">
                <label>Expertise Level</label>
                <select
                  value={expertise}
                  onChange={(e) =>
                    setExpertise(parseInt(e.target.value || "0", 10))
                  }
                  className="category-select"
                >
                  <option value="">Any Level</option>
                  {expertise_levels.map((cat) => (
                    <option key={cat} value={cat}>
                      Level {cat}
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
                Start Practice Session
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginLeft: "8px" }}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* =====================
          INFO PANEL + SESSION (AFTER START)
      ====================== */}
      {start && (
        <>
          {/* Session Content */}
          <div className="sessionContent">
            <SessionComponent
              count={count}
              category={category || undefined}
              expertise_lvl={Number.isFinite(expertise) ? expertise : undefined}
              headingDisplay="Review + New"
            />
          </div>
        </>
      )}
    </div>
  );
}

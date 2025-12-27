import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/user.context";
import SessionComponent from "../components/session.component";
import "../styles/_shared.scss";
import "../styles/session.style.scss";

export default function SessionPage() {
  const navigate = useNavigate();
  const { isLoggedin, loading } = useUserContext();
  const [count, setCount] = useState<number>(10);
  const [category, setCategory] = useState<string>("");
  const [expertise, setExpertise] = useState<number>(0);
  const [start, setStart] = useState(false);

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
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. basic"
              />
            </div>

            <div className="formGroup">
              <label>Expertise Level</label>
              <input
                type="number"
                min={0}
                max={5}
                value={expertise}
                onChange={(e) =>
                  setExpertise(parseInt(e.target.value || "0", 10))
                }
              />
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
              <strong>{expertise}</strong>
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

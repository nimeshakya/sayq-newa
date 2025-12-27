import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/user.context";
import "../styles/question.style.scss";
import "../styles/_shared.scss";
import RLLearnComponent from "../components/rl-learn.component";

export default function RLLearnPage() {
  const navigate = useNavigate();
  const { isLoggedin, loading } = useUserContext();

  useEffect(() => {
    if (!loading && !isLoggedin) {
      navigate("/redirectPage", { state: { type: "auth-required" } });
    }
  }, [isLoggedin, loading, navigate]);

  if (loading) {
    return (
      <div className="main-centered-container">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isLoggedin) {
    return null;
  }

  return (
    <div>
      <div className="main-centered-container">
        <RLLearnComponent headingDisplay="RL Agent Recommended Words" count={10} />
      </div>
    </div>
  );
}

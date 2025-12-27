import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/_shared.scss";

type RedirectType = "auth" | "learning" | "auth-required";

export default function RedirectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectType = location.state?.type as RedirectType;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (redirectType === "auth" || redirectType === "auth-required") {
        navigate("/signinPage");
      } else if (redirectType === "learning") {
        navigate("/learnPage");
      } else {
        navigate("/");
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [redirectType, navigate]);

  const getMessage = () => {
    if (redirectType === "auth" || redirectType === "auth-required") {
      return "Please sign in to access this page.";
    } else if (redirectType === "learning") {
      return "Please complete learning to prepare a session.";
    }
    return "Redirecting...";
  };

  return (
    <div className="pageContainer">
      <div className="questionContainer">
        <h2>{getMessage()}</h2>
        <p style={{ marginTop: "1rem", color: "#666" }}>
          Redirecting in a moment...
        </p>
      </div>
    </div>
  );
}

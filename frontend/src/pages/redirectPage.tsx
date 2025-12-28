import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/redirectPage.style.scss";

type RedirectType = "auth" | "learning" | "auth-required";

export default function RedirectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectType = location.state?.type as RedirectType;
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    const timer = setTimeout(() => {
      if (redirectType === "auth" || redirectType === "auth-required") {
        navigate("/signinPage");
      } else if (redirectType === "learning") {
        navigate("/learnPage");
      } else {
        navigate("/");
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [redirectType, navigate]);

  const getIcon = () => {
    if (redirectType === "auth" || redirectType === "auth-required") {
      return "🔒";
    } else if (redirectType === "learning") {
      return "📚";
    }
    return "🔄";
  };

  const getMessage = () => {
    if (redirectType === "auth" || redirectType === "auth-required") {
      return "Authentication Required";
    } else if (redirectType === "learning") {
      return "Learning Required";
    }
    return "Redirecting";
  };

  const getSubMessage = () => {
    if (redirectType === "auth" || redirectType === "auth-required") {
      return "Please sign in to access this page";
    } else if (redirectType === "learning") {
      return "Please complete learning to prepare a session";
    }
    return "Taking you to the right place";
  };

  return (
    <div className="redirect-page">
      <div className="redirect-container">
        <div className="redirect-icon">{getIcon()}</div>
        
        <h1 className="redirect-title">{getMessage()}</h1>
        
        <p className="redirect-message">{getSubMessage()}</p>
        
        <div className="redirect-countdown">
          <div className="countdown-circle">
            <span className="countdown-number">{countdown}</span>
          </div>
          <p className="countdown-text">Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...</p>
        </div>

        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}
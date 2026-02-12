import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/redirectPage.style.scss";

type RedirectType = "auth" | "learning" | "auth-required";

export default function RedirectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectType = location.state?.type as RedirectType;
  const [countdown, setCountdown] = useState(3);

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
      return (
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    } else if (redirectType === "learning") {
      return (
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    }
    return (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    );
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
        <div className="redirect-icon-wrapper">
          <div className="redirect-icon">{getIcon()}</div>
        </div>
        
        <h1 className="redirect-title">{getMessage()}</h1>
        
        <p className="redirect-message">{getSubMessage()}</p>
        
        <div className="redirect-countdown">
          <div className="countdown-circle">
            <svg className="countdown-ring" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" />
            </svg>
            <span className="countdown-number">{countdown}</span>
          </div>
          <p className="countdown-text">Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...</p>
        </div>

        <div className="loading-bar">
          <div className="loading-progress"></div>
        </div>
      </div>
    </div>
  );
}
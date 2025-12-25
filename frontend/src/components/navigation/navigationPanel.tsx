import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../../styles/navigation/nagigation.scss";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <nav className={`navigation ${isScrolled ? "scrolled" : ""}`}>
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-text">NewaSayQ</span>
        </Link>

        <div className={`nav-links ${isMenuOpen ? "active" : ""}`}>
          <Link to="/" className="nav-link active">
            Home
          </Link>
          <a href="/#about" className="nav-link">
            About
          </a>
          <Link to="learnPage" className="nav-link">
            Learning
          </Link>
          <Link to="mlLearnPage" className="nav-link">
            AI Learning
          </Link>
          <Link to="rlLearnPage" className="nav-link">
            RL Agent
          </Link>
          <Link to="initialQuestionPage" className="nav-link">
            Quiz
          </Link>
          <Link to="sessionPage" className="nav-link">
            Session
          </Link>
          {/* <a href="#learning" className="nav-link">
            Learning
          </a> */}
        </div>

        <div className={`nav-auth ${isMenuOpen ? "active" : ""}`}>
          <Link to="/signinPage" className="btn-login">
            Login
          </Link>
          {/* <Link to="/signinPage" className="btn-signup">
            Sign Up
          </Link> */}
        </div>

        <button
          className={`menu-toggle ${isMenuOpen ? "active" : ""}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;

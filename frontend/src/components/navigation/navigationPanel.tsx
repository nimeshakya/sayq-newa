import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useUserContext } from "../../context/user.context";
import "../../styles/navigation/nagigation.scss";
import profile from "../../assets/ProfileLogo/profile.png";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const { isLoggedin, user, logout } = useUserContext();

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

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const toggleProfile = () => {
    setIsProfileOpen((prev) => !prev);
  };

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
  };

  // Get initials from user name for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
          {/* <Link to="initialQuestionPage" className="nav-link">
            Quiz
          </Link> */}
          <Link to="sessionPage" className="nav-link">
            Session
          </Link>
        </div>

        <div className={`nav-auth ${isMenuOpen ? "active" : ""}`}>
          {isLoggedin && user ? (
            <div className="profile-container" ref={profileRef}>
              <button
                className="profile-button"
                onClick={toggleProfile}
                aria-label="User menu"
              >
                {user.imageUrl ? (
                  <img
                    src={profile}
                    alt={user.name}
                    className="profile-image"
                  />
                ) : (
                  <div className="profile-avatar">{getInitials(user.name)}</div>
                )}
              </button>

              {isProfileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-info">
                    <p className="profile-name">{user.name}</p>
                    <p className="profile-email">{user.email}</p>
                  </div>
                  <div className="profile-divider"></div>
                  {/* <Link
                    to="/profile"
                    className="profile-menu-item"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Profile
                  </Link> */}
                  {/* <Link
                    to="/dashboard"
                    className="profile-menu-item"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                    Dashboard
                  </Link> */}
                  <div className="profile-divider"></div>
                  <button
                    className="profile-menu-item logout"
                    onClick={handleLogout}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/signinPage" className="btn-login">
              Login
            </Link>
          )}
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

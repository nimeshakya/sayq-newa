import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useUserContext } from "../../context/user.context";
import SearchModal from "../search/SearchModal";
import "../../styles/navigation/nagigation.scss";
import logoSvg from "../../assets/logo.svg";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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
    <>
      <nav className={`navigation ${isScrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <img src={logoSvg} className="logo-icon" width={40} />
            <span className="logo-text">NewaSayQ</span>
          </Link>

          <div className={`nav-links ${isMenuOpen ? "active" : ""}`}>
            <Link
              to="/"
              className="nav-link active"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>

            <Link
              to="learnPage"
              className="nav-link"
              onClick={() => setIsMenuOpen(false)}
            >
              Learning
            </Link>
            <Link
              to="learn/neural"
              className="nav-link"
              onClick={() => setIsMenuOpen(false)}
            >
              AI Learning
            </Link>
            <Link
              to="learn/dqn"
              className="nav-link"
              onClick={() => setIsMenuOpen(false)}
            >
              DQN Learning
            </Link>
            <Link
              to="sessionPage"
              className="nav-link"
              onClick={() => setIsMenuOpen(false)}
            >
              Session
            </Link>
            <Link
              to="ranjanaPage"
              className="nav-link"
              onClick={() => setIsMenuOpen(false)}
            >
              Ranjana
            </Link>
            <Link
              to="teamPage"
              className="nav-link"
              onClick={() => setIsMenuOpen(false)}
            >
              Meet Our Team
            </Link>
          </div>

          <div className="button-container">
            <button
              className="search-icon-btn"
              onClick={() => {
                setIsSearchOpen(true);
                setIsMenuOpen(false);
              }}
              aria-label="Search"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>

            <div className={`nav-auth ${isMenuOpen ? "active" : ""}`}>
              {isLoggedin && user ? (
                <div className="profile-container" ref={profileRef}>
                  <button
                    className="profile-button"
                    onClick={toggleProfile}
                    aria-label="User menu"
                  >
                    <div className="profile-avatar">
                      {getInitials(user.name)}
                    </div>
                  </button>

                  {isProfileOpen && (
                    <div className="profile-dropdown">
                      <Link
                        to={"/my-profile"}
                        className="profile-info inline-block p-20 hover:bg-gray-100 w-full"
                      >
                        <p className="profile-name">{user.name}</p>
                        <p className="profile-email">{user.email}</p>
                      </Link>
                      <div className="profile-divider"></div>
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
                            {isLoggedin && user ? (
                                <div
                                    className='profile-container'
                                    ref={profileRef}
                                >
                                    <button
                                        className='profile-button'
                                        onClick={toggleProfile}
                                        aria-label='User menu'
                                    >
                                        <div className='profile-avatar'>
                                            {getInitials(user.name)}
                                        </div>
                                    </button>

                                    {isProfileOpen && (
                                        <div className='profile-dropdown'>
                                            <Link
                                                to={'/my-profile'}
                                                className='profile-info inline-block p-20 hover:bg-gray-100 w-full'
                                                onClick={() => toggleProfile()}
                                            >
                                                <p className='profile-name'>
                                                    {user.name}
                                                </p>
                                                <p className='profile-email'>
                                                    {user.email}
                                                </p>
                                            </Link>
                                            <div className='profile-divider'></div>
                                            <div className='profile-divider'></div>
                                            <button
                                                className='profile-menu-item logout'
                                                onClick={handleLogout}
                                            >
                                                <svg
                                                    width='18'
                                                    height='18'
                                                    viewBox='0 0 24 24'
                                                    fill='none'
                                                    stroke='currentColor'
                                                    strokeWidth='2'
                                                >
                                                    <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
                                                    <polyline points='16 17 21 12 16 7' />
                                                    <line
                                                        x1='21'
                                                        y1='12'
                                                        x2='9'
                                                        y2='12'
                                                    />
                                                </svg>
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    to='/signinPage'
                                    className='btn-login'
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/signinPage"
                  className="btn-login"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
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

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};

export default Navigation;

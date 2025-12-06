import { useState, useEffect } from "react";
import { useUserContext } from "../context/user.context";
import { useNavigate } from "react-router-dom";
import "../styles/initialPages.style.scss";

export default function SignInPage() {
  const path = "Assets/";
  const navigate = useNavigate();
  const { isLoggedin, setIsLoggedin, isLoginVisible, setLoginVisible } =
    useUserContext();

  const [imagePath, setImagePath] = useState<string>();

  useEffect(() => {
    setImagePath(path + "Namaste.gif");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoginVisible(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    setIsLoggedin(true);
    setLoginVisible(true);
    console.log(`User loggedin ${!isLoggedin}`);
    navigate("/initialPage");
  };

  SignInPage;

  return (
    <div className="base">
      <div className="mascotContainer">
        <img
          src={imagePath}
          alt="Newa girl"
          className={`mascotStyle ${isLoginVisible ? "shift-left" : ""}`}
        />

        <div
          className={`loginOption ${isLoginVisible ? "visible" : "hidden"}`}
          onClick={handleLogin}
          role="button"
          tabIndex={isLoginVisible ? 0 : -1}
          aria-hidden={!isLoginVisible}
        >
          <img src="Assets/google_icon.png" alt="google logo" />
          Sign in with google
        </div>
      </div>
    </div>
  );
}

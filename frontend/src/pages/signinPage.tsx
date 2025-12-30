import { useState, useEffect } from "react";
import { useUserContext } from "../context/user.context";
import { GoogleLogin } from "@react-oauth/google";

import "../styles/initialPages.style.scss";
import "../styles/_shared.scss";

export default function SignInPage() {
  const path = "Assets/";
  const { googleSignIn, isLoginVisible, setLoginVisible } = useUserContext();

  const [imagePath, setImagePath] = useState<string>();

  useEffect(() => {
    setImagePath(path + "Namaste.gif");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoginVisible(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [setLoginVisible]);

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
          role="button"
          tabIndex={isLoginVisible ? 0 : -1}
          aria-hidden={!isLoginVisible}
        >
          <GoogleLogin
            onSuccess={googleSignIn}
            onError={() => console.error("Google login failed!")}
          />
        </div>
      </div>
    </div>
  );
}

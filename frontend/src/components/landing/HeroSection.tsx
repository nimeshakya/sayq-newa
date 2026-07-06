// src/components/landing/HeroSection.tsx
import "../../styles/landing/hero.scss";
import heroImage from "../../assets/landing/Landing.png";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className="hero" id="home">
      <div className="hero__content">
        <div>
          <h1>NewaSayQ</h1>
          <h2>Learn Newa (Nepal Bhasa)</h2>
          <p>Preserve culture. Practice naturally. Speak confidently.</p>
          <h3>जोजोलपा</h3>
          <span className="arrow">↓</span>
          <strong>Namaste</strong>
          <span>नमस्ते</span>
          {/* <div className="hero__actions">
          </div> */}
          <div className="hero__actions">
            <button
              className="btn primary"
              onClick={() => {
                navigate("/learnPage");
              }}
            >
              Get Started
            </button>
            <button
              className="btn secondary"
              onClick={() => navigate("/signinPage")}
              hidden={true}
            >
              Explore Features
            </button>
          </div>
        </div>

        <div className="hero__image">
          <img src={heroImage} alt="Learn Newari illustration" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

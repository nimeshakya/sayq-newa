// src/components/landing/HeroSection.tsx
import "../../styles/landing/hero.scss";
import heroImage from "../../assets/landing/Landing.png";

const HeroSection = () => {
  return (
    <section className="hero">
      <div className="hero__content">
        <div>
          <h1>NewaSayQ</h1>
          <h2>Learn Newari (Nepal Bhasa)</h2>
          <p>Preserve culture. Practice naturally. Speak confidently.</p>
          <h3>ज्वजलपा</h3>
          <span className="arrow">↓</span>
          <div className="hero__actions">
            <strong>Namaste</strong> <br />
            <span>नमस्ते</span>
            {/* <button className="btn primary">Get Started</button>
            <button className="btn secondary">Explore Features</button> */}
          </div>
        </div>

        <div>
          {" "}
          <div className="hero__image">
            <img src={heroImage} alt="Learn Newari illustration" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

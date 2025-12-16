// src/components/landing/AboutSection.tsx
import "../../styles/landing/sections.scss";

const AboutSection = () => {
  return (
    <section className="section about">
      <div className="about-container">
        <div className="about-header">
          <h2>What is NewaSayQ?</h2>
          <div className="header-underline"></div>
        </div>

        <div className="about-content">
          <div className="about-text">
            <p className="about-intro">
              NewaSayQ is a <span className="highlight">digital platform</span>{" "}
              dedicated to teaching
              <span className="highlight"> Newari (Nepal Bhasa)</span> using
              modern learning techniques.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;

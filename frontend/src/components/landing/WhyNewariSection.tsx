import "../../styles/landing/whynewarisection.scss";

const WhyNewariSection = () => {
  return (
    <section className="section why">
      <div className="why-container">
        <div className="why-header">
          <h2>Why Learn Newa?</h2>
          <p className="subtitle">
            Discover the rich heritage and cultural significance of Nepalbhasa
          </p>
        </div>

        <div className="card-grid">
          <div className="card cultural">
            <div className="card-icon">🎭</div>
            <div className="why-card-content">
              <h3>Cultural Identity</h3>
              <p>
                Connect with your roots and embrace the rich Newar heritage
                through language
              </p>
              <div className="card-decoration"></div>
            </div>
          </div>

          <div className="card preservation">
            <div className="card-icon">🛡️</div>
            <div className="why-card-content">
              <h3>Language Preservation</h3>
              <p>
                Be part of the movement to keep this ancient language alive for
                future generations
              </p>
              <div className="card-decoration"></div>
            </div>
          </div>

          <div className="card historical">
            <div className="card-icon">📜</div>
            <div className="why-card-content">
              <h3>Historical Importance</h3>
              <p>
                Unlock centuries of literature, art, and wisdom preserved in
                Nepalbhasa
              </p>
              <div className="card-decoration"></div>
            </div>
          </div>
        </div>

        <div className="why-quote">
          <div className="quote-mark">"</div>
          <p>
            Learning Newa is not just about words – it's about preserving
            culture.
          </p>
          <div className="quote-author">Preserving Our Heritage</div>
        </div>
      </div>
    </section>
  );
};

export default WhyNewariSection;

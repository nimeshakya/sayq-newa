import { RanjanaConverter } from '../components/ranjana-converter';
import { CharacterMap } from '../components/ranjana-converter/character-map';
import '../styles/ranjana/ranjana.style.scss';

export default function RanjanaPage() {
  return (
    <div className="ranjana-page">
      {/* Hero Section */}
      <section className="ranjana-hero">
        <div className="ranjana-hero-content">
          <h1 className="ranjana-hero-title">
            Convert Nepali Text to
            <br />
            <span className="ranjana-highlight">Ranjana Script</span>
          </h1>
          <p className="ranjana-hero-description">
            Transform Nepali (Devanagari) or Romanized text into beautiful Ranjana script.
            Supports consonants, vowels, matras, and conjuncts.
          </p>
          <div className="ranjana-features">
            <div className="feature-item">
              <span className="feature-dot live"></span>
              <span className="feature-text">Live Preview</span>
            </div>
            <div className="feature-item">
              <span className="feature-dot client"></span>
              <span className="feature-text">Client-Side Conversion</span>
            </div>
            <div className="feature-item">
              <span className="feature-dot unicode"></span>
              <span className="feature-text">Unicode Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Converter Section */}
      <section className="ranjana-converter-section">
        <div className="ranjana-container">
          <RanjanaConverter />
        </div>
      </section>

      {/* Character Reference Section */}
      <section className="ranjana-reference-section">
        <div className="ranjana-container">
          <div className="reference-header">
            <h2 className="reference-title">Character Reference</h2>
            <p className="reference-subtitle">
              Browse consonants, vowels, and conjuncts used in the conversion
            </p>
          </div>
          <CharacterMap />
        </div>
      </section>
    </div>
  );
}

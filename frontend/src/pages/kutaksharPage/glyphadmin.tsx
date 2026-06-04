import GlyphComponent from "@/components/kutakshar/glyph";
import "../../styles/ranjana/ranjana.style.scss";

export default function GlyphAdminPage() {
  return (
    <div className="ranjana-page">
      <section className="ranjana-hero">
        <div className="ranjana-hero-content">
          <h1 className="ranjana-hero-title">
            Glyph
            <br />
            <span className="ranjana-highlight">Configurator</span>
          </h1>
          <p className="ranjana-hero-description">
            Fine-tune individual glyph properties including scale, offset, and cropping.
          </p>
        </div>
      </section>

      <section className="ranjana-converter-section">
        <div className="ranjana-container">
          <GlyphComponent />
        </div>
      </section>
    </div>
  );
}

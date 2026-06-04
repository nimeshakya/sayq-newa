import LigatureComponent from "@/components/kutakshar/ligature";
import "../../styles/ranjana/ranjana.style.scss";

export default function LigatureAdminPage() {
  return (
    <div className="ranjana-page">
      <section className="ranjana-hero">
        <div className="ranjana-hero-content">
          <h1 className="ranjana-hero-title">
            Ligature
            <br />
            <span className="ranjana-highlight">Studio</span>
          </h1>
          <p className="ranjana-hero-description">
            Create and manage custom character combinations for perfect script rendering.
          </p>
        </div>
      </section>

      <section className="ranjana-converter-section">
        <div className="ranjana-container">
          <LigatureComponent />
        </div>
      </section>
    </div>
  );
}

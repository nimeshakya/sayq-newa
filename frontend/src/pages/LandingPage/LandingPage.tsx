import AboutSection from "../../components/landing/AboutSection";
import Footer from "../../components/landing/Footer";
import HeroSection from "../../components/landing/HeroSection";
import WhyNewariSection from "../../components/landing/WhyNewariSection";
import "../../styles/landing/landing.scss";

const LandingPage = () => {
  return (
    <div className="landing">
      
      {/* Main content */}
      <HeroSection />
      <AboutSection />
      <WhyNewariSection />
      <Footer />
    </div>
  );
};

export default LandingPage;
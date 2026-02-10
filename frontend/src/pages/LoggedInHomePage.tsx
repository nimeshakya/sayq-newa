import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/user.context";
import "../styles/loggedInHome.scss";

export default function LoggedInHomePage() {
  const { user } = useUserContext();
  const navigate = useNavigate();

  const features = [
    {
      id: 1,
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
      title: "Learning",
      description: "Master Newar language with AI",
      path: "learnPage",
      gradient: "linear-gradient(135deg, #8B1E3F 0%, #A52A4A 100%)",
    },
    {
      id: 2,
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
      title: "AI Learning",
      description: "Learn with Neural Networks",
      path: "learn/neural",
      gradient: "linear-gradient(135deg, #6B1E3F 0%, #8B1E3F 100%)",
    },
    {
      id: 3,
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
      title: "DQN Learning",
      description: "Reinforcement Learning Path",
      path: "learn/dqn",
      gradient: "linear-gradient(135deg, #A52A4A 0%, #C41E3A 100%)",
    },
    {
      id: 4,
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      title: "Session",
      description: "Practice your skills",
      path: "sessionPage",
      gradient: "linear-gradient(135deg, #8B1E3F 0%, #6B1E3F 100%)",
    },
  ];

  const cultureCards = [
    {
      title: "नेवा भाषा",
      description:
        "नेवा भाषा नेपालको काठमाडौं उपत्यकामा बोलिने एक समृद्ध भाषा हो। यसको इतिहास हजारौं वर्षको छ।",
      icon: (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
    },
    {
      title: "नेवा परम्परा",
      description:
        "नेवा मानिसहरूको अनौठो संस्कृति र परम्परा छ जो पूरै एशियामा मान्यता छ।",
      icon: (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      title: "भाषा संरक्षण",
      description:
        "नेवा भाषा संरक्षण गरेर हामी आपनो परम्परा र संस्कृति जीवन्त राखेको छौं।",
      icon: (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="logged-in-home">
      <div className="home-container">
        {/* Welcome Section */}
        <section className="welcome-section">
          <div className="welcome-content">
            {/* <div className="welcome-badge">Welcome Back</div> */}
            <h1 className="welcome-title">
              ज्वोजलापा, <span className="user-name">{user?.name}</span>
            </h1>
            <p className="welcome-subtitle">
              तपाईंलाई नेवा भाषा सिक्ने यात्रामा स्वागत छ । <br />
              " छिगु नेवा भाषा सयेकेगु यात्राय् लसकुस दु । "
            </p>
          </div>

          {/* Quick Stats */}
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">0</div>
              <div className="stat-label">Words Learned <br /> सीका कागु</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">0</div>
              <div className="stat-label">Day Streak <br /> न्हिच्छिया</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">0</div>
              <div className="stat-label">Hours Practiced <br /> अभ्यास घण्टा</div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="features-section">
          <h2 className="section-heading">Start Learning</h2>
          <div className="features-grid">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="feature-card"
                onClick={() => navigate(feature.path)}
                style={
                  { "--gradient": feature.gradient } as React.CSSProperties
                }
              >
                <div className="feature-icon-wrapper">{feature.icon}</div>
                <div className="feature-content">
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
                <div className="feature-action">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Culture Section */}
        <section className="culture-section">
          <h2 className="section-heading">नेवा संस्कृति जानि</h2>
          <div className="culture-grid">
            {cultureCards.map((card, index) => (
              <div key={index} className="culture-card">
                <div className="culture-icon">{card.icon}</div>
                <h3 className="culture-title">{card.title}</h3>
                <p className="culture-description">{card.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

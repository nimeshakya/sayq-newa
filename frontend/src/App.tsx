import "./App.scss";
import { Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/dashboard";
import InitialPage from "./pages/initialPage";

const Home = () => (
  <div className="app">
    <div className="container1">
      <h1>Hello, world!</h1>
    </div>
    <div className="container2">
      <h2>Hello, people!</h2>
    </div>
  </div>
);

const App = () => {
  return (
    <div className="app">
      <nav style={{ padding: 12, marginTop: 12 }}>
        <Link to="/">Home</Link>
        {" | "}
        <Link to="/dashboard">Dashboard</Link>
        {" | "}
        <Link to="/initialPage">Initial Page</Link>
        {" | "}
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/initialPage" element={<InitialPage />} />
      </Routes>
    </div>
  );
};

export default App;

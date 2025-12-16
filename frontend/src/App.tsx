import "./App.scss";
import { Routes, Route } from "react-router-dom";
import Navigation from "./components/navigation.component";
import { routes } from "./routes/allRoutes";

const App = () => {
  return (
    <div className="app">
      <Navigation />
      <Routes>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Routes>
    </div>
  );
};

export default App;

import "./App.scss";
import { useRoutes } from "react-router-dom";
import { routes } from "./routes/allRoutes";

const App = () => {
  const element = useRoutes(routes);
  
  return (
    <div className="app">
      {element}
    </div>
  );
};

export default App;

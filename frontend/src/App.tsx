import "./App.scss";
import { RouterProvider } from "react-router-dom";
import mainRouter from "./routes/mainRoutes";

const App = () => {
  return <RouterProvider router={mainRouter} />;
};

export default App;

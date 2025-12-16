// layouts/LandingLayout.tsx
import Navigation from "../components/navigation/navigationPanel";
import { Outlet } from "react-router-dom";

const LandingLayout = () => {
  return (
    <>
      <Navigation />
      <Outlet />
    </>
  );
};

export default LandingLayout;

import { RouteObject } from "react-router-dom";
// import Landing from "../pages/landing";
import Dashboard from "../pages/dashboard";
import InitialPage from "../pages/initialPage";
import SignInPage from "../pages/signinPage";
import InitialQuestion from "../pages/initialQuestion";
import LearnPage from "../pages/learnPage";
import LandingPage from "../pages/LandingPage/LandingPage";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/initialPage",
    element: <InitialPage />,
  },
  {
    path: "/signinPage",
    element: <SignInPage />,
  },
  {
    path: "/initialQuestionPage",
    element: <InitialQuestion />,
  },
  {
    path: "/learnPage",
    element: <LearnPage />,
  },
];

// Navigation links for the navbar
export const navLinks = [
  { label: "Home", path: "/" },
  { label: "Dashboard", path: "/dashboard" },
  { label: "Initial Page", path: "/initialPage" },
  { label: "Sign In", path: "/signinPage" },
  { label: "Question", path: "/initialQuestionPage" },
  { label: "Learn", path: "/learnPage" },
];

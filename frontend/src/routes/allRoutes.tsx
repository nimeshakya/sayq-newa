import type { RouteObject } from "react-router-dom";

import LandingPage from "../pages/LandingPage/LandingPage";
// import Dashboard from "../pages/dashboard";
import InitialPage from "../pages/initialPage";
import SignInPage from "../pages/signinPage";
// import InitialQuestion from "../pages/initialQuestion";
import LearnPage from "../pages/learnPage";
import MLLearnPage from "../pages/mlLearnPage";
import RLLearnPage from "../pages/rlLearnPage";
import SessionPage from "../pages/sessionPage";
import RedirectPage from "../pages/redirectPage";
import LandingLayout from "../layouts/LandingLayout";
import TeamPage from "../pages/teamPage/TeamPage";

export const routes: RouteObject[] = [
  {
    element: <LandingLayout />,
    children: [
      { path: "/", element: <LandingPage /> },
      // { path: "/dashboard", element: <Dashboard /> },

      { path: "/initialPage", element: <InitialPage /> },
      { path: "/signinPage", element: <SignInPage /> },
      // { path: "/initialQuestionPage", element: <InitialQuestion /> },
      { path: "/learnPage", element: <LearnPage /> },
      { path: "/mlLearnPage", element: <MLLearnPage /> },
      { path: "/rlLearnPage", element: <RLLearnPage /> },
      { path: "/sessionPage", element: <SessionPage /> },
      { path: "/teamPage", element: <TeamPage /> },
      { path: "/redirectPage", element: <RedirectPage /> },
    ],
  },
];

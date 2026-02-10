import React from "react";
import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";

import LandingPage from "../pages/LandingPage/LandingPage";
// import Dashboard from "../pages/dashboard";
import InitialPage from "../pages/initialPage";
import SignInPage from "../pages/signinPage";
// import InitialQuestion from "../pages/initialQuestion";
// import LearnPage from "../pages/learnPage";
// import MLLearnPage from "../pages/mlLearnPage";
// import RLLearnPage from "../pages/rlLearnPage";
import SessionPage from "../pages/sessionPage";
import RedirectPage from "../pages/redirectPage";
import LandingLayout from "../layouts/LandingLayout";
import TeamPage from "../pages/teamPage/TeamPage";
import LearnAgentPage from "../pages/learnPage/learningAgent.page";
import { useUserContext } from "../context/user.context";

import LearnRandomPage from "../pages/learnPage/LearnRandom.page";

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { isLoggedin, loading } = useUserContext();

  if (loading) return null;
  if (!isLoggedin) {
    return (
      <Navigate to="/redirectPage" state={{ type: "auth-required" }} replace />
    );
  }

  return children;
};

export const routes: RouteObject[] = [
  {
    element: <LandingLayout />,
    children: [
      { path: "/", element: <LandingPage /> },
      {
        path: "/initialPage",
        element: (
          <ProtectedRoute>
            <InitialPage />
          </ProtectedRoute>
        ),
      },
      { path: "/signinPage", element: <SignInPage /> },
      {
        path: "/learnPage",
        element: (
          <ProtectedRoute>
            <LearnRandomPage />
            {/* <LearnPage /> */}
          </ProtectedRoute>
        ),
      },
      {
        path: "/learn/neural",
        element: (
          <ProtectedRoute>
            <LearnAgentPage modelType="supervised" />
          </ProtectedRoute>
          // <ProtectedRoute>
          //   <MLLearnPage />
          // </ProtectedRoute>
        ),
      },
      {
        path: "/learn/dqn",
        element: (
          <ProtectedRoute>
            <LearnAgentPage modelType="unsupervised" />
          </ProtectedRoute>
          // <ProtectedRoute>
          //   <RLLearnPage />
          // </ProtectedRoute>
        ),
      },
      {
        path: "/sessionPage",
        element: (
          <ProtectedRoute>
            <SessionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/teamPage",
        element: (
          <ProtectedRoute>
            <TeamPage />
          </ProtectedRoute>
        ),
      },
      { path: "/redirectPage", element: <RedirectPage /> },
    ],
  },
];

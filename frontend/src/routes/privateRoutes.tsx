import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const InitialPage = lazy(() => import("@/pages/initialPage"));
const LearnRandomPage = lazy(
  () => import("@/pages/learnPage/LearnRandom.page"),
);
const LearnAgentPage = lazy(
  () => import("@/pages/learnPage/learningAgent.page"),
);
const SessionPage = lazy(() => import("@/pages/sessionPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));

export const privateRoutes: RouteObject[] = [
  { path: "initialPage", element: <InitialPage /> },
  { path: "learnPage", element: <LearnRandomPage /> },
  { path: "learn/neural", element: <LearnAgentPage modelType="supervised" /> },
  { path: "learn/dqn", element: <LearnAgentPage modelType="unsupervised" /> },
  { path: "sessionPage", element: <SessionPage /> },
  { path: "my-profile", element: <ProfilePage /> },
];

import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";

const SignInPage = lazy(() => import("@/pages/signinPage"));
const KutaksharPage = lazy(() => import("@/pages/kutaksharPage/kutakshar"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const RedirectPage = lazy(() => import("@/pages/redirectPage"));
const TeamPage = lazy(() => import("@/pages/teamPage/TeamPage"));
const RanjanaPage = lazy(() => import("@/pages/RanjanaPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));

const GlyphAdminPage = lazy(() => import("@/pages/kutaksharPage/glyphadmin"));
const LigatureAdminPage = lazy(
  () => import("@/pages/kutaksharPage/ligatureadmin"),
);

const withSuspense = (node: React.ReactNode) => {
  return <Suspense fallback={<div>Loading...</div>}>{node}</Suspense>;
};

export const publicRoutes: RouteObject[] = [
  { index: true, element: withSuspense(<HomePage />) },
  { path: "/redirectPage", element: withSuspense(<RedirectPage />) },
  {
    path: "/signinPage",
    element: withSuspense(<SignInPage />),
  },
  {
    path: "/teamPage",
    element: withSuspense(<TeamPage />),
  },
  {
    path: "/ranjanaPage",
    element: withSuspense(<RanjanaPage />),
  },
  { path: "/monogram", element: withSuspense(<KutaksharPage />) },
  { path: "/my-profile", element: withSuspense(<ProfilePage />) },

  { path: "/adminglyph", element: <GlyphAdminPage /> },
  { path: "/adminligature", element: <LigatureAdminPage /> },
];

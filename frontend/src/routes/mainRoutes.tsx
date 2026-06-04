// mainRoutes.tsx
import { createBrowserRouter } from "react-router-dom";
import { publicRoutes } from "./publicRoutes";
import { privateRoutes } from "./privateRoutes";
import LandingLayout from "@/layouts/LandingLayout";
import ProtectedRoute from "@/components/common/protectedRoute";

const mainRouter = createBrowserRouter([
  {
    element: <LandingLayout />,
    children: [
      ...publicRoutes, // Public routes (ensure /my-profile is removed from here)
      {
        element: <ProtectedRoute />, // Wrap all private routes here
        children: privateRoutes,
      },
    ],
  },
]);

export default mainRouter;

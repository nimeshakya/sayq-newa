// src/components/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUserContext } from "@/context/user.context";

const ProtectedRoute = () => {
  const { isLoggedin, loading } = useUserContext();
  const location = useLocation();

  if (loading) return <div>Loading Auth...</div>; // Show a spinner here

  if (!isLoggedin) {
    return (
      <Navigate
        to="/redirectPage"
        state={{ from: location, type: "auth-required" }}
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;

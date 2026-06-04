import { useUserContext } from "../context/user.context";
import LandingPage from "./LandingPage/LandingPage";
import LoggedInHomePage from "./LoggedInHomePage";

export default function HomePage() {
  const { isLoggedin, loading } = useUserContext();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // If not logged in, show landing page
  if (!isLoggedin) {
    return <LandingPage />;
  }

  // If logged in, show logged in home page
  return <LoggedInHomePage />;
}

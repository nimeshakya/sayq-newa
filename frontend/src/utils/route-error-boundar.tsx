import { useUserContext } from "@/context/user.context";
import {
  Link,
  Navigate,
  isRouteErrorResponse,
  useRouteError,
} from "react-router-dom";

export default function RouteErrorBoundary() {
  const error = useRouteError();

  const { isLoggedin, loading } = useUserContext();
  if (loading) return null;
  if (!isLoggedin) {
    return (
      <Navigate to="/redirectPage" state={{ type: "auth-required" }} replace />
    );
  }

  let title = "Access Denied";
  let description = "You cannot access this page.";

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    description =
      typeof error.data === "string"
        ? error.data
        : "The requested route failed to load.";
  } else if (error instanceof Error) {
    description = error.message;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted px-6 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      <Link
        to={`/`}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Go to home
      </Link>
    </div>
  );
}

import { Navigate } from "react-router";

import { useInitializeAuth } from "@/shared/auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status } = useInitializeAuth();

  switch (status) {
    case "loading":
      return null;
    case "unauthenticated":
      return <Navigate to="/service-unavailable" replace state={{ reason: "unauthenticated" }} />;
    case "api_unavailable":
      return <Navigate to="/service-unavailable" replace state={{ reason: "api_unavailable" }} />;
    case "authenticated":
      return <>{children}</>;
  }
}

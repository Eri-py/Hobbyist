import { useAuth } from "@/hooks/app/useAuth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/profile/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <div>Page not found</div> : <div>Please login</div>;
}

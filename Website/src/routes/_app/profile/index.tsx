import { createFileRoute } from "@tanstack/react-router";

import { useAuth } from "@hobbyist/hooks";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_app/profile/")({
  head: () => seo({ title: "Profile", noindex: true }),
  component: RouteComponent,
});

function RouteComponent() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <div>Page not found</div> : <div>Please login</div>;
}

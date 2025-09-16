import { useAuth } from "@/hooks/app/useAuth";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { useNavigation } from "@/hooks/app/useNavigation";

export const Route = createFileRoute("/_app/profile/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isAuthenticated } = useAuth();
  const { setActiveTab } = useNavigation();

  // Set active navigation tab
  useEffect(() => {
    setActiveTab("Profile");
  }, [setActiveTab]);

  return isAuthenticated ? <div>Page not found</div> : <div>Please login</div>;
}

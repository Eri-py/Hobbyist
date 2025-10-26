import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { useAuth } from "@/hooks/app/useAuth";
import { useRouteSetup } from "@/hooks/app/useRouteSetup";

export const Route = createFileRoute("/_app/profile/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isAuthenticated } = useAuth();

  const routeConfig = useMemo(
    () => ({
      activeNavigationTab: "",
      desktopSearchBar: <div></div>,
      desktopRightButtonGroup: <div></div>,
      mobileSearchOverlay: <div></div>,
    }),
    []
  );
  useRouteSetup(routeConfig);

  return isAuthenticated ? <div>Page not found</div> : <div>Please login</div>;
}

import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { useRouteSetup } from "@/hooks/app/useRouteSetup";

export const Route = createFileRoute("/_app/create")({
  component: CreatePage,
});

function CreatePage() {
  const routeConfig = useMemo(
    () => ({
      activeNavigationTab: "Create",
      desktopSearchBar: <div></div>,
      desktopRightButtonGroup: <div></div>,
      mobileSearchOverlay: <div></div>,
    }),
    []
  );
  useRouteSetup(routeConfig);

  return <div>User is trying to create a post</div>;
}

import { useRouteSetup } from "@/hooks/app/useRouteSetup";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/explore/events")({
  component: ExploreEventsPage,
});

function ExploreEventsPage() {
  const routeConfig = useMemo(
    () => ({
      activeNavigationTab: "Explore",
      desktopSearchBar: <div></div>,
      desktopRightButtonGroup: <div></div>,
      mobileSearchOverlay: <div></div>,
    }),
    []
  );
  useRouteSetup(routeConfig);

  return <div>Hello "/_app/explore/events"!</div>;
}

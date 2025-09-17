import { useRouteSetup } from "@/hooks/app/useRouteSetup";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/events")({
  component: EventsPage,
});

function EventsPage() {
  const routeConfig = useMemo(
    () => ({
      activeNavigationTab: "Events",
      desktopSearchBar: <div></div>,
      desktopRightButtonGroup: <div></div>,
      mobileSearchOverlay: <div></div>,
    }),
    []
  );
  useRouteSetup(routeConfig);

  return <div>User is trying to view events</div>;
}

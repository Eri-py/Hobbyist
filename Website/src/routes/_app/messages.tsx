import { useRouteSetup } from "@/hooks/app/useRouteSetup";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/messages")({
  component: MessagesPage,
});

function MessagesPage() {
  const routeConfig = useMemo(
    () => ({
      activeNavigationTab: "Messages",
      desktopSearchBar: <div></div>,
      desktopRightButtonGroup: <div></div>,
      mobileSearchOverlay: <div></div>,
    }),
    []
  );
  useRouteSetup(routeConfig);

  return <div>User opened their messages</div>;
}

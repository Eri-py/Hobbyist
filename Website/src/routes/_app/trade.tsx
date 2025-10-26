import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { useRouteSetup } from "@/hooks/app/useRouteSetup";

export const Route = createFileRoute("/_app/trade")({
  component: TradePage,
});

function TradePage() {
  const routeConfig = useMemo(
    () => ({
      activeNavigationTab: "Trade",
      desktopSearchBar: <div></div>,
      desktopRightButtonGroup: <div></div>,
      mobileSearchOverlay: <div></div>,
    }),
    []
  );
  useRouteSetup(routeConfig);

  return <div>User is trying to trade</div>;
}

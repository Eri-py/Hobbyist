import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";

import { useBreakpoint } from "@/hooks/shared/useBreakpoint";
import { useRouteSetup } from "@/hooks/app/useRouteSetup";

export const Route = createFileRoute("/_app/explore/hobbies")({
  component: CommunitiesPage,
});

function CommunitiesPage() {
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

  const { isDesktop } = useBreakpoint();
  const navigate = useNavigate();
  useEffect(() => {
    if (isDesktop) {
      navigate({ to: "/" });
    }
  });

  return <div>User clicked explore and is on the communities tab</div>;
}

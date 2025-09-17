import { createFileRoute } from "@tanstack/react-router";

import Stack from "@mui/material/Stack";

import { useBreakpoint } from "@/hooks/shared/useBreakpoint";
import { useRouteSetup } from "@/hooks/app/useRouteSetup";
import { PostTile } from "@/components/shared/PostTile";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/")({
  component: HomePage,
});

function HomePage() {
  const { isDesktop } = useBreakpoint();
  const routeConfig = useMemo(
    () => ({
      activeNavigationTab: "Home",
      desktopSearchBar: <div></div>,
      desktopRightButtonGroup: <div></div>,
      mobileSearchOverlay: <div></div>,
    }),
    []
  );
  useRouteSetup(routeConfig);

  return (
    <Stack
      flex={1}
      alignItems="center"
      overflow="auto"
      padding={isDesktop ? 1 : 0}
      gap={isDesktop ? "1.75rem" : 2}
    >
      <PostTile />
      <PostTile />
      <PostTile />
      <PostTile />
    </Stack>
  );
}

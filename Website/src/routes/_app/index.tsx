import { createFileRoute } from "@tanstack/react-router";

import Stack from "@mui/material/Stack";

import { useBreakpoint } from "@/hooks/shared/useBreakpoint";
import { PostTile } from "@/components/shared/PostTile";

export const Route = createFileRoute("/_app/")({
  component: HomePage,
});

function HomePage() {
  const { isDesktop } = useBreakpoint();

  return (
    <Stack
      flex={1}
      alignItems="center"
      overflow="auto"
      padding={isDesktop ? 1 : 0}
      gap={isDesktop ? 3.5 : 2}
    >
      <PostTile />
      <PostTile />
      <PostTile />
      <PostTile />
    </Stack>
  );
}

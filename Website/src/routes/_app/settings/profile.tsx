import { createFileRoute } from "@tanstack/react-router";

import Stack from "@mui/material/Stack";

import { useDeviceType } from "@/hooks/shared/useDeviceType";

export const Route = createFileRoute("/_app/settings/profile")({
  component: ProfileSettings,
});

function ProfileSettings() {
  const { isDesktop } = useDeviceType();
  return <Stack sx={{ flex: 1, padding: isDesktop ? 2 : 1 }} />;
}

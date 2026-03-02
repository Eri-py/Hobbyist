import { createFileRoute } from "@tanstack/react-router";

import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { DesktopLayout } from "@/components/app/Layout/DesktopLayout";
import { MobileLayout } from "@/components/app/Layout/MobileLayout";
import { AppProvider } from "@/providers/app/AppProvider";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { isDesktop } = useDeviceType();

  return <AppProvider>{isDesktop ? <DesktopLayout /> : <MobileLayout />}</AppProvider>;
}

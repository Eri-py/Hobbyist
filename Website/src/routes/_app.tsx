import { createFileRoute } from "@tanstack/react-router";

import { ResponsiveLayout } from "@/components/app/Layout/ResponsiveLayout";
import { AppProvider } from "@/providers/app/AppProvider";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppProvider>
      <ResponsiveLayout />
    </AppProvider>
  );
}

import { createFileRoute } from "@tanstack/react-router";

import Stack from "@mui/material/Stack";

import { FeatureGate } from "@/components/shared/FeatureGate";
import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { FeatureFlags } from "@hobbyist/types";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_app/trade")({
  head: () => seo({ title: "Trade", noindex: true }),
  component: () => (
    <FeatureGate flag={FeatureFlags.Trade}>
      <TradePage />
    </FeatureGate>
  ),
});

function TradePage() {
  const { isDesktop } = useDeviceType();
  return <Stack sx={{ flex: 1, padding: isDesktop ? 2 : 1 }} />;
}

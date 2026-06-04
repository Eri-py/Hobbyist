import { createFileRoute } from "@tanstack/react-router";
import { FeatureGate } from "@/components/shared/FeatureGate";
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
  return <div>User is trying to trade</div>;
}

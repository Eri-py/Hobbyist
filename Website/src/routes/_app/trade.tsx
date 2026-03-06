import { createFileRoute } from "@tanstack/react-router";
import { FeatureGate } from "@/components/shared/FeatureGate";
import { FeatureFlags } from "@hobbyist/types";

export const Route = createFileRoute("/_app/trade")({
  component: () => (
    <FeatureGate flag={FeatureFlags.Trade}>
      <TradePage />
    </FeatureGate>
  ),
});

function TradePage() {
  return <div>User is trying to trade</div>;
}

import { createFileRoute } from "@tanstack/react-router";
import { FeatureGate } from "@/components/shared/FeatureGate";
import { FeatureFlags } from "@hobbyist/types";

export const Route = createFileRoute("/_app/messages")({
  component: () => (
    <FeatureGate flag={FeatureFlags.Messages}>
      <MessagesPage />
    </FeatureGate>
  ),
});

function MessagesPage() {
  return <div>User opened their messages</div>;
}

import { createFileRoute } from "@tanstack/react-router";
import { FeatureGate } from "@/components/shared/FeatureGate";
import { FeatureFlags } from "@hobbyist/types";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_app/messages")({
  head: () => seo({ title: "Messages", noindex: true }),
  component: () => (
    <FeatureGate flag={FeatureFlags.Messages}>
      <MessagesPage />
    </FeatureGate>
  ),
});

function MessagesPage() {
  return <div>User opened their messages</div>;
}

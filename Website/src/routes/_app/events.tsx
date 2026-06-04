import { createFileRoute } from "@tanstack/react-router";
import { FeatureGate } from "@/components/shared/FeatureGate";
import { FeatureFlags } from "@hobbyist/types";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_app/events")({
  head: () => seo({ title: "Events", noindex: true }),
  component: () => (
    <FeatureGate flag={FeatureFlags.Events}>
      <EventsPage />
    </FeatureGate>
  ),
});

function EventsPage() {
  return <div>User is trying to view events</div>;
}

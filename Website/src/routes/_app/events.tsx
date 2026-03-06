import { createFileRoute } from "@tanstack/react-router";
import { FeatureGate } from "@/components/shared/FeatureGate";
import { FeatureFlags } from "@hobbyist/types";

export const Route = createFileRoute("/_app/events")({
  component: () => (
    <FeatureGate flag={FeatureFlags.Events}>
      <EventsPage />
    </FeatureGate>
  ),
});

function EventsPage() {
  return <div>User is trying to view events</div>;
}

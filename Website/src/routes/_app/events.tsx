import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/events")({
  component: EventsPage,
});

function EventsPage() {
  return <div>User is trying to view events</div>;
}

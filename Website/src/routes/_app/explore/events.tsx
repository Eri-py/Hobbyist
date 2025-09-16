import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/explore/events")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/explore/events"!</div>;
}

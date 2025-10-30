import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/messages")({
  component: MessagesPage,
});

function MessagesPage() {
  return <div>User opened their messages</div>;
}

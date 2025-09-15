import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/create")({
  component: CreatePage,
});

function CreatePage() {
  return <div>User is trying to create a post</div>;
}

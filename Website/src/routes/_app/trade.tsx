import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/trade")({
  component: TradePage,
});

function TradePage() {
  return <div>User is trying to trade</div>;
}

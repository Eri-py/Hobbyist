import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { useNavigation } from "@/hooks/app/useNavigation";

export const Route = createFileRoute("/_app/events")({
  component: RouteComponent,
});

function RouteComponent() {
  const { setActiveTab } = useNavigation();

  // Set active navigation tab
  useEffect(() => {
    setActiveTab("Events");
  }, [setActiveTab]);

  return <div>User is trying to view events</div>;
}

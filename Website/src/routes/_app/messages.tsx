import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { useNavigation } from "@/hooks/app/useNavigation";

export const Route = createFileRoute("/_app/messages")({
  component: RouteComponent,
});

function RouteComponent() {
  const { setActiveTab } = useNavigation();

  // Set active navigation tab
  useEffect(() => {
    setActiveTab("Messages");
  }, [setActiveTab]);

  return <div>User opened their messages</div>;
}

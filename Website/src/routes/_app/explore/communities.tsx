import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useNavigation } from "@/hooks/app/useNavigation";
import { useBreakpoint } from "@/hooks/shared/useBreakpoint";

export const Route = createFileRoute("/_app/explore/communities")({
  component: CommunitiesPage,
});

function CommunitiesPage() {
  const { setActiveTab } = useNavigation();
  const { isDesktop } = useBreakpoint();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDesktop) {
      navigate({ to: "/" });
    }
  });

  useEffect(() => {
    setActiveTab("Explore");
  }, [setActiveTab]);

  return <div>User clicked explore and is on the communities tab</div>;
}

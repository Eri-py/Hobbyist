import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { useNavigation } from "@/hooks/app/useNavigation";

export const Route = createFileRoute("/_app/create")({
  component: CreatePage,
});

function CreatePage() {
  const { setActiveTab } = useNavigation();

  // Set active navigation tab
  useEffect(() => {
    setActiveTab("Create");
  }, [setActiveTab]);

  return <div>User is trying to create a post</div>;
}

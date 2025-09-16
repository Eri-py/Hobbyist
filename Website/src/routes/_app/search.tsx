import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod/v4";

import { useNavigation } from "@/hooks/app/useNavigation";

const validSearchSchema = z.object({
  q: z.string(),
});

export const Route = createFileRoute("/_app/search")({
  component: Search,
  validateSearch: validSearchSchema,
});

function Search() {
  const { q } = Route.useSearch();
  const { setActiveTab } = useNavigation();

  // Set active navigation tab - you might want to keep the previous tab active instead
  useEffect(() => {
    setActiveTab("Search");
  }, [setActiveTab]);

  return (
    <div>
      User is searching for <b>{q}</b>
    </div>
  );
}

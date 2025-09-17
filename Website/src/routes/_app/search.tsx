import { useRouteSetup } from "@/hooks/app/useRouteSetup";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod/v4";

const validSearchSchema = z.object({
  q: z.string(),
});

export const Route = createFileRoute("/_app/search")({
  component: SearchPage,
  validateSearch: validSearchSchema,
});

function SearchPage() {
  const { q } = Route.useSearch();

  const routeConfig = useMemo(
    () => ({
      activeNavigationTab: "Search",
      desktopSearchBar: <div></div>,
      desktopRightButtonGroup: <div></div>,
      mobileSearchOverlay: <div></div>,
    }),
    []
  );
  useRouteSetup(routeConfig);

  return (
    <div>
      User is searching for <b>{q}</b>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { FeatureGate } from "@/components/shared/FeatureGate";
import { FeatureFlags } from "@hobbyist/types";
import { seo } from "@/lib/seo";

const validSearchSchema = z.object({
  q: z.string(),
});

export const Route = createFileRoute("/_app/search")({
  head: () => seo({ title: "Search", noindex: true }),
  component: () => (
    <FeatureGate flag={FeatureFlags.Search}>
      <SearchPage />
    </FeatureGate>
  ),
  validateSearch: validSearchSchema,
});

function SearchPage() {
  const { q } = Route.useSearch();

  return (
    <div>
      User is searching for <b>{q}</b>
    </div>
  );
}

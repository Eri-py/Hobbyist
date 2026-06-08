import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import Stack from "@mui/material/Stack";

import { FeatureGate } from "@/components/shared/FeatureGate";
import { useDeviceType } from "@/hooks/shared/useDeviceType";
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
  const { isDesktop } = useDeviceType();
  return <Stack sx={{ flex: 1, padding: isDesktop ? 2 : 1 }} />;
}

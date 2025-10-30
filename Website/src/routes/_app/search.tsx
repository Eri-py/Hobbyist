import { createFileRoute } from "@tanstack/react-router";
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

  return (
    <div>
      User is searching for <b>{q}</b>
    </div>
  );
}

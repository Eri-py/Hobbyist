// Builds meta/links for TanStack Router's `head` option; pairs with <HeadContent/> in __root.tsx.

const SITE_NAME = "Hobbyist";
const DEFAULT_TITLE = "Hobbyist — Social Trading for Collectors";
const DEFAULT_DESCRIPTION =
  "Hobbyist is a social trading platform for collectors. Share posts, list hobbies, and trade with trusted users.";

// Canonical/OG need an absolute origin; prefer build-time VITE_SITE_URL, fall back to runtime origin.
function getOrigin(): string {
  const envUrl = import.meta.env.VITE_SITE_URL as string | undefined;
  if (envUrl) return envUrl.replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

type SeoOptions = {
  /** Page-specific title; suffixed with the site name. Omit for the site default. */
  title?: string;
  description?: string;
  /** Absolute path for the canonical URL, e.g. "/login". Omit to skip canonical. */
  path?: string;
  /** Keep this route out of search indexes (e.g. settings, in-app screens). */
  noindex?: boolean;
};

export function seo({ title, description, path, noindex }: SeoOptions = {}) {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE;
  const desc = description ?? DEFAULT_DESCRIPTION;
  const origin = getOrigin();
  const canonical = path !== undefined && origin ? `${origin}${path}` : undefined;

  const meta = [
    { title: fullTitle },
    { name: "description", content: desc },
    { name: "robots", content: noindex ? "noindex, nofollow" : "index, follow" },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: desc },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE_NAME },
    ...(canonical ? [{ property: "og:url", content: canonical }] : []),
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: desc },
  ];

  const links = canonical ? [{ rel: "canonical", href: canonical }] : [];

  return { meta, links };
}

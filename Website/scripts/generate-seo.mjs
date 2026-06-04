// Generates public/robots.txt and public/sitemap.xml from VITE_SITE_URL.
// Runs before `vite build` (see package.json "build" script). The outputs are
// gitignored — they are regenerated on every build from the deploy environment.

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const websiteRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = resolve(websiteRoot, "public");

// Minimal .env reader so local `pnpm build` picks up VITE_SITE_URL without a
// dotenv dependency. Vercel/CI supply it via process.env, which takes priority.
function readEnvFile(name) {
  const filePath = resolve(websiteRoot, name);
  if (!existsSync(filePath)) return {};
  const out = {};
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const match = line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
    if (match) out[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const fileEnv = { ...readEnvFile(".env"), ...readEnvFile(".env.production") };
const siteUrl = (process.env.VITE_SITE_URL || fileEnv.VITE_SITE_URL || "").replace(/\/+$/, "");

if (!siteUrl) {
  console.warn(
    "[generate-seo] VITE_SITE_URL is not set — writing robots.txt without a Sitemap line and skipping sitemap.xml.\n" +
      "  Set VITE_SITE_URL to your production URL (e.g. in the Vercel project env) to enable the sitemap and canonical tags.",
  );
}

// Public, indexable routes only. App routes behind auth are intentionally excluded.
const routes = ["/", "/login", "/sign-up"];

mkdirSync(publicDir, { recursive: true });

const robots = [
  "User-agent: *",
  "Allow: /",
  ...(siteUrl ? ["", `Sitemap: ${siteUrl}/sitemap.xml`] : []),
  "",
].join("\n");
writeFileSync(resolve(publicDir, "robots.txt"), robots);
console.log("[generate-seo] wrote public/robots.txt");

if (siteUrl) {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = routes
    .map(
      (route) =>
        `  <url>\n    <loc>${siteUrl}${route}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`,
    )
    .join("\n");
  const sitemap =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${urls}\n` +
    "</urlset>\n";
  writeFileSync(resolve(publicDir, "sitemap.xml"), sitemap);
  console.log("[generate-seo] wrote public/sitemap.xml");
}

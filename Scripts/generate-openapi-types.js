import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const outputArgIndex = args.indexOf("--output");
const root = resolve(import.meta.dirname, "..");

if (outputArgIndex === -1 || !args[outputArgIndex + 1]) {
  console.error("Missing required --output argument.");
  console.error("Usage: node Scripts/generate-openapi-types.js --output <path>");
  process.exit(1);
}

const outputPath = resolve(process.cwd(), args[outputArgIndex + 1]);
const openApiUrl = resolveOpenApiUrl();

if (!openApiUrl) {
  console.error("Could not resolve OpenAPI URL.");
  console.error("Set one of the following:");
  console.error("  - OPENAPI_URL environment variable");
  console.error("  - VITE_API_BASE_URL in Website/.env.development");
  console.error("  - EXPO_PUBLIC_API_BASE_URL in Mobile/.env.development");
  process.exit(1);
}

const env = { ...process.env };

// Keep insecure TLS opt-in only for local/self-signed certificate workflows.
if (env.OPENAPI_INSECURE_TLS === "1") {
  env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const command = "openapi-typescript";
const result = spawnSync(command, [openApiUrl, "-o", outputPath], {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
});

if (result.error) {
  console.error(`Failed to run ${command}: ${result.error.message}`);
  process.exit(1);
}

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(1);

function resolveOpenApiUrl() {
  if (process.env.OPENAPI_URL) {
    return process.env.OPENAPI_URL;
  }

  const processApiBaseUrl = process.env.VITE_API_BASE_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL;
  if (processApiBaseUrl) {
    return toOpenApiUrl(processApiBaseUrl);
  }

  const websiteEnv = readEnvFile(resolve(root, "Website", ".env.development"));
  if (websiteEnv.VITE_API_BASE_URL) {
    return toOpenApiUrl(websiteEnv.VITE_API_BASE_URL);
  }

  const mobileEnv = readEnvFile(resolve(root, "Mobile", ".env.development"));
  if (mobileEnv.EXPO_PUBLIC_API_BASE_URL) {
    return toOpenApiUrl(mobileEnv.EXPO_PUBLIC_API_BASE_URL);
  }

  return null;
}

function toOpenApiUrl(apiBaseUrl) {
  const trimmed = apiBaseUrl.trim().replace(/\/+$/, "");
  const base = trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed;
  return `${base}/openapi/v1.json`;
}

function readEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const entries = {};
  const lines = readFileSync(filePath, "utf-8").split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    if (!key) {
      continue;
    }

    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
}

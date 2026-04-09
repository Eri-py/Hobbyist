// Copies config templates from Setup/ to their correct runtime locations.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = dirname(scriptPath);
const root = resolve(scriptDir, "..");

function copyTemplateFile(from, to) {
  if (!existsSync(from)) {
    console.warn(`Template not found: ${from}`);
    return;
  }

  if (existsSync(to)) {
    console.log(`Template not copied, file already exists: ${to}`);
    return;
  }

  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  console.log(`Copied ${from} -> ${to}`);
}

function copyMobileConfig() {
  const from = join(root, "Setup", "Mobile", ".env.development");
  const to = join(root, "Mobile", ".env.development");
  copyTemplateFile(from, to);
}

function copyWebsiteConfig() {
  const from = join(root, "Setup", "Website", ".env.development");
  const to = join(root, "Website", ".env.development");
  copyTemplateFile(from, to);
}

function ensureCertsDirectory() {
  const certsDir = join(root, "certs");
  if (!existsSync(certsDir)) {
    mkdirSync(certsDir, { recursive: true });
    console.log(`Created certs directory at ${certsDir}`);
  }
}

function copyWebServerConfig() {
  ensureCertsDirectory();

  const appSettingsFrom = join(root, "Setup", "WebServer", "appsettings.Development.json");
  const appSettingsTo = join(root, "WebServer", "Hobbyist.Api", "appsettings.Development.json");
  copyTemplateFile(appSettingsFrom, appSettingsTo);

  const featureFlagsFrom = join(root, "Setup", "WebServer", "featureflags.Development.json");
  const featureFlagsTo = join(root, "WebServer", "Hobbyist.Api", "featureflags.Development.json");
  copyTemplateFile(featureFlagsFrom, featureFlagsTo);
}

function main() {
  copyMobileConfig();
  copyWebsiteConfig();
  copyWebServerConfig();
}

main();

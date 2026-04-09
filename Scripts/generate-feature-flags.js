// Reads featureflags.json and generates:
//   - Services/FeatureFlags.cs         (C# constants for the backend)
//   - Shared/types/src/featureFlags.ts (TS constants for the frontend)
//
// Usage:  node Scripts/generate-feature-flags.js
//         pnpm generate-feature-flags

import { readFileSync, writeFileSync } from "fs";
import { resolve, join } from "path";

const root = resolve(import.meta.dirname, "..");
const jsonPath = join(root, "WebServer", "Hobbyist.Api", "featureflags.json");
const csOutputPath = join(root, "WebServer", "Hobbyist.Api", "Services", "FeatureFlags.cs");
const tsOutputPath = join(root, "Shared", "types", "src", "featureFlags.ts");

function readFeatureFlags() {
  const json = JSON.parse(readFileSync(jsonPath, "utf-8"));
  return Object.keys(json.FeatureManagement ?? {});
}

function generateCSharpFeatureFlags(flags) {
  const csLines = flags.map((name) => `    public const string ${name} = "${name}";`);

  const csContent = `// AUTO-GENERATED — do not edit manually.
// Regenerate by running: pnpm generate-feature-flags
// Source of truth: WebServer/Hobbyist.Api/featureflags.json

namespace Hobbyist.Api.Services;

public static class FeatureFlags
{
    // Usage in a controller:  [FeatureGate(FeatureFlags.MyFeature)]
    // Usage in a service:     await featureManager.IsEnabledAsync(FeatureFlags.MyFeature)
${csLines.join("\n")}
}
`;

  writeFileSync(csOutputPath, csContent, "utf-8");
  console.log(`Generated ${csOutputPath} with ${flags.length} flag(s): ${flags.join(", ")}`);
}

function generateTypeScriptFeatureFlags(flags) {
  const tsLines = flags.map((name) => `  ${name}: "${name}",`);

  const tsContent = `// AUTO-GENERATED — do not edit manually.
// Regenerate by running: pnpm generate-feature-flags
// Source of truth: WebServer/Hobbyist.Api/featureflags.json

export const FeatureFlags = {
${tsLines.join("\n")}
} as const;

export type FeatureFlag = (typeof FeatureFlags)[keyof typeof FeatureFlags];
`;

  writeFileSync(tsOutputPath, tsContent, "utf-8");
  console.log(`Generated ${tsOutputPath} with ${flags.length} flag(s): ${flags.join(", ")}`);
}

function main() {
  const flags = readFeatureFlags();

  if (flags.length === 0) {
    console.warn("No flags found in FeatureManagement — output files will be empty.");
  }

  generateCSharpFeatureFlags(flags);
  generateTypeScriptFeatureFlags(flags);
}

main();

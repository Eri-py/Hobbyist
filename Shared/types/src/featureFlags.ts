// AUTO-GENERATED — do not edit manually.
// Regenerate by running: pnpm generate-feature-flags
// Source of truth: WebServer/Hobbyist.Api/featureflags.json

export const FeatureFlags = {
  Trade: "Trade",
  Events: "Events",
  Messages: "Messages",
  Search: "Search",
  Create: "Create",
} as const;

export type FeatureFlag = (typeof FeatureFlags)[keyof typeof FeatureFlags];

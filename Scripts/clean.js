import { rmSync } from "fs";

const pathsToRemove = [
  "node_modules",
  "Mobile/node_modules",
  "Mobile/.expo",
  "Mobile/dist",
  "Website/node_modules",
  "Website/dist",
  "Website/.tanstack",
  "Shared/form-schemas/node_modules",
  "Shared/hooks/node_modules",
  "Shared/types/node_modules",
];

pathsToRemove.forEach((path) => {
  try {
    rmSync(path, { recursive: true, force: true });
    console.log(`Removed ${path}`);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(`Failed to remove ${path}:`, error.message);
    }
  }
});

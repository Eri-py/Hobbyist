// Copies config templates from Setup/ to their correct locations
import { existsSync, copyFileSync } from "fs";
import { resolve, join } from "path";

const root = resolve(__dirname, "..");

// Ensure certs folder exists (not git committed)
const certsDir = path.join(root, "certs");
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir);
  console.log(`Created certs directory at ${certsDir}`);
}

const copies = [
  {
    from: join(root, "Setup", "appsettings.Development.Example.json"),
    to: join(root, "WebServer", "Hobbyist.Api", "appsettings.Development.json"),
  },
  {
    from: join(root, "Setup", ".env.development.website"),
    to: join(root, "Website", ".env.development"),
  },
  {
    from: join(root, "Setup", ".env.development.mobile"),
    to: join(root, "Mobile", ".env.development"),
  },
];

for (const { from, to } of copies) {
  if (!existsSync(from)) {
    console.warn(`Template not found: ${from}`);
    continue;
  }
  copyFileSync(from, to);
  console.log(`Copied ${from} -> ${to}`);
}

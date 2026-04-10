import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = dirname(scriptPath);
const root = resolve(scriptDir, "..");
const projectRoot = join(root, "Mobile");
const envFilePath = join(projectRoot, ".env.development");
const envKey = "REACT_NATIVE_PACKAGER_HOSTNAME";

function stripWrappingQuotes(value) {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];

    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }

  return value;
}

function getEnvValueFromFile(fileContents, key) {
  const lines = fileContents.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");

    if (equalsIndex <= 0) {
      continue;
    }

    const parsedKey = trimmed.slice(0, equalsIndex).trim();

    if (parsedKey !== key) {
      continue;
    }

    const parsedValue = trimmed.slice(equalsIndex + 1).trim();

    if (!parsedValue) {
      return undefined;
    }

    return stripWrappingQuotes(parsedValue);
  }

  return undefined;
}

function loadPackagerHostFromEnvFile() {
  if (!existsSync(envFilePath)) {
    return undefined;
  }

  const envFileContents = readFileSync(envFilePath, "utf8");
  return getEnvValueFromFile(envFileContents, envKey);
}

const hostValue = loadPackagerHostFromEnvFile();

if (hostValue) {
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME = hostValue;
  console.log(`[mobile:dev:host] Using ${envKey}=${hostValue}`);
} else {
  console.log(
    `[mobile:dev:host] ${envKey} not found in .env.development; starting Expo without host pinning.`,
  );
}

const forwardedArgs = process.argv.slice(2);
const command = process.platform === "win32" ? "cmd.exe" : "pnpm";
const args =
  process.platform === "win32"
    ? ["/d", "/s", "/c", "pnpm.cmd", "exec", "expo", "start", ...forwardedArgs]
    : ["exec", "expo", "start", ...forwardedArgs];

const child = spawn(command, args, {
  cwd: projectRoot,
  stdio: "inherit",
  env: { ...process.env },
});

child.on("error", (error) => {
  console.error("[mobile:dev:host] Failed to start Expo:", error);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

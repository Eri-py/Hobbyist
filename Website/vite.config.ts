/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "path";
import fs from "fs";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    plugins: [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      }),
      react(),
    ],
    server:
      mode === "development"
        ? {
            host: env.VITE_TAILSCALE_HOST,
            port: 3000,
            https: {
              cert: fs.readFileSync(
                path.resolve(__dirname, `../certs/${env.VITE_TAILSCALE_HOST}.crt`),
              ),
              key: fs.readFileSync(
                path.resolve(__dirname, `../certs/${env.VITE_TAILSCALE_HOST}.key`),
              ),
            },
          }
        : undefined,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      server: {
        deps: {
          // Test-only: MUI's ESM build directory-imports react-transition-group/TransitionGroupContext,
          // which Node-ESM rejects when MUI is externalized. Inlining MUI lets vite resolve it.
          inline: ["@mui/material"],
        },
      },
    },
  };
});

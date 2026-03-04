import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "path";
import fs from "fs";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
  ],
  server: {
    host: true,
    port: 3000,
    https: {
      cert: fs.readFileSync(path.resolve(__dirname, "../certs/tail453415.ts.net.crt")),
      key: fs.readFileSync(path.resolve(__dirname, "../certs/tail453415.ts.net.key")),
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

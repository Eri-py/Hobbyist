const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
        alias: {
          map: [
            ["@", "./src"],
            ["@/components", "./src/components"],
            ["@/hooks", "./src/hooks"],
            ["@/api", "./src/api"],
            ["@/types", "./src/types"],
            ["@/providers", "./src/providers"],
            ["@/themes", "./src/themes"],
          ],
          extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
        },
      },
    },
  },
]);

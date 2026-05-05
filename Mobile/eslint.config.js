const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      "import/no-named-as-default-member": "off",
    },
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
            ["@/screens", "./src/screens"],
          ],
          extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
        },
      },
    },
  },
]);

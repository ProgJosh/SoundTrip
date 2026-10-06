const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      "dist/**",
      "dist-native/**",
      "android/**",
      "ios/**",
      ".local/**",
      "node_modules/**",
      "test-results/**",
    ],
  },
]);

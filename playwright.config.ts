import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
const configured = existsSync(".env.local");
if (configured) process.loadEnvFile(".env.local");
const deploymentURL = process.env.SOUNDTRIP_TEST_URL;
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: deploymentURL || "http://127.0.0.1:8081",
    headless: true,
    channel: "msedge",
    viewport: { width: 1440, height: 1000 },
  },
  webServer: deploymentURL
    ? undefined
    : [
        {
          command: "npm run preview",
          url: "http://127.0.0.1:8081",
          reuseExistingServer: true,
          timeout: 30000,
        },
        ...(configured && process.env.DATABASE_URL
          ? [
              {
                command: "npm run api",
                url: "http://127.0.0.1:8787/health",
                reuseExistingServer: true,
                timeout: 30000,
              },
            ]
          : []),
      ],
  reporter: "list",
});

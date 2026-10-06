import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

// Deployment intentionally ignores development .env.local and its loopback endpoints.
// Set public build variables in Cloudflare Builds or an ignored .env.production file.
const production = existsSync(".env.production")
  ? parseEnv(readFileSync(".env.production", "utf8"))
  : {};
const env = {
  ...process.env,
  ...production,
  EXPO_NO_DOTENV: "1",
  NODE_ENV: "production",
};
const urls = [
  "EXPO_PUBLIC_API_URL",
  "EXPO_PUBLIC_NEON_AUTH_URL",
  "EXPO_PUBLIC_ACCOUNT_ORIGIN",
  "EXPO_PUBLIC_SPOTIFY_REDIRECT_URI",
];
for (const key of urls) {
  env[key] ||= "";
  if (!env[key]) continue;
  const url = new URL(env[key]);
  if (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    env[key] = "";
    console.log(`Omitting local-only ${key} from the hosted build.`);
    continue;
  }
  if (url.protocol !== "https:")
    throw new Error(
      `${key} must use a public HTTPS URL for Cloudflare hosting.`,
    );
}
env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ||= "";
if (
  env.EXPO_PUBLIC_NEON_AUTH_URL &&
  (!env.EXPO_PUBLIC_API_URL || !env.EXPO_PUBLIC_ACCOUNT_ORIGIN)
)
  throw new Error(
    "Production account sync needs a deployed API URL and trusted account origin.",
  );
if (env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID && !env.EXPO_PUBLIC_SPOTIFY_REDIRECT_URI)
  throw new Error(
    "Production Spotify OAuth needs its exact registered HTTPS redirect URI.",
  );

async function run(relativePath, args = []) {
  const filename = fileURLToPath(new URL(relativePath, import.meta.url));
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [filename, ...args], {
      env,
      stdio: "inherit",
      windowsHide: true,
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`Cloudflare build failed (${code}).`)),
    );
  });
}
await run("../node_modules/expo/bin/cli", ["export", "--platform", "web"]);
await run("./offline-shell.mjs");

// Builds SoundTrip for Android from a freshly generated native project.
//
//   node scripts/build-android.mjs bundle          Play Store .aab (needs upload key)
//   node scripts/build-android.mjs apk [--abi x86_64]  release .apk for device/emulator tests
//
// Like the Cloudflare build, this ignores development .env.local and its
// loopback endpoints. Public build values come from the shell or an ignored
// .env.production file.
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { parseEnv } from "node:util";
import { spawnSync } from "node:child_process";

const mode = process.argv[2] || "bundle";
if (!["bundle", "apk"].includes(mode))
  throw new Error("Usage: build-android.mjs bundle|apk [--abi <abi>]");
const abiFlag = process.argv.indexOf("--abi");
const abi = abiFlag > 0 ? process.argv[abiFlag + 1] : undefined;
const root = resolve(import.meta.dirname, "..");
const windows = process.platform === "win32";

const production = existsSync(join(root, ".env.production"))
  ? parseEnv(readFileSync(join(root, ".env.production"), "utf8"))
  : {};
const env = {
  ...process.env,
  ...production,
  EXPO_NO_DOTENV: "1",
  NODE_ENV: "production",
};
for (const key of [
  "EXPO_PUBLIC_API_URL",
  "EXPO_PUBLIC_NEON_AUTH_URL",
  "EXPO_PUBLIC_ACCOUNT_ORIGIN",
  "EXPO_PUBLIC_SPOTIFY_REDIRECT_URI",
]) {
  env[key] ||= "";
  if (!env[key]) continue;
  const url = new URL(env[key]);
  if (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    env[key] = "";
    console.log(`Omitting local-only ${key} from the Android build.`);
  } else if (url.protocol !== "https:")
    throw new Error(`${key} must use a public HTTPS URL for a store build.`);
}
env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ||= "";
if (
  env.EXPO_PUBLIC_NEON_AUTH_URL &&
  (!env.EXPO_PUBLIC_API_URL || !env.EXPO_PUBLIC_ACCOUNT_ORIGIN)
)
  throw new Error(
    "Account sync needs a deployed API URL and trusted account origin.",
  );
if (env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID && !env.EXPO_PUBLIC_SPOTIFY_REDIRECT_URI)
  throw new Error(
    "Spotify OAuth needs its exact registered HTTPS redirect URI.",
  );

// Toolchain: JDK 17 and the Android SDK.
const localJava = join(root, ".local", "java-home.txt");
if (existsSync(localJava))
  env.JAVA_HOME = readFileSync(localJava, "utf8").trim();
if (!env.JAVA_HOME) throw new Error("Set JAVA_HOME to a JDK 17 installation.");
env.ANDROID_HOME ||=
  env.ANDROID_SDK_ROOT ||
  (windows
    ? join(env.LOCALAPPDATA || "", "Android", "Sdk")
    : join(homedir(), "Android", "Sdk"));
if (!existsSync(env.ANDROID_HOME))
  throw new Error(`Android SDK not found at ${env.ANDROID_HOME}.`);

function signingValue(name) {
  if (env[name]) return env[name];
  const file = join(
    env.GRADLE_USER_HOME || join(homedir(), ".gradle"),
    "gradle.properties",
  );
  if (!existsSync(file)) return undefined;
  const line = readFileSync(file, "utf8")
    .split(/\r?\n/)
    .find((l) => l.trim().startsWith(`${name}=`));
  return line?.slice(line.indexOf("=") + 1).trim();
}
const uploadKey = signingValue("SOUNDTRIP_UPLOAD_STORE_FILE");
if (mode === "bundle") {
  if (!uploadKey)
    throw new Error(
      "No Play upload key configured. See docs/PLAY_STORE.md, step 1.",
    );
  if (!existsSync(uploadKey))
    throw new Error(`Upload keystore not found: ${uploadKey}`);
}

function run(command, args, cwd = root) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd,
    env,
    stdio: "inherit",
    shell: windows,
    windowsHide: true,
  });
  if (result.status !== 0)
    throw new Error(`${command} failed with exit code ${result.status}.`);
}

const app = JSON.parse(readFileSync(join(root, "app.json"), "utf8")).expo;
console.log(
  `SoundTrip ${app.version} (versionCode ${app.android.versionCode}) · ${mode}`,
);
run("npx", [
  "expo",
  "prebuild",
  "--platform",
  "android",
  "--clean",
  "--no-install",
]);
const android = join(root, "android");
const gradleArgs = [
  mode === "bundle" ? ":app:bundleRelease" : ":app:assembleRelease",
  "--no-daemon",
  ...(abi ? [`-PreactNativeArchitectures=${abi}`] : []),
];
run(
  windows ? `"${join(android, "gradlew.bat")}"` : join(android, "gradlew"),
  gradleArgs,
  android,
);

const outputs = join(root, "android", "app", "build", "outputs");
const built =
  mode === "bundle"
    ? join(outputs, "bundle/release/app-release.aab")
    : join(outputs, "apk/release/app-release.apk");
const outDir = join(root, "dist-android");
mkdirSync(outDir, { recursive: true });
const name = `soundtrip-${app.version}-${app.android.versionCode}${abi ? `-${abi}` : ""}.${mode === "bundle" ? "aab" : "apk"}`;
const target = join(outDir, name);
copyFileSync(built, target);

// Confirm what actually signed the artifact. Bundles carry a JAR signature;
// APKs for minSdk 24+ only carry v2/v3 signatures, which need apksigner.
let owner = "unknown",
  sha = "unknown";
if (mode === "bundle") {
  const keytool = join(
    env.JAVA_HOME,
    "bin",
    windows ? "keytool.exe" : "keytool",
  );
  const out =
    spawnSync(keytool, ["-printcert", "-jarfile", target], {
      env,
      encoding: "utf8",
    }).stdout || "";
  owner = /Owner: (.*)/.exec(out)?.[1] || owner;
  sha = /SHA256: (.*)/.exec(out)?.[1] || sha;
} else {
  const tools = join(env.ANDROID_HOME, "build-tools");
  const version = readdirSync(tools)
    .filter((v) => /^\d+\.\d+\.\d+$/.test(v))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .pop();
  if (!version) throw new Error(`No Android build-tools found in ${tools}.`);
  const apksigner = join(
    tools,
    version,
    windows ? "apksigner.bat" : "apksigner",
  );
  const out =
    spawnSync(
      apksigner,
      ["verify", "--print-certs", windows ? `"${target}"` : target],
      {
        env,
        encoding: "utf8",
        shell: windows,
      },
    ).stdout || "";
  owner = /certificate DN: (.*)/.exec(out)?.[1] || owner;
  sha = /certificate SHA-256 digest: (.*)/.exec(out)?.[1] || sha;
}
const debugSigned = /Android Debug/i.test(owner);
console.log(`\nBuilt ${target}\nSigner: ${owner}\nSHA-256: ${sha}`);
if (mode === "bundle" && debugSigned)
  throw new Error(
    "The bundle is signed with the debug key; Play will reject it.",
  );
if (debugSigned)
  console.log("This APK uses the development key: for testing only.");

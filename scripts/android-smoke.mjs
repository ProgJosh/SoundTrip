// Release smoke test across Android versions, on headless emulators.
//
//   node scripts/android-smoke.mjs --apk dist-android/<file>.apk --avd st_api24 --avd st_api36
//
// For each emulator: cold boot with wiped data, install the APK, finish
// onboarding, import a generated WAV through Android's own document picker,
// play it, send the app to the background, and confirm the media session is
// still playing and the process never crashed. Screenshots and a JSON report
// go to test-results/android/.
import { Buffer } from "node:buffer";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const PACKAGE = "app.soundtrip.player";
const root = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const values = (flag) =>
  args.flatMap((a, i) => (a === flag && args[i + 1] ? [args[i + 1]] : []));
const apk = values("--apk")[0];
const avds = values("--avd");
// Host GPU keeps Android 13+ responsive; pass --gpu swiftshader_indirect on
// machines without a usable GPU.
const gpu = values("--gpu")[0] || "host";
if (!apk || !existsSync(apk) || !avds.length)
  throw new Error(
    "Usage: android-smoke.mjs --apk <release.apk> --avd <name> [--avd <name> ...]",
  );
const sdk =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  join(process.env.LOCALAPPDATA || "", "Android", "Sdk");
const exe = process.platform === "win32" ? ".exe" : "";
const adbPath = join(sdk, "platform-tools", `adb${exe}`);
const emulatorPath = join(sdk, "emulator", `emulator${exe}`);
const outRoot = join(root, "test-results", "android");
mkdirSync(outRoot, { recursive: true });

function wav() {
  const rate = 16000,
    seconds = 180, // outlasts the slowest emulator run
    data = Buffer.alloc(44 + rate * seconds * 2);
  data.write("RIFF", 0);
  data.writeUInt32LE(data.length - 8, 4);
  data.write("WAVEfmt ", 8);
  data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20);
  data.writeUInt16LE(1, 22);
  data.writeUInt32LE(rate, 24);
  data.writeUInt32LE(rate * 2, 28);
  data.writeUInt16LE(2, 32);
  data.writeUInt16LE(16, 34);
  data.write("data", 36);
  data.writeUInt32LE(data.length - 44, 40);
  for (let i = 0; i < rate * seconds; i++)
    data.writeInt16LE(
      Math.round(Math.sin((i * 220 * 2 * Math.PI) / rate) * 800),
      44 + i * 2,
    );
  return data;
}
const audioFile = join(outRoot, "SoundTrip - Smoke Test.wav");
writeFileSync(audioFile, wav());

async function smoke(avd, port) {
  const serial = `emulator-${port}`;
  const out = join(outRoot, avd);
  mkdirSync(out, { recursive: true });
  const steps = [];
  const adb = (...a) =>
    spawnSync(adbPath, ["-s", serial, ...a], {
      encoding: "utf8",
      // A wedged emulator must fail the run, not hang it.
      timeout: 120000,
      maxBuffer: 64 * 1024 * 1024,
    });
  const shell = (cmd) => adb("shell", cmd).stdout || "";
  const step = (name, ok, detail = "") => {
    steps.push({ name, ok, detail });
    console.log(
      `  ${ok ? "PASS" : "FAIL"} ${name}${detail ? ` · ${detail}` : ""}`,
    );
    return ok;
  };
  const screenshot = (name) => {
    const r = spawnSync(
      adbPath,
      ["-s", serial, "exec-out", "screencap", "-p"],
      {
        maxBuffer: 64 * 1024 * 1024,
        timeout: 60000,
      },
    );
    if (r.stdout?.length) writeFileSync(join(out, `${name}.png`), r.stdout);
  };
  const nodes = () => {
    shell("uiautomator dump /data/local/tmp/st-ui.xml >/dev/null 2>&1");
    const xml = shell("cat /data/local/tmp/st-ui.xml");
    return [...xml.matchAll(/<node [^>]*>/g)].map(([n]) => {
      const attr = (k) => new RegExp(`${k}="([^"]*)"`).exec(n)?.[1] || "";
      const [x1, y1, x2, y2] = (attr("bounds").match(/\d+/g) || []).map(Number);
      return {
        text: attr("text"),
        desc: attr("content-desc"),
        pkg: attr("package"),
        id: attr("resource-id"),
        focused: attr("focused") === "true",
        enabled: attr("enabled") !== "false",
        x: Math.round((x1 + x2) / 2),
        y: Math.round((y1 + y2) / 2),
      };
    });
  };
  const find = async (match, timeout = 20000, textOnly = false) => {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const all = nodes();
      // Slow emulators sometimes show "System UI isn't responding" over the
      // app. That is the emulator, not SoundTrip: choose Wait and carry on.
      if (all.some((n) => / isn.t responding$/.test(n.text))) {
        const wait = all.find((n) => n.text === "Wait");
        if (wait) shell(`input tap ${wait.x} ${wait.y}`);
        await sleep(1500);
        continue;
      }
      const hit = all.find(
        (n) => n.enabled && (match(n.text) || (!textOnly && match(n.desc))),
      );
      if (hit) return hit;
      await sleep(1000);
    }
    return undefined;
  };
  const tap = async (label, timeout) => {
    const hit = await find(
      typeof label === "string" ? (v) => v === label : (v) => label.test(v),
      timeout,
    );
    if (hit) shell(`input tap ${hit.x} ${hit.y}`);
    return !!hit;
  };
  // uiautomator omits off-screen views, so scroll the app until a label shows.
  const screenHeight = () =>
    Number(/(\d+)x(\d+)\s*$/.exec(shell("wm size").trim())?.[2]) || 2000;
  const scrollFind = async (label, tries = 10) => {
    const match =
      typeof label === "string" ? (v) => v === label : (v) => label.test(v);
    const height = screenHeight();
    for (let i = 0; i < tries; i++) {
      const hit = await find(match, 2500);
      // The mini-player and tab bar cover the bottom of the screen, so only
      // accept a target in the upper part, read after the list has settled.
      if (hit && hit.y > height * 0.12 && hit.y < height * 0.6) {
        await sleep(800);
        const settled = await find(match, 2500);
        if (settled && settled.y < height * 0.6) return settled;
      }
      const from = Math.round(height * 0.65),
        to = Math.round(height * (hit ? 0.4 : 0.2));
      shell(`input swipe 540 ${from} 540 ${to} 1000`);
      await sleep(1500);
    }
    return undefined;
  };
  // The picker's roots live in a drawer that may already be open. Emulators
  // are slow to dump the UI, so these waits are generous.
  const openRoot = async (name) => {
    const visible = (await find((v) => name.test(v), 3000)) !== undefined;
    if (!visible && (await tap(/^Show roots$|^Open navigation drawer$/, 5000)))
      await sleep(2000);
    const ok = await tap(name, 6000);
    await sleep(3000);
    return ok;
  };
  const pickFile = async () => {
    // Match the filename text only: grid views also have a "Preview …"
    // button whose description contains the name.
    // Grid labels can be truncated ("SoundTrip - S…"), so match the prefix and
    // ignore SoundTrip's own screen, which also mentions "SoundTrip".
    const file = async (t = 10000) => {
      const end = Date.now() + t;
      while (Date.now() < end) {
        const hit = nodes().find(
          (n) =>
            n.enabled &&
            n.pkg !== PACKAGE &&
            (n.text.startsWith("SoundTrip - ") ||
              n.text.includes("Smoke Test") ||
              n.desc.startsWith("SoundTrip - ")),
        );
        if (hit) return hit;
        await sleep(1000);
      }
      return undefined;
    };
    let hit = await file(6000);
    // Android 9+ Downloads lists the folder itself.
    if (!hit && (await openRoot(/^Downloads?$/))) hit = await file();
    // Android 7/8 Downloads only lists download-manager files; use Audio.
    if (!hit && (await openRoot(/^Audio$/))) {
      hit = await file(5000);
      if (!hit && (await tap(/^Download$|unknown/i, 5000))) hit = await file();
    }
    // Last resort: browse internal storage.
    if (!hit && (await tap("More options", 4000))) {
      await sleep(1000);
      if (await tap(/^Show internal storage$/, 4000)) await sleep(1500);
      else shell("input keyevent 111"); // Escape closes only the menu.
      if (await openRoot(/built for|^Internal storage$|^Android SDK/))
        for (let i = 0; i < 3 && !hit; i++) {
          await sleep(2000);
          if (await tap(/^Download$/, 6000)) hit = await file();
        }
    }
    return hit;
  };
  const alive = () =>
    /\d/.test(shell(`pidof ${PACKAGE}`)) || shell("ps").includes(PACKAGE);
  // Playing if the media session reports state 3 (Android 14+ prints
  // "PLAYING(3)"), or the mini-player shows a
  // Pause control. Media session dumps are unreliable on some Android builds.
  const playing = () => {
    const session = shell("dumpsys media_session");
    const sessionPlaying =
      /state=PlaybackState \{state=(?:3|PLAYING\(3\))[,\s]/.test(session) &&
      session.includes(PACKAGE);
    return (
      sessionPlaying ||
      nodes().some((n) => n.desc === "Pause" || n.text === "Pause")
    );
  };

  console.log(`\n${avd}`);
  const emulator = spawn(
    emulatorPath,
    [
      "-avd",
      avd,
      "-port",
      String(port),
      "-no-window",
      "-no-audio",
      "-no-snapshot",
      "-no-boot-anim",
      "-wipe-data",
      "-gpu",
      gpu,
    ],
    { stdio: "ignore", windowsHide: true },
  );
  try {
    spawnSync(adbPath, ["-s", serial, "wait-for-device"], { timeout: 180000 });
    const bootEnd = Date.now() + 420000;
    while (
      Date.now() < bootEnd &&
      shell("getprop sys.boot_completed").trim() !== "1"
    )
      await sleep(3000);
    const release = shell("getprop ro.build.version.release").trim();
    const api = shell("getprop ro.build.version.sdk").trim();
    if (!step("boot", !!api, `Android ${release} (API ${api})`))
      return { avd, steps };
    await sleep(8000);
    for (const k of [
      "window_animation_scale",
      "transition_animation_scale",
      "animator_duration_scale",
    ])
      shell(`settings put global ${k} 0`);
    // A freshly wiped emulator keeps optimizing system apps after boot, and
    // its launcher or System UI can show "isn't responding" over SoundTrip.
    // Hide system error dialogs (SoundTrip crashes are still read from
    // logcat) and let newer images settle first.
    shell("settings put global hide_error_dialogs 1");
    if (Number(api) >= 33) await sleep(60000);
    shell("input keyevent 82");
    shell("input keyevent 3");

    // sys.boot_completed can be set before the package service accepts
    // installs. Wait for it explicitly.
    const pkgEnd = Date.now() + 180000;
    while (
      Date.now() < pkgEnd &&
      !/ found$/m.test(shell("service check package").trim())
    )
      await sleep(3000);
    // Installing ~50 MB on a freshly booted emulator can be slow: allow 5
    // minutes and one retry.
    const installOnce = () =>
      spawnSync(adbPath, ["-s", serial, "install", "-r", apk], {
        encoding: "utf8",
        timeout: 300000,
      });
    let install = installOnce();
    if (!/Success/.test(install.stdout || "")) {
      await sleep(15000);
      install = installOnce();
    }
    if (
      !step(
        "install",
        /Success/.test(install.stdout),
        (
          (install.stdout || "") + (install.stderr || "") ||
          String(install.error || "timed out")
        )
          .trim()
          .split("\n")
          .pop(),
      )
    )
      return { avd, api, release, steps };

    adb("push", audioFile, "/sdcard/Download/SoundTrip - Smoke Test.wav");
    const media = "file:///sdcard/Download/SoundTrip%20-%20Smoke%20Test.wav";
    shell(
      `am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d '${media}' >/dev/null 2>&1`,
    );
    shell(
      "content call --uri content://media --method scan_volume --arg external_primary >/dev/null 2>&1",
    );

    adb("logcat", "-c");
    const start = Date.now();
    shell(`am start -W -n ${PACKAGE}/.MainActivity`);
    const welcome = await tap("Make yourself at home", 150000);
    step(
      "launch and onboarding",
      welcome,
      `${Math.round((Date.now() - start) / 100) / 10}s to interactive`,
    );
    screenshot("1-library");

    // Android's document picker differs by version; see pickFile().
    let imported = false;
    if (await tap(/^Import your music$|^Import music$/)) {
      await sleep(3000);
      screenshot("2-picker");
      const file = await pickFile();
      if (file) {
        // Some pickers return on a tap, some mark the file and want "Select",
        // and some (Android 11's) ignore synthetic taps on file rows but
        // accept keyboard focus plus Enter.
        shell(`input tap ${file.x} ${file.y}`);
        await sleep(2500);
        const confirm = await find((v) => /^select$/i.test(v), 3000);
        if (confirm) shell(`input tap ${confirm.x} ${confirm.y}`);
        else if (nodes().some((n) => n.text === file.text)) {
          for (let i = 0; i < 8; i++) {
            shell("input keyevent 20");
            await sleep(700);
            if (nodes().some((n) => n.focused && n.id.endsWith("item_root"))) {
              shell("input keyevent 66");
              break;
            }
          }
          await sleep(2000);
          const again = await find((v) => /^select$/i.test(v), 3000);
          if (again) shell(`input tap ${again.x} ${again.y}`);
        }
        await sleep(4000); // copy, fingerprint and metadata read
        imported = !!(await scrollFind(/^1 tracks? · 1 on this device$/, 8));
      }
    }
    if (!step("import through system picker", imported)) {
      screenshot("2-picker-failed");
      // Keep the picker's accessibility tree so label matching can be fixed.
      const dump = shell("cat /data/local/tmp/st-ui.xml");
      writeFileSync(join(out, "picker-ui.xml"), dump);
    }

    // "Shuffle all" sits beside the track count, so it is already on screen.
    const play = imported && (await scrollFind("Shuffle all", 4));
    if (imported) step("play control reachable", !!play);
    if (play) {
      shell(`input tap ${play.x} ${play.y}`);
      let ok = false;
      for (let i = 0; i < 10 && !ok; i++) {
        await sleep(1000);
        ok = playing();
      }
      step("playback starts (media session playing)", ok);
      await tap("Open now playing", 5000);
      await sleep(1500);
      screenshot("3-now-playing");
      shell("input keyevent 3");
      await sleep(10000);
      step("keeps playing in background after 10s", playing() && alive());
      screenshot("4-background");
      shell(`am start -n ${PACKAGE}/.MainActivity`);
      await sleep(2000);
      await tap("Pause", 5000);
    }
    shell("input keyevent 4");
    await sleep(1000);
    const crash = adb("logcat", "-d", "-b", "crash").stdout || "";
    const fatal = (adb("logcat", "-d").stdout || "").split("\n").filter(
      (l) =>
        // Only SoundTrip's own crashes and ANRs count; the AndroidRuntime
        // line after "FATAL EXCEPTION" names the crashing process.
        l.includes(`ANR in ${PACKAGE}`) ||
        (l.includes(PACKAGE) && /AndroidRuntime/.test(l)),
    );
    step(
      "no crash or ANR",
      !crash.includes(PACKAGE) && !fatal.length,
      fatal.slice(0, 3).join(" | "),
    );
    writeFileSync(join(out, "logcat.txt"), adb("logcat", "-d").stdout || "");
    return { avd, api, release, steps };
  } finally {
    adb("emu", "kill");
    await sleep(5000);
    emulator.kill();
  }
}

const report = [];
let port = 5580;
for (const avd of avds) report.push(await smoke(avd, (port += 2)));
writeFileSync(join(outRoot, "report.json"), JSON.stringify(report, null, 2));
console.log("\nSummary");
for (const r of report)
  console.log(
    `  ${r.avd} · Android ${r.release || "?"} (API ${r.api || "?"}) · ${r.steps.every((s) => s.ok) ? "PASS" : "FAIL"} (${r.steps.filter((s) => s.ok).length}/${r.steps.length})`,
  );
process.exitCode = report.every(
  (r) => r.steps.length > 2 && r.steps.every((s) => s.ok),
)
  ? 0
  : 1;

// Render chosen frames of a composition as JPEGs for quick visual checks.
// Usage: node scripts/stills.mjs <compositionId> <outDir> <frame> [frame...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const [id, outDir, ...frames] = process.argv.slice(2);
if (!id || !outDir || !frames.length) {
  console.error(
    "Usage: node scripts/stills.mjs <compositionId> <outDir> <frame>...",
  );
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id });
for (const f of frames.map(Number)) {
  const output = join(outDir, `${id}-${String(f).padStart(4, "0")}.jpeg`);
  await renderStill({
    serveUrl,
    composition,
    frame: f,
    output,
    imageFormat: "jpeg",
    jpegQuality: 85,
  });
  console.log(output);
}

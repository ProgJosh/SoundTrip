import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
function files(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? files(path.join(root, e.name))
      : [path.join(root, e.name)],
  );
}
writeFileSync(
  "dist/manifest.json",
  JSON.stringify({
    name: "SoundTrip",
    short_name: "SoundTrip",
    start_url: "/",
    display: "standalone",
    background_color: "#101313",
    theme_color: "#101313",
  }),
);
const excluded = new Set([
  "metadata.json",
  "sw.js",
  "_headers",
  "_redirects",
  ".assetsignore",
]);
const assets = files("dist")
  .filter((p) => !p.endsWith(".map") && !excluded.has(path.basename(p)))
  .map((p) => "/" + p.replaceAll("\\", "/").replace(/^dist\//, ""));
const version = createHash("sha256")
  .update(assets.join("\n"))
  .digest("hex")
  .slice(0, 12);
writeFileSync(
  "dist/sw.js",
  `const CACHE='soundtrip-${version}';const ASSETS=${JSON.stringify(assets)};self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('soundtrip-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(event.request.method!=='GET'||u.origin!==self.location.origin||u.pathname.startsWith('/api/')||u.pathname.startsWith('/sync')||u.pathname.startsWith('/account-data'))return;if(event.request.mode==='navigate')event.respondWith(caches.match('/index.html').then(r=>r||fetch(event.request)));else if(ASSETS.includes(u.pathname))event.respondWith(caches.match(event.request).then(r=>r||fetch(event.request)));});`,
);
let html = readFileSync("dist/index.html", "utf8");
html = html
  .replace(
    "</head>",
    '<meta name="theme-color" content="#101313"><link rel="manifest" href="/manifest.json"></head>',
  )
  .replace(
    "</body>",
    `<script>if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});</script></body>`,
  );
writeFileSync("dist/index.html", html);
console.log("Offline app shell generated. Only bundled app assets are cached.");

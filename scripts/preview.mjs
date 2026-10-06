import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist");
const types = {
  ".js": "application/javascript",
  ".html": "text/html",
  ".json": "application/json",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".css": "text/css",
};
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1");
    const filename = path.resolve(root, "." + decodeURIComponent(url.pathname));
    if (!filename.startsWith(root + path.sep) && filename !== root) {
      res.writeHead(403).end();
      return;
    }
    let data,
      target = filename;
    try {
      data = await readFile(target);
    } catch {
      target = path.join(root, "index.html");
      data = await readFile(target);
    }
    res.writeHead(200, {
      "Content-Type": types[path.extname(target)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(data);
  } catch {
    res.writeHead(500).end();
  }
}).listen(Number(process.env.PREVIEW_PORT || 8081), "127.0.0.1", () =>
  console.log("SoundTrip preview at http://127.0.0.1:8081"),
);

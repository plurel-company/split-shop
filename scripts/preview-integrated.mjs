import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { handleDemoShopRequest } from "../dist/cloudflare-handler.mjs";

const assets = resolve(import.meta.dirname, "../dist/cloudflare-assets");
const port = Number(process.env.PORT || 3108);
const contentTypes = { ".html": "text/html; charset=utf-8", ".js": "application/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".txt": "text/plain", ".woff2": "font/woff2" };
createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url || "/", `http://127.0.0.1:${port}`);
    if (url.pathname.startsWith("/api/demo-shop/")) {
      const chunks = [];
      let bytes = 0;
      for await (const chunk of incoming) {
        bytes += chunk.length;
        if (bytes > 128 * 1024) { outgoing.writeHead(413); outgoing.end(); return; }
        chunks.push(chunk);
      }
      const response = await handleDemoShopRequest(new Request(url, { method: incoming.method, headers: incoming.headers, body: chunks.length ? Buffer.concat(chunks) : undefined }), { ...process.env, CLOUDFLARE_ENV: "development" });
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    const path = resolve(assets, `.${decodeURIComponent(url.pathname)}`, url.pathname.endsWith("/") ? "index.html" : "");
    if (!path.startsWith(`${assets}/`)) { outgoing.writeHead(404); outgoing.end(); return; }
    const body = await readFile(path);
    outgoing.writeHead(200, { "content-type": contentTypes[extname(path)] || "application/octet-stream" });
    outgoing.end(body);
  } catch { outgoing.writeHead(404); outgoing.end("Not found"); }
}).listen(port, "127.0.0.1", () => console.log(`Local integrated demo: http://127.0.0.1:${port}/demo/shop/`));

// Local preview: serves public-next (SPA fallback) with production CSP; proxies /api + /mcp to prod.
import http from "node:http"; import { readFile } from "node:fs/promises"; import { extname, join, normalize } from "node:path";
const ROOT = process.argv[2] || "../prototype/public-next"; const PORT = +process.argv[3] || 8788; const PROD = "https://agents.pointmint.io";
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";
const T = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".webm": "video/webm", ".mp4": "video/mp4", ".json": "application/json" };
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname.startsWith("/api/") || u.pathname === "/mcp") {
    const body = ["GET", "HEAD"].includes(req.method) ? undefined : await new Promise(r => { const c = []; req.on("data", d => c.push(d)); req.on("end", () => r(Buffer.concat(c))); });
    const r = await fetch(PROD + req.url, { method: req.method, headers: { "content-type": req.headers["content-type"] || "application/json", cookie: req.headers.cookie || "" }, body });
    res.writeHead(r.status, { "content-type": r.headers.get("content-type") || "application/json" }); res.end(Buffer.from(await r.arrayBuffer())); return;
  }
  let p = normalize(u.pathname).replace(/^\/+/, ""); let file = join(ROOT, p);
  let data; try { data = await readFile(file); } catch { file = join(ROOT, "index.html"); data = await readFile(file); }
  res.writeHead(200, { "content-type": T[extname(file)] || "application/octet-stream", "content-security-policy": CSP, "cache-control": "no-store" }); res.end(data);
}).listen(PORT, () => console.log("serving", ROOT, "on", PORT));

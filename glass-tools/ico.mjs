import { chromium } from "playwright-core"; import { readFileSync, writeFileSync } from "node:fs";
const svg = readFileSync(process.argv[2], 'utf8');
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const p = await (await b.newContext({ viewport: { width: 32, height: 32 } })).newPage();
const pngs = [];
for (const s of [16, 32, 48]) {
  await p.setViewportSize({ width: s, height: s });
  await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg', `<svg width="${s}" height="${s}"`)}</body></html>`);
  pngs.push([s, await p.screenshot({ omitBackground: true })]);
}
await b.close();
// ICO container with embedded PNGs
const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
let off = 6 + 16 * pngs.length; const dir = [], data = [];
for (const [s, png] of pngs) { const e = Buffer.alloc(16); e.writeUInt8(s === 256 ? 0 : s, 0); e.writeUInt8(s === 256 ? 0 : s, 1); e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(png.length, 8); e.writeUInt32LE(off, 12); off += png.length; dir.push(e); data.push(png); }
writeFileSync(process.argv[3], Buffer.concat([head, ...dir, ...data])); console.log('ico', off, 'bytes');

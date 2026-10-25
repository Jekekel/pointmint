// node scripts/stack-min-test.mjs <base> <outdir>
import { chromium } from "playwright-core";
import { mkdirSync } from "fs";
const [base, out] = process.argv.slice(2);
if (!base || !out) { console.error("usage: node scripts/stack-min-test.mjs <base> <outdir>"); process.exit(2); }
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
let pass = 0, fail = 0;
const ok = (c, m, x = "") => { c ? pass++ : fail++; console.log(c ? "PASS" : "FAIL", m, x); };
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", e => errs.push(e.message));
p.on("console", m => { if (m.type() === "error" && !/cloudflareinsights/.test(m.text())) errs.push(m.text()); });
await p.goto(base + "/?v=20", { waitUntil: "load" });
await p.waitForTimeout(3500);
// clear prior float/rail state so the test is deterministic
await p.evaluate(() => {
  localStorage.setItem("pm-fp-v1", JSON.stringify({ c: false, f: false, pd: false }));
  localStorage.setItem("pm-rail-l", "open");
  localStorage.setItem("pm-rail-r", "open");
});
await p.reload({ waitUntil: "load" });
await p.waitForTimeout(3000);

const state = () => p.evaluate(() => {
  const d = document.getElementById("deck");
  const pill = document.getElementById("fpPill");
  const app = document.getElementById("app");
  const slot = document.getElementById("feedSlot");
  const stack = document.querySelector("#colL .rail-stack");
  const feedRail = document.querySelector("#colL .rail-feed");
  return {
    l: d.dataset.l, r: d.dataset.r, fp: d.dataset.fp, bridge: d.dataset.bridge,
    pillHidden: pill.hidden || getComputedStyle(pill).display === "none",
    appDisplay: getComputedStyle(app).display,
    slotDisplay: slot ? getComputedStyle(slot).display : "missing",
    stackDisplay: stack ? getComputedStyle(stack).display : "missing",
    feedRailDisplay: feedRail ? getComputedStyle(feedRail).display : "missing",
    feedLabel: feedRail ? (feedRail.querySelector(".rf-l") || {}).textContent : "",
    slotLabel: slot ? (slot.querySelector(".fs-l") || {}).textContent : "",
    v: [...document.querySelectorAll('link[href*="?v="], script[src*="?v="]')].map(el => (el.href || el.src).match(/[?&]v=([^&]+)/)?.[1]).filter(Boolean)[0]
  };
});

let s = await state();
ok(s.fp === "dock" && s.l === "open", "default: human open, conversation docked", JSON.stringify(s));
ok(s.v === "20", "assets cache-bust ?v=20", s.v);

// collapse conversation
await p.click('[data-action="fp-toggle"]');
await p.waitForTimeout(400);
s = await state();
ok(s.fp === "stack", "collapse conversation → data-fp=stack (not pill)", JSON.stringify(s));
ok(s.pillHidden, "no #fpPill when conversation stacked", JSON.stringify(s));
ok(s.appDisplay === "none", "middle panel hidden while stacked", s.appDisplay);
ok(s.slotDisplay === "flex" || s.slotDisplay === "block", "FEED strip visible at bottom of open human column", s.slotDisplay);
ok(/FEED/i.test(s.slotLabel), "FEED section labeled", s.slotLabel);
await p.screenshot({ path: out + "/human-open-feed-stacked.png", fullPage: false });

// collapse human → dual stack in rail
await p.click('.rail-btn[data-rail="l"]');
await p.waitForTimeout(450);
s = await state();
ok(s.l === "rail" && s.fp === "stack", "both minimized: human rail + feed stack", JSON.stringify(s));
ok(s.pillHidden, "dual-min: still no #fpPill", JSON.stringify(s));
ok(s.stackDisplay === "flex", "rail-stack visible", s.stackDisplay);
ok(s.feedRailDisplay === "flex" || s.feedRailDisplay === "block", "FEED rail section visible in stack", s.feedRailDisplay);
ok(/FEED/i.test(s.feedLabel), "FEED rail labeled", s.feedLabel);
// measure stack proportions
const proportions = await p.evaluate(() => {
  const col = document.getElementById("colL").getBoundingClientRect();
  const h = document.querySelector("#colL .rail-human").getBoundingClientRect();
  const f = document.querySelector("#colL .rail-feed").getBoundingClientRect();
  return {
    colH: Math.round(col.height),
    humanPct: Math.round(100 * h.height / col.height),
    feedPct: Math.round(100 * f.height / col.height),
    feedTop: Math.round(f.top),
    humanBottom: Math.round(h.bottom)
  };
});
ok(proportions.feedPct >= 18 && proportions.feedPct <= 35, "FEED strip is ~20–30% of collapsed column", JSON.stringify(proportions));
ok(proportions.humanPct >= 60, "Human section is majority of rail", JSON.stringify(proportions));
await p.screenshot({ path: out + "/both-collapsed-stacked.png", fullPage: false });

// expand conversation from stack → glass center
await p.click("#colL .rail-feed");
await p.waitForTimeout(500);
s = await state();
ok(s.fp === "dock" || s.fp === "float", "expand conversation → middle shown", JSON.stringify(s));
ok(s.appDisplay !== "none", "conversation panel visible", s.appDisplay);
ok(s.pillHidden, "still no orphan pill after expand", JSON.stringify(s));
ok(s.l === "rail", "human stays rail when only conversation expands", s.l);
const glass = await p.evaluate(() => {
  const a = getComputedStyle(document.getElementById("app"));
  return { border: a.borderTopWidth, radius: a.borderRadius, blur: a.backdropFilter || a.webkitBackdropFilter };
});
ok(parseFloat(glass.border) >= 1, "conversation has glass border", JSON.stringify(glass));
await p.screenshot({ path: out + "/expand-conversation-center.png", fullPage: false });

// collapse conversation again, then expand human
await p.click('[data-action="fp-toggle"]');
await p.waitForTimeout(350);
await p.click("#colL .rail-human");
await p.waitForTimeout(500);
s = await state();
ok(s.l === "open" && s.fp === "stack", "expand human from stack; feed stays stacked strip", JSON.stringify(s));
ok(s.pillHidden && s.slotDisplay !== "none", "FEED strip in open human column; no pill", JSON.stringify(s));
const humanGlass = await p.evaluate(() => {
  const a = getComputedStyle(document.getElementById("colL"));
  return { border: a.borderTopWidth, color: a.borderTopColor };
});
ok(parseFloat(humanGlass.border) >= 1, "human column glass border when expanded", JSON.stringify(humanGlass));
await p.screenshot({ path: out + "/expand-human.png", fullPage: false });

// both expanded → bridge 80/20
await p.click("#feedSlot");
await p.waitForTimeout(500);
s = await state();
ok(s.l === "open" && (s.fp === "dock" || s.fp === "float") && s.bridge === "1", "both expanded: bridge on", JSON.stringify(s));
const bridge = await p.evaluate(() => {
  const col = document.getElementById("colL").getBoundingClientRect();
  const scroll = document.querySelector("#colL .col-scroll").getBoundingClientRect();
  const slot = document.getElementById("feedSlot").getBoundingClientRect();
  const app = document.getElementById("app").getBoundingClientRect();
  return {
    humanPct: Math.round(100 * scroll.height / col.height),
    slotPct: Math.round(100 * slot.height / col.height),
    appW: Math.round(app.width),
    slotDisplay: getComputedStyle(document.getElementById("feedSlot")).display
  };
});
ok(bridge.slotDisplay !== "none", "FEED bridge strip visible when both open", JSON.stringify(bridge));
ok(bridge.slotPct >= 15 && bridge.slotPct <= 35, "bridge strip ~20% of human column", JSON.stringify(bridge));
ok(bridge.appW > 300, "conversation occupies middle area", JSON.stringify(bridge));
await p.screenshot({ path: out + "/both-expanded-bridge.png", fullPage: false });

// guest / privacy quick: no founder name in home HTML
const html = await p.content();
ok(!/Momentum/i.test(html), "no Momentum branding in page HTML");
ok(!/Michael\s+Lebor/i.test(html), "no owner name in page HTML");

ok(!errs.length, "no console errors", errs.join(" | "));
await ctx.close();
await b.close();
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

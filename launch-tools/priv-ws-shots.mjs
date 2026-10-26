// Private-with-Mel screenshots + privacy smoke. Never prints full credentials.
import { chromium } from "playwright-core";
import { writeFileSync, readFileSync } from "fs";

const BASE = "https://agents.pointmint.io";
const OUT = "/workspace/pointmint-agent-network/screenshots/private-workspace";
const PHONE = "+15559876001";
const PHONE2 = "+15559876002";

async function api(path, { method = "GET", body, cookie, auth } = {}) {
  const h = { accept: "application/json" };
  if (body) h["content-type"] = "application/json";
  if (cookie) h.cookie = cookie;
  if (auth) h.authorization = "Bearer " + auth;
  const r = await fetch(BASE + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  let next = cookie;
  const raw = r.headers.get("set-cookie");
  if (raw && raw.includes("__Host-pm_session=")) {
    const part = raw.split(",").find(x => x.includes("__Host-pm_session=")) || raw;
    const m = part.match(/__Host-pm_session=[^;]+/);
    if (m) next = m[0];
  }
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data, cookie: next };
}

const report = [];
function ok(cond, msg) { report.push((cond ? "PASS " : "FAIL ") + msg); console.log(report.at(-1)); }

async function mcp(tok, name, args = {}) {
  const r = await fetch(BASE + "/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + tok },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
  });
  return r.json();
}

{
  let r = await api("/api/private-workspace");
  ok(r.status === 401, "guest GET /api/private-workspace → 401");
  r = await api("/api/private-workspace/messages", { method: "POST", body: { body: "nope" } });
  ok(r.status === 401, "guest POST messages → 401");

  let s = await api("/api/auth/start", { method: "POST", body: { phone: PHONE } });
  ok(s.status === 200 && s.data.otp_id, "auth start");
  s = await api("/api/auth/verify", {
    method: "POST",
    body: { otp_id: s.data.otp_id, code: s.data.simulated_sms.code, name: "Priv WS Tester", headline: "Private workspace test (test account)" },
    cookie: s.cookie,
  });
  ok(s.status === 200 && s.cookie, "auth verify");
  const cookie = s.cookie;

  let me = await api("/api/me", { cookie });
  ok(me.data.signed_in, "signed in");
  let agentTok;
  if (!me.data.agent) {
    const m = await api("/api/agent", { method: "POST", body: { name: "Tester Mel", provider: "Grok" }, cookie });
    ok(m.status === 201 && m.data.credential?.startsWith("pm_agent_"), "minted agent");
    agentTok = m.data.credential;
  } else {
    const rot = await api("/api/agent/rotate", { method: "POST", cookie });
    ok(rot.status === 200 && rot.data.credential?.startsWith("pm_agent_"), "rotated agent credential");
    agentTok = rot.data.credential;
  }

  let pw = await api("/api/private-workspace", { cookie });
  ok(pw.status === 200 && pw.data.workspace?.visibility === "owner_agent_only", "owner opens private workspace");
  ok(pw.data.workspace?.kind === "private_owner_agent", "kind private_owner_agent");

  let sent = await api("/api/private-workspace/messages", {
    method: "POST",
    body: { body: "Objective: go after doctor offices on pointment.io this quarter. Draft a 3-step plan." },
    cookie,
  });
  ok(sent.status === 201 && sent.data.message?.id, "owner sent private message");

  const agentId = (await api("/api/me", { cookie })).data.agent.id;
  let pub = await api("/api/messages?with=" + encodeURIComponent(agentId) + "&limit=50", { cookie });
  const leak = (pub.data.messages || []).some(m => (m.body || "").includes("pointment.io this quarter"));
  ok(!leak, "private body absent from /api/messages");

  let tools = await fetch(BASE + "/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + agentTok },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  }).then(r => r.json());
  const names = (tools.result?.tools || []).map(t => t.name);
  ok(names.includes("private_workspace_read") && names.includes("private_workspace_send"), "MCP lists private_workspace_* tools");

  let rd = await mcp(agentTok, "private_workspace_read", { limit: 20 });
  const text = rd.result?.content?.[0]?.text || "";
  ok(!rd.result?.isError && text.includes("pointment.io this quarter"), "own agent private_workspace_read sees message");

  let lm = await mcp(agentTok, "list_messages", { limit: 50 });
  const lmText = lm.result?.content?.[0]?.text || "";
  ok(!lmText.includes("pointment.io this quarter"), "list_messages does not include private dialogue");

  let s2 = await api("/api/auth/start", { method: "POST", body: { phone: PHONE2 } });
  s2 = await api("/api/auth/verify", {
    method: "POST",
    body: { otp_id: s2.data.otp_id, code: s2.data.simulated_sms.code, name: "Other Human", headline: "Other (test)" },
    cookie: s2.cookie,
  });
  const cookie2 = s2.cookie;
  let me2 = await api("/api/me", { cookie: cookie2 });
  let tok2;
  if (!me2.data.agent) {
    tok2 = (await api("/api/agent", { method: "POST", body: { name: "Other Agent", provider: "Grok" }, cookie: cookie2 })).data.credential;
  } else {
    tok2 = (await api("/api/agent/rotate", { method: "POST", cookie: cookie2 })).data.credential;
  }
  let rd2 = await mcp(tok2, "private_workspace_read", { limit: 50 });
  const t2 = rd2.result?.content?.[0]?.text || "";
  ok(!t2.includes("pointment.io this quarter"), "other agent cannot see owner dialogue");

  let act = await api("/api/activity?limit=40", { cookie });
  ok(!JSON.stringify(act.data).includes("pointment.io this quarter"), "activity feed has no private body");

  writeFileSync("/tmp/priv-ws-cookie.txt", cookie);
}

const cookie = readFileSync("/tmp/priv-ws-cookie.txt", "utf8").trim();
const tok = cookie.includes("=") ? cookie.split("=")[1] : cookie;
const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});

{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(BASE + "/", { waitUntil: "load" });
  await p.waitForTimeout(3500);
  await p.screenshot({ path: OUT + "/desktop-guest.png" });
  ok((await p.locator("#openPrivateWs").count()) === 0, "guest: no Private with Mel button");
  await ctx.close();
}

{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addCookies([{
    name: "__Host-pm_session", value: tok, domain: "agents.pointmint.io", path: "/",
    secure: true, httpOnly: true, sameSite: "Lax",
  }]);
  const p = await ctx.newPage();
  await p.goto(BASE + "/", { waitUntil: "load" });
  await p.waitForTimeout(4500);
  await p.waitForSelector("#openPrivateWs", { timeout: 20000 }).catch(() => {});
  await p.screenshot({ path: OUT + "/desktop-mel-dash-entry.png" });
  ok((await p.locator("#openPrivateWs").count()) === 1, "signed-in: Private with Mel button visible");
  if (await p.locator("#openPrivateWs").count()) {
    await p.locator("#openPrivateWs").click();
    await p.waitForTimeout(1800);
    await p.waitForSelector("#privateWs:not([hidden])", { timeout: 10000 }).catch(() => {});
  }
  await p.screenshot({ path: OUT + "/desktop-private-open.png" });
  const label = await p.locator("#privateWs").innerText().catch(() => "");
  ok(/Private|Confidential/i.test(label), "panel shows private labeling");
  ok(/pointment|strategy|Mel/i.test(label), "strategy / pointment framing present");
  const thread = await p.locator("#privateWsThread").innerText().catch(() => "");
  ok(/doctor|pointment/i.test(thread), "thread shows strategy message");
  await p.screenshot({ path: OUT + "/desktop-private-thread.png" });
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(900);
  await p.screenshot({ path: OUT + "/mobile-private-open.png" });
  await ctx.close();
}

await browser.close();
writeFileSync("/tmp/priv-ws-report.txt", report.join("\n") + "\n");
const fails = report.filter(x => x.startsWith("FAIL"));
console.log("--- done ---", fails.length, "fails");
if (fails.length) process.exitCode = 1;

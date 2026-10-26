#!/usr/bin/env node
/**
 * Hard production gate for agents.pointmint.io (Worker pointmint-agents).
 * Michael Lebor 2026-10-25: do NOT deploy to live production until
 * PLATFORM_OWNER_HUMAN_IDS contains a valid human id (his).
 *
 * Usage: node scripts/production-gate.mjs
 * Exit 0 = ok to deploy. Exit 1 = abort (message on stderr).
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const tomlPath = join(root, 'wrangler.toml');

function fail(msg) {
  console.error('PRODUCTION GATE BLOCKED deploy to agents.pointmint.io');
  console.error(msg);
  console.error('Set PLATFORM_OWNER_HUMAN_IDS in prototype/wrangler.toml [vars] (and Cloudflare Worker Variables) to Michael Lebor\'s human id (e.g. h_…), then re-run.');
  process.exit(1);
}

function parseTomlVar(toml, key) {
  // Minimal [vars] reader — enough for PLATFORM_OWNER_HUMAN_IDS = "…"
  const varsIdx = toml.search(/^\[vars\]/m);
  if (varsIdx < 0) return null;
  const rest = toml.slice(varsIdx);
  const nextSection = rest.search(/\n\[(?!vars\])/);
  const block = nextSection >= 0 ? rest.slice(0, nextSection) : rest;
  const re = new RegExp(`^\\s*${key}\\s*=\\s*"([^"]*)"\\s*$`, 'm');
  const m = block.match(re);
  return m ? m[1] : null;
}

/** Accept h_<hex/alnum> style PointMint human ids; reject empty / placeholders. */
function isValidHumanId(id) {
  const s = String(id || '').trim();
  if (!s) return false;
  if (/^(null|undefined|todo|tbd|changeme|your.?id)$/i.test(s)) return false;
  // Existing ids look like h_2f005be7979e8275f1 / h_d00001 / h_a6496622daa0405a3b
  return /^h_[a-zA-Z0-9]{4,64}$/.test(s);
}

function collectIds(raw) {
  return String(raw || '')
    .split(/[,;\s]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

if (!existsSync(tomlPath)) fail(`Missing ${tomlPath}`);

const toml = readFileSync(tomlPath, 'utf8');
const fromToml = parseTomlVar(toml, 'PLATFORM_OWNER_HUMAN_IDS');
const fromEnv = process.env.PLATFORM_OWNER_HUMAN_IDS;
// Prefer explicit env override (CI), else wrangler.toml [vars] (what deploy would ship).
const raw = (fromEnv != null && String(fromEnv).trim() !== '') ? fromEnv : fromToml;

if (fromToml === null && (fromEnv == null || String(fromEnv).trim() === '')) {
  fail('PLATFORM_OWNER_HUMAN_IDS is missing from wrangler.toml [vars] and env.');
}

const ids = collectIds(raw);
if (!ids.length) {
  fail('PLATFORM_OWNER_HUMAN_IDS is empty. Veto (§32) and production launch require Michael Lebor\'s human id.');
}

const bad = ids.filter((id) => !isValidHumanId(id));
if (bad.length) {
  fail(`PLATFORM_OWNER_HUMAN_IDS has invalid human id(s): ${bad.join(', ')}. Expected h_<id>.`);
}

console.log(`Production gate OK — PLATFORM_OWNER_HUMAN_IDS has ${ids.length} valid human id(s).`);
process.exit(0);

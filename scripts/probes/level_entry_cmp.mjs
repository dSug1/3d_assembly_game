// ⭐ (2026-11-18, package ES — Claude/40_RENDER_SCENE/spec/LEVEL_FACE_ENTRY.md §16) two level-entry recordings (level_entry_check.mjs: an ARRAY of
// frames, nested objects) compared FRAME FOR FRAME: the largest numeric difference, the first frame over 1e-9 / 1e-6, the non-numeric differences.
// Usage: node level_entry_cmp.mjs base.json new.json   (replay_cmp.mjs reads replay_probe.mjs recordings: { frames } with flat fields).
import { readFileSync } from "node:fs";
const L = (f) => { const j = JSON.parse(readFileSync(f, "utf8")); return Array.isArray(j) ? j : j.frames; };
const a = L(process.argv[2]), b = L(process.argv[3]);
let worst = 0, wf = -1, first6 = -1, first9 = -1, disc = 0, fd = -1;
const walk = (x, y, i) => {
  if (typeof x === "number" && typeof y === "number") { const d = Math.abs(x - y); if (d > worst) { worst = d; wf = i; } if (d > 1e-6 && first6 < 0) first6 = i; if (d > 1e-9 && first9 < 0) first9 = i; return; }
  if (Array.isArray(x) && Array.isArray(y) && x.length === y.length) { x.forEach((v, k) => walk(v, y[k], i)); return; }
  if (x && y && typeof x === "object" && typeof y === "object") { for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[k], y[k], i); return; }
  if (x !== y) { disc++; if (fd < 0) fd = i; }
};
const n = Math.min(a.length, b.length);
for (let i = 0; i < n; i++) walk(a[i], b[i], i);
console.log(`frames ${a.length}/${b.length} largest ${worst.toExponential(1)}@${wf} first>1e-9 ${first9} first>1e-6 ${first6}${first6 >= 0 ? " (" + a[first6].leg + ")" : ""} non-numeric ${disc}${fd >= 0 ? " @" + fd + " (" + a[fd].leg + ")" : ""}`);

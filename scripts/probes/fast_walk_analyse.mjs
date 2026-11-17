// ⭐⭐⭐ (2026-11-18, package FO1 — `Claude/40_RENDER_SCENE/spec/FAST_ORBIT.md` §4, gate G6) THE FAST WALKS' READING, per recording of
// `fast_walk_check.mjs` (or any recording in its format):
//   node scripts/probes/fast_walk_analyse.mjs <rec.json> ...          LIMIT (90) the turn size the split is read at (deg)
// Per walk, and per loop (the legs `loop<r>-…`; `to-start` and the rest apart):
// * FRAMES — the frames; STILL < / ≥ — the frames the gizmo stands still (under 0.05 mm) while a transition's turn that HOLDS it runs, by the turn's
//   size (its angle — the picture's, `rad` — at its first known frame: under LIMIT, at or over it); a turn decided free with the gizmo still (the finger's
//   own stop) is counted apart (`stillFree`, in the table);
// * TURNING — the picture's total turning (the sum of each frame's rotation of the camera's orientation, degrees);
// * REVERSALS — how many times the picture's roll on the glass changes side with over 1° a frame on both sides (the frames over 1° in order: a sign change
//   between two of them is one reversal);
// * WORST — the largest rotation of the picture in ONE frame, anywhere (in a turn or not).
// Then EVERY TURN (a transition's turn, by its own object: `mix.id`): leg, frames, its size at the first known frame, THE ONE ROTATION (the frame before
// the turn → its last frame), THE PATH (each frame's rotation summed), the ratio, the largest frame, whether it held the gizmo (`hold` as the build decided;
// a build without the field: today's rule — every timed turn holds), whether it was REPLACED before it was whole (the next frame runs another turn).
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const LIMIT = +(process.env.LIMIT ?? 90);
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => { const l = len(a); return l > 1e-12 ? a.map((x) => x / l) : [0, 0, 0]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const deg = (x) => (x * 180) / Math.PI;
const perp = (v, l) => { const k = dot(v, l); return [v[0] - k * l[0], v[1] - k * l[1], v[2] - k * l[2]]; };
const frame3 = (x) => { const l = unit(sub(x.t, x.c)); const u = unit(perp(x.up, l)); return [l, u, cross(u, l)]; };
const relAngle = (A, B) => { let tr = 0; for (let i = 0; i < 3; i++) tr += dot(A[i], B[i]); return deg(Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2)))); };
const f1 = (x) => (x === null || x === undefined || Number.isNaN(x) ? "-" : x.toFixed(1));

/** the reading of a span of frames [a, b] (the frame a − 1 the one before) */
export function readSpan(C, F, roll, a, b) {
  let frames = 0, turning = 0, worst = 0, stillU = 0, stillO = 0, stillFree = 0, rev = 0, last = 0;
  const size = new Map();
  for (let i = a; i <= b; i++) {
    frames++;
    if (i > 0) { const r = relAngle(F[i - 1], F[i]); turning += r; worst = Math.max(worst, r); }
    const m = C[i].mix;
    if (m) {
      if (m.known && !size.has(m.id ?? -1)) size.set(m.id ?? -1, deg(m.rad));
      const still = i > 0 && C[i].g && C[i - 1].g && len(sub(C[i].g, C[i - 1].g)) * 1000 < 0.05;
      // a turn that HOLDS the gizmo (`hold` as the build decided; none recorded: today's rule — a timed turn holds); a free turn with the gizmo still is
      // the finger's own stop (a lift), counted apart
      const held = m.hold !== null && m.hold !== undefined ? m.hold : !m.byMm && !m.out;
      if (still && !held) stillFree++;
      else if (still) { const s = size.get(m.id ?? -1); if (s !== undefined && s < LIMIT) stillU++; else stillO++; }
    }
    if (Math.abs(roll[i]) > 1) { const s = Math.sign(roll[i]); if (last !== 0 && s !== last) rev++; last = s; }
  }
  // the faces the gizmo crossed (the heptagon's labels round its axis — B the bottom, F the lower front rectangle, T / U a tip's triangles, o<k> / t<k>)
  const faces = [];
  for (let i = a; i <= b; i++) { const f = faceOf(C[i].g); if (f !== null && faces[faces.length - 1] !== f) faces.push(f); }
  return { frames, turning, worst, stillU, stillO, stillFree, rev, faces };
}

const AY = +(process.env.AY ?? 0.229), AZ = +(process.env.AZ ?? 0.191), RIM = +(process.env.RIM ?? 0.2475), SEC = 360 / 7;
function faceOf(g) {
  if (!g) return null;
  const phi = (Math.atan2(g[1] - AY, g[2] - AZ) * 180) / Math.PI;
  const k = Math.round((phi + 90) / SEC);
  const tip = Math.abs(g[0]) > RIM + 0.002;
  return k === 0 ? (tip ? "T" : "B") : k === -1 ? (tip ? "U" : "F") : (tip ? "t" : "o") + k;
}

/** the roll of the picture on the glass in each frame (deg, signed): the up's turn about this frame's look */
export function rollsOf(C, F) {
  return C.map((x, i) => { if (i === 0) return 0; const l = F[i][0]; const a = unit(perp(F[i - 1][1], l)), b = F[i][1]; return deg(Math.atan2(dot(cross(a, b), l), dot(a, b))); });
}

/** every transition's turn: a run of frames with the same turn object */
export function turnsOf(C, F) {
  const out = [];
  for (let i = 1; i < C.length; i++) {
    const m = C[i].mix;
    if (!m) continue;
    const idOf = (x) => (x.mix ? x.mix.id ?? `k${x.mix.k >= 0 ? 1 : 0}` : null);
    let e = i;
    if (m.id !== undefined) while (e + 1 < C.length && C[e + 1].mix && C[e + 1].mix.id === m.id) e++;
    else while (e + 1 < C.length && C[e + 1].mix && C[e + 1].mix.k >= C[e].mix.k - 1e-9) e++;
    let path = 0, big = 0, size = null, still = 0;
    for (let j = i; j <= e; j++) {
      const r = relAngle(F[j - 1], F[j]); path += r; big = Math.max(big, r);
      if (size === null && C[j].mix.known) size = deg(C[j].mix.rad);
      if (C[j].g && C[j - 1].g && len(sub(C[j].g, C[j - 1].g)) * 1000 < 0.05) still++;
    }
    const last = C[e].mix;
    const replaced = e + 1 < C.length && !!C[e + 1].mix && last.k < 1 - 1e-9;
    const held = last.hold !== null && last.hold !== undefined ? last.hold : !last.byMm && !last.out;
    out.push({ s: i, e, leg: C[i].leg, n: e - i + 1, size, one: relAngle(F[i - 1], F[e]), path, big, held, replaced, still, pace: m.byMm ? "mm" : m.out ? "out" : "time" });
    i = e;
  }
  return out;
}

/** a recording read: per walk (`WALK`), per loop (`loop<r>`) and `to-start`, and its turns */
export function readWalk(C) {
  const F = C.map(frame3);
  const roll = rollsOf(C, F);
  const groups = [];
  for (let i = 0; i < C.length; i++) {
    const lg = C[i].leg;
    const key = /^loop\d+-/.test(lg) ? lg.split("-")[0] : lg.replace(/-settle$/, "");
    const g = groups[groups.length - 1];
    if (g && g.key === key) g.b = i; else groups.push({ key, a: i, b: i });
  }
  const parts = { WALK: readSpan(C, F, roll, 0, C.length - 1) };
  for (const g of groups) if (/^loop\d+$|^to-start$/.test(g.key)) parts[g.key] = readSpan(C, F, roll, g.a, g.b);
  return { F, roll, groups, parts, turns: turnsOf(C, F) };
}

const main = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
for (const file of main ? process.argv.slice(2) : []) {
  const C = JSON.parse(readFileSync(file, "utf8"));
  const { F, roll, groups } = readWalk(C);
  console.log(`# ${file.split(/[\/]/).pop()}: ${C.length} frames`);
  const all = readSpan(C, F, roll, 0, C.length - 1);
  const head = (r) => `frames ${String(r.frames).padStart(4)} | still <${LIMIT} ${String(r.stillU).padStart(3)} ≥${LIMIT} ${String(r.stillO).padStart(3)} | turning ${f1(r.turning).padStart(6)}° | reversals ${String(r.rev).padStart(3)} | worst ${f1(r.worst)}°`;
  console.log(`  WALK    ${head(all)}`);
  for (const g of groups) if (/^loop\d+$|^to-start$/.test(g.key)) { const r = readSpan(C, F, roll, g.a, g.b); console.log(`  ${g.key.padEnd(8)}${head(r)} | ${r.faces.join(" ")}`); }
  const T = turnsOf(C, F);
  console.log(`  TURNS ${T.length}: held ${T.filter((t) => t.held).length}, not held ${T.filter((t) => !t.held).length}, replaced before whole ${T.filter((t) => t.replaced).length}`);
  for (const t of T) {
    if (Math.max(t.one, t.path) < 0.5 && !t.replaced) continue;
    console.log(`    f${String(t.s).padStart(5)} ${t.leg.padEnd(14).slice(0, 14)} ${t.pace.padEnd(4)} ${String(t.n).padStart(3)} fr | size ${f1(t.size).padStart(6)}° | one ${f1(t.one).padStart(6)}° | path ${f1(t.path).padStart(6)}° | ratio ${(t.path / Math.max(1e-9, t.one)).toFixed(2)} | big ${f1(t.big)}° | ${t.held ? "HELD" : "free"} still ${t.still}${t.replaced ? " | REPLACED" : ""}`);
  }
}

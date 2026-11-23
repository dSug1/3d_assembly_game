// THE MOUTHS OF `Scene_1` — gate G2 of package S3 (ORBIT_SURFACE_MOUTH_HOLD.md §8), offline, one process: where today's face map makes a MOUTH
// (`stackDepthAt`'s `mouth`: a void on the facet's plane closed across, open up the facet, no floor) on `Scene_1`'s PLACED boxes (as `readout_cost.ts`
// takes them: each box its `dims` grown by its contour `margin`; ⚠ the four seated frusta left out), facet by facet — a cap's (H1 removes it) or a
// side's; on a side, P2 for the green piece AS HELD (its box 41.3 × 48 × 45 mm, resting face down — his word of 2026-11-23) OPEN or CLOSED
// (`voidOpenFor`): what H2 keeps. Sampled every 2 mm over each facet's extents. The face map as the study builds it (`buildCtx`, its FACET_OPTS).
// Usage: npx vite-node scripts/surface/mouth_scan.ts
import { heldReach, landingAxes, prepareLanding, readoutAt, voidOpenFor, type PreparedLanding } from "../../src/core/landing_map";
import { SCENE_1, SCENE_1_FINAL } from "../../src/content/scene_1";
import type { Vec3 } from "../../src/core/vec";
import { stackDepthAt } from "../../src/input/face_map";
import { boxPart, type V } from "../probes/surface_study/geom";
import { buildCtx, heldFoot, PIECE_A } from "../probes/surface_study/readings";

const unit = SCENE_1.unitM;
const goal = new Map(SCENE_1_FINAL.bodies.map((b) => [b.id, b.position]));
const boxes = SCENE_1.bodies.filter((b) => !b.frozen && b.topScale === 1 && b.prismSides === undefined && b.orientation === "identity" && JSON.stringify(goal.get(b.id)) === JSON.stringify(b.position));
const lohi = boxes.map((b) => {
  const m = b.margin ?? 0;
  const h = b.dims.map((d) => (d / 2 + m) * unit * 1000);
  const c = b.position.map((x) => x * unit * 1000);
  return { id: b.id, lo: [c[0]! - h[0]!, c[1]! - h[1]!, c[2]! - h[2]!] as V, hi: [c[0]! + h[0]!, c[1]! + h[1]!, c[2]! + h[2]!] as V };
});
const ctx = buildCtx(lohi.map((p) => boxPart(p.id, p.lo, p.hi)));
const map = ctx.map;
if (map === null) throw new Error("no face map");
const placed = lohi.map((p) => {
  const pts: Vec3[] = [];
  for (const x of [p.lo[0], p.hi[0]]) for (const y of [p.lo[1], p.hi[1]]) for (const z of [p.lo[2], p.hi[2]]) pts.push([x / 1000, y / 1000, z / 1000]);
  return { id: p.id, points: pts };
});
// the green piece as held: its box (PIECE_A.box: 41.3 along x, 48 up, 45 along z), its resting face (the bottom) centred on the reference point
const [bx, by, bz] = PIECE_A.box;
const held: Vec3[] = [];
for (const x of [-bx / 2, bx / 2]) for (const y of [0, by]) for (const z of [-bz / 2, bz / 2]) held.push([x / 1000, y / 1000, z / 1000]);
const foot = heldFoot(PIECE_A);
const STEP = 0.002;
console.log(`Scene_1: ${placed.length} placed boxes (the frusta left out), ${map.facets.length} facets; the green piece as held ${bx} × ${by} × ${bz} mm; every ${STEP * 1000} mm`);
let capM = 0, sideM = 0, sideOpen = 0, sideClosed = 0;
map.facets.forEach((f, i) => {
  let cells = 0, mouths = 0, open = 0, closed = 0, hi = 0, lo = 0;
  const runs = new Map<number, { s0: number; s1: number; hi: number; lo: number; open: number; closed: number }>(); // per column of cells (its t, 2 mm)
  let prep: PreparedLanding | null = null;
  const reach = heldReach([held], f.n);
  const ex = { tLo: Infinity, tHi: -Infinity, bLo: Infinity, bHi: -Infinity };
  for (let L = f.tLo; L <= f.tHi + 1e-12; L += STEP)
    for (let s = f.bLo; s <= f.bHi + 1e-12; s += STEP) {
      cells++;
      const at = stackDepthAt(f, L, s, foot);
      if (at === null || at.mouth === undefined) continue;
      mouths++;
      if (at.mouth.hi) hi++;
      if (at.mouth.lo) lo++;
      ex.tLo = Math.min(ex.tLo, L); ex.tHi = Math.max(ex.tHi, L); ex.bLo = Math.min(ex.bLo, s); ex.bHi = Math.max(ex.bHi, s);
      if (f.kind !== "SIDE") continue;
      prep ??= prepareLanding(placed, [held], landingAxes(f.n, f.t, f.b, null));
      const place: Vec3 = [0, 1, 2].map((k) => f.n[k]! * f.e + f.t[k]! * L + f.b[k]! * s) as unknown as Vec3;
      const today: Vec3 = [0, 1, 2].map((k) => place[k]! + f.n[k]! * (at.depth - f.e)) as unknown as Vec3;
      const o = voidOpenFor(readoutAt(prep, place, today), reach);
      if (o) open++;
      else closed++;
      const k = Math.round(L / STEP);
      const r = runs.get(k) ?? { s0: s, s1: s, hi: 0, lo: 0, open: 0, closed: 0 };
      r.s0 = Math.min(r.s0, s); r.s1 = Math.max(r.s1, s); if (at.mouth.hi) r.hi++; if (at.mouth.lo) r.lo++; if (o) r.open++; else r.closed++;
      runs.set(k, r);
    }
  if (mouths === 0) return;
  if (f.kind === "SIDE") { sideM += mouths; sideOpen += open; sideClosed += closed; } else capM += mouths;
  const n = f.n.map((x) => x.toFixed(2)).join(",");
  const mm = (x: number) => (x * 1000).toFixed(0);
  // the columns joined into VOIDS (adjacent t, the same b span and answer): t range (its width), b range, toward, P2's answer
  const ks = [...runs.keys()].sort((a, b) => a - b);
  const voids: { k0: number; k1: number; r: { s0: number; s1: number; hi: number; lo: number; open: number; closed: number } }[] = [];
  for (const k of ks) {
    const r = runs.get(k)!;
    const last = voids[voids.length - 1];
    if (last && k === last.k1 + 1 && Math.abs(last.r.s0 - r.s0) < 0.0101 && Math.abs(last.r.s1 - r.s1) < 0.0101) { last.k1 = k; last.r = { ...last.r, hi: last.r.hi + r.hi, lo: last.r.lo + r.lo, open: last.r.open + r.open, closed: last.r.closed + r.closed }; }
    else voids.push({ k0: k, k1: k, r: { ...r } });
  }
  for (const v of voids) console.log(`      void t ${((v.k0 * STEP) * 1000).toFixed(0)}…${((v.k1 * STEP) * 1000).toFixed(0)} mm (${((v.k1 - v.k0 + 1) * STEP * 1000).toFixed(0)} wide), b ${(v.r.s0 * 1000).toFixed(0)}…${(v.r.s1 * 1000).toFixed(0)}: toward hi ${v.r.hi}, lo ${v.r.lo}; P2 open ${v.r.open}, closed ${v.r.closed}`);
  console.log(`  facet ${i} ${f.kind} n(${n}): ${mouths} of ${cells} cells a mouth (toward hi ${hi}, lo ${lo}) over t ${mm(ex.tLo)}…${mm(ex.tHi)}, b ${mm(ex.bLo)}…${mm(ex.bHi)} mm` + (f.kind === "SIDE" ? ` · P2 open ${open}, closed ${closed} (reach ${(reach * 1000).toFixed(1)} mm)` : " · H1: none kept"));
});
console.log(`TOTAL: caps ${capM} mouth cells (H1 removes them all); sides ${sideM} — H2 keeps ${sideOpen} (open for the piece), removes ${sideClosed} (closed)`);

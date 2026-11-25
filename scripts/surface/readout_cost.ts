// THE READOUT'S COST — gate G2 of package S2 (ORBIT_SURFACE_READOUT.md §6, §8), offline, one process: what the readout pays on this PC, as the game
// calls it — one `prepareLanding` per facet (no grid; his answer of 2026-11-22), then one `readoutAt` a frame. The set: Scene_1's PLACED boxes as
// `landing_cost.ts` takes them (the level data: each box its `dims` grown by its contour `margin`, × `unitM`; ⚠ the four seated frusta left out, as
// there — the game's set has them too: ~10 % more pieces). The directions: the six of its box. The held piece: the green frustum's size as a box
// (PIECE_A of the study: 41.3 × 45 × 48 mm) and PIECE_B (80 × 80 × 40 mm). Measured per direction: the preparation (cold = the first, then the median
// of 9); `readoutAt` over 100 000 seeded places on the direction's plane (the mean, and the worst of 10 batches of 10 000).
// Usage: npx vite-node scripts/surface/readout_cost.ts   (⚠ the PC's load moves the figures: S1 measured 36 – 270 ms for one map by its load.)
import { landingAxes, prepareLanding, readoutAt } from "../../src/core/landing_map";
import { SCENE_1, SCENE_1_FINAL } from "../../src/content/scene_1";
import type { Vec3 } from "../../src/core/vec";
import { PIECE_A, PIECE_B, boxHeld, type V } from "../../tests/helpers/surface_shapes";

const unit = SCENE_1.unitM;
const goal = new Map(SCENE_1_FINAL.bodies.map((b) => [b.id, b.position]));
const boxes = SCENE_1.bodies.filter((b) => !b.frozen && b.topScale === 1 && b.prismSides === undefined && b.orientation === "identity" && JSON.stringify(goal.get(b.id)) === JSON.stringify(b.position));
const placed = boxes.map((b) => {
  const m = b.margin ?? 0;
  const h = b.dims.map((d) => (d / 2 + m) * unit);
  const c = b.position.map((x) => x * unit);
  const pts: Vec3[] = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) pts.push([c[0]! + sx * h[0]!, c[1]! + sy * h[1]!, c[2]! + sz * h[2]!]);
  return { id: b.id, points: pts };
});
const lo = [0, 1, 2].map((k) => Math.min(...placed.flatMap((p) => p.points.map((q) => q[k]!))));
const hi = [0, 1, 2].map((k) => Math.max(...placed.flatMap((p) => p.points.map((q) => q[k]!))));
console.log(`Scene_1: ${placed.length} placed boxes (the frusta left out); their box ${lo.map((x, k) => `${(x * 1000).toFixed(0)}…${(hi[k]! * 1000).toFixed(0)}`).join(" × ")} mm`);

const dirs: { name: string; n: V; t: V; b: V }[] = [
  { name: "+y", n: [0, 1, 0], t: [1, 0, 0], b: [0, 0, 1] }, { name: "-y", n: [0, -1, 0], t: [1, 0, 0], b: [0, 0, -1] },
  { name: "+x", n: [1, 0, 0], t: [0, 0, -1], b: [0, 1, 0] }, { name: "-x", n: [-1, 0, 0], t: [0, 0, 1], b: [0, 1, 0] },
  { name: "+z", n: [0, 0, 1], t: [1, 0, 0], b: [0, 1, 0] }, { name: "-z", n: [0, 0, -1], t: [-1, 0, 0], b: [0, 1, 0] },
];
const dotv = (a: readonly number[], b: readonly number[]) => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
const corners: number[][] = [];
for (const x of [lo[0]!, hi[0]!]) for (const y of [lo[1]!, hi[1]!]) for (const z of [lo[2]!, hi[2]!]) corners.push([x, y, z]);
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
// a seeded generator (mulberry32): the same places every run
let seed = 20261122;
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
let worstPrep = 0, worstQuery = 0;
const rows: string[] = [];
for (const [pname, pc] of [["A", PIECE_A], ["B", PIECE_B]] as const) {
  for (const d of dirs) {
    const axes = landingAxes(d.n as Vec3, d.t as Vec3, d.b as Vec3, null);
    const held = [boxHeld(pc, { n: d.n, t: d.t, b: d.b })];
    const times: number[] = [];
    let prep = prepareLanding(placed, held, axes);
    for (let r = 0; r < 10; r++) {
      const t0 = performance.now();
      prep = prepareLanding(placed, held, axes);
      times.push(performance.now() - t0);
    }
    const cold = times[0]!, med = median(times.slice(1));
    const us = corners.map((c) => dotv(c, d.t)), vs = corners.map((c) => dotv(c, d.b));
    const u0 = Math.min(...us), u1 = Math.max(...us), v0 = Math.min(...vs), v1 = Math.max(...vs);
    const out = Math.max(...corners.map((c) => dotv(c, d.n))) + 0.05;
    let sum = 0, batchWorst = 0, landed = 0, nothing = 0;
    for (let k = 0; k < 10; k++) {
      const places: Vec3[] = [];
      for (let i = 0; i < 10_000; i++) {
        const u = u0 + rnd() * (u1 - u0), v = v0 + rnd() * (v1 - v0);
        places.push([d.t[0] * u + d.b[0] * v + d.n[0] * out, d.t[1] * u + d.b[1] * v + d.n[1] * out, d.t[2] * u + d.b[2] * v + d.n[2] * out]);
      }
      const t0 = performance.now();
      for (const p of places) {
        const r = readoutAt(prep, p, p);
        if (r.kind === "land") landed++; else nothing++;
      }
      const us1 = ((performance.now() - t0) * 1000) / 10_000;
      sum += us1;
      batchWorst = Math.max(batchWorst, us1);
    }
    const mean = sum / 10;
    worstPrep = Math.max(worstPrep, cold, med);
    worstQuery = Math.max(worstQuery, batchWorst);
    rows.push(`  piece ${pname} ${d.name}: prepare cold ${cold.toFixed(2)} ms, median ${med.toFixed(2)} ms · readoutAt mean ${mean.toFixed(2)} µs (worst batch ${batchWorst.toFixed(2)}) · land ${landed}, nothing ${nothing}`);
  }
}
console.log(rows.join("\n"));
console.log(`WORST: a preparation ${worstPrep.toFixed(2)} ms (the 50 ms line: ${worstPrep < 50 ? "under" : "OVER"}); a readout ${worstQuery.toFixed(2)} µs`);

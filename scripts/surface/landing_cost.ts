// THE LANDING MAP'S COST — a figure for the wiring step, not a gate (package S1, ORBIT_SURFACE_LANDING_MAP.md §9). Offline, one process.
// The set: Scene_1's PLACED boxes as the level data gives them (`SCENE_1.bodies`: the boxes whose boot pose is their goal's — the five pieces the boot
// moves out and the floor left out; each box its `dims` grown by its contour `margin`, × `unitM`); the four seated frusta are NOT in it (boxes only, as
// briefed). The directions: the six of its box (±x, ±y, ±z), each over the set's box projected on its plane, grown by the piece's half-size + 4 mm.
// The pieces: A (41.3 × 45 × 48 mm) and B (80 × 80 × 40 mm), boxes, their reference the face toward the parts (−n). The step: 4 mm.
// Measured: each direction's build (cold = the first, then the median of 5), the samples and layers, the heap held by the 12 maps; one lookup and one
// exact evaluation (`landingAt`), each over 100 000 seeded places. Usage: npx vite-node scripts/surface/landing_cost.ts
import { buildLandingMap, type LandingMap } from "../../src/core/landing_map";
import { SCENE_1, SCENE_1_FINAL } from "../../src/content/scene_1";
import type { Vec3 } from "../../src/core/vec";
import { PIECE_A, PIECE_B, boxHeld, type BoxPiece, type V } from "../../tests/helpers/surface_shapes";

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
console.log(`Scene_1: ${SCENE_1.bodies.length} bodies, ${placed.length} placed boxes; their box ${lo.map((x, k) => `${(x * 1000).toFixed(0)}…${(hi[k]! * 1000).toFixed(0)}`).join(" × ")} mm`);

const dirs: { name: string; n: V; t: V; b: V }[] = [
  { name: "+y", n: [0, 1, 0], t: [1, 0, 0], b: [0, 0, 1] }, { name: "-y", n: [0, -1, 0], t: [1, 0, 0], b: [0, 0, -1] },
  { name: "+x", n: [1, 0, 0], t: [0, 0, -1], b: [0, 1, 0] }, { name: "-x", n: [-1, 0, 0], t: [0, 0, 1], b: [0, 1, 0] },
  { name: "+z", n: [0, 0, 1], t: [1, 0, 0], b: [0, 1, 0] }, { name: "-z", n: [0, 0, -1], t: [-1, 0, 0], b: [0, 1, 0] },
];
const dotv = (a: readonly number[], b: readonly number[]) => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
const corners: number[][] = [];
for (const x of [lo[0]!, hi[0]!]) for (const y of [lo[1]!, hi[1]!]) for (const z of [lo[2]!, hi[2]!]) corners.push([x, y, z]);
const frameFor = (d: (typeof dirs)[number], pc: BoxPiece) => {
  const g = Math.max(pc.a, pc.c) * 0.001 + 0.004;
  const us = corners.map((c) => dotv(c, d.t)), vs = corners.map((c) => dotv(c, d.b));
  return { origin: [0, 0, 0] as Vec3, u: d.t as Vec3, v: d.b as Vec3, n: d.n as Vec3, uMin: Math.min(...us) - g, uMax: Math.max(...us) + g, vMin: Math.min(...vs) - g, vMax: Math.max(...vs) + g };
};
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
const g = globalThis as { gc?: () => void };
g.gc?.();
const heap0 = process.memoryUsage().heapUsed;
const kept: LandingMap[] = [];
const rows: string[] = [];
let worst = 0;
for (const pc of [PIECE_A, PIECE_B]) {
  for (const d of dirs) {
    const f = frameFor(d, pc);
    const held = [boxHeld(pc, { n: d.n, t: d.t, b: d.b })];
    const times: number[] = [];
    let m: LandingMap | null = null;
    for (let r = 0; r < 6; r++) {
      const t0 = performance.now();
      m = buildLandingMap(placed, held, f);
      times.push(performance.now() - t0);
    }
    kept.push(m!);
    let layers = 0, landed = 0;
    for (let i = 0; i < m!.nu; i++) for (let j = 0; j < m!.nv; j++) {
      layers += m!.pieceLayers(i, j).length + m!.partsLayers(i, j).length;
      if (m!.landingSample(i, j).kind === "land") landed++;
    }
    const med = median(times.slice(1));
    worst = Math.max(worst, med);
    rows.push(`${pc.name.padEnd(10)} ${d.name}: ${m!.nu} × ${m!.nv} = ${m!.nu * m!.nv} samples, ${landed} land, ${layers} layers; build cold ${times[0]!.toFixed(1)} ms, median ${med.toFixed(1)} ms`);
  }
}
g.gc?.();
const heap1 = process.memoryUsage().heapUsed;
for (const r of rows) console.log(r);
console.log(`the slowest direction (median): ${worst.toFixed(1)} ms; the 12 maps held: ${((heap1 - heap0) / 1e6).toFixed(1)} MB of heap${g.gc ? "" : " (⚠ no --expose-gc: an upper bound with garbage)"}`);
// one lookup, one exact evaluation
let seed = 99;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const m0 = kept[0]!;
const places: [number, number][] = Array.from({ length: 100000 }, () => [m0.frame.uMin + rnd() * (m0.frame.uMax - m0.frame.uMin), m0.frame.vMin + rnd() * (m0.frame.vMax - m0.frame.vMin)]);
let sink = 0;
let t0 = performance.now();
for (const [u, v] of places) { const l = m0.landing(u, v); if (l.kind === "land") sink += l.depth; }
const tLook = (performance.now() - t0) / places.length;
t0 = performance.now();
for (const [u, v] of places) { const l = m0.landingAt(u, v); if (l.kind === "land") sink += l.depth; }
const tAt = (performance.now() - t0) / places.length;
console.log(`one lookup ${(tLook * 1000).toFixed(2)} µs; one exact evaluation (landingAt) ${(tAt * 1000).toFixed(2)} µs (A, +y; ${places.length} places; ${sink > 0 ? "" : "!"})`);
kept.length = 0;
// ⭐ THE OPTIONS (the brief: over ~50 ms a direction, measure, do not choose) — on the slowest kind of direction (B, ±x / ±y), median of 5
const timeIt = (fn: () => unknown) => { const ts: number[] = []; for (let r = 0; r < 6; r++) { const t = performance.now(); fn(); ts.push(performance.now() - t); } return median(ts.slice(1)); };
for (const name of ["+y", "+x"]) {
  const d = dirs.find((x) => x.name === name)!;
  const f = frameFor(d, PIECE_B);
  const held = [boxHeld(PIECE_B, { n: d.n, t: d.t, b: d.b })];
  const cu = (f.uMin + f.uMax) / 2, cv = (f.vMin + f.vMax) / 2;
  const prep = timeIt(() => buildLandingMap(placed, held, { ...f, uMin: cu, uMax: cu, vMin: cv, vMax: cv }));
  const s8 = timeIt(() => buildLandingMap(placed, held, f, 8));
  const s16 = timeIt(() => buildLandingMap(placed, held, f, 16));
  const tile = timeIt(() => buildLandingMap(placed, held, { ...f, uMin: cu - 0.05, uMax: cu + 0.05, vMin: cv - 0.05, vMax: cv + 0.05 }));
  console.log(`options, B ${name}: the preparation alone (one sample) ${prep.toFixed(1)} ms; the whole direction at 8 mm ${s8.toFixed(1)} ms, at 16 mm ${s16.toFixed(1)} ms; a 100 × 100 mm tile round a place at 4 mm ${tile.toFixed(1)} ms`);
}

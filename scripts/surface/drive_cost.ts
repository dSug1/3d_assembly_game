// P2 DRIVING'S COST — gate G2 of package S4 (ORBIT_SURFACE_DRIVE.md §3.4, §7), offline, one process: what the drive pays on this PC — the
// direction-free sums (`prepareHeldSums`, once per placed set and held piece: a pick-up, a turn's frames, a seat), a direction's projection
// (`landingFor`, on demand), a query (`landingAt` from `F`). The set: Scene_1's PLACED boxes as `readout_cost.ts` takes them (⚠ its four frusta left
// out: ~10 % more pieces in the game). The held piece: the green piece as a box, 41.3 × 48 × 45 mm, resting face down, as held.
// Usage: npx vite-node scripts/surface/drive_cost.ts   (⚠ the PC's load moves the figures.)
import { landingAxes, landingFor, prepareHeldSums } from "../../src/core/landing_map";
import { SCENE_1, SCENE_1_FINAL } from "../../src/content/scene_1";
import type { Vec3 } from "../../src/core/vec";
import { planeAxes } from "../../src/input/contact";

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
const held: Vec3[][] = [[]];
for (const x of [-20.65, 20.65]) for (const y of [0, 48]) for (const z of [-22.5, 22.5]) held[0]!.push([x / 1000, y / 1000, z / 1000]);
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
const time = (f: () => void, n: number) => {
  const ts: number[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    f();
    ts.push(performance.now() - t0);
  }
  return { cold: ts[0]!, med: median(ts.slice(1)), worst: Math.max(...ts) };
};
console.log(`Scene_1: ${placed.length} placed boxes (the frusta left out); the green piece as held`);
let sums = prepareHeldSums(placed, held);
const s = time(() => (sums = prepareHeldSums(placed, held)), 10);
console.log(`the direction-free sums (prepareHeldSums): cold ${s.cold.toFixed(2)} ms, median ${s.med.toFixed(2)} ms, worst ${s.worst.toFixed(2)} ms`);
const dirs: Vec3[] = [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0.6, 0.8, 0], [0, 0.8, -0.6]];
let worstDir = 0;
let seed = 20261123;
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
for (const n of dirs) {
  const [a, b] = planeAxes(n);
  const axes = landingAxes(n, a, b, null);
  let p = landingFor(sums, axes);
  const d = time(() => (p = landingFor(sums, axes)), 10);
  worstDir = Math.max(worstDir, d.med);
  // 100 000 queries over the assembly's extent, half from outside, half from a level inside its depth range
  let tot = 0;
  for (let k = 0; k < 10; k++) {
    const q: [number, number, number | undefined][] = [];
    for (let i = 0; i < 10_000; i++) q.push([(rnd() - 0.5) * 0.7, (rnd() - 0.5) * 0.7, i % 2 === 0 ? undefined : p.top - rnd() * 0.2]);
    const t0 = performance.now();
    for (const [u, v, f] of q) p.landingAt(u, v, f);
    tot += ((performance.now() - t0) * 1000) / 10_000;
  }
  console.log(`  direction (${n.join(", ")}): the projection (landingFor) cold ${d.cold.toFixed(3)} ms, median ${d.med.toFixed(3)} ms; a query ${(tot / 10).toFixed(2)} µs (mean)`);
}
console.log(`⭐ a key change (a pick-up, a seat; every frame of a turn): ${s.med.toFixed(2)} ms + ${worstDir.toFixed(3)} ms a direction read (6 – 10 on Scene_1)`);

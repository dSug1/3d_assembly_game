// ⭐⭐ WHAT DOES THE LANDING MAP COST AT EACH STAGE? — the construction rule C2 (SCENE_WORKFLOW.md §10.3; the surface ledger's row 7), for ANY scene's
// exported .glb (ORBIT_SURFACE_BUILD.md §10, S10). The game prepares P2's sums once per placed set and again for the held piece at every frame of a turn
// (`heldSumsOn` — S4b), and a query runs through every half-space: the cost grows with the placed parts' convex pieces × the held piece's. Per stage
// (the frozen parts first, then each part in its `step`; the held piece the part placed next), its size machine-free (`sumsSize`: sums, half-spaces)
// against `Scene_1`'s — the set played on his phone (S4 — his look "the overall feel is ok"; S4b the stutter) — and its time on this PC.
// ⭐ INFORMATION until the phone's cost is measured (C2's budget PROPOSED: a stage no larger than `Scene_1`'s): exit 0 read, 2 not read.
// Usage:  npx vite-node scripts/surface/check_landing_cost.ts -- <scene.glb>
import { readFileSync } from "node:fs";
import { SCENE_1, SCENE_1_FINAL } from "../../src/content/scene_1";
import { apply, glbBin, partGeometry } from "../../src/core/glb_geometry";
import { heldSumsOn, preparePlaced, sumsSize, type ConvexPiece } from "../../src/core/landing_map";
import { glbJson, readModelCatalog } from "../../src/core/model_catalog";
import type { Vec3 } from "../../src/core/vec";

const file = process.argv.slice(2).find((a) => a.endsWith(".glb")) ?? process.env["GLB"];
if (file === undefined) {
  console.log("usage: npx vite-node scripts/surface/check_landing_cost.ts -- <scene.glb>");
  process.exit(2);
}
let bytes: Uint8Array;
try {
  bytes = new Uint8Array(readFileSync(file));
} catch (e) {
  console.log(`NOT READ: ${String(e)}`);
  process.exit(2);
}
const j = glbJson(bytes);
if (!("json" in j)) {
  console.log(`NOT READ: ${j.refusal}`);
  process.exit(2);
}
const { catalog, refusals } = readModelCatalog(j.json);
if (catalog === null) {
  console.log(`REFUSED by the game's reader:\n  ${refusals.join("\n  ")}`);
  process.exit(2);
}
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
const timeOf = (f: () => void, n = 5): number => {
  const ts: number[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    f();
    ts.push(performance.now() - t0);
  }
  return median(ts);
};
// ── the reference: Scene_1's placed boxes and the green piece as held (drive_cost.ts's set — S4's G2)
const unit = SCENE_1.unitM!;
const goal = new Map(SCENE_1_FINAL.bodies.map((b) => [b.id, b.position]));
const ref: ConvexPiece[] = SCENE_1.bodies
  .filter((b) => !b.frozen && b.topScale === 1 && b.prismSides === undefined && b.orientation === "identity" && JSON.stringify(goal.get(b.id)) === JSON.stringify(b.position))
  .map((b) => {
    const h = b.dims.map((d) => (d / 2 + (b.margin ?? 0)) * unit);
    const c = b.position.map((x) => x * unit);
    const pts: Vec3[] = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) pts.push([c[0]! + sx * h[0]!, c[1]! + sy * h[1]!, c[2]! + sz * h[2]!]);
    return { id: b.id, points: pts };
  });
const green: Vec3[][] = [[]];
for (const x of [-20.65, 20.65]) for (const y of [0, 48]) for (const z of [-22.5, 22.5]) green[0]!.push([x / 1000, y / 1000, z / 1000]);
const refPP = preparePlaced(ref);
const refSize = sumsSize(heldSumsOn(refPP, green));
const refMs = timeOf(() => heldSumsOn(refPP, green));
console.log(`C2 on ${file} — the landing map's size per stage against Scene_1's (${ref.length} placed boxes × the green piece: ${refSize.sums} sums, ${refSize.halfSpaces} half-spaces; a turn frame ${refMs.toFixed(2)} ms on this PC)`);
// ── the scene's stages
const geo = partGeometry(j.json, glbBin(bytes), catalog);
const piecesAt = new Map(geo.map((g) => [g.id, g.pieces.map((pts): ConvexPiece => ({ id: g.id, points: pts.map((p) => { const w = apply(g.goal, p); return [w[0] * catalog.unitM, w[1] * catalog.unitM, w[2] * catalog.unitM] as Vec3; }) }))] as const));
const own = new Map(geo.map((g) => [g.id, g.pieces.map((pts) => pts.map((p) => [p[0] * catalog.unitM, p[1] * catalog.unitM, p[2] * catalog.unitM] as Vec3))] as const));
const order = [...catalog.parts.filter((p) => p.frozen), ...catalog.parts.filter((p) => !p.frozen)].map((p) => p.id);
const nFrozen = catalog.parts.filter((p) => p.frozen).length;
let worst = 0;
for (let s = Math.max(1, nFrozen); s < order.length; s++) {
  const placed = order.slice(0, s).flatMap((id) => piecesAt.get(id)!);
  const held = own.get(order[s]!)!;
  const pp = preparePlaced(placed);
  const size = sumsSize(heldSumsOn(pp, held));
  const ms = timeOf(() => heldSumsOn(pp, held), 3);
  const x = size.halfSpaces / refSize.halfSpaces;
  worst = Math.max(worst, x);
  console.log(`  stage ${s + 1} (${order[s]} held; ${placed.length} placed pieces × ${held.length}): ${size.sums} sums, ${size.halfSpaces} half-spaces — ${x.toFixed(1)} × Scene_1's; a turn frame ${ms.toFixed(1)} ms on this PC`);
}
console.log(`VERDICT: READ (information — C2's budget PROPOSED: no stage larger than Scene_1's, until the phone's cost is measured): the largest stage ${worst.toFixed(1)} × Scene_1's`);
process.exit(0);

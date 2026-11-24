// ⭐⭐ WHERE CAN EACH PART LAND? — checks B3 and B5 of ORBIT_SURFACE.md §7bis.3 on the game's side, for ANY scene's exported .glb
// (ORBIT_SURFACE_PART_CHECKS.md §14 – §15, decided 2026-11-24). At each stage of the plan (the frozen parts first, then each part in its `step`), the
// part placed next held AS HELD — its resting face against each exposed face of the placed parts, both turns — and the game's own landing map (P2)
// read over each face: LANDABLE where the piece rests on it within the fit. B5: every exposed face that is NO PLACE, with its reason (capped, frozen,
// below the face map's share, under an overhang, closed for the piece). ⭐ INFORMATION (his Q3): exit 0 when read, until the playability brief
// names the faces a later part needs. NOTHING of the game is changed.
// Usage:  npx vite-node scripts/surface/check_where_each_part_lands.ts -- <scene.glb>        exit 0: read · 2: no file / not read
import { readFileSync } from "node:fs";
import { glbBin, partGeometry, type Placement } from "../../src/core/glb_geometry";
import { landingPerStage } from "../../src/core/landing_per_stage";
import { glbJson, readModelCatalog } from "../../src/core/model_catalog";
import { readPartSolids } from "../../src/core/part_checks";
import { inGameFaceMap } from "../../src/input/face_map_membership";

const file = process.argv.slice(2).find((a) => a.endsWith(".glb")) ?? process.env["GLB"];
if (file === undefined) {
  console.log("usage: npx vite-node scripts/surface/check_where_each_part_lands.ts -- <scene.glb>");
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
const t0 = performance.now();
const parts = readPartSolids(j.json, glbBin(bytes), catalog);
const mm = catalog.unitM * 1000;
const goals = new Map<string, Placement>(partGeometry(j.json, glbBin(bytes), catalog).map((g) => [g.id, { position: [g.goal.position[0] * mm, g.goal.position[1] * mm, g.goal.position[2] * mm], rotation: g.goal.rotation }]));
const frozen = new Set(catalog.parts.filter((p) => p.frozen).map((p) => p.id));
const stages = landingPerStage(parts, goals, frozen, { inFaceMap: (faces) => inGameFaceMap(faces, frozen) });
const total = (performance.now() - t0) / 1000;
console.log(`B3 / B5 on ${file}: ${stages.length} stages, ${total.toFixed(1)} s — INFORMATION (ORBIT_SURFACE_PART_CHECKS.md §14 Q3: no pass rule until the playability brief)`);
const counts = new Map<string, number>();
for (const s of stages) {
  if (s.resting === null) {
    console.log(`  stage ${s.placed.length + 1}: ${s.held} — NO ORIENTATION (no resting proxy, no resting candidate): not read`);
    continue;
  }
  const places = s.faces.filter((f) => f.reason === null);
  const area = (fs: typeof s.faces) => fs.reduce((a, f) => a + f.areaMm2, 0);
  const by = new Map<string, typeof s.faces>();
  for (const f of s.faces) if (f.reason !== null) by.set(f.reason, [...(by.get(f.reason) ?? []), f]);
  const reasons = [...by.entries()].map(([r, fs]) => `${r} ${fs.length} (${(area(fs) / 100).toFixed(0)} cm²)`).join(", ");
  const below = s.faces.reduce((a, f) => a + f.below, 0);
  console.log(`  stage ${s.placed.length + 1}: ${s.held} resting on ${s.resting}, over ${s.faces.length} exposed faces — PLACES ${places.length} (${(area(places) / 100).toFixed(0)} cm²; landable ${s.faces.filter((f) => f.landable).length}); no place: ${reasons || "none"}${below > 0 ? `; ${below} samples fall BELOW their face (no solid under the proxy)` : ""} — ${(s.ms / 1000).toFixed(1)} s`);
  for (const [r, fs] of by) counts.set(r, (counts.get(r) ?? 0) + fs.length);
}
console.log(`VERDICT: READ (information) — no place by reason over the stages: ${[...counts.entries()].map(([r, n]) => `${r} ${n}`).join(", ") || "none"}`);
process.exit(0);

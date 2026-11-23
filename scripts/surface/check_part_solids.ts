// ⭐⭐ THE PARTS' SOLIDS — check B1 of PART_AUTHORING.md §6 on the game's side, for ANY scene's exported .glb (ORBIT_SURFACE_PART_CHECKS.md; the
// rules D4 – D7 of PART_AUTHORING.md §6.4). Per part, read with the game's own readers: its collision pieces (UCX_) convex, closed, with volume,
// within the budget (B1a – B1d); its face proxy (UFM_) on its solids within the fit (B1e), facing out (B1f), COMPLETE on each solid face it lies
// on — a strip at the face's edges told from a hole inside it (B1h). NOTHING of the game is changed. Run at the export gate (SCENE_WORKFLOW.md
// §6.3 item 5, §7.3), for every new scene and again on the scenes built.
//
// ⭐ And B2 (the map per stage: each proxy face exposed, glued, buried or sealed) with B1i (D7, PROPOSED: the proxy over every face the outside
// reaches) — printed as information, outside the verdict until his word.
// Usage (one process; Scene_2's 17 parts: about 10 s on the owner's PC):
//   npx vite-node scripts/surface/check_part_solids.ts -- <scene.glb>        exit 0: PASS · 1: findings · 2: no file / not read
import { readFileSync } from "node:fs";
import { glbBin, partGeometry, type Placement } from "../../src/core/glb_geometry";
import { glbJson, readModelCatalog } from "../../src/core/model_catalog";
import { B1_FIT_MM, checkProxyFaces, checkSolids, exposedPerStage, readPartSolids } from "../../src/core/part_checks";

const file = process.argv.slice(2).find((a) => a.endsWith(".glb")) ?? process.env["GLB"];
if (file === undefined) {
  console.log("usage: npx vite-node scripts/surface/check_part_solids.ts -- <scene.glb>");
  process.exit(2);
}
const bytes = new Uint8Array(readFileSync(file));
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
const found = checkSolids(parts);
console.log(`B1 on ${file}: ${parts.length} parts, the fit ${B1_FIT_MM} mm (a part's extras.fit_tol above it), ${(performance.now() - t0).toFixed(0)} ms`);
for (const f of found) console.log(`  ${f.check} ${f.part} ${f.node}: ${f.detail}`);
// ⭐ (S5) B2 — the map per stage (no pass rule: a map), and B1i (D7, PROPOSED — information, not counted in the verdict until his word)
const mm = catalog.unitM * 1000;
const goals = new Map<string, Placement>(partGeometry(j.json, glbBin(bytes), catalog).map((g) => [g.id, { position: [g.goal.position[0] * mm, g.goal.position[1] * mm, g.goal.position[2] * mm], rotation: g.goal.rotation }]));
const map = exposedPerStage(parts, goals, new Set(catalog.parts.filter((p) => p.frozen).map((p) => p.id)));
const last = map.stages[map.stages.length - 1];
console.log(`B2 at ${map.stepMm} mm (a gap under it reads closed): ${map.stages.length} stages; the last — each part's proxy triangles e(xposed) / g(lued) / b(uried) / s(ealed):`);
if (last !== undefined) console.log("  " + last.parts.map((p) => `${p.id} e${p.exposed}/g${p.glued}/b${p.buried}/s${p.sealed}`).join(" "));
for (const f of map.uncovered) console.log(`  (D7, PROPOSED) ${f.check} ${f.part}: ${f.detail}`);
// ⭐⭐ (S6) THE PROXY RULES (`30_OBJECTS_3D/spec/PROXY_AND_COLLISION_RULES.md`, DECIDED 2026-11-23) — R7, R3, R4, R2 on each proxy face; a riser information
const rulesFound = checkProxyFaces(parts, new Map(partGeometry(j.json, glbBin(bytes), catalog).map((g) => [g.id, { position: [0, 0, 0], rotation: g.goal.rotation }])));
console.log(`the proxy rules (R7 one face a node, R3 no travelled face under 10 mm, R4 30° apart / not near 45°, R2 ON its real face): ${rulesFound.length} finding(s)`);
for (const f of rulesFound) console.log(`  ${f.rule}${f.info ? " (information)" : ""} ${f.part} ${f.node}: ${f.detail}`);
const failing = found.length + rulesFound.filter((f) => !f.info).length;
console.log(failing === 0 ? "PASS" : `FAIL — ${failing} finding(s): fix the file in Blender (PROXY_AND_COLLISION_RULES.md), or write an exemption per piece`);
process.exit(failing === 0 ? 0 : 1);

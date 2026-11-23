// ⭐⭐ THE PARTS' SOLIDS — check B1 of PART_AUTHORING.md §6 on the game's side, for ANY scene's exported .glb (ORBIT_SURFACE_PART_CHECKS.md; the
// rules D4 – D7 of PART_AUTHORING.md §6.4). Per part, read with the game's own readers: its collision pieces (UCX_) convex, closed, with volume,
// within the budget (B1a – B1d); its face proxy (UFM_) on its solids within the fit (B1e), facing out (B1f), COMPLETE on each solid face it lies
// on — a strip at the face's edges told from a hole inside it (B1h). NOTHING of the game is changed. Run at the export gate (SCENE_WORKFLOW.md
// §6.3 item 5, §7.3), for every new scene and again on the scenes built.
//
// Usage (one process; Scene_2's 17 parts: about 5 s on the owner's PC):
//   npx vite-node scripts/surface/check_part_solids.ts -- <scene.glb>        exit 0: PASS · 1: findings · 2: no file / not read
import { readFileSync } from "node:fs";
import { glbBin } from "../../src/core/glb_geometry";
import { glbJson, readModelCatalog } from "../../src/core/model_catalog";
import { B1_FIT_MM, checkSolids, readPartSolids } from "../../src/core/part_checks";

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
console.log(found.length === 0 ? "PASS" : `FAIL — ${found.length} finding(s): fix the file in Blender, or write an exemption per piece (ORBIT_SURFACE_PART_CHECKS.md §8)`);
process.exit(found.length === 0 ? 0 : 1);

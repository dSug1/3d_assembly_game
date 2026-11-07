// ⭐⭐⭐ (2026-11-04, Step 4c, the owner: *"make sure the orbit slide (the pieces translate the way the green box orbits) does not pollute the gizmo"*) — THE
// GIZMO READS THE PARTS AT REST. ⭐⭐⭐ (2026-11-07, §30 S1) the ropes no longer cast rays on meshes at all: each section is cut EXACTLY from the placed
// parts' vertices on their MODEL pose (`placedParts` → `modelHit` → `unswayHit`), so the orbit's sway (its translation, its turn) cannot reach the gizmo or
// a line. ⛔ `swayRay` (a ray moved onto each swaying mesh, `d926b88`) — DELETED with the mesh cast it served.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { unswayHit } from "../src/input/assembly_orbit";
import { buildSection, sectionCast } from "../src/input/section";
import { planeThrough } from "../src/input/plane_cut";
import { qFromAxisAngle, qRotate, type Quat, type Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const I: Quat = [1, 0, 0, 0];

describe("⭐⭐⭐ the gizmo reads the parts AT REST — the orbit's sway (its translation, its turn) never moves it", () => {
  it("⭐⭐ a vertex of the mesh AS DRAWN (swayed 5 mm and turned 4.5°) brought back onto the model pose is the model's vertex — exactly", () => {
    const modelRot = qFromAxisAngle([0, 0, 1], 0.3);
    const modelPos: Vec3 = [0.2, 0.1, 0];
    const meshRot = qFromAxisAngle([0, 1, 0], (4.5 * Math.PI) / 180);
    const meshPos: Vec3 = [0.2, 0.105, 0.002];
    for (const local of [[0.1, 0.2, -0.05], [-0.3, 0, 0.4]] as Vec3[]) {
      const r0 = qRotate(modelRot, local);
      const r1 = qRotate(meshRot, local);
      const atRest: Vec3 = [r0[0] + modelPos[0], r0[1] + modelPos[1], r0[2] + modelPos[2]];
      const drawn: Vec3 = [r1[0] + meshPos[0], r1[1] + meshPos[1], r1[2] + meshPos[2]];
      unswayHit(drawn, null, meshPos, meshRot, modelPos, modelRot).point.forEach((x, k) => expect(x).toBeCloseTo(atRest[k]!, 12));
    }
    expect(unswayHit([1, 2, 3], null, [0, 0, 0], I, [0, 0, 0], I).point).toEqual([1, 2, 3]);
  });
  it("⭐⭐⭐ the section of the parts at rest: a drop near a part's edge lands on the part as it RESTS, whatever the drawn mesh does (⛔ a ray on the swayed mesh: 5 mm off its plane, or a miss)", () => {
    const atRest: Vec3[] = [];
    for (const x of [0, 1]) for (const y of [0, 0.5]) for (const z of [-0.5, 0.5]) atRest.push([x, y, z]);
    const sec = buildSection([atRest], planeThrough([0, 0, 0], [0, 0, 1]), 0);
    for (const y of [0.498, 0.25, 0.002]) {
      const h = sectionCast(sec, [2, y, 0], [-1, 0, 0], 3, null)!;
      expect(h.point[0]).toBeCloseTo(1, 12);
      expect(h.point[1]).toBeCloseTo(y, 12);
    }
  });
  it("⭐⭐⭐ wired: the sections' parts are the model poses (`modelHit` on every vertex), each landing an exact section cast (`sectionLanding`); no pick or mesh ray left", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const v = modelHit(st, m, [w0.x, w0.y, w0.z], null).point;");
    expect(a).toContain("const sec = buildSection(parts.parts, plane, w);");
    expect(a).toContain("rope = buildRope(at, (q) => sectionLanding(sec, runs.get(q.facet), L.facets[q.facet]!.cap, q, ids), from, to, LINE_STEP_M, total, sec.w);");
    // the comments stripped on the RAW file (⛔ on the whitespace-collapsed one, the first `//` took the rest of the file: the check was empty)
    const raw = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    expect(raw).toContain("function placedParts(st"); // the strip kept the code
    for (const gone of ["pickWithRay(", "intersectsMesh(", "modelCast(", "swayRay("]) expect(raw).not.toContain(gone);
  });
});

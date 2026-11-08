// ⭐⭐⭐ (2026-11-04, Step 4c, the owner: *"make sure the orbit slide (the pieces translate the way the green box orbits) does not pollute the gizmo"*) — THE
// GIZMO READS THE PARTS AT REST. ⭐⭐⭐ (2026-11-08, scope §32) the close-in chart casts each placed part's CONVEX HULL built from its vertices brought back
// onto its MODEL pose (`unswayHit`, `placedParts` in `render/assembly_wiring.ts`) — no ray on the swaying meshes is left. ⛔ `swayRay` / `modelCast`
// (the ray moved onto each mesh as drawn) deleted with §29's per-place casts.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { unswayHit } from "../src/input/assembly_orbit";
import { castHulls, hullParts } from "../src/input/close_in_chart";
import { qFromAxisAngle, qRotate, type Quat, type Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const I: Quat = [1, 0, 0, 0];

describe("⭐⭐⭐ the gizmo reads the parts AT REST — the orbit's sway (its translation, its turn) never moves it", () => {
  // a part at rest x 0…1, y 0…0.5, z −0.5…0.5; the sway moves its mesh 5 mm in +y and turns it 4.5° — a drop along −x near its top edge
  const lo: Vec3 = [0, 0, -0.5];
  const hi: Vec3 = [1, 0.5, 0.5];
  const corners: Vec3[] = [0, 1, 2, 3, 4, 5, 6, 7].map((c) => [c & 1 ? hi[0] : lo[0], c & 2 ? hi[1] : lo[1], c & 4 ? hi[2] : lo[2]]);
  const meshRot = qFromAxisAngle([0, 1, 0], (4.5 * Math.PI) / 180);
  const meshPos: Vec3 = [0, 0.005, 0];
  const drawn = corners.map((v) => {
    const r = qRotate(meshRot, v);
    return [r[0] + meshPos[0], r[1] + meshPos[1], r[2] + meshPos[2]] as Vec3;
  });
  it("⭐⭐⭐ the hull built from the vertices brought back onto the model pose is the part at rest: a drop near its edge lands where it lands at rest — ⛔ the hull of the vertices AS DRAWN: 5 mm off the ray's plane, near the edge missed", () => {
    const back = drawn.map((v) => unswayHit(v, null, meshPos, meshRot, [0, 0, 0], I).point);
    const atRest = hullParts([back], ["p"]);
    const asDrawn = hullParts([drawn], ["p"]);
    for (const y of [0.498, 0.25, 0.002]) {
      const h = castHulls(atRest, [2, y, 0], [-1, 0, 0], 3)!;
      expect(h.point[0]).toBeCloseTo(1, 9);
      expect(h.point[1]).toBeCloseTo(y, 12);
      if (y === 0.002) expect(castHulls(asDrawn, [2, y, 0], [-1, 0, 0], 3)).toBeNull(); // the swayed part moved out of the ray
      if (y === 0.498) expect(Math.abs(castHulls(asDrawn, [2, y, 0], [-1, 0, 0], 3)!.point[0] - 1)).toBeGreaterThan(0.002); // its face turned (3 mm off)
    }
  });
  it("⭐⭐⭐ wired: the chart's hulls from the placed parts' MODEL-pose vertices; no pick on the swaying meshes", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("const v = modelHit(st, m, [w0.x, w0.y, w0.z], null).point;");
    expect(a).toContain("const hulls = hullParts(pp.parts, pp.ids);");
    const raw = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    expect(raw).toContain("function placedParts(st"); // the strip kept the code
    for (const gone of ["pickWithRay(", "intersectsMesh(", "swayRay("]) expect(raw).not.toContain(gone);
  });
});

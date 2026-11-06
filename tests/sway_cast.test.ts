// ⭐⭐⭐ (2026-11-04, Step 4c, the owner: *"make sure the orbit slide (the pieces translate the way the green box orbits) does not pollute the gizmo"*) — THE
// RAY CAST IN THE MODEL'S SPACE (`swayRay`, `input/assembly_orbit.ts`; `modelCast`, `render/assembly_wiring.ts`). 2026-11-01 (`ffcb744`) brought a hit on a
// swaying mesh back onto its model pose (`unswayHit`) — but the ray itself still met the meshes AS DRAWN.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { swayRay, unswayHit } from "../src/input/assembly_orbit";
import { qFromAxisAngle, qRotate, type Quat, type Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const I: Quat = [1, 0, 0, 0];

/** the first hit of a ray on an axis-aligned box (slab test), or null */
function hitBox(o: Vec3, d: Vec3, lo: Vec3, hi: Vec3): Vec3 | null {
  let t0 = 0;
  let t1 = 1e9;
  for (let k = 0; k < 3; k++) {
    if (Math.abs(d[k]!) < 1e-12) {
      if (o[k]! < lo[k]! || o[k]! > hi[k]!) return null;
      continue;
    }
    const a = (lo[k]! - o[k]!) / d[k]!;
    const b = (hi[k]! - o[k]!) / d[k]!;
    t0 = Math.max(t0, Math.min(a, b));
    t1 = Math.min(t1, Math.max(a, b));
  }
  return t0 <= t1 ? [o[0] + d[0] * t0, o[1] + d[1] * t0, o[2] + d[2] * t0] : null;
}

describe("⭐⭐⭐ the gizmo reads the parts AT REST — the orbit's sway (its translation, its turn) never moves it", () => {
  // a part at rest x 0…1, y 0…0.5; the sway moves its mesh 5 mm in +y, ACROSS the drop (a drop along −x, as on a side)
  const lo: Vec3 = [0, 0, -0.5];
  const hi: Vec3 = [1, 0.5, 0.5];
  const model: Vec3 = [0, 0, 0];
  const drawn: Vec3 = [0, 0.005, 0];
  const drawnBox = (v: Vec3): Vec3 => [v[0], v[1] + 0.005, v[2]];
  it("⭐⭐⭐ a drop near the part's edge: on the ray at rest (in the red plane) — ⛔ cast against the swayed mesh, its hit mapped back: 5 mm off the ray; nearer the edge, missed", () => {
    for (const y of [0.498, 0.25, 0.002]) {
      const o: Vec3 = [2, y, 0];
      const d: Vec3 = [-1, 0, 0];
      const atRest = hitBox(o, d, lo, hi)!;
      // ⭐ now: the ray moved onto the mesh as drawn, its hit brought back
      const r = swayRay(o, d, drawn, I, model, I);
      const h = hitBox(r.origin, r.dir, drawnBox(lo), drawnBox(hi))!;
      const back = unswayHit(h, null, drawn, I, model, I).point;
      back.forEach((x, k) => expect(x).toBeCloseTo(atRest[k]!, 12));
      // ⛔ before: the ray in the world against the swayed mesh, only the hit mapped back
      const old = hitBox(o, d, drawnBox(lo), drawnBox(hi));
      if (y === 0.498) expect(Math.abs(unswayHit(old!, null, drawn, I, model, I).point[1] - y)).toBeCloseTo(0.005, 12); // off the ray, off the red plane
      if (y === 0.002) expect(old).toBeNull(); // missed — the part swayed out of the ray
    }
  });
  it("⭐⭐ the sway's TURN too: the ray moved onto a turned mesh and back is the same ray (the round trip exact)", () => {
    const meshRot = qFromAxisAngle([0, 1, 0], (4.5 * Math.PI) / 180);
    const meshPos: Vec3 = [0.01, 0.002, -0.003];
    const modelRot = qFromAxisAngle([0, 0, 1], 0.3);
    const modelPos: Vec3 = [0.2, 0.1, 0];
    const o: Vec3 = [1, 0.3, -0.2];
    const d: Vec3 = [-0.8, 0, -0.6];
    const r = swayRay(o, d, meshPos, meshRot, modelPos, modelRot);
    for (const t of [0, 0.4, 1.3]) {
      const p: Vec3 = [r.origin[0] + r.dir[0] * t, r.origin[1] + r.dir[1] * t, r.origin[2] + r.dir[2] * t];
      const back = unswayHit(p, r.dir, meshPos, meshRot, modelPos, modelRot);
      back.point.forEach((x, k) => expect(x).toBeCloseTo(o[k]! + d[k]! * t, 12));
      back.normal!.forEach((x, k) => expect(x).toBeCloseTo(d[k]!, 12));
    }
    expect(Math.hypot(...r.dir)).toBeCloseTo(1, 12);
    void qRotate;
  });
  it("⭐⭐⭐ wired: every ray the gizmo and the sections read — ⭐ (Step 4c-bis) the face map's ray along the axis (`rawGizmo`), the lines' samples through it — is cast in the model's space (`modelCast`); no pick on the swaying meshes is left", () => {
    const a = code("render/assembly_wiring.ts");
    // ⭐⭐⭐ (§22) the ring's and the lines' ray (`realOn`) in the model's space; the gizmo's place casts nothing
    expect(a).toContain("return modelCast(st, [p[0] + n[0] * k, p[1] + n[1] * k, p[2] + n[2] * k], [-n[0], -n[1], -n[2]], out - sup(-1) + MAP_OUT_M);");
    expect(a).toContain("const h = realOn(st, c, f.n);");
    // ⭐ (2026-11-04, the audit) the drawn place and turn read once a frame (`castParts`), the ray moved onto each part as drawn
    expect(a).toContain("const m = swayRay(origin, dir, c.drawnAt, c.drawnQ, c.pose.position, c.pose.orientation);");
    expect(a).toContain("parts.push({ mesh, pose: worldPlacementOf(st.world, id), drawnAt: [p.x, p.y, p.z], drawnQ: [r.w, r.x, r.y, r.z]");
    // the comments stripped on the RAW file (⛔ on the whitespace-collapsed one, the first `//` took the rest of the file: the check was empty)
    const raw = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    expect(raw).toContain("function modelCast(st"); // the strip kept the code
    expect(raw).not.toContain("pickWithRay(");
  });
});

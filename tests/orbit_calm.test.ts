/**
 * ⭐⭐⭐ THE CALM — A FUNCTION OF THE PLACE (2026-11-05, `TILTED_ORBIT_REBUILD_SCOPE.md` §21.6 F5, the owner: *"do all"*): `src/input/orbit_calm.ts`, wired in
 * `render/assembly_wiring.ts`. The piece's direction a field over the faces contour — a face's normal in its middle (the orbit's angle at the interior
 * share), a bisector on an edge, a cap's normal on the cap and at its edges (F3) — the SAME approached from every side: continuous wherever the place is.
 * RED against `600518c` (`calmDir(p, facets, u, up, o)`, `polyDistance`, `calmWeight`, `calmZone` absent: the calm two shares as a state about the current
 * face — at a corner the face changed to had no angle to multiply, the piece jumped up to 3.3 m far out, §21.6).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { calmDir, calmWeight, calmZone, polyDistance, type CalmFacet, type CalmOpts } from "../src/input/orbit_calm";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";
import type { Vec3 } from "../src/core/vec";

const code = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const deg = Math.PI / 180;
const UP: Vec3 = [0, 1, 0];
const ang = (a: Vec3, b: Vec3) => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) / deg;
const unit = (u: Vec3): Vec3 => {
  const l = Math.hypot(...u);
  return [u[0] / l, u[1] / l, u[2] / l];
};

/** a box's six facets (`Scene_1`'s painting: 50 cm wide, 48 cm high, 7 cm deep) */
function box(lo: Vec3, hi: Vec3): CalmFacet[] {
  const f: CalmFacet[] = [];
  for (let a = 0; a < 3; a++)
    for (const s of [-1, 1]) {
      const b = (a + 1) % 3;
      const e = (a + 2) % 3;
      const n = [0, 0, 0];
      n[a] = s;
      const poly: Vec3[] = [];
      for (const [p, q] of [[0, 0], [1, 0], [1, 1], [0, 1]] as const) {
        const v = [0, 0, 0];
        v[a] = s > 0 ? hi[a]! : lo[a]!;
        v[b] = p ? hi[b]! : lo[b]!;
        v[e] = q ? hi[e]! : lo[e]!;
        poly.push(v as unknown as Vec3);
      }
      f.push({ n: n as unknown as Vec3, poly, cap: a === 1 });
    }
  return f;
}
const LO: Vec3 = [-0.25, 0, -0.07];
const HI: Vec3 = [0.25, 0.48, 0];
const B = box(LO, HI);
const O: CalmOpts = { shareH: 0.25, shareV: 0.25, zoneH: calmZone(0.5, 25, 0.03), zoneV: calmZone(0.48, 25, 0.03) };
const FRONT: Vec3 = [0, 0, -1];
/** the orbit's direction `a` round from the front, `b` up */
const dir = (a: number, b: number): Vec3 => [Math.cos(b * deg) * Math.sin(a * deg), Math.sin(b * deg), -Math.cos(b * deg) * Math.cos(a * deg)];

describe("⭐⭐⭐ THE CALM — a function of the place (§21.6 F5)", () => {
  it("⭐ the distance to a facet's polygon: to its plane over it, to its nearest edge beside it; the weight 1 on it, 0 past its zone, a smoothstep between", () => {
    const front = B.find((f) => f.n[2] === -1)!;
    expect(polyDistance([0, 0.2, -0.1], front.poly, front.n)).toBeCloseTo(0.03, 12);
    expect(polyDistance([0.3, 0.2, -0.07], front.poly, front.n)).toBeCloseTo(0.05, 12);
    expect(polyDistance([0.3, 0.6, -0.07], front.poly, front.n)).toBeCloseTo(Math.hypot(0.05, 0.12), 12);
    expect(calmWeight(0, 0.1)).toBe(1);
    expect(calmWeight(0.1, 0.1)).toBe(0);
    expect(calmWeight(0.05, 0.1)).toBeCloseTo(0.5, 12);
    expect(calmWeight(0, 0)).toBe(1);
    expect(calmZone(0.48, 25, 0.03)).toBeCloseTo(0.12, 12);
    expect(calmZone(0.07, 25, 0.03)).toBe(0.03);
  });

  it("⭐⭐⭐ IN THE MIDDLE OF A FACE near square: the orbit's angle at the interior share (58d86ff's: a 60° offset shows 15°); square on, exactly the face's normal", () => {
    const mid: Vec3 = [0, 0.24, -0.07];
    expect(ang(calmDir(mid, B, FRONT, UP, O), FRONT)).toBeLessThan(1e-9);
    const s = calmDir(mid, B, dir(60, 0), UP, O);
    expect(ang(s, FRONT)).toBeCloseTo(15, 9);
    // dy off (`faceSpanShareVOn` 0 → the vertical share 1): the vertical angle shown whole, the horizontal still calmed
    const w = calmDir(mid, B, dir(0, 40), UP, { ...O, shareV: 1 });
    expect(Math.asin(w[1]) / deg).toBeCloseTo(40, 9);
  });

  it("⭐⭐⭐ CONTINUOUS ACROSS AN EDGE AND A CORNER: approached from each face the same direction (an edge's bisector; the top's normal at the top's corners) — for any orbit direction", () => {
    const e = 1e-7;
    for (const u of [dir(0, 0), dir(40, 20), dir(-70, -30), dir(100, 10)]) {
      // the front ↔ the +x side's vertical edge, mid-height
      const a = calmDir([0.25 - e, 0.24, -0.07], B, u, UP, O);
      const b = calmDir([0.25, 0.24, -0.07 + e], B, u, UP, O);
      expect(ang(a, b)).toBeLessThan(1e-3);
      // the top's corner over the front and the +x side, from the three faces
      const c1 = calmDir([0.25 - e, 0.48 - e, -0.07], B, u, UP, O);
      const c2 = calmDir([0.25, 0.48 - e, -0.07 + e], B, u, UP, O);
      const c3 = calmDir([0.25 - e, 0.48, -0.07 + e], B, u, UP, O);
      expect(ang(c1, c2)).toBeLessThan(1e-3);
      expect(ang(c1, c3)).toBeLessThan(1e-3);
      expect(ang(c3, UP)).toBeLessThan(1e-3);
    }
    // a deep box (no face within the zone behind): with the orbit along it, the vertical edge's direction is the two normals' bisector
    const m = calmDir([0.25, 0.24, -0.25], box([-0.25, 0, -0.25], [0.25, 0.48, 0.25]), unit([1, 0, -1]), UP, O);
    expect(ang(m, unit([1, 0, -1]))).toBeLessThan(1e-5);
  });

  it("⭐⭐⭐ (F3) THE CAMERA SQUARE TO A CAP: on the top its normal whatever the orbit; at the top's edge too; turning to the wall's over the zone below", () => {
    for (const u of [dir(0, 10), dir(30, 70), dir(-20, 95)]) {
      expect(ang(calmDir([0.1, 0.48, -0.03], B, u, UP, O), UP)).toBeLessThan(1e-9);
      expect(ang(calmDir([0.1, 0.48, -0.07], B, u, UP, O), UP)).toBeLessThan(1e-9);
    }
    let prev = 0;
    for (let d = 0; d <= 0.13; d += 0.01) {
      const tilt = ang(calmDir([0, 0.48 - d, -0.07], B, FRONT, UP, O), UP);
      expect(tilt).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = tilt;
    }
    expect(prev).toBeCloseTo(90, 9);
  });

  it("⭐⭐⭐ NO STEP ANYWHERE: a walk up the front, over the top, down the back, and round the +x side and back onto the front — no turn over 3° per mm (⛔ the shares' state: 3.3 m far out at a corner)", () => {
    const path: Vec3[] = [];
    for (let y = 0.05; y <= 0.48; y += 0.001) path.push([0.24, y, -0.07]);
    for (let z = -0.07; z <= 0; z += 0.001) path.push([0.24, 0.48, z]);
    for (let y = 0.48; y >= 0.3; y -= 0.001) path.push([0.24, y, 0]);
    for (let x = 0.24; x <= 0.25; x += 0.001) path.push([x, 0.3, 0]);
    for (let z = 0; z >= -0.07; z -= 0.001) path.push([0.25, 0.3, z]);
    for (let x = 0.25; x >= 0.15; x -= 0.001) path.push([x, 0.3, -0.07]);
    for (const u of [dir(10, 15), dir(80, -20)]) {
      let worst = 0;
      for (let i = 1; i < path.length; i++) worst = Math.max(worst, ang(calmDir(path[i - 1]!, B, u, UP, O), calmDir(path[i]!, B, u, UP, O)));
      expect(worst).toBeLessThan(3);
    }
  });

  it("⭐⭐⭐ wired: the piece and the camera on the field at the map's place (the gizmo on the orbit's own); the contour the upright map's; ⛔ the shares' state, its eases and re-expressions deleted; the seven sliders kept", () => {
    const a = code("render/assembly_wiring.ts");
    expect(a).toContain("return n === null ? calmAt(st, yaw, v, u) : coneClamp(u, n, st.asmLock!.cone ?? undefined);");
    expect(a).toContain("return c === null || p === null ? u : calmDir(p, c.facets, u, [0, 1, 0], c.opts);");
    expect(a).toContain("const map = faceMapOf(st, UPRIGHT);");
    expect(a).toContain("const p = toWorld(st.orbitFrame, mapTarget(map, yaw + dy, pitchOfV(v) + dp, mapOpts(st)).surface);");
    for (const gone of ["sharesShowing", "calmFrame(", "asmCalm", "edgeShareTo", "poleWeight"]) expect(a).not.toContain(gone);
    expect(code("render/scene_state.ts")).not.toContain("asmCalm");
    const m = code("render/tuning_menu.ts");
    const i = m.indexOf('title: "FACE-SPAN ORBIT SHARE"');
    expect(i).toBeGreaterThan(m.indexOf('title: "CAMERA ORBIT AROUND CENTER"'));
    const sub = m.slice(i, m.indexOf("],", i));
    for (const k of ["faceSpanShareH", "faceSpanZoneHPct", "faceSpanZoneMinHCm", "faceSpanShareVOn", "faceSpanShareV", "faceSpanZoneVPct", "faceSpanZoneMinVCm"]) expect(sub).toContain(`"${k}"`);
    const d = DEFAULT_CONFIG;
    expect([d.faceSpanShareH, d.faceSpanZoneHPct, d.faceSpanZoneMinHCm, d.faceSpanShareVOn, d.faceSpanShareV, d.faceSpanZoneVPct, d.faceSpanZoneMinVCm]).toEqual([0.25, 25, 3, 1, 0.25, 25, 3]);
    expect(() => validateGestureConfig({ ...d, faceSpanShareVOn: 0.5 })).toThrow();
    expect(() => validateGestureConfig({ ...d, faceSpanShareH: 1.5 })).toThrow();
  });
});

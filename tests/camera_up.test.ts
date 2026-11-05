/**
 * ⭐⭐⭐ THE CAMERA'S UP — ONE RULE TIED TO THE VIEW (2026-11-05, the redesign — `TILTED_ORBIT_REBUILD_SCOPE.md` §20; the owner on Step 6: *"camera views
 * upside down … slanted camera views"*): `src/input/camera_up.ts`, wired in `render/assembly_wiring.ts`. Off the vertical (> 45°) gravity's up; near it
 * (< 35°) the up carried; between, the carried up rolled onto gravity — the half roll at a cap's far edge, the quarter at a side edge, none back the way it
 * came; never a jump. RED against `d68312f` (the module absent; the camera's up the turned frame's).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { UP_CONE_HI, UP_CONE_LO, UP_FRESH, cameraUp, fromVertical, gravityUp, type UpCarry } from "../src/input/camera_up";
import type { Vec3 } from "../src/core/vec";

const D = Math.PI / 180;
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const angle = (a: Vec3, b: Vec3) => Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
/** the direction from the gizmo out toward the piece / the camera, `deg` from the front's normal (−z) over the top toward the back (+z), `side` turning it toward +x */
const over = (deg: number, side = 0): Vec3 => {
  const a = deg * D;
  const s = side * D;
  const u: Vec3 = [Math.sin(s) * Math.cos(a), Math.sin(a) * Math.cos(s), -Math.cos(a) * Math.cos(s)];
  const l = Math.hypot(...u);
  return [u[0] / l, u[1] / l, u[2] / l];
};
/** a walk: the up each frame along the views, carried */
function walk(views: readonly Vec3[]): { ups: Vec3[]; carry: UpCarry } {
  let carry = UP_FRESH;
  const ups: Vec3[] = [];
  for (const u of views) {
    const r = cameraUp(u, carry);
    ups.push(r.up);
    carry = r.next;
  }
  return { ups, carry };
}

describe("⭐⭐⭐ the camera's up — one rule tied to the view (§20)", () => {
  it("⭐⭐⭐ off the vertical (on every wall, from any path) the up is GRAVITY's — whatever was carried", () => {
    for (const deg of [0, 20, 40, -40]) {
      const u = over(deg, 25);
      expect(fromVertical(u)).toBeGreaterThan(UP_CONE_HI);
      const tilted: UpCarry = { up: [1, 0, 0], phi: null };
      const r = cameraUp(u, tilted);
      expect(angle(r.up, gravityUp(u)!)).toBeLessThan(1e-7);
    }
  });

  it("⭐⭐⭐ OVER A TOP AND DOWN THE FAR WALL: continuous, the HALF ROLL only in the last 10° before the far edge, upright again on the far wall (⛔ Step 6: upside down past the top's middle)", () => {
    const views: Vec3[] = [];
    for (let a = 0; a <= 180; a += 0.25) views.push(over(a, 0.0001));
    const { ups } = walk(views);
    let worst = 0;
    for (let i = 1; i < ups.length; i++) worst = Math.max(worst, angle(ups[i]!, ups[i - 1]!));
    expect(worst).toBeLessThan(10 * D); // no jump (the band's steepest: 180° over 10° of view, a smoothstep — ~4.5° a quarter degree)
    // on the front wall and the far wall: gravity's up (upright)
    for (const a of [10, 40, 140, 170]) {
      const i = Math.round(a / 0.25);
      expect(angle(ups[i]!, gravityUp(views[i]!)!)).toBeLessThan(1e-6);
    }
    // over the top (within 35° of the vertical: 55° … 125°) the up carried — no roll there: it turns only with the view
    const top = ups.slice(Math.round(60 / 0.25), Math.round(120 / 0.25));
    for (let i = 1; i < top.length; i++) expect(angle(top[i]!, top[i - 1]!)).toBeLessThan(0.5 * D);
    // the half roll between 125° and 135° (the band before the far edge) — and none between 45° and 55° (the way in, square: gravity = carried)
    const rolled = (from: number, to: number) => {
      let s = 0;
      for (let i = Math.round(from / 0.25) + 1; i <= Math.round(to / 0.25); i++) s += angle(ups[i]!, ups[i - 1]!);
      return s / D;
    };
    expect(rolled(45, 55)).toBeLessThan(15);
    expect(rolled(125, 135)).toBeGreaterThan(150);
  });

  it("⭐⭐ ONTO A TOP OFF SQUARE and back: NO ROLL at the crossing (the carried up starts as gravity's) and none coming back the way it came", () => {
    const views: Vec3[] = [];
    for (let a = 0; a <= 70; a += 0.25) views.push(over(a, 30));
    for (let a = 70; a >= 0; a -= 0.25) views.push(over(a, 30));
    const { ups } = walk(views);
    for (let i = 1; i < ups.length; i++) expect(angle(ups[i]!, ups[i - 1]!)).toBeLessThan(2 * D);
    expect(angle(ups[ups.length - 1]!, gravityUp(views[views.length - 1]!)!)).toBeLessThan(1e-6);
  });

  it("⭐⭐ ACROSS A TOP TO A SIDE EDGE: the QUARTER ROLL in the band before it, upright on the side wall", () => {
    // up onto the top square, then sideways over the +x edge
    const views: Vec3[] = [];
    for (let a = 0; a <= 90; a += 0.25) views.push(over(a, 0.0001));
    const top = over(90, 0.0001);
    for (let s = 0; s <= 80; s += 0.25) {
      const r = s * D;
      const u: Vec3 = [Math.sin(r), Math.cos(r) * top[1], Math.cos(r) * top[2]];
      const l = Math.hypot(...u);
      views.push([u[0] / l, u[1] / l, u[2] / l]);
    }
    const { ups } = walk(views);
    let worst = 0;
    for (let i = 1; i < ups.length; i++) worst = Math.max(worst, angle(ups[i]!, ups[i - 1]!));
    expect(worst).toBeLessThan(10 * D);
    const last = views[views.length - 1]!;
    expect(angle(ups[ups.length - 1]!, gravityUp(last)!)).toBeLessThan(1e-6);
    expect(UP_CONE_LO).toBeLessThan(UP_CONE_HI);
  });

  it("⭐ wired: the camera's frame from the view's up (`cameraUp`, `offsetWithUp`), the frame's own camera carrying it; ⛔ the turned frame's up and the roll owed gone", () => {
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).toContain("const r = cameraUp(u, st.asmUpCarry); if (commit) st.asmUpCarry = r.next; return offsetWithUp(u, r.up, o.yawRad, o.pitchRad);");
    expect(a).not.toContain("assemblyCameraFrameIn(");
    const c = readFileSync(new URL("../src/render/camera_rig.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(c).toContain("return assemblyCameraFrame(st, cam, off, dtMs !== undefined);");
  });
});

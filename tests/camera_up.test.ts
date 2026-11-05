/**
 * ⭐⭐⭐ THE CAMERA'S UP — A TARGET FROM THE FACE, TAKEN AT THE CAMERA'S PACE (2026-11-05, `TILTED_ORBIT_REBUILD_SCOPE.md` §21.4 R2 / R3, §21.5 F2):
 * `src/input/camera_up.ts`, wired in `render/assembly_wiring.ts`. A wall's gravity (straight down / up: its own up carried by the view's tilt — never the
 * side the view leans); a cap's axis, the wall's up turned over the edge crossed; the shown up turned toward the target at most a capped angle a frame — a
 * half roll at a top's far edge, a quarter at its side edge, never a step. RED against `ba47b75` (`upTarget`, `paceUp`, `capAxis(capN, wallN, up)` absent:
 * the up from the redesign's view rule).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ZENITH_FLIP_RAD, capAxis, capAxisPastZenith, paceUp, upTarget, wallUp } from "../src/input/camera_up";
import type { Vec3 } from "../src/core/vec";

const D = Math.PI / 180;
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const angle = (a: Vec3, b: Vec3) => Math.acos(Math.max(-1, Math.min(1, dot(a, b) / Math.hypot(...a) / Math.hypot(...b))));
const unit = (u: Vec3): Vec3 => {
  const l = Math.hypot(...u);
  return [u[0] / l, u[1] / l, u[2] / l];
};
const FRONT: Vec3 = [0, 0, -1];
const FAR: Vec3 = [0, 0, 1];
const SIDE: Vec3 = [1, 0, 0];
const TOP: Vec3 = [0, 1, 0];

describe("the camera's up (§21.4 R2 / R3, §21.5 F2)", () => {
  it("⭐ a WALL: gravity's up on the screen, at any view off the vertical (yawed, pitched)", () => {
    for (const u of [unit([0.3, 0.2, -1]), unit([-1, 0.5, -0.2]), [0, 0, 1] as Vec3]) {
      const g = unit([-u[1] * u[0], 1 - u[1] * u[1], -u[1] * u[2]]);
      expect(angle(upTarget(u, FRONT, null), g)).toBeLessThan(1e-6);
    }
  });

  it("⭐⭐⭐ near straight down at a wall's top edge: the wall's up carried by the tilt — the SAME whichever side the view leans (⛔ gravity's projection swung with the lean: a slanted axis carried onto the bottom, probed)", () => {
    const a = upTarget(unit([0.03, 1, -0.02]), FRONT, null);
    const b = upTarget(unit([-0.03, 1, -0.02]), FRONT, null);
    expect(angle(a, b)).toBeLessThan(5 * D);
    expect(angle(a, [0, 0, 1])).toBeLessThan(3 * D); // looking down over the front's top edge: up the screen is away from it
  });

  it("⭐⭐⭐ a CAP's axis: the wall's up turned over the edge (§20.1 (b)) — from the front onto the top +z, from the +x side −x; from no wall, the camera's up laid in it", () => {
    expect(angle(capAxis(TOP, FRONT, [1, 0, 0]), [0, 0, 1])).toBeLessThan(1e-9);
    expect(angle(capAxis(TOP, SIDE, [1, 0, 0]), [-1, 0, 0])).toBeLessThan(1e-9);
    expect(angle(capAxis(TOP, null, unit([1, 0.3, 0])), [1, 0, 0])).toBeLessThan(1e-9);
    expect(angle(wallUp(FAR), [0, 1, 0])).toBeLessThan(1e-12);
    expect(angle(upTarget(TOP, TOP, [0, 0, 1]), [0, 0, 1])).toBeLessThan(1e-9); // square over the top: the axis
  });

  it("⭐⭐⭐ THE HALF ROLL at the top's far edge and the QUARTER at its side edge are the next wall's up: from the top's axis (+z), the far wall asks −z, the side wall −x", () => {
    expect(angle(upTarget(TOP, FAR, null), [0, 0, -1])).toBeLessThan(1e-9);
    expect(angle(upTarget(TOP, SIDE, null), [-1, 0, 0])).toBeLessThan(1e-9);
  });

  it("⭐⭐⭐ PACED (F2): the shown up turns toward the target at most the cap a frame — 180° in ~30 steps of 6°, none larger; at the target it stays", () => {
    let up: Vec3 = [0, 0, 1];
    const target = unit([0.0001, 0, -1]);
    let worst = 0;
    let n = 0;
    for (; n < 60; n++) {
      const r = paceUp(up, target, TOP, 6 * D);
      worst = Math.max(worst, angle(up, r.up));
      up = r.up;
      if (!r.rolling && angle(up, target) < 1e-6) break;
    }
    expect(worst).toBeLessThanOrEqual(6 * D + 1e-9);
    expect(n).toBeGreaterThanOrEqual(29);
    expect(n).toBeLessThanOrEqual(31);
    expect(paceUp(null, [0, 0, 1], TOP, 6 * D).up).toEqual([0, 0, 1]);
  });

  it("⭐⭐⭐ (§21.8, B) THE HALF ROLL AT THE ZENITH: a cap's carried axis flips once the view leans 3° past straight above toward it — never before; flipped, it flips back only 3° past the other way (6° of hysteresis); wired in the travel's face, so the roles are read again (R4)", () => {
    const axis: Vec3 = [0, 0, 1];
    const lean = (deg: number): Vec3 => [0, Math.cos(deg * D), Math.sin(deg * D)]; // + toward the axis
    expect(capAxisPastZenith(axis, lean(-30))).toBe(axis); // on the near side: up the screen to the far edge
    expect(capAxisPastZenith(axis, lean(2.9))).toBe(axis);
    expect(capAxisPastZenith(axis, lean(3.1))).toEqual([-0, -0, -1]); // past the zenith: the far side's up
    const flipped: Vec3 = [0, 0, -1];
    expect(capAxisPastZenith(flipped, lean(-2.9))).toBe(flipped);
    expect(capAxisPastZenith(flipped, lean(-3.1))).toEqual([-0, -0, 1]);
    expect(ZENITH_FLIP_RAD).toBeCloseTo(3 * D, 12);
    // ⭐ an orbited cap leant 40° SIDEWAYS (a dx over the top): gravity's up, never the axis 90° off it (⛔ 1406 tilted frames, probed); square: the axis
    const side = unit([Math.sin(40 * D), Math.cos(40 * D), 0]);
    const g = unit([-side[1] * side[0], 1 - side[1] * side[1], -side[1] * side[2]]);
    expect(angle(upTarget(side, TOP, axis), g)).toBeLessThan(1e-6);
    expect(angle(upTarget(TOP, TOP, axis), axis)).toBeLessThan(1e-9);
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).toContain("const axis = carried === null ? null : capAxisPastZenith(carried, dirAt(st, yaw, st.orbit.elevation));");
  });

  it("⭐ wired: the camera's up from the travel face's target (`upTargetNow` → `upFor`), paced by `cameraRollDegPerS`; the roles read with the same up", () => {
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).toContain("const r = paceUp(st.asmUpShown, target, u, ((st.cfg.cameraRollDegPerS * Math.PI) / 180) * (Math.max(0, dtMs) / 1000));");
    expect(a).toContain("return face === null ? upTarget(u, [0, 0, -1], null) : upFor(u, face.n, face.axis, face.ahead);");
    expect(a).toContain("const up = upFor(n, n, axis, nAhead);");
    const c = readFileSync(new URL("../src/render/camera_rig.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(c).toContain("return assemblyCameraFrame(st, cam, off, dtMs);");
  });
});

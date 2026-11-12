/**
 * GOLDEN VECTORS — **A STEP ALONG A CONTACT IS NOT INTO IT** (2026-11-12, `CLOSE_IN_CONTACT.md` §9; the owner: *"when I am in contact … the pan is not
 * smooth: it looks like there is friction, or at least sometimes the delta position is not truly reflected in the gizmo and piece movement"*).
 * Probed: the piece at the bottom of the cube top's channel (on `Piece22`, the kept 1 mm gap), a slow dx left BLOCKED 7 mm short of the wall, the ring
 * free all the way (1 mm of gap at every place): the yaw's Jacobian level to 1e-8 against the floor's normal read as pushing INTO it — the feasibility
 * test was a product against `1e-12 × |a|`, blind to the step's length — and the projection took the WHOLE yaw away. Now INTO = an angle beyond
 * `TANGENT_TOL` (`intoContact`).
 */
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../src/core/vec";
import { intoContact, keepSense, projectExact, TANGENT_TOL } from "../src/input/piece_orbit_solver";

// the probed ring at the channel's floor: yaw moves the anchor 0.312 m / rad along x, v 0.966 m along z — and the yaw's row a hair off level (1e-8 up)
const J: [Vec3, Vec3] = [
  [0.31194, 1e-8, 0],
  [0, 0, 0.966],
];
const floor: Vec3 = [0, 1, 0];

describe("⭐⭐⭐ a step along the floor is taken whole — whichever way, whatever the ring's numerical slope", () => {
  it("⭐⭐⭐ dx LEFT along the floor (the yaw's row 1e-8 above level): the step itself — ⛔ [0, 0], blocked in free air", () => {
    const dq = [-0.002, 0] as const;
    expect(projectExact(dq, J, [floor])).toEqual(dq);
    // and the other way, as before
    expect(projectExact([0.002, 0], J, [floor])).toEqual([0.002, 0]);
    // the ring's slope the other sign: both ways whole
    const Jd: [Vec3, Vec3] = [[0.31194, -1e-8, 0], J[1]];
    expect(projectExact([0.002, 0], Jd, [floor])).toEqual([0.002, 0]);
    expect(projectExact([-0.002, 0], Jd, [floor])).toEqual([-0.002, 0]);
  });
  it("⭐⭐ a step that really pushes into the contact is still projected: down a slope steeper than the tolerance; a push straight in is refused", () => {
    // the yaw's row 1 % into the floor (≫ TANGENT_TOL): the step's normal part removed, the piece goes along
    const Js: [Vec3, Vec3] = [[0.3, -0.003, 0], J[1]];
    const s = projectExact([0.002, 0], Js, [floor]);
    expect(s).not.toEqual([0.002, 0]);
    // a dy along v pushing into a wall whose normal is −z: nothing left
    expect(projectExact([0, 0.003], J, [[0, 0, -1]])).toEqual([0, 0]);
  });
  it("⭐ `intoContact`: an angle beyond `TANGENT_TOL`, read against the anchor's speed", () => {
    expect(TANGENT_TOL).toBe(1e-3);
    expect(intoContact([1e-8, 0], [-0.002, 0], 0.31194 * 0.002)).toBe(false);
    expect(intoContact([-0.01, 0], [0.002, 0], 0.3 * 0.002)).toBe(true); // 1/30 of the motion into it
    expect(intoContact([0.01, 0], [0.002, 0], 0.3 * 0.002)).toBe(false); // away from it
  });
  it("⭐ `keepSense` on the same rule: a kept coordinate along the floor is not refused for the ring's noise", () => {
    // the slide [-0.002, 0.001] against an input [-0.002, -0.001]: v dropped (against the finger), the yaw kept — along the floor
    expect(keepSense([-0.002, 0.001], [-0.002, -0.001], J, [floor])).toEqual([-0.002, 0]);
  });
});

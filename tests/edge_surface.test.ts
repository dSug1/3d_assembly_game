/**
 * ⭐⭐⭐ THE PIECE ROUND AN EDGE, ON THE SURFACE (2026-11-05, branch `1.0.100-`; the traversal probes: a close-in dx stalled 630 frames at `Scene_1`'s
 * front-left corner — Piece3 standing 45 mm proud of the −x side). Two flaws, one each:
 * 1. `blendThroughEdges` — the gizmo through an edge was the CHORD between two real-surface points: 2.8 mm inside Piece3. A blended place's depth is
 *    cast (`cast`, along the blended normal, from half the chord + 5 mm in front): a surface in front of the chord takes it; never deeper.
 * 2. `faceLift` / `placeAtAngles` — the approach's end put the piece's RESTING FACE'S CENTRE on the gizmo (its bottom, in front of a wall: half its body
 *    behind the wall's plane — the collision alone kept it out, and round an edge it could not): now the piece's SUPPORT along the direction.
 * RED against `f1618e7` (`cast` ignored, `faceLift` absent, `placeAtAngles` without a lift).
 */
import { describe, expect, it } from "vitest";
import { faceLift } from "../src/input/orbit_shell";
import type { Quat, Vec3 } from "../src/core/vec";

const D = Math.PI / 180;
const I: Quat = [1, 0, 0, 0];

describe("⭐⭐⭐ the piece round an edge, on the surface (2026-11-05)", () => {

  it("⭐⭐⭐ `faceLift`: 0 square to the resting face, the piece's overhang past its centre as the direction tilts", () => {
    // a 0.1 × 0.04 × 0.045 box, its resting face its bottom (centre at y −0.02)
    const pts: Vec3[] = [];
    for (const x of [-0.05, 0.05]) for (const y of [-0.02, 0.02]) for (const z of [-0.0225, 0.0225]) pts.push([x, y, z]);
    const rc: Vec3 = [0, -0.02, 0];
    expect(faceLift(pts, I, rc, [0, 1, 0])).toBeCloseTo(0, 12); // over a top: the face itself
    expect(faceLift(pts, I, rc, [0, 0, -1])).toBeCloseTo(0.0225, 12); // in front of a wall: half its depth (⛔ 0 — half the body behind the wall's plane)
    const c = Math.cos(40 * D);
    const s = Math.sin(40 * D);
    expect(faceLift(pts, I, rc, [-c, 0, -s])).toBeCloseTo(0.05 * c + 0.0225 * s, 12); // round the corner: its corner
    // continuous in the direction: no jump
    let last = faceLift(pts, I, rc, [0, 0, -1]);
    for (let a = 0; a <= 90; a += 0.5) {
      const l = faceLift(pts, I, rc, [-Math.sin(a * D), 0, -Math.cos(a * D)]);
      expect(Math.abs(l - last)).toBeLessThan(0.001);
      last = l;
    }
  });


});

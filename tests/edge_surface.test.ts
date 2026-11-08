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
import { readFileSync } from "node:fs";
import { BLEND_REACH_M, blendThroughEdges, buildFaceMap, edgeBlend, mapTarget } from "../src/input/face_map";
import { faceLift, placeAtAngles } from "../src/input/orbit_shell";
import type { Quat, Vec3 } from "../src/core/vec";
import type { ShellBox } from "../src/input/orbit_shell";

const D = Math.PI / 180;
const box: ShellBox = { lo: [-0.25, 0, -0.05], hi: [0.25, 0.6, -0.017] };
const bm = buildFaceMap([], box);
const opts = { edgeMm: 10, edgeDeg: 10 };
const I: Quat = [1, 0, 0, 0];

describe("⭐⭐⭐ the piece round an edge, on the surface (2026-11-05)", () => {
  it("⭐⭐⭐ the blended place's depth CAST: a surface in front of the chord takes the gizmo — ⛔ the chord through the part", () => {
    // the −z front's slice end toward −x (yaw 225°): in the edge band
    const yaw = 224 * D;
    expect(edgeBlend(bm, yaw, 0, opts).h).not.toBeNull();
    const at = (y: number, p: number): Vec3 => mapTarget(bm, y, p, opts).surface;
    const here = at(yaw, 0);
    const chord = blendThroughEdges(bm, yaw, 0, opts, here, at);
    const seen: { reach: number; n: Vec3 }[] = [];
    const front: Vec3 = [chord[0] - 0.002, chord[1], chord[2] - 0.002];
    const out = blendThroughEdges(bm, yaw, 0, opts, here, at, (_p, n, reach) => (seen.push({ reach, n }), front));
    expect(out).toEqual(front); // ✅ the surface in front of the chord
    expect(seen.length).toBe(1);
    expect(seen[0]!.reach).toBeGreaterThan(BLEND_REACH_M); // half the chord + 5 mm
    expect(seen[0]!.n[2]).toBeLessThan(0); // the blended normal: between −z and −x
    expect(seen[0]!.n[0]).toBeLessThan(0);
    // a hit BEHIND the chord (a concave corner, a void): the chord kept
    const behind: Vec3 = [chord[0] + 0.002, chord[1], chord[2] + 0.002];
    expect(blendThroughEdges(bm, yaw, 0, opts, here, at, () => behind)).toEqual(chord);
    // no hit: the chord; out of any band: never cast
    expect(blendThroughEdges(bm, yaw, 0, opts, here, at, () => null)).toEqual(chord);
    let called = 0;
    blendThroughEdges(bm, 270 * D, 0, opts, at(270 * D, 0), at, () => (called++, null));
    expect(called).toBe(0);
  });

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

  it("⭐⭐ `placeAtAngles` with the lift: the foot read at the lifted distance, the place along the direction past it", () => {
    const feet: number[] = [];
    const p = placeAtAngles(0, () => [0, 0, 0], () => [1, 0, 0], (g, _u, dd) => (feet.push(dd), g), 0.1, () => 0.02);
    expect(p[0]).toBeCloseTo(0.12, 12);
    expect([p[1], p[2]]).toEqual([0, 0]);
    expect(feet.length).toBe(1);
    expect(feet[0]).toBeCloseTo(0.12, 12);
    expect(placeAtAngles(0, () => [0, 0, 0], () => [1, 0, 0], (g) => g, 0.1)).toEqual([0.1, 0, 0]); // no lift: unchanged
  });

  it("⭐ wired: the gizmo's blend cast (`blendCast`) and the piece's lift in every place — the solver's, the drawn one, the foot", () => {
    const a = readFileSync(new URL("../src/render/assembly_wiring.ts", import.meta.url), "utf8").replace(/\s+/g, " ");
    expect(a).toContain("(q, nb, reach) => blendCast(st, q, nb, reach));");
    expect(a).toContain("(g, u, dd) => footOf(st, g, u, dd), d, (u) => liftOf(st, u));");
    expect(a).toContain("const d = approachDistance(st.cfg, st.approach) + liftOf(st, u);");
    expect(a).toContain("const foot = footOf(st, target, u, d + liftOf(st, u));");
  });
});

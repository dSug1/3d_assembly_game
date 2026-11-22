// ⭐⭐⭐ (2026-11-20, `Claude/40_RENDER_SCENE/spec/CAMERA_FOLLOWS_GIZMO.md` §13 — F2) THE CAMERA FOLLOWER's pure rules (`src/input/camera_follow.ts`): the one
// ease on the sphere, the pose drawn far out. ⛔ (2026-11-22, PICTURE_REBUILD.md §8.6 — R6) the pole's detour by place, the yaw's ceiling, the polar camera
// and the detour's frame (`poleDetour`, `followCeiling`, `polarStep`, `followStep`: `followTop` 0) deleted, and their vectors with them.
import { describe, expect, it } from "vitest";
import { followPose, sphereSpring } from "../src/input/camera_follow";
import { offsetFrame } from "../src/input/assembly_orbit";

type V = [number, number, number];
const D2R = Math.PI / 180;
const dirOf = (thFromUpDeg: number, azDeg: number): V => {
  const t = thFromUpDeg * D2R;
  const a = azDeg * D2R;
  return [Math.sin(t) * Math.sin(a), Math.cos(t), Math.sin(t) * Math.cos(a)];
};
const ang = (a: readonly number[], b: readonly number[]): number => Math.acos(Math.max(-1, Math.min(1, a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!)));

describe("F2 — the one ease on the sphere (`sphereSpring`)", () => {
  it("from rest toward a still target 90° away: nearer every frame, never past it, on the sphere; there within 0.1° after 10 τ", () => {
    let d: V = [1, 0, 0];
    let v: V = [0, 0, 0];
    const t: V = [0, 0, 1];
    let was = ang(d, t);
    for (let i = 0; i < 30; i++) {
      const r = sphereSpring(d, v, t, 1 / 60, 0.05);
      d = r.d as V;
      v = r.v as V;
      expect(Math.hypot(...d)).toBeCloseTo(1, 12);
      expect(ang(d, t)).toBeLessThan(was + 1e-12);
      expect(d[0]).toBeGreaterThanOrEqual(-1e-9); // never past the target
      was = ang(d, t);
    }
    expect(was / D2R).toBeLessThan(0.1);
  });
  it("an ease, not a jump: one frame of 16.7 ms at τ 50 ms moves less than half the way; τ 0 is the target at once", () => {
    const r = sphereSpring([1, 0, 0], [0, 0, 0], [0, 0, 1], 1 / 60, 0.05);
    expect(ang(r.d, [1, 0, 0])).toBeLessThan(Math.PI / 4);
    expect(ang(r.d, [1, 0, 0])).toBeGreaterThan(0);
    expect(sphereSpring([1, 0, 0], [0, 0, 0], [0, 0, 1], 1 / 60, 0).d).toEqual([0, 0, 1]);
  });
});

describe("F2 — the pose drawn far out (`followPose`)", () => {
  it("the piece hung along the followed direction from the foot; the camera on the owner's offsets in the WORLD-UP frame, at the look point; up the world's", () => {
    const dir = dirOf(60, 30);
    const look: V = [0, 0.2, 0.1];
    const foot: V = [0.1, 0.4, -0.1];
    const P = followPose(dir, look, foot, 6, 1.25, 2.5 * D2R, 2 * D2R);
    expect(P.piece[0]).toBeCloseTo(foot[0] + 6 * dir[0], 12);
    expect(P.piece[1]).toBeCloseTo(foot[1] + 6 * dir[1], 12);
    expect(P.piece[2]).toBeCloseTo(foot[2] + 6 * dir[2], 12);
    expect(P.look).toEqual(look);
    expect(P.up).toEqual([0, 1, 0]);
    const f = offsetFrame(dir, Math.atan2(dir[2], dir[0]), 2.5 * D2R, 2 * D2R).dir;
    const e: V = [P.eye[0] - look[0], P.eye[1] - look[1], P.eye[2] - look[2]];
    const r = Math.hypot(...e);
    expect(r).toBeCloseTo(Math.hypot(P.piece[0] - look[0], P.piece[1] - look[1], P.piece[2] - look[2]) + 1.25, 12);
    expect(ang(e.map((x) => x / r), f)).toBeLessThan(1e-9);
    expect(ang(e.map((x) => x / r), dir)).toBeGreaterThan(2 * D2R);
  });
});

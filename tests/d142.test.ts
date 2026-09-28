/**
 * GOLDEN VECTORS — **`D142`: a seated follower in its goal pose dissolves its couple** (the owner,
 * 2026-09-28), and the goal check names the pieces in place. ⭐ `D143`: the mate sets the spin at the
 * dissolve — fixtures carry a NON-zero spin error, and a tilt beside it (the audit's lesson).
 */
import { describe, expect, it } from "vitest";
import { followersToDissolve, mateSpin } from "@input/goal_dissolve";
import { goalReport, type Pose } from "@core/goal";
import { resolveBootOrientation } from "@core/game_structure";
import { IDENTITY, add, dot, qAngle, qconj, qFromAxisAngle, qmul, qRotate, scale, sub, type Quat, type Vec3 } from "@core/vec";
import { SCENE_1 } from "../src/content/scene_1";

const U = SCENE_1.unitM!;
const FINAL = SCENE_1.final!;
const TOL = { positionM: 0.005, angleRad: (5 * Math.PI) / 180 };

describe("⭐⭐⭐ `D142` — followersToDissolve", () => {
  it("⭐ a SEATED follower that the goal check has in place dissolves (RED: nothing dissolved)", () => {
    expect(followersToDissolve(["Piece10"], new Set(["Piece10", "Piece4"]))).toEqual(["Piece10"]);
  });

  it("⛔ a seated follower NOT in place keeps its couple", () => {
    expect(followersToDissolve(["Piece10"], new Set(["Piece4"]))).toEqual([]);
  });

  it("⛔ only seated followers are asked — an in-place body that has not snapped is not a couple to dissolve", () => {
    expect(followersToDissolve([], new Set(["Piece10"]))).toEqual([]);
  });
});

describe("⭐ goalReport names the pieces in place", () => {
  it("⭐ at the table all 41 are named; one moved piece is left out", () => {
    const at = (id: string, shift: Vec3 = [0, 0, 0]): Pose | null => {
      const g = FINAL.bodies.find((b) => b.id === id);
      return g ? { position: add(scale(g.position as Vec3, U), shift), orientation: IDENTITY } : null;
    };
    const all = goalReport(FINAL, U, (id) => at(id), TOL);
    expect(all.inPlaceIds).toHaveLength(41);
    const one = goalReport(FINAL, U, (id) => at(id, id === "Piece10" ? [0.02, 0, 0] : [0, 0, 0]), TOL);
    expect(one.inPlaceIds).toHaveLength(40);
    expect(one.inPlaceIds.includes("Piece10")).toBe(false);
    expect(one.inPlace).toBe(one.inPlaceIds.length);
  });
});

describe("⭐⭐⭐ `D143` — the mate sets the spin at the dissolve", () => {
  const DEG = Math.PI / 180;
  // A body whose goal is a skew orientation, its FollowerFace a local +z face. ⚠ Its centre is OFF the
  // body's own +z axis on purpose: on that axis a turn about the body centre and one about the face
  // centre coincide, and the mutant that confuses them survived (an export's origin need not be central).
  const T: Quat = qmul(qFromAxisAngle([0.2, 1, -0.4], 0.9), qFromAxisAngle([1, 0, 0], 0.3));
  const LOCAL_CENTRE: Vec3 = [0.03, -0.02, 0.05];
  const LOCAL_NORMAL: Vec3 = [0, 0, 1];
  const posed = (orientation: Quat, position: Vec3 = [0.4, -0.2, 1.1]) => ({ position, orientation });
  const faceOf = (p: Pose) => ({
    centre: add(p.position, qRotate(p.orientation, LOCAL_CENTRE)),
    normal: qRotate(p.orientation, LOCAL_NORMAL),
  });

  it("⭐ a piece seated 4° off its goal spin lands EXACTLY on it (RED: the spin stayed 4° off)", () => {
    for (const deg of [4, -4]) {
      const n = qRotate(T, LOCAL_NORMAL);
      const p = posed(qmul(qFromAxisAngle(n, deg * DEG), T));
      const f = faceOf(p);
      const m = mateSpin(p, f.centre, f.normal, T);
      expect(qAngle(qmul(m.orientation, qconj(T)))).toBeLessThan(1e-9);
    }
  });

  it("⛔ only the spin: the FollowerFace stays flush and its centre stays put", () => {
    const n = qRotate(T, LOCAL_NORMAL);
    const p = posed(qmul(qFromAxisAngle(n, 3 * DEG), T));
    const f = faceOf(p);
    const g = faceOf(mateSpin(p, f.centre, f.normal, T));
    expect(Math.hypot(...sub(g.centre, f.centre))).toBeLessThan(1e-12);
    expect(dot(g.normal, f.normal)).toBeGreaterThan(1 - 1e-12);
  });

  it("⛔ a tilt in the error is left alone — the snap owns the normal; only the twist is removed", () => {
    const n = qRotate(T, LOCAL_NORMAL);
    const perp = qRotate(T, [1, 0, 0]);
    // The pose is the target undone by a 2° tilt and a 4° spin: the mate removes the 4°, keeps the 2°.
    const delta = qmul(qFromAxisAngle(perp, 2 * DEG), qFromAxisAngle(n, 4 * DEG));
    const p = posed(qmul(qconj(delta), T));
    const f = faceOf(p);
    const m = mateSpin(p, f.centre, f.normal, T);
    expect(dot(faceOf(m).normal, f.normal)).toBeGreaterThan(1 - 1e-12);
    expect(qAngle(qmul(T, qconj(m.orientation))) / DEG).toBeCloseTo(2, 6);
  });

  it("⛔ a degenerate normal changes nothing — never a guessed spin", () => {
    const p = posed(qmul(qFromAxisAngle([0, 1, 0], 0.05), T));
    expect(mateSpin(p, p.position, [0, 0, 0], T)).toBe(p);
  });

  it("⭐ the report's target is the NEAREST accepted orientation — a flipped box mates onto its half-turn", () => {
    const flipped = FINAL.bodies.find((b) => b.symmetry === "halfTurns")!;
    const goalQ = resolveBootOrientation(flipped.orientation, []) ?? IDENTITY;
    const half = qmul(goalQ, qFromAxisAngle([0, 1, 0], Math.PI));
    const off = qmul(qFromAxisAngle([0, 0, 1], 3 * DEG), half);
    const poseOf = (id: string): Pose | null => {
      const g = FINAL.bodies.find((b) => b.id === id);
      if (!g) return null;
      const orientation = id === flipped.id ? off : resolveBootOrientation(g.orientation, []) ?? IDENTITY;
      return { position: scale(g.position as Vec3, U), orientation };
    };
    const r = goalReport(FINAL, U, poseOf, TOL);
    expect(r.inPlaceIds.includes(flipped.id)).toBe(true);
    expect(qAngle(qmul(r.targetOrientations.get(flipped.id)!, qconj(half)))).toBeLessThan(1e-6);
  });
  it("⭐⭐ Scene_1: a piece snapped by its OPPOSITE face mates onto the half-turn — it is never flipped back", () => {
    const flipped = FINAL.bodies.find((b) => b.symmetry === "halfTurns")!;
    const goalQ = resolveBootOrientation(flipped.orientation, []) ?? IDENTITY;
    const half = qmul(goalQ, qFromAxisAngle([1, 0, 0], Math.PI)); // the local +z face now where -z was
    const n = qRotate(half, [0, 0, 1]);
    const seated = qmul(qFromAxisAngle(n, -4 * DEG), half);
    const poseOf = (id: string): Pose | null => {
      const g = FINAL.bodies.find((b) => b.id === id);
      if (!g) return null;
      const orientation = id === flipped.id ? seated : resolveBootOrientation(g.orientation, []) ?? IDENTITY;
      return { position: scale(g.position as Vec3, U), orientation };
    };
    const r = goalReport(FINAL, U, poseOf, TOL);
    const p = poseOf(flipped.id)!;
    const m = mateSpin(p, p.position, n, r.targetOrientations.get(flipped.id)!);
    expect(qAngle(qmul(m.orientation, qconj(half)))).toBeLessThan(1e-6);
    expect(qAngle(qmul(m.orientation, qconj(goalQ))) / DEG).toBeCloseTo(180, 4);
  });

  it("⛔ a scene WITHOUT the symmetry: the flipped piece is not in place, so it never dissolves nor mates", () => {
    const flipped = FINAL.bodies.find((b) => b.symmetry === "halfTurns")!;
    const strict = { ...FINAL, bodies: FINAL.bodies.map((b) => {
      if (b.id !== flipped.id) return b;
      const { symmetry: _drop, ...rest } = b;
      return rest;
    }) };
    const goalQ = resolveBootOrientation(flipped.orientation, []) ?? IDENTITY;
    const half = qmul(goalQ, qFromAxisAngle([1, 0, 0], Math.PI));
    const poseOf = (id: string): Pose | null => {
      const g = FINAL.bodies.find((b) => b.id === id);
      if (!g) return null;
      const orientation = id === flipped.id ? half : resolveBootOrientation(g.orientation, []) ?? IDENTITY;
      return { position: scale(g.position as Vec3, U), orientation };
    };
    const r = goalReport(strict, U, poseOf, TOL);
    expect(r.inPlaceIds.includes(flipped.id)).toBe(false);
    expect(followersToDissolve([flipped.id], new Set(r.inPlaceIds))).toEqual([]);
    expect(qAngle(qmul(r.targetOrientations.get(flipped.id)!, qconj(goalQ)))).toBeLessThan(1e-9);
  });
});

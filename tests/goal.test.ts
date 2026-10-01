/**
 * GOLDEN VECTORS — **`D130` the goal check** and **`D131` each scene's own orbit rig** (the owner,
 * 2026-09-28): *"goal completed when parts sit correctly relative to each other … painting can sit
 * anywhere"*, *"face aligned or opposite face aligned"*, *"Make the camera orbit radii and height
 * tunable for each scene"*.
 *
 * ⚠ Fixtures are chosen where the quantity under test is NOT zero (the 2026-09-17 audit's lesson):
 * skew rotations, a tilted painting, and the real boot layout with its five outliers.
 */
import { describe, expect, it } from "vitest";
import { acceptedOrientations, bestRigidFit, goalReport, type Pose } from "@core/goal";
import { parseSceneDescriptor, serializeSceneDescriptor, resolveBootOrientation } from "@core/game_structure";
import { add, IDENTITY, qAngle, qconj, qFromAxisAngle, qmul, qRotate, scale, type Quat, type Vec3 } from "@core/vec";
import { SCENE_1 } from "../src/content/scene_1";
import { SCENE_0 } from "../src/content/scene_0";
import { sceneConfig } from "@input/scene_rig";
import { DEFAULT_CONFIG, validateGestureConfig } from "@input/gestureConfig";

const DEG = Math.PI / 180;
const TOL = { positionM: 0.005, angleRad: 5 * DEG };
const U = SCENE_1.unitM!;
const FINAL = SCENE_1.final!;

/** Every piece's world pose if the whole painting is carried by `(R, t)` — metres, like the model. */
const carried = (R: Quat, t: Vec3, tweak: (id: string, p: Pose) => Pose = (_, p) => p) => {
  const m = new Map<string, Pose>();
  for (const b of FINAL.bodies) {
    const pose = { position: add(qRotate(R, scale(b.position as Vec3, U)), t), orientation: R };
    m.set(b.id, tweak(b.id, pose));
  }
  return (id: string) => m.get(id) ?? null;
};

describe("⭐⭐ bestRigidFit — Horn's closed form", () => {
  it("⭐ recovers a skew rotation and a translation exactly, on a 3D point set", () => {
    const R = qmul(qFromAxisAngle([0.3, 1, -0.2], 1.1), qFromAxisAngle([1, 0, 0], 0.4));
    const t: Vec3 = [0.7, -1.3, 2.2];
    const from: Vec3[] = [[0, 0, 0], [1, 0, 0], [0, 2, 0], [0, 0, 3], [1, 1, 1]];
    const fit = bestRigidFit(from, from.map((p) => add(qRotate(R, p), t)))!;
    // ⛔ A sign test, not a magnitude one: the conjugate rotation also has angle 1.1-ish.
    expect(qAngle(qmul(fit.rotation, qconj(R)))).toBeLessThan(1e-9);
    for (let i = 0; i < 3; i++) expect(fit.translation[i]).toBeCloseTo(t[i]!, 9);
  });

  it("⭐ works on a COPLANAR set — the painting is one plane", () => {
    const R = qFromAxisAngle([0, 1, 0], 40 * DEG);
    const from: Vec3[] = FINAL.bodies.map((b) => scale(b.position as Vec3, U));
    const fit = bestRigidFit(from, from.map((p) => qRotate(R, p)))!;
    expect(qAngle(qmul(fit.rotation, qconj(R)))).toBeLessThan(1e-9);
  });

  it("⛔ fewer than three points, or points on one line, leave the turn undetermined → null", () => {
    expect(bestRigidFit([[0, 0, 0], [1, 0, 0]], [[0, 0, 0], [1, 0, 0]])).toBeNull();
    expect(bestRigidFit([[0, 0, 0], [1, 0, 0], [2, 0, 0]], [[0, 0, 0], [0, 1, 0], [0, 2, 0]])).toBeNull();
  });
});

describe("⭐⭐⭐ `D130` — the goal is met when the parts sit right RELATIVE to each other", () => {
  it("⭐ at the table itself: all 41 in place", () => {
    const r = goalReport(FINAL, U, carried(IDENTITY, [0, 0, 0]), TOL);
    expect(r).toMatchObject({ met: true, inPlace: 41, total: 41 });
  });

  it("⭐⭐ the painting ANYWHERE — moved, turned about gravity, even tilted — is still met", () => {
    for (const R of [qFromAxisAngle([0, 1, 0], 73 * DEG), qmul(qFromAxisAngle([1, 0, 0], 0.3), qFromAxisAngle([0, 1, 0], -2))]) {
      const r = goalReport(FINAL, U, carried(R, [1.4, 0.2, -3.1]), TOL);
      expect(r.met).toBe(true);
    }
  });

  it("⛔ ABSOLUTE is the counter-example: the same moved painting is NOT met", () => {
    const r = goalReport({ ...FINAL, frame: "ABSOLUTE" }, U, carried(IDENTITY, [1.4, 0, 0]), TOL);
    expect(r.met).toBe(false);
    expect(r.inPlace).toBe(0);
  });

  it("⭐⭐ a piece out of place is named — and the 40 in place do not move the frame", () => {
    const r = goalReport(FINAL, U, carried(qFromAxisAngle([0, 1, 0], 0.5), [0.3, 0, 0.3], (id, p) =>
      id === "Piece10" ? { ...p, position: add(p.position, [0.02, 0, 0]) } : p), TOL);
    expect(r).toMatchObject({ met: false, inPlace: 40, worstId: "Piece10" });
    expect(r.worstPositionM).toBeCloseTo(0.02, 3);
  });

  it("⭐⭐ THE BOOT: exactly the five moved pieces are out; the 36 in place define the frame", () => {
    // ⛔ RED against a plain least-squares fit: the five outliers dragged it ~12 mm and read 0/41.
    const boot = new Map(SCENE_1.bodies.map((b) => [b.id, {
      position: scale(b.position as Vec3, U),
      orientation: resolveBootOrientation(b.orientation, []) ?? IDENTITY,
    }]));
    const r = goalReport(FINAL, U, (id) => boot.get(id) ?? null, TOL);
    expect(r.met).toBe(false);
    expect(r.inPlace).toBe(36);
  });

  it("⛔ a missing body is not in place", () => {
    const all = carried(IDENTITY, [0, 0, 0]);
    const r = goalReport(FINAL, U, (id) => (id === "Piece7" ? null : all(id)), TOL);
    expect(r).toMatchObject({ met: false, inPlace: 40, worstId: "Piece7" });
  });
});

describe("⭐⭐⭐ `D130` — a box's face OR its opposite: the four half-turns count, nothing else", () => {
  const flipped = (s: Quat) => carried(IDENTITY, [0, 0, 0], (id, p) => (id === "Piece17" ? { ...p, orientation: qmul(p.orientation, s) } : p));

  it("⭐ Piece17 turned over — 180° about any of its own three axes — is still in place", () => {
    for (const axis of [[1, 0, 0], [0, 1, 0], [0, 0, 1]] as Vec3[])
      expect(goalReport(FINAL, U, flipped(qFromAxisAngle(axis, Math.PI)), TOL).met).toBe(true);
  });

  it("⛔ a quarter turn is not a symmetry of a 0.92 × 0.55 × 0.3 box — it is out", () => {
    const r = goalReport(FINAL, U, flipped(qFromAxisAngle([0, 0, 1], Math.PI / 2)), TOL);
    expect(r).toMatchObject({ met: false, worstId: "Piece17" });
  });

  it("⛔ without the symmetry the same half-turn FAILS — the vector that makes `halfTurns` load-bearing", () => {
    const plain = { ...FINAL, bodies: FINAL.bodies.map(({ symmetry: _s, ...b }) => b) };
    expect(goalReport(plain, U, flipped(qFromAxisAngle([1, 0, 0], Math.PI)), TOL).met).toBe(false);
  });

  it("acceptedOrientations: four for halfTurns, the goal alone otherwise", () => {
    expect(acceptedOrientations(IDENTITY, "halfTurns")).toHaveLength(4);
    expect(acceptedOrientations(IDENTITY, undefined)).toEqual([IDENTITY]);
  });

  it("⭐ Scene_1's goal: RELATIVE, and every piece carries the half-turns", () => {
    expect(FINAL.frame).toBe("RELATIVE");
    expect(FINAL.bodies.every((b) => b.symmetry === "halfTurns")).toBe(true);
  });

  it("⛔ the goal's JSON is refused with the field named: no frame, an unknown symmetry, a seeded pose", () => {
    const bad = (mutate: (o: any) => void): string => {
      const o = JSON.parse(serializeSceneDescriptor(SCENE_1));
      mutate(o);
      return JSON.stringify(o);
    };
    expect(() => parseSceneDescriptor(bad((o) => delete o.final.frame))).toThrow(/final: frame/);
    expect(() => parseSceneDescriptor(bad((o) => (o.final.bodies[0].symmetry = "spin")))).toThrow(/Piece1: unknown symmetry/);
    expect(() => parseSceneDescriptor(bad((o) => (o.final.bodies[0].orientation = { seeded: 1 })))).toThrow(/Piece1: unknown orientation/);
  });
});

describe("⭐⭐⭐ `D131` — each scene carries its own orbit rig", () => {
  it("⭐ Scene_1: radii top 0.9, middle 0.2, bottom 0.9 m (prototype, the owner 2026-10-01) — and the rig validates (one waist)", () => {
    const c = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
    expect([c.orbitTopRadiusM, c.orbitMiddleRadiusM, c.orbitBottomRadiusM]).toEqual([0.9, 0.2, 0.9]);
    expect([c.orbitTopHeightM, c.orbitMiddleHeightM, c.orbitBottomHeightM]).toEqual([0.5, 0, -0.4]);
    expect(() => validateGestureConfig(c)).not.toThrow();
  });

  it("⭐ Scene_0's rig IS the config default — its scene says so itself (bottom ring −1.2 m since 2026-09-28)", () => {
    const c = sceneConfig(DEFAULT_CONFIG, SCENE_0.orbit);
    expect([c.orbitTopRadiusM, c.orbitMiddleRadiusM, c.orbitBottomRadiusM]).toEqual([1.0, 0.36, 0.5]);
    expect(c).toEqual(DEFAULT_CONFIG);
  });

  it("⛔ no rig → the defaults, untouched; everything else in the config is never touched", () => {
    expect(sceneConfig(DEFAULT_CONFIG, undefined)).toBe(DEFAULT_CONFIG);
    const c = sceneConfig(DEFAULT_CONFIG, SCENE_1.orbit);
    expect({ ...c, orbitTopRadiusM: 0, orbitMiddleRadiusM: 0, orbitBottomRadiusM: 0, orbitTopHeightM: 0, orbitMiddleHeightM: 0, orbitBottomHeightM: 0 })
      .toEqual({ ...DEFAULT_CONFIG, orbitTopRadiusM: 0, orbitMiddleRadiusM: 0, orbitBottomRadiusM: 0, orbitTopHeightM: 0, orbitMiddleHeightM: 0, orbitBottomHeightM: 0 });
  });

  it("⛔ the JSON seam keeps a rig and refuses a broken one by name", () => {
    expect(parseSceneDescriptor(serializeSceneDescriptor(SCENE_1)).orbit).toEqual(SCENE_1.orbit);
    const o = JSON.parse(serializeSceneDescriptor(SCENE_1));
    o.orbit.middleRadiusM = "1";
    expect(() => parseSceneDescriptor(JSON.stringify(o))).toThrow(/orbit.middleRadiusM/);
  });
});

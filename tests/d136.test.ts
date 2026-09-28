/**
 * GOLDEN VECTORS — **`D136`: contact is allowed, only penetration is refused** (the owner, 2026-09-28:
 * *"I cannot get the blue object to snap … Snap gets immediately cancelled"*, then *"Allow touching"*
 * and *"Make a slider for this skin margin allowance"*).
 *
 * ⭐ On `Scene_1`'s REAL goal layout — every piece's contour box, neighbours touching at exactly 0
 * (`D125`) — because the defect lives in that zero clearance, and a fixture of two cubes a skin apart
 * would sit in the set where it cannot appear.
 */
import { describe, expect, it } from "vitest";
import { boundsFromShapes, hullAtSpawn, resolveMove, type CollisionSetup } from "@core/collision";
import { boxShape } from "@core/collision_shape";
import { makeWorld, type SceneObject, type World } from "@core/object_model";
import { contourDims } from "@core/game_structure";
import { IDENTITY, type Vec3 } from "@core/vec";
import { DEFAULT_CONFIG, validateGestureConfig } from "@input/gestureConfig";
import { SCENE_1 } from "../src/content/scene_1";

const U = SCENE_1.unitM!;
const GOAL = new Map(SCENE_1.final!.bodies.map((b) => [b.id, b.position]));

/** `Scene_1` at its goal, in metres, with `id` moved to `at`. */
function painting(id: string, at: (slot: Vec3) => Vec3): { world: World; slot: Vec3 } {
  let slot: Vec3 = [0, 0, 0];
  const objs: SceneObject[] = SCENE_1.bodies.map((b) => {
    const d = contourDims(b);
    const p = GOAL.get(b.id) ?? b.position;
    const pos: Vec3 = [p[0] * U, p[1] * U, p[2] * U];
    if (b.id === id) slot = pos;
    return {
      id: b.id,
      local: { position: b.id === id ? pos : pos, orientation: IDENTITY },
      parent: null,
      faces: [],
      connectors: [],
      constraints: [],
      shape: boxShape([d[0] * U, d[1] * U, d[2] * U]),
      ...(b.frozen ? { frozen: true } : {}),
    };
  });
  const world = makeWorld(objs.map((o) => (o.id === id ? { ...o, local: { ...o.local, position: at(slot) } } : o)));
  return { world, slot };
}

const setup = (skinM: number): CollisionSetup => ({
  shapes: hullAtSpawn,
  bounds: boundsFromShapes(hullAtSpawn),
  skinM,
});

describe("⭐⭐⭐ `D136` — a piece goes back into its ZERO-clearance slot", () => {
  it("⭐⭐ Piece10, pushed straight back from 5 cm in front, arrives (RED: stopped 33 mm short, blocked by Piece27)", () => {
    for (const skin of [0.001, 0.0003]) {
      const { world, slot } = painting("Piece10", (s) => [s[0], s[1], s[2] - 0.05]);
      const v = resolveMove(world, "Piece10", { position: slot, orientation: IDENTITY }, setup(skin));
      expect(v.blockedBy).toBeNull();
      expect(v.t).toBe(1);
    }
  });

  it("⛔ a piece lined up WORSE than the tolerance is still refused — penetration, not contact", () => {
    // 2 mm too far left: it would sink 2 mm into Piece31, twice the 1 mm tolerance.
    const { world, slot } = painting("Piece10", (s) => [s[0] - 0.002, s[1], s[2] - 0.05]);
    const v = resolveMove(world, "Piece10", { position: [slot[0] - 0.002, slot[1], slot[2]], orientation: IDENTITY }, setup(0.001));
    expect(v.blockedBy).not.toBeNull();
    expect(v.t).toBeLessThan(1);
  });

  it("⭐ …and lined up WITHIN it, it slides in: the tolerance is what a hand has to hit", () => {
    const { world, slot } = painting("Piece10", (s) => [s[0] - 0.0005, s[1], s[2] - 0.05]);
    const v = resolveMove(world, "Piece10", { position: [slot[0] - 0.0005, slot[1], slot[2]], orientation: IDENTITY }, setup(0.001));
    expect(v.blockedBy).toBeNull();
    expect(v.t).toBe(1);
  });

  it("⭐ the SLIDER sets that tolerance: a 3 mm allowance takes the 2 mm misalignment", () => {
    const { world, slot } = painting("Piece10", (s) => [s[0] - 0.002, s[1], s[2] - 0.05]);
    const v = resolveMove(world, "Piece10", { position: [slot[0] - 0.002, slot[1], slot[2]], orientation: IDENTITY }, setup(0.003));
    expect(v.blockedBy).toBeNull();
  });

  it("⭐ ARRIVING flush against a THIRD body from apart is allowed — the snap's last step (RED: 'is in the way')", () => {
    // ⭐ The owner's snap: its lerp ends touching a body that is NOT its Pioneer, coming from apart.
    // ⚠ A first draft started the blue 1 mm in front of its slot — already touching its neighbours
    // sideways, a 0 → 0 case the old rule allowed too — and passed both ways. This one is the refused case.
    const cube = (id: string, x: number): SceneObject => ({
      id, local: { position: [x, 0, 0], orientation: IDENTITY }, parent: null,
      faces: [], connectors: [], constraints: [], shape: boxShape([0.1, 0.1, 0.1]),
    });
    const w = makeWorld([cube("F", 0.195), cube("Third", 0.3)]);
    const v = resolveMove(w, "F", { position: [0.2, 0, 0], orientation: IDENTITY }, setup(0.0003));
    expect(v.blockedBy).toBeNull();
    expect(v.t).toBe(1);
  });

  it("the tolerance's tunable keeps its name, its default and its range", () => {
    expect(DEFAULT_CONFIG.collisionSkinMm).toBe(0.3);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, collisionSkinMm: 0 })).toThrow(/collisionSkinMm/);
  });
});

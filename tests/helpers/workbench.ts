/**
 * ⭐ (2026-11-12) THE WORKBENCH — `Scene_0`'s content until the owner replaced it with the heptagon (*"delete the entire content of scene 0"*), kept
 * here as a FIXTURE ONLY: four bodies of every kind the JSON seam checks (tilted, tapered, frozen, seeded) and the rig that IS the config default.
 * ⛔ Not a scene the game boots.
 */
import type { SceneDescriptor } from "@core/game_structure";
import {
  OBJECT_DIMS_M,
  OBJECT_SIZE_M,
  OBJECT_TOP_SCALE,
  PLATE_DIMS_M,
  PYRAMID_DIMS_M,
} from "@core/scene_dims";

export const WORKBENCH: SceneDescriptor = {
  id: "Scene_0",
  title: "Scene 0 — the workbench",
  bodies: [
    // ⭐ The grey part, tilted 30° roll + 30° pitch (`D93`).
    {
      id: "objectA",
      position: [-0.2, 0, 0],
      colour: [0.65, 0.67, 0.72],
      dims: OBJECT_DIMS_M,
      orientation: "tilt+",
      frozen: false,
      topScale: 1,
    },
    // ⭐ The pyramid (`D72`, scaled by `D91`), tilted in the opposite sense.
    {
      id: "objectB",
      position: [0.2, 0, 0],
      colour: [0.45, 0.58, 0.72],
      dims: PYRAMID_DIMS_M,
      orientation: "tilt-",
      frozen: false,
      topScale: OBJECT_TOP_SCALE,
    },
    // ⛔ The frozen base plate, `3L` below (`D77`): a parent, never a child.
    {
      id: "objectC",
      position: [0, -OBJECT_SIZE_M * 3, 0],
      colour: [0.72, 0.58, 0.45],
      dims: PLATE_DIMS_M,
      orientation: "identity",
      frozen: true,
      topScale: 1,
    },
    // ⭐ The pink part (`D92`), at the third seeded rotation — where the orange body sat when the
    // three parts formed a 5L triangle, so the parts are still 5L apart pairwise.
    {
      id: "objectD",
      position: [0, 0.307246, 0.16],
      colour: [0.92, 0.5, 0.72],
      dims: OBJECT_DIMS_M,
      orientation: { seeded: 2 },
      frozen: false,
      topScale: 1,
    },
  ],
  // ⭐ `D131`: its own rig — the owner's device-chosen rings of 2026-09-14, unchanged (a WAIST).
  orbit: {
    topRadiusM: 1.0,
    topHeightM: 0.55,
    middleRadiusM: 0.36,
    middleHeightM: 0.1,
    bottomRadiusM: 0.5,
    bottomHeightM: -1.2, // ⭐ the owner, 2026-09-28 (was −0.5)
  },
  final: null,
};

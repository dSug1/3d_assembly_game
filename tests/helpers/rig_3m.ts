/**
 * ⭐ `Scene_1`'s orbit rig as it stood until 2026-10-12 — the 1st and 4th rings at 2.55 m / ±1.575 m (3.0 m from the centre). The owner then
 * doubled them (*"double rings 1 and 4, keep the piece at 3m boot view as it is"*); the vectors written on the old rig's shape (the waist's
 * speed, the stair it replaced, the zoom limits measured on it, the way in / out) keep it as their fixture.
 */
import { SCENE_1 } from "../../src/content/scene_1";
import type { OrbitRig } from "../../src/core/game_structure";

export const RIG_3M: OrbitRig = {
  ...SCENE_1.orbit!,
  topRadiusM: 2.55,
  topHeightM: 1.575,
  bottomRadiusM: 2.55,
  bottomHeightM: -1.575,
};

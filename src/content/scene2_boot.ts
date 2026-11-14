/**
 * ⭐⭐ **`Scene_2`'s BOOT RULE** (`30_OBJECTS_3D/spec/SCENE_2_ASSEMBLY.md` §2.5; `SCENE_WORKFLOW.md` §6.4 item 4): the heaps by type, their areas,
 * the limits. ⭐ The layout itself is DRAWN AT EVERY BOOT from it (`core/boot_heaps.ts` `bootFromModel`, in `render/model_import.ts`) — the owner,
 * 2026-11-13: *"randomly distribute the parts within assigned areas and with the rules I indicated for demo scene, otherwise the parts will always
 * be the same order game after game and it is very static and boring"*. Engine-free data.
 */
import type { BootRule } from "../core/boot_heaps"; // ⚠ a TYPE only: the generator travels in the lazy model module, not every level's bundle

/** ⭐ The heaps of `Scene_2`'s plan (§2.5): one per TYPE of part, in the arc's order. */
export const SCENE2_HEAPS: Readonly<Record<string, string>> = {
  E02: "block", E04: "block", E05: "block", E06: "block",
  E03: "crankshaft",
  E07: "pistons", E08: "pistons", E09: "pistons", E10: "pistons", E11: "pistons", E12: "pistons",
  E13: "heads", E14: "heads",
  E15: "exhausts", E16: "exhausts",
  E17: "pulley",
};
export const SCENE2_HEAP_ORDER = ["block", "crankshaft", "pistons", "heads", "exhausts", "pulley"] as const;

/**
 * The scene frame, reference units (the floor 2 m = 14.29 units, its top y 0):
 * - the heaps' AREAS on an arc of 180° — the FRONT HALF round the YAW ORIGIN, the direction toward the boot camera, read from the camera at load
 *   (the owner, 2026-11-13: *"the parts are in the … half right of the scene, instead of the front half"* — the camera had been assumed at −z);
 *   inside the floor and clear of the plinth; a heap's area: room for its parts lying side by side;
 * - ⛔ NO STACKING (the owner, 2026-11-14: *"do not allow the pieces to stack at all at boot time"* — three high first, the demo's `D194`): every
 *   part on the floor, no outline over another's seen from above; a rest holds; the heaps' order the reverse of the steps.
 */
export const SCENE2_BOOT_RULE: BootRule = {
  heapOf: SCENE2_HEAPS,
  anchors: ["E01"],
  heapOrder: SCENE2_HEAP_ORDER,
  // ⭐ 180° round the yaw origin; the heaps lying side by side need ≈ 14.4 units of its ≈ 16.3
  arc: { centre: [0, 0], half: [5.2, 5.2], spanDeg: 180 },
  footprintShare: 0.65,
  floorY: 0,
  // the floor's true half-width (1 m / 0.14) and the margin before its edge: 0.2 unit (≈ 3 cm) — the owner: "add a smaller margin before the
  // edges of the floor", then "0.5 unit is too big" (7.0 before — an accidental 2 cm)
  floorHalf: 1 / 0.14,
  floorMargin: 0.2,
  // ⛔ one high: no part on another, counted both ways (up the chain AND from above) — the owner: "do not allow the pieces to stack at all at boot
  // time" (3 before)
  maxStack: 1,
  // ⭐ the perimeter round the plinth: its footprint + 1 unit (14 cm) every side — the owner: "leave more space around the plinth"
  anchorMargin: 1.0,
  jitterShare: 0.25,
  tries: 150, // (80 first: the block's cases failed 4 seeds of 30 between the perimeter and the floor's margin)
};

/**
 * ⭐⭐⭐ **THE BOOT SCENE'S DIMENSIONS — ONE HOME, BECAUSE THE VECTORS READ THEM TOO.**
 *
 * ⛔⛔⛔ **THIS MODULE EXISTS BECAUSE A SHADOW COPY WENT STALE AND NOTHING WENT RED.** The numbers
 * lived in `render/scene.ts`, and `tests/highlight.test.ts` and `tests/frustum.test.ts` each kept
 * their own `const PYRAMID = [1.5 * L, 2 * L, 3 * L]`. ⚠ On 2026-09-25 the owner scaled the
 * pyramid, the product changed, and **1125 vectors stayed green while asserting the old body** —
 * including the one whose entire job is to guard the boot clearance.
 *
 * ⭐ `METHOD`, and this project's own scar, one layer further out: *a shadow copy is free to
 * disagree with the thing it copies.* ⛔ A fixture that mirrors a constant is a second
 * implementation of that constant, and it disagrees exactly when the constant is the thing being
 * changed — which is the one moment the vector was there to cover.
 *
 * ⛔ ENGINE-FREE: plain numbers, so `src/core` and the suite can both read them.
 */

import { qFromAxisAngle, qmul, type Quat } from "./vec";

/** Metres. The objects are ~8 cm; the camera sits ~60 cm away. */
export const OBJECT_SIZE_M = 0.08;

/**
 * ⭐⭐⭐ **A PART IS A CUBOID, `L × 2L × 3L`** (the owner, 2026-09-17: *"instead of three cubes,
 * make the scene with three rectangles, each with dimensions L, 2L, 3L"*).
 *
 * ⛔⛔ **AND IT IS A BETTER TEST SCENE THAN CUBES.** Two rules are **invisible with cubes** and a
 * mutation run proved it: `objectSpan` returning the LARGEST extent rather than the mean, and the
 * capture radius belonging to the CANDIDATE rather than the holder. ⚠ A cube also hides every sign
 * error in a face pair, because it has an opposite face for every face.
 *
 * ⭐ Its **small rectangular face** is `L × 2L`, and since 2026-09-25 that is a dimension other
 * bodies are defined against.
 */
export const OBJECT_DIMS_M: readonly [number, number, number] = [
  OBJECT_SIZE_M,
  OBJECT_SIZE_M * 2,
  OBJECT_SIZE_M * 3,
];

/**
 * ⭐⭐⭐ **THE BASE PLATE** (the owner, 2026-09-17: *"make the orange rectangle with the following
 * dimensions: 6L, 9L, 0.3L … this shall simulate the base plate of the scene"*).
 *
 * ⛔⛔ **`6L × 0.3L × 9L` IN WORLD `(x, y, z)`, AND THE ORDER IS A DELIBERATE READING.** The owner
 * wrote *"respectively in the world X, Y and gravity axis"* — but `WORLD_DOWN` is `[0, −1, 0]`, so
 * **the gravity axis IS world Y** and that sentence names Y twice. ⭐ Only one reading yields a
 * *base plate*: `0.3L` is the THICKNESS, which must lie along gravity, leaving the `6L × 9L`
 * footprint on the two HORIZONTAL axes. ⚠ Taken literally it would be a 9L-tall wall.
 */
export const PLATE_DIMS_M: readonly [number, number, number] = [
  OBJECT_SIZE_M * 6,
  OBJECT_SIZE_M * 0.3,
  OBJECT_SIZE_M * 9,
];

/**
 * ⭐⭐⭐ **THE RIGHT-HAND PART IS A TRAPEZOIDAL PYRAMID** (the owner, 2026-09-22: *"modify the
 * rectangle on the right to be a trapezoidal pyramid"*).
 *
 * The fraction of its base the top face keeps. `1` would be the original box; `0` a true pyramid
 * with a point for a top. ⭐ **0.5** is a taper a hand can see at the boot camera without the body
 * becoming a spike — the four side faces stay large enough to tap, which matters because tapping a
 * face is how every alignment in this game starts.
 *
 * ⛔⛔ **IT TAPERS UPWARD, AND THE BASE IS LEFT AT FULL SIZE ON PURPOSE**, so the widest section
 * stays where the box's was and the boot clearance does not move for this reason.
 */
export const OBJECT_TOP_SCALE = 0.5;

/**
 * ⭐⭐⭐ **THE PYRAMID'S SMALL FACE IS A PART'S SMALL FACE** (the owner, 2026-09-25: *"scale the
 * pyramid so that the small rectangular face has the same dimensions as the small rectangular face
 * of the grey rectangle"*).
 *
 * ⭐⭐ **THE SCALE IS UNIFORM, AND THAT IS NOT A CHOICE — IT FALLS OUT.** The frustum's small face
 * is its TOP: `OBJECT_TOP_SCALE` of the base in `x` and `z`, so `0.75L × 1.5L` at the old
 * `1.5L × 2L × 3L`. A part's small face is `L × 2L`. ⚠ The two ratios, `L / 0.75L` and
 * `2L / 1.5L`, are **both 4/3** — one factor satisfies both — and `y` takes it too because the
 * instruction says *scale*. ⛔ A per-axis stretch would have been a different body.
 *
 * ⚠ It supersedes *"increase 50% the thickness of the pyramid (in the x axis direction)"*
 * (2026-09-22), which set the `1.5L` this scales from; both texts stand.
 */
export const PYRAMID_SCALE = 4 / 3;

/**
 * ⭐⭐ **AND THEN A QUARTER OFF ITS HEIGHT** (the owner, 2026-09-25: *"reduce the height of the
 * pyramid by 25%"*).
 *
 * ⛔ HEIGHT ONLY, which is its own local `y` — the taper axis. ⚠ So `D91` survives untouched: the
 * top face is the base's `x` and `z` scaled by `OBJECT_TOP_SCALE`, and neither moves. ⭐ The boot
 * clearance is measured across `x` and does not move either.
 *
 * ⭐ `(8/3)L × 0.75` is exactly `2L`, so the body comes out on whole units again.
 */
export const PYRAMID_HEIGHT_SCALE = 0.75;

/** `2L × 2L × 4L`, whose top face is exactly a part's `L × 2L`. */
export const PYRAMID_DIMS_M: readonly [number, number, number] = [
  OBJECT_SIZE_M * 1.5 * PYRAMID_SCALE,
  OBJECT_SIZE_M * 2 * PYRAMID_SCALE * PYRAMID_HEIGHT_SCALE,
  OBJECT_SIZE_M * 3 * PYRAMID_SCALE,
];

/**
 * ⭐⭐⭐ **THE TWO PARTS BOOT TILTED, IN OPPOSITE SENSES** (the owner, 2026-09-25: *"rotate the grey
 * rectangle 30 degrees roll and 30 pitch. Same for the pyramid, in opposite senses"*).
 *
 * ⛔⛔ **ROLL AND PITCH ARE `A7`'s, NOT BABYLON'S**, and that is the whole of the reading. The
 * gravity frame defines pitch about the **horizontal screen axis** and roll about the **view
 * direction flattened onto the ground** — so at the boot camera, which sits on `−z` looking toward
 * `+z` with `+x` to the right, **pitch is about world `x`** and **roll is about world `z`**.
 * ⚠ Reading them as the body's own axes would have been a different pose, and the two disagree
 * the moment a body is not square.
 *
 * ⭐ **ROLL FIRST, THEN PITCH**, both as WORLD rotations, so the composition is
 * `pitch ∘ roll` — the same left-composition every world rotation in this project uses. ⛔ The
 * order is visible at 30°: swapping it is a different body pose, so it is stated rather than
 * implied.
 *
 * @param sign `+1` for the grey part, `−1` for the pyramid — *"in opposite senses"*.
 */
export const BOOT_TILT_DEG = 30;

export function bootTilt(sign: 1 | -1): Quat {
  const a = (sign * BOOT_TILT_DEG * Math.PI) / 180;
  const roll = qFromAxisAngle([0, 0, 1], a);
  const pitch = qFromAxisAngle([1, 0, 0], a);
  return qmul(pitch, roll);
}

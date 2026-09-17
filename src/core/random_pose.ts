/**
 * ⭐⭐⭐ **SEEDED RANDOM ORIENTATIONS FOR THE BOOT SCENE.**
 *
 * > *"rotate the three rectangles so they have three random rotations at scene boot"*
 * > — the owner, 2026-09-17
 *
 * ⛔⛔ **SEEDED, NOT `Math.random()`, AND THAT IS A DELIBERATE READING OF *"random"*.** A fresh
 * orientation on every reload would make the boot scene **unreproducible**, and this project
 * has a standing rule that *a device report is evidence about the code the device was running*
 * — `CLAUDE.md`'s build-id gate exists because that premise was once wrong. ⚠ An orientation
 * nobody can recover is the same trap one level down: *"it did not align on the brown one"*
 * would be unanswerable, because the brown one would never be in that pose again.
 *
 * ⭐⭐ What the owner asked for is three ARBITRARY rotations, and a seed gives exactly that
 * while keeping them recoverable. ⭐ The seed is URL-overridable (`?sceneSeed=7`), so a new
 * scene is one reload away and the one that showed a defect can always be reloaded.
 * ⛔ If genuinely per-boot randomness is ever wanted, it is one call — pass `Date.now()`.
 *
 * ⛔ ENGINE-FREE.
 */
import type { Quat } from "./vec";

/**
 * ⭐ `mulberry32` — a small, well-distributed 32-bit PRNG.
 *
 * ⚠ Chosen because it is **eight lines and has no state to get wrong**. ⛔ Not for anything
 * where randomness has to be unguessable; this seeds a debug scene.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * ⭐⭐⭐ **A UNIFORMLY RANDOM ROTATION** — Shoemake's method, and the *uniform* matters.
 *
 * ⛔⛔ **THE OBVIOUS IMPLEMENTATION IS WRONG AND ITS WRONGNESS IS INVISIBLE.** Three random
 * Euler angles look random and are **not** uniformly distributed over orientations: they
 * cluster near the poles of whichever axis is applied last. ⚠ For a debug scene that matters
 * more than it sounds — the bodies would all tend toward a family of similar poses, so a
 * mechanism that failed for orientations *away* from that family would never be exercised.
 *
 * ⭐ Shoemake draws from the 3-sphere directly, which is uniform by construction: any
 * assignment of the four components to `(w, x, y, z)` is fine, because the distribution is
 * symmetric in them.
 */
function randomQuat(rnd: () => number): Quat {
  const u1 = rnd();
  const u2 = rnd();
  const u3 = rnd();
  const a = Math.sqrt(1 - u1);
  const b = Math.sqrt(u1);
  return [
    a * Math.sin(2 * Math.PI * u2),
    a * Math.cos(2 * Math.PI * u2),
    b * Math.sin(2 * Math.PI * u3),
    b * Math.cos(2 * Math.PI * u3),
  ];
}

/**
 * ⭐⭐ `count` uniformly random orientations, determined entirely by `seed`.
 *
 * ⚠ The SAME seed always gives the SAME list, in the same order — which is what makes a boot
 * scene something a device report can refer to.
 */
export function seededRotations(seed: number, count: number): Quat[] {
  const rnd = mulberry32(seed);
  const out: Quat[] = [];
  for (let i = 0; i < count; i++) out.push(randomQuat(rnd));
  return out;
}

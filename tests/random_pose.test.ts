/**
 * GOLDEN VECTORS — **THE SEEDED BOOT ORIENTATIONS.**
 *
 * Design of record: the owner, 2026-09-17 — *"rotate the three rectangles so they have three
 * random rotations at scene boot"*.
 *
 * ⭐⭐ THE ONE THAT CARRIES THE DESIGN is *"the same seed gives the same scene"* — because that
 * is the whole reason this is seeded rather than `Math.random()`, and it is the property a
 * device report depends on.
 */
import { describe, expect, it } from "vitest";
import { seededRotations } from "@core/random_pose";
import { qRotate, type Vec3 } from "@core/vec";

describe("⛔⛔ seededRotations — arbitrary, but recoverable", () => {
  it("⭐⭐⭐ THE SAME SEED GIVES THE SAME SCENE, component for component", () => {
    // ⛔⛔ THE PROPERTY THE WHOLE CHOICE RESTS ON. Without it, *"it did not align on the brown
    // one"* is unanswerable — the brown one would never be in that pose again. ⭐ `CLAUDE.md`'s
    // build-id gate exists because a device report was once about code nobody could identify;
    // an unrecoverable boot pose is the same trap one level down.
    expect(seededRotations(1, 3)).toEqual(seededRotations(1, 3));
    expect(seededRotations(12345, 3)).toEqual(seededRotations(12345, 3));
  });

  it("⭐ a different seed gives a different scene", () => {
    // ⚠ Otherwise `?sceneSeed=` would be a knob that does nothing, which is worse than no knob.
    expect(seededRotations(1, 3)).not.toEqual(seededRotations(2, 3));
  });

  it("⭐ the three are different from each other", () => {
    // ⛔ Three bodies in the SAME random pose would look deliberate and test nothing. ⚠ It is
    // worth asserting because a PRNG used wrongly — re-seeded per draw — gives exactly that.
    const [a, b, c] = seededRotations(7, 3);
    expect(a).not.toEqual(b);
    expect(b).not.toEqual(c);
    expect(a).not.toEqual(c);
  });

  it("⛔⛔ THEY ARE UNIT QUATERNIONS — or every face normal derived from them is wrong", () => {
    // ⭐ The object model rotates face normals by these, and `normalize` would hide a small
    // error while a large one silently scaled the body's geometry. ⚠ Shoemake's construction
    // is unit BY CONSTRUCTION (sin²+cos² over the two halves), so this is a check on the
    // construction rather than on floating point.
    for (const q of seededRotations(99, 24)) {
      expect(Math.hypot(q[0], q[1], q[2], q[3])).toBeCloseTo(1, 12);
    }
  });

  it("⛔⛔ AND THE DISTRIBUTION IS UNIFORM — three Euler angles are NOT", () => {
    // ⛔⛔⛔ **THIS VECTOR USED TO MEASURE SOMETHING THAT CANNOT TELL THE TWO APART.** It
    // claimed to *"catch the plausible-but-wrong implementation"* by counting how many SIGN
    // OCTANTS a rotated axis reached in 400 draws, and asserting all eight.
    // ⚠ Measured 2026-09-17: three uniform Euler angles reach all eight octants too, easily.
    // ⭐ Of course they do — clustering toward the poles of the last axis still scatters points
    // across every octant; what changes is the DENSITY, and a set of visited octants throws
    // exactly that away. ⛔ So the vector was green against both the right answer and the wrong
    // one it named.
    //
    // ⭐⭐ **THE STATISTIC THAT DOES SEPARATE THEM IS ARCHIMEDES'.** If the rotation is uniform
    // on SO(3), the image of a fixed unit vector is uniform on the SPHERE, and the `z` component
    // of a uniform point on a sphere is uniform on [−1, 1] — equal-width bands of `z` have
    // equal area. ⚠ That is the property the Euler construction breaks, and it breaks it
    // loudly. Measured over 4000 seeded draws, eight equal bands:
    //
    //   Shoemake (this code)  476 485 476 564 481 483 501 534   — flat
    //   three Euler angles    941 412 358 340 318 324 419 888   — the poles carry twice
    //
    // ⚠ A MEAN ROTATION ANGLE was tried first and rejected: 125.8° against 128.1° is well
    // inside the noise of any fixture this size. ⭐ `METHOD`: *state the statistic and check it
    // separates the answers BEFORE writing the threshold* — mistake shape 1, in a test.
    const BINS = 8;
    const DRAWS = 4000;
    const counts = new Array<number>(BINS).fill(0);
    for (const q of seededRotations(4242, DRAWS)) {
      const v = qRotate(q, [0, 0, 1] as Vec3);
      const z = Math.max(-1, Math.min(1, v[2]));
      counts[Math.min(BINS - 1, Math.floor(((z + 1) / 2) * BINS))]! += 1;
    }
    const expected = DRAWS / BINS;
    for (const [i, c] of counts.entries()) {
      // ⚠ ±25 % of the expected count. ⛔ Wide enough that the seed is not load-bearing, and
      // far tighter than the 1.9× and 0.64× the Euler construction produces at the ends.
      expect(c, `band ${i} of ${counts.join(",")}`).toBeGreaterThan(expected * 0.75);
      expect(c, `band ${i} of ${counts.join(",")}`).toBeLessThan(expected * 1.25);
    }
  });

  it("⚠ and every quaternion is CANONICAL, like everything else in the project", () => {
    // ⛔ `vec.ts` states the contract in capitals — *every quaternion leaving this module is
    // canonicalised to `w >= 0`* — because `q` and `−q` are the same rotation and the previous
    // project lost a day to the difference. ⚠ This module was outside that guarantee until
    // 2026-09-17. Harmless in practice, and precisely the kind of exception that stops being
    // harmless when a later reader trusts the contract.
    for (const q of seededRotations(7, 64)) expect(q[0]).toBeGreaterThanOrEqual(0);
  });
});

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

  it("⛔⛔ AND THE DISTRIBUTION COVERS THE SPHERE — three Euler angles would NOT", () => {
    // ⭐⭐ THE VECTOR THAT CATCHES THE PLAUSIBLE-BUT-WRONG IMPLEMENTATION. Three random Euler
    // angles look random and cluster toward the poles of whichever axis is applied last, so a
    // whole family of orientations would never appear in a debug scene — and a mechanism that
    // failed only there would never be exercised.
    // ⚠ Measured as coverage of the SIGN OCTANTS of a rotated axis: a clustered distribution
    // misses octants; a uniform one reaches all eight in a few hundred draws.
    const octants = new Set<string>();
    for (const q of seededRotations(4242, 400)) {
      const v = qRotate(q, [0, 0, 1] as Vec3);
      octants.add(`${v[0] > 0}${v[1] > 0}${v[2] > 0}`);
    }
    expect(octants.size).toBe(8);
  });
});

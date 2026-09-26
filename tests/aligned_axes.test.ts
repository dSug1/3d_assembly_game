/**
 * GOLDEN VECTORS — **THE TRANSLATION AXES OF AN ALIGNED FOLLOWER** (the owner, 2026-09-26): shown
 * while it is held, red + blue for the horizontal plane, green for gravity (or none while a roll is
 * on), each drawn from the FollowerFace centre to the PioneerFaceCursor's projection.
 */
import { describe, expect, it } from "vitest";
import {
  alignedTravelAxes,
  segmentTowardCursor,
} from "@input/aligned_axes";
import type { Vec3 } from "@core/vec";

describe("⭐⭐⭐ which translation axes a held aligned Follower shows", () => {
  it("⭐⭐ first touch / left click alone → red and blue, always", () => {
    // ⛔ RED against the movement-driven rule, which would show nothing on a still finger.
    expect(alignedTravelAxes(false, false)).toEqual([true, false, true]);
  });

  it("⭐⭐ a second touch / Shift → the green alone", () => {
    // ⛔ RED against keeping red and blue up alongside it.
    expect(alignedTravelAxes(true, false)).toEqual([false, true, false]);
  });

  it("⛔⛔ a second touch while a roll is ongoing → none of the three (the grey stands alone)", () => {
    expect(alignedTravelAxes(true, true)).toEqual([false, false, false]);
  });

  it("⚠ a roll does not hide red and blue on a first touch alone — the roll is a second-touch rule", () => {
    expect(alignedTravelAxes(false, true)).toEqual([true, false, true]);
  });
});

describe("⭐⭐⭐ each axis is a segment toward the PioneerFaceCursor's projection", () => {
  const O: Vec3 = [1, 2, 3];

  it("⭐⭐ the segment ends at the cursor's projection, not at a full-screen length", () => {
    const [a, b] = segmentTowardCursor(O, [1, 0, 0], [4, 7, -5]);
    expect(a).toEqual(O);
    // ⛔ RED against a full-length line: only the x offset (3) counts.
    expect(b[0]).toBeCloseTo(4, 12);
    expect(b[1]).toBeCloseTo(2, 12);
    expect(b[2]).toBeCloseTo(3, 12);
  });

  it("⭐ SIGNED — a cursor behind the origin gives a segment pointing back", () => {
    // ⛔ RED against an absolute length laid out along +axis.
    const [, b] = segmentTowardCursor(O, [0, 0, 1], [9, 9, 1]);
    expect(b[2]).toBeCloseTo(1, 12);
  });

  it("⭐ a non-unit axis is normalised — the length is the cursor's, not the vector's", () => {
    const [, b] = segmentTowardCursor(O, [0, 5, 0], [1, 4, 3]);
    expect(b[1]).toBeCloseTo(4, 12);
  });

  it("⚠ a cursor square to the axis gives a ZERO-length segment", () => {
    const [a, b] = segmentTowardCursor(O, [1, 0, 0], [1, 50, -50]);
    expect(b).toEqual(a);
  });

  it("⛔ an axis with no direction returns the origin twice, never NaN", () => {
    const [a, b] = segmentTowardCursor(O, [0, 0, 0], [5, 5, 5]);
    expect(a).toEqual(O);
    expect(b).toEqual(O);
  });
});

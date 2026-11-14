/**
 * ⭐ What `input/piece_orbit.ts` keeps since its way in / out were deleted (2026-11-14, CL1): the piece's heading round the centre and the
 * rings' distance range. (Their vectors lived in `proto_piece_orbit.test.ts`, deleted with the rest.)
 */
import { describe, expect, it } from "vitest";
import { headingAbout, ringDistanceRange } from "../src/input/piece_orbit";

describe("the piece's place round the orbit centre", () => {
  it("the heading is atan2(x, z) about +y, from the centre", () => {
    expect(headingAbout([0, 0, 0], [0, 5, 1])).toBeCloseTo(0, 12);
    expect(headingAbout([0, 0, 0], [1, 0, 0])).toBeCloseTo(Math.PI / 2, 12);
    expect(headingAbout([1, 0, 1], [1, 0, 0])).toBeCloseTo(Math.PI, 12);
  });

  it("the rings' range: the least and the most of the radius over the whole rig, ends included", () => {
    const r = ringDistanceRange((v) => 2 + Math.sin(v * Math.PI), 64);
    expect(r.minM).toBeCloseTo(2, 12);
    expect(r.maxM).toBeCloseTo(3, 12);
    const end = ringDistanceRange((v) => 1 + v, 8);
    expect([end.minM, end.maxM]).toEqual([1, 2]);
  });
});

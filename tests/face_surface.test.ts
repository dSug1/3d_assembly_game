/**
 * GOLDEN VECTORS — **THE PIONEERFACECURSOR RIDES THE FACE'S SURFACE** (the owner, 2026-09-25):
 * bounded by its edges, and following the surface when it is not flat.
 */
import { describe, expect, it } from "vitest";
import {
  closestPointOnTriangle,
  pointOnFace,
} from "@core/face_surface";
import type { Vec3 } from "@core/vec";

/** A flat 2 × 2 square in the plane y = 0, normal +y. */
const SQ: Vec3[] = [
  [-1, 0, -1],
  [1, 0, -1],
  [1, 0, 1],
  [-1, 0, 1],
];
const SQ_TRI = [0, 1, 2, 0, 2, 3];
const UP: Vec3 = [0, 1, 0];
const DOWN: Vec3 = [0, -1, 0];

/** ⚠ NOT FLAT: a roof, ridge along z at x = 0, y = 1, eaves at x = ±1, y = 0. */
const ROOF: Vec3[] = [
  [-1, 0, -1],
  [0, 1, -1],
  [0, 1, 1],
  [-1, 0, 1],
  [1, 0, -1],
  [1, 0, 1],
];
const ROOF_TRI = [0, 1, 2, 0, 2, 3, 1, 4, 5, 1, 5, 2];

const close = (a: Vec3 | null, b: Vec3): void => {
  expect(a).not.toBeNull();
  for (let i = 0; i < 3; i++) expect(a?.[i]).toBeCloseTo(b[i] as number, 9);
};

describe("⭐⭐⭐ on a flat face: under the finger, and bounded by the edges", () => {
  it("⭐ a ray that hits the face lands exactly under it", () => {
    close(pointOnFace([0.3, 5, 0.4], DOWN, SQ, SQ_TRI, [0, 0, 0], UP), [0.3, 0, 0.4]);
  });

  it("⛔⛔ past an EDGE the cursor stops ON the edge — it cannot exit the surface", () => {
    // ⛔ RED against returning the plane point unclamped (x = 3).
    close(pointOnFace([3, 5, 0.2], DOWN, SQ, SQ_TRI, [0, 0, 0], UP), [1, 0, 0.2]);
  });

  it("⛔ past a CORNER it stops at the corner", () => {
    close(pointOnFace([3, 5, 4], DOWN, SQ, SQ_TRI, [0, 0, 0], UP), [1, 0, 1]);
  });

  it("⭐ a face dragged from BEHIND still answers — the hit is two-sided", () => {
    // ⚠ On a FLAT face the plane path lands here too, so this alone cannot tell a one-sided hit
    // from a two-sided one — the roof's from-below vector is the one that does.
    close(pointOnFace([0.3, -5, 0.4], UP, SQ, SQ_TRI, [0, 0, 0], UP), [0.3, 0, 0.4]);
  });

  it("⚠ a ray parallel to the face that misses it moves nothing (null)", () => {
    expect(pointOnFace([0, 5, 0], [1, 0, 0], SQ, SQ_TRI, [0, 0, 0], UP)).toBeNull();
  });
});

describe("⭐⭐⭐ on a face that is NOT flat, the cursor sits ON the surface", () => {
  it("⭐⭐ a ray onto a slope lands on the slope, not on the face's plane", () => {
    // ⛔ RED against always intersecting the plane through the cursor (y = 1 at the ridge) and
    // projecting: that answers a different point of the slope than the one under the finger.
    close(
      pointOnFace([0.5, 5, 0], DOWN, ROOF, ROOF_TRI, [0, 1, 0], UP),
      [0.5, 0.5, 0],
    );
  });

  it("⭐⭐ from BELOW a ridge, the two-sided hit still takes the NEAREST surface point", () => {
    close(
      pointOnFace([0.5, -5, 0], UP, ROOF, ROOF_TRI, [0, 1, 0], UP),
      [0.5, 0.5, 0],
    );
  });

  it("⭐⭐ a face that FOLDS OVER itself answers the sheet NEAREST the eye", () => {
    // ⚠ A C-shaped face — a half-pipe seen from outside — is crossed twice by one ray.
    // ⛔ RED against the farthest hit, which would put the cursor on the hidden sheet.
    const FOLD: Vec3[] = [
      [-1, 0, -1],
      [1, 0, -1],
      [1, 0, 1],
      [-1, 0, 1],
      [-1, 1, -1],
      [1, 1, -1],
      [1, 1, 1],
      [-1, 1, 1],
    ];
    const FOLD_TRI = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7];
    close(
      pointOnFace([0.2, 5, 0.3], DOWN, FOLD, FOLD_TRI, [0, 1, 0], UP),
      [0.2, 1, 0.3],
    );
  });

  it("⛔ past the eave the cursor is ON the roof and at its edge", () => {
    const p = pointOnFace([3, 5, 0], DOWN, ROOF, ROOF_TRI, [0, 1, 0], UP);
    close(p, [1, 0, 0]);
  });
});

describe("⭐ closestPointOnTriangle — interior, edge and vertex", () => {
  const a: Vec3 = [0, 0, 0];
  const b: Vec3 = [2, 0, 0];
  const c: Vec3 = [0, 0, 2];
  it("interior projects straight down", () => {
    close(closestPointOnTriangle([0.5, 3, 0.5], a, b, c), [0.5, 0, 0.5]);
  });
  it("beyond the hypotenuse lands on it", () => {
    close(closestPointOnTriangle([2, 0, 2], a, b, c), [1, 0, 1]);
  });
  it("beyond a vertex lands on the vertex", () => {
    close(closestPointOnTriangle([-1, 0, -1], a, b, c), [0, 0, 0]);
    close(closestPointOnTriangle([4, 1, -1], a, b, c), [2, 0, 0]);
  });
});

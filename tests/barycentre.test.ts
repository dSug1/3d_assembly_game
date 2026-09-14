/**
 * GOLDEN VECTORS — §2 rule 1's orbit centre.
 *
 * ⭐ The spec's clarification is the load-bearing part: with **no raycast hit there is
 * no intersection point**, so "closest to the raycast" would be undefined. The
 * distance is to the RAY, which is defined whether or not anything was hit.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { barycentreCandidates, distanceToRay, orbitCentre } from "../src/input/barycentre";
import type { Vec3 } from "../src/core/vec";

const cfg = DEFAULT_CONFIG;

describe("barycentre candidates", () => {
  it("⛔ fewer than two objects has NO barycentre — the spec says so", () => {
    expect(barycentreCandidates([], 8)).toEqual([]);
    expect(barycentreCandidates([[1, 2, 3]], 8)).toEqual([]);
  });

  it("two objects give exactly one, at the midpoint", () => {
    const c = barycentreCandidates([[0, 0, 0], [2, 4, 6]], 8);
    expect(c).toHaveLength(1);
    expect(c[0]).toEqual([1, 2, 3]);
  });

  it("⭐ the count follows 2^N − N − 1", () => {
    // 1 at N=2, 4 at N=3, 11 at N=4, 26 at N=5 — it does not stop, which is why the
    // cap exists at all.
    const pts = (n: number): Vec3[] => Array.from({ length: n }, (_, i) => [i, 0, 0] as Vec3);
    for (const n of [2, 3, 4, 5]) {
      expect(barycentreCandidates(pts(n), 1000)).toHaveLength(2 ** n - n - 1);
    }
  });

  it("⭐⭐ the cap keeps the PAIRS — smallest subsets first", () => {
    // ⛔ When the cap bites it must keep the combinations a user is most likely to
    // mean, not an arbitrary slice. With 5 objects there are 10 pairs; a cap of 10
    // must be exactly those.
    const pts: Vec3[] = [[0, 0, 0], [10, 0, 0], [0, 10, 0], [0, 0, 10], [10, 10, 10]];
    const capped = barycentreCandidates(pts, 10);
    expect(capped).toHaveLength(10);
    const allPairs = barycentreCandidates(pts, 1000).slice(0, 10);
    expect(capped).toEqual(allPairs);
  });

  it("the cap is honoured exactly", () => {
    const pts: Vec3[] = Array.from({ length: 6 }, (_, i) => [i, 0, 0]);
    expect(barycentreCandidates(pts, cfg.maxBarycenterCandidates)).toHaveLength(
      cfg.maxBarycenterCandidates,
    );
  });
});

describe("distance to the ray", () => {
  it("is the perpendicular distance for a point beside the ray", () => {
    expect(distanceToRay([0, 3, 0], { origin: [0, 0, 0], direction: [1, 0, 0] })).toBeCloseTo(3, 9);
  });

  it("⛔ a point BEHIND the ray is measured from the origin, not from the line", () => {
    // ⚠ Otherwise a barycentre behind the camera could win by sitting conveniently
    // close to a line that runs backwards out of the screen.
    expect(distanceToRay([-5, 0, 0], { origin: [0, 0, 0], direction: [1, 0, 0] })).toBeCloseTo(5, 9);
  });

  it("normalises the direction for you", () => {
    const d = distanceToRay([0, 3, 0], { origin: [0, 0, 0], direction: [17, 0, 0] });
    expect(d).toBeCloseTo(3, 9);
  });

  it("⛔ a zero-length direction returns a real number, not NaN", () => {
    // A NaN would silently WIN every comparison it took part in.
    const d = distanceToRay([0, 3, 0], { origin: [0, 0, 0], direction: [0, 0, 0] });
    expect(Number.isFinite(d)).toBe(true);
    expect(d).toBeCloseTo(3, 9);
  });
});

describe("the orbit centre", () => {
  it("⭐ picks the barycentre nearest the ray", () => {
    const pts: Vec3[] = [[0, 0, 0], [10, 0, 0], [0, 100, 0], [10, 100, 0]];
    // A ray along +x at y=100 should choose the pair up there, not the one at y=0.
    const centre = orbitCentre(pts, { origin: [-50, 100, 0], direction: [1, 0, 0] }, cfg);
    expect(centre[1]).toBeCloseTo(100, 6);
  });

  it("⛔ falls back to the scene centre with fewer than two objects", () => {
    expect(orbitCentre([[5, 5, 5]], { origin: [0, 0, 0], direction: [1, 0, 0] }, cfg)).toEqual([0, 0, 0]);
  });

  it("⭐ is DETERMINISTIC on a tie — the camera must not flicker", () => {
    // Two candidates equidistant from the ray. Ranking must resolve the same way
    // every frame, or the orbit centre would jitter between them during a drag.
    const pts: Vec3[] = [[-1, 0, 0], [1, 0, 0], [-1, 0, 10], [1, 0, 10]];
    const ray = { origin: [0, -50, 5] as Vec3, direction: [0, 1, 0] as Vec3 };
    const first = orbitCentre(pts, ray, cfg);
    for (let i = 0; i < 20; i++) expect(orbitCentre(pts, ray, cfg)).toEqual(first);
  });
});

/**
 * §2 RULE 1 — WHAT THE CAMERA ORBITS AROUND.
 *
 * *"compute the barycenters of any combination of objects present in the scene … and
 * find the barycenter with the **smallest perpendicular distance to the touchpoint's
 * ray**"*, with *"the combination count grows as `2^N − N − 1` … Cap the set at
 * `maxBarycenterCandidates` and cull candidates outside the viewport before ranking."*
 *
 * ⭐ The spec's own clarification is the load-bearing part: with **no hit there is no
 * intersection point**, so "closest to the raycast" would be undefined. The distance
 * is from the barycentre to the RAY, which is well defined whether or not anything
 * was hit.
 *
 * ⛔ `2^N − N − 1` IS EVERY SUBSET OF SIZE ≥ 2 — 1 at N=2, 4 at N=3, 11 at N=4, 502 at
 * N=10, and it does not stop. The cap is not a tidiness measure; without it this runs
 * every frame of a drag and grows exponentially with a scene the game is meant to
 * fill. ⭐ Subsets are generated SMALLEST FIRST, so when the cap bites it keeps the
 * pairs — the combinations a user is most likely to mean — rather than an arbitrary
 * slice.
 *
 * ⚠ Engine-free: positions and a ray come in as plain numbers. Viewport culling is
 * the CALLER's job, because it needs the projection — pass only what is on screen.
 */
import type { Vec3 } from "../core/vec";
import type { GestureConfig } from "./gestureConfig";

/** A ray in world metres. ⚠ `direction` need not be normalised; it is normalised here. */
export interface Ray {
  readonly origin: Vec3;
  readonly direction: Vec3;
}

const mean = (points: readonly Vec3[]): Vec3 => {
  let x = 0;
  let y = 0;
  let z = 0;
  for (const p of points) {
    x += p[0];
    y += p[1];
    z += p[2];
  }
  const n = points.length;
  return [x / n, y / n, z / n];
};

/**
 * Barycentres of every subset of size ≥ 2, smallest subsets first, capped.
 *
 * ⚠ Fewer than two objects has no barycentre at all — the spec says so, and the
 * caller substitutes the scene centre. An empty list is the honest answer here rather
 * than a fabricated point.
 */
export function barycentreCandidates(
  positions: readonly Vec3[],
  maxCandidates: number,
): Vec3[] {
  const n = positions.length;
  if (n < 2) return [];
  const out: Vec3[] = [];
  // Smallest subsets first: all pairs, then all triples, and so on.
  for (let size = 2; size <= n && out.length < maxCandidates; size++) {
    const idx: number[] = [];
    const walk = (start: number): void => {
      if (out.length >= maxCandidates) return;
      if (idx.length === size) {
        out.push(mean(idx.map((i) => positions[i]!)));
        return;
      }
      for (let i = start; i < n; i++) {
        idx.push(i);
        walk(i + 1);
        idx.pop();
        if (out.length >= maxCandidates) return;
      }
    };
    walk(0);
  }
  return out;
}

/**
 * Distance from a point to a ray. ⚠ To the RAY, not to its infinite line: a
 * barycentre BEHIND the camera is measured from the ray's origin, so it cannot win
 * by being conveniently close to a line that runs backwards out of the screen.
 */
export function distanceToRay(point: Vec3, ray: Ray): number {
  const dx = ray.direction[0];
  const dy = ray.direction[1];
  const dz = ray.direction[2];
  const len = Math.hypot(dx, dy, dz);
  const px = point[0] - ray.origin[0];
  const py = point[1] - ray.origin[1];
  const pz = point[2] - ray.origin[2];
  // A zero-length direction is not a ray. Fall back to the distance from the origin
  // rather than dividing by zero and returning NaN, which would silently win every
  // comparison it took part in.
  if (len < 1e-12) return Math.hypot(px, py, pz);
  const ux = dx / len;
  const uy = dy / len;
  const uz = dz / len;
  const t = px * ux + py * uy + pz * uz;
  if (t <= 0) return Math.hypot(px, py, pz);
  return Math.hypot(px - t * ux, py - t * uy, pz - t * uz);
}

/**
 * §2 rule 1's orbit centre: the candidate barycentre nearest the touchpoint's ray, or
 * `fallback` (the scene centre) when there are fewer than two objects.
 *
 * ⚠ Ties resolve to the FIRST candidate, which is the smallest-subset one, and the
 * generation order is deterministic — so the camera cannot flicker between two
 * equally-good centres on successive frames.
 */
export function orbitCentre(
  positions: readonly Vec3[],
  ray: Ray,
  cfg: GestureConfig,
  fallback: Vec3 = [0, 0, 0],
): Vec3 {
  const candidates = barycentreCandidates(positions, cfg.maxBarycenterCandidates);
  if (candidates.length === 0) return fallback;
  let best = candidates[0]!;
  let bestD = distanceToRay(best, ray);
  for (let i = 1; i < candidates.length; i++) {
    const d = distanceToRay(candidates[i]!, ray);
    if (d < bestD) {
      bestD = d;
      best = candidates[i]!;
    }
  }
  return best;
}

/**
 * ⭐⭐⭐ **THE BARYCENTRE OF ONE NAMED PAIR** — not chosen by a ray, but dictated.
 *
 * > *"when the pioneer and follower enter the offset radius, the yellow target of the camera
 * > orbit shall switch to the barycenter of pioneer-follower objects (same as if the switch of
 * > barycenter was triggered by the user input)."* — the owner, 2026-09-19
 *
 * ⛔⛔ **`barycentreCandidates` ANSWERS A DIFFERENT QUESTION.** It enumerates every subset so a
 * RAY can pick between them — rule 1's *"what did the finger point at?"*. ⚠ Here the pair is
 * already known, so there is nothing to choose and nothing for a ray to do; asking the candidate
 * machinery would mean building a list in order to find the one entry we started with.
 *
 * ⭐ It shares `mean` with that machinery, so *"the barycentre of these bodies"* has one
 * definition — the pair-of-two the ray might have picked and the pair this names are the same
 * point, which is what *"same as if the switch was triggered by the user input"* requires.
 */
export function pairBarycentre(a: Vec3, b: Vec3): Vec3 {
  return mean([a, b]);
}

/**
 * ⭐⭐⭐ (2026-11-05, `TILTED_ORBIT_REBUILD_SCOPE.md` §21) **THE SECTIONS AS PLANE CUTS** — the faces contour (Step 5's convex outline: each facet's polygon,
 * `FaceMap.facets[].poly`) cut by a plane: ONE closed convex polygon, one side per facet crossed — finite and closed by construction (a plane through the
 * inside of a convex solid; no angle, so no pole to throw it off — the owner: *"the contours shall be closed loops and cannot be infinite loops due to
 * throw off by singularities or slanted faces"*). The one degenerate case — the plane lying along a facet (`x = c` at the box's side itself) — is excluded
 * by keeping the plane at least `CUT_INSIDE_M` (1 mm) inside every facet it is parallel to (`insidePlane`).
 * ⛔ ENGINE-FREE. Signed distances, polygon clipping, chaining — textbook.
 */
import type { Vec3 } from "../core/vec";

/** ⭐ A plane `n·x = d` (`n` unit). */
export interface Plane {
  readonly n: Vec3;
  readonly d: number;
}

/** ⭐ A facet of the convex contour: its outward normal and its polygon (world). */
export interface CutFacet {
  readonly n: Vec3;
  readonly poly: readonly Vec3[];
}

/** ⭐ A cut: its points in order round the loop (closed — the last joins the first), and the facet each side `i → i+1` lies on. */
export interface CutLoop {
  readonly pts: readonly Vec3[];
  readonly facet: readonly number[];
}

/** ⭐ The least distance (m) a cutting plane keeps from a facet it is parallel to. */
export const CUT_INSIDE_M = 0.001;

const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);

/** ⭐ The plane through `p` square to `normal` (normalised). */
export function planeThrough(p: Vec3, normal: Vec3): Plane {
  const l = len(normal);
  const n: Vec3 = l > 1e-12 ? [normal[0] / l, normal[1] / l, normal[2] / l] : [0, 1, 0];
  return { n, d: dot(n, p) };
}

/**
 * ⭐⭐ THE 1 mm RULE: a plane parallel (within 1e-6) to a facet and within `minM` of that facet's plane is moved `minM` inside the contour from it — so a
 * cut is always a loop, never a whole facet.
 */
export function insidePlane(plane: Plane, facets: readonly CutFacet[], minM: number = CUT_INSIDE_M): Plane {
  let d = plane.d;
  for (const f of facets) {
    if (f.poly.length === 0) continue;
    const c = dot(plane.n, f.n);
    if (Math.abs(c) < 1 - 1e-6) continue;
    const fd = dot(plane.n, f.poly[0]!); // the facet's level along the plane's normal
    if (Math.abs(d - fd) < minM) d = fd - Math.sign(c) * minM; // inside: against the facet's outward normal
  }
  return d === plane.d ? plane : { n: plane.n, d };
}

/**
 * ⭐⭐⭐ THE CUT: each facet's polygon met by the plane in one segment (a vertex ON the plane counted on its positive side, so two facets sharing it agree);
 * the segments chained end to end into the loop. `null` when the plane misses the contour or the chain does not close (never on a convex contour).
 */
export function cutLoop(facets: readonly CutFacet[], plane: Plane): CutLoop | null {
  const segs: { a: Vec3; b: Vec3; f: number }[] = [];
  facets.forEach((fc, fi) => {
    const P = fc.poly;
    if (P.length < 3) return;
    const s = P.map((v) => dot(plane.n, v) - plane.d);
    const hits: Vec3[] = [];
    for (let k = 0; k < P.length; k++) {
      const k2 = (k + 1) % P.length;
      const pa = s[k]! >= 0;
      const pb = s[k2]! >= 0;
      if (pa === pb) continue;
      const t = s[k]! / (s[k]! - s[k2]!);
      const A = P[k]!;
      const B = P[k2]!;
      hits.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
    }
    if (hits.length === 2 && len(sub(hits[0]!, hits[1]!)) > 1e-9) segs.push({ a: hits[0]!, b: hits[1]!, f: fi });
  });
  if (segs.length < 3) return null;
  const scale = Math.max(...segs.map((g) => Math.max(len(g.a), len(g.b))), 1);
  const eps = 1e-7 * scale;
  const used = new Array<boolean>(segs.length).fill(false);
  const pts: Vec3[] = [segs[0]!.a];
  const facet: number[] = [segs[0]!.f];
  used[0] = true;
  let end = segs[0]!.b;
  for (let n = 1; n < segs.length; n++) {
    let found = -1;
    let flip = false;
    for (let j = 0; j < segs.length && found < 0; j++) {
      if (used[j]) continue;
      if (len(sub(segs[j]!.a, end)) <= eps) found = j;
      else if (len(sub(segs[j]!.b, end)) <= eps) {
        found = j;
        flip = true;
      }
    }
    if (found < 0) return null;
    used[found] = true;
    const g = segs[found]!;
    pts.push(end);
    facet.push(g.f);
    end = flip ? g.a : g.b;
  }
  if (len(sub(end, pts[0]!)) > eps) return null; // not closed
  return { pts, facet };
}

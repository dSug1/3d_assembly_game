/**
 * ⭐⭐⭐ **COLLISION SHAPE — the convex point set a body occupies, and the GAP between two.**
 *
 * Design of record: [`Claude/10_INPUT_TOUCH/spec/APPROACH_AND_MATE.md`] §19 (`D49`).
 *
 * ⛔⛔ **WHY THIS EXISTS: A CENTRE IS NOT WHERE A BODY IS.** The capture test was
 * centre-to-centre, and the base plate proved it cannot be: a `6L × 0.3L × 9L` body has its
 * centre `3L` below its own top face, so a part **resting on the plate** read as far away while
 * a part hovering high above its middle read as near. ⚠ No radius fixes that — it is wrong
 * about a body of that shape at every value, which the 2026-09-17 audit measured.
 *
 * ⭐⭐⭐ **THE OWNER'S QUESTION WAS WHERE THE SHAPE COMES FROM**: computed at spawn, or
 * authored in Blender as a second "phantom" body? ✅ **COMPUTED** (`D49`), and the reasons are
 * worth keeping because two of them invert the worry that prompted the question:
 *
 * * **Quads cannot reach us.** glTF 2.0 carries triangles only and Blender's exporter
 *   triangulates on the way out. A non-issue for either answer.
 * * ⭐⭐ **INVERTED NORMALS CANNOT AFFECT THIS FILE, BY CONSTRUCTION** — nothing here reads a
 *   normal. A support function over a point cloud asks only *which vertex is furthest this
 *   way*, and a flipped winding does not move a vertex. ⚠ Inverted normals still bite, at the
 *   **mate** (`mateFacingCos` must be negative, `CONSTRAINTS` §7) — just not here.
 * * ⚠ **Hollows are the one real limit.** A convex hull fills a pocket in. ⛔ But a
 *   hand-authored phantom is convex in practice too, so the true comparison is *computed hull
 *   versus hand-authored hull* — and the computed one wins because **it cannot drift from the
 *   mesh it describes.** A phantom is a second source of truth for one fact, maintained in
 *   another tool, with nothing able to catch it going stale.
 *
 * ⛔ The escape hatch is recorded rather than built: a part whose **concave pocket** must
 * capture (a socket, a slot) needs convex DECOMPOSITION — several hulls, still computed — or an
 * exact triangle BVH. §19 of the spec keeps it on the record so a later session finds a
 * decision rather than an omission.
 *
 * ⭐⭐ **NO HULL IS CONSTRUCTED, AND THAT IS NOT A SHORTCUT.** GJK needs a *support function*,
 * and the support of a point cloud **is** the support of its convex hull — the interior points
 * can never be the argmax. ⛔ So hulling would cost 300 lines of quickhull to compute something
 * the algorithm already has. What a big cloud costs instead is an O(n) support query, and
 * `reducePoints` below bounds that.
 *
 * ⛔ ENGINE-FREE. It takes numbers and returns numbers; `src/render` reads the vertices off a
 * mesh once, at spawn, and hands a flat array across the boundary.
 */
import type { Vec3 } from "./vec";
import { add, cross, dot, length, scale, sub } from "./vec";

/**
 * A body's occupied volume, as a convex point set in its **LOCAL** frame.
 *
 * ⚠ *Convex* describes how it is USED, not what is stored: the points may be an entire
 * triangle soup, and every query below treats them as their convex hull.
 */
export interface ConvexShape {
  readonly points: readonly Vec3[];
}

/**
 * ⚠ The default cap on a shape's point count — see `reducePoints`.
 *
 * ⭐ 64 is chosen so that **nothing in today's scene is touched**: a box is 8 corners, and the
 * reduction only engages for imported geometry, which is `3D4`'s row. ⛔ Not a `GestureConfig`
 * field: it is a geometry budget, not a number a hand judges on the glass, and a tunable
 * nobody can feel is what `config_debt.test.ts` exists to refuse.
 */
export const DEFAULT_MAX_SHAPE_POINTS = 64;

/**
 * The eight corners of a box with the given full dimensions, centred on the local origin.
 *
 * ⭐ This is what every body in the scene uses today, and it makes the capture test **exact**
 * for them: a box IS its eight corners' hull, so there is no approximation anywhere in the
 * current product. ⚠ That is deliberate sequencing — the surface-distance rule can be judged by
 * a hand on geometry where it has no error of its own, before an importer adds one.
 */
export function boxShape(dims: readonly [number, number, number]): ConvexShape {
  const [hx, hy, hz] = [dims[0] / 2, dims[1] / 2, dims[2] / 2];
  const points: Vec3[] = [];
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) points.push([sx * hx, sy * hy, sz * hz]);
    }
  }
  return { points };
}

/**
 * ⭐ Build a shape from a flat `[x,y,z, x,y,z, …]` vertex array — the shape
 * `mesh.getVerticesData(PositionKind)` returns, so `src/render` can hand one straight across
 * the boundary without learning anything about geometry.
 *
 * ⛔ A malformed array (not a multiple of 3, or empty) yields an **empty** shape, and
 * `gapBetween` refuses an empty shape with `null` rather than answering 0 or Infinity.
 * `LESSONS_CARRIED` §6: *a degenerate input returns null, never a default* — and both defaults
 * available here are actively harmful, one capturing everything and one capturing nothing.
 */
export function shapeFromVertices(
  data: ArrayLike<number>,
  maxPoints: number = DEFAULT_MAX_SHAPE_POINTS,
): ConvexShape {
  const points: Vec3[] = [];
  const n = Math.floor(data.length / 3);
  for (let i = 0; i < n; i++) {
    // ⚠ `?? NaN` and not `?? 0`: a missing coordinate is UNKNOWN, and the guard below drops it.
    // ⛔ Substituting zero would place a phantom vertex at the body's local origin, which is
    // inside every real body — so the shape would quietly grow a point nothing put there.
    const p: Vec3 = [data[i * 3] ?? NaN, data[i * 3 + 1] ?? NaN, data[i * 3 + 2] ?? NaN];
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1]) || !Number.isFinite(p[2])) continue;
    points.push(p);
  }
  return { points: reducePoints(points, maxPoints) };
}

/**
 * ⭐ Deterministic direction set for `reducePoints` — the 26 directions of a 3×3×3 grid with
 * the centre removed: 6 face, 12 edge, 8 corner. ⚠ Not normalised, and it does not need to be:
 * an argmax over `dot` is unchanged by a positive scale on the direction.
 */
const REDUCTION_DIRECTIONS: readonly Vec3[] = (() => {
  const out: Vec3[] = [];
  for (const x of [-1, 0, 1]) {
    for (const y of [-1, 0, 1]) {
      for (const z of [-1, 0, 1]) {
        if (x === 0 && y === 0 && z === 0) continue;
        out.push([x, y, z]);
      }
    }
  }
  return out;
})();

/**
 * ⭐⭐ Bound a cloud's size by keeping the points that are **extreme** along a fixed direction
 * set. Returns the input untouched when it already fits.
 *
 * ⛔⛔ **IT IS AN INNER APPROXIMATION, AND THE DIRECTION OF THE ERROR IS THE POINT.** Every
 * kept point is a real vertex of the body, so the reduced hull is CONTAINED in the true one —
 * the computed gap is therefore never smaller than the truth, and a pair captures **slightly
 * late**, never early. ⚠ Late is the safe direction for a threshold that arms an approach: a
 * highlight that appears a millimetre later is a feel question the slider absorbs; one that
 * appears while the bodies are still apart is a readout that lies.
 *
 * ⚠⚠ **THIS IS A STOPGAP FOR `3D4`, STATED AS ONE.** A real hull (quickhull) keeps every
 * extreme point in every direction rather than 26 of them. ⛔ It is not written today because
 * nothing imports a mesh yet, and a hull with no specimen to run against is 300 lines nothing
 * can falsify — the *idealised fixture* mistake, committed before the fixture even exists.
 */
export function reducePoints(points: readonly Vec3[], maxPoints: number): readonly Vec3[] {
  if (points.length <= maxPoints || points.length === 0) return points;
  // ⚠ A Set of INDICES, not of points: two distinct vertices can share coordinates, and
  // de-duplicating by value here would be a second, silent behaviour change.
  const keep = new Set<number>();
  for (const dir of REDUCTION_DIRECTIONS) {
    let bestIndex = 0;
    let best = -Infinity;
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      if (pt === undefined) continue;
      const d = dot(pt, dir);
      if (d > best) {
        best = d;
        bestIndex = i;
      }
    }
    keep.add(bestIndex);
  }
  const out: Vec3[] = [];
  for (const i of [...keep].sort((a, b) => a - b)) {
    const pt = points[i];
    if (pt !== undefined) out.push(pt);
  }
  return out;
}

/**
 * ⛔⛔ **`localBounds` AND `LocalBounds` ARE DELETED** (`D50`, 2026-09-18). They gave a
 * shape's axis-aligned box, which every outline was sized and centred from.
 * ⭐ Outlines come from `mesh_topology` now — real edges and real face boundaries — so a
 * bounding box has no reader left. ⚠ Its one genuine insight is carried over there: an
 * imported body's geometry is NOT centred on its origin, and anything drawn about the origin
 * hangs off to one side.
 */

/**
 * The point of `points` furthest along `dir` — GJK's support function.
 *
 * ⛔ Ties take the FIRST such point, deterministically. A tie-break that depended on iteration
 * order would make the algorithm's path depend on the order vertices happened to be authored
 * in, which is exactly the kind of thing that reproduces on one machine and not another.
 */
export function supportPoint(points: readonly Vec3[], dir: Vec3): Vec3 {
  // ⚠ An EMPTY cloud is refused by `gapBetween` before this is ever called; the fallback keeps
  // the type honest without inventing a vertex that could sit inside a body.
  let best: Vec3 = points[0] ?? [0, 0, 0];
  let bestDot = dot(best, dir);
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (p === undefined) continue;
    const d = dot(p, dir);
    if (d > bestDot) {
      bestDot = d;
      best = p;
    }
  }
  return best;
}

/** The closest point to the ORIGIN on a simplex, and the sub-simplex that supports it. */
export interface Nearest {
  readonly point: Vec3;
  /** Indices INTO the simplex passed in — the minimal face carrying `point`. */
  readonly keep: readonly number[];
}

/**
 * ⚠ Index a simplex. ⛔ Every caller has already checked the length, so the fallback is
 * unreachable — it exists because the compiler is configured to refuse an unchecked index, and
 * a zero vector is the only value that cannot silently become a plausible-looking vertex.
 */
const at = (w: readonly Vec3[], i: number): Vec3 => w[i] ?? [0, 0, 0];

/** Closest point to the origin on the segment `w[0]w[1]`. */
function nearestOnSegment(w: readonly Vec3[]): Nearest {
  const a = at(w, 0);
  const b = at(w, 1);
  const ab = sub(b, a);
  const denom = dot(ab, ab);
  if (denom <= 0) return { point: a, keep: [0] };
  const t = dot(scale(a, -1), ab) / denom;
  if (t <= 0) return { point: a, keep: [0] };
  if (t >= 1) return { point: b, keep: [1] };
  return { point: add(a, scale(ab, t)), keep: [0, 1] };
}

/**
 * Closest point to the origin on the triangle `w[0]w[1]w[2]` — Ericson's Voronoi-region form,
 * returning the supporting sub-simplex as well as the point.
 *
 * ⭐ The sub-simplex is what keeps GJK's simplex from growing without bound: a vertex or edge
 * region means the other points are not carrying the answer and must be dropped, or the next
 * iteration re-derives the same distance for ever.
 */
function nearestOnTriangle(w: readonly Vec3[]): Nearest {
  const a = at(w, 0);
  const b = at(w, 1);
  const c = at(w, 2);
  const ab = sub(b, a);
  const ac = sub(c, a);
  const ap = scale(a, -1);
  const d1 = dot(ab, ap);
  const d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return { point: a, keep: [0] };

  const bp = scale(b, -1);
  const d3 = dot(ab, bp);
  const d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return { point: b, keep: [1] };

  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) {
    const t = d1 / (d1 - d3);
    return { point: add(a, scale(ab, t)), keep: [0, 1] };
  }

  const cp = scale(c, -1);
  const d5 = dot(ab, cp);
  const d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return { point: c, keep: [2] };

  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) {
    const t = d2 / (d2 - d6);
    return { point: add(a, scale(ac, t)), keep: [0, 2] };
  }

  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
    const t = (d4 - d3) / (d4 - d3 + (d5 - d6));
    return { point: add(b, scale(sub(c, b), t)), keep: [1, 2] };
  }

  const denom = va + vb + vc;
  // ⛔ A DEGENERATE (collinear) triangle would reach here with `denom` at zero. Dividing would
  // produce NaN, and one NaN in a distance makes every comparison false — the pair would
  // silently stop capturing with nothing on the glass to say why.
  //
  // ⚠⚠ **MEASURED UNREACHABLE, AND SAID SO RATHER THAN LEFT LOOKING COVERED.** Over 40 000
  // degenerate triangles — collinear in three vertex orderings, and three coincident points —
  // removing this branch changed **no** answer and produced **no** NaN: the Voronoi region tests
  // above catch every degenerate case first. ⛔ So **no vector covers it, because none can**,
  // and `METHOD`'s rule is that a skipped check is announced instead of implied.
  // ⭐ Kept as defence in depth all the same, on `A18`'s precedent: the guard is two lines and
  // the failure it prevents is silent, which is the trade that rule already settled.
  if (!(denom > 0)) {
    const e1 = nearestOnSegment([a, b]);
    const e2 = nearestOnSegment([a, c]);
    const useFirst = length(e1.point) <= length(e2.point);
    const remap = (pairs: readonly number[]) => (i: number): number => pairs[i] ?? 0;
    return useFirst
      ? { point: e1.point, keep: e1.keep.map(remap([0, 1])) }
      : { point: e2.point, keep: e2.keep.map(remap([0, 2])) };
  }
  const v = vb / denom;
  const ww = vc / denom;
  return { point: add(a, add(scale(ab, v), scale(ac, ww))), keep: [0, 1, 2] };
}

/** Is the origin on the far side of plane `abc` from `d`? */
function originOutsidePlane(a: Vec3, b: Vec3, c: Vec3, d: Vec3): boolean {
  const n = cross(sub(b, a), sub(c, a));
  const signOrigin = dot(scale(a, -1), n);
  const signD = dot(sub(d, a), n);
  return signOrigin * signD < 0;
}

/**
 * Closest point to the origin on the tetrahedron `w[0..3]`, or the origin itself when it is
 * contained — which is GJK's *"the two bodies overlap"* verdict.
 */
function nearestOnTetrahedron(w: readonly Vec3[]): Nearest {
  const a = at(w, 0);
  const b = at(w, 1);
  const c = at(w, 2);
  const d = at(w, 3);
  const vol6 = dot(cross(sub(b, a), sub(c, a)), sub(d, a));
  const faces: readonly (readonly number[])[] = [
    [0, 1, 2, 3],
    [0, 2, 3, 1],
    [0, 3, 1, 2],
    [1, 3, 2, 0],
  ];

  // ⛔⛔ A FLAT TETRAHEDRON HAS NO INSIDE, and the plane test cannot say so: with `d` ON plane
  // `abc` the product below is zero, which reads as *not outside* — i.e. as CONTAINMENT, the
  // one answer a flat simplex can never justify. ⚠ It is reachable in earnest: four support
  // points of two boxes meeting face to face are routinely coplanar. ⭐ So degeneracy is
  // decided FIRST, by volume, and falls through to the faces.
  const degenerate = Math.abs(vol6) <= 1e-18;

  let best: Nearest | null = null;
  let bestLen = Infinity;
  let anyOutside = false;
  for (const f of faces) {
    const i = f[0] ?? 0;
    const j = f[1] ?? 0;
    const k = f[2] ?? 0;
    const other = f[3] ?? 0;
    if (!degenerate && !originOutsidePlane(at(w, i), at(w, j), at(w, k), at(w, other))) continue;
    anyOutside = true;
    const n = nearestOnTriangle([at(w, i), at(w, j), at(w, k)]);
    const l = length(n.point);
    if (l < bestLen) {
      bestLen = l;
      best = { point: n.point, keep: n.keep.map((x) => f[x] ?? 0) };
    }
  }
  // ⭐ Outside no face ⇒ the origin is inside the tetrahedron ⇒ the bodies intersect.
  if (!anyOutside) return { point: [0, 0, 0], keep: [0, 1, 2, 3] };
  // ⛔ FACES WERE OUTSIDE AND YET NOTHING WON — reachable only if every candidate length came
  // back NaN. ⚠ Folding this into the line above (as `!anyOutside || best === null`) is what it
  // used to say, and that reports CONTAINMENT — a gap of 0, which captures from any distance —
  // for a body whose coordinates have gone bad. ⭐ Retreat to a vertex instead: wrong by a
  // bounded amount rather than wrong in the direction that fires an irreversible move.
  if (best === null) return { point: at(w, 0), keep: [0] };
  return best;
}

/**
 * ⭐⭐ **EXPORTED FOR ITS OWN VECTORS, AND THE REASON IS MEASURED.** Three mutations inside
 * these routines — dropping the segment's far-vertex clamp, dropping a triangle's vertex
 * region, and dropping the collinear fallback — left the whole `gapBetween` suite green,
 * because GJK's next iteration repairs a wrong intermediate answer often enough that the
 * *composed* result stays right. ⛔ That is a correct piece of arithmetic being defended by
 * nothing, one edit away from a failure that appears only on the geometry nobody tested.
 * ⚠ `METHOD`: a composition is a thing to measure — and so are its parts, separately, when
 * the composition is self-correcting.
 */
export function nearestOnSimplex(w: readonly Vec3[]): Nearest {
  if (w.length === 1) return { point: at(w, 0), keep: [0] };
  if (w.length === 2) return nearestOnSegment(w);
  if (w.length === 3) return nearestOnTriangle(w);
  return nearestOnTetrahedron(w);
}

/**
 * ⚠ Iteration cap. ⛔ Not a tuning number — it is a **termination guarantee**. GJK converges in
 * a handful of steps for real geometry, and the cap exists so that a pathological cloud cannot
 * spin inside a render loop. ⭐ Freezing the glass with no error is the worst failure this
 * project can ship (`A18` made the same argument for the cascade's cap).
 */
const MAX_ITERATIONS = 64;

/**
 * ⭐⭐⭐ **THE GAP BETWEEN TWO CONVEX POINT SETS, IN THE SAME UNITS AS THE POINTS** — `0` when
 * they touch or overlap, `null` when either is empty.
 *
 * ⛔ GJK on the Minkowski difference: the distance between two convex sets is the distance from
 * the ORIGIN to `A ⊖ B`, and each iteration replaces the current best simplex with one carrying
 * a point further along the direction of the origin.
 *
 * ⭐ Both clouds must already be in the **same frame** — `proximity.ts` transforms them to
 * world before calling. ⚠ Doing it here would mean this file knowing about placements, and it
 * is deliberately ignorant of everything but points.
 */
export function gapBetween(a: readonly Vec3[], b: readonly Vec3[]): number | null {
  if (a.length === 0 || b.length === 0) return null;

  const diffSupport = (dir: Vec3): Vec3 =>
    sub(supportPoint(a, dir), supportPoint(b, scale(dir, -1)));

  // ⚠ Any starting direction works; a poor one costs an iteration, never an answer.
  let v = diffSupport([1, 0, 0]);
  if (length(v) === 0) return 0;
  let simplex: Vec3[] = [v];

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const w = diffSupport(scale(v, -1));
    const vv = dot(v, v);
    // ⭐⭐ THE TERMINATION TEST IS RELATIVE, NOT ABSOLUTE. `vv - dot(v, w)` is how much closer
    // to the origin the new point could possibly bring us; comparing it against a fixed epsilon
    // would terminate early at large scales and never at small ones — and this project works in
    // metres, where a 1 mm gap is 0.001.
    if (vv - dot(v, w) <= 1e-12 * vv) break;

    simplex.push(w);
    const near = nearestOnSimplex(simplex);
    // ⛔ The origin lies on the simplex ⇒ the difference set contains it ⇒ the bodies overlap.
    // ⚠ A `near.keep.length === 4` shortcut stood here and was DELETED: the tetrahedron routine
    // returns four kept points only from its containment branch, where the point is already the
    // origin, so the line above had always fired first. ⛔ Proven redundant rather than assumed
    // — no mutation of it could redden a single vector, which is the signature of dead code.
    simplex = near.keep.map((i) => at(simplex, i));
    v = near.point;
  }
  return length(v);
}

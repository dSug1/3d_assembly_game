/**
 * ⭐⭐⭐ THE CALM — the piece and the camera near square to a face in its middle, turning over an edge — ⭐⭐⭐ (2026-11-05, `TILTED_ORBIT_REBUILD_SCOPE.md`
 * §21.6 F5, the owner: *"do all"*) A FUNCTION OF THE PLACE: a field over the faces contour.
 *
 * Each facet's normal weighted by the place's distance to its polygon (`calmWeight`: 1 on it, falling by a smoothstep to 0 over its edge zone), summed —
 * a face's normal in its middle, the two normals' bisector on an edge, a corner's normals summed: the SAME from every side, so continuous wherever the place
 * is, whatever face it is on, whatever frame the orbit reads it in. ⭐ A CAP (a top, a bottom) wins its zone (F3, the camera square to a cap): the walls'
 * weights scaled by `1 − K` of the caps' — the cap's normal on the cap and at its edges, turning to the wall's over the zone below. The orbit's own direction
 * `u` mixed in by the INTERIOR SHARES (58d86ff's calm: a quarter of the orbit's angle shown in a face's middle — the sliders), a cap's share 0.
 *
 * ⛔ The calm's SHARES as a state about the current face's normal (58d86ff's `shownDir`, ported 2026-11-04; F3's `capEdgeEnd` / `edgeShareTo`): a share
 * multiplies the orbit's angle, and at a corner the face changed to has none to multiply — the direction jumped (up to 3.3 m far out, §21.6); their eases,
 * `sharesShowing` (re-expressed at a turn), the pole fade — DELETED.
 * ⛔ No engine import (`tests/boundary.test.ts`). Distances to convex polygons, smoothsteps — textbook.
 */
import { cross, dot, normalize, type Vec3 } from "../core/vec";

const HALF_PI = Math.PI / 2;

/** ⭐ A facet of the contour as the field reads it: its outward normal (unit), its convex polygon (on its plane), a cap or a wall. */
export interface CalmFacet {
  readonly n: Vec3;
  readonly poly: readonly Vec3[];
  readonly cap: boolean;
}

/** ⭐ The field's knobs: the interior shares of the orbit's angle (dx's, dy's) on a wall; the edge zones (m) of a wall's and a cap's influence. */
export interface CalmOpts {
  readonly shareH: number;
  readonly shareV: number;
  readonly zoneH: number;
  readonly zoneV: number;
}

/** ⭐ The distance from `p` to a convex polygon `poly` (normal `n`): to its plane when `p` projects inside it, else to its nearest edge. */
export function polyDistance(p: Vec3, poly: readonly Vec3[], n: Vec3): number {
  if (poly.length === 0) return Infinity;
  const h = dot([p[0] - poly[0]![0], p[1] - poly[0]![1], p[2] - poly[0]![2]], n);
  const q: Vec3 = [p[0] - h * n[0], p[1] - h * n[1], p[2] - h * n[2]];
  let inside = poly.length >= 3;
  let sgn = 0;
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    const e: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const aq: Vec3 = [q[0] - a[0], q[1] - a[1], q[2] - a[2]];
    const s = dot(cross(e, aq), n);
    if (s !== 0) {
      if (sgn === 0) sgn = Math.sign(s);
      else if (Math.sign(s) !== sgn) inside = false;
    }
    const ee = dot(e, e);
    const t = ee > 0 ? Math.min(1, Math.max(0, dot([p[0] - a[0], p[1] - a[1], p[2] - a[2]], e) / ee)) : 0;
    best = Math.min(best, Math.hypot(p[0] - a[0] - t * e[0], p[1] - a[1] - t * e[1], p[2] - a[2] - t * e[2]));
  }
  return inside ? Math.abs(h) : best;
}

/** ⭐ A facet's weight at the distance `d` from it, over its edge zone `zone`: 1 on it, a smoothstep down to 0 at the zone's end (none: on it only). */
export function calmWeight(d: number, zone: number): number {
  if (!(zone > 0)) return d <= 1e-9 ? 1 : 0;
  const x = Math.min(1, Math.max(0, d / zone));
  return 1 - x * x * (3 - 2 * x);
}

/**
 * ⭐⭐⭐ THE PIECE'S DIRECTION at the place `p` on the contour (`facets`), for the orbit's direction `u` (unit; both in one space — `up` the world's vertical
 * there): the field's normal `N` (the walls' weights scaled by the caps' complement), the orbit's angle off it shown at the weighted interior shares (a cap
 * 0) — its heading across `N` (dx's) and its elevation (dy's), each × its share, within ±90°. Unit.
 */
export function calmDir(p: Vec3, facets: readonly CalmFacet[], u: Vec3, up: Vec3, o: CalmOpts): Vec3 {
  const w = facets.map((f) => calmWeight(polyDistance(p, f.poly, f.n), f.cap ? o.zoneV : o.zoneH));
  let free = 1;
  facets.forEach((f, i) => {
    if (f.cap) free *= 1 - w[i]!;
  });
  let sum: [number, number, number] = [0, 0, 0];
  let kH = 0;
  let kV = 0;
  let total = 0;
  facets.forEach((f, i) => {
    const wi = f.cap ? w[i]! : w[i]! * free;
    if (!(wi > 0)) return;
    sum = [sum[0] + wi * f.n[0], sum[1] + wi * f.n[1], sum[2] + wi * f.n[2]];
    if (!f.cap) {
      kH += wi * o.shareH;
      kV += wi * o.shareV;
    }
    total += wi;
  });
  const N = normalize(sum);
  if (N === null || !(total > 0)) return u;
  kH /= total;
  kV /= total;
  const h = normalize(cross(up, N));
  if (h === null) return N;
  const v = cross(N, h);
  // ⭐ the orbit's angles off `N` (58d86ff's: its heading across, its elevation up) shown at the shares — ⛔ mixed as vectors: with `u` square to `N` (the
  // field turned to a cap, the orbit level) the normal part vanished and the shares' few millionths were normalised to 45° (vectored)
  const a = Math.atan2(dot(u, h), dot(u, N));
  const b = Math.asin(Math.max(-1, Math.min(1, dot(u, v))));
  const a1 = Math.max(-HALF_PI, Math.min(HALF_PI, a * kH));
  const b1 = Math.max(-HALF_PI, Math.min(HALF_PI, b * kV));
  const cb = Math.cos(b1);
  const ca = cb * Math.cos(a1);
  const sa = cb * Math.sin(a1);
  const sb = Math.sin(b1);
  return [N[0] * ca + h[0] * sa + v[0] * sb, N[1] * ca + h[1] * sa + v[1] * sb, N[2] * ca + h[2] * sa + v[2] * sb];
}

/** ⭐ An edge zone (m): `pct` % of the run, at least `minM`. */
export function calmZone(runM: number, pct: number, minM: number): number {
  return Math.max((Math.max(0, pct) / 100) * Math.max(0, runM), Math.max(0, minM));
}

/**
 * ⭐⭐⭐ **A POINT ON A FACE'S SURFACE, UNDER A RAY, BOUNDED BY ITS EDGES** — what the
 * PioneerFaceCursor rides on (the owner, 2026-09-25: *"translate the PioneerFaceCursor on top of
 * the PioneerFace surface … it cannot exit an edge of the surface. Also, if the surface is not
 * flat, the pioneerFaceCursor position shall follow the surface so it is always sitting on the
 * surface of the PioneerFace."*).
 *
 * ## ⭐⭐ READ OFF THE FACE'S OWN TRIANGLES, NEVER ITS PLANE
 *
 * A face's centre and normal describe a PLANE, and a cursor moved in that plane would float off a
 * curved face and sail past a notch. ⭐ So the answer is always a point ON one of the face's
 * triangles, in two steps:
 *
 * 1. ⭐ **The ray hits the face** → the nearest hit, from either side. On a curved face that is the
 *    surface point under the finger, which is what *"follow the surface"* means.
 * 2. ⛔ **The ray misses** (the finger is past an edge) → the ray meets the plane through the
 *    cursor's current point, and that point is pulled back to the NEAREST point of the triangle
 *    set. ⭐ On a flat face that is exactly *clamped to the edge*; on a curved one it is the
 *    nearest point of the surface — so the cursor slides along the rim instead of stopping dead.
 *
 * ⚠ `null` only when the ray is parallel to that plane and misses: the caller keeps the cursor
 * where it is, rather than being handed a point from nowhere.
 *
 * ⛔ ENGINE-FREE, and every quantity in the owning body's LOCAL frame.
 */
import { add, cross, dot, scale, sub, type Vec3 } from "./vec";

const EPS = 1e-12;

/** ⭐ Möller–Trumbore, TWO-SIDED: a face may be dragged on from behind. `t ≥ 0` or `null`. */
export function rayTriangle(
  o: Vec3,
  d: Vec3,
  a: Vec3,
  b: Vec3,
  c: Vec3,
): number | null {
  const e1 = sub(b, a);
  const e2 = sub(c, a);
  const p = cross(d, e2);
  const det = dot(e1, p);
  if (Math.abs(det) < EPS) return null;
  const inv = 1 / det;
  const s = sub(o, a);
  const u = dot(s, p) * inv;
  if (u < 0 || u > 1) return null;
  const q = cross(s, e1);
  const v = dot(d, q) * inv;
  if (v < 0 || u + v > 1) return null;
  const t = dot(e2, q) * inv;
  return t >= 0 ? t : null;
}

/** ⭐ Ericson's closest point on a triangle — its interior, an edge or a vertex. */
export function closestPointOnTriangle(
  p: Vec3,
  a: Vec3,
  b: Vec3,
  c: Vec3,
): Vec3 {
  const ab = sub(b, a);
  const ac = sub(c, a);
  const ap = sub(p, a);
  const d1 = dot(ab, ap);
  const d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return a;
  const bp = sub(p, b);
  const d3 = dot(ab, bp);
  const d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return b;
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) return add(a, scale(ab, d1 / (d1 - d3)));
  const cp = sub(p, c);
  const d5 = dot(ab, cp);
  const d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return c;
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) return add(a, scale(ac, d2 / (d2 - d6)));
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0)
    return add(b, scale(sub(c, b), (d4 - d3) / (d4 - d3 + (d5 - d6))));
  const denom = 1 / (va + vb + vc);
  return add(a, add(scale(ab, vb * denom), scale(ac, vc * denom)));
}

/** ⭐ The nearest point of a triangle SET to `p`. ⚠ `null` only for an empty set. */
export function closestPointOnFace(
  p: Vec3,
  positions: readonly Vec3[],
  triangles: readonly number[],
): Vec3 | null {
  let best: Vec3 | null = null;
  let bestD = Infinity;
  for (let i = 0; i + 2 < triangles.length; i += 3) {
    const q = closestPointOnTriangle(
      p,
      positions[triangles[i] as number] as Vec3,
      positions[triangles[i + 1] as number] as Vec3,
      positions[triangles[i + 2] as number] as Vec3,
    );
    const r = sub(q, p);
    const d = dot(r, r);
    if (d < bestD) {
      bestD = d;
      best = q;
    }
  }
  return best;
}

/**
 * ⭐⭐⭐ Where a cursor dragged along the ray `o + t·d` sits on the face. See the header.
 * `planePoint` is the cursor's CURRENT point and `planeNormal` the face normal: the plane is used
 * only when the ray misses the surface.
 */
export function pointOnFace(
  o: Vec3,
  d: Vec3,
  positions: readonly Vec3[],
  triangles: readonly number[],
  planePoint: Vec3,
  planeNormal: Vec3,
): Vec3 | null {
  let bestT = Infinity;
  for (let i = 0; i + 2 < triangles.length; i += 3) {
    const t = rayTriangle(
      o,
      d,
      positions[triangles[i] as number] as Vec3,
      positions[triangles[i + 1] as number] as Vec3,
      positions[triangles[i + 2] as number] as Vec3,
    );
    if (t !== null && t < bestT) bestT = t;
  }
  if (bestT < Infinity) return add(o, scale(d, bestT));
  const den = dot(d, planeNormal);
  if (Math.abs(den) < EPS) return null;
  const t = dot(sub(planePoint, o), planeNormal) / den;
  return closestPointOnFace(add(o, scale(d, t)), positions, triangles);
}

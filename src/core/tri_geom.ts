/**
 * ⭐ (2026-11-23, S6 — moved from `part_checks.ts` so that the voxels (`voxels.ts`) and the part checks share them without importing each other) the
 * triangle primitives: the closest point on a triangle, the distance to it, and a uniform grid of triangles (nearest, cast along a line, any within a
 * tolerance). Pure, engine-free, in the caller's units (mm for the part checks).
 */
import { cross, dot, sub, type Vec3 } from "./vec";

/** the point of the triangle (a, b, c) closest to `p` — Ericson, Real-Time Collision Detection §5.1.5 */
export function closestOnTriangle(p: Vec3, a: Vec3, b: Vec3, c: Vec3): Vec3 {
  const ab = sub(b, a), ac = sub(c, a), ap = sub(p, a);
  const d1 = dot(ab, ap), d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return a;
  const bp = sub(p, b), d3 = dot(ab, bp), d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return b;
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); return [a[0] + ab[0] * v, a[1] + ab[1] * v, a[2] + ab[2] * v]; }
  const cp = sub(p, c), d5 = dot(ab, cp), d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return c;
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); return [a[0] + ac[0] * w, a[1] + ac[1] * w, a[2] + ac[2] * w]; }
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
    const w = (d4 - d3) / (d4 - d3 + (d5 - d6));
    return [b[0] + (c[0] - b[0]) * w, b[1] + (c[1] - b[1]) * w, b[2] + (c[2] - b[2]) * w];
  }
  const den = 1 / (va + vb + vc), v = vb * den, w = vc * den;
  return [a[0] + ab[0] * v + ac[0] * w, a[1] + ab[1] * v + ac[1] * w, a[2] + ab[2] * v + ac[2] * w];
}
/** the distance from `p` to the triangle (a, b, c) */
export function pointTriangle(p: Vec3, a: Vec3, b: Vec3, c: Vec3): number {
  const q = closestOnTriangle(p, a, b, c);
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}
/** a uniform grid of triangles for nearest-point queries (cell `c` mm) */
export function triGrid(tris: readonly (readonly [Vec3, Vec3, Vec3])[], c: number) {
  const cells = new Map<string, number[]>();
  const key = (i: number, j: number, k: number) => `${i},${j},${k}`;
  tris.forEach(([a, b, d], t) => {
    const lo = [0, 1, 2].map((x) => Math.floor(Math.min(a[x]!, b[x]!, d[x]!) / c)), hi = [0, 1, 2].map((x) => Math.floor(Math.max(a[x]!, b[x]!, d[x]!) / c));
    for (let i = lo[0]!; i <= hi[0]!; i++) for (let j = lo[1]!; j <= hi[1]!; j++) for (let k = lo[2]!; k <= hi[2]!; k++) {
      const kk = key(i, j, k);
      const l = cells.get(kk);
      if (l === undefined) cells.set(kk, [t]);
      else l.push(t);
    }
  });
  /** ⭐ the triangle the LINE through `p` along `n` meets nearest to `p` within `r` mm (either side; Möller – Trumbore): its index and |t| */
  const cast = (p: Vec3, n: Vec3, r: number): { readonly t: number; readonly d: number } | null => {
    let best: { t: number; d: number } | null = null;
    const lo = p.map((x) => Math.floor((x - r) / c)), hi = p.map((x) => Math.floor((x + r) / c));
    const seen = new Set<number>();
    for (let i = lo[0]!; i <= hi[0]!; i++) for (let j = lo[1]!; j <= hi[1]!; j++) for (let k = lo[2]!; k <= hi[2]!; k++) {
      for (const t of cells.get(key(i, j, k)) ?? []) {
        if (seen.has(t)) continue;
        seen.add(t);
        const [a, b, d] = tris[t]!;
        const e1 = sub(b, a), e2 = sub(d, a), h = cross(n, e2), det = dot(e1, h);
        if (Math.abs(det) < 1e-12) continue;
        const sv = sub(p, a), u = dot(sv, h) / det;
        if (u < -1e-9 || u > 1 + 1e-9) continue;
        const q = cross(sv, e1), v = dot(n, q) / det;
        if (v < -1e-9 || u + v > 1 + 1e-9) continue;
        const tt = Math.abs(dot(e2, q) / det);
        if (tt <= r && (best === null || tt < best.d)) best = { t, d: tt };
      }
    }
    return best;
  };
  /** the nearest triangle to `p` within `r` mm (its index and distance), or none */
  const nearest = (p: Vec3, r: number): { readonly t: number; readonly d: number } | null => {
    let best: { t: number; d: number } | null = null;
    const lo = p.map((x) => Math.floor((x - r) / c)), hi = p.map((x) => Math.floor((x + r) / c));
    const seen = new Set<number>();
    for (let i = lo[0]!; i <= hi[0]!; i++) for (let j = lo[1]!; j <= hi[1]!; j++) for (let k = lo[2]!; k <= hi[2]!; k++) {
      for (const t of cells.get(key(i, j, k)) ?? []) {
        if (seen.has(t)) continue;
        seen.add(t);
        const [a, b, d] = tris[t]!;
        const dd = pointTriangle(p, a, b, d);
        if (dd <= r && (best === null || dd < best.d)) best = { t, d: dd };
      }
    }
    return best;
  };
  /** ⭐ (S6 packet 2) is there a triangle within `r` mm of `p` that `ok` accepts at its distance? (a face judged by its own tolerance, not only the nearest) */
  const some = (p: Vec3, r: number, ok: (t: number, d: number) => boolean): boolean => {
    const lo = p.map((x) => Math.floor((x - r) / c)), hi = p.map((x) => Math.floor((x + r) / c));
    const seen = new Set<number>();
    for (let i = lo[0]!; i <= hi[0]!; i++) for (let j = lo[1]!; j <= hi[1]!; j++) for (let k = lo[2]!; k <= hi[2]!; k++) {
      for (const t of cells.get(key(i, j, k)) ?? []) {
        if (seen.has(t)) continue;
        seen.add(t);
        const [a, b, d] = tris[t]!;
        const dd = pointTriangle(p, a, b, d);
        if (dd <= r && ok(t, dd)) return true;
      }
    }
    return false;
  };
  return { cast, nearest, some };
}

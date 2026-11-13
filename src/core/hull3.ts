/**
 * ⭐ **THE 3D CONVEX HULL of a point set** (2026-11-13 — a part's resting faces for the boot heaps: a rigid part lies on its HULL, whatever its
 * hollows). Incremental, O(n²) — a part's collision pieces give a few hundred points. Engine-free.
 * Returns the hull's vertices and its triangles, wound OUTWARD (counter-clockwise seen from outside). Coplanar points on a face are dropped
 * (`eps` of the set's size); a degenerate set (fewer than 4 points not in one plane) gives `null`.
 */
import { cross, dot, length, sub, type Vec3 } from "./vec";

export interface Hull {
  readonly points: readonly Vec3[];
  readonly triangles: readonly (readonly [number, number, number])[];
}

export function convexHull3(input: readonly Vec3[], epsShare = 1e-10, joggleShare = 1e-5): Hull | null {
  // the unique points
  const pts: Vec3[] = [];
  const seen = new Set<string>();
  for (const p of input) {
    const k = `${p[0].toFixed(6)},${p[1].toFixed(6)},${p[2].toFixed(6)}`;
    if (!seen.has(k)) (seen.add(k), pts.push(p));
  }
  if (pts.length < 4) return null;
  let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const p of pts) for (let i = 0; i < 3; i++) (lo[i] = Math.min(lo[i]!, p[i]!), hi[i] = Math.max(hi[i]!, p[i]!));
  const size = Math.hypot(hi[0]! - lo[0]!, hi[1]! - lo[1]!, hi[2]! - lo[2]!);
  const eps = Math.max(1e-15, size * epsShare);
  // ⭐⭐ JOGGLED (qhull's `QJ`): each point nudged by a deterministic ~1e-5 of the set's size, so no four lie in one plane. ⛔ Without it, the
  // valves' and exhausts' round pieces (many coplanar points in float32) left faces both visible and not: a non-manifold hull of 20,000
  // triangles for 271 points (`restingFaces` then 7 s on one part). The returned points are the ORIGINAL ones.
  // ⛔ a FLAT set has no hull: judged on the ORIGINAL points, before the nudge (which would lift it off its plane)
  {
    const tol = size * 1e-7;
    let i0 = 0, i1 = 0;
    for (let i = 1; i < pts.length; i++) if (length(sub(pts[i]!, pts[0]!)) > length(sub(pts[i1]!, pts[0]!))) i1 = i;
    const u = sub(pts[i1]!, pts[i0]!);
    let i2 = -1, far = tol * length(u);
    for (let i = 0; i < pts.length; i++) {
      const d = length(cross(u, sub(pts[i]!, pts[i0]!)));
      if (d > far) (far = d, i2 = i);
    }
    if (i2 < 0) return null;
    const nn = cross(u, sub(pts[i2]!, pts[i0]!));
    if (!pts.some((p) => Math.abs(dot(nn, sub(p, pts[i0]!))) > tol * length(nn))) return null;
  }
  let js = 12345;
  const jr = () => ((js = (js * 16807) % 2147483647) / 2147483647 - 0.5) * 2 * size * joggleShare;
  const orig = pts.slice();
  for (let i = 0; i < pts.length; i++) pts[i] = [pts[i]![0] + jr(), pts[i]![1] + jr(), pts[i]![2] + jr()];

  // an initial tetrahedron: two far points, the farthest from their line, the farthest from their plane
  let a = 0, b = 0;
  for (let i = 1; i < pts.length; i++) if (pts[i]![0] < pts[a]![0]) a = i;
  for (let i = 0; i < pts.length; i++) if (length(sub(pts[i]!, pts[a]!)) > length(sub(pts[b]!, pts[a]!))) b = i;
  const ab = sub(pts[b]!, pts[a]!);
  let c = -1, best = eps;
  for (let i = 0; i < pts.length; i++) {
    const d = length(cross(ab, sub(pts[i]!, pts[a]!)));
    if (d > best) (best = d, c = i);
  }
  if (c < 0) return null;
  const n0 = cross(ab, sub(pts[c]!, pts[a]!));
  let d = -1;
  best = eps * length(n0);
  for (let i = 0; i < pts.length; i++) {
    const v = Math.abs(dot(n0, sub(pts[i]!, pts[a]!)));
    if (v > best) (best = v, d = i);
  }
  if (d < 0) return null;

  type Face = { v: [number, number, number]; n: Vec3; off: number; alive: boolean };
  const faces: Face[] = [];
  const make = (i: number, j: number, k: number): Face => {
    const n = cross(sub(pts[j]!, pts[i]!), sub(pts[k]!, pts[i]!));
    const l = length(n);
    const nn: Vec3 = l > 0 ? [n[0] / l, n[1] / l, n[2] / l] : [0, 0, 0];
    return { v: [i, j, k], n: nn, off: dot(nn, pts[i]!), alive: true };
  };
  const centroid: Vec3 = [0, 1, 2].map((t) => (pts[a]![t]! + pts[b]![t]! + pts[c]![t]! + pts[d]![t]!) / 4) as unknown as Vec3;
  const add = (i: number, j: number, k: number): void => {
    let f = make(i, j, k);
    if (dot(f.n, centroid) - f.off > 0) f = make(i, k, j); // outward: the interior point behind it
    faces.push(f);
  };
  add(a, b, c);
  add(a, b, d);
  add(a, c, d);
  add(b, c, d);

  for (let p = 0; p < pts.length; p++) {
    if (p === a || p === b || p === c || p === d) continue;
    const q = pts[p]!;
    const visible = faces.filter((f) => f.alive && dot(f.n, q) - f.off > eps);
    if (visible.length === 0) continue;
    // the horizon: edges of visible faces not shared with another visible face
    const edges = new Map<string, [number, number]>();
    for (const f of visible) {
      f.alive = false;
      for (let e = 0; e < 3; e++) {
        const u = f.v[e]!, w = f.v[(e + 1) % 3]!;
        const rev = `${w},${u}`;
        if (edges.has(rev)) edges.delete(rev);
        else edges.set(`${u},${w}`, [u, w]);
      }
    }
    for (const [u, w] of edges.values()) {
      const f = make(u, w, p); // keeps the visible faces' winding: outward
      faces.push(f);
    }
  }
  const alive = faces.filter((f) => f.alive && length(f.n) > 0);
  const used = [...new Set(alive.flatMap((f) => f.v))];
  const index = new Map(used.map((v, i) => [v, i]));
  return { points: used.map((v) => orig[v]!), triangles: alive.map((f) => [index.get(f.v[0])!, index.get(f.v[1])!, index.get(f.v[2])!] as const) };
}

// THE SURFACE STUDY — geometry (ORBIT_SURFACE.md, 2026-11-16, the owner: "elaborate some basic geometries or topologies with surface singularities").
// Placed PARTS as convex polytopes in MILLIMETRES (the face map is fed metres at its boundary, `readings.ts`): boxes (exact, a fast path) and convex
// hulls of points (prisms, wedges). An exact ray cast, an exact "levels of a part inside a piece's prism" (the first contact of a translating box),
// a point-in-part test, a voxel flood of the outside (S22, exposed = reachable from outside). Engine-free, no import of the game but the hull.
import { convexHull3 } from "../../../src/core/hull3";

export type V = [number, number, number];
export const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
export const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const mul = (a: V, k: number): V => [a[0] * k, a[1] * k, a[2] * k];
export const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a: V): number => Math.hypot(a[0], a[1], a[2]);
export const unit = (a: V): V => { const l = len(a); return l > 1e-15 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 1, 0]; };

export interface Plane { n: V; e: number }
export interface PFace { n: V; e: number; tris: [V, V, V][] }
export interface Part {
  id: string;
  lo: V; hi: V; // the AABB
  isBox: boolean;
  planes: Plane[]; // n·x ≤ e inside
  verts: V[];
  edges: [V, V][];
  faces: PFace[];
}

export function boxPart(id: string, lo: V, hi: V): Part {
  const [x0, y0, z0] = lo, [x1, y1, z1] = hi;
  const P = (x: number, y: number, z: number): V => [x, y, z];
  const verts: V[] = [];
  for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) verts.push(P(x, y, z));
  const q = (a: V, b: V, c: V, d: V): [V, V, V][] => [[a, b, c], [a, c, d]];
  const faces: PFace[] = [
    { n: [1, 0, 0], e: x1, tris: q(P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)) },
    { n: [-1, 0, 0], e: -x0, tris: q(P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0)) },
    { n: [0, 1, 0], e: y1, tris: q(P(x0, y1, z0), P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0)) },
    { n: [0, -1, 0], e: -y0, tris: q(P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1)) },
    { n: [0, 0, 1], e: z1, tris: q(P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)) },
    { n: [0, 0, -1], e: -z0, tris: q(P(x0, y0, z0), P(x0, y1, z0), P(x1, y1, z0), P(x1, y0, z0)) },
  ];
  const edges: [V, V][] = [];
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {
    const d = sub(verts[j]!, verts[i]!);
    if ([0, 1, 2].filter((k) => Math.abs(d[k]!) > 0).length === 1) edges.push([verts[i]!, verts[j]!]);
  }
  return { id, lo: [x0, y0, z0], hi: [x1, y1, z1], isBox: true, planes: faces.map((f) => ({ n: f.n, e: f.e })), verts, edges, faces };
}

/** a convex part from points (their hull); the faces grouped by plane */
export function hullPart(id: string, pts: V[]): Part {
  const h = convexHull3(pts);
  if (h === null) throw new Error(`hullPart ${id}: degenerate`);
  const faces: PFace[] = [];
  const edgeSet = new Map<string, [V, V]>();
  const key = (v: V) => v.map((x) => x.toFixed(4)).join(",");
  for (const [a, b, c] of h.triangles) {
    const A = h.points[a]! as V, B = h.points[b]! as V, C = h.points[c]! as V;
    const n = unit(cross(sub(B, A), sub(C, A)));
    const e = dot(n, A);
    let f = faces.find((g) => dot(g.n, n) > 1 - 1e-9 && Math.abs(g.e - e) < 1e-6);
    if (f === undefined) { f = { n, e, tris: [] }; faces.push(f); }
    f.tris.push([A, B, C]);
    for (const [p, q] of [[A, B], [B, C], [C, A]] as [V, V][]) { const k = [key(p), key(q)].sort().join("|"); if (!edgeSet.has(k)) edgeSet.set(k, [p, q]); }
  }
  const verts = h.points.map((p) => [p[0], p[1], p[2]] as V);
  const lo: V = [0, 1, 2].map((k) => Math.min(...verts.map((v) => v[k]!))) as V;
  const hi: V = [0, 1, 2].map((k) => Math.max(...verts.map((v) => v[k]!))) as V;
  return { id, lo, hi, isBox: false, planes: faces.map((f) => ({ n: f.n, e: f.e })), verts, edges: [...edgeSet.values()], faces };
}
/** a prism: a convex polygon in (x, y), extruded along z from z0 to z1 */
export const prismZ = (id: string, poly: [number, number][], z0: number, z1: number): Part =>
  hullPart(id, poly.flatMap(([x, y]): V[] => [[x, y, z0], [x, y, z1]]));
/** a prism: a convex polygon in (z, y), extruded along x */
export const prismX = (id: string, poly: [number, number][], x0: number, x1: number): Part =>
  hullPart(id, poly.flatMap(([z, y]): V[] => [[x0, y, z], [x1, y, z]]));

/** a part moved: turned by R (a 3×3 row-major) then shifted by T; a box stays a box when R is a quarter turn about an axis */
export function movePart(p: Part, R: number[], T: V, id = p.id): Part {
  const f = (v: V): V => [R[0]! * v[0] + R[1]! * v[1] + R[2]! * v[2] + T[0], R[3]! * v[0] + R[4]! * v[1] + R[5]! * v[2] + T[1], R[6]! * v[0] + R[7]! * v[1] + R[8]! * v[2] + T[2]];
  if (p.isBox) {
    const a = f(p.lo), b = f(p.hi);
    return boxPart(id, [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2])], [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2])]);
  }
  return hullPart(id, p.verts.map(f));
}

/** the first hit of the ray o + t·d (t ≥ 0) on a convex part: its t and the face's normal; null: none */
export function rayPart(p: Part, o: V, d: V): { t: number; n: V } | null {
  let tin = -Infinity, tout = Infinity, nin: V = [0, 0, 0];
  for (const pl of p.planes) {
    const den = dot(pl.n, d), dist = pl.e - dot(pl.n, o);
    if (Math.abs(den) < 1e-12) { if (dist < 0) return null; continue; }
    const t = dist / den;
    if (den < 0) { if (t > tin) { tin = t; nin = pl.n; } } else if (t < tout) tout = t;
    if (tin > tout) return null;
  }
  if (tin === -Infinity || tin < 0) return null; // started inside: not a hit from outside
  return { t: tin, n: nin };
}
/** the first hit among the parts */
export function castRay(parts: readonly Part[], o: V, d: V, maxT = Infinity): { t: number; n: V; part: string } | null {
  let best: { t: number; n: V; part: string } | null = null;
  for (const p of parts) {
    const h = rayPart(p, o, d);
    if (h !== null && h.t <= maxT && (best === null || h.t < best.t)) best = { ...h, part: p.id };
  }
  return best;
}

export const inside = (p: Part, x: V, margin = 0): boolean => p.planes.every((pl) => dot(pl.n, x) - pl.e < -margin);

/**
 * THE LEVELS of a part inside the OPEN prism of a piece's footprint: the rectangle (L ± a along t, s ± c along b), the prism along n — the lowest and the
 * highest n·x of the part there; null: the part is not over the footprint (touching outlines do not overlap). Exact: on a box from its intervals; on a
 * convex part from the vertices of (part ∩ prism) — the part's vertices inside, its edges through the prism's sides, the prism's corner lines through it.
 */
const OPEN = 1e-4; // mm: the footprint shrunk by this — "touching is not over"
export function prismLevels(p: Part, n: V, t: V, b: V, L: number, s: number, a: number, c: number): [number, number] | null {
  const a2 = a - OPEN, c2 = c - OPEN;
  if (p.isBox) {
    const iv = (u: V): [number, number] => { let lo = 0, hi = 0; for (let k = 0; k < 3; k++) { const x0 = p.lo[k]! * u[k]!, x1 = p.hi[k]! * u[k]!; lo += Math.min(x0, x1); hi += Math.max(x0, x1); } return [lo, hi]; };
    const T = iv(t), B = iv(b);
    if (Math.min(T[1], L + a2) - Math.max(T[0], L - a2) <= 0) return null;
    if (Math.min(B[1], s + c2) - Math.max(B[0], s - c2) <= 0) return null;
    // a box in the facet's frame: exact only when n, t, b are axes (the study's facets on boxes are); else the general path
    if ([n, t, b].every((u) => Math.abs(Math.abs(u[0]) + Math.abs(u[1]) + Math.abs(u[2]) - 1) < 1e-9)) return iv(n);
  }
  let lo = Infinity, hi = -Infinity;
  const take = (x: V) => { const h = dot(n, x); if (h < lo) lo = h; if (h > hi) hi = h; };
  const inRect = (x: V) => Math.abs(dot(t, x) - L) <= a2 + 1e-9 && Math.abs(dot(b, x) - s) <= c2 + 1e-9;
  for (const v of p.verts) if (inRect(v)) take(v);
  for (const [P, Q] of p.edges) {
    const d = sub(Q, P);
    for (const [ax, ctr, half, other, oc, oh] of [[t, L, a2, b, s, c2], [b, s, c2, t, L, a2]] as [V, number, number, V, number, number][]) for (const sg of [-1, 1]) {
      const den = dot(ax, d);
      if (Math.abs(den) < 1e-12) continue;
      const u = (ctr + sg * half - dot(ax, P)) / den;
      if (u < 0 || u > 1) continue;
      const X = add(P, mul(d, u));
      if (Math.abs(dot(other, X) - oc) <= oh + 1e-9) take(X);
    }
  }
  for (const sa of [-1, 1]) for (const sb of [-1, 1]) {
    const O = add(mul(t, L + sa * a2), mul(b, s + sb * c2));
    // the corner line O + h·n through the part: its interval
    let hin = -Infinity, hout = Infinity, ok = true;
    for (const pl of p.planes) {
      const den = dot(pl.n, n), dist = pl.e - dot(pl.n, O);
      if (Math.abs(den) < 1e-12) { if (dist < 0) { ok = false; break; } continue; }
      const h = dist / den;
      if (den < 0) hin = Math.max(hin, h); else hout = Math.min(hout, h);
    }
    if (ok && hin <= hout) { take(add(O, mul(n, hin))); take(add(O, mul(n, hout))); }
  }
  return lo <= hi ? [lo, hi] : null;
}

/** THE OUTSIDE: a voxel flood (6-neighbour) from the border of the parts' box grown 3 cells; a cell is solid when its centre is in a part */
export interface Flood { o: V; h: number; nx: number; ny: number; nz: number; out: Uint8Array }
export function floodOutside(parts: readonly Part[], h: number): Flood | null {
  if (parts.length === 0) return null;
  // the grid's origin off any round number (a cell centre ON a seam between two parts would leak); a cell solid when its centre is in a part or on it
  const lo: V = [0, 1, 2].map((k) => Math.min(...parts.map((p) => p.lo[k]!)) - 3 * h + 0.37 * (k + 1)) as V;
  const hi: V = [0, 1, 2].map((k) => Math.max(...parts.map((p) => p.hi[k]!)) + 3 * h) as V;
  const nx = Math.ceil((hi[0] - lo[0]) / h), ny = Math.ceil((hi[1] - lo[1]) / h), nz = Math.ceil((hi[2] - lo[2]) / h);
  const solid = new Uint8Array(nx * ny * nz);
  const id = (i: number, j: number, k: number) => (i * ny + j) * nz + k;
  for (const p of parts) {
    const r = (k: number, v: number) => Math.floor((v - lo[k]!) / h - 0.5);
    for (let i = Math.max(0, r(0, p.lo[0])); i <= Math.min(nx - 1, r(0, p.hi[0]) + 1); i++)
      for (let j = Math.max(0, r(1, p.lo[1])); j <= Math.min(ny - 1, r(1, p.hi[1]) + 1); j++)
        for (let k = Math.max(0, r(2, p.lo[2])); k <= Math.min(nz - 1, r(2, p.hi[2]) + 1); k++) {
          const c: V = [lo[0] + (i + 0.5) * h, lo[1] + (j + 0.5) * h, lo[2] + (k + 0.5) * h];
          if (p.planes.every((pl) => dot(pl.n, c) - pl.e <= 1e-9)) solid[id(i, j, k)] = 1;
        }
  }
  const out = new Uint8Array(nx * ny * nz);
  const st: number[] = [0];
  out[0] = 1;
  while (st.length > 0) {
    const q = st.pop()!;
    const k = q % nz, j = Math.floor(q / nz) % ny, i = Math.floor(q / (nz * ny));
    for (const [di, dj, dk] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      const a = i + di!, b2 = j + dj!, c = k + dk!;
      if (a < 0 || b2 < 0 || c < 0 || a >= nx || b2 >= ny || c >= nz) continue;
      const w = id(a, b2, c);
      if (out[w] || solid[w]) continue;
      out[w] = 1;
      st.push(w);
    }
  }
  return { o: lo, h, nx, ny, nz, out };
}
export function isOutside(f: Flood, x: V): boolean {
  const i = Math.floor((x[0] - f.o[0]) / f.h), j = Math.floor((x[1] - f.o[1]) / f.h), k = Math.floor((x[2] - f.o[2]) / f.h);
  if (i < 0 || j < 0 || k < 0 || i >= f.nx || j >= f.ny || k >= f.nz) return true;
  return f.out[(i * f.ny + j) * f.nz + k] === 1;
}

/** samples on a part's face, `step` mm apart (each `step²` of area), inside its triangles */
export function faceSamples(f: PFace, step: number): V[] {
  const n = f.n;
  const t: V = Math.abs(n[1]) < 0.9 ? unit(cross([0, 1, 0], n)) : [1, 0, 0];
  const b = cross(n, t);
  const P = f.tris.flat();
  const ts = P.map((v) => dot(v, t)), bs = P.map((v) => dot(v, b));
  const out: V[] = [];
  const t0 = Math.min(...ts), t1 = Math.max(...ts), b0 = Math.min(...bs), b1 = Math.max(...bs);
  for (let u = t0 + step / 2; u < t1; u += step) for (let w = b0 + step / 2; w < b1; w += step) {
    const x = add(add(mul(n, f.e), mul(t, u)), mul(b, w));
    if (f.tris.some(([A, B, C]) => inTri(x, A, B, C, n))) out.push(x);
  }
  return out;
}
function inTri(x: V, A: V, B: V, C: V, n: V): boolean {
  const s1 = dot(cross(sub(B, A), sub(x, A)), n), s2 = dot(cross(sub(C, B), sub(x, B)), n), s3 = dot(cross(sub(A, C), sub(x, C)), n);
  return (s1 >= -1e-9 && s2 >= -1e-9 && s3 >= -1e-9) || (s1 <= 1e-9 && s2 <= 1e-9 && s3 <= 1e-9);
}

/** BOXES OUT OF CELLS: the block less the voids (boxes), cut on every bound, the solid cells merged greedily (x, then z, then y) into few boxes */
export function blockLess(block: { lo: V; hi: V }, voids: { lo: V; hi: V }[], prefix = "b"): Part[] {
  const cuts = (k: 0 | 1 | 2) => [...new Set([block.lo[k], block.hi[k], ...voids.flatMap((v) => [v.lo[k], v.hi[k]])])].filter((c) => c >= block.lo[k] && c <= block.hi[k]).sort((a, b) => a - b);
  const cx = cuts(0), cy = cuts(1), cz = cuts(2);
  const NX = cx.length - 1, NY = cy.length - 1, NZ = cz.length - 1;
  const solid = new Uint8Array(NX * NY * NZ);
  const id = (i: number, j: number, k: number) => (i * NY + j) * NZ + k;
  for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) for (let k = 0; k < NZ; k++) {
    const c = [(cx[i]! + cx[i + 1]!) / 2, (cy[j]! + cy[j + 1]!) / 2, (cz[k]! + cz[k + 1]!) / 2];
    if (!voids.some((v) => c.every((x, a) => x > v.lo[a]! && x < v.hi[a]!))) solid[id(i, j, k)] = 1;
  }
  const used = new Uint8Array(NX * NY * NZ);
  const out: Part[] = [];
  const free = (i: number, j: number, k: number) => solid[id(i, j, k)] === 1 && used[id(i, j, k)] === 0;
  for (let j = 0; j < NY; j++) for (let k = 0; k < NZ; k++) for (let i = 0; i < NX; i++) {
    if (!free(i, j, k)) continue;
    let i1 = i; while (i1 + 1 < NX && free(i1 + 1, j, k)) i1++;
    let k1 = k; while (k1 + 1 < NZ && [...Array(i1 - i + 1)].every((_, d) => free(i + d, j, k1 + 1))) k1++;
    let j1 = j; while (j1 + 1 < NY && [...Array(i1 - i + 1)].every((_, d) => [...Array(k1 - k + 1)].every((_, e) => free(i + d, j1 + 1, k + e)))) j1++;
    for (let a = i; a <= i1; a++) for (let b = j; b <= j1; b++) for (let c = k; c <= k1; c++) used[id(a, b, c)] = 1;
    out.push(boxPart(`${prefix}${out.length}`, [cx[i]!, cy[j]!, cz[k]!], [cx[i1 + 1]!, cy[j1 + 1]!, cz[k1 + 1]!]));
  }
  return out;
}

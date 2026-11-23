/**
 * ⭐⭐⭐ (2026-11-23, package S5 — `ORBIT_SURFACE_PART_CHECKS.md`; the build list's item 3, his word *"Game side first"*) **THE PARTS' CHECKS, THE GAME'S
 * SIDE — B1, THE SOLIDS** (`ORBIT_SURFACE.md` §7bis.3, `PART_AUTHORING.md` §6): per part of a scene's `.glb`, read with the game's own readers
 * (`readModelCatalog`, the node walk of `glb_geometry.ts`), in its own frame, in MILLIMETRES —
 * * each `UCX_` piece CONVEX (B1a), CLOSED (B1b), with VOLUME (B1c), SIMPLE (B1d: ≤ 24 vertices, ≤ 48 triangles);
 * * its face proxy (`UFM_`) ON its solids (B1e), facing OUT (B1f), and ⭐ COMPLETE (B1h — his word of 2026-11-23: *"the plinth in scene 2 … the proxy
 *   face is not complete. Make sure the same is detected"*): a proxy is PARTIAL by design (a piston's is its resting face; the plinth's its top), so
 *   B1h reads each face of the solids the proxy lies on — a hull face touched by the proxy, its normal the same — and every point of THAT face must be
 *   under the proxy. (B1g, "planar", dropped at the build: a `UFM_` node is a set of faces — `UFM_E02_outer` a whole outer surface — and a triangle
 *   export has no non-planar face to find.)
 * Every finding NAMED (the part, the node, the measure). Pure, engine-free: no state.
 */
import { accessorIndices, accessorPoints, compose, apply, nodePlacement, type Placement } from "./glb_geometry";
import { convexHull3 } from "./hull3";
import type { ModelCatalog, ModelPart } from "./model_catalog";
import { SURFACE_STEP_MIN_MM } from "./units";
import { cross, dot, sub, type Vec3 } from "./vec";

/** ⭐ (B1d, `PART_AUTHORING.md` §4.2 — COLLISION SIMPLICITY) a collision piece's budget — the constants' one home. */
export const UCX_MAX_VERTICES = 24;
export const UCX_MAX_TRIANGLES = 48;
/** ⭐ (D3) the geometric noise of an export (mm): a point on a hull, a piece's thickness, the step off a face. */
export const B1_TOL_MM = 0.01;
/** ⭐ (D2) the proxy's fit to its solids (mm): Q6's step, the noise family's first member — a part's `extras.fit_tol` (mm) may say more. */
export const B1_FIT_MM = SURFACE_STEP_MIN_MM;
/** ⭐ (B1h) a solid face the proxy lies on: their normals within this (degrees). */
export const B1_SAME_FACE_DEG = 1;
/** ⭐ (B1h) the samples: along a face's edges every this (mm) — a strip left uncovered shows — and inside it a grid of `B1_COVER_INNER` a side. */
export const B1_COVER_STEP_MM = 2;
export const B1_COVER_INNER = 40;

/** one mesh node of a part, in the part's frame (mm): its name, its points, its triangles */
export interface PartMesh {
  readonly name: string;
  readonly points: readonly Vec3[];
  readonly triangles: readonly (readonly [number, number, number])[];
}
/** a part's solids and proxy as read from the file */
export interface PartSolids {
  readonly id: string;
  readonly frozen: boolean;
  readonly fitMm: number;
  readonly pieces: readonly PartMesh[];
  readonly proxy: readonly PartMesh[];
}
/** one finding: the check, the part, the node, what was measured */
export interface B1Finding {
  readonly check: "B1a" | "B1b" | "B1c" | "B1d" | "B1e" | "B1f" | "B1h";
  readonly part: string;
  readonly node: string;
  readonly detail: string;
}

interface Gltf {
  readonly nodes: readonly { readonly name?: string; readonly children?: readonly number[]; readonly mesh?: number; readonly translation?: readonly number[]; readonly rotation?: readonly number[]; readonly extras?: Record<string, unknown> }[];
  readonly meshes: readonly { readonly primitives: readonly { readonly attributes: Readonly<Record<string, number>>; readonly indices?: number }[] }[];
}

/** ⭐ each part's collision pieces and face proxy, node by node, in the part's frame, in mm (`unitM` × 1000) */
export function readPartSolids(json: unknown, bin: Uint8Array, catalog: ModelCatalog): PartSolids[] {
  const g = json as Gltf;
  const byName = new Map(g.nodes.map((n, i) => [n.name ?? `#${i}`, i]));
  const mm = catalog.unitM * 1000;
  return catalog.parts.map((part: ModelPart) => {
    const ucx = new Set(part.ucx);
    const ufm = new Set(part.faces);
    const pieces: PartMesh[] = [];
    const proxy: PartMesh[] = [];
    const walk = (i: number, toPart: Placement): void => {
      const n = g.nodes[i]!;
      const here = compose(toPart, nodePlacement(n));
      const name = n.name ?? `#${i}`;
      if (n.mesh !== undefined && (ucx.has(name) || ufm.has(name))) {
        const points: Vec3[] = [];
        const triangles: [number, number, number][] = [];
        for (const pr of g.meshes[n.mesh]!.primitives) {
          const base = points.length;
          for (const p of accessorPoints(g as never, bin, pr.attributes["POSITION"]!)) {
            const q = apply(here, p);
            points.push([q[0] * mm, q[1] * mm, q[2] * mm]);
          }
          const idx = pr.indices === undefined ? points.slice(base).map((_, k) => k) : accessorIndices(g as never, bin, pr.indices);
          for (let k = 0; k + 2 < idx.length; k += 3) triangles.push([base + idx[k]!, base + idx[k + 1]!, base + idx[k + 2]!]);
        }
        (ucx.has(name) ? pieces : proxy).push({ name, points, triangles });
      }
      for (const c of n.children ?? []) walk(c, here);
    };
    const pi = byName.get(part.node);
    const fit = pi === undefined ? undefined : g.nodes[pi]!.extras?.["fit_tol"];
    if (pi !== undefined) for (const c of g.nodes[pi]!.children ?? []) walk(c, { position: [0, 0, 0], rotation: [1, 0, 0, 0] });
    return { id: part.id, frozen: part.frozen, fitMm: typeof fit === "number" && fit > B1_FIT_MM ? fit : B1_FIT_MM, pieces, proxy };
  });
}

// ── geometry ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
interface Convex {
  readonly planes: readonly { readonly n: Vec3; readonly d: number }[];
  readonly tris: readonly (readonly [Vec3, Vec3, Vec3])[];
  readonly volume: number;
}
const unit = (a: Vec3): Vec3 | null => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return l > 1e-12 ? [a[0] / l, a[1] / l, a[2] / l] : null;
};
const triNormal = (a: Vec3, b: Vec3, c: Vec3): Vec3 | null => unit(cross(sub(b, a), sub(c, a)));
function convexOf(points: readonly Vec3[]): Convex | null {
  const h = convexHull3(points);
  if (h === null) return null;
  const P = h.points;
  const planes: { n: Vec3; d: number }[] = [];
  const tris: [Vec3, Vec3, Vec3][] = [];
  let volume = 0;
  const o = P[0]!;
  for (const [a, b, c] of h.triangles) {
    const A = P[a]!, B = P[b]!, C = P[c]!;
    tris.push([A, B, C]);
    const n = triNormal(A, B, C);
    if (n !== null) planes.push({ n, d: dot(n, A) });
    volume += dot(sub(A, o), cross(sub(B, o), sub(C, o))) / 6;
  }
  return { planes, tris, volume };
}
/** the distance from `p` to the triangle (a, b, c) — Ericson, Real-Time Collision Detection §5.1.5 */
function pointTriangle(p: Vec3, a: Vec3, b: Vec3, c: Vec3): number {
  const ab = sub(b, a), ac = sub(c, a), ap = sub(p, a);
  const d1 = dot(ab, ap), d2 = dot(ac, ap);
  const dist = (q: Vec3) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  if (d1 <= 0 && d2 <= 0) return dist(a);
  const bp = sub(p, b), d3 = dot(ab, bp), d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return dist(b);
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); return dist([a[0] + ab[0] * v, a[1] + ab[1] * v, a[2] + ab[2] * v]); }
  const cp = sub(p, c), d5 = dot(ab, cp), d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return dist(c);
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); return dist([a[0] + ac[0] * w, a[1] + ac[1] * w, a[2] + ac[2] * w]); }
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
    const w = (d4 - d3) / (d4 - d3 + (d5 - d6));
    return dist([b[0] + (c[0] - b[0]) * w, b[1] + (c[1] - b[1]) * w, b[2] + (c[2] - b[2]) * w]);
  }
  const den = 1 / (va + vb + vc), v = vb * den, w = vc * den;
  return dist([a[0] + ab[0] * v + ac[0] * w, a[1] + ab[1] * v + ac[1] * w, a[2] + ab[2] * v + ac[2] * w]);
}
/** the signed distance from `p` to a convex piece: negative inside (its depth), positive outside (exact) */
function signedTo(p: Vec3, k: Convex): number {
  let s = -Infinity;
  for (const pl of k.planes) s = Math.max(s, dot(pl.n, p) - pl.d);
  if (s <= 0) return s;
  let m = Infinity;
  for (const [a, b, c] of k.tris) m = Math.min(m, pointTriangle(p, a, b, c));
  return m;
}
/** how deep `p` is inside a convex piece (its largest plane distance: negative inside — exact there; positive outside, a lower bound) — cheap */
function planeDepth(p: Vec3, k: Convex): number {
  let s = -Infinity;
  for (const pl of k.planes) s = Math.max(s, dot(pl.n, p) - pl.d);
  return s;
}
/** the signed distance from `p` to the UNION of the pieces: its deepest inside, else its nearest outside */
const toUnion = (p: Vec3, ks: readonly Convex[]): number => ks.reduce((m, k) => Math.min(m, signedTo(p, k)), Infinity);

// ── B1 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** ⭐⭐⭐ B1 on a scene's parts (`readPartSolids`): every finding, named; [] = the scene passes */
export function checkSolids(parts: readonly PartSolids[]): B1Finding[] {
  const out: B1Finding[] = [];
  for (const part of parts) {
    const ks: Convex[] = [];
    for (const pc of part.pieces) {
      const f = (check: B1Finding["check"], detail: string) => out.push({ check, part: part.id, node: pc.name, detail });
      const k = convexOf(pc.points);
      // B1d — simple
      const verts = new Set(pc.points.map((p) => `${p[0].toFixed(4)},${p[1].toFixed(4)},${p[2].toFixed(4)}`)).size;
      if (verts > UCX_MAX_VERTICES || pc.triangles.length > UCX_MAX_TRIANGLES) f("B1d", `${verts} vertices, ${pc.triangles.length} triangles (at most ${UCX_MAX_VERTICES}, ${UCX_MAX_TRIANGLES})`);
      // B1c — volume
      if (k === null || k.volume <= B1_TOL_MM ** 3) {
        f("B1c", `no volume (${k === null ? "degenerate" : `${k.volume.toExponential(2)} mm³`})`);
        continue;
      }
      ks.push(k);
      // B1a — convex: every point on its hull
      let dent = 0;
      for (const p of pc.points) dent = Math.max(dent, -signedTo(p, k));
      if (dent > B1_TOL_MM) f("B1a", `a point ${dent.toFixed(3)} mm inside its hull (not convex)`);
      // B1b — closed: every edge in exactly two triangles (welded by position)
      const key = (i: number) => { const p = pc.points[i]!; return `${p[0].toFixed(4)},${p[1].toFixed(4)},${p[2].toFixed(4)}`; };
      const edges = new Map<string, number>();
      for (const [a, b, c] of pc.triangles) for (const [x, y] of [[a, b], [b, c], [c, a]] as const) {
        const kx = key(x), ky = key(y);
        if (kx === ky) continue;
        const e = kx < ky ? `${kx}|${ky}` : `${ky}|${kx}`;
        edges.set(e, (edges.get(e) ?? 0) + 1);
      }
      const open = [...edges.values()].filter((n) => n !== 2).length;
      if (open > 0) f("B1b", `${open} edge(s) not shared by exactly two triangles (not closed)`);
    }
    if (ks.length === 0) continue;
    const proxyTris: { readonly t: readonly [Vec3, Vec3, Vec3]; readonly n: Vec3; readonly lo: Vec3; readonly hi: Vec3 }[] = [];
    for (const px of part.proxy) {
      const f = (check: B1Finding["check"], detail: string) => out.push({ check, part: part.id, node: px.name, detail });
      const offs: number[] = [];
      let inward = 0;
      for (const [a, b, c] of px.triangles) {
        const A = px.points[a]!, B = px.points[b]!, C = px.points[c]!;
        const n = triNormal(A, B, C);
        if (n === null) continue;
        proxyTris.push({ t: [A, B, C], n, lo: [Math.min(A[0], B[0], C[0]), Math.min(A[1], B[1], C[1]), Math.min(A[2], B[2], C[2])], hi: [Math.max(A[0], B[0], C[0]), Math.max(A[1], B[1], C[1]), Math.max(A[2], B[2], C[2])] });
        const g: Vec3 = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3, (A[2] + B[2] + C[2]) / 3];
        // B1e — on its solids: the corners and the centroid near the union's surface (never deep inside, never far out)
        offs.push(Math.max(...[A, B, C, g].map((q) => Math.abs(toUnion(q, ks)))));
        // B1f — outward: in front of it, outside every piece
        const st = 2 * part.fitMm;
        if (toUnion([g[0] + n[0] * st, g[1] + n[1] * st, g[2] + n[2] * st], ks) < 0) inward++;
      }
      const bad = offs.filter((o) => o > part.fitMm).length;
      if (bad > 0) {
        const sorted = [...offs].sort((x, y) => x - y);
        f("B1e", `${bad} of ${offs.length} triangle(s) off its solids — the worst ${sorted[sorted.length - 1]!.toFixed(2)} mm, the median ${sorted[Math.floor(sorted.length / 2)]!.toFixed(2)} mm (the fit ${part.fitMm} mm)`);
      }
      if (inward > 0) f("B1f", `${inward} of ${px.triangles.length} triangle(s) facing into the solids`);
    }
    // B1h — complete: the solids' faces the proxy lies on (a hull triangle with a sample under a proxy triangle of the same normal), each sampled — along
    // its edges every 2 mm, inside on a grid — and every sample under the proxy (within the fit, the same normal)
    const cosSame = Math.cos((B1_SAME_FACE_DEG * Math.PI) / 180);
    const under = (p: Vec3, n: Vec3): number => {
      let d = Infinity;
      const r = part.fitMm;
      for (const q of proxyTris) {
        if (dot(q.n, n) < cosSame) continue;
        if (p[0] < q.lo[0] - r || p[0] > q.hi[0] + r || p[1] < q.lo[1] - r || p[1] > q.hi[1] + r || p[2] < q.lo[2] - r || p[2] > q.hi[2] + r) continue;
        d = Math.min(d, pointTriangle(p, q.t[0], q.t[1], q.t[2]));
        if (d <= r) break;
      }
      return d;
    };
    let miss = 0, total = 0, faces = 0, missIn = 0;
    const lo: number[] = [Infinity, Infinity, Infinity], hi: number[] = [-Infinity, -Infinity, -Infinity];
    const loIn: number[] = [Infinity, Infinity, Infinity], hiIn: number[] = [-Infinity, -Infinity, -Infinity];
    ks.forEach((k, ki) => {
      for (const [a, b, c] of k.tris) {
        const n = triNormal(a, b, c);
        if (n === null) continue;
        const samples: Vec3[] = [];
        const inner: Vec3[] = [];
        const at = (u: number, v: number): Vec3 => [a[0] + (b[0] - a[0]) * u + (c[0] - a[0]) * v, a[1] + (b[1] - a[1]) * u + (c[1] - a[1]) * v, a[2] + (b[2] - a[2]) * u + (c[2] - a[2]) * v];
        const g: Vec3 = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
        // the edges, set in from them by ten times the noise (a sample ON an edge belongs to the next face too)
        const e = B1_TOL_MM * 10;
        for (const [p, q] of [[a, b], [b, c], [c, a]] as const) {
          const L = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
          const m = Math.max(1, Math.ceil(L / B1_COVER_STEP_MM));
          for (let i = 0; i <= m; i++) {
            const t = (i + 0.5) / (m + 1);
            const x: Vec3 = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
            const toG = Math.hypot(g[0] - x[0], g[1] - x[1], g[2] - x[2]);
            const w = toG > e ? e / toG : 0;
            samples.push([x[0] + (g[0] - x[0]) * w, x[1] + (g[1] - x[1]) * w, x[2] + (g[2] - x[2]) * w]);
          }
        }
        const M = B1_COVER_INNER;
        for (let i = 1; i < M; i++) for (let j = 1; i + j < M; j++) inner.push(at(i / M, j / M));
        // the solids' OUTER surface only (a sample inside another piece of the part is no surface)
        const surf = (p: Vec3) => !ks.some((o, oi) => oi !== ki && planeDepth(p, o) < -B1_TOL_MM);
        // the proxy lies on this face? — asked on a subset (every 5th sample: ~2 – 10 mm apart)
        const all = [...samples, ...inner];
        if (!all.some((p, i) => i % 5 === 0 && surf(p) && under(p, n) <= part.fitMm)) continue;
        faces++;
        all.forEach((p, i) => {
          if (!surf(p)) return;
          total++;
          if (under(p, n) <= part.fitMm) return;
          miss++;
          const into = i >= samples.length;
          if (into) missIn++;
          for (let d = 0; d < 3; d++) {
            (lo[d] = Math.min(lo[d]!, p[d]!)), (hi[d] = Math.max(hi[d]!, p[d]!));
            if (into) (loIn[d] = Math.min(loIn[d]!, p[d]!)), (hiIn[d] = Math.max(hiIn[d]!, p[d]!));
          }
        });
      }
    });
    if (miss > 0) {
      const box = (l: number[], h: number[]) => [0, 1, 2].map((d) => `${l[d]!.toFixed(0)}…${h[d]!.toFixed(0)}`).join(" × ");
      const inside = missIn > 0 ? `; ${missIn} INSIDE the faces (a hole in the proxy) within ${box(loIn, hiIn)} mm` : "; none inside the faces (a strip along their edges)";
      out.push({ check: "B1h", part: part.id, node: "UFM_*", detail: `${miss} of ${total} samples of the ${faces} solid face(s) it lies on NOT under it (${((100 * miss) / total).toFixed(1)} %, within ${box(lo, hi)} mm${inside})` });
    }
  }
  return out;
}

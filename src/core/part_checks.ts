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
  readonly check: "B1a" | "B1b" | "B1c" | "B1d" | "B1e" | "B1f" | "B1h" | "B1i";
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

// ── B2 — EXPOSED PER STAGE (S22), and B1i — the proxy over every exposed face (D7) ─────────────────────────────────────────────────────
/** ⭐ (B2, `ORBIT_SURFACE_PART_CHECKS.md` §3, D4) the grid's step (mm): a gap under it reads closed — said in the map. */
export const B2_STEP_MM = 4;

/** a part at its goal, in the SCENE frame (y up), in mm: its pieces (as convex bodies) and its proxy's triangles */
interface Placed {
  readonly id: string;
  readonly index: number;
  readonly ks: readonly Convex[];
  readonly proxy: readonly { readonly t: readonly [Vec3, Vec3, Vec3]; readonly n: Vec3 }[];
}
/** one stage of the plan: the part placed (the frozen ones first, together), and per placed part its proxy triangles' states */
export interface B2Stage {
  readonly placed: string;
  readonly parts: readonly { readonly id: string; readonly exposed: number; readonly glued: number; readonly buried: number; readonly sealed: number }[];
}
export interface B2Map {
  readonly stepMm: number;
  readonly cells: readonly [number, number, number];
  readonly stages: readonly B2Stage[];
  /** B1i (D7): per part, its solids' samples the outside reaches at some stage and NOT under its proxy */
  readonly uncovered: readonly B1Finding[];
}

/**
 * ⭐⭐⭐ B2 — per stage of the plan, the placed parts' pieces at their goals VOXELIZED (`B2_STEP_MM`), the floor (below the lowest part) solid, the
 * OUTSIDE flooded from the grid's border (6-neighbour) through the empty cells; each placed part's proxy triangle read in front of it: EXPOSED (a
 * flooded cell), GLUED (another part's or the floor's), BURIED (its own part's), SEALED (empty, not reached). ⭐ And B1i (D7, PROPOSED): each part's
 * solids sampled at its goal; a sample the outside reaches at some stage from its placing on must be under its proxy (within the fit, its normal).
 * `parts`: `readPartSolids`; `goals`: each part's goal placement in the scene frame, its position in mm; `frozen`: the parts placed from the start.
 */
export function exposedPerStage(parts: readonly PartSolids[], goals: ReadonlyMap<string, Placement>, frozen: ReadonlySet<string>, stepMm: number = B2_STEP_MM): B2Map {
  const placed: Placed[] = parts.map((p, index) => {
    const g = goals.get(p.id)!;
    const at = (q: Vec3): Vec3 => apply(g, q);
    const ks = p.pieces.map((pc) => convexOf(pc.points.map(at))).filter((k): k is Convex => k !== null);
    const proxy: { t: [Vec3, Vec3, Vec3]; n: Vec3 }[] = [];
    for (const px of p.proxy)
      for (const [a, b, c] of px.triangles) {
        const t: [Vec3, Vec3, Vec3] = [at(px.points[a]!), at(px.points[b]!), at(px.points[c]!)];
        const n = triNormal(t[0], t[1], t[2]);
        if (n !== null) proxy.push({ t, n });
      }
    return { id: p.id, index, ks, proxy };
  });
  // the grid: the parts' box grown by two cells
  const lo: number[] = [Infinity, Infinity, Infinity], hi: number[] = [-Infinity, -Infinity, -Infinity];
  for (const p of placed) for (const k of p.ks) for (const t of k.tris) for (const q of t) for (let d = 0; d < 3; d++) (lo[d] = Math.min(lo[d]!, q[d]!)), (hi[d] = Math.max(hi[d]!, q[d]!));
  for (let d = 0; d < 3; d++) (lo[d] = lo[d]! - 2 * stepMm), (hi[d] = hi[d]! + 2 * stepMm);
  const n = [0, 1, 2].map((d) => Math.ceil((hi[d]! - lo[d]!) / stepMm)) as [number, number, number];
  const N = n[0] * n[1] * n[2];
  const idx = (i: number, j: number, k: number) => (i * n[1] + j) * n[2] + k;
  const cellOf = (q: Vec3): number => {
    const i = Math.floor((q[0] - lo[0]!) / stepMm), j = Math.floor((q[1] - lo[1]!) / stepMm), k = Math.floor((q[2] - lo[2]!) / stepMm);
    return i < 0 || j < 0 || k < 0 || i >= n[0] || j >= n[1] || k >= n[2] ? -1 : idx(i, j, k);
  };
  const owner = new Int16Array(N).fill(-1); // -1 empty, -2 the floor, else the part's index
  const floorY = lo[1]! + 2 * stepMm; // the lowest part point
  for (let i = 0; i < n[0]; i++) for (let j = 0; j < n[1]; j++) if (lo[1]! + (j + 0.5) * stepMm < floorY) for (let k = 0; k < n[2]; k++) owner[idx(i, j, k)] = -2;
  const fill = (p: Placed): void => {
    for (const kv of p.ks) {
      const bl: number[] = [Infinity, Infinity, Infinity], bh: number[] = [-Infinity, -Infinity, -Infinity];
      for (const t of kv.tris) for (const q of t) for (let d = 0; d < 3; d++) (bl[d] = Math.min(bl[d]!, q[d]!)), (bh[d] = Math.max(bh[d]!, q[d]!));
      const r = (d: number, v: number) => Math.max(0, Math.min(n[d]! - 1, Math.floor((v - lo[d]!) / stepMm)));
      for (let i = r(0, bl[0]!); i <= r(0, bh[0]!); i++)
        for (let j = r(1, bl[1]!); j <= r(1, bh[1]!); j++)
          for (let k = r(2, bl[2]!); k <= r(2, bh[2]!); k++) {
            const c: Vec3 = [lo[0]! + (i + 0.5) * stepMm, lo[1]! + (j + 0.5) * stepMm, lo[2]! + (k + 0.5) * stepMm];
            if (planeDepth(c, kv) <= 0 && owner[idx(i, j, k)] === -1) owner[idx(i, j, k)] = p.index;
          }
    }
  };
  const flooded = new Uint8Array(N);
  const queue = new Int32Array(N);
  const flood = (): void => {
    flooded.fill(0);
    let head = 0, tail = 0;
    const push = (c: number) => {
      if (owner[c] === -1 && flooded[c] === 0) (flooded[c] = 1), (queue[tail++] = c);
    };
    for (let i = 0; i < n[0]; i++)
      for (let j = 0; j < n[1]; j++)
        for (let k = 0; k < n[2]; k++) if (i === 0 || j === 0 || k === 0 || i === n[0] - 1 || j === n[1] - 1 || k === n[2] - 1) push(idx(i, j, k));
    const s1 = n[2], s0 = n[1] * n[2];
    while (head < tail) {
      const c = queue[head++]!;
      const k = c % n[2], j = Math.floor(c / s1) % n[1], i = Math.floor(c / s0);
      if (i > 0) push(c - s0);
      if (i < n[0] - 1) push(c + s0);
      if (j > 0) push(c - s1);
      if (j < n[1] - 1) push(c + s1);
      if (k > 0) push(c - 1);
      if (k < n[2] - 1) push(c + 1);
    }
  };
  const front = (q: Vec3, nn: Vec3): number => cellOf([q[0] + nn[0] * 0.75 * stepMm, q[1] + nn[1] * 0.75 * stepMm, q[2] + nn[2] * 0.75 * stepMm]);
  // B1i's samples: each part's solids' OUTER surface at its goal (each hull face on a 20 × 20 grid; inside another piece of the part: no surface)
  const samplesOf = (p: Placed): { readonly q: Vec3; readonly n: Vec3 }[] => {
    const out: { q: Vec3; n: Vec3 }[] = [];
    p.ks.forEach((k, ki) => {
      for (const [a, b, c] of k.tris) {
        const nn = triNormal(a, b, c);
        if (nn === null) continue;
        const at = (u: number, v: number): Vec3 => [a[0] + (b[0] - a[0]) * u + (c[0] - a[0]) * v, a[1] + (b[1] - a[1]) * u + (c[1] - a[1]) * v, a[2] + (b[2] - a[2]) * u + (c[2] - a[2]) * v];
        for (let i = 1; i < 20; i++)
          for (let j = 1; i + j < 20; j++) {
            const q = at(i / 20, j / 20);
            if (!p.ks.some((o, oi) => oi !== ki && planeDepth(q, o) < -B1_TOL_MM)) out.push({ q, n: nn });
          }
      }
    });
    return out;
  };
  const cosSame = Math.cos((B1_SAME_FACE_DEG * Math.PI) / 180);
  const fitOf = new Map(parts.map((p) => [p.id, p.fitMm]));
  const order = [...placed.filter((p) => frozen.has(p.id)), ...placed.filter((p) => !frozen.has(p.id))];
  const nFrozen = order.filter((p) => frozen.has(p.id)).length;
  const reached = new Map<string, Uint8Array>(); // per part: its samples the outside reached at some stage
  const samples = new Map(placed.map((p) => [p.id, samplesOf(p)]));
  const stages: B2Stage[] = [];
  for (let s = Math.max(1, nFrozen); s <= order.length; s++) {
    const now = order.slice(0, s);
    if (s === Math.max(1, nFrozen)) now.forEach(fill);
    else fill(order[s - 1]!);
    flood();
    const rows = now.map((p) => {
      let exposed = 0, glued = 0, buried = 0, sealed = 0;
      for (const { t, n: nn } of p.proxy) {
        const g: Vec3 = [(t[0][0] + t[1][0] + t[2][0]) / 3, (t[0][1] + t[1][1] + t[2][1]) / 3, (t[0][2] + t[1][2] + t[2][2]) / 3];
        const cs = [g, ...t.map((v): Vec3 => [v[0] + (g[0] - v[0]) * 0.2, v[1] + (g[1] - v[1]) * 0.2, v[2] + (g[2] - v[2]) * 0.2])].map((q) => front(q, nn)).filter((c) => c >= 0);
        if (cs.some((c) => flooded[c] === 1)) exposed++;
        else if (cs.some((c) => (owner[c]! >= 0 && owner[c] !== p.index) || owner[c] === -2)) glued++;
        else if (cs.some((c) => owner[c] === p.index)) buried++;
        else sealed++;
      }
      const sm = samples.get(p.id)!;
      const r = reached.get(p.id) ?? new Uint8Array(sm.length);
      sm.forEach(({ q, n: nn }, i) => {
        const c = front(q, nn);
        if (c >= 0 && flooded[c] === 1) r[i] = 1;
      });
      reached.set(p.id, r);
      return { id: p.id, exposed, glued, buried, sealed };
    });
    stages.push({ placed: s === Math.max(1, nFrozen) ? now.map((p) => p.id).join("+") : order[s - 1]!.id, parts: rows });
  }
  // B1i — the reached samples not under the part's proxy
  const uncovered: B1Finding[] = [];
  for (const p of placed) {
    const sm = samples.get(p.id)!, r = reached.get(p.id);
    if (r === undefined) continue;
    const fit = fitOf.get(p.id)!;
    let total = 0, miss = 0;
    const bl: number[] = [Infinity, Infinity, Infinity], bh: number[] = [-Infinity, -Infinity, -Infinity];
    sm.forEach(({ q, n: nn }, i) => {
      if (r[i] !== 1) return;
      total++;
      let d = Infinity;
      for (const x of p.proxy) {
        if (dot(x.n, nn) < cosSame) continue;
        d = Math.min(d, pointTriangle(q, x.t[0], x.t[1], x.t[2]));
        if (d <= fit) break;
      }
      if (d > fit) {
        miss++;
        for (let k = 0; k < 3; k++) (bl[k] = Math.min(bl[k]!, q[k]!)), (bh[k] = Math.max(bh[k]!, q[k]!));
      }
    });
    if (miss > 0) {
      const box = [0, 1, 2].map((k) => `${bl[k]!.toFixed(0)}…${bh[k]!.toFixed(0)}`).join(" × ");
      uncovered.push({ check: "B1i", part: p.id, node: "UFM_*", detail: `${miss} of the ${total} samples of its solids the outside reaches NOT under its proxy (${((100 * miss) / total).toFixed(1)} %, in the scene's frame within ${box} mm)` });
    }
  }
  return { stepMm, cells: n, stages, uncovered };
}

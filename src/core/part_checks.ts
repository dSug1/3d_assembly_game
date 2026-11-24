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
import { PROXY_CURVE_TOL_MM, PROXY_FACE_MIN_MM, PROXY_FLUSH_MM, SURFACE_STEP_MIN_MM } from "./units";
import { cross, dot, qRotate as qRot, sub, type Vec3 } from "./vec";
import { closestOnTriangle, pointTriangle, triGrid } from "./tri_geom";
// (S6 — the triangle primitives moved to `tri_geom.ts`, shared with the voxels; re-exported for the checks that import them from here)
export { closestOnTriangle, pointTriangle, triGrid };
import { COVER_STEP_MM, insideClosing } from "./voxels";

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

/**
 * ⭐⭐ (2026-11-23 — the 11-13 principle, `PART_AUTHORING.md` §3 item 3: *"a VIRTUAL face (a resting proxy, a ghost) exempt from ① and ②"*; `SCENE_2_ASSEMBLY.md`
 * §6.1) a VIRTUAL proxy face — off the real surface BY DESIGN: a RESTING PROXY (`…_rest`: one flat face square to the part's approach axis, at its
 * hull's extreme) or a CAP over a hollow's mouth (`…_cap…`, `PROXY_AND_COLLISION_RULES.md` §7.1 row 4). Exempt from the fidelity (B1e, R2), the width
 * (R3) and from covering the real surface (B1h, B1i); its orientation (B1f) and its one face (R7) still read.
 */
export const isVirtualProxy = (name: string): boolean => /_rest$/.test(name) || name.includes("_cap");

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
  /** ⭐ (S6) its RENDER meshes (the real surface: R2's fidelity reads it; a label's mesh — `metadata` — left out); [] when the caller needs none */
  readonly renders: readonly PartMesh[];
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
    const rnd = new Set(part.renders.filter((r) => !r.metadata).map((r) => r.node));
    const renders: PartMesh[] = [];
    const pieces: PartMesh[] = [];
    const proxy: PartMesh[] = [];
    const walk = (i: number, toPart: Placement): void => {
      const n = g.nodes[i]!;
      const here = compose(toPart, nodePlacement(n));
      const name = n.name ?? `#${i}`;
      if (n.mesh !== undefined && (ucx.has(name) || ufm.has(name) || rnd.has(name))) {
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
        (ucx.has(name) ? pieces : ufm.has(name) ? proxy : renders).push({ name, points, triangles });
      }
      for (const c of n.children ?? []) walk(c, here);
    };
    const pi = byName.get(part.node);
    const fit = pi === undefined ? undefined : g.nodes[pi]!.extras?.["fit_tol"];
    if (pi !== undefined) for (const c of g.nodes[pi]!.children ?? []) walk(c, { position: [0, 0, 0], rotation: [1, 0, 0, 0] });
    return { id: part.id, frozen: part.frozen, fitMm: typeof fit === "number" && fit > B1_FIT_MM ? fit : B1_FIT_MM, pieces, proxy, renders };
  });
}

// ── geometry ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export interface Convex {
  readonly planes: readonly { readonly n: Vec3; readonly d: number }[];
  readonly tris: readonly (readonly [Vec3, Vec3, Vec3])[];
  readonly volume: number;
}
const unit = (a: Vec3): Vec3 | null => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return l > 1e-12 ? [a[0] / l, a[1] / l, a[2] / l] : null;
};
const triNormal = (a: Vec3, b: Vec3, c: Vec3): Vec3 | null => unit(cross(sub(b, a), sub(c, a)));
export function convexOf(points: readonly Vec3[]): Convex | null {
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
export function planeDepth(p: Vec3, k: Convex): number {
  let s = -Infinity;
  for (const pl of k.planes) s = Math.max(s, dot(pl.n, p) - pl.d);
  return s;
}
/** the signed distance from `p` to the UNION of the pieces: its deepest inside, else its nearest outside */
export const toUnion = (p: Vec3, ks: readonly Convex[]): number => ks.reduce((m, k) => Math.min(m, signedTo(p, k)), Infinity);

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
        if (!isVirtualProxy(px.name)) proxyTris.push({ t: [A, B, C], n, lo: [Math.min(A[0], B[0], C[0]), Math.min(A[1], B[1], C[1]), Math.min(A[2], B[2], C[2])], hi: [Math.max(A[0], B[0], C[0]), Math.max(A[1], B[1], C[1]), Math.max(A[2], B[2], C[2])] });
        const g: Vec3 = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3, (A[2] + B[2] + C[2]) / 3];
        // B1e — on its solids: the corners and the centroid near the union's surface (never deep inside, never far out)
        offs.push(Math.max(...[A, B, C, g].map((q) => Math.abs(toUnion(q, ks)))));
        // B1f — outward: in front of it, outside every piece
        const st = 2 * part.fitMm;
        if (toUnion([g[0] + n[0] * st, g[1] + n[1] * st, g[2] + n[2] * st], ks) < 0) inward++;
      }
      const bad = isVirtualProxy(px.name) ? 0 : offs.filter((o) => o > part.fitMm).length; // a virtual face is off its solids by design
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
  readonly proxy: readonly { readonly t: readonly [Vec3, Vec3, Vec3]; readonly n: Vec3; readonly real: boolean }[];
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
    const proxy: { t: [Vec3, Vec3, Vec3]; n: Vec3; real: boolean }[] = [];
    for (const px of p.proxy)
      for (const [a, b, c] of px.triangles) {
        const t: [Vec3, Vec3, Vec3] = [at(px.points[a]!), at(px.points[b]!), at(px.points[c]!)];
        const n = triNormal(t[0], t[1], t[2]);
        if (n !== null) proxy.push({ t, n, real: !isVirtualProxy(px.name) });
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
        if (!x.real || dot(x.n, nn) < cosSame) continue;
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

// ── S6 — THE PROXY RULES, packet 1 (`30_OBJECTS_3D/spec/PROXY_AND_COLLISION_RULES.md` §3, §7.1, §7.3 — DECIDED 2026-11-23) ─────────────────────
/** ⭐ (S6) one finding of the proxy rules; `info`: reported, not a failure (a riser — an S26 step). */
export interface ProxyFinding {
  readonly rule: "R1" | "R1b" | "R2" | "R3" | "R4" | "R7";
  readonly part: string;
  readonly node: string;
  readonly detail: string;
  readonly info?: true;
}
/** ⭐ (R7) the triangles of one proxy node within this of their plane's normal (degrees) — one face. */
export const R7_PLANAR_DEG = 1;
/** ⭐ (R4, B6 — `SCENE_WORKFLOW.md` §4) two faces apart: one face (under 1°), or at least this (degrees). */
export const B6_APART_DEG = 30;
/** ⭐ (R4, B6) no face's elevation within this of 45° (degrees). */
export const B6_ELEVATION_BAND_DEG = 15;
/** ⭐ (R2, his Q2) a facet of a curve spans at most half the hexagon's step either side of its normal (degrees). */
export const R4_HALF_STEP_DEG = 30;

const angleDeg = (a: Vec3, b: Vec3) => (Math.acos(Math.max(-1, Math.min(1, dot(a, b)))) * 180) / Math.PI;

/**
 * ⭐⭐⭐ (S6, packet 1) THE PROXY'S OWN RULES on each part (`readPartSolids` — its proxy nodes, its render meshes), in its frame, in mm:
 * * **R7** — each `UFM_` node ONE planar face (its triangles within 1° of their plane's normal); two coplanar neighbouring nodes, one face split;
 * * **R3** — each face the gizmo travels at least `PROXY_FACE_MIN_MM` across (its inscribed width); a RISER (a narrow face between two faces parallel
 *   to each other, square to it) an S26 step — reported as information;
 * * **R4** — two neighbouring faces one face or at least 30° apart (B6); with `goals` (the part's goal turn), no face within 15° of 45° of elevation;
 * * **R2** — a face over a FLAT real face ON it (`PROXY_FLUSH_MM`); a face over a CURVE spans at most ±30° of it (the hexagon's half step) — its
 *   sagitta exempt. A CAP (`_cap` in its name) exempt from R2. No render meshes: R2 not read.
 */
export function checkProxyFaces(parts: readonly PartSolids[], goals?: ReadonlyMap<string, Placement>): ProxyFinding[] {
  const out: ProxyFinding[] = [];
  for (const part of parts) {
    const faces = proxyFaceModels(part);
    // R7 — one planar face a node
    for (const f of faces) if (f.n === null || f.spread > R7_PLANAR_DEG) out.push({ rule: "R7", part: part.id, node: f.name, detail: `not ONE planar face: its triangles' normals ${f.spread.toFixed(1)}° apart (${R7_PLANAR_DEG}° at most) — a face its own node` });
    const planar = faces.filter((f) => f.n !== null && f.spread <= R7_PLANAR_DEG);
    // neighbours: two faces sharing a boundary edge
    const byEdge = new Map<string, number[]>();
    planar.forEach((f, i) => { for (const [e] of f.boundary) byEdge.set(e, [...(byEdge.get(e) ?? []), i]); });
    const nbrs = planar.map(() => new Set<number>());
    for (const ids of byEdge.values()) for (const i of ids) for (const j of ids) if (i !== j) nbrs[i]!.add(j);
    // R4 — neighbours one face or ≥ 30° apart (each pair once); R7 — a face split into coplanar nodes
    planar.forEach((f, i) => {
      for (const j of nbrs[i]!) {
        if (j <= i) continue;
        const g = planar[j]!;
        if (f.cap || g.cap) continue; // a virtual face (a cap flush with its rim, a resting proxy) is no split of a real one, no pair to space
        const a = angleDeg(f.n!, g.n!);
        if (a <= R7_PLANAR_DEG) out.push({ rule: "R7", part: part.id, node: `${f.name} + ${g.name}`, detail: `coplanar neighbours (${a.toFixed(1)}°): one face split in two nodes` });
        else if (a < B6_APART_DEG - 1e-3) out.push({ rule: "R4", part: part.id, node: `${f.name} + ${g.name}`, detail: `neighbours ${a.toFixed(1)}° apart: one face, or ${B6_APART_DEG}° at least (B6)` });
      }
    });
    // R4 — the elevation at the goal (the scene's y up)
    const g = goals?.get(part.id);
    if (g !== undefined)
      for (const f of planar) {
        const ns = qRot(g.rotation, f.n!);
        const el = (Math.asin(Math.max(-1, Math.min(1, ns[1]))) * 180) / Math.PI;
        if (Math.abs(Math.abs(el) - 45) < B6_ELEVATION_BAND_DEG - 1e-3) out.push({ rule: "R4", part: part.id, node: f.name, detail: `its elevation at the goal ${el.toFixed(1)}°: within ${B6_ELEVATION_BAND_DEG}° of 45° (B6)` });
      }
    // R3 — the inscribed width (twice the largest distance from a point of the face to its boundary)
    planar.forEach((f, i) => {
      if (f.cap) return;
      let half = 0;
      for (const [A, B, C] of f.tris)
        for (let u = 1; u < 12; u++)
          for (let v = 1; u + v < 12; v++) {
            const p: Vec3 = [A[0] + (B[0] - A[0]) * (u / 12) + (C[0] - A[0]) * (v / 12), A[1] + (B[1] - A[1]) * (u / 12) + (C[1] - A[1]) * (v / 12), A[2] + (B[2] - A[2]) * (u / 12) + (C[2] - A[2]) * (v / 12)];
            let d = Infinity;
            for (const [, e] of f.boundary) d = Math.min(d, pointSegment(p, e.a, e.b));
            half = Math.max(half, d);
          }
      const w = 2 * half;
      if (w >= PROXY_FACE_MIN_MM) return;
      const ns = [...nbrs[i]!].map((j) => planar[j]!.n!);
      const riser = ns.some((a, x) => ns.some((b, y) => y > x && angleDeg(a, b) < 20 && angleDeg(a, f.n!) > 60 && angleDeg(b, f.n!) > 60));
      if (riser) out.push({ rule: "R3", part: part.id, node: f.name, detail: `a RISER ${w.toFixed(1)} mm (an S26 step between two parallel faces) — information`, info: true });
      else out.push({ rule: "R3", part: part.id, node: f.name, detail: `${w.toFixed(1)} mm across: under ${PROXY_FACE_MIN_MM} mm (a face the gizmo travels)` });
    });
    // R2 — each face against the real surface (the render meshes)
    if (part.renders.length === 0) continue;
    const rtris = part.renders.flatMap((r) => r.triangles.map(([a, b, c]) => [r.points[a]!, r.points[b]!, r.points[c]!] as [Vec3, Vec3, Vec3]));
    const grid = triGrid(rtris, 8);
    const rn = rtris.map(([a, b, c]) => triNormal(a, b, c));
    // ⭐ (§7.1 row 4) the outer surface is the render CLOSED at ρ: a face failing against the render is re-read with the samples skipped where the
    // render is FAR along its normal (none within a step + τ) while the closing lies right under it (one step in) — a face spanning a slot under 2ρ is ON
    // the outer surface; over an open slot (the closing open under its middle) or a real face (the render near), still judged. Built once, lazily.
    let bridged: ((p: Vec3) => boolean) | null = null;
    for (const f of planar) {
      if (f.cap) continue;
      let { dMax, flat, span, lost } = fidelityOf(f, grid, rn);
      if (lost || (flat && dMax > PROXY_FLUSH_MM) || (!flat && span > R4_HALF_STEP_DEG)) {
        const inC = (bridged ??= insideClosing(rtris));
        const n = f.n!;
        const overBridge = (p: Vec3) => grid.cast(p, n, COVER_STEP_MM + PROXY_CURVE_TOL_MM) === null && inC([p[0] - n[0] * COVER_STEP_MM, p[1] - n[1] * COVER_STEP_MM, p[2] - n[2] * COVER_STEP_MM]);
        ({ dMax, flat, span, lost } = fidelityOf(f, grid, rn, overBridge));
      }
      if (lost) out.push({ rule: "R2", part: part.id, node: f.name, detail: `no real surface along its normal within 256 mm (a face floating)` });
      else if (flat && dMax > PROXY_FLUSH_MM) out.push({ rule: "R2", part: part.id, node: f.name, detail: `${dMax.toFixed(2)} mm off its FLAT real face (ON it: ${PROXY_FLUSH_MM} mm at most)` });
      else if (!flat && span > R4_HALF_STEP_DEG) out.push({ rule: "R2", part: part.id, node: f.name, detail: `the real surface under it turns ±${span.toFixed(0)}° from it (a curve's facet ±${R4_HALF_STEP_DEG}° at most; near 90°: it lies over an opening or a side; near 180°: it faces in)` });
    }
  }
  return out;
}
/** ⭐ (S6) one proxy node as a FACE: its triangles, its mean normal, how far its triangles' normals spread, its boundary edges, virtual or real */
export interface ProxyFaceModel {
  readonly name: string;
  readonly tris: readonly [Vec3, Vec3, Vec3][];
  readonly n: Vec3 | null;
  readonly spread: number;
  readonly boundary: readonly [string, { readonly a: Vec3; readonly b: Vec3; readonly n: number }][];
  readonly cap: boolean;
}
/** ⭐ (S6) each proxy node of a part read as a face (packets 1 and 2) */
export function proxyFaceModels(part: PartSolids): ProxyFaceModel[] {
  const kp = (p: Vec3) => `${p[0].toFixed(3)},${p[1].toFixed(3)},${p[2].toFixed(3)}`;
  return part.proxy.map((px) => {
    const tris = px.triangles.map(([a, b, c]) => [px.points[a]!, px.points[b]!, px.points[c]!] as [Vec3, Vec3, Vec3]);
    let nx = 0, ny = 0, nz = 0;
    for (const [A, B, C] of tris) {
      const cr = cross(sub(B, A), sub(C, A));
      (nx += cr[0]), (ny += cr[1]), (nz += cr[2]);
    }
    const n = unit([nx, ny, nz]);
    let spread = 0;
    for (const [A, B, C] of tris) {
      const m = triNormal(A, B, C);
      if (m !== null && n !== null) spread = Math.max(spread, angleDeg(m, n));
    }
    // its boundary: the edges of one triangle only
    const edges = new Map<string, { a: Vec3; b: Vec3; n: number }>();
    for (const [A, B, C] of tris)
      for (const [x, y] of [[A, B], [B, C], [C, A]] as const) {
        const kx = kp(x), ky = kp(y);
        const e = kx < ky ? `${kx}|${ky}` : `${ky}|${kx}`;
        const got = edges.get(e);
        if (got === undefined) edges.set(e, { a: x, b: y, n: 1 });
        else got.n++;
      }
    const boundary = [...edges.entries()].filter(([, e]) => e.n === 1);
    return { name: px.name, tris, n, spread, boundary, cap: isVirtualProxy(px.name) };
  });
}
/**
 * ⭐ (S6, R2) a face against the real surface under it (the render meshes' grid `grid`, their normals `rn`): `dMax` the farthest the real surface lies
 * along its normal, `flat` every sample over a real face of its own normal, `span` how far the real surface's normals turn from it, `lost` a sample
 * with no real surface along its normal within 256 mm
 */
export function fidelityOf(f: ProxyFaceModel, grid: ReturnType<typeof triGrid>, rn: readonly (Vec3 | null)[], skip?: (p: Vec3) => boolean, reach = 256): { dMax: number; flat: boolean; span: number; lost: boolean } {
  let dMax = 0, flat = true, span = 0, lost = false;
  // the samples over the WHOLE face — to within 2 % of its edges (a facet's span is read at its edges, never only round its middle)
  for (const [A, B, C] of f.tris)
    for (let u = 0; u <= 6; u++)
      for (let v = 0; u + v <= 6; v++) {
        const g3 = (k: number) => (A[k]! + B[k]! + C[k]!) / 3;
        const q = (k: number) => A[k]! + (B[k]! - A[k]!) * (u / 6) + (C[k]! - A[k]!) * (v / 6);
        const p: Vec3 = [q(0) + (g3(0) - q(0)) * 0.02, q(1) + (g3(1) - q(1)) * 0.02, q(2) + (g3(2) - q(2)) * 0.02];
        if (skip?.(p)) continue; // (S6 packet 3) a sample the caller does not judge (a collision face's samples inside the part)
        // ⭐ the real surface UNDER the point: the render meshes met along the face's normal, either side (never the nearest triangle: a thin wall's
        // underside, a side face at an edge)
        // ON a real face of its own normal (within the flush) — at a round rim too: flat there, no cast (a grazing ray meets the rim's side)
        const on = grid.nearest(p, PROXY_FLUSH_MM);
        if (on !== null && rn[on.t] != null && angleDeg(rn[on.t]!, f.n!) <= R7_PLANAR_DEG) {
          dMax = Math.max(dMax, on.d);
          continue;
        }
        let hit = grid.cast(p, f.n!, 4);
        for (let r = 16; hit === null && r <= reach; r *= 4) hit = grid.cast(p, f.n!, r);
        // a sample past the real face's rim by less than τ (two round outlines' tessellations — the 11-13 notes) is the rim, not a face floating
        if (hit === null) {
          if (grid.nearest(p, PROXY_CURVE_TOL_MM) === null) lost = true;
          continue;
        }
        dMax = Math.max(dMax, hit.d);
        const m = rn[hit.t];
        if (m === null || m === undefined) continue;
        const a = angleDeg(m, f.n!);
        if (a > R7_PLANAR_DEG) flat = false;
        span = Math.max(span, a);
      }
  return { dMax, flat, span, lost };
}
/** the distance from `p` to the segment (a, b) */
export function pointSegment(p: Vec3, a: Vec3, b: Vec3): number {
  const ab = sub(b, a), ap = sub(p, a);
  const L = dot(ab, ab);
  const t = L > 0 ? Math.max(0, Math.min(1, dot(ap, ab) / L)) : 0;
  return Math.hypot(ap[0] - ab[0] * t, ap[1] - ab[1] * t, ap[2] - ab[2] * t);
}

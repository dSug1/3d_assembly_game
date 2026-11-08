/**
 * ⭐⭐⭐ (2026-11-08, `TILTED_ORBIT_REBUILD_SCOPE.md` §32 — the owner: *"we limit the red and green contours and the gizmo only: 1) when the piece is close in …
 * 2) those green and red contours are limited to a small surface locally … the gizmo shall be always at the intersection of the green and red and
 * correspond to where the piece would land at the end of the A + dy approach during close in … If a jump/back-and-forth/etc. would occur within the
 * limited surface, the limited surface shall exclude this singularity"*) **THE CLOSE-IN CHART** — engine-free.
 *
 * The orbit's place P travels the shell (built, untouched). Close in, ONE chart is anchored and frozen: the shell facet P is on, its outward normal `n`, its
 * frame (`t` the green's way, `b` the red's), the anchor `P0` on the shell plane. Inside the chart the gizmo is a FUNCTION of the place:
 *   G(P) = the place `P + shift` (C1) carried straight in along `−n` onto the real parts — read off a height grid (`h` m cells, the depth of the first part
 *   surface below the shell plane, bilinear between the region's cells).
 * * K1 — THE CASTS are exact, against each placed part's convex hull (its half-spaces from its model-pose vertices, `hullPlanes`) — no engine, no sway.
 * * K2 — THE ACCEPTED LANDINGS of a facet (the boot pass, per placed set — `facetAccept`): a coarse grid cast over the facet; the landings connected to the
 *   facet's outermost ones by steps under `COARSE_TOL_M` are its own; the deepest of them + `ACCEPT_MARGIN_M` is the facet's depth limit. A landing deeper
 *   (a protrusion 48 cm below a top, seen past its edge) is no landing.
 * * K3 — THE REGION: the cells reached from the anchor's cell by steps of at most `STEP_TOL_M` between neighbours, each landing accepted (K2) and inside the
 *   facet's extent — so continuous by construction: a step, a void, a landing refused, the facet's edge end it (the singularities stay OUTSIDE).
 * * K4 — A RECESS OR GAP NARROWER THAN THE PIECE (`bridgeM`) is bridged level-to-level along the way it was met (§30 D7 / Q1c): its cells take the depth
 *   interpolated between the two rims — the gizmo passes over it; a wider one ends the region (reached by anchoring over it).
 * * K5 — THE ANCHOR (C1 (a)): P's own landing when accepted; else the facet's nearest accepted coarse landing, the chart SHIFTED so the place gives it.
 * * K6 — THE STOP: a place whose nearest cell is not in the region is refused (the caller cuts the finger's step back to the region's edge).
 * * K7 — THE LINES: through G along `t` (green) and along `b` (red), each in its plane `(t, n)` / `(b, n)` through G — exact planes — as far as the region
 *   goes, at most `lineHalf` each side; G a vertex of both by construction.
 * * K8 — THE OUTLINE: the region's border, cell by cell, at each cell's depth (drawn to show where the place can go close in).
 * The grid is filled lazily (breadth first from the anchor, a cast budget per call) — cells not yet reached refuse the place (K6) until they are.
 * ⛔ ENGINE-FREE. Half-space ray clipping, flood fill, bilinear interpolation — textbook; no licence, no patent.
 */
import { cross, dot, normalize, type Vec3 } from "../core/vec";

/** ⭐ A convex part as half-spaces `n·x ≤ d`, its box and its id. */
export interface HullPart {
  readonly id: string | null;
  readonly planes: readonly { readonly n: Vec3; readonly d: number }[];
  readonly lo: Vec3;
  readonly hi: Vec3;
}

/** ⭐ A cast's hit: the distance along the ray, the point, the entering face's normal, the part. */
export interface HullHit {
  readonly s: number;
  readonly point: Vec3;
  readonly normal: Vec3;
  readonly id: string | null;
}

const PLANE_EPS = 1e-7;

/**
 * ⭐ K1 — THE HALF-SPACES OF A CONVEX POINT SET (its hull's face planes, outward): every plane through three of its points with every point on its inner side,
 * once each. Brute force — the parts are boxes and frusta (8 vertices; ≤ 64 by the shape's reduction).
 */
export function hullPlanes(pts: readonly Vec3[]): { readonly n: Vec3; readonly d: number }[] {
  const out: { n: Vec3; d: number }[] = [];
  const m = pts.length;
  let scale = 0;
  for (const p of pts) scale = Math.max(scale, Math.abs(p[0]), Math.abs(p[1]), Math.abs(p[2]));
  const eps = PLANE_EPS * Math.max(1, scale);
  for (let i = 0; i < m; i++)
    for (let j = i + 1; j < m; j++)
      for (let k = j + 1; k < m; k++) {
        const a = pts[i]!;
        const ab: Vec3 = [pts[j]![0] - a[0], pts[j]![1] - a[1], pts[j]![2] - a[2]];
        const ac: Vec3 = [pts[k]![0] - a[0], pts[k]![1] - a[1], pts[k]![2] - a[2]];
        const nn = normalize(cross(ab, ac));
        if (nn === null) continue;
        let n = nn;
        let d = dot(n, a);
        let above = 0;
        let below = 0;
        for (const p of pts) {
          const s = dot(n, p) - d;
          if (s > eps) above++;
          else if (s < -eps) below++;
          if (above > 0 && below > 0) break;
        }
        if (above > 0 && below > 0) continue;
        if (above > 0) {
          n = [-n[0], -n[1], -n[2]];
          d = -d;
        }
        if (out.some((q) => dot(q.n, n) > 1 - 1e-9 && Math.abs(q.d - d) < eps * 10)) continue;
        out.push({ n, d });
      }
  return out;
}

/** ⭐ K1 — the parts a chart casts against: each convex point set's half-spaces and box. */
export function hullParts(parts: readonly (readonly Vec3[])[], ids: readonly (string | null)[]): HullPart[] {
  const out: HullPart[] = [];
  parts.forEach((pts, i) => {
    if (pts.length < 4) return;
    const lo: [number, number, number] = [Infinity, Infinity, Infinity];
    const hi: [number, number, number] = [-Infinity, -Infinity, -Infinity];
    for (const p of pts)
      for (let a = 0; a < 3; a++) {
        lo[a] = Math.min(lo[a]!, p[a]!);
        hi[a] = Math.max(hi[a]!, p[a]!);
      }
    const planes = hullPlanes(pts);
    if (planes.length >= 4) out.push({ id: ids[i] ?? null, planes, lo, hi });
  });
  return out;
}

/** ⭐ K1 — THE FIRST PART SURFACE along the ray `o + s·dir` (`dir` unit, `0 ≤ s ≤ len`): half-space clipping of each part (its box first); none: `null`. */
export function castHulls(parts: readonly HullPart[], o: Vec3, dir: Vec3, len: number): HullHit | null {
  let best: HullHit | null = null;
  for (const P of parts) {
    // the box first (slabs)
    let t0 = 0;
    let t1 = best === null ? len : best.s;
    let ok = true;
    for (let a = 0; a < 3 && ok; a++) {
      const da = dir[a]!;
      if (Math.abs(da) < 1e-12) {
        if (o[a]! < P.lo[a]! - 1e-9 || o[a]! > P.hi[a]! + 1e-9) ok = false;
      } else {
        let ta = (P.lo[a]! - o[a]!) / da;
        let tb = (P.hi[a]! - o[a]!) / da;
        if (ta > tb) [ta, tb] = [tb, ta];
        t0 = Math.max(t0, ta - 1e-9);
        t1 = Math.min(t1, tb + 1e-9);
        if (t0 > t1) ok = false;
      }
    }
    if (!ok) continue;
    let enter = -Infinity;
    let exit = Infinity;
    let nIn: Vec3 | null = null;
    for (const q of P.planes) {
      const nd = dot(q.n, dir);
      const no = dot(q.n, o);
      if (Math.abs(nd) < 1e-12) {
        if (no > q.d + 1e-9) {
          enter = Infinity;
          break;
        }
        continue;
      }
      const s = (q.d - no) / nd;
      if (nd < 0) {
        if (s > enter) {
          enter = s;
          nIn = q.n;
        }
      } else if (s < exit) exit = s;
    }
    if (!(enter <= exit) || !Number.isFinite(enter) || nIn === null) continue;
    const s = Math.max(0, enter);
    if (s > len || (best !== null && s >= best.s)) continue;
    best = { s, point: [o[0] + dir[0] * s, o[1] + dir[1] * s, o[2] + dir[2] * s], normal: nIn, id: P.id };
  }
  return best;
}

/** ⭐ A shell facet as the chart reads it: its outward normal, frame, shell plane (`n·p = es`) and extent along `t` and `b`. */
export interface ChartFacet {
  readonly n: Vec3;
  readonly t: Vec3;
  readonly b: Vec3;
  readonly es: number;
  readonly tLo: number;
  readonly tHi: number;
  readonly bLo: number;
  readonly bHi: number;
}

/** ⭐ K2's coarse cell (m). */
export const COARSE_M = 0.01;
/** ⭐ K2 — a step between coarse neighbours at most this keeps a landing the facet's own (m): a part proud of its neighbour, not a protrusion far below. */
export const COARSE_TOL_M = 0.04;
/** ⭐ K2 — the facet's depth limit: its own landings' deepest + this (m) — the margin to be on the safe side. */
export const ACCEPT_MARGIN_M = 0.01;
/** ⭐ The cast starts this far outside the shell plane (m). */
export const CAST_OUT_M = 0.02;

/** ⭐ K2 — a facet's accepted landings: its depth limit (m below the shell plane) and its accepted coarse cells (their `t`, `b` coordinates and depth). */
export interface FacetAccept {
  readonly maxDepth: number;
  readonly cells: readonly { readonly u: number; readonly v: number; readonly depth: number }[];
  readonly casts: number;
}

/** ⭐ The cast through the shell point at `(u, v)` (`t`, `b` coordinates) straight in along `−n`, as deep as `len`; its depth below the shell plane. */
function castAt(parts: readonly HullPart[], f: ChartFacet, u: number, v: number, len: number): { depth: number; hit: HullHit } | null {
  const o: Vec3 = [
    f.t[0] * u + f.b[0] * v + f.n[0] * (f.es + CAST_OUT_M),
    f.t[1] * u + f.b[1] * v + f.n[1] * (f.es + CAST_OUT_M),
    f.t[2] * u + f.b[2] * v + f.n[2] * (f.es + CAST_OUT_M),
  ];
  const h = castHulls(parts, o, [-f.n[0], -f.n[1], -f.n[2]], len + CAST_OUT_M);
  return h === null ? null : { depth: h.s - CAST_OUT_M, hit: h };
}

/** ⭐ How deep a cast must reach through the parts along `−n` from the shell plane (m). */
export function castDepth(parts: readonly HullPart[], f: ChartFacet): number {
  let lo = Infinity;
  for (const P of parts) {
    const s = Math.min(...[0, 1, 2, 3, 4, 5, 6, 7].map((c) => f.n[0] * (c & 1 ? P.hi[0] : P.lo[0]) + f.n[1] * (c & 2 ? P.hi[1] : P.lo[1]) + f.n[2] * (c & 4 ? P.hi[2] : P.lo[2])));
    lo = Math.min(lo, s);
  }
  return Number.isFinite(lo) ? Math.max(0, f.es - lo) + 0.01 : 0;
}

/**
 * ⭐⭐⭐ K2 — THE BOOT PASS for one facet: a coarse grid of casts; the landings connected (4-neighbours, steps ≤ `COARSE_TOL_M`) to the OUTERMOST ones (within
 * `COARSE_TOL_M` of the shallowest) are the facet's own; its depth limit their deepest + `ACCEPT_MARGIN_M`.
 */
export function facetAccept(parts: readonly HullPart[], f: ChartFacet, cell: number = COARSE_M): FacetAccept {
  const nu = Math.max(1, Math.round((f.tHi - f.tLo) / cell));
  const nv = Math.max(1, Math.round((f.bHi - f.bLo) / cell));
  const du = (f.tHi - f.tLo) / nu;
  const dv = (f.bHi - f.bLo) / nv;
  const len = castDepth(parts, f);
  const depth: (number | null)[] = [];
  let shallow = Infinity;
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const c = castAt(parts, f, f.tLo + (i + 0.5) * du, f.bLo + (j + 0.5) * dv, len);
      depth.push(c === null ? null : c.depth);
      if (c !== null) shallow = Math.min(shallow, c.depth);
    }
  const own = new Uint8Array(nu * nv);
  const queue: number[] = [];
  depth.forEach((d, k) => {
    if (d !== null && d <= shallow + COARSE_TOL_M) {
      own[k] = 1;
      queue.push(k);
    }
  });
  while (queue.length > 0) {
    const k = queue.pop()!;
    const i = k % nu;
    const j = (k - i) / nu;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const a = i + di;
      const b = j + dj;
      if (a < 0 || b < 0 || a >= nu || b >= nv) continue;
      const q = b * nu + a;
      const dq = depth[q];
      if (own[q] === 1 || dq === null || dq === undefined || Math.abs(dq - depth[k]!) > COARSE_TOL_M) continue;
      own[q] = 1;
      queue.push(q);
    }
  }
  let maxDepth = -Infinity;
  const cells: { u: number; v: number; depth: number }[] = [];
  depth.forEach((d, k) => {
    if (own[k] !== 1 || d === null) return;
    maxDepth = Math.max(maxDepth, d);
    const i = k % nu;
    cells.push({ u: f.tLo + (i + 0.5) * du, v: f.bLo + ((k - i) / nu + 0.5) * dv, depth: d });
  });
  return { maxDepth: Number.isFinite(maxDepth) ? maxDepth + ACCEPT_MARGIN_M : -Infinity, cells, casts: nu * nv };
}

/** ⭐ K3's cell (m), the step allowed between neighbours (m — a slope to ~50° on 2.5 mm). */
export const CELL_M = 0.0025;
export const STEP_TOL_M = 0.003;
/** ⭐ The casts a chart (or the atlas's background fill) may spend per call, and the cells a chart's flood may visit per call (cast-free from the atlas). */
export const CASTS_PER_FILL = 600;
export const VISITS_PER_FILL = 40000;

/**
 * ⭐⭐⭐ (2026-11-08, §32.10 — the owner: *"I was expecting a ring which directly shows up and encompasses the limited area when the piece crosses the
 * offset"*) THE ATLAS'S GRID of one facet: every `CELL_M` node of the facet's extent cast once, in the background, frame after frame (`fillGrid`), after
 * the boot pass — so a chart anchored on it floods the cached landings with no cast: its region whole in the frame close in is entered.
 */
export interface FacetGrid {
  readonly f: ChartFacet;
  readonly nu: number;
  readonly nv: number;
  readonly len: number;
  /** 0 not cast yet, 1 a landing, 2 none */
  readonly state: Uint8Array;
  readonly depth: Float32Array;
  readonly normal: Float32Array;
  readonly id: (string | null)[];
  next: number;
}

/** ⭐ A facet's atlas grid, nothing cast yet. */
export function facetGrid(parts: readonly HullPart[], f: ChartFacet): FacetGrid {
  const nu = Math.max(1, Math.floor((f.tHi - f.tLo) / CELL_M + 1e-9) + 1);
  const nv = Math.max(1, Math.floor((f.bHi - f.bLo) / CELL_M + 1e-9) + 1);
  const n = nu * nv;
  return { f, nu, nv, len: castDepth(parts, f), state: new Uint8Array(n), depth: new Float32Array(n), normal: new Float32Array(3 * n), id: new Array<string | null>(n).fill(null), next: 0 };
}

/** ⭐ Cast the grid's node `k` (stored). */
function castNode(G: FacetGrid, parts: readonly HullPart[], k: number): void {
  const a = k % G.nu;
  const b = (k - a) / G.nu;
  const c = castAt(parts, G.f, G.f.tLo + a * CELL_M, G.f.bLo + b * CELL_M, G.len);
  if (c === null) G.state[k] = 2;
  else {
    G.state[k] = 1;
    G.depth[k] = c.depth;
    G.normal[3 * k] = c.hit.normal[0];
    G.normal[3 * k + 1] = c.hit.normal[1];
    G.normal[3 * k + 2] = c.hit.normal[2];
    G.id[k] = c.hit.id;
  }
}

/** ⭐ The background fill: up to `budget` nodes cast in order (those a chart already cast skipped). Returns the casts spent. */
export function fillGrid(G: FacetGrid, parts: readonly HullPart[], budget: number = CASTS_PER_FILL): number {
  let n = 0;
  while (G.next < G.state.length && n < budget) {
    if (G.state[G.next] === 0) {
      castNode(G, parts, G.next);
      n++;
    }
    G.next++;
  }
  return n;
}

/** ⭐ Is the whole grid cast? */
export function gridDone(G: FacetGrid): boolean {
  return G.next >= G.state.length;
}

/** ⭐ A region cell: its depth below the shell plane, its part and face normal (`null` over a bridge — K4). */
interface Cell {
  readonly depth: number;
  readonly id: string | null;
  readonly normal: Vec3 | null;
}

/** ⭐⭐⭐ THE CHART: the facet's frame, the anchor's coordinates, the shift (K5), the region's cells, the raw casts, the fill's frontier. */
export interface Chart {
  readonly facet: number;
  readonly f: ChartFacet;
  /** the anchor cell's `t`, `b` coordinates (the grid's origin) */
  readonly u0: number;
  readonly v0: number;
  /** K5 — the place's `t`, `b` coordinates are read `+ shift` */
  readonly shift: readonly [number, number];
  readonly maxDepth: number;
  readonly bridgeM: number;
  readonly len: number;
  readonly cells: Map<number, Cell>;
  readonly raw: Map<number, { depth: number; id: string | null; normal: Vec3 } | null>;
  readonly queue: number[];
  head: number;
  /** grows with every cell added (the outline redrawn on a change) */
  version: number;
  /** §32.10 the facet's atlas grid the chart reads (its cell (0, 0) the grid's node (`gi0`, `gj0`)), `null`: its own casts; the casts it spent */
  readonly grid: FacetGrid | null;
  readonly gi0: number;
  readonly gj0: number;
  casts: number;
  /** ⭐⭐⭐ §32.10 THE RING, cast when close in is entered and fixed until it is left: its centre (the gizmo then — chart coordinates) and radius (m); the
   *  close-in area is the region INSIDE it (Infinity: no ring) */
  readonly cu: number;
  readonly cv: number;
  readonly ringR: number;
}

const OFF = 32768;
const keyOf = (i: number, j: number): number => (i + OFF) * 65536 + (j + OFF);
const ijOf = (k: number): [number, number] => {
  const j = (k % 65536) - OFF;
  return [Math.round((k - (j + OFF)) / 65536) - OFF, j];
};

/** ⭐ (§32.10) Is the chart's cell (i, j) inside its ring? */
function inRing(C: Chart, i: number, j: number): boolean {
  return Math.hypot(C.u0 + i * CELL_M - C.cu, C.v0 + j * CELL_M - C.cv) <= C.ringR;
}

/** ⭐ The place's `t`, `b` coordinates on the chart's facet (the shift applied — K5). */
export function chartUV(C: Chart, p: Vec3): [number, number] {
  return [dot(p, C.f.t) + C.shift[0], dot(p, C.f.b) + C.shift[1]];
}

function rawAt(C: Chart, parts: readonly HullPart[], i: number, j: number): { depth: number; id: string | null; normal: Vec3 } | null {
  const G = C.grid;
  if (G !== null) {
    const a = C.gi0 + i;
    const b = C.gj0 + j;
    if (a < 0 || b < 0 || a >= G.nu || b >= G.nv) return null;
    const g = b * G.nu + a;
    if (G.state[g] === 0) {
      castNode(G, parts, g);
      C.casts++;
    }
    if (G.state[g] !== 1 || G.depth[g]! > C.maxDepth) return null;
    return { depth: G.depth[g]!, id: G.id[g] ?? null, normal: [G.normal[3 * g]!, G.normal[3 * g + 1]!, G.normal[3 * g + 2]!] };
  }
  const k = keyOf(i, j);
  if (C.raw.has(k)) return C.raw.get(k)!;
  const u = C.u0 + i * CELL_M;
  const v = C.v0 + j * CELL_M;
  let r: { depth: number; id: string | null; normal: Vec3 } | null = null;
  if (u >= C.f.tLo - 1e-9 && u <= C.f.tHi + 1e-9 && v >= C.f.bLo - 1e-9 && v <= C.f.bHi + 1e-9) {
    const c = castAt(parts, C.f, u, v, C.len);
    C.casts++;
    if (c !== null && c.depth <= C.maxDepth) r = { depth: c.depth, id: c.hit.id, normal: c.hit.normal };
  }
  C.raw.set(k, r);
  return r;
}

/**
 * ⭐⭐⭐ K5 — ANCHOR A CHART at the place `p` on facet `fi`: P's own landing when accepted (K2), else the nearest accepted coarse landing (the chart shifted so
 * the place gives it). `null`: the facet has no accepted landing.
 */
export function anchorChart(parts: readonly HullPart[], fi: number, f: ChartFacet, acc: FacetAccept, p: Vec3, bridgeM: number, grid: FacetGrid | null = null, ringR: number = Infinity): Chart | null {
  if (!Number.isFinite(acc.maxDepth) || acc.cells.length === 0) return null;
  const len = grid?.len ?? castDepth(parts, f);
  const pu = dot(p, f.t);
  const pv = dot(p, f.b);
  // §32.10 on an atlas grid the chart's cells ARE its nodes: the origin snapped to the nearest node
  const mk = (uu: number, vv: number, shift: [number, number]): Chart => {
    const ring = { cu: pu + shift[0], cv: pv + shift[1], ringR };
    if (grid === null) return { facet: fi, f, u0: uu, v0: vv, shift, maxDepth: acc.maxDepth, bridgeM, len, cells: new Map(), raw: new Map(), queue: [], head: 0, version: 0, grid: null, gi0: 0, gj0: 0, casts: 0, ...ring };
    const gi0 = Math.max(0, Math.min(grid.nu - 1, Math.round((uu - f.tLo) / CELL_M)));
    const gj0 = Math.max(0, Math.min(grid.nv - 1, Math.round((vv - f.bLo) / CELL_M)));
    return { facet: fi, f, u0: f.tLo + gi0 * CELL_M, v0: f.bLo + gj0 * CELL_M, shift, maxDepth: acc.maxDepth, bridgeM, len, cells: new Map(), raw: new Map(), queue: [], head: 0, version: 0, grid, gi0, gj0, casts: 0, ...ring };
  };
  const inside = pu >= f.tLo && pu <= f.tHi && pv >= f.bLo && pv <= f.bHi;
  let C: Chart | null = null;
  if (inside) {
    const c = mk(pu, pv, [0, 0]);
    const r = rawAt(c, parts, 0, 0);
    if (r !== null) C = c;
  }
  if (C === null) {
    let best = acc.cells[0]!;
    let bd = Infinity;
    for (const c of acc.cells) {
      const d = Math.hypot(c.u - pu, c.v - pv);
      if (d < bd) {
        bd = d;
        best = c;
      }
    }
    C = mk(best.u, best.v, [best.u - pu, best.v - pv]);
    if (rawAt(C, parts, 0, 0) === null) return null;
  }
  const r0 = rawAt(C, parts, 0, 0)!;
  C.cells.set(keyOf(0, 0), { depth: r0.depth, id: r0.id, normal: r0.normal });
  C.queue.push(keyOf(0, 0));
  C.version++;
  return C;
}

/**
 * ⭐⭐⭐ K3 – K4 — FILL THE REGION breadth first from the anchor, spending at most `budget` casts: a neighbour joins when its landing is accepted and within
 * `STEP_TOL_M` of the cell it is reached from; else a landing within `STEP_TOL_M` met further along the same way, no farther than `bridgeM`, bridges the cells
 * between (their depth interpolated — K4). Returns the casts spent.
 */
export function fillChart(C: Chart, parts: readonly HullPart[], budget: number = CASTS_PER_FILL, visits: number = VISITS_PER_FILL): number {
  const before = C.casts;
  const steps = Math.max(1, Math.ceil(C.bridgeM / CELL_M));
  let seen = 0;
  while (C.head < C.queue.length && C.casts - before < budget && seen++ < visits) {
    const k = C.queue[C.head]!;
    const [i, j] = ijOf(k);
    const c = C.cells.get(k)!;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const a = i + di;
      const b = j + dj;
      const q = keyOf(a, b);
      if (C.cells.has(q) || !inRing(C, a, b)) continue;
      const r = rawAt(C, parts, a, b);
      if (r !== null && Math.abs(r.depth - c.depth) <= STEP_TOL_M) {
        C.cells.set(q, { depth: r.depth, id: r.id, normal: r.normal });
        C.queue.push(q);
        C.version++;
        continue;
      }
      // K4 — a bridge: the first landing further along this way within STEP_TOL_M of this cell, no farther than the piece's width
      for (let m = 2; m <= steps; m++) {
        if (!inRing(C, i + di * m, j + dj * m)) break; // a bridge never leaves the ring
        const rm = rawAt(C, parts, i + di * m, j + dj * m);
        const km = keyOf(i + di * m, j + dj * m);
        if (rm === null) {
          // outside the facet: no bridge
          const u = C.u0 + (i + di * m) * CELL_M;
          const v = C.v0 + (j + dj * m) * CELL_M;
          if (u < C.f.tLo || u > C.f.tHi || v < C.f.bLo || v > C.f.bHi) break;
          continue;
        }
        if (Math.abs(rm.depth - c.depth) > STEP_TOL_M) {
          if (rm.depth < c.depth) break; // a wall standing up across the way — no bridge through a part
          continue;
        }
        for (let s = 1; s < m; s++) {
          const ks = keyOf(i + di * s, j + dj * s);
          if (C.cells.has(ks)) continue;
          C.cells.set(ks, { depth: c.depth + ((rm.depth - c.depth) * s) / m, id: null, normal: null });
          C.queue.push(ks);
        }
        if (!C.cells.has(km)) {
          C.cells.set(km, { depth: rm.depth, id: rm.id, normal: rm.normal });
          C.queue.push(km);
        }
        C.version++;
        break;
      }
    }
    C.head++;
  }
  return C.casts - before;
}

/** ⭐ Is the fill done (the whole region reached)? */
export function chartFilled(C: Chart): boolean {
  return C.head >= C.queue.length;
}

/** ⭐ K6 — may the place be at `(u, v)` (chart coordinates, shift applied)? Its nearest cell is in the region. */
export function chartAllows(C: Chart, u: number, v: number): boolean {
  return Math.hypot(u - C.cu, v - C.cv) <= C.ringR && C.cells.has(keyOf(Math.round((u - C.u0) / CELL_M), Math.round((v - C.v0) / CELL_M)));
}

/** ⭐ The gizmo's point at chart coordinates `(u, v)` — bilinear over the region's corner cells (their weights renormalised) — its normal and part. */
export function chartGizmo(C: Chart, u: number, v: number): { readonly point: Vec3; readonly normal: Vec3 | null; readonly host: string | null } | null {
  if (!chartAllows(C, u, v)) return null;
  const x = (u - C.u0) / CELL_M;
  const y = (v - C.v0) / CELL_M;
  const i0 = Math.floor(x);
  const j0 = Math.floor(y);
  const fx = x - i0;
  const fy = y - j0;
  let w = 0;
  let d = 0;
  for (const [a, b, wt] of [[0, 0, (1 - fx) * (1 - fy)], [1, 0, fx * (1 - fy)], [0, 1, (1 - fx) * fy], [1, 1, fx * fy]] as const) {
    const c = C.cells.get(keyOf(i0 + a, j0 + b));
    if (c === undefined) continue;
    w += wt;
    d += wt * c.depth;
  }
  if (!(w > 1e-9)) return null;
  const depth = d / w;
  const near = C.cells.get(keyOf(Math.round(x), Math.round(y)))!;
  return { point: chartPoint(C, u, v, depth), normal: near.normal, host: near.id };
}

/** ⭐ The world point at chart coordinates `(u, v)` (the shift applied — the grid's frame) at `depth` below the shell plane. */
export function chartPoint(C: Chart, u: number, v: number, depth: number): Vec3 {
  const f = C.f;
  const k = f.es - depth;
  return [f.t[0] * u + f.b[0] * v + f.n[0] * k, f.t[1] * u + f.b[1] * v + f.n[1] * k, f.t[2] * u + f.b[2] * v + f.n[2] * k];
}

/**
 * ⭐⭐⭐ K7 — THE TWO LINES through the gizmo at `(u, v)`: along `t` (green) and `b` (red), sampled every cell, each as far as the region goes from the gizmo,
 * at most `half` m each side; G a vertex of both. Each point lies in its plane through G exactly.
 */
export function chartLines(C: Chart, u: number, v: number, half: number): { readonly green: Vec3[]; readonly red: Vec3[] } {
  const g = chartGizmo(C, u, v);
  if (g === null) return { green: [], red: [] };
  const run = (du: number, dv: number): Vec3[] => {
    const back: Vec3[] = [];
    const fwd: Vec3[] = [];
    for (const [sg, arr] of [[-1, back], [1, fwd]] as const) {
      for (let s = CELL_M; s <= half + 1e-9; s += CELL_M) {
        const q = chartGizmo(C, u + du * s * sg, v + dv * s * sg);
        if (q === null) break;
        arr.push(q.point);
      }
    }
    return [...back.reverse(), g.point, ...fwd];
  };
  return { green: run(1, 0), red: run(0, 1) };
}


/** ⭐ Marching squares' segments per corner code (bottom 0, right 1, top 2, left 3 — corners (i,j) 1, (i+1,j) 2, (i+1,j+1) 4, (i,j+1) 8; the saddles 5 and
 *  10 split: a diagonal pair is not 4-connected, as the flood is not). */
const MS_SEGMENTS: readonly (readonly (readonly [number, number])[])[] = [
  [], [[3, 0]], [[0, 1]], [[3, 1]], [[1, 2]], [[3, 0], [1, 2]], [[0, 2]], [[3, 2]],
  [[2, 3]], [[0, 2]], [[0, 1], [2, 3]], [[1, 2]], [[1, 3]], [[0, 1]], [[3, 0]], [],
];

/**
 * ⭐⭐⭐ (§32.10 — the owner: *"a ring which directly shows up and encompasses the limited area … the ring shall be always the same radius (slider to be
 * added) so the user feeling is better, unless the limited area is smaller than what the ring usually covers"*) K8 — THE RING: the border of the disk of
 * radius `R` round `(uc, vc)` (the gizmo) INSIDE the region — a circle where the region holds it, the region's own border where the region is nearer —
 * traced as closed contours by marching squares over the field `min(R − distance, ±half a cell)` (+ in the region, − outside): the circle interpolated
 * exactly, the region's border on its cells' edges; each point at the inside cell's depth; smoothed (Chaikin, `smooth` passes).
 */
export function chartRing(C: Chart, uc: number, vc: number, R: number, smooth: number = 1): Vec3[][] {
  if (C.cells.size === 0 || !(R > 0)) return [];
  const ci = (uc - C.u0) / CELL_M;
  const cj = (vc - C.v0) / CELL_M;
  const r = R / CELL_M;
  const i0 = Math.floor(ci - r) - 1;
  const i1 = Math.ceil(ci + r) + 1;
  const j0 = Math.floor(cj - r) - 1;
  const j1 = Math.ceil(cj + r) + 1;
  const F = (i: number, j: number): number => Math.min(r - Math.hypot(i - ci, j - cj), C.cells.has(keyOf(i, j)) ? 0.5 : -0.5);
  // the field's zero on the lattice edge from (ai,aj) to (bi,bj), at the inside end's depth (both inside: interpolated)
  const cross = (ai: number, aj: number, bi: number, bj: number): Vec3 => {
    const fa = F(ai, aj);
    const fb = F(bi, bj);
    const t = Math.max(0, Math.min(1, fa / (fa - fb)));
    const ca = C.cells.get(keyOf(ai, aj));
    const cb = C.cells.get(keyOf(bi, bj));
    const depth = ca !== undefined && cb !== undefined ? ca.depth + (cb.depth - ca.depth) * t : (ca ?? cb)!.depth;
    return chartPoint(C, C.u0 + (ai + (bi - ai) * t) * CELL_M, C.v0 + (aj + (bj - aj) * t) * CELL_M, depth);
  };
  // an edge of the lattice: the horizontal (i,j)–(i+1,j) is `2·key`, the vertical (i,j)–(i,j+1) `2·key + 1`
  const at = (e: number): Vec3 => {
    const [i, j] = ijOf(Math.floor(e / 2));
    return e % 2 === 0 ? cross(i, j, i + 1, j) : cross(i, j, i, j + 1);
  };
  const adj = new Map<number, number[]>();
  const link = (a: number, b: number): void => {
    let la = adj.get(a);
    if (la === undefined) adj.set(a, (la = []));
    la.push(b);
    let lb = adj.get(b);
    if (lb === undefined) adj.set(b, (lb = []));
    lb.push(a);
  };
  for (let i = i0; i < i1; i++)
    for (let j = j0; j < j1; j++) {
      const code = (F(i, j) > 0 ? 1 : 0) | (F(i + 1, j) > 0 ? 2 : 0) | (F(i + 1, j + 1) > 0 ? 4 : 0) | (F(i, j + 1) > 0 ? 8 : 0);
      const E = [keyOf(i, j) * 2, keyOf(i + 1, j) * 2 + 1, keyOf(i, j + 1) * 2, keyOf(i, j) * 2 + 1];
      for (const [a, b] of MS_SEGMENTS[code]!) link(E[a]!, E[b]!);
    }
  const loops: Vec3[][] = [];
  const used = new Set<number>();
  for (const start of adj.keys()) {
    if (used.has(start)) continue;
    let L: Vec3[] = [];
    let prev = -1;
    let cur = start;
    for (let guard = 0; guard <= adj.size; guard++) {
      used.add(cur);
      L.push(at(cur));
      const nb = adj.get(cur)!;
      const next = nb[0] !== prev ? nb[0]! : (nb[1] ?? nb[0]!);
      prev = cur;
      cur = next;
      if (cur === start) break;
    }
    for (let s = 0; s < smooth && L.length >= 3; s++) {
      const out: Vec3[] = [];
      for (let k = 0; k < L.length; k++) {
        const a = L[k]!;
        const b = L[(k + 1) % L.length]!;
        out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25, a[2] * 0.75 + b[2] * 0.25]);
        out.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75, a[2] * 0.25 + b[2] * 0.75]);
      }
      L = out;
    }
    loops.push(L);
  }
  return loops;
}

/** ⭐ The distance (m) from `(u, v)` to the region's border, searched up to `maxM` (beyond: `maxM`). */
export function chartEdgeDistance(C: Chart, u: number, v: number, maxM: number): number {
  const ci = Math.round((u - C.u0) / CELL_M);
  const cj = Math.round((v - C.v0) / CELL_M);
  const R = Math.ceil(maxM / CELL_M);
  // the ring's own border (§32.10) as well as the region's
  let best = Math.min(maxM, Math.max(0, C.ringR - Math.hypot(u - C.cu, v - C.cv)));
  for (let a = -R; a <= R; a++)
    for (let b = -R; b <= R; b++) {
      if (C.cells.has(keyOf(ci + a, cj + b))) continue;
      const d = Math.max(0, Math.hypot(a, b) * CELL_M - CELL_M / 2);
      if (d < best) best = d;
    }
  return best;
}

/**
 * ⭐⭐⭐ THE STOP (K6) on a step: the largest share (0 … 1) of a move from `a` to `b` (chart coordinates) whose end the chart allows — by halving; the
 * caller cuts the finger's step by it. 1: the whole step.
 */
export function allowedShare(ok: (t: number) => boolean, iterations: number = 8): number {
  if (ok(1)) return 1;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < iterations; i++) {
    const m = (lo + hi) / 2;
    if (ok(m)) lo = m;
    else hi = m;
  }
  return lo;
}

/** ⭐⭐ C1 — CLOSE IN: entered at `inM` from the shell, left only past `inM + CLOSE_IN_HYST_M` (no flicker at the boundary). */
export const CLOSE_IN_HYST_M = 0.03;
export function closeInNext(was: boolean, distM: number, inM: number): boolean {
  return was ? distM <= inM + CLOSE_IN_HYST_M : distM <= inM;
}

/** ⭐ C4 — the piece's direction close in: from the view `u` far out to the chart's normal `n` at the shell, smoothly (`s` = distance share 0 … 1). */
export function closeInDir(u: Vec3, n: Vec3, s: number): Vec3 {
  const k = Math.max(0, Math.min(1, s));
  const w = k * k * (3 - 2 * k);
  return normalize([n[0] + (u[0] - n[0]) * w, n[1] + (u[1] - n[1]) * w, n[2] + (u[2] - n[2]) * w]) ?? n;
}

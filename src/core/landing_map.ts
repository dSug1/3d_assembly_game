/**
 * ⭐⭐⭐ **THE LANDING MAP — layer L2, principle P2** (`ORBIT_SURFACE.md` §2.2, §5.1; the design: `ORBIT_SURFACE_LANDING_MAP.md`; package S1 of
 * `ORBIT_SURFACE_BUILD.md`, 2026-11-17 — the owner accepted the six layers, to be tested). ⛔ NOT WIRED: nothing in the game calls it yet.
 *
 * For one facet direction (a plane, its outward normal `n`, a region of the plane) and the held piece AS HELD, per place of a grid: the placed
 * parts' LAYERS along `n` (each stretch inside a part, outermost first) and the held piece's layers — the depths at which the piece, its reference
 * point over that place, overlaps a placed part. Its LANDING is the top of the outermost stretch (from outside), or the first top at or below a
 * given depth (from where the piece is), or NOTHING TO LAND ON (a kind with no depth).
 *
 * ⭐ EXACT for a rigid piece at a fixed orientation: the reference point overlaps a placed convex piece P exactly when it lies in P ⊕ (−H) (the
 * held convex piece H MIRRORED through the reference point) — the configuration-space obstacle of a translating body (Lozano-Pérez 1983), CAM's
 * drop cutter along one direction. Each sum is the intersection of the half-spaces whose normals are P's face normals, H's, and the cross products
 * of an edge of P with an edge of H (the facet structure of a Minkowski sum of convex polytopes, de Berg et al., Computational Geometry ch. 13),
 * each at the sum's support value: no hull of the sum, no sampling. Cast along `n`, a sum is one interval; the union of the intervals is the layers.
 *
 * Model coordinates, METRES; the grid's step in MILLIMETRES (`LANDING_STEP_MM`). Deterministic: every stretch keyed by its part's id (sorted by
 * code unit), ties to the smaller id — the input's order never reaches the result. Engine-free (`tests/boundary.test.ts`).
 */
import { convexHull3 } from "./hull3";
import { cross, dot, type Vec3 } from "./vec";

/** ⭐ The grid's step, millimetres (`ORBIT_SURFACE.md` §5.1). ⚠ Its home becomes `src/core/units.ts` when the map is wired (`ORBIT_SURFACE_BUILD.md` §6). */
export const LANDING_STEP_MM = 4;
const M_PER_MM = 0.001;
/** ⭐ Touching is not overlapping: a side must hold by more than this, a stretch be longer, to count (0.1 µm — the study's `1e-4 mm`). */
const TOUCH_M = 1e-7;
/** A unit normal's direction rounded to this for the de-duplication of half-spaces (a near-duplicate kept is harmless: it is a supporting plane). */
const KEY_DIGITS = 9;

/** One convex collision piece of a placed part: its points (the hull is taken); `id` the part's (the tie key). */
export interface ConvexPiece {
  readonly id: string;
  readonly points: readonly Vec3[];
}
/** The facet direction: `n` outward, `u`, `v` in its plane (orthonormal), `origin` on it; the region `u ∈ [uMin, uMax]`, `v ∈ [vMin, vMax]` (metres). */
export interface LandingFrame {
  readonly origin: Vec3;
  readonly u: Vec3;
  readonly v: Vec3;
  readonly n: Vec3;
  readonly uMin: number;
  readonly uMax: number;
  readonly vMin: number;
  readonly vMax: number;
}
/** A stretch of depth inside the obstacle along `n`: `top` where a ray from outside enters, `bottom` where it leaves (metres along `n`). */
export interface Layer {
  readonly top: number;
  readonly bottom: number;
  readonly part: string;
}
/** The landing at a place. ⭐ "Nothing to land on" carries NO depth: it can never be read as one. */
export type Landing =
  | { readonly kind: "land"; readonly depth: number; readonly part: string }
  | { readonly kind: "nothing" }
  | { readonly kind: "inside"; readonly part: string }
  | { readonly kind: "uncovered" };

export interface LandingMap {
  readonly frame: LandingFrame;
  readonly stepM: number;
  readonly nu: number;
  readonly nv: number;
  /** the pieces left out because they have no volume (named: a placed part's id, or `held#k`) */
  readonly refused: readonly string[];
  /** the place of sample `i` along `u`, of sample `j` along `v` (metres) */
  uAt(i: number): number;
  vAt(j: number): number;
  /** the placed parts' layers along the ray of sample (i, j), outermost first */
  partsLayers(i: number, j: number): readonly Layer[];
  /** the held piece's layers (its reference point's forbidden depths) at sample (i, j), outermost first */
  pieceLayers(i: number, j: number): readonly Layer[];
  /** the landing at sample (i, j): from outside, or from the depth `from` */
  landingSample(i: number, j: number, from?: number): Landing;
  /** ⭐ THE LOOKUP between samples: the cell's corners combined (`inside` first, then the highest `land`, ties the smaller id, then `nothing`) */
  landing(u: number, v: number, from?: number): Landing;
  /** ⭐ the EXACT landing at any place (one ray through the prepared sums) — bit for bit a sample's at its place */
  landingAt(u: number, v: number, from?: number): Landing;
  /** the two layer lists of the NEAREST sample (a tie: the lower index); `null` outside the region */
  layersNear(u: number, v: number): { readonly parts: readonly Layer[]; readonly piece: readonly Layer[] } | null;
}

interface Poly {
  readonly pts: readonly Vec3[];
  readonly normals: readonly Vec3[];
  readonly edges: readonly Vec3[];
}
/** one prepared sum: its part's index (in the sorted ids) and its half-spaces as (m·n, σ − m·origin, m·u, m·v); its rectangle on the plane */
interface Sum {
  readonly part: number;
  readonly hs: Float64Array;
  readonly uLo: number;
  readonly uHi: number;
  readonly vLo: number;
  readonly vHi: number;
}

const unitOf = (a: Vec3): Vec3 | null => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return l > 1e-12 ? [a[0] / l, a[1] / l, a[2] / l] : null;
};
const keyOf = (m: Vec3) => `${m[0].toFixed(KEY_DIGITS)},${m[1].toFixed(KEY_DIGITS)},${m[2].toFixed(KEY_DIGITS)}`;
const neg = (a: Vec3): Vec3 => [-a[0], -a[1], -a[2]];

/** a convex piece's face normals (both signs, distinct) and real edge directions (a hull edge between two triangles of different planes); null: no volume */
function polyOf(points: readonly Vec3[]): Poly | null {
  const h = convexHull3(points);
  if (h === null) return null;
  const P = h.points;
  const triN: (Vec3 | null)[] = h.triangles.map(([a, b, c]) => {
    const A = P[a]!, B = P[b]!, C = P[c]!;
    return unitOf(cross([B[0] - A[0], B[1] - A[1], B[2] - A[2]], [C[0] - A[0], C[1] - A[1], C[2] - A[2]]));
  });
  const normals = new Map<string, Vec3>();
  for (const m of triN) if (m !== null) for (const s of [m, neg(m)]) normals.set(keyOf(s), s);
  // the edges: each hull edge with its two triangles; real when their planes differ (a missing normal counts as different: a superset is harmless)
  const byEdge = new Map<string, { a: number; b: number; tris: number[] }>();
  h.triangles.forEach(([a, b, c], t) => {
    for (const [p, q] of [[a, b], [b, c], [c, a]] as const) {
      const k = p < q ? `${p}|${q}` : `${q}|${p}`;
      const e = byEdge.get(k);
      if (e === undefined) byEdge.set(k, { a: Math.min(p, q), b: Math.max(p, q), tris: [t] });
      else e.tris.push(t);
    }
  });
  const edges = new Map<string, Vec3>();
  for (const e of byEdge.values()) {
    const n0 = triN[e.tris[0]!] ?? null, n1 = e.tris.length > 1 ? (triN[e.tris[1]!] ?? null) : null;
    if (n0 !== null && n1 !== null && dot(n0, n1) > 1 - 1e-9) continue;
    const A = P[e.a]!, B = P[e.b]!;
    const d = unitOf([B[0] - A[0], B[1] - A[1], B[2] - A[2]]);
    if (d === null) continue;
    // sign-canonical: the first non-zero component positive
    const s = d[0] > 1e-12 || (Math.abs(d[0]) <= 1e-12 && (d[1] > 1e-12 || (Math.abs(d[1]) <= 1e-12 && d[2] > 0))) ? d : neg(d);
    edges.set(keyOf(s), s);
  }
  return { pts: P, normals: [...normals.values()], edges: [...edges.values()] };
}

const support = (pts: readonly Vec3[], m: Vec3): number => {
  let s = -Infinity;
  for (const p of pts) {
    const x = m[0] * p[0] + m[1] * p[1] + m[2] * p[2];
    if (x > s) s = x;
  }
  return s;
};

/** ⭐ the sum P ⊕ (−H) prepared for the frame (`H` null: P alone — the placed parts' own layers) */
function prepareSum(P: Poly, H: Poly | null, part: number, f: LandingFrame): Sum {
  const ms = new Map<string, Vec3>();
  for (const m of P.normals) ms.set(keyOf(m), m);
  if (H !== null) {
    for (const m of H.normals) ms.set(keyOf(m), m); // −H's normals are H's negated: both signs are already there
    for (const a of P.edges) for (const b of H.edges) {
      const m = unitOf(cross(a, b));
      if (m !== null) for (const s of [m, neg(m)]) ms.set(keyOf(s), s);
    }
  }
  // σ_{P ⊕ −H}(m) = σ_P(m) + σ_H(−m)
  const sig = (m: Vec3) => support(P.pts, m) + (H === null ? 0 : support(H.pts, neg(m)));
  const list = [...ms.values()];
  const hs = new Float64Array(list.length * 4);
  list.forEach((m, k) => {
    hs[4 * k] = dot(m, f.n);
    hs[4 * k + 1] = sig(m) - dot(m, f.origin);
    hs[4 * k + 2] = dot(m, f.u);
    hs[4 * k + 3] = dot(m, f.v);
  });
  const ou = dot(f.u, f.origin), ov = dot(f.v, f.origin);
  return { part, hs, uLo: -sig(neg(f.u)) - ou, uHi: sig(f.u) - ou, vLo: -sig(neg(f.v)) - ov, vHi: sig(f.v) - ov };
}

/** the sum's interval on the ray at (U, V), pushed as (bottom, top, part); nothing when the ray misses or only grazes */
function castSum(s: Sum, U: number, V: number, out: number[]): void {
  if (U <= s.uLo + TOUCH_M || U >= s.uHi - TOUCH_M || V <= s.vLo + TOUCH_M || V >= s.vHi - TOUCH_M) return;
  let lo = -Infinity, hi = Infinity;
  const hs = s.hs;
  for (let k = 0; k < hs.length; k += 4) {
    const a = hs[k]!, c = hs[k + 1]! - U * hs[k + 2]! - V * hs[k + 3]!;
    if (Math.abs(a) < 1e-12) {
      if (c <= TOUCH_M) return;
    } else if (a > 0) {
      const t = c / a;
      if (t < hi) hi = t;
    } else {
      const t = c / a;
      if (t > lo) lo = t;
    }
  }
  if (hi - lo > TOUCH_M) out.push(lo, hi, s.part);
}

/** ⭐ the union of the stretches (bottom, top, part) — sorted by (bottom, top, part), merged, OUTERMOST FIRST; a layer's part is its top's (ties: the smaller id) */
function mergeLayers(raw: number[], ids: readonly string[]): Layer[] {
  const n = raw.length / 3;
  if (n === 0) return [];
  const ord = Array.from({ length: n }, (_, k) => k);
  ord.sort((x, y) => raw[3 * x]! - raw[3 * y]! || raw[3 * x + 1]! - raw[3 * y + 1]! || raw[3 * x + 2]! - raw[3 * y + 2]!);
  const up: { bottom: number; top: number; part: number }[] = [];
  for (const k of ord) {
    const lo = raw[3 * k]!, hi = raw[3 * k + 1]!, p = raw[3 * k + 2]!;
    const last = up[up.length - 1];
    if (last !== undefined && lo <= last.top + TOUCH_M) {
      // ⭐ a TIE is two tops within 0.1 µm, not two equal floats: a rigid motion turns an exact tie into a near one (the part must not change)
      if (hi > last.top + TOUCH_M) (last.top = hi, last.part = p);
      else if (hi >= last.top - TOUCH_M) (last.top = Math.max(last.top, hi), last.part = Math.min(last.part, p));
    } else up.push({ bottom: lo, top: hi, part: p });
  }
  const out: Layer[] = [];
  for (let k = up.length - 1; k >= 0; k--) out.push({ top: up[k]!.top, bottom: up[k]!.bottom, part: ids[up[k]!.part]! });
  return out;
}

/** ⭐ the landing read on a layer list: from outside, or from the depth `from` (the first top at or below it; strictly inside a stretch: `inside`) */
function landOf(layers: readonly Layer[], from: number | undefined): Landing {
  for (const l of layers) {
    if (from === undefined || from >= l.top - TOUCH_M) return { kind: "land", depth: l.top, part: l.part };
    if (from > l.bottom + TOUCH_M) return { kind: "inside", part: l.part };
  }
  return { kind: "nothing" };
}

/** ⭐ the order of two landings for the lookup: `inside` first, then the higher `land` (ties: the smaller id), then `nothing` */
function better(a: Landing, b: Landing): Landing {
  const rank = (x: Landing) => (x.kind === "inside" ? 3 : x.kind === "land" ? 2 : x.kind === "nothing" ? 1 : 0);
  if (rank(a) !== rank(b)) return rank(a) > rank(b) ? a : b;
  if (a.kind === "inside" && b.kind === "inside") return b.part < a.part ? b : a;
  if (a.kind === "land" && b.kind === "land") {
    if (Math.abs(b.depth - a.depth) <= TOUCH_M) return b.part < a.part || (b.part === a.part && b.depth > a.depth) ? b : a; // a tie: the smaller id
    return b.depth > a.depth ? b : a;
  }
  return a;
}

/**
 * ⭐⭐⭐ BUILD THE LANDING MAP of the held piece over one facet direction. `placed`: the placed parts' convex collision pieces (model coordinates,
 * metres); `held`: the held piece's convex pieces AS HELD, each a list of points RELATIVE TO ITS REFERENCE POINT (the point the gizmo stands for: its
 * resting face's centre); `frame`: the facet direction and the region to cover; `stepMm`: the grid's step. Pure: keeps no state.
 */
export function buildLandingMap(placed: readonly ConvexPiece[], held: readonly (readonly Vec3[])[], frame: LandingFrame, stepMm: number = LANDING_STEP_MM): LandingMap {
  const stepM = stepMm * M_PER_MM;
  const refused: string[] = [];
  const ids = [...new Set(placed.map((p) => p.id))].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const idx = new Map(ids.map((id, k) => [id, k] as const));
  const P: { poly: Poly; part: number }[] = [];
  for (const p of placed) {
    const poly = polyOf(p.points);
    if (poly === null) refused.push(p.id);
    else P.push({ poly, part: idx.get(p.id)! });
  }
  const H: Poly[] = [];
  held.forEach((pts, k) => {
    const poly = polyOf(pts);
    if (poly === null) refused.push(`held#${k}`);
    else H.push(poly);
  });
  refused.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const partSums = P.map((p) => prepareSum(p.poly, null, p.part, frame));
  const pieceSums = P.flatMap((p) => H.map((h) => prepareSum(p.poly, h, p.part, frame)));

  const nu = Math.max(1, Math.floor((frame.uMax - frame.uMin) / stepM + 1e-9) + 1);
  const nv = Math.max(1, Math.floor((frame.vMax - frame.vMin) / stepM + 1e-9) + 1);
  const uAt = (i: number) => frame.uMin + i * stepM;
  const vAt = (j: number) => frame.vMin + j * stepM;

  /** the raw stretches of every sum over its own rectangle of samples, per sample */
  const gather = (sums: readonly Sum[]): Layer[][] => {
    const raw: number[][] = Array.from({ length: nu * nv }, () => []);
    for (const s of sums) {
      const i0 = Math.max(0, Math.ceil((s.uLo - frame.uMin) / stepM)), i1 = Math.min(nu - 1, Math.floor((s.uHi - frame.uMin) / stepM));
      const j0 = Math.max(0, Math.ceil((s.vLo - frame.vMin) / stepM)), j1 = Math.min(nv - 1, Math.floor((s.vHi - frame.vMin) / stepM));
      for (let i = i0; i <= i1; i++) {
        const U = uAt(i);
        for (let j = j0; j <= j1; j++) castSum(s, U, vAt(j), raw[i * nv + j]!);
      }
    }
    return raw.map((r) => mergeLayers(r, ids));
  };
  const partsL = gather(partSums);
  const pieceL = gather(pieceSums);

  const inGrid = (i: number, j: number) => i >= 0 && j >= 0 && i < nu && j < nv;
  const at = (i: number, j: number, from?: number): Landing => (inGrid(i, j) ? landOf(pieceL[i * nv + j]!, from) : { kind: "uncovered" });
  /** the sample indices of the cell holding x along one axis: one on a grid line, two inside a cell; [] outside */
  const corners = (x: number, lo: number, n: number): number[] => {
    const f = (x - lo) / stepM;
    const k = Math.floor(f + 1e-9);
    if (f < -1e-9 || k > n - 1) return [];
    if (Math.abs(f - k) <= 1e-9) return [k];
    return k + 1 <= n - 1 ? [k, k + 1] : [];
  };
  return {
    frame,
    stepM,
    nu,
    nv,
    refused,
    uAt,
    vAt,
    partsLayers: (i, j) => (inGrid(i, j) ? partsL[i * nv + j]! : []),
    pieceLayers: (i, j) => (inGrid(i, j) ? pieceL[i * nv + j]! : []),
    landingSample: at,
    landing(u, v, from) {
      const is = corners(u, frame.uMin, nu), js = corners(v, frame.vMin, nv);
      if (is.length === 0 || js.length === 0) return { kind: "uncovered" };
      let best: Landing = { kind: "uncovered" };
      for (const i of is) for (const j of js) best = better(best, at(i, j, from));
      return best;
    },
    landingAt(u, v, from) {
      const raw: number[] = [];
      for (const s of pieceSums) castSum(s, u, v, raw);
      return landOf(mergeLayers(raw, ids), from);
    },
    layersNear(u, v) {
      const slack = 1e-9 * stepM;
      if (u < frame.uMin - slack || v < frame.vMin - slack || u > uAt(nu - 1) + slack || v > vAt(nv - 1) + slack) return null;
      const near = (f: number) => (f - Math.floor(f) > 0.5 ? Math.floor(f) + 1 : Math.floor(f)); // a tie (exactly half way): the lower index
      const i = near((u - frame.uMin) / stepM), j = near((v - frame.vMin) / stepM);
      if (!inGrid(i, j)) return null;
      return { parts: partsL[i * nv + j]!, piece: pieceL[i * nv + j]! };
    },
  };
}

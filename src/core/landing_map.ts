/**
 * ⭐⭐⭐ **THE LANDING MAP — layer L2, principle P2** (`ORBIT_SURFACE.md` §2.2, §5.1; the design: `ORBIT_SURFACE_LANDING_MAP.md`; package S1 of
 * `ORBIT_SURFACE_BUILD.md`, 2026-11-17 — the owner accepted the six layers, to be tested). ⭐ (2026-11-22, S2) WIRED AS A READOUT ONLY: its sums with no
 * grid (`prepareLanding`) read once a frame beside today's depth (`render/landing_readout.ts`) — driving nothing; the grid (`buildLandingMap`) unwired.
 * ⭐⭐⭐ (2026-11-23, S4 — `ORBIT_SURFACE_DRIVE.md`) AND DRIVING, at `landingDrives` ≥ 1: the gizmo's depth and the piece's support read from where the
 * piece is (`driveLevel`, `landingSupport`; `render/landing_drive.ts`), on a preparation split in two — direction-free (`prepareHeldSums`) and per
 * direction (`landingFor`).
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
import { LANDING_STEP_MM, SURFACE_STEP_MIN_MM } from "./units";
import { cross, dot, qRotate, type Quat, type Vec3 } from "./vec";

/** ⭐ The grid's step, millimetres (`ORBIT_SURFACE.md` §5.1) — ⭐ (2026-11-22, S2) its one home is `src/core/units.ts` (`ORBIT_SURFACE_BUILD.md` §6), re-exported. */
export { LANDING_STEP_MM };
const M_PER_MM = 0.001;
/** ⭐ Touching is not overlapping: a side must hold by more than this, a stretch be longer, to count (0.1 µm — the study's `1e-4 mm`).
 *  ⭐ (2026-11-24, S14) exported for the cast (`landing_cast.ts`): its one home stays here. */
export const TOUCH_M = 1e-7;
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
/** ⭐ (2026-11-22, S2) the facet direction alone — what the sums are prepared for (the region is the grid's only). */
export type LandingAxes = Pick<LandingFrame, "origin" | "u" | "v" | "n">;
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

/**
 * ⭐⭐⭐ (2026-11-22, package S2 — `ORBIT_SURFACE_READOUT.md` §4) THE SUMS PREPARED, NO GRID: the held piece's sums with the placed parts over one facet
 * direction and the EXACT landing at any place (one ray through them) — `buildLandingMap`'s own preparation and evaluation (`prepareSums`, `exactOf`),
 * so the two cannot drift. `refused`: the pieces left out (no volume), named.
 */
export interface PreparedLanding {
  readonly frame: LandingAxes;
  readonly refused: readonly string[];
  landingAt(u: number, v: number, from?: number): Landing;
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

/** σ(m): the largest m·p over the points — ⭐ (S14) exported: the cast's `top` reads it (one code, `landing_cast.ts`) */
export const support = (pts: readonly Vec3[], m: Vec3): number => {
  let s = -Infinity;
  for (const p of pts) {
    const x = m[0] * p[0] + m[1] * p[1] + m[2] * p[2];
    if (x > s) s = x;
  }
  return s;
};

/**
 * ⭐ (2026-11-23, S4 — `ORBIT_SURFACE_DRIVE.md` §3.4) a sum P ⊕ (−H) WITHOUT a direction: its half-spaces' normals (in their order) and their support
 * values — the expensive part (the keyed de-duplication), done once per placed set and held piece; `project` puts it on a direction.
 */
interface SumForm {
  readonly part: number;
  readonly P: Poly;
  readonly H: Poly | null;
  readonly ms: readonly Vec3[];
  readonly sig: Float64Array;
}
/** σ_{P ⊕ −H}(m) = σ_P(m) + σ_H(−m) */
const sigOf = (P: Poly, H: Poly | null, m: Vec3): number => support(P.pts, m) + (H === null ? 0 : support(H.pts, neg(m)));
/** ⭐ the sum's form (`H` null: P alone — the placed parts' own layers) */
function formOf(P: Poly, H: Poly | null, part: number): SumForm {
  const ms = new Map<string, Vec3>();
  for (const m of P.normals) ms.set(keyOf(m), m);
  if (H !== null) {
    for (const m of H.normals) ms.set(keyOf(m), m); // −H's normals are H's negated: both signs are already there
    for (const a of P.edges) for (const b of H.edges) {
      const m = unitOf(cross(a, b));
      if (m !== null) for (const s of [m, neg(m)]) ms.set(keyOf(s), s);
    }
  }
  const list = [...ms.values()];
  const sig = new Float64Array(list.length);
  list.forEach((m, k) => (sig[k] = sigOf(P, H, m)));
  return { part, P, H, ms: list, sig };
}
/** ⭐ the form on the frame's direction: four dots a half-space, the rectangle on the plane */
function project(s: SumForm, f: LandingAxes): Sum {
  const hs = new Float64Array(s.ms.length * 4);
  s.ms.forEach((m, k) => {
    hs[4 * k] = dot(m, f.n);
    hs[4 * k + 1] = s.sig[k]! - dot(m, f.origin);
    hs[4 * k + 2] = dot(m, f.u);
    hs[4 * k + 3] = dot(m, f.v);
  });
  const sig = (m: Vec3) => sigOf(s.P, s.H, m);
  const ou = dot(f.u, f.origin), ov = dot(f.v, f.origin);
  return { part: s.part, hs, uLo: -sig(neg(f.u)) - ou, uHi: sig(f.u) - ou, vLo: -sig(neg(f.v)) - ov, vHi: sig(f.v) - ov };
}
/** ⭐ the sum P ⊕ (−H) prepared for the frame (`H` null: P alone — the placed parts' own layers) — its form put on the direction */
function prepareSum(P: Poly, H: Poly | null, part: number, f: LandingAxes): Sum {
  return project(formOf(P, H, part), f);
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

/** ⭐ the union of the stretches (bottom, top, part) — sorted by (bottom, top, part), merged, OUTERMOST FIRST; a layer's part is its top's (ties: the smaller id).
 *  ⭐ (2026-11-24, S14) SHARED with the cast (`landing_cast.ts`): one merge for both engines, never a copy. */
export function mergeLayers(raw: number[], ids: readonly string[]): Layer[] {
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

/** ⭐ the landing read on a layer list: from outside, or from the depth `from` (the first top at or below it; strictly inside a stretch: `inside`).
 *  ⭐ (2026-11-24, S14) SHARED with the cast (`landing_cast.ts`): one read for both engines, never a copy. */
export function landOf(layers: readonly Layer[], from: number | undefined): Landing {
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

/** the preparation both readers share: the parts' ids (sorted), the pieces refused (named, sorted), the placed polytopes, the sums P ⊕ (−H) */
interface Sums {
  readonly ids: readonly string[];
  readonly refused: readonly string[];
  readonly P: readonly { readonly poly: Poly; readonly part: number }[];
  readonly pieceSums: readonly Sum[];
}

/**
 * ⭐⭐ (2026-11-23, S4 — `ORBIT_SURFACE_DRIVE.md` §3.4) THE DIRECTION-FREE PREPARATION — the hulls, the ids, the refused, every pair's sum's FORM: once
 * per placed set and held piece; `landingFor` puts it on a direction (four dots a half-space). Opaque outside this file.
 */
export interface HeldSums {
  readonly ids: readonly string[];
  readonly refused: readonly string[];
  readonly P: readonly { readonly poly: Poly; readonly part: number }[];
  readonly forms: readonly SumForm[];
}
export function prepareHeldSums(placed: readonly ConvexPiece[], held: readonly (readonly Vec3[])[]): HeldSums {
  return heldSumsOn(preparePlaced(placed), held);
}

/**
 * ⭐⭐ (2026-11-23, S4b — `ORBIT_SURFACE_DRIVE.md` §12; his look: *"a small stutter"* at the alignment) THE PLACED PARTS' HULLS, held-free: three
 * quarters of `prepareHeldSums`' cost (measured: 2.1 of 2.7 ms on `Scene_1`) — prepared ONCE per placed set, so a turn of the held piece (every frame of
 * an alignment's slerp) pays only the held piece's part (`heldSumsOn`). Opaque outside this file.
 */
export interface PlacedPolys {
  readonly ids: readonly string[];
  readonly refused: readonly string[];
  readonly P: readonly { readonly poly: Poly; readonly part: number }[];
}
export function preparePlaced(placed: readonly ConvexPiece[]): PlacedPolys {
  const refused: string[] = [];
  const ids = [...new Set(placed.map((p) => p.id))].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const idx = new Map(ids.map((id, k) => [id, k] as const));
  const P: { poly: Poly; part: number }[] = [];
  for (const p of placed) {
    const poly = polyOf(p.points);
    if (poly === null) refused.push(p.id);
    else P.push({ poly, part: idx.get(p.id)! });
  }
  return { ids, refused, P };
}
/** ⭐⭐ (S4b) the held piece's part of the direction-free preparation, on the placed parts' hulls (`preparePlaced`) — `prepareHeldSums` bit for bit */
export function heldSumsOn(pp: PlacedPolys, held: readonly (readonly Vec3[])[]): HeldSums {
  const { ids, P } = pp;
  const refused: string[] = [...pp.refused];
  const H: Poly[] = [];
  held.forEach((pts, k) => {
    const poly = polyOf(pts);
    if (poly === null) refused.push(`held#${k}`);
    else H.push(poly);
  });
  refused.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const forms = P.flatMap((p) => H.map((h) => formOf(p.poly, h, p.part)));
  return { ids, refused, P, forms };
}
/**
 * ⭐ (2026-11-24, S10 — C2, the ledger's row 7: the landing map's cost per scene) THE SIZE OF A PREPARATION, machine-free: its sums (one per placed piece
 * × held piece) and their half-spaces — a query (`landingAt`) runs through every half-space once, a turn frame (`heldSumsOn`) builds them all.
 */
export function sumsSize(h: HeldSums): { readonly sums: number; readonly halfSpaces: number } {
  let halfSpaces = 0;
  for (const f of h.forms) halfSpaces += f.ms.length;
  return { sums: h.forms.length, halfSpaces };
}
/** ⭐ THE PREPARATION — the direction-free part, every pair's sum put on the facet direction (`buildLandingMap`'s and `prepareLanding`'s, one code) */
function sumsOn(h: HeldSums, frame: LandingAxes): Sums {
  return { ids: h.ids, refused: h.refused, P: h.P, pieceSums: h.forms.map((s) => project(s, frame)) };
}
function prepareSums(placed: readonly ConvexPiece[], held: readonly (readonly Vec3[])[], frame: LandingAxes): Sums {
  return sumsOn(prepareHeldSums(placed, held), frame);
}

/** ⭐ THE EXACT EVALUATION — one ray at (u, v) through every prepared sum, merged, read from outside or from `from` (both readers' `landingAt`) */
function exactOf(s: Sums): (u: number, v: number, from?: number) => Landing {
  return (u, v, from) => {
    const raw: number[] = [];
    for (const x of s.pieceSums) castSum(x, u, v, raw);
    return landOf(mergeLayers(raw, s.ids), from);
  };
}

/**
 * ⭐⭐⭐ (2026-11-22, package S2 — `ORBIT_SURFACE_READOUT.md` §4; `ORBIT_SURFACE_LANDING_MAP.md` §10.9, his answer: no grid) PREPARE THE LANDING of the
 * held piece over one facet direction, WITH NO GRID: the sums as `buildLandingMap` prepares them and its exact `landingAt` (one code). The inputs as
 * `buildLandingMap`'s (`frame`: the direction alone — no region). Pure: keeps no state.
 */
export function prepareLanding(placed: readonly ConvexPiece[], held: readonly (readonly Vec3[])[], frame: LandingAxes): PreparedLanding {
  return landingFor(prepareHeldSums(placed, held), frame);
}

/**
 * ⭐⭐ (2026-11-23, S4 — `ORBIT_SURFACE_DRIVE.md` §3.4) THE LANDING ON A DIRECTION from the direction-free preparation (`prepareHeldSums`) — bit for bit
 * `prepareLanding`'s (which is this). `top`: the highest level any of its sums reaches along `n` — read from above it, a landing is the one from outside
 * (the sections' key, §3.6). Pure.
 */
export function landingFor(h: HeldSums, frame: LandingAxes): PreparedLanding & { readonly top: number } {
  const s = sumsOn(h, frame);
  let top = -Infinity;
  for (const f of h.forms) top = Math.max(top, sigOf(f.P, f.H, frame.n) - dot(frame.n, frame.origin));
  return { frame, refused: s.refused, landingAt: exactOf(s), top };
}

/**
 * ⭐⭐⭐ (2026-11-23, S4 — `ORBIT_SURFACE_DRIVE.md` §3.1, D1 – D2) THE GIZMO'S LEVEL along the facet's normal when P2 drives it, from the landing read
 * from where the piece is: `land` → its depth LESS the piece's `reach` (`heldReach`: the gizmo marks the CONTACT — the piece hangs from it by its lift);
 * `nothing` → the facet's `plane` (nothing to land on); `inside` (a wall beside the piece at its level) or `uncovered` → `today`'s level, as built.
 */
export function driveLevel(l: Landing, reach: number, plane: number, today: number): number {
  if (l.kind === "land") return l.depth - reach;
  if (l.kind === "nothing") return plane;
  return today;
}

/** ⭐ (S4, §3.3) the piece's support read on P2: a part and its level; none; or today's rule (`today`: the piece at its level inside a part). */
export type LandingSupport = { readonly kind: "land"; readonly part: string; readonly level: number } | { readonly kind: "none" } | { readonly kind: "today" };

/**
 * ⭐⭐⭐ (2026-11-23, S4 — `ORBIT_SURFACE_DRIVE.md` §3.3) THE FOOTPRINT SUPPORT ON P2 (⑤, its wall kept): the landing read from the piece's reference
 * level `ref` (the caller reads it from `ref` + the support's slack: a part above the piece is never landed on — a wall), along the surface's normal.
 * `land` within `windowM` of the piece (its reference no farther than that above the first contact — the shell's offset, as `footprintSupport`'s
 * window) → that part, its level the contact's plane (`depth − reach`); beyond it, or `nothing` → none; `inside` → today's rule. Pure.
 */
export function landingSupport(l: Landing, ref: number, reach: number, windowM: number): LandingSupport {
  if (l.kind === "land") return ref - l.depth <= windowM ? { kind: "land", part: l.part, level: l.depth - reach } : { kind: "none" };
  if (l.kind === "inside") return { kind: "today" };
  return { kind: "none" };
}

/**
 * ⭐⭐⭐ BUILD THE LANDING MAP of the held piece over one facet direction. `placed`: the placed parts' convex collision pieces (model coordinates,
 * metres); `held`: the held piece's convex pieces AS HELD, each a list of points RELATIVE TO ITS REFERENCE POINT (the point the gizmo stands for: its
 * resting face's centre); `frame`: the facet direction and the region to cover; `stepMm`: the grid's step. Pure: keeps no state.
 * ⭐ (2026-11-22, S2) its sums and its exact `landingAt` are `prepareLanding`'s (`prepareSums`, `exactOf`): the readout and the map cannot drift.
 */
export function buildLandingMap(placed: readonly ConvexPiece[], held: readonly (readonly Vec3[])[], frame: LandingFrame, stepMm: number = LANDING_STEP_MM): LandingMap {
  const stepM = stepMm * M_PER_MM;
  const sums = prepareSums(placed, held, frame);
  const { ids, refused, pieceSums } = sums;
  const partSums = sums.P.map((p) => prepareSum(p.poly, null, p.part, frame));

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
    landingAt: exactOf(sums), // ⭐ (S2) `prepareLanding`'s own
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

// ───────────────────────────── ⭐⭐⭐ THE READOUT (package S2, `ORBIT_SURFACE_READOUT.md`) — the pure part ─────────────────────────────

/** ⭐ A turn F → world as three ROWS (`R · v` = the rows' dots: `input/orbit_tilt.ts`'s `mulM` convention); `null`: the world's own frame. */
export type Turn = readonly [Vec3, Vec3, Vec3];
const turnOf = (R: Turn | null, a: Vec3): Vec3 => (R === null ? a : [dot(R[0], a), dot(R[1], a), dot(R[2], a)]);

/**
 * ⭐⭐ (S2, §3) THE FACET'S DIRECTION IN THE WORLD — the map's facet (its outward normal `n`, its plane's axes `t`, `b`, in the map's frame) turned into the
 * world by the map's frame `R` (tilted or zoned; `null`: the world's). The origin the world's: a depth is then `x · n` in the world, the facet's own
 * level `p · n` in the map's frame (a turn keeps the dot).
 */
export function landingAxes(n: Vec3, t: Vec3, b: Vec3, R: Turn | null): LandingAxes {
  return { origin: [0, 0, 0], u: turnOf(R, t), v: turnOf(R, b), n: turnOf(R, n) };
}

/**
 * ⭐⭐ (S2, §3) THE HELD PIECE AS HELD, relative to its reference point (`ORBIT_SURFACE_LANDING_MAP.md` §3): its points (`local`, the body's own frame)
 * less its RESTING FACE'S CENTRE (`restingCentre`, the same frame), turned by its model orientation `q` — `qRotate(q, p − rc)`, as `supportFrame` poses it.
 */
export function heldPiece(local: readonly Vec3[], q: Quat, restingCentre: Vec3): Vec3[] {
  return local.map((p) => qRotate(q, [p[0] - restingCentre[0], p[1] - restingCentre[1], p[2] - restingCentre[2]]));
}

/**
 * ⭐ (S2, §2) THE READOUT AT A PLACE. `land`: P2's level (metres along the facet's normal, `PreparedLanding.frame`), `delta` = P2's level − TODAY's level
 * (METRES, signed: + = P2 farther out of the assembly), the part first touched, `point` — the place at P2's level (the place's two other coordinates
 * kept). `nothing`: no depth (a kind), `point` the place itself, on the facet's plane (§5.2).
 */
export type Readout =
  | { readonly kind: "land"; readonly level: number; readonly delta: number; readonly part: string; readonly point: Vec3 }
  | { readonly kind: "nothing"; readonly point: Vec3 };

/**
 * ⭐⭐⭐ (S2, §2 – §3) THE READOUT — P2 beside today's depth, at the gizmo's place, READ FROM OUTSIDE: `place` the gizmo's place on its facet's plane,
 * `today` today's gizmo point (`rawGizmo`'s, before the edge blend — on the same line along the normal), both in the frame `prep` was prepared in (the
 * world's). (u, v) = the place's; today's level = `today`'s along the normal. Pure: drives nothing.
 */
export function readoutAt(prep: PreparedLanding, place: Vec3, today: Vec3): Readout {
  const f = prep.frame;
  const o = f.origin;
  const d: Vec3 = [place[0] - o[0], place[1] - o[1], place[2] - o[2]];
  const l = prep.landingAt(dot(d, f.u), dot(d, f.v));
  // ⭐ from outside a landing is `land` or `nothing` (`landOf`); no other kind can come back here
  if (l.kind !== "land") return { kind: "nothing", point: place };
  const k = l.depth - dot(d, f.n);
  const level = dot([today[0] - o[0], today[1] - o[1], today[2] - o[2]], f.n);
  return { kind: "land", level: l.depth, delta: l.depth - level, part: l.part, point: [place[0] + f.n[0] * k, place[1] + f.n[1] * k, place[2] + f.n[2] * k] };
}

/**
 * ⭐⭐ (2026-11-23, S3 — `ORBIT_SURFACE_MOUTH_HOLD.md` §4 H2) THE HELD PIECE'S REACH toward a facet of normal `n`: where its reference point stands above
 * a plane it rests on along `n` — the max over its points (relative to the reference, `heldPiece`) of −p·n (metres). On its resting face 0; on a side,
 * as held, half the piece (his word of 2026-11-23, *"Keep as held"*).
 */
export function heldReach(held: readonly (readonly Vec3[])[], n: Vec3): number {
  let r = -Infinity;
  for (const piece of held) for (const p of piece) r = Math.max(r, -dot(p, n));
  return r;
}

/**
 * ⭐⭐⭐ (2026-11-23, S3 — `ORBIT_SURFACE_MOUTH_HOLD.md` §4 H2, his Q4 (a)) A VOID OPEN FOR THE HELD PIECE at a mouth: P2 reads NOTHING (the piece passes right
 * through), or lands deeper than the piece resting on the facet's plane — today's point at a mouth IS the plane's (the bridge), so resting there is
 * Δ = `reach` (`heldReach`) — by at least Q6's step (`SURFACE_STEP_MIN_MM`). Otherwise the piece rests on the rims: the void is CLOSED for it.
 */
export function voidOpenFor(r: Readout, reach: number): boolean {
  return r.kind === "nothing" || r.delta < reach - SURFACE_STEP_MIN_MM * M_PER_MM;
}

/** ⭐ (S2, §4) what the readout's cache is keyed by: the face map's identity and its frame, the placed set's key, the held piece's id and orientation. */
export interface ReadoutKeyOf {
  /** the face map's identity (a number the caller gives each map object) */
  readonly map: number;
  /** the map's frame (F → world); `null`: the world's */
  readonly frame: Turn | null;
  /** the placed set's key (`placedKey`) */
  readonly placed: string;
  /** the held piece's id */
  readonly held: string;
  /** ⭐ (fix round 1) its points' identity (a number the caller gives each points list: a new shape, a new number) */
  readonly shape: number;
  /** its model orientation */
  readonly orientation: Quat;
  /** ⭐ (fix round 1 — the audit) its REFERENCE POINT, the resting face's centre in its own frame: a tapped face changes it with no turn */
  readonly restingCentre: Vec3;
}

/**
 * ⭐⭐ (S2, §4; `ORBIT_SURFACE_LANDING_MAP.md` §10.6 — rebuilt at a pick-up, a turn of the piece, a CHANGE OF RESTING FACE, a seat, a frame change) THE
 * READOUT'S CACHE KEY: every number EXACT (its shortest round-trip text) — any turn of the piece, however small, any new reference point, is a new
 * key; the same inputs, the same key. Pure. ⛔ (fix round 1) the resting centre was left out: a tapped face whose turn was refused kept the old
 * reference point's preparations (Δ off by tens of mm).
 */
export function readoutKey(k: ReadoutKeyOf): string {
  const R = k.frame === null ? "world" : k.frame.map((r) => r.join(",")).join(";");
  return `m${k.map}|R${R}|P${k.placed}|H${k.held}#${k.shape}|q${k.orientation.join(",")}|c${k.restingCentre.join(",")}`;
}

/**
 * ⭐⭐⭐ **THE LANDING READ AT QUERY TIME — P2's second engine** (2026-11-24, package S14 — `ORBIT_SURFACE_LANDING_CAST.md`; his word *"proceed with
 * S14"*). The same answers as the sums (`landing_map.ts` — `land` / `nothing` / `inside`, the same part, the depth within `TOUCH_M`), computed WHEN
 * ASKED instead of building every pair's Minkowski sum ahead: today's eager preparation (every placed piece × every held piece, rebuilt at every
 * frame of a turn) is the cost's root (§1), not the question.
 *
 * ⭐ THE METHOD (§3, all published before 2006): the configuration obstacle D = P ⊕ (−H) of a pair (a placed convex piece, a held one) is NEVER
 * built — only its SUPPORT MAPPING s_D(d) = s_P(d) − s_H(−d) (Lozano-Pérez 1983; Gilbert, Johnson, Keerthi 1988), cast along the facet's normal by
 * GJK's RAY CAST (van den Bergen 2004; the closest point on a simplex: Ericson 2005, §5.1) — its top from above, its bottom from below. A query
 * takes only the pairs whose rectangle on the plane holds the line (a broad phase), HIGHEST FIRST by the bound on their extent along n, and stops
 * once no lower pair can reach the best top at or below `from` (branch and bound); from `F` inside a stretch, the chain above `F` is followed up.
 * The touching rule kept: the line must lie inside D's shadow (the two shadows' Minkowski sum) by more than `TOUCH_M` — today's vertical
 * half-spaces. The stretches then go through the SAME merge and read (`mergeLayers`, `landOf` — imported, never copied).
 *
 * ⭐ WHAT IS PREPARED, AND WHEN (nothing per pair): the placed pieces' hulls once per placed set (`preparePlaced`, as today); their points and
 * shadows on a direction once per (placed set, direction) — `castPlacedOn`; the held pieces' hulls once per held key — `castHeldHulls`; their
 * points and shadows on a direction per (held key, direction) — `castHeldOn` (a turn changes it every frame: a few dots a point); a query
 * (`landingCast`'s `landingAt`) casts the near pairs only.
 *
 * Model coordinates, METRES (the frame's (u, v, n)). Deterministic (the pairs taken in one total order; ties to the smaller id through
 * `mergeLayers`). Engine-free (`tests/boundary.test.ts`). The GJK loop allocates nothing (module scratch: one query at a time — never re-entrant).
 */
import { convexHull3 } from "./hull3";
import { landOf, mergeLayers, preparePlaced, support, TOUCH_M, type ConvexPiece, type Landing, type LandingAxes, type PlacedPolys, type PreparedLanding } from "./landing_map";
import { dot, type Vec3 } from "./vec";

// ── GJK's own numerical tolerances (§5 — the method's, measured on the prototype; NOT thresholds of the game: no length a hand sees) ──
/** the ray meets D when |v| ≤ 1e-11 m (squared) … */
const GJK_ABS2 = 1e-22;
/** … or |v| ≤ 1e-10 of the simplex's size (squared) */
const GJK_REL2 = 1e-20;
/** no progress (|v|² not down by 1 %) for three steps, |v| ≤ 1e-8 of the simplex's size: on D to rounding */
const GJK_PROGRESS = 0.99;
const GJK_STILL_STEPS = 3;
const GJK_STILL_REL2 = 1e-16;
/** the steps' cap (met in under 1 % of the prototype's casts, every answer still within `TOUCH_M`) */
const GJK_MAX_STEPS = 80;
/** ⛔ a tetrahedron whose volume is under this share of its size³ is FLAT — never "inside" (its first build read 2.7 mm high there) */
const FLAT_SHARE = 1e-9;
/** a triangle whose barycentric denominator is under this share of |ab|²·|ac|² is degenerate: its best edge */
const DEGENERATE_SHARE = 1e-12;
/** a 2D shadow's hull drops a point whose turn is under this (m²: collinear) */
const HULL2_EPS = 1e-15;
/** the ray starts this far beyond D's extent along n (m) — any positive value gives the same contact; a start strictly outside D */
const START_M = 1e-3;

/** ⭐ A convex piece on a direction's frame (u, v, n): its points flat, its box, its shadow's 2D hull (outward edge normals, offsets, vertices). */
export interface OnFrame {
  /** (u, v, n) per point */
  readonly pts: Float64Array;
  /** [uLo, vLo, nLo, uHi, vHi, nHi] */
  readonly box: Float64Array;
  /** the shadow's hull, counter-clockwise: per edge its outward unit normal (2), its offset (1); its vertices (2 each) */
  readonly nrm: Float64Array;
  readonly off: Float64Array;
  readonly xy: Float64Array;
}

/** the shadow's 2D hull, counter-clockwise (Andrew's monotone chain) */
function hull2(xy: number[][]): number[][] {
  const p = xy.slice().sort((a, b) => a[0]! - b[0]! || a[1]! - b[1]!);
  if (p.length < 3) return p;
  const c = (o: number[], a: number[], b: number[]) => (a[0]! - o[0]!) * (b[1]! - o[1]!) - (a[1]! - o[1]!) * (b[0]! - o[0]!);
  const lo: number[][] = [], up: number[][] = [];
  for (const q of p) {
    while (lo.length >= 2 && c(lo[lo.length - 2]!, lo[lo.length - 1]!, q) <= HULL2_EPS) lo.pop();
    lo.push(q);
  }
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i]!;
    while (up.length >= 2 && c(up[up.length - 2]!, up[up.length - 1]!, q) <= HULL2_EPS) up.pop();
    up.push(q);
  }
  lo.pop();
  up.pop();
  return lo.concat(up);
}

/** a piece's points on the frame; `origin`: subtracted first (the placed pieces' — the held ones are already relative to their reference point) */
function onFrame(points: readonly Vec3[], f: LandingAxes, origin: Vec3 | null): OnFrame {
  const k = points.length, pts = new Float64Array(3 * k);
  const box = new Float64Array([Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity]);
  const xy: number[][] = [];
  for (let i = 0; i < k; i++) {
    const p0 = points[i]!;
    const p: Vec3 = origin === null ? p0 : [p0[0] - origin[0], p0[1] - origin[1], p0[2] - origin[2]];
    const c0 = dot(p, f.u), c1 = dot(p, f.v), c2 = dot(p, f.n);
    pts[3 * i] = c0;
    pts[3 * i + 1] = c1;
    pts[3 * i + 2] = c2;
    if (c0 < box[0]!) box[0] = c0;
    if (c1 < box[1]!) box[1] = c1;
    if (c2 < box[2]!) box[2] = c2;
    if (c0 > box[3]!) box[3] = c0;
    if (c1 > box[4]!) box[4] = c1;
    if (c2 > box[5]!) box[5] = c2;
    xy.push([c0, c1]);
  }
  const h = hull2(xy);
  const nrm: number[] = [], off: number[] = [], hxy = new Float64Array(2 * h.length);
  for (let i = 0; i < h.length; i++) {
    const a = h[i]!, b = h[(i + 1) % h.length]!;
    const ex = b[0]! - a[0]!, ey = b[1]! - a[1]!, l = Math.hypot(ex, ey);
    if (l > 0) {
      const mx = ey / l, my = -ex / l; // outward for counter-clockwise
      nrm.push(mx, my);
      off.push(mx * a[0]! + my * a[1]!);
    } // (a zero edge — a degenerate shadow only — bounds nothing)
    hxy[2 * i] = a[0]!;
    hxy[2 * i + 1] = a[1]!;
  }
  return { pts, box, nrm: Float64Array.from(nrm), off: Float64Array.from(off), xy: hxy };
}

/** ⭐ The placed pieces on one direction (once per placed set and direction): their frames, their parts (indices in the sorted ids), σ along n. */
export interface PlacedOnFrame {
  readonly frame: LandingAxes;
  readonly ids: readonly string[];
  readonly refused: readonly string[];
  readonly pieces: readonly OnFrame[];
  readonly part: Int32Array;
  /** the largest σ_P(n) over the pieces (−∞: none) — `top`'s placed half, `landingFor`'s own `support` */
  readonly supN: number;
}
/** ⭐⭐ THE PLACED PIECES ON A DIRECTION — their hulls (`preparePlaced`'s, as the sums read them) put on the frame. Pure. */
export function castPlacedOn(pp: PlacedPolys, frame: LandingAxes): PlacedOnFrame {
  const pieces: OnFrame[] = [];
  const part = new Int32Array(pp.P.length);
  let supN = -Infinity;
  pp.P.forEach((x, i) => {
    pieces.push(onFrame(x.poly.pts, frame, frame.origin));
    part[i] = x.part;
    supN = Math.max(supN, support(x.poly.pts, frame.n));
  });
  return { frame, ids: pp.ids, refused: pp.refused, pieces, part, supN };
}

/** ⭐ The held pieces' hulls (per held key): their points (`convexHull3`'s, as `heldSumsOn` reads them), the pieces with no volume named. */
export interface HeldHulls {
  readonly hulls: readonly (readonly Vec3[])[];
  /** `held#k` for each held piece with no volume (k: its index in the input) */
  readonly refused: readonly string[];
  /** per input piece: its hull's point indices (null: no volume), and the input's point counts — what a TURN of the same pieces reuses (`like`) */
  readonly index: readonly (Int32Array | null)[];
  readonly counts: readonly number[];
}
/**
 * ⭐⭐ THE HELD PIECES' HULLS — each piece AS HELD (relative to its reference point, `heldPiece`); a piece with no volume left out and named. Pure.
 * ⭐ `like`: the hulls of the SAME pieces at another orientation (the caller's word: the same points, in the same order, turned) — a turn never
 * changes a hull (§3's table), so its points are re-read by their indices and no hull is computed (a turn frame's cost). A list of another shape
 * (another count of pieces or points) is hulled afresh.
 */
export function castHeldHulls(held: readonly (readonly Vec3[])[], like?: HeldHulls): HeldHulls {
  if (like !== undefined && like.counts.length === held.length && like.counts.every((c, k) => c === held[k]!.length)) {
    const hulls: (readonly Vec3[])[] = [];
    like.index.forEach((ix, k) => {
      if (ix !== null) hulls.push(Array.from(ix, (i) => held[k]![i]!));
    });
    return { hulls, refused: like.refused, index: like.index, counts: like.counts };
  }
  const hulls: (readonly Vec3[])[] = [];
  const refused: string[] = [];
  const index: (Int32Array | null)[] = [];
  let reusable = true;
  held.forEach((pts, k) => {
    const h = convexHull3(pts);
    if (h === null) {
      refused.push(`held#${k}`);
      index.push(null);
      return;
    }
    hulls.push(h.points);
    // the hull's points ARE the input's (`convexHull3` returns the original objects): their indices, by identity
    const at = new Map<Vec3, number>();
    pts.forEach((p, i) => at.set(p, i));
    const ix = Int32Array.from(h.points, (p) => at.get(p) ?? -1);
    if (ix.includes(-1)) reusable = false;
    index.push(ix);
  });
  return { hulls, refused, index, counts: reusable ? held.map((p) => p.length) : [] };
}

/** ⭐ The held pieces on one direction (per held key and direction): their frames, their union's rectangle, σ along −n. */
export interface HeldOnFrame {
  readonly frame: LandingAxes;
  readonly pieces: readonly OnFrame[];
  /** the union of the pieces' rectangles on the plane: [uLo, vLo, uHi, vHi] */
  readonly rect: Float64Array;
  /** the largest σ_H(−n) over the pieces (−∞: none) — `top`'s held half */
  readonly supNegN: number;
}
/** ⭐⭐ THE HELD PIECES ON A DIRECTION — a turn frame's whole cost: a few dots a point and a 2D hull a piece. Pure. */
export function castHeldOn(h: HeldHulls, frame: LandingAxes): HeldOnFrame {
  const pieces: OnFrame[] = [];
  const rect = new Float64Array([Infinity, Infinity, -Infinity, -Infinity]);
  const negN: Vec3 = [-frame.n[0], -frame.n[1], -frame.n[2]];
  let supNegN = -Infinity;
  for (const pts of h.hulls) {
    const p = onFrame(pts, frame, null);
    pieces.push(p);
    rect[0] = Math.min(rect[0]!, p.box[0]!);
    rect[1] = Math.min(rect[1]!, p.box[1]!);
    rect[2] = Math.max(rect[2]!, p.box[3]!);
    rect[3] = Math.max(rect[3]!, p.box[4]!);
    supNegN = Math.max(supNegN, support(pts, negN));
  }
  return { frame, pieces, rect, supNegN };
}

// ───────────────────────────── the cast: GJK's ray cast on D = P ⊕ (−H), allocation-free ─────────────────────────────

/** ⭐ diagnostics only (never read by the game): casts made, GJK steps, casts that met the cap, casts stopped still, hits advanced to their
 *  facet's plane (`landing_engine_cost.ts`) */
export const CAST_COUNT = { casts: 0, steps: 0, capped: 0, still: 0, refined: 0 };

/** the support point of D along d, into SP */
const SP = new Float64Array(3);
function supD(P: Float64Array, H: Float64Array, dx: number, dy: number, dz: number): void {
  let bp = -Infinity, ip = 0, bh = -Infinity, ih = 0;
  for (let i = 0; i < P.length; i += 3) {
    const s = P[i]! * dx + P[i + 1]! * dy + P[i + 2]! * dz;
    if (s > bp) (bp = s), (ip = i);
  }
  for (let i = 0; i < H.length; i += 3) {
    const s = -(H[i]! * dx + H[i + 1]! * dy + H[i + 2]! * dz);
    if (s > bh) (bh = s), (ih = i);
  }
  SP[0] = P[ip]! - H[ih]!;
  SP[1] = P[ip + 1]! - H[ih + 1]!;
  SP[2] = P[ip + 2]! - H[ih + 2]!;
}

/** the simplex: its points of D (Y), the same seen from x (S = x − Y), its count */
const Y = new Float64Array(12);
const YT = new Float64Array(12);
const S = new Float64Array(12);
let NY = 0;
/** the closest point's result (v, the simplex's points kept) and the scratch of a tetrahedron's faces and a triangle's edges */
const OV = new Float64Array(3), OK = new Int32Array(4);
const TV = new Float64Array(3), TK = new Int32Array(4);
const EV = new Float64Array(3), EK = new Int32Array(4);

const copy = (v: Float64Array, k: Int32Array, nk: number, toV: Float64Array, toK: Int32Array): number => {
  toV[0] = v[0]!;
  toV[1] = v[1]!;
  toV[2] = v[2]!;
  for (let m = 0; m < nk; m++) toK[m] = k[m]!;
  return nk;
};
/** the closest point to the origin of the segment S[ia] S[ib] (Ericson 5.1.2): into (ov, ok), the count kept */
function seg(ia: number, ib: number, ov: Float64Array, ok: Int32Array): number {
  const ax = S[3 * ia]!, ay = S[3 * ia + 1]!, az = S[3 * ia + 2]!;
  const abx = S[3 * ib]! - ax, aby = S[3 * ib + 1]! - ay, abz = S[3 * ib + 2]! - az;
  const l2 = abx * abx + aby * aby + abz * abz;
  const t = l2 > 0 ? -(ax * abx + ay * aby + az * abz) / l2 : 0;
  if (t <= 0) {
    ov[0] = ax;
    ov[1] = ay;
    ov[2] = az;
    ok[0] = ia;
    return 1;
  }
  if (t >= 1) {
    ov[0] = S[3 * ib]!;
    ov[1] = S[3 * ib + 1]!;
    ov[2] = S[3 * ib + 2]!;
    ok[0] = ib;
    return 1;
  }
  ov[0] = ax + abx * t;
  ov[1] = ay + aby * t;
  ov[2] = az + abz * t;
  ok[0] = ia;
  ok[1] = ib;
  return 2;
}
const vv3 = (v: Float64Array) => v[0]! * v[0]! + v[1]! * v[1]! + v[2]! * v[2]!;
/** the closest point to the origin of the triangle S[ia] S[ib] S[ic] (Ericson 5.1.5): into (ov, ok), the count kept */
function tri(ia: number, ib: number, ic: number, ov: Float64Array, ok: Int32Array): number {
  const ax = S[3 * ia]!, ay = S[3 * ia + 1]!, az = S[3 * ia + 2]!;
  const bx = S[3 * ib]!, by = S[3 * ib + 1]!, bz = S[3 * ib + 2]!;
  const cx = S[3 * ic]!, cy = S[3 * ic + 1]!, cz = S[3 * ic + 2]!;
  const abx = bx - ax, aby = by - ay, abz = bz - az;
  const acx = cx - ax, acy = cy - ay, acz = cz - az;
  const d1 = abx * -ax + aby * -ay + abz * -az, d2 = acx * -ax + acy * -ay + acz * -az;
  if (d1 <= 0 && d2 <= 0) return pt(ia, ov, ok);
  const d3 = abx * -bx + aby * -by + abz * -bz, d4 = acx * -bx + acy * -by + acz * -bz;
  if (d3 >= 0 && d4 <= d3) return pt(ib, ov, ok);
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) {
    const t = d1 / (d1 - d3);
    return two(ax + abx * t, ay + aby * t, az + abz * t, ia, ib, ov, ok);
  }
  const d5 = abx * -cx + aby * -cy + abz * -cz, d6 = acx * -cx + acy * -cy + acz * -cz;
  if (d6 >= 0 && d5 <= d6) return pt(ic, ov, ok);
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) {
    const t = d2 / (d2 - d6);
    return two(ax + acx * t, ay + acy * t, az + acz * t, ia, ic, ov, ok);
  }
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
    const t = (d4 - d3) / (d4 - d3 + (d5 - d6));
    return two(bx + (cx - bx) * t, by + (cy - by) * t, bz + (cz - bz) * t, ib, ic, ov, ok);
  }
  const den = va + vb + vc;
  if (!(Math.abs(den) > DEGENERATE_SHARE * ((abx * abx + aby * aby + abz * abz) * (acx * acx + acy * acy + acz * acz)))) {
    // degenerate: the best of its three edges (ties: the first)
    let nk = seg(ia, ib, ov, ok);
    let bd = vv3(ov);
    let ne = seg(ib, ic, EV, EK);
    let de = vv3(EV);
    if (!(bd <= de)) (nk = copy(EV, EK, ne, ov, ok)), (bd = de);
    ne = seg(ia, ic, EV, EK);
    de = vv3(EV);
    if (!(bd <= de)) nk = copy(EV, EK, ne, ov, ok);
    return nk;
  }
  const v = vb / den, w = vc / den;
  ov[0] = ax + abx * v + acx * w;
  ov[1] = ay + aby * v + acy * w;
  ov[2] = az + abz * v + acz * w;
  ok[0] = ia;
  ok[1] = ib;
  ok[2] = ic;
  return 3;
}
function pt(i: number, ov: Float64Array, ok: Int32Array): number {
  ov[0] = S[3 * i]!;
  ov[1] = S[3 * i + 1]!;
  ov[2] = S[3 * i + 2]!;
  ok[0] = i;
  return 1;
}
function two(x: number, y: number, z: number, i: number, j: number, ov: Float64Array, ok: Int32Array): number {
  ov[0] = x;
  ov[1] = y;
  ov[2] = z;
  ok[0] = i;
  ok[1] = j;
  return 2;
}
/** a tetrahedron's faces: (p, q, r) and the vertex s opposite (the order the prototype measured) */
const FACES = [0, 1, 2, 3, 0, 2, 3, 1, 0, 3, 1, 2, 1, 3, 2, 0] as const;
/** the closest point to the origin of the tetrahedron S[0..3] (Ericson 5.1.6): the origin inside → 0, all kept; else its best face outside. ⛔ A FLAT
 *  tetrahedron is never "inside" (§5): every face is then a candidate */
function tet(ov: Float64Array, ok: Int32Array): number {
  const ax = S[0]!, ay = S[1]!, az = S[2]!;
  const bax = S[3]! - ax, bay = S[4]! - ay, baz = S[5]! - az;
  const cax = S[6]! - ax, cay = S[7]! - ay, caz = S[8]! - az;
  const dax = S[9]! - ax, day = S[10]! - ay, daz = S[11]! - az;
  const vol = (bay * caz - baz * cay) * dax + (baz * cax - bax * caz) * day + (bax * cay - bay * cax) * daz;
  const sz = Math.max(bax * bax + bay * bay + baz * baz, cax * cax + cay * cay + caz * caz, dax * dax + day * day + daz * daz);
  const flat = Math.abs(vol) <= FLAT_SHARE * sz * Math.sqrt(sz);
  let outside = false, bd = Infinity, nk = 0;
  for (let f = 0; f < 16; f += 4) {
    const ip = FACES[f]!, iq = FACES[f + 1]!, ir = FACES[f + 2]!, is = FACES[f + 3]!;
    const px = S[3 * ip]!, py = S[3 * ip + 1]!, pz = S[3 * ip + 2]!;
    const qx = S[3 * iq]! - px, qy = S[3 * iq + 1]! - py, qz = S[3 * iq + 2]! - pz;
    const rx = S[3 * ir]! - px, ry = S[3 * ir + 1]! - py, rz = S[3 * ir + 2]! - pz;
    const nx = qy * rz - qz * ry, ny = qz * rx - qx * rz, nz = qx * ry - qy * rx;
    const sO = -(nx * px + ny * py + nz * pz);
    const sS = nx * (S[3 * is]! - px) + ny * (S[3 * is + 1]! - py) + nz * (S[3 * is + 2]! - pz);
    if (flat || sO * sS < 0) {
      outside = true;
      const nt = tri(ip, iq, ir, TV, TK);
      const dd = vv3(TV);
      if (dd < bd) (bd = dd), (nk = copy(TV, TK, nt, ov, ok));
    }
  }
  if ((!outside && !flat) || nk === 0) {
    ov[0] = 0;
    ov[1] = 0;
    ov[2] = 0;
    for (let m = 0; m < 4; m++) ok[m] = m;
    return 4;
  }
  return nk;
}

/** a miss (the ray never meets D within its length) */
const MISS = -1;
/** ⭐ GJK's RAY CAST (van den Bergen 2004, §3): the ray s + λ r, λ ∈ [0, 1], against D = P ⊕ (−H) (frame coordinates) — the first λ where it meets
 *  D, or `MISS`. Stops at |v| within GJK's tolerances, no progress for three steps, or the steps' cap (§5). */
function rayCast(P: Float64Array, H: Float64Array, sx: number, sy: number, sz: number, rx: number, ry: number, rz: number): number {
  CAST_COUNT.casts++;
  let lambda = 0, xx = sx, xy = sy, xz = sz;
  NY = 0;
  supD(P, H, rx, ry, rz);
  let vx = xx - SP[0]!, vy = xy - SP[1]!, vz = xz - SP[2]!;
  let bestVV = Infinity, still = 0;
  for (let it = 0; it < GJK_MAX_STEPS; it++) {
    CAST_COUNT.steps++;
    const vv = vx * vx + vy * vy + vz * vz;
    let m2 = 0;
    for (let k = 0; k < NY; k++) {
      const dx = xx - Y[3 * k]!, dy = xy - Y[3 * k + 1]!, dz = xz - Y[3 * k + 2]!;
      m2 = Math.max(m2, dx * dx + dy * dy + dz * dz);
    }
    if (vv <= GJK_ABS2 || vv <= GJK_REL2 * m2) return facetPlane(P, H, lambda, sx, sy, sz, rx, ry, rz);
    if (vv < GJK_PROGRESS * bestVV) (bestVV = vv), (still = 0);
    else if (++still >= GJK_STILL_STEPS && vv <= GJK_STILL_REL2 * m2) {
      CAST_COUNT.still++;
      return facetPlane(P, H, lambda, sx, sy, sz, rx, ry, rz);
    }
    supD(P, H, vx, vy, vz);
    const px = SP[0]!, py = SP[1]!, pz = SP[2]!;
    const vw = vx * (xx - px) + vy * (xy - py) + vz * (xz - pz);
    let dup = false;
    for (let k = 0; k < NY; k++) if (Y[3 * k] === px && Y[3 * k + 1] === py && Y[3 * k + 2] === pz) dup = true;
    if (vw > 0) {
      const vr = vx * rx + vy * ry + vz * rz;
      if (vr >= 0) return MISS;
      lambda -= vw / vr;
      if (lambda > 1) return MISS;
      xx = sx + rx * lambda;
      xy = sy + ry * lambda;
      xz = sz + rz * lambda;
      bestVV = Infinity;
      still = 0;
    } else if (dup) return facetPlane(P, H, lambda, sx, sy, sz, rx, ry, rz); // no progress: x is on D (to rounding)
    if (!dup) {
      Y[3 * NY] = px;
      Y[3 * NY + 1] = py;
      Y[3 * NY + 2] = pz;
      NY++;
    }
    for (let k = 0; k < NY; k++) {
      S[3 * k] = xx - Y[3 * k]!;
      S[3 * k + 1] = xy - Y[3 * k + 1]!;
      S[3 * k + 2] = xz - Y[3 * k + 2]!;
    }
    const nk = NY === 1 ? pt(0, OV, OK) : NY === 2 ? seg(0, 1, OV, OK) : NY === 3 ? tri(0, 1, 2, OV, OK) : tet(OV, OK);
    vx = OV[0]!;
    vy = OV[1]!;
    vz = OV[2]!;
    for (let m = 0; m < nk; m++) {
      const k = OK[m]!;
      YT[3 * m] = Y[3 * k]!;
      YT[3 * m + 1] = Y[3 * k + 1]!;
      YT[3 * m + 2] = Y[3 * k + 2]!;
    }
    for (let m = 0; m < 3 * nk; m++) Y[m] = YT[m]!;
    NY = nk;
  }
  CAST_COUNT.capped++;
  return facetPlane(P, H, lambda, sx, sy, sz, rx, ry, rz);
}

/**
 * ⭐⭐ (the build, measured — ORBIT_SURFACE_LANDING_CAST.md §9) THE FACET'S OWN PLANE, at a hit: GJK's v carries the rounding of x − y (points
 * ~0.3 m away) and its stops (|v| small, no progress, a support already in the simplex, the cap) leave x up to |v| short of D — |v| / cos θ along
 * the ray on a steep facet (the prototype: 1.8e-9 m on `Scene_1`, a turned piece 1 µm past an edge; 6.8e-8 m on `Scene_2`'s stage 16). The final
 * simplex's triangle — three vertices of D, exact, no x − y — gives a better direction m (toward the ray); D's SUPPORTING plane along m (its
 * support, exact) is crossed by the ray no later than D itself (for ANY m with m·r < 0), so x is advanced to it: never past D, and on the contact
 * facet exactly. Any other simplex (a point, an edge, the origin inside) keeps GJK's λ.
 */
function facetPlane(P: Float64Array, H: Float64Array, lambda: number, sx: number, sy: number, sz: number, rx: number, ry: number, rz: number): number {
  if (NY !== 3) return lambda;
  const ax = Y[0]!, ay = Y[1]!, az = Y[2]!;
  const bx = Y[3]! - ax, by = Y[4]! - ay, bz = Y[5]! - az;
  const cx = Y[6]! - ax, cy = Y[7]! - ay, cz = Y[8]! - az;
  let mx = by * cz - bz * cy, my = bz * cx - bx * cz, mz = bx * cy - by * cx;
  let mr = mx * rx + my * ry + mz * rz;
  if (mr > 0) (mx = -mx), (my = -my), (mz = -mz), (mr = -mr);
  if (!(mr < 0)) return lambda; // the facet along the ray (a wall): nothing to gain
  supD(P, H, mx, my, mz);
  const gap = mx * (sx + rx * lambda - SP[0]!) + my * (sy + ry * lambda - SP[1]!) + mz * (sz + rz * lambda - SP[2]!);
  if (!(gap > 0)) return lambda; // x at the plane or past it already
  const l2 = lambda - gap / mr;
  if (!(l2 <= 1)) return lambda; // (rounding only: a hit's contact is inside the ray)
  CAST_COUNT.refined++;
  return l2;
}

/** ⭐ the pair's TOP on the line (U, V) — where it is first met from above — or NaN (missed) */
function castDown(P: OnFrame, H: OnFrame, U: number, V: number): number {
  const top = P.box[5]! - H.box[2]! + START_M, bot = P.box[2]! - H.box[5]! - START_M, L = top - bot;
  const a = rayCast(P.pts, H.pts, U, V, top, 0, 0, -L);
  return a === MISS ? NaN : top - a * L;
}
/** ⭐ the pair's BOTTOM on the line (U, V) — where it is first met from below — or NaN (missed) */
function castUp(P: OnFrame, H: OnFrame, U: number, V: number): number {
  const top = P.box[5]! - H.box[2]! + START_M, bot = P.box[2]! - H.box[5]! - START_M, L = top - bot;
  const b = rayCast(P.pts, H.pts, U, V, bot, 0, 0, L);
  return b === MISS ? NaN : bot + b * L;
}

/** ⭐⭐ THE TOUCHING RULE: the line at (U, V) strictly inside D's shadow — proj(P) ⊕ proj(−H), its edges theirs — by more than `TOUCH_M` (today's
 *  vertical half-spaces: touching is not overlapping) */
function inside2(P: OnFrame, H: OnFrame, U: number, V: number): boolean {
  // P's edges: h_D(m) = h_P(m) + h_H(−m)
  for (let e = 0; e < P.off.length; e++) {
    const mx = P.nrm[2 * e]!, my = P.nrm[2 * e + 1]!;
    let hH = -Infinity;
    for (let k = 0; k < H.xy.length; k += 2) hH = Math.max(hH, -(mx * H.xy[k]! + my * H.xy[k + 1]!));
    if (mx * U + my * V >= P.off[e]! + hH - TOUCH_M) return false;
  }
  // −H's edges: m = −n_H, h_{−H}(m) = h_H(n_H), h_P(m) the largest m·p
  for (let e = 0; e < H.off.length; e++) {
    const mx = -H.nrm[2 * e]!, my = -H.nrm[2 * e + 1]!;
    let hP = -Infinity;
    for (let k = 0; k < P.xy.length; k += 2) hP = Math.max(hP, mx * P.xy[k]! + my * P.xy[k + 1]!);
    if (mx * U + my * V >= hP + H.off[e]! - TOUCH_M) return false;
  }
  return true;
}

// ── a query's scratch (grown at a preparation, never in a query): the candidate pairs, their bounds, the order, the casts kept ──
let CAP = 0;
let CI = new Int32Array(0), CJ = new Int32Array(0), ORD = new Int32Array(0), GOT = new Int32Array(0), ABOVE = new Int32Array(0);
let CHI = new Float64Array(0), CLO = new Float64Array(0), GHI = new Float64Array(0);
function grow(n: number): void {
  if (n <= CAP) return;
  CAP = Math.max(n, 2 * CAP, 64);
  CI = new Int32Array(CAP);
  CJ = new Int32Array(CAP);
  ORD = new Int32Array(CAP);
  GOT = new Int32Array(CAP);
  ABOVE = new Int32Array(CAP);
  CHI = new Float64Array(CAP);
  CLO = new Float64Array(CAP);
  GHI = new Float64Array(CAP);
}
/** the candidates' order: the bound on the top along n, highest first; ties the earlier pair (placed index, then held) — one total order */
const byTopBound = (a: number, b: number): number => CHI[b]! - CHI[a]! || a - b;
/** the pairs wholly above `F`: the bound on the bottom, lowest first; ties their order in the list (stable) */
function sortByBottomBound(n: number): void {
  for (let i = 1; i < n; i++) {
    const x = ABOVE[i]!;
    let j = i - 1;
    while (j >= 0 && CLO[ABOVE[j]!]! > CLO[x]!) (ABOVE[j + 1] = ABOVE[j]!), j--;
    ABOVE[j + 1] = x;
  }
}
const RAW: number[] = [];

/** ⭐⭐⭐ THE LANDING AT (U, V), from outside or from `from` — the near pairs only, highest first, cast exactly (§3) */
function castAt(pl: PlacedOnFrame, hd: HeldOnFrame, U: number, V: number, from: number | undefined): Landing {
  const T = TOUCH_M;
  // ① the broad phase: the placed pieces under the held part's footprint, then the pairs whose rectangle holds the line by more than TOUCH (as `castSum`)
  let nc = 0;
  const r = hd.rect;
  for (let i = 0; i < pl.pieces.length; i++) {
    const pb = pl.pieces[i]!.box;
    if (U <= pb[0]! - r[2]! || U >= pb[3]! - r[0]! || V <= pb[1]! - r[3]! || V >= pb[4]! - r[1]!) continue;
    for (let j = 0; j < hd.pieces.length; j++) {
      const hb = hd.pieces[j]!.box;
      if (U <= pb[0]! - hb[3]! + T || U >= pb[3]! - hb[0]! - T || V <= pb[1]! - hb[4]! + T || V >= pb[4]! - hb[1]! - T) continue;
      CI[nc] = i;
      CJ[nc] = j;
      CHI[nc] = pb[5]! - hb[2]!;
      CLO[nc] = pb[2]! - hb[5]!;
      ORD[nc] = nc;
      nc++;
    }
  }
  if (nc > 1) ORD.subarray(0, nc).sort(byTopBound);
  const F = from ?? Infinity;
  // ② the pairs reaching down to F or below, highest first: each one's TOP; stop once no lower pair can reach the best top at or below F (the bound)
  let X = -Infinity, nGot = 0, nAbove = 0;
  for (let k = 0; k < nc; k++) {
    const c = ORD[k]!;
    if (CHI[c]! < X - 2 * T) break;
    if (CLO[c]! > F + 2 * T) {
      ABOVE[nAbove++] = c;
      continue;
    }
    const P = pl.pieces[CI[c]!]!, H = hd.pieces[CJ[c]!]!;
    if (!inside2(P, H, U, V)) continue;
    const hi = castDown(P, H, U, V);
    if (Number.isNaN(hi)) continue;
    GOT[nGot] = c;
    GHI[nGot] = hi;
    nGot++;
    if (hi <= F + T) X = Math.max(X, hi);
  }
  // ③ the bottoms where they matter: the pairs whose top is near X or above it (the layer at X, the one F may be inside)
  RAW.length = 0;
  for (let g = 0; g < nGot; g++) {
    const hi = GHI[g]!;
    if (hi < X - 2 * T) continue;
    const c = GOT[g]!;
    const lo = castUp(pl.pieces[CI[c]!]!, hd.pieces[CJ[c]!]!, U, V);
    if (Number.isNaN(lo) || hi - lo <= T) continue;
    RAW.push(lo, hi, pl.part[CI[c]!]!);
  }
  let res = landOf(mergeLayers(RAW, pl.ids), from);
  // ④ inside: the layer's top (and its part) may rise through pairs wholly above F — the chain followed upward only
  if (res.kind === "inside" && nAbove > 0) {
    let top = -Infinity;
    for (const l of mergeLayers(RAW, pl.ids)) if (l.bottom + T < F && F < l.top - T) top = l.top;
    sortByBottomBound(nAbove);
    let n = nAbove, grew = true;
    while (grew) {
      grew = false;
      let rest = 0;
      for (let k = 0; k < n; k++) {
        const c = ABOVE[k]!;
        if (CLO[c]! > top + T) {
          ABOVE[rest++] = c;
          continue;
        }
        const P = pl.pieces[CI[c]!]!, H = hd.pieces[CJ[c]!]!;
        if (!inside2(P, H, U, V)) continue;
        const lo = castUp(P, H, U, V);
        if (Number.isNaN(lo)) continue;
        if (lo > top + T) {
          ABOVE[rest++] = c;
          continue;
        }
        const hi = castDown(P, H, U, V);
        if (Number.isNaN(hi) || hi - lo <= T) continue;
        RAW.push(lo, hi, pl.part[CI[c]!]!);
        if (hi > top) (top = hi), (grew = true);
      }
      n = rest;
    }
    res = landOf(mergeLayers(RAW, pl.ids), from);
  }
  return res;
}

const sameAxes = (a: LandingAxes, b: LandingAxes): boolean =>
  a === b || [0, 1, 2].every((k) => a.origin[k] === b.origin[k] && a.u[k] === b.u[k] && a.v[k] === b.v[k] && a.n[k] === b.n[k]);

/**
 * ⭐⭐⭐ THE LANDING ON A DIRECTION, CAST — `landingFor`'s answer (`PreparedLanding` and its `top`) from the placed pieces on the direction
 * (`castPlacedOn`), the held pieces' hulls (`castHeldHulls`: their refused) and the held pieces on the same direction (`castHeldOn`). Nothing is
 * built: `landingAt` casts at query time. `top` = `landingFor`'s, bit for bit (σ_P(n) + σ_H(−n) − n·origin, its largest — rounding is monotone).
 */
export function landingCast(pl: PlacedOnFrame, hh: HeldHulls, hd: HeldOnFrame): PreparedLanding & { readonly top: number } {
  if (!sameAxes(pl.frame, hd.frame)) throw new Error("landingCast: the placed and the held pieces were put on two different directions");
  grow(pl.pieces.length * hd.pieces.length);
  const refused = [...pl.refused, ...hh.refused].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const top = pl.pieces.length > 0 && hd.pieces.length > 0 ? pl.supN + hd.supNegN - dot(pl.frame.n, pl.frame.origin) : -Infinity;
  return { frame: pl.frame, refused, top, landingAt: (u, v, from) => castAt(pl, hd, u, v, from) };
}

/**
 * ⭐ (S14) THE CAST IN ONE CALL — `prepareLanding`'s twin (the vectors' and the offline scripts'; the game caches the steps apart —
 * `render/landing_readout.ts` `heldCastFor`, `castLandingFor`). Pure.
 */
export function prepareLandingCast(placed: readonly ConvexPiece[], held: readonly (readonly Vec3[])[], frame: LandingAxes): PreparedLanding & { readonly top: number } {
  const hh = castHeldHulls(held);
  return landingCast(castPlacedOn(preparePlaced(placed), frame), hh, castHeldOn(hh, frame));
}

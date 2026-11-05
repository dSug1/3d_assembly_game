/**
 * ⭐⭐⭐ THE CALM — the piece and the camera near square to a face in its middle, the orbit's pace growing smoothly to its edges — ⭐⭐⭐ (2026-11-05,
 * `TILTED_ORBIT_REBUILD_SCOPE.md` §21.8, the owner: *"We need to better blend the orbit and slide: it is almost as if there is orbit then slide then
 * orbit … B. build the smooth profile"*) ONE SMOOTH PROFILE OVER EVERY FACE, a function of the place.
 *
 * Across a face the shown angle is `Θ · (s·x + (1 − s)·x³)` (`calmProfile`): `x` the place's share of the orbit's turn across the face (−1 … 1 — the face
 * map's edge stretch undone, `edgeUnmap`, so the finger's pace is the orbit's), `Θ` the half-dihedral toward that edge's neighbour (45° on a box), `s` the
 * middle's share (the sliders: dx's across a wall, dy's up it; a top / a bottom dx's both ways — every wall meets a cap along its own horizontal). The
 * pace `Θ·(s + 3(1 − s)x²)` grows from the middle to the edges with no flat stretch and no bump (⛔ 58d86ff's flat middle + an edge zone, and §21.6 F5's
 * normals blended over a zone: orbit, slide, orbit — the owner). The direction is the face's GNOMONIC one (a cube map's): `n + t·tan θt + b·tan θb` — at
 * an edge both faces give the same vector (on a box `n_A + n_B` and the same along the edge), at a corner the three: continuous by construction, in every
 * frame. ⭐ A top / a bottom orbited as a wall (the owner's choice B): the view passes straight above at its middle (the half roll there, `camera_up.ts`).
 * ⛔ §21.6 F3 (the camera square to a cap — a slide on it, 90° crammed into the wall's last cm), F5's weighted normals and its zones — DELETED.
 * ⛔ No engine import (`tests/boundary.test.ts`). Gnomonic projection, a cubic — textbook.
 */
import { cross, dot, normalize, type Vec3 } from "../core/vec";
import { edgeUnmap } from "./face_map";

/** ⭐ A facet of the contour as the calm reads it: its outward normal, its in-plane axes (`t` level on a wall, `b` = `t × n`), their spans, its convex
 * polygon; a cap or a wall; the half-dihedral (rad) toward the neighbour beyond each of its four sides. */
export interface CalmFacet {
  readonly n: Vec3;
  readonly t: Vec3;
  readonly b: Vec3;
  readonly tLo: number;
  readonly tHi: number;
  readonly bLo: number;
  readonly bHi: number;
  readonly poly: readonly Vec3[];
  readonly cap: boolean;
  readonly half: { readonly tLo: number; readonly tHi: number; readonly bLo: number; readonly bHi: number };
}

/** ⭐ The calm's knobs: the middle's shares (dx's, dy's); the face map's edge stretch (its angle, rad, and its length, m) — undone to read the pace. */
export interface CalmOpts {
  readonly shareH: number;
  readonly shareV: number;
  readonly edgeRad: number;
  readonly edgeM: number;
}

/** ⭐ A facet is a CAP (a top, a bottom) when its normal is within 45° of the vertical. */
const isCapN = (n: Vec3): boolean => Math.abs(n[1]) > Math.SQRT1_2;

/** ⭐⭐⭐ THE PROFILE: the shown share of an edge's angle at `x` (−1 … 1) across a face, the middle's share `s` — odd, monotone, ±1 at the edges. */
export function calmProfile(x: number, s: number): number {
  const c = Math.min(1, Math.max(-1, x));
  const k = Math.min(1, Math.max(0, s));
  return k * c + (1 - k) * c * c * c;
}

/** ⭐ The distance from `p` to a convex polygon `poly` (normal `n`): to its plane when `p` projects inside it, else to its nearest edge. */
export function polyDistance(p: Vec3, poly: readonly Vec3[], n: Vec3): number {
  if (poly.length === 0) return Infinity;
  const h = dot([p[0] - poly[0]![0], p[1] - poly[0]![1], p[2] - poly[0]![2]], n);
  const q: Vec3 = [p[0] - h * n[0], p[1] - h * n[1], p[2] - h * n[2]];
  let inside = poly.length >= 3;
  let sgn = 0;
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    const e: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const s = dot(cross(e, [q[0] - a[0], q[1] - a[1], q[2] - a[2]]), n);
    if (s !== 0) {
      if (sgn === 0) sgn = Math.sign(s);
      else if (Math.sign(s) !== sgn) inside = false;
    }
    const ee = dot(e, e);
    const t = ee > 0 ? Math.min(1, Math.max(0, dot([p[0] - a[0], p[1] - a[1], p[2] - a[2]], e) / ee)) : 0;
    best = Math.min(best, Math.hypot(p[0] - a[0] - t * e[0], p[1] - a[1] - t * e[1], p[2] - a[2] - t * e[2]));
  }
  return inside ? Math.abs(h) : best;
}

/** ⭐ The facets as the calm reads them: each side's neighbour the facet whose normal leans most that way, its half-dihedral (none: 45°). */
export function calmFacets(
  fs: readonly { readonly n: Vec3; readonly t: Vec3; readonly b: Vec3; readonly tLo: number; readonly tHi: number; readonly bLo: number; readonly bHi: number; readonly poly: readonly Vec3[] }[],
): CalmFacet[] {
  const halfToward = (i: number, d: Vec3): number => {
    let best = 0.1;
    let g: Vec3 | null = null;
    fs.forEach((o, j) => {
      const c = dot(o.n, d);
      if (j !== i && c > best) {
        best = c;
        g = o.n;
      }
    });
    if (g === null) return Math.PI / 4;
    const c = Math.max(-1, Math.min(1, dot(fs[i]!.n, g)));
    return Math.acos(c) / 2;
  };
  return fs.map((f, i) => ({
    n: f.n,
    t: f.t,
    b: f.b,
    tLo: f.tLo,
    tHi: f.tHi,
    bLo: f.bLo,
    bHi: f.bHi,
    poly: f.poly,
    cap: isCapN(f.n),
    half: {
      tLo: halfToward(i, [-f.t[0], -f.t[1], -f.t[2]]),
      tHi: halfToward(i, f.t),
      bLo: halfToward(i, [-f.b[0], -f.b[1], -f.b[2]]),
      bHi: halfToward(i, f.b),
    },
  }));
}

/** ⭐ The face map's edge band for an angle span (its `bandFor`). */
const bandFor = (E: number, half: number): number => (half > 1e-12 ? Math.min(0.5, Math.max(0, E / half)) : 0);

/** ⭐ The share of the orbit's turn at `off` from the middle of a span (`lo` … `hi`) whose edges are `hLo`, `hHi` away in angle — the stretch undone. */
function paceShare(off: number, lo: number, hi: number, hLo: number, hHi: number, o: CalmOpts): number {
  const half = (hi - lo) / 2;
  if (!(half > 1e-12)) return 0;
  return edgeUnmap(off, bandFor(o.edgeRad, (hLo + hHi) / 2), half, o.edgeM);
}

/**
 * ⭐⭐⭐ THE PIECE'S DIRECTION at the place `p` on the contour: the facet it is on (the nearest), the place's pace share across it each way, the profile
 * of each, the gnomonic direction. Unit; `null` with no facet.
 */
export function calmDir(p: Vec3, facets: readonly CalmFacet[], o: CalmOpts): Vec3 | null {
  let f: CalmFacet | null = null;
  let d = Infinity;
  for (const g of facets) {
    const e = polyDistance(p, g.poly, g.n);
    if (e < d) {
      d = e;
      f = g;
    }
  }
  if (f === null) return null;
  const sT = o.shareH;
  const sB = f.cap ? o.shareH : o.shareV;
  const xt = paceShare(dot(p, f.t) - (f.tLo + f.tHi) / 2, f.tLo, f.tHi, f.half.tLo, f.half.tHi, o);
  const xb = paceShare(dot(p, f.b) - (f.bLo + f.bHi) / 2, f.bLo, f.bHi, f.half.bLo, f.half.bHi, o);
  const at = (xt >= 0 ? f.half.tHi : f.half.tLo) * calmProfile(xt, sT);
  const ab = (xb >= 0 ? f.half.bHi : f.half.bLo) * calmProfile(xb, sB);
  const kt = Math.tan(at);
  const kb = Math.tan(ab);
  return normalize([f.n[0] + f.t[0] * kt + f.b[0] * kb, f.n[1] + f.t[1] * kt + f.b[1] * kb, f.n[2] + f.t[2] * kt + f.b[2] * kb]);
}

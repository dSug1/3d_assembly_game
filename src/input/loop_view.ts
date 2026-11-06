/**
 * ⭐⭐⭐ (2026-11-06, THE SECOND REBUILD — `TILTED_ORBIT_REBUILD_SCOPE.md` §26.2 – 26.3) **THE VIEW — WORLD YAW AND PITCH, NEVER ROLL** — engine-free; the ONE
 * owner of the piece's direction from the place, the camera's frame, and what makes a face reachable.
 * * V1 — the direction is a world YAW `h` (round the vertical; the orbit's azimuth: x = cos, z = sin) and a world PITCH `e` — nothing else: no roll exists.
 * * V2 — the screen's up is the pitch tangent of the direction: upright at every yaw and pitch, straight above / below included.
 * * V3 — on a WALL (a facet whose normal has a heading — more than `CAP_RAD` off the vertical) a yaw lean toward the face dx reaches and a pitch lean
 *   toward the face dy reaches — READ ON THE TRAVEL's OWN LOOPS through the place (`sideAt`: the face beyond each end of the loop's side, the place's
 *   share of the turn across it), each by the smooth profile (`calmProfile`, the calm's sliders) from the middle to the BISECTOR of the face and that
 *   neighbour at the edge — both faces give the same yaw and pitch at their common edge. ⛔ The first build read the neighbour as "the normal leaning most
 *   that way" and the share from the facet's extents: on a hexagon the wrong neighbour, on a trapezoid the bisector never reached where the travel crosses
 *   (`view_reach.test.ts`).
 * * V4 — on a CAP (a top, a bottom): dx never leans the view (its side faces would need a roll); dy leans in pitch only, from the entry wall's edge view
 *   (`capProfile`, C1 with it) to straight above / below at the far edge; the YAW the entry wall's at the same left / right position (the owner's (i)).
 * * V5 — the camera: behind the piece along (h, e), the owner's offsets in its own frame (pitch added to `e`, yaw about the up), never past ±90° of pitch.
 * * T5's test (`sameView`): a crossing is taken where the two faces' views meet — a face is reachable exactly where the leans meet (the owner: *"there shall
 *   be a lean only if the next contour face can be reached"*).
 * ⛔ `1.0.103-`'s `loop_calm.ts` (a gnomonic direction leaning sideways on a cap) and `loop_camera.ts` (the near-vertical cone, the carried up, the up's pace,
 * the view's hold) — DELETED: they existed because the view could roll.
 * ⛔ No engine import (`tests/boundary.test.ts`). Spherical angles, a cubic — textbook.
 */
import { cross, dot, normalize, qFromAxisAngle, qRotate, type Vec3 } from "../core/vec";
import { planeThrough } from "./plane_cut";
import { isCapNormal, sideAt } from "./loop_travel";

/** ⭐ A view: the world yaw `h` and pitch `e` (rad) of the direction from the place toward the piece and the camera. */
export interface View {
  readonly h: number;
  readonly e: number;
}

/** ⭐ The calm's knobs: the middle's shares (dx's, dy's); the travel's edge stretch (its angle, rad, and length, m) — undone to read the pace. */
export interface ViewOpts {
  readonly shareH: number;
  readonly shareV: number;
  readonly edgeRad: number;
  readonly edgeM: number;
}

/** ⭐ A lean: the yaw and pitch (rad) added at an edge. */
interface Lean {
  readonly dh: number;
  readonly de: number;
}

/** ⭐ A facet as the view reads it: its normal, frame (`t` level, `b` up its slope), plane (`n·x = e`), polygon; a cap or a wall; its own yaw / pitch. */
export interface ViewFacet {
  readonly n: Vec3;
  readonly t: Vec3;
  readonly b: Vec3;
  readonly e: number;
  readonly poly: readonly Vec3[];
  readonly cap: boolean;
  readonly own: View;
  /** its polygon's centroid */
  readonly mid: Vec3;
}

const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));

/** ⭐ V1 — the direction of a view (unit). */
export function viewDir(v: View): Vec3 {
  const c = Math.cos(v.e);
  return [c * Math.cos(v.h), Math.sin(v.e), c * Math.sin(v.h)];
}

/** ⭐⭐⭐ V2 — THE UP of a view: its pitch tangent — the screen's right always level (no roll). */
export function viewUp(v: View): Vec3 {
  const s = Math.sin(v.e);
  return [-s * Math.cos(v.h), Math.cos(v.e), -s * Math.sin(v.h)];
}

/** ⭐ The view of a direction `u` (unit): its yaw (0 straight up / down) and pitch. */
export function viewOfDir(u: Vec3): View {
  const flat = Math.hypot(u[0], u[2]);
  return { h: flat > 1e-9 ? Math.atan2(u[2], u[0]) : 0, e: Math.asin(clamp(u[1], -1, 1)) };
}

/** ⭐⭐⭐ THE PROFILE (`1.0.102-` §21.8): the shown share of an edge's lean at `x` (−1 … 1) across a face, the middle's share `s` — odd, ±1 at the edges. */
export function calmProfile(x: number, s: number): number {
  const c = clamp(x, -1, 1);
  const k = clamp(s, 0, 1);
  return k * c + (1 - k) * c * c * c;
}

/**
 * ⭐⭐⭐ (`1.0.102-` §23) THE CAP'S PROFILE from its far edge (`c` 0) to its entry edge (`c` 1): `s·c + (1 − s)·c^m` — the far edge's pace `s`, the wall's
 * edge pace at the entry edge (`m = (6 − 5s)/(1 − s)`): C1 with the wall it comes from. Monotone, 0 … 1.
 */
export function capProfile(c: number, s: number): number {
  const y = clamp(c, 0, 1);
  const k = clamp(s, 0, 1);
  if (k >= 1) return y;
  const m = Math.max(1, (6 - 5 * k) / (1 - k));
  return k * y + (1 - k) * Math.pow(y, m);
}

/** ⭐ The facets as the view reads them (G1's). */
export function viewFacets(fs: readonly { readonly n: Vec3; readonly t: Vec3; readonly b: Vec3; readonly e: number; readonly poly: readonly Vec3[] }[]): ViewFacet[] {
  return fs.map((f) => {
    const k = Math.max(1, f.poly.length);
    const mid: Vec3 = [f.poly.reduce((a, q) => a + q[0], 0) / k, f.poly.reduce((a, q) => a + q[1], 0) / k, f.poly.reduce((a, q) => a + q[2], 0) / k];
    return { n: f.n, t: f.t, b: f.b, e: f.e, poly: f.poly, cap: isCapNormal(f.n), own: viewOfDir(f.n), mid };
  });
}

/** ⭐ The lean of facet `f` toward the neighbour `g` at their edge: to their bisector, in yaw and pitch. */
function leanToward(f: ViewFacet, g: ViewFacet): Lean {
  const bis = normalize([f.n[0] + g.n[0], f.n[1] + g.n[1], f.n[2] + g.n[2]]) ?? f.n;
  const v = viewOfDir(bis);
  return { dh: Math.hypot(bis[0], bis[2]) > 1e-6 ? wrap(v.h - f.own.h) : 0, de: v.e - f.own.e };
}

/**
 * ⭐ ONE AXIS's lean at `p` on facet `fi`: the travel's loop cut by the plane through `p` with normal `pn`, the side on `fi`; `dir` the facet's way along it
 * (its `t` for dx, its `b` for dy): the place's share −1 … 1 that way (the turn's — the edge stretch included), the face beyond that end and the profile's
 * weight toward it (`s` the middle's share). None: `null`.
 */
function axisLean(facets: readonly ViewFacet[], fi: number, p: Vec3, pn: Vec3, dir: Vec3, s: number, o: ViewOpts): { readonly g: number; readonly w: number } | null {
  const at = sideAt(facets, planeThrough(p, pn), p, fi, { degPerMm: 1, edgeM: o.edgeM, edgeRad: o.edgeRad });
  if (at === null) return null;
  const fwd = dot([at.b[0] - at.a[0], at.b[1] - at.a[1], at.b[2] - at.a[2]], dir) >= 0;
  const x = fwd ? 2 * at.share - 1 : 1 - 2 * at.share;
  const g = x >= 0 ? (fwd ? at.after : at.before) : fwd ? at.before : at.after;
  if (g === fi || facets[g] === undefined) return null;
  return { g, w: Math.abs(calmProfile(x, s)) };
}

/**
 * ⭐⭐⭐ V3 — A WALL's view at `p`: its own yaw / pitch and, toward each face the dx loop and the dy loop reach, the lean to that face's bisector by the
 * profile's weight — a face both loops reach leans ONCE, at the larger weight (⛔ summed: on a slanted edge — a frustum's side, a hexagon's end — both loops
 * end at the same neighbour and the view leaned twice as far: `view_reach.test.ts`).
 */
function wallAt(facets: readonly ViewFacet[], fi: number, p: Vec3, o: ViewOpts): View {
  const f = facets[fi]!;
  // the face's OWN loops through the place (its dx plane holds its level axis, its dy plane its slope) — the view a function of the place alone (⛔ the
  // travel's planes: they carry the path — arriving from a top, the cap's — and the same place read two views)
  const a = axisLean(facets, fi, p, f.b, f.t, o.shareH, o);
  const b = axisLean(facets, fi, p, f.t, f.b, o.shareV, o);
  const toward = new Map<number, number>();
  for (const l of [a, b]) if (l !== null) toward.set(l.g, Math.max(toward.get(l.g) ?? 0, l.w));
  let h = f.own.h;
  let e = f.own.e;
  for (const [g, w] of toward) {
    const l = leanToward(f, facets[g]!);
    h += l.dh * w;
    e += l.de * w;
  }
  return { h, e };
}

/**
 * ⭐⭐⭐ THE VIEW AT A PLACE `p` on facet `fi` (V3 – V4). On a cap, `entry` the outward normal of the wall it was entered from (none: the wall facing −z the
 * most): its yaw the wall's at the same left / right position — the wall's view where the cap's line toward it meets their edge; its pitch from that
 * edge view to ±90° at the far edge (`capProfile`), by the place's share of the dy loop's turn across the cap.
 */
export function viewAt(facets: readonly ViewFacet[], fi: number, p: Vec3, entry: Vec3 | null, o: ViewOpts): View {
  const f = facets[fi];
  if (f === undefined) return { h: 0, e: 0 };
  if (!f.cap) return wallAt(facets, fi, p, o);
  // the entry wall
  let wi = -1;
  let best = -Infinity;
  const want: Vec3 = entry ?? [0, 0, -1];
  facets.forEach((g, j) => {
    const c = dot(g.n, want);
    if (!g.cap && c > best) {
      best = c;
      wi = j;
    }
  });
  const pole = (f.n[1] >= 0 ? 1 : -1) * (Math.PI / 2);
  if (wi < 0) return { h: 0, e: pole };
  const W = facets[wi]!;
  // toward the entry edge: the entry wall's outward normal laid on the cap (on a top and a bottom alike)
  const kn = dot(W.n, f.n);
  const a = normalize([W.n[0] - kn * f.n[0], W.n[1] - kn * f.n[1], W.n[2] - kn * f.n[2]]);
  if (a === null) return { h: W.own.h, e: pole };
  // the point of the entry edge at the place's left / right position: from `p` along `a` in the cap's plane onto the wall's plane
  const k = dot(W.n, a);
  const s0 = Math.abs(k) > 1e-9 ? (W.e - dot(W.n, p)) / k : 0;
  // …clamped onto their common edge (a hexagon's cap: beyond the wall's span the line meets the wall's plane past its side edge)
  const q = clampToEdge(W, f, [p[0] + a[0] * s0, p[1] + a[1] * s0, p[2] + a[2] * s0]);
  // the wall's view there, its pitch lean full toward this cap (q on their edge) — read on the wall's own loops there
  const edgeV = wallAt(facets, wi, q, o);
  // the place's share of the dy loop's turn across the cap, from its far edge (0) to its entry edge (1) — the dy plane holds `a` and the normal
  const right = normalize(cross(a, f.n)) ?? f.t;
  const at = sideAt(facets, planeThrough(p, right), p, fi, { degPerMm: 1, edgeM: o.edgeM, edgeRad: o.edgeRad });
  let c = 1;
  if (at !== null) {
    const toEntry = dot([at.b[0] - at.a[0], at.b[1] - at.a[1], at.b[2] - at.a[2]], a) > 0;
    c = toEntry ? at.share : 1 - at.share;
  }
  return { h: edgeV.h, e: pole + (edgeV.e - pole) * capProfile(c, o.shareH) };
}

/** ⭐ `q` clamped onto the edge the wall `W` shares with the cap `f` (W's polygon's points on the cap's plane); none found: `q`. */
function clampToEdge(W: ViewFacet, f: ViewFacet, q: Vec3): Vec3 {
  const on = W.poly.filter((v) => Math.abs(dot(v, f.n) - f.e) < 1e-4);
  if (on.length < 2) return q;
  let a = on[0]!;
  let b = on[1]!;
  let best = -1;
  for (let i = 0; i < on.length; i++)
    for (let j = i + 1; j < on.length; j++) {
      const d = Math.hypot(on[i]![0] - on[j]![0], on[i]![1] - on[j]![1], on[i]![2] - on[j]![2]);
      if (d > best) {
        best = d;
        a = on[i]!;
        b = on[j]!;
      }
    }
  const e: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const ee = dot(e, e);
  if (!(ee > 1e-12)) return q;
  const t = Math.min(1, Math.max(0, dot([q[0] - a[0], q[1] - a[1], q[2] - a[2]], e) / ee));
  return [a[0] + e[0] * t, a[1] + e[1] * t, a[2] + e[2] * t];
}

/** ⭐ Two views the same within this (rad): direction and up (T5's test — straight above, the up tells two yaws apart). */
export const SAME_VIEW_RAD = (3 * Math.PI) / 180;

/** ⭐⭐⭐ T5 — ARE `a` AND `b` THE SAME VIEW? (direction and up within `SAME_VIEW_RAD`) — a crossing is taken only then. */
export function sameView(a: View, b: View, tol: number = SAME_VIEW_RAD): boolean {
  const c = Math.cos(tol);
  return dot(viewDir(a), viewDir(b)) >= c && dot(viewUp(a), viewUp(b)) >= c;
}

/**
 * ⭐⭐⭐ V5 — THE CAMERA for the view `v`: the owner's pitch offset added to the pitch, never past ±90° (never past the zenith), the yaw offset about the up
 * (the camera's own yaw — the screen's right stays level). `dir` from what it looks at toward the camera; `up` the screen's.
 */
export function cameraView(v: View, yawOffRad: number, pitchOffRad: number): { readonly dir: Vec3; readonly up: Vec3 } {
  const w: View = { h: v.h, e: clamp(v.e + pitchOffRad, -Math.PI / 2, Math.PI / 2) };
  const up = viewUp(w);
  const q = qFromAxisAngle(up, -yawOffRad);
  return { dir: qRotate(q, viewDir(w)), up };
}

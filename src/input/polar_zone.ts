/**
 * ⭐⭐⭐ (2026-11-13, `Claude/40_RENDER_SCENE/spec/POLAR_ZONES.md` — the owner: *"if the faces contour is small and many faces converge to a singularity,
 * polar orbit shall be the only way"*, *"the polar orbit has to snap its pole to the local pole"*) THE POLAR ZONES, engine-free: what a zone is
 * (`PolarZone`), ITS FRAME F (F → world, by rows like `orbit_tilt`'s `Mat3`: F's vertical the axis, F's yaw 0 the world axis most square to it,
 * `zoneFrame`), and the runtime helpers below. ⭐⭐⭐ (2026-11-15, `ORBIT_CHARTS.md` §3, step 2.4a) the zones are the frames the charts' ATLAS takes
 * (`chartZones`, `orbit_charts.ts`). ⛔ (2026-11-16, step 2.5) the DETECTORS of the game before the charts deleted with its switch (`chartLayout`):
 * `polarZones` — a corner where ≥ `valenceMin` real facets meet whose star's facets are small (T1, T3), the facets failing T2 / T3 joined, the axis from
 * the rim's centroid snapped onto a world axis within `snapDeg`, the orientation, the extent — and its helpers (`contourCorners`, `facetSize`,
 * `snapToWorldAxis`, `zoneOrientation`), with the three knobs only they read (`valenceMin`, `facetMinRatio`, `snapDeg`; the record: `POLAR_ZONES.md`).
 *
 * The runtime helpers: which zone the gizmo is in with the exit's hysteresis (`zoneAt`, D-Z7), the finger read in F's upright screen (`fingerInFrame`), and
 * the spit's side (`spitSide`, `spitHeading`, `spitCameraHeading` — the owner: *"I want to replicate the behavior of scene 0 when crossing the zenith
 * edge"*) — ⭐⭐⭐ (2026-11-17, R1) decided by the gizmo's face (`faceSide`), the heading read on the side's view (`spitSideView`); the hold the one rule's
 * (`free_face.ts`'s `crossingEvent`; ⛔ `crossingHold`, the finger's last dy sign, deleted).
 */
import type { Vec3 } from "../core/vec";
import type { FaceMap, Facet } from "./face_map";
import type { Mat3 } from "./orbit_tilt";

/** ⭐ The zones' knobs — each a `GestureConfig` field with a slider (the atlas's, `atlasOf` in the wiring; the defaults `DEFAULT_CHART_OPTS`'s). */
export interface ZoneOpts {
  /** S1 up to this angle from the vertical (deg) */
  readonly uprightMaxDeg: number;
  /** S2 from this angle from the vertical (deg) */
  readonly spitMinDeg: number;
  /** F for the whole assembly over this share of the contour's area (0 … 1; above 1: never) */
  readonly wholeShare: number;
}

export const DEFAULT_ZONE_OPTS: ZoneOpts = { uprightMaxDeg: 30, spitMinDeg: 60, wholeShare: 0.5 };

export type ZoneOrientation = "UPRIGHT" | "SPIT";

export interface PolarZone {
  /** the contour's facets in the zone (the WORLD map's indices) */
  readonly facets: readonly number[];
  /** its poles (the convergence corners), one or two */
  readonly poles: readonly Vec3[];
  /** its axis, unit (UPRIGHT: pointing up) */
  readonly axis: Vec3;
  /** F → world, by rows (`mulM(frame, vF)` is the world's) — F's vertical the axis */
  readonly frame: Mat3;
  readonly orientation: ZoneOrientation;
  /** F for the whole assembly (D-Z5) */
  readonly whole: boolean;
  /** which check put the facets in: the pole's star, T2, T3 */
  readonly reason: { readonly pole: readonly number[]; readonly t2: readonly number[]; readonly t3: readonly number[] };
}

const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
const unit = (a: Vec3): Vec3 | null => {
  const l = len(a);
  return l > 1e-12 ? [a[0] / l, a[1] / l, a[2] / l] : null;
};
const D = Math.PI / 180;
/** ⭐ two corners within this are one (m) — the charts' too (`orbit_charts.ts`) */
export const CORNER_TOL_M = 0.0005;
/** ⭐ A facet's polygon without repeated points. */
function polyOf(f: Facet): Vec3[] {
  const P = f.poly;
  return P.filter((p, k) => len(sub(p, P[(k + 1) % P.length]!)) > 1e-7);
}

/** ⭐ F → world for the axis `a` (by rows): F's y the axis, F's x the world axis most square to it (ties: y, x, z) laid square to it, F's z = x × y. */
export function zoneFrame(a: Vec3): Mat3 {
  const ey = unit(a) ?? [0, 1, 0];
  const cand: Vec3[] = [[0, 1, 0], [1, 0, 0], [0, 0, 1]];
  let best = cand[0]!;
  for (const e of cand) if (Math.abs(dot(e, ey)) < Math.abs(dot(best, ey)) - 1e-9) best = e;
  const k = dot(best, ey);
  const ex = unit([best[0] - k * ey[0], best[1] - k * ey[1], best[2] - k * ey[2]]) ?? [1, 0, 0];
  const ez = cross(ex, ey);
  return [
    [ex[0], ey[0], ez[0]],
    [ex[1], ey[1], ez[1]],
    [ex[2], ey[2], ez[2]],
  ];
}

/** ⭐ The distance (m) from `p` to the nearest of the facets' polygons (in its plane inside it, else to its sides). */
export function distanceToFacets(map: FaceMap, facets: readonly number[], p: Vec3): number {
  let best = Infinity;
  for (const i of facets) {
    const f = map.facets[i];
    if (f === undefined) continue;
    const P = polyOf(f);
    if (P.length < 3) continue;
    const h = dot(p, f.n) - f.e;
    const q: Vec3 = [p[0] - f.n[0] * h, p[1] - f.n[1] * h, p[2] - f.n[2] * h];
    // inside: on the same side of every edge (a convex facet)
    let inside = true;
    let sg = 0;
    for (let k = 0; k < P.length; k++) {
      const s = dot(cross(sub(P[(k + 1) % P.length]!, P[k]!), sub(q, P[k]!)), f.n);
      if (Math.abs(s) < 1e-12) continue;
      if (sg === 0) sg = Math.sign(s);
      else if (Math.sign(s) !== sg) {
        inside = false;
        break;
      }
    }
    if (inside) {
      best = Math.min(best, Math.abs(h));
      continue;
    }
    for (let k = 0; k < P.length; k++) {
      const a = P[k]!;
      const e = sub(P[(k + 1) % P.length]!, a);
      const t = Math.max(0, Math.min(1, dot(sub(p, a), e) / Math.max(1e-18, dot(e, e))));
      best = Math.min(best, len(sub(p, [a[0] + e[0] * t, a[1] + e[1] * t, a[2] + e[2] * t])));
    }
  }
  return best;
}

/**
 * ⭐⭐⭐ (§3.3 5., D-Z7) THE ZONE THE GIZMO IS IN: the one holding its facet (`facet`, the world map's index); none — the zone it was in (`prev`) until it is
 * `exitMm` past its rim (`depthPastRimMm`, the wiring's `distanceToFacets`), then none. A whole-assembly zone is always in.
 */
export function zoneAt<Zt extends { readonly facets: readonly number[]; readonly whole: boolean }>(zones: readonly Zt[], facet: number, prev: Zt | null, depthPastRimMm: number, exitMm: number): Zt | null {
  const whole = zones.find((z) => z.whole);
  if (whole !== undefined) return whole;
  const here = zones.find((z) => z.facets.includes(facet));
  if (here !== undefined) return here;
  if (prev !== null && zones.includes(prev) && depthPastRimMm < exitMm) return prev;
  return null;
}

/**
 * ⭐⭐⭐ (§3.5, the swap) THE FINGER IN F's UPRIGHT SCREEN: the screen move (`dx` right, `dy` up — the orbit's `fdy`) on the camera looking along `view`
 * (toward the centre; the glass's right `up × view`, Babylon's left-handed axes — ⛔ the outward direction there mirrors the turn) with its up `up`, read in the screen of the camera upright in F (its up the axis `a` on the glass): there the rule is today's (dx
 * round the axis, dy pole to pole). In a spit (the camera upright in the WORLD, the axis across the glass) a dx goes pole to pole, a dy round — for any
 * roll between, the finger keeps its way on the glass. `a`: F's up in the world (the axis; the wiring gives the way toward the pole at the orbit's place,
 * defined at the pole too); none on the glass: the last angle (`prevAlpha`). Returns the move in F's screen and the angle of F's up on the glass (rad,
 * from the camera's up toward its right).
 */
export function fingerInFrame(dx: number, dy: number, view: Vec3, up: Vec3, a: Vec3, prevAlpha: number): { readonly dx: number; readonly dy: number; readonly alpha: number } {
  const V = unit(view) ?? [0, 0, -1];
  const k0 = dot(up, V);
  const U = unit([up[0] - k0 * V[0], up[1] - k0 * V[1], up[2] - k0 * V[2]]) ?? [0, 1, 0];
  const Rt = cross(U, V);
  const k = dot(a, V);
  const U1raw: Vec3 = [a[0] - k * V[0], a[1] - k * V[1], a[2] - k * V[2]];
  let alpha = prevAlpha;
  if (len(U1raw) > 0.05) {
    const U1u = unit(U1raw)!;
    alpha = Math.atan2(dot(U1u, Rt), dot(U1u, U));
  }
  const U1: Vec3 = [Math.cos(alpha) * U[0] + Math.sin(alpha) * Rt[0], Math.cos(alpha) * U[1] + Math.sin(alpha) * Rt[1], Math.cos(alpha) * U[2] + Math.sin(alpha) * Rt[2]];
  const Rt1 = cross(U1, V);
  const W: Vec3 = [dx * Rt[0] + dy * U[0], dx * Rt[1] + dy * U[1], dx * Rt[2] + dy * U[2]];
  return { dx: dot(W, Rt1), dy: dot(W, U1), alpha };
}

/**
 * ⭐⭐⭐ (2026-11-13, the owner: *"replicate the behavior of scene 0 when crossing the zenith edge"*) THE SPIT'S FINGER LOOKING DOWN: the swap itself, each
 * finger axis on ONE of F's — a dx along the axis only (F's pitch), a dy round it only (F's yaw), the signs the glass's (`alpha`, `fingerInFrame`'s). As on
 * `Scene_0`, where after the crossing a dx runs along the ridge and never back over it. ⛔ The glass's mix there (the view near the vertical, F's up a few
 * degrees off the glass's right): a dx leaked into the turn round the axis, the camera crossed back, turned round, the leak reversed — 9 crossings in one
 * diagonal (probed).
 */
export function fingerSwapped(dx: number, dy: number, alpha: number): { readonly dx: number; readonly dy: number } {
  const s = Math.sin(alpha) >= 0 ? 1 : -1;
  return { dx: -dy * s, dy: dx * s };
}

/**
 * ⭐⭐⭐ (2026-11-13, the owner: *"check what happens in scene 0 at the zenith edge: the dy hold happens after the crossing, not before the crossing … I
 * want to replicate the behavior of scene 0 when crossing the zenith edge"*) THE SPIT'S SIDE. On `Scene_0` (probed close in, `zen0c`) the gizmo crosses the
 * ridge, the camera makes ONE turn over it — about the edge's own line, 140° in ≈ 160 ms, its roll about the view < 1° — the gizmo held, THEN the dy that
 * crossed is held (§8). In the spit the camera is upright in the world: its heading is the SIDE of the axis it is on (in front of the body or behind it —
 * `spitSideRef` × the side), never its own direction's (that spun at the vertical: 100° in 12 frames, the "very rapid roll" with a dx). The side changes
 * only when the camera has passed over the axis (`spitSide`, a 2° hysteresis) — that change IS the crossing: one timed turn, the gizmo held, then the hold.
 */
export const SPIT_SIDE_HYST_DEG = 2;

/** ⭐ The horizontal direction square to the axis (the side "in front" when positive): `a × up`, laid level; a vertical axis: x. */
export function spitSideRef(a: Vec3): Vec3 {
  return unit([-a[2], 0, a[0]]) ?? [1, 0, 0];
}

/**
 * ⭐⭐⭐ THE SIDE the camera direction `u` (centre → camera) is on: the sign of its part square to the axis along `spitSideRef`, changed from `prev` only past
 * `hystDeg` (a camera straight over the axis keeps its side); looking along the axis (at a tip): `prev`. `prev` 0: none yet — read as it is.
 */
export function spitSide(u: Vec3, a: Vec3, prev: number, hystDeg: number = SPIT_SIDE_HYST_DEG): number {
  const k = dot(u, a);
  const r: Vec3 = [u[0] - k * a[0], u[1] - k * a[1], u[2] - k * a[2]];
  const lr = len(r);
  if (!(lr > 0.05)) return prev === 0 ? 1 : prev;
  const s = dot(r, spitSideRef(a)) / lr;
  if (prev === 0) return s < 0 ? -1 : 1;
  return Math.sign(s) !== prev && Math.abs(s) > Math.sin(hystDeg * D) ? -prev : prev;
}

/** ⭐ The spit camera's level heading (the orbit's convention: x = cos, z = sin) on `side`. */
export function spitHeading(a: Vec3, side: number): number {
  const r = spitSideRef(a);
  return Math.atan2(side * r[2], side * r[0]);
}

/** ⭐ The side's bias in the spit camera's heading (`spitCameraHeading`): the level part of a unit direction it outweighs — a view above ≈ 72° */
export const SPIT_SIDE_BIAS = 0.3;

/**
 * ⭐⭐⭐ THE SPIT CAMERA'S HEADING for its direction `u` (centre → camera): the heading of `u`'s level part plus the side's level direction × `SPIT_SIDE_BIAS`
 * — ONE continuous rule. Looking down (a small level part) the side wins: a dx along the axis at the top never spins the view (⛔ `u`'s own: 100° in 12
 * frames); level (round a tip) `u`'s own wins, and there the heading hardly turns the picture (`offsetFrame` weighs it by the view's sine). ⛔ Two readings
 * blended by the pitch (`Scene_0`'s 50° / 60°): near a tip they part by up to 80° — the picture rolled 70° in one finger event.
 */
export function spitCameraHeading(u: Vec3, a: Vec3, side: number): number {
  const r = spitSideRef(a);
  // ⭐ (2026-11-14, the walks: 105 – 112 ROLL events, the camera standing 5 – 17° off upright for hundreds of frames at mid height) the bias faded in
  // from `SPIT_BIAS_FROM_RAD` (60°) to `SPIT_BIAS_FULL_RAD` (75°) of the view's pitch: below, the camera plainly upright (its own direction's heading)
  const p = Math.asin(Math.min(1, Math.abs(u[1]) / Math.max(1e-12, len(u))));
  const x = Math.min(1, Math.max(0, (p - SPIT_BIAS_FROM_RAD) / (SPIT_BIAS_FULL_RAD - SPIT_BIAS_FROM_RAD)));
  const b = SPIT_SIDE_BIAS * x * x * (3 - 2 * x);
  const hx = u[0] + side * b * r[0];
  const hz = u[2] + side * b * r[2];
  return Math.hypot(hx, hz) > 1e-9 ? Math.atan2(hz, hx) : spitHeading(a, side);
}

/** ⭐ The side's bias faded in from this pitch of the view … */
export const SPIT_BIAS_FROM_RAD = (60 * Math.PI) / 180;
/** ⭐ … whole from this one. */
export const SPIT_BIAS_FULL_RAD = (75 * Math.PI) / 180;
/** ⭐ Looking down from this pitch the spit's finger is swapped (`fingerSwapped`, the wiring's `zoneFinger`); below it the heading is the direction's own
 *  (`spitCameraHeading`). ⛔ (2026-11-17, R1) no longer the side change's test: the gizmo's face decides it (`faceSide`). */
export const SPIT_CROSSING_PITCH_RAD = SPIT_BIAS_FROM_RAD;

/**
 * ⭐⭐⭐ (2026-11-17, `TILTED_POLE_CLOSE_IN.md` §13.4 R1, §19 — the owner: *"2- R1"*) THE SIDE OF A BOUND FACE of the spit: the side of the axis `a` its
 * world normal `n` leans to — the sign of its part along `spitSideRef(a)` (a tip's triangle by its part square to the side, its lean along the axis not
 * counted); 0, no side, within `SPIT_SIDE_HYST_DEG` of square to the side (the triangle under or over a tip's end). The GIZMO's banded face decides the
 * spit's side, one band past the edge as every crossing (the wiring's `spitFaceStep`) — ⛔ the camera's direction crossing the vertical plane through the
 * axis (`spitSide` with its 2° band, `crossingPitch`, `overAxisPitch`: deleted): far out the calm keeps the camera near the face's middle, the turn landed
 * 55 – 60 mm into the face beyond the ridge.
 */
export function faceSide(n: Vec3, a: Vec3): number {
  const s = dot(n, spitSideRef(a));
  return Math.abs(s) > Math.sin(SPIT_SIDE_HYST_DEG * D) ? Math.sign(s) : 0;
}

/**
 * ⭐⭐⭐ (2026-11-17, R1) TWO FACES MET ONLY AT A POLE of the spit (`pole`, the tip's apex, in the polygons' frame): both polygons have a corner there (within
 * `tol`) and they share fewer than two corners — no edge between them. The gizmo going from one to the other passed OVER THE APEX (round the tip, the
 * orbit through its pole): no edge was crossed, so the side is not changed there (the next edge settles it). ⛔ Read as an edge's crossing: the turn's
 * end pose swung half round the tip with the calm, the piece and its aim swapped places on the glass (the framing's separation at 179°) and the turn's
 * picture rolled the long way — 60.6° in one frame (`Scene_0bis`'s seeded replay, drag 21).
 */
export function metAtPoleOnly(a: readonly Vec3[], b: readonly Vec3[], pole: Vec3, tol: number): boolean {
  const at = (P: readonly Vec3[], q: Vec3): boolean => P.some((p) => len(sub(p, q)) < tol);
  if (!at(a, pole) || !at(b, pole)) return false;
  // the corners of `a` (a polygon may repeat a point: counted once) that are also corners of `b`
  const shared: Vec3[] = [];
  for (const p of a) if (at(b, p) && !at(shared, p)) shared.push(p);
  return shared.length < 2;
}

/**
 * ⭐⭐⭐ (R1, W3's second half) THE DIRECTION THE SPIT CAMERA'S HEADING IS READ AT on `side` (`spitCameraHeading`): the camera's `u` itself when it is on that
 * side (or on the plane, or no side) — today's heading unchanged; on the other side `u` MIRRORED across the side's plane (the vertical plane through the
 * axis), so the heading keeps the side's sign whatever the camera's lag: continuous across the plane, and looking down on the other side it is the side's
 * own (the picture turned half round — the half turn the gizmo's crossing starts). ⛔ `u` itself with the side the gizmo's: on the other side its level
 * part outweighs the side's bias below ~73°, and the heading passed through its zero as the camera came over — half a turn in a few degrees of path.
 */
export function spitSideView(u: Vec3, a: Vec3, side: number): Vec3 {
  const r = spitSideRef(a);
  const k = dot(u, r);
  if (side === 0 || k * side >= 0) return u;
  return [u[0] - 2 * k * r[0], u[1] - 2 * k * r[1], u[2] - 2 * k * r[2]];
}

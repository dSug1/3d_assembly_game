/**
 * ⭐⭐⭐ prototype (2026-10-26, the owner: *"find a way to maintain the 2D curve current build (dy drives approach and dx drives round the assembly on the 2D
 * curve) by adding a way to rotate the 2D curve (for example, 90 degree rotation currently exist when switching from gizmo hosting vertical to horizontal
 * faces) so that the user can rotate the 2D curve by whichever value he wants and can therefore target any place on the assembly"* → *"1: full circle.
 * 2: on by default, with slider 3: keep it … 4: acceptable … build it"*) — **THE CURVE'S TILT**: the turned 2D curve rotated IN ITS OWN PLANE (about the
 * plane's normal through the gizmo) by any angle, the full circle — 0 the vertical face's curve (its waist level, toward the camera's side), +90° a top
 * face's (the waist straight up), 180° the curve upside down on the far side. The input's tilt (`tiltIn`) runs free; the CURVE takes it through DETENTS at
 * every quarter turn (`tiltDetent`: a dead zone of `curveTiltDetentDeg` about 0°, ±90°, 180° — the two curves a gizmo face snapped by gravity has), so the
 * approach lands square to a face; the gizmo (the curve's anchor on the assembly) follows the FREE aim (`aimPivot`, `aimRay`), so it slides over a face
 * while the curve stays square to it — any place on the assembly.
 * ⛔ ENGINE-FREE. A rotation about an axis and a dead-zone map — textbook; no licence, no patent.
 */
import { orbitOffset } from "./orbit";
import { rigBetaFor, waistV, yawTurn, type RigParams } from "./orbit_rig";
import type { GestureConfig } from "./gestureConfig";
import { cross, dot, normalize, qFromAxisAngle, qmul, qRotate, type Vec3 } from "../core/vec";

const UP: Vec3 = [0, 1, 0];
const level = (a: number): Vec3 => [Math.cos(a), 0, Math.sin(a)];
const QUARTER = Math.PI / 2;

/** ⭐ The turned curve's plane normal (in the turn's own frame, at `yaw0`) — the axis the tilt turns about; `null`: degenerate. */
export function curvePlaneNormal(p: RigParams): Vec3 | null {
  return normalize(qRotate(p.q, cross(level(p.yaw0), UP)));
}

/** ⭐ The turned curve's waist direction (halfway between rings 2 and 3, `waistV`) from the gizmo, in the turn's own frame. */
export function waistDir(cfg: GestureConfig, p: RigParams): Vec3 | null {
  return normalize(qRotate(p.q, orbitOffset(cfg, p.yaw0, waistV(cfg), 1).offsetM));
}

/**
 * ⭐ The curve's TILT (rad, (−π, π]): the waist's angle in the curve's plane above the plane's level line (`up × normal` — the near side's at no tilt). 0 a
 * vertical face's curve, π/2 a top face's, −π/2 an underside's, π the curve turned upside down.
 */
export function curveTilt(cfg: GestureConfig, p: RigParams): number {
  const n = curvePlaneNormal(p);
  const w = waistDir(cfg, p);
  if (n === null || w === null) return 0;
  const h = normalize(cross(UP, n));
  if (h === null) return 0;
  return Math.atan2(dot(w, UP), dot(w, h));
}

/**
 * ⭐⭐ The turn `p` TILTED by `dPhi` (rad) in its own plane — `curveTilt` grows by exactly `dPhi`; its near side kept the way nearer the old one
 * (`rigBetaFor`'s `preferBeta`, `cameraSide` the level direction from the gizmo toward the camera).
 */
export function tiltRig(p: RigParams, dPhi: number, cameraSide: Vec3): RigParams {
  const n = curvePlaneNormal(p);
  if (n === null || dPhi === 0) return p;
  const q = qmul(qFromAxisAngle(n, dPhi), p.q);
  return { q, yaw0: p.yaw0, beta: rigBetaFor(q, p.yaw0, cameraSide, p.beta) };
}

/** ⭐ An angle wrapped to (−π, π]. */
export function wrapTilt(a: number): number {
  return a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
}

/**
 * ⭐⭐ THE DETENTS: the input's tilt `phiIn` → the curve's. Within `zoneRad` of a quarter turn (0, ±π/2, π) the curve sits ON it; beyond, the rest of the
 * eighth is stretched back over it — continuous, monotone, exact at every eighth (π/4 + kπ/2). `zoneRad` 0: none.
 */
export function tiltDetent(phiIn: number, zoneRad: number): number {
  const z = Math.min(Math.max(0, zoneRad), QUARTER / 2 - 1e-6);
  if (z <= 0) return phiIn;
  const c = Math.round(phiIn / QUARTER) * QUARTER;
  const d = phiIn - c;
  if (Math.abs(d) <= z) return c;
  return c + Math.sign(d) * ((Math.abs(d) - z) * (QUARTER / 2)) / (QUARTER / 2 - z);
}

/**
 * ⭐ The FREE aim in the world: the turn `p`'s waist tilted on by `extra` (the input's tilt less the curve's), swung by dx to the orbit's `yaw` — the
 * direction from the assembly toward which the gizmo is looked for.
 */
export function aimDir(cfg: GestureConfig, p: RigParams, yaw: number, extra: number): Vec3 | null {
  const n = curvePlaneNormal(p);
  const w = waistDir(cfg, p);
  if (n === null || w === null) return null;
  return qRotate(yawTurn(yaw - p.yaw0), qRotate(qFromAxisAngle(n, extra), w));
}

/**
 * ⭐ THE PIVOT the aim turns the gizmo about, fixed for a tilt gesture: behind the gizmo `anchor`, along the aim `aim`, as deep as the assembly's centre
 * `centre` is from it — so the aim's ray (`aimRay`) passes through the gizmo where the gesture starts (no jump) and sweeps over the assembly as it turns.
 */
export function aimPivot(anchor: Vec3, aim: Vec3, centre: Vec3): { readonly pivot: Vec3; readonly depth: number } {
  const depth = Math.hypot(centre[0] - anchor[0], centre[1] - anchor[1], centre[2] - anchor[2]);
  return { pivot: [anchor[0] - aim[0] * depth, anchor[1] - aim[1] * depth, anchor[2] - aim[2] * depth], depth };
}

/** ⭐ The ray that finds the gizmo: from outside the assembly (`reach` beyond the pivot's depth) along `−aim` toward the pivot. */
export function aimRay(pivot: Vec3, aim: Vec3, depth: number, reach: number): { readonly origin: Vec3; readonly dir: Vec3; readonly length: number } {
  const out = depth + reach;
  return { origin: [pivot[0] + aim[0] * out, pivot[1] + aim[1] * out, pivot[2] + aim[2] * out], dir: [-aim[0], -aim[1], -aim[2]], length: out + depth };
}

/**
 * ⭐⭐ (2026-10-26) TWO FINGERS: the TILT (both moving the same way, mostly up or down — the maps' tilt gesture) or the ZOOM (apart or together, or sideways),
 * from each finger's travel SINCE THE SECOND LANDED (`d1`, `d2`, mm, screen x right / y down); `null`: undecided. Of the three motions — the common
 * vertical one, the RELATIVE one (the pinch's) and the common horizontal one — the largest decides, once it passes `deadbandMm`.
 * ⛔⛔ (2026-10-27, the owner: *"mobile: two fingers up or down not working: nothing happens"*) — it decided the moment EITHER finger passed the deadband:
 * two real fingers never move in step, so the leading one's travel read as a pinch (3.6 mm against 0.5: relative 3.1 > common 2.05) — a zoom that did nothing;
 * and the first finger's travel was counted from ITS OWN press, its whole orbit drag before the second landed included.
 */
export function twoFingerKind(d1: readonly [number, number], d2: readonly [number, number], deadbandMm: number): "AIM" | "ZOOM" | null {
  // ⭐⭐ (2026-10-27, the owner: *"in mobile phone, how to move the gizmo on horizontal axis ?"* → the proposal → *"build"*) the COMMON motion, up / down
  // AND sideways, is the AIM — the gizmo moved (dy: the tilt, dx: sideways); only the RELATIVE motion (apart, together) is the pinch (⛔ sideways was a zoom)
  const common = Math.hypot((d1[0] + d2[0]) / 2, (d1[1] + d2[1]) / 2);
  const rel = Math.hypot(d2[0] - d1[0], d2[1] - d1[1]);
  if (!(Math.max(common, rel) > deadbandMm)) return null;
  return common >= rel ? "AIM" : "ZOOM";
}

/**
 * ⭐⭐ (2026-10-27) THE AIM TURNED SIDEWAYS: `aim` turned about the world vertical by `rad` — the gizmo's ray swept across the assembly (the curve itself
 * keeps its heading: the gizmo slides, the piece comes in from where it was).
 */
export function aimSideways(aim: Vec3, rad: number): Vec3 {
  return rad === 0 ? aim : qRotate(qFromAxisAngle(UP, rad), aim);
}

/** ⭐ The sign that makes a positive sideways turn move the aim's tip toward the screen's `right` (so finger right, the gizmo right): ±1. */
export function sidewaysSign(aim: Vec3, right: Vec3): 1 | -1 {
  return dot(cross(UP, aim), right) >= 0 ? 1 : -1;
}

/** ⭐ The tilt a step of the two fingers' (or Shift + drag's) dy buys (rad): dy DOWN tilts the waist UP (the orbit's dy sense: finger down, the piece up). */
export function tiltStep(dyMm: number, degPerMm: number): number {
  return (dyMm * degPerMm * Math.PI) / 180;
}

/** ⭐ (2026-10-26) the gizmo's ease toward where the aim's ray lands (ms): ⛔ snapped, it jumped 27 cm in one step where the ray crossed an edge onto another part. */
export const TILT_ANCHOR_TAU_MS = 90;

/** ⭐ One frame of that ease: `cur` toward `target` by `1 − exp(−dt/τ)`, landing on it within 0.1 mm. */
export function anchorToward(cur: Vec3, target: Vec3, dtMs: number, tauMs: number = TILT_ANCHOR_TAU_MS): Vec3 {
  const k = tauMs > 0 && dtMs > 0 ? 1 - Math.exp(-dtMs / tauMs) : 1;
  const next: Vec3 = [cur[0] + (target[0] - cur[0]) * k, cur[1] + (target[1] - cur[1]) * k, cur[2] + (target[2] - cur[2]) * k];
  return Math.hypot(target[0] - next[0], target[1] - next[1], target[2] - next[2]) < 1e-4 ? target : next;
}

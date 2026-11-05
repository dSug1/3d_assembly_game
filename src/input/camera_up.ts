/**
 * ⭐⭐⭐ (2026-11-05, `TILTED_ORBIT_REBUILD_SCOPE.md` §21.4 R2 / R3, §21.5 F2) **THE CAMERA'S UP — A TARGET FROM THE FACE, TAKEN AT THE CAMERA'S PACE**:
 * * the TARGET (`upTarget`): on a WALL (a facet more than 45° from horizontal) gravity's up on the screen — the scene upside up (R2); looking (nearly)
 *   straight down / up at it, the wall's own up CARRIED by the view's tilt (`wallUp` turned by `shortestArc(n, u)` — gravity's projection there depends
 *   on which side the view leans: a slanted up, probed), blended in so the target never flips; on a CAP (a top, a bottom) the AXIS carried onto it
 *   (`capAxis`: the wall's up turned over the edge — §20.1's choice (b), the camera aligned with the cap's axes; no roll at a crossing onto a cap). So the
 *   half roll at a top's far edge and the quarter at its side edge are no rule of their own: the far / side wall's up, reached from the carried axis.
 * * the SHOWN up (`paceUp`) turned toward the target about the view by at most a capped angle a frame (`cameraRollDegPerS`) — a fast finger cannot make a
 *   roll a step (⛔ §21's first build: the roll spread over the GIZMO's 10 mm — one or two frames at a drag's pace: 1486 up jumps, §21.5 cause 3).
 * ⛔ §20's view rule, §21's first build's roll band by the nearest edge (§21.5 cause 1) — replaced.
 * ⛔ ENGINE-FREE. Projections, rotations — textbook.
 */
import { cross, dot, normalize, qFromAxisAngle, qRotate, shortestArc, type Vec3 } from "../core/vec";

/** ⭐ A facet is a CAP (a top, a bottom) when its normal is within 45° of the vertical. */
export const isCap = (n: Vec3): boolean => Math.abs(n[1]) > Math.SQRT1_2;

/** ⭐ `r` made square to the view `u` (unit); `null` along it. */
export function onScreen(r: Vec3, u: Vec3): Vec3 | null {
  const k = dot(r, u);
  return normalize([r[0] - k * u[0], r[1] - k * u[1], r[2] - k * u[2]]);
}

/** ⭐ The view's tilt off the vertical within which a wall's target leans on its limit `∓n` (rad): fully under 5°, none past 20°. */
const NEAR_VERTICAL_LO = (5 * Math.PI) / 180;
const NEAR_VERTICAL_HI = (20 * Math.PI) / 180;

const smooth = (x: number): number => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

/**
 * ⭐⭐⭐ THE TARGET UP for the view along `u` (unit — from the gizmo toward the camera) at a facet of world normal `n`: a wall's gravity, a cap's carried
 * `axis` (none yet: the wall rule's). Unit, square to `u`.
 */
export function upTarget(u: Vec3, n: Vec3, axis: Vec3 | null): Vec3 {
  if (isCap(n) && axis !== null) {
    const a = onScreen(axis, u);
    if (a !== null) return a;
  }
  const g = onScreen([0, 1, 0], u);
  // looking (nearly) straight down / up: the wall's up carried from its square view by the view's tilt — independent of the side the view leans
  const lim = onScreen(qRotate(shortestArc(n, u), wallUp(n)), u);
  const tilt = Math.acos(Math.min(1, Math.abs(u[1])));
  const k = 1 - smooth((tilt - NEAR_VERTICAL_LO) / (NEAR_VERTICAL_HI - NEAR_VERTICAL_LO));
  if (g === null) return lim ?? onScreen([0, 0, 1], u) ?? [0, 1, 0];
  if (lim === null || k <= 0) return g;
  return normalize([g[0] * (1 - k) + lim[0] * k, g[1] * (1 - k) + lim[1] * k, g[2] * (1 - k) + lim[2] * k]) ?? lim;
}

/** ⭐ A wall's own up: gravity laid in its plane (normal `n`); a horizontal facet: `null`. */
export function wallUp(n: Vec3): Vec3 {
  return onScreen([0, 1, 0], n) ?? [0, 0, 1];
}

/**
 * ⭐⭐⭐ The axis a cap (normal `capN`) carries, arrived from a wall (normal `wallN`): the wall's up turned over the edge (`shortestArc(wallN, capN)`) — the
 * red's line across the edge, up the screen both sides. From no wall (a boot on a cap): `up` (the camera's) laid in the cap's plane.
 */
export function capAxis(capN: Vec3, wallN: Vec3 | null, up: Vec3): Vec3 {
  if (wallN !== null && !isCap(wallN)) {
    const a = onScreen(qRotate(shortestArc(wallN, capN), wallUp(wallN)), capN);
    if (a !== null) return a;
  }
  return onScreen(up, capN) ?? onScreen([0, 0, 1], capN) ?? [1, 0, 0];
}

/** ⭐ The signed angle from `a` to `b` about `axis` (rad). */
function angleAbout(a: Vec3, b: Vec3, axis: Vec3): number {
  return Math.atan2(dot(cross(a, b), axis), dot(a, b));
}

/** ⭐ Two ups closer than this (rad) are the same: no roll under way. */
export const UP_SAME_RAD = (1 * Math.PI) / 180;

/**
 * ⭐⭐⭐ THE SHOWN UP: the last one (`prev`, laid square to the new view `u`) turned toward `target` about `u` by at most `maxRad`; `rolling` while it is
 * more than `UP_SAME_RAD` short of it. None before (or along the view): the target.
 */
export function paceUp(prev: Vec3 | null, target: Vec3, u: Vec3, maxRad: number): { readonly up: Vec3; readonly rolling: boolean } {
  const p = prev === null ? null : onScreen(prev, u);
  if (p === null) return { up: target, rolling: false };
  const a = angleAbout(p, target, u);
  if (Math.abs(a) <= maxRad) return { up: target, rolling: false };
  const step = Math.sign(a) * Math.max(0, maxRad);
  return { up: qRotate(qFromAxisAngle(u, step), p), rolling: Math.abs(a - step) > UP_SAME_RAD };
}

/**
 * ⭐⭐⭐ (2026-11-06, the rebuild — scope §22.4 C2, §22.2 T5) THE UP AND THE HOLD FROM THE VIEW (`upTarget`, `nextCarried`, `viewAllowed`) — what follows
 * below is the record of the rules they replace.
 * ⭐⭐⭐ (2026-11-05, `TILTED_ORBIT_REBUILD_SCOPE.md` §21.4 R2 / R3, §21.5 F2) **THE CAMERA'S UP — A TARGET FROM THE FACE, TAKEN AT THE CAMERA'S PACE**:
 * * the TARGET (`upTarget`): ⭐⭐⭐ (§21.8) on a wall AND on a cap gravity's up on the screen — the scene upside up (R2); looking (nearly)
 *   straight down / up at it, the wall's own up CARRIED by the view's tilt (`wallUp` turned by `shortestArc(n, u)` — gravity's projection there depends
 *   on which side the view leans: a slanted up, probed), blended in so the target never flips; on a CAP (a top, a bottom) the AXIS carried onto it
 *   (`capAxis`: the wall's up turned over the edge — §20.1's choice (b), the camera aligned with the cap's axes; no roll at a crossing onto a cap). So the
 *   half roll at a top's far edge and the quarter at its side edge are no rule of their own: the far / side wall's up, reached from the carried axis.
 * * the SHOWN up (`paceUp`) turned toward the target about the view by at most a capped angle a frame (`cameraRollDegPerS`) — a fast finger cannot make a
 *   roll a step (⛔ §21's first build: the roll spread over the GIZMO's 10 mm — one or two frames at a drag's pace: 1486 up jumps, §21.5 cause 3).
 * ⛔ §20's view rule, §21's first build's roll band by the nearest edge (§21.5 cause 1) — replaced.
 * ⛔ ENGINE-FREE. Projections, rotations — textbook.
 */
import { cross, dot, normalize, qFromAxisAngle, qRotate, type Vec3 } from "../core/vec";
import { isCapNormal as isCap } from "./loop_travel";

/** ⭐ `r` made square to the view `u` (unit); `null` along it. */
export function onScreen(r: Vec3, u: Vec3): Vec3 | null {
  const k = dot(r, u);
  return normalize([r[0] - k * u[0], r[1] - k * u[1], r[2] - k * u[2]]);
}

/** ⭐⭐⭐ (§22.4 C2) THE NEAR-VERTICAL CONE: a view within this of straight up / down (rad) — gravity's up has no sure direction on the screen there. */
export const UP_CONE_RAD = (20 * Math.PI) / 180;
/** ⭐⭐⭐ (§22.2 T5) …and leaving it, the most the carried up may differ from gravity's (rad) — beyond, the view would be slanted or upside down: held. */
export const UP_MARGIN_RAD = (20 * Math.PI) / 180;

/** ⭐ Is the view `u` (unit) within the near-vertical cone? */
export const inCone = (u: Vec3): boolean => Math.acos(Math.min(1, Math.abs(u[1]))) < UP_CONE_RAD;

/** ⭐ Gravity's up on the screen for the view `u`; `null` straight along it. */
export const gravityUp = (u: Vec3): Vec3 | null => onScreen([0, 1, 0], u);

/**
 * ⭐⭐⭐ (2026-11-06, scope §22.4 C2 — the owner: *"any face contour that would result in upside down slanted camera view cannot be reached"*) **THE UP — ONE
 * RULE ON THE VIEW, NONE ON THE FACE**: outside the near-vertical cone gravity's up (the scene upright — a wall, a slanted face, a steep cap alike); inside
 * it the up CARRIED from where the view entered it (`carried`, kept by `nextCarried`) — no roll. ⛔ `1.0.102-` / the rebuild's first build: a cap's
 * carried axis whatever the view's lean — seen from the side of a top, the scene turned up to 90°.
 */
export function upTarget(u: Vec3, carried: Vec3 | null): Vec3 {
  const g = gravityUp(u);
  if (!inCone(u) && g !== null) return g;
  return (carried === null ? null : onScreen(carried, u)) ?? g ?? onScreen([0, 0, 1], u) ?? [0, 1, 0];
}

/** ⭐ The up carried to the next view `u`: outside the cone gravity's (the up follows it there), inside the one carried in. */
export function nextCarried(carried: Vec3 | null, u: Vec3): Vec3 | null {
  if (!inCone(u)) return gravityUp(u) ?? carried;
  return carried ?? gravityUp(u);
}

/**
 * ⭐⭐⭐ (§22.2 T5) MAY THE VIEW `u` BE REACHED with the up `carried` so far? Inside the cone always; outside it only where gravity's up is within
 * `UP_MARGIN_RAD` of the carried one — else the scene would show slanted or upside down (the travel holds).
 */
export function viewAllowed(u: Vec3, carried: Vec3 | null): boolean {
  if (inCone(u) || carried === null) return true;
  const g = gravityUp(u);
  const c = onScreen(carried, u);
  if (g === null || c === null) return true;
  return Math.acos(Math.max(-1, Math.min(1, dot(g, c)))) <= UP_MARGIN_RAD;
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

/**
 * ⭐⭐⭐ (2026-11-06, scope §25, the owner: *"build the camera never past the zenith"*) **THE CAMERA NEVER PAST A CAP'S ZENITH**: on a cap (normal `capN`)
 * entered from the wall `entry`, the camera's direction `dir` (from what it looks at toward the camera, unit) kept on the entry side — its component
 * along the entry wall's normal laid in the cap's plane never negative: beyond, that component taken off (straight above / below the look point in that
 * plane, the sideways lean kept). The camera's `up` made square to the new direction. ⛔ The rule bound the piece's direction only (§23 `capProfile`):
 * the camera's pitch offset above-behind the piece carried it ~11° past straight above at a held far edge (probed). Not a cap, no entry: unchanged.
 */
export function capCameraClamp(dir: Vec3, up: Vec3, capN: Vec3, entry: Vec3 | null): { readonly dir: Vec3; readonly up: Vec3 } {
  if (!isCap(capN) || entry === null) return { dir, up };
  const e = onScreen(entry, capN);
  if (e === null) return { dir, up };
  const k = dot(dir, e);
  if (k >= 0) return { dir, up };
  const d = normalize([dir[0] - k * e[0], dir[1] - k * e[1], dir[2] - k * e[2]]);
  if (d === null) return { dir, up };
  return { dir: d, up: onScreen(up, d) ?? up };
}

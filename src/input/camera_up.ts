/**
 * ⭐⭐⭐ (2026-11-05, the frame turn REDESIGNED — `TILTED_ORBIT_REBUILD_SCOPE.md` §20; the owner on Step 6's build: *"camera views upside down … slanted
 * camera views"*) **THE CAMERA'S UP — ONE RULE, TIED TO THE VIEW, NEVER TO THE ORBIT'S FRAME**:
 * * the view more than `UP_CONE_HI` (45°) from the vertical — on every wall, whatever the path that led there — the up is GRAVITY on the screen (§4.5);
 * * within `UP_CONE_LO` (35°) of the vertical — looking down onto a top, up at a bottom — the up is CARRIED: the up it had, kept square to the view as the
 *   view turns (parallel transport); entering the cone it is gravity's, so a crossing onto a top or a bottom rolls nothing, square or not;
 * * between the two, the carried up ROLLED onto gravity by the view's tilt (a smoothstep) — on a box the band is the last 10° before a cap's edge, where the
 *   gizmo crawls its slow stretch (`faceEdgeSlideMm` in `faceEdgeSlideDeg`): the half roll at the FAR edge, the quarter roll at a SIDE edge, none on the
 *   way back (§4.1, §4.3 — at the edge, never mid-face); the roll's sense kept from frame to frame (`phi` unwrapped — a half roll never flips its way).
 * ⛔ Step 6's camera (2026-11-05, reverted on `main`): the up was the turned FRAME's for every view — gravity only along the crossing, 90° off at a top's
 * side edges, 135–180° past its middle (probed: every run that reached a top or a bottom tilted, 12 of 13 upside down).
 * ⛔ ENGINE-FREE. Vectors, a smoothstep — textbook.
 */
import { cross, dot, normalize, qFromAxisAngle, qRotate, type Vec3 } from "../core/vec";

/** ⭐ Within this angle of the vertical (rad) the up is carried. */
export const UP_CONE_LO = (35 * Math.PI) / 180;
/** ⭐ Beyond this angle of the vertical (rad) the up is gravity's. */
export const UP_CONE_HI = (45 * Math.PI) / 180;

/** ⭐ What the rule carries from frame to frame: the up carried (square to the last view), the roll's angle in the band (unwrapped). */
export interface UpCarry {
  readonly up: Vec3 | null;
  readonly phi: number | null;
}
export const UP_FRESH: UpCarry = { up: null, phi: null };

/** ⭐ Gravity's up on the screen for the view along `u` (unit): the world's up made square to it; `null` looking straight up or down. */
export function gravityUp(u: Vec3): Vec3 | null {
  return normalize([-u[0] * u[1], 1 - u[1] * u[1], -u[2] * u[1]]);
}

/** ⭐ The view's angle from the vertical (rad, 0 … π/2) — looking down or up the same. */
export function fromVertical(u: Vec3): number {
  return Math.acos(Math.min(1, Math.abs(u[1]) / Math.max(1e-12, Math.hypot(u[0], u[1], u[2]))));
}

/**
 * ⭐⭐⭐ THE UP for the view along `u` (the camera's axis, unit — either sense) given what was carried; `next` is what to carry to the next frame (only the
 * frame's own camera commits it).
 */
export function cameraUp(u: Vec3, carry: UpCarry): { readonly up: Vec3; readonly next: UpCarry } {
  const th = fromVertical(u);
  const g = gravityUp(u);
  const c0 = carry.up;
  const k = c0 === null ? 0 : dot(c0, u);
  const c = c0 === null ? null : normalize([c0[0] - k * u[0], c0[1] - k * u[1], c0[2] - k * u[2]]);
  if (c === null || (th >= UP_CONE_HI && g !== null)) {
    const up = g ?? c ?? fallbackUp(u);
    return { up, next: { up, phi: null } };
  }
  if (th <= UP_CONE_LO || g === null) return { up: c, next: { up: c, phi: null } };
  // in the band: the carried up rolled onto gravity by the tilt — its sense kept (unwrapped against the last frame's)
  let phi = Math.atan2(dot(cross(c, g), u), dot(c, g));
  if (carry.phi !== null) phi += 2 * Math.PI * Math.round((carry.phi - phi) / (2 * Math.PI));
  const x = (th - UP_CONE_LO) / (UP_CONE_HI - UP_CONE_LO);
  const w = x * x * (3 - 2 * x);
  return { up: qRotate(qFromAxisAngle(u, w * phi), c), next: { up: c, phi } };
}

/** ⭐ Any up square to `u` (nothing to go by): the world's x made square. */
function fallbackUp(u: Vec3): Vec3 {
  return normalize([1 - u[0] * u[0], -u[0] * u[1], -u[0] * u[2]]) ?? [0, 0, 1];
}

/**
 * ⭐⭐⭐ (2026-11-18, `Claude/40_RENDER_SCENE/spec/UPRIGHT_PICTURE.md` §2 step 2 — U0) THE UPRIGHT PICTURE, the pure parts (law U).
 *
 * The owner: *"I want to avoid the roll of the scene in the screen view"* (§0). Per frame, at the camera's stage:
 * * `G` the logic's pose (the ghost, or a timed turn's pose where a turn stays); `L` the framed line (piece → look point, `framedLine`).
 * * `ν` (`viewFromVertical`): the angle between `G`'s view and the world's vertical (rad, [0, π/2]).
 * * `α` (`uprightAngle`): the turn about `L` that puts world-down on the glass's down — closed form (below), the root nearest 0.
 * * `w` (`uprightWeight`): `smoothstep((ν − from)/(full − from))` — 0 within `from` of the vertical (where gravity has no direction on the glass), 1 from
 *   `full`; times the square camera's complement at the call (UD3).
 * * `φ = w·ᾱ` (`uprightStep`): `ᾱ` = `α` unwrapped while `0 < w < 1` (continuous across ±180°), wrapped at `w = 1` (a turn of 2π is the same pose), none at
 *   `w = 0` (`maxDegS` 0: at once — law U as first built). ⭐ Fix round 1 (§6, UD6b): with `maxDegS` > 0 the law in time (`uprightPaced`). The picture `P = poseRolled(G, L, φ)` —
 *   the piece and the look point keep their places on the glass (a turn about the line through both); `φ = 0`: `G` itself, the same object.
 *
 * THE CLOSED FORM. A turn by `a` about the unit `k` turns the camera's axes rigidly (the eye about the line, the look point on it). With `s`, `u` the
 * glass's right and up, `Y` the world's up, gravity is on the glass's vertical when `Y·R(a)s = 0` and `Y·R(a)u > 0`. `Y·R(a)s = A cos a + B sin a + C` with
 * `A = Y·s − (k·Y)(k·s)`, `B = −(k×Y)·s`, `C = (k·Y)(k·s)`: the two roots `atan2(B, A) ± acos(−C / hypot(A, B))`; the one with the glass's up toward the
 * sky, nearest 0. ⛔ NO ROOT (`null`) when `|C| > hypot(A, B)` (the line too near the vertical for any turn about it to level the glass's right) or when
 * neither root has the up toward the sky — the caller holds its last `ᾱ`.
 *
 * ⛔ ENGINE-FREE. Prior art, old and free: the world-up look-at camera (gluLookAt, early 1990s), a smoothstep; no patent, no orientation widget.
 */
import { cross, dot, type Vec3 } from "../core/vec";
import type { CamPose } from "./orbit_tilt";
import { poseAxes, type FramedLine } from "./roll_follow";

/** ⭐ within this of the vertical (deg) the picture is the logic's pose (`w` 0) — the slider `uprightFromDeg` */
export const UPRIGHT_FROM_DEG = 5;
/** ⭐ from this off the vertical (deg) the picture is fully upright (`w` 1) — the slider `uprightFullDeg` */
export const UPRIGHT_FULL_DEG = 25;
/** ⭐⭐⭐ (2026-11-18, `UPRIGHT_PICTURE.md` §6 UD6b — fix round 1) the pace of THE REST, everywhere (deg a second; 0 = at once: law U as first built,
 *  bit for bit) — the slider `uprightMaxDegS` */
export const UPRIGHT_MAX_DEG_S = 720;

const Y: Vec3 = [0, 1, 0];
const wrapPi = (a: number): number => {
  const w = Math.atan2(Math.sin(a), Math.cos(a));
  return w === -Math.PI ? Math.PI : w;
};

/** ⭐ `ν`: the pose's view from the world's vertical (rad, [0, π/2]) — up or down alike. */
export function viewFromVertical(pose: CamPose): number {
  const [f] = poseAxes(pose);
  return Math.acos(Math.min(1, Math.abs(f[1])));
}

/** ⭐ `w`: 0 within `fromDeg` of the vertical, 1 from `fullDeg`, a smoothstep between (`fullDeg ≤ fromDeg`: a step at `fromDeg`). */
export function uprightWeight(nuRad: number, fromDeg: number, fullDeg: number): number {
  const nu = (nuRad * 180) / Math.PI;
  if (!(fullDeg > fromDeg)) return nu >= fromDeg ? 1 : 0;
  const t = Math.min(1, Math.max(0, (nu - fromDeg) / (fullDeg - fromDeg)));
  return t * t * (3 - 2 * t);
}

/** ⭐ Gravity's tilt on the glass (rad, (−π, π]): world-down projected on the glass against the glass's down; `null` the view vertical. */
export function gravityTilt(pose: CamPose): number | null {
  const [f, u, s] = poseAxes(pose);
  const k = -f[1];
  const dp: Vec3 = [-f[0] * k, -1 - f[1] * k, -f[2] * k];
  if (Math.hypot(dp[0], dp[1], dp[2]) < 1e-12) return null;
  return Math.atan2(dot(dp, s), -dot(dp, u));
}

/** ⭐⭐⭐ `α`: the turn about `line` (rad, (−π, π]) that puts gravity on the glass's vertical, the glass's up to the sky — the root nearest 0; `null` none. */
export function uprightAngle(pose: CamPose, line: FramedLine): number | null {
  const [, u, s] = poseAxes(pose);
  const k = line.dir;
  const kY = k[1];
  const kxY = cross(k, Y);
  const A = s[1] - kY * dot(k, s);
  const B = -dot(kxY, s);
  const C = kY * dot(k, s);
  const R = Math.hypot(A, B);
  if (!(R > 1e-12) || Math.abs(C) > R) return null;
  const a0 = Math.atan2(B, A);
  const d = Math.acos(Math.min(1, Math.max(-1, -C / R)));
  // the glass's up at a root: Y·R(a)u = cos a (Y·u − (k·Y)(k·u)) − sin a ((k×Y)·u) + (k·Y)(k·u)
  const Au = u[1] - kY * dot(k, u);
  const Bu = -dot(kxY, u);
  const Cu = kY * dot(k, u);
  let best: number | null = null;
  for (const r of [a0 + d, a0 - d]) {
    const a = wrapPi(r);
    if (!(Au * Math.cos(a) + Bu * Math.sin(a) + Cu > 1e-12)) continue;
    if (best === null || Math.abs(a) < Math.abs(best)) best = a;
  }
  return best;
}

/** ⭐ The law's state: `ᾱ` unwrapped (null: none — `w` 0; law U at once only), the last `φ`, the last `α` read and the last `w` (the carry's). */
export interface UprightState {
  readonly au: number | null;
  readonly phi: number;
  readonly ap: number | null;
  readonly wp?: number;
}
export const UPRIGHT_REST: UprightState = Object.freeze({ au: null, phi: 0, ap: null });

export interface UprightKnobs {
  readonly fromDeg: number;
  readonly fullDeg: number;
  /** THE REST's pace, deg a second; 0 (or less): at once (law U as first built) */
  readonly maxDegS: number;
}

export interface UprightFrame {
  readonly state: UprightState;
  /** the turn about the framed line drawn (rad); exactly 0 where `w` is 0 */
  readonly phi: number;
  readonly w: number;
  readonly nu: number;
  readonly alpha: number | null;
}

/**
 * ⭐⭐⭐ ONE FRAME OF LAW U: `φ` for the logic's pose `pose` about `line` (`scale` in [0, 1] multiplies `w` — the square camera's complement, UD3).
 * `w` 0: `φ` exactly 0 (no cap) and the state at rest. `w` 1: `φ = α` exactly. Between: `w·ᾱ`, its change capped at `maxDegS` × `dtMs` if `maxDegS` > 0
 * (the carry `w·Δα` first, so a rigid roll of the logic is followed exactly).
 */
export function uprightStep(s: UprightState, pose: CamPose, line: FramedLine, dtMs: number, knobs: UprightKnobs, scale = 1, freedTwist: number | null = null): UprightFrame {
  const nu = viewFromVertical(pose);
  const sc = Math.min(1, Math.max(0, Number.isFinite(scale) ? scale : 0));
  const w = uprightWeight(nu, knobs.fromDeg, knobs.fullDeg) * sc;
  if (knobs.maxDegS > 0) return uprightPaced(s, pose, line, dtMs, knobs.maxDegS, w, nu, freedTwist);
  const alpha = w > 0 ? uprightAngle(pose, line) : null;
  let au: number | null;
  if (!(w > 0)) au = null;
  else if (alpha === null) au = s.au;
  else if (s.au === null || w >= 1) au = wrapPi(alpha);
  else au = s.au + wrapPi(alpha - s.au);
  const phi = au === null ? 0 : w * au;
  const state: UprightState = phi === 0 && au === null ? UPRIGHT_REST : { au, phi, ap: w > 0 ? alpha : null };
  return { state, phi, w, nu, alpha };
}

/**
 * ⭐⭐⭐ (2026-11-18, `UPRIGHT_PICTURE.md` §6 — UD6b, UD4b; fix round 1) LAW U IN TIME: `φ` moves in two parts each frame.
 * (1) THE CARRY, at once: `φ + c·wrap(α − α_prev)`, `c = min(w, w_prev)` — exact on any path that stays off the vertical (`w` 1 on both frames: the
 *     picture exactly upright), nothing at the vertical (`1.0.147-`'s picture). ⛔ `c = w` (as §6 wrote it): an `α` read on the frame BEFORE, near
 *     the vertical where it is wild, was carried at the weight AFTER a band crossed in one frame — the 10 flips left by the builder's experiment.
 *     On a FREED change of frame (`freedTwist`, UD4b) the carry is WHOLE instead: the frame's twist of the logic's pose about the framed line undone
 *     (`φ − τ`) — the picture keeps its roll across that frame, at any `w`.
 * (2) THE REST: what is left to the target `w·α` (`α` the root nearest 0; none: held), the short way, closed at `maxDegS` × `dtMs` at most. No unwrap.
 * At the vertical with nothing open: `φ` exactly 0 (the picture is the logic's pose) — the logic's own continuous spin there opens no rest.
 */
function uprightPaced(s: UprightState, pose: CamPose, line: FramedLine, dtMs: number, maxDegS: number, w: number, nu: number, freedTwist: number | null): UprightFrame {
  const alpha = w > 0 ? uprightAngle(pose, line) : null;
  const c = Math.min(w, s.wp ?? 0);
  let pc = s.phi;
  if (freedTwist !== null && Number.isFinite(freedTwist)) pc = wrapPi(s.phi - freedTwist);
  else if (alpha !== null && s.ap !== null && c > 0) pc = s.phi + c * wrapPi(alpha - s.ap);
  const target = !(w > 0) ? 0 : alpha !== null ? w * alpha : pc;
  const e = wrapPi(target - pc);
  const cap = dtMs > 0 ? ((maxDegS * Math.PI) / 180) * (dtMs / 1000) : 0;
  const phi = Math.abs(e) <= cap ? target : wrapPi(pc + Math.sign(e) * cap);
  const state: UprightState = phi === 0 && !(w > 0) ? UPRIGHT_REST : { au: null, phi, ap: alpha, wp: w };
  return { state, phi, w, nu, alpha };
}

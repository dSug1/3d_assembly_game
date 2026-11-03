/**
 * ⭐⭐⭐ (2026-11-02, the owner: *"Revert to commit ff2fca2 … then build the orbit tilt again with all the characteristics that matter … Make a clean
 * design including the lessons learned"*) — **THE ORBIT'S TWO FRAMES AND THE SCREEN'S UP**, engine-free.
 * * THE FACE'S FRAME (`tiltQuat`): the frame the gizmo's sections, its carrier and their rays are read in. Upright on a vertical face; on a face within
 *   `TILT_ON_DEG` of horizontal (off past `TILT_OFF_DEG`: no flicker) its up is TIPPED 90° about the screen's horizontal axis — forward over a top (the
 *   table view: its up away across the top), backward under a bottom — so the gizmo goes x-y there as on a vertical face, not polar. Both its section
 *   planes stay VERTICAL in the world (the red along the heading, the green across it): gravity is kept.
 * * THE ORBIT'S OWN FRAME: the frame its angles (yaw, pitch) are read in — the face's after a switch, re-tilted past `ANTI_POLE_RAD` of pitch so no pole is
 *   ever reached (`antiPoleQuat`: no gimbal lock — a continued dy goes on round), back to the face's at rest.
 * * A RE-BASE moves nothing: every orbit place re-read in the new frame on its own direction (`frameAngles`); the finger's axes kept (`signAfter`).
 * * THE SCREEN'S UP (`screenUpTarget`): gravity's, but looking steeply down or up the face's frame up; a jump of it ROLLED over the travel (`rollUp`).
 * ⛔ ENGINE-FREE. Quaternions, spherical angles, hysteresis, an eased turn — textbook; no licence, no patent.
 */
import { cross, dot, normalize, qconj, qFromAxisAngle, qmul, qRotate, IDENTITY, type Quat, type Vec3 } from "../core/vec";

/** ⭐ The face's tilt: 0 upright (a vertical face), 1 over a top, −1 under a bottom. */
export type TiltKind = -1 | 0 | 1;
/** ⭐ A face is HORIZONTAL within this of its normal to the vertical (°); it stops being so only past `TILT_OFF_DEG` (no flicker at 45°). */
export const TILT_ON_DEG = 40;
export const TILT_OFF_DEG = 50;

/** ⭐ The tilt the gizmo's face `n` asks for, from the one in force (`now`); none read (`null`): kept. */
export function tiltWanted(n: Vec3 | null, now: TiltKind): TiltKind {
  const m = n === null ? null : normalize(n);
  if (m === null) return now;
  const on = Math.cos((TILT_ON_DEG * Math.PI) / 180);
  const off = Math.cos((TILT_OFF_DEG * Math.PI) / 180);
  if (now !== 0 && m[1] * now >= off) return now; // kept until past 50°
  return m[1] >= on ? 1 : m[1] <= -on ? -1 : 0;
}

/**
 * ⭐ The face's frame (its → the world's): 90° about the horizontal axis square to `heading` (toward the assembly, flattened) — over a top its up goes to
 * the heading, under a bottom to its opposite; upright, the identity.
 */
export function tiltQuat(kind: TiltKind, heading: Vec3): Quat {
  const h = normalize([heading[0], 0, heading[2]]);
  if (kind === 0 || h === null) return IDENTITY;
  const to: Vec3 = kind === 1 ? h : [-h[0], 0, -h[2]];
  const axis = normalize(cross([0, 1, 0], to));
  return axis === null ? IDENTITY : qFromAxisAngle(axis, Math.PI / 2);
}

/**
 * ⭐⭐ (2026-11-02, the third audit's A1) THE FACE FRAME'S HEADING from the camera — its forward `f` and its screen up `up`, laid on the ground: over a top
 * `f + up` (looking down, the up is the way away), under a bottom `f − up` (looking up, the up's ground part points BACK: ⛔ `f + up` there is
 * `(cos a − sin a)·h` — nothing at 45°, reversed beyond: the frame's up flipped and the screen rolled uncontrollably under an overhang).
 */
export function faceHeading(kind: TiltKind, f: Vec3, up: Vec3): Vec3 {
  const k = kind === -1 ? -1 : 1;
  return [f[0] + k * up[0], 0, f[2] + k * up[2]];
}

/** ⭐ A direction into a frame `q` from the world, and back. */
export function toFrame(q: Quat, d: Vec3): Vec3 {
  return qRotate(qconj(q), d);
}
export function fromFrame(q: Quat, d: Vec3): Vec3 {
  return qRotate(q, d);
}
/** ⭐ A point into a frame `q` about the centre `c`, and back. */
export function toFramePoint(q: Quat, c: Vec3, p: Vec3): Vec3 {
  const r = toFrame(q, [p[0] - c[0], p[1] - c[1], p[2] - c[2]]);
  return [c[0] + r[0], c[1] + r[1], c[2] + r[2]];
}
export function fromFramePoint(q: Quat, c: Vec3, p: Vec3): Vec3 {
  const r = fromFrame(q, [p[0] - c[0], p[1] - c[1], p[2] - c[2]]);
  return [c[0] + r[0], c[1] + r[1], c[2] + r[2]];
}

/** ⭐ The orbit's angles (`yaw`, the ring parameter `v`: −90° at 0, level at ½) of a direction `d` given in a frame, the yaw nearest `yaw0`; `null` for none. */
export function frameAngles(d: Vec3, yaw0: number): { yaw: number; v: number } | null {
  const u = normalize(d);
  if (u === null) return null;
  const ya = Math.hypot(u[0], u[2]) > 1e-9 ? Math.atan2(u[2], u[0]) : yaw0;
  const yaw = yaw0 + Math.atan2(Math.sin(ya - yaw0), Math.cos(ya - yaw0));
  const p = Math.asin(Math.max(-1, Math.min(1, u[1])));
  return { yaw, v: Math.min(1, Math.max(0, (p / (Math.PI / 2) + 1) / 2)) };
}

/** ⭐ The orbit's direction's steps per radian of pitch and of yaw at (`yaw`, `v`), in its frame. */
export function frameSteps(yaw: number, v: number): { readonly pitch: Vec3; readonly yaw: Vec3 } {
  const p = (2 * Math.min(1, Math.max(0, v)) - 1) * (Math.PI / 2);
  return { pitch: [-Math.sin(p) * Math.cos(yaw), Math.cos(p), -Math.sin(p) * Math.sin(yaw)], yaw: [-Math.cos(p) * Math.sin(yaw), 0, Math.cos(p) * Math.cos(yaw)] };
}

/**
 * ⭐ THE FINGER'S AXIS KEPT ACROSS A RE-BASE: its step went along `oldStep` (world) and goes along `newStep`; opposite, its sign flips — the same finger the
 * same way in the world (⛔ re-expressed over a narrow top, *"dy up"* came back up the far face: the gizmo rocked over it, 13 switches in one drag). An
 * axis with no direction there (the yaw at a pole) keeps its sign.
 */
export function signAfter(sign: 1 | -1, oldStep: Vec3, newStep: Vec3): 1 | -1 {
  if (!(Math.hypot(...oldStep) > 0.05 && Math.hypot(...newStep) > 0.05)) return sign;
  return dot(oldStep, newStep) < 0 ? (sign === 1 ? -1 : 1) : sign;
}

/**
 * ⭐ A finger's axis SIGN read off the screen: +1 where the orbit's step (`stepW`) goes the screen's way (`axisW` — its right for dx, its up for dy), −1
 * against; kept where they are near square. At rest only — mid-drag the sign is kept across a re-base (`signAfter`) — ⛔ kept for good, after the view went
 * over the top and rolled upright again a dy went the wrong way.
 */
export function signOnScreen(sign: 1 | -1, stepW: Vec3, axisW: Vec3): 1 | -1 {
  const a = Math.hypot(...stepW);
  const b = Math.hypot(...axisW);
  if (!(a > 1e-6 && b > 1e-6)) return sign;
  const c = dot(stepW, axisW) / (a * b);
  return Math.abs(c) < 0.2 ? sign : c > 0 ? 1 : -1;
}

/**
 * ⭐⭐ NO POLE: past `ANTI_POLE_RAD` of pitch, the orbit's frame `q` turned about its yaw's axis at the piece so the piece's direction lies on its equator
 * (the caller re-bases on it: nothing moves); `null` within it. ⛔ The angles ran into the pole: dx meaningless, dy stopped dead (the camera under the floor).
 */
export const ANTI_POLE_RAD = (60 * Math.PI) / 180;
export function antiPoleQuat(q: Quat, yaw: number, v: number): Quat | null {
  const p = (2 * Math.min(1, Math.max(0, v)) - 1) * (Math.PI / 2);
  if (!(Math.abs(p) > ANTI_POLE_RAD)) return null;
  const axis = normalize(fromFrame(q, [-Math.sin(yaw), 0, Math.cos(yaw)]));
  if (axis === null) return null;
  // the turn by the pitch about the yaw's axis, the sense that brings the direction down to the equator
  const u = fromFrame(q, [Math.cos(p) * Math.cos(yaw), Math.sin(p), Math.cos(p) * Math.sin(yaw)]);
  const turned = (s: number): Quat => qmul(qFromAxisAngle(axis, s * p), q);
  const lat = (c: Quat): number => Math.abs(toFrame(c, u)[1]);
  return lat(turned(1)) <= lat(turned(-1)) ? turned(1) : turned(-1);
}

/** ⭐ `a` laid square to the unit `dir` (unit), with how much of it was left; `null` along it. */
function square(a: Vec3, dir: Vec3): { v: Vec3 | null; n: number } {
  const k = dot(a, dir);
  const w: Vec3 = [a[0] - k * dir[0], a[1] - k * dir[1], a[2] - k * dir[2]];
  const n = Math.hypot(w[0], w[1], w[2]);
  return { v: n > 1e-6 ? [w[0] / n, w[1] / n, w[2] / n] : null, n };
}

/**
 * ⭐⭐⭐ THE SCREEN'S UP — VERTICALS KEPT: the world's up laid square to the view `dir` while it is more than 30° off the vertical (gravity straight down
 * the screen); within 30° … 10° blended to the face's frame up (`faceUp` — over a top the way away across it), within 10° that one; neither defined, the
 * one before (`prev`). ⛔ The tilted frame's own up everywhere: off a top the world's vertical lay slanted.
 */
export function screenUpTarget(dir: Vec3, faceUp: Vec3, prev: Vec3 | null): Vec3 {
  const w = square([0, 1, 0], dir);
  const pv = prev === null ? null : square(prev, dir).v;
  const fs = square(faceUp, dir);
  const f = fs.n > 0.1 ? fs.v : pv;
  const lo = Math.sin((10 * Math.PI) / 180);
  const hi = Math.sin((30 * Math.PI) / 180);
  const x = Math.min(1, Math.max(0, (w.n - lo) / (hi - lo)));
  const s = x * x * (3 - 2 * x);
  if (w.v === null || s <= 0) return f ?? w.v ?? pv ?? [0, 1, 0];
  if (f === null || s >= 1) return w.v;
  // ⭐⭐ (2026-11-02) near a half turn between the two the way round is the one nearer the up before (`prev`) — ⛔ the rounding's: just past straight
  // above (the face's up there the one before, gravity's the opposite) the blend's way round flipped frame to frame, the screen's up 179° in one frame
  if (pv !== null && Math.abs(signedTurn(f, w.v, dir)) > Math.PI - HALF_TURN_BAND_RAD) {
    const a = turnToward(f, w.v, dir, s, 1);
    const b = turnToward(f, w.v, dir, s, -1);
    return dot(a, pv) >= dot(b, pv) ? a : b;
  }
  return turnToward(f, w.v, dir, s);
}

/** ⭐ The unit `a` turned about `dir` toward `b` (both square to it) by `share` of the angle between them — near a half turn, the way `sense` says. */
function turnToward(a: Vec3, b: Vec3, dir: Vec3, share: number, sense: 1 | -1 | 0 = 0): Vec3 {
  return qRotate(qFromAxisAngle(dir, signedTurn(a, b, dir, sense) * share), a);
}

/** ⭐ Within this of a half turn (rad) the way round is the latched `sense`'s, never the sign the rounding gives. */
export const HALF_TURN_BAND_RAD = (30 * Math.PI) / 180;

/**
 * ⭐⭐ (2026-11-02, the owner: *"a small dy … looks like a jump of the piece with a roll of the camera"*) THE SIGNED TURN from `a` to `b` about `dir` — near
 * a half turn the way `sense` says. ⛔ The sign of a turn of ~180° is the rounding's: going over the top the roll's way round flipped from one frame to
 * the next, the screen's up turned 177° in one frame (measured headless).
 */
export function signedTurn(a: Vec3, b: Vec3, dir: Vec3, sense: 1 | -1 | 0 = 0): number {
  let ang = Math.atan2(dot(cross(a, b), dir), dot(a, b));
  if (sense !== 0 && Math.abs(ang) > Math.PI - HALF_TURN_BAND_RAD && Math.sign(ang) !== sense) ang += sense * 2 * Math.PI;
  return ang;
}

/** ⭐ A roll's way round, latched at its start: the shorter one, a half turn counted positive. */
export function rollSense(from: Vec3, to: Vec3, dir: Vec3): 1 | -1 {
  const a = square(from, dir).v;
  const b = square(to, dir).v;
  if (a === null || b === null) return 1;
  const ang = Math.atan2(dot(cross(a, b), dir), dot(a, b));
  return Math.abs(ang) > Math.PI - 1e-6 || ang >= 0 ? 1 : -1;
}

/**
 * ⭐⭐⭐ (2026-11-03) A world step `stepW` as the screen shows it: its direction along the screen's `right` and `up` (unit), `null` seen end-on (its shadow on
 * the screen under `minShare` of its length — the caller keeps the one before).
 */
export function screenDir(stepW: Vec3, right: Vec3, up: Vec3, minShare = 0.15): [number, number] | null {
  const l = Math.hypot(stepW[0], stepW[1], stepW[2]);
  if (!(l > 1e-12)) return null;
  const x = dot(stepW, right);
  const y = dot(stepW, up);
  const s = Math.hypot(x, y);
  return s > minShare * l ? [x / s, y / s] : null;
}

/**
 * ⭐⭐⭐ (2026-11-03, the owner: *"Make sure that after a camera roll, the delta position direction on the screen and the gizmo direction are always the
 * same. Blend that properly during the camera roll"*) — **THE FINGER ON THE GIZMO'S AXES AS THE SCREEN SHOWS THEM**: a finger's step (`dx` right, `dy`
 * down, px) laid onto the screen directions (`screenDir`, (right, up)) of the gizmo's steps for a +yaw (`yawS`) and a +pitch (`pitchS`) of the orbit —
 * the yaw and pitch amounts in the orbit drag's own terms (the yaw's as a dx, the pitch's as a dy). The gizmo then goes along the finger's own shadow on
 * its two axes: never against the finger on the screen, through a roll whatever its angle (a quarter turn in, a dx drives the pitch), and exactly the
 * signs' rule (`signOnScreen`) where the axes lie along the screen's.
 */
export function fingerOnAxes(dx: number, dy: number, yawS: readonly [number, number], pitchS: readonly [number, number]): { yaw: number; pitch: number } {
  const fr = dx;
  const fu = -dy;
  return { yaw: fr * yawS[0] + fu * yawS[1], pitch: -(fr * pitchS[0] + fu * pitchS[1]) };
}

/** ⭐ The angle between two ups laid square to the view `dir` (rad); π if either is along it. */
export function upAngle(a: Vec3, b: Vec3, dir: Vec3): number {
  const p = square(a, dir).v;
  const q = square(b, dir).v;
  if (p === null || q === null) return Math.PI;
  return Math.acos(Math.max(-1, Math.min(1, dot(p, q))));
}

/** ⭐ An up that jumps by more than this from one frame to the next (rad) — a switch looking steeply, the view over the top — is ROLLED, never shown at once. */
export const ROLL_START_RAD = (8 * Math.PI) / 180;

/**
 * ⭐ The screen's up during a roll: from `from` to `to` about the view `dir` by `share` (0 … 1), the way `sense` latched (a half turn kept one way).
 * ⭐ (2026-11-02) LINEAR in the share — the share goes at the view's cap per mm (`rollTakes`), so the picture turns at the cap (⛔ eased, mid-roll it
 * turned 1.5× the cap: 10° a frame against the orbit's 7°).
 */
export function rollUp(from: Vec3, to: Vec3, dir: Vec3, share: number, sense: 1 | -1 | 0 = 0): Vec3 {
  const a = square(from, dir).v;
  const b = square(to, dir).v;
  if (b === null) return to;
  if (a === null) return b;
  return turnToward(a, b, dir, Math.min(1, Math.max(0, share)), sense);
}

/**
 * ⭐⭐⭐ (2026-11-02, the owner: *"Can also the angular travel per mm input on horizontal face made the same as the angular travel per mm input on vertical
 * face … clamping the angular travel per mm input for any face"*) — **THE VIEW'S TURN**: the angle of the rotation that takes the camera frame (`dir0`,
 * `up0`) to (`dir1`, `up1`) — its look and its roll together, as the eye sees the picture turn (a yaw about the vertical at any pitch is its own angle;
 * a spin of the picture straight above counts whole). `null` for a frame with no direction.
 */
export function frameTurn(dir0: Vec3, up0: Vec3, dir1: Vec3, up1: Vec3): number | null {
  const f = (d: Vec3, u: Vec3): [Vec3, Vec3, Vec3] | null => {
    const z = normalize(d);
    if (z === null) return null;
    const y = square(u, z).v;
    if (y === null) return null;
    return [cross(y, z), y, z];
  };
  const a = f(dir0, up0);
  const b = f(dir1, up1);
  if (a === null || b === null) return null;
  // trace(B·Aᵀ) = Σ dot(b_i, a_i)
  const tr = dot(a[0], b[0]) + dot(a[1], b[1]) + dot(a[2], b[2]);
  return Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2)));
}

/** ⭐ The share of a step the governor lets through: its view turn `turnRad` held to `capRad` (1: within it). */
export function viewTurnScale(turnRad: number, capRad: number): number {
  if (!(turnRad > capRad)) return 1;
  return capRad > 0 ? capRad / turnRad : 0;
}

/**
 * ⭐⭐ A ROLL TAKES THE FINGER'S TRAVEL FIRST, at the cap (`capRadPerMm`): of `travelMm`, what the roll left of `angleRad` at `share` takes — its new share,
 * and the travel left for the orbit. The piece waits while the camera rolls (⛔ the roll ran over `orbitTiltBlendMm` whatever its angle: half a turn in
 * 10 mm while the orbit went on).
 */
export function rollTakes(share: number, angleRad: number, travelMm: number, capRadPerMm: number): { readonly share: number; readonly left: number } {
  const t = Math.max(0, travelMm);
  if (!(angleRad > 1e-9) || !(capRadPerMm > 0)) return { share: 1, left: t };
  const needMm = ((1 - Math.min(1, Math.max(0, share))) * angleRad) / capRadPerMm;
  const take = Math.min(t, needMm);
  return { share: take >= needMm ? 1 : share + (take * capRadPerMm) / angleRad, left: t - take };
}

/**
 * ⭐⭐⭐ (2026-11-02, the owner: *"smoothed … by travel of the camera and piece with delta position and limitation of delta position input to the gizmo"*)
 * **THE SHOWN GIZMO'S STEP HELD TO THE FINGER**: at most `mmPerMm` of gizmo per mm of the finger's travel this frame, plus `restMps` by time (so a gizmo
 * left behind still arrives, at a walk). ⛔ Over a thin top or under the bottom the gizmo leapt 0.35–0.5 m in one frame, eased over 90 ms: the piece
 * and the camera with it. (m)
 */
export function gizmoStepCap(travelMm: number, dtMs: number, mmPerMm: number, restMps: number): number {
  return (Math.max(0, travelMm) * Math.max(0, mmPerMm)) / 1000 + (Math.max(0, restMps) * Math.max(0, dtMs)) / 1000;
}

/**
 * ⭐⭐⭐ (2026-11-02, the owner: *"Roll freeze: I liked what was implemented in 65a691a. I am OK to have the 180 roll, provided this is not too often"*) — A
 * ROLL'S SHARE after `travelMm` more of the finger's travel over `spanMm` (`orbitTiltBlendMm`; 0: at once): the roll goes on WITH the orbit — the piece never
 * waits. ⛔ `rollTakes` (the roll taking the travel first at the view's cap, the piece waiting — the "roll freeze") is no longer wired; kept for its vectors.
 */
export function rollShare(share: number, travelMm: number, spanMm: number): number {
  return spanMm > 0 ? Math.min(1, share + Math.max(0, travelMm) / spanMm) : 1;
}

/** ⭐ With no finger on the glass a roll goes on by time: its whole in this (ms) — ⛔ a coast's switch held its roll half done until the next drag. */
export const ROLL_REST_MS = 300;

/** ⭐⭐ A switch of the face's frame waits for this share of its roll's travel since the last one — ⛔ at an edge the frames ping-ponged frame after frame. */
export const SWITCH_HOLD_SHARE = 0.5;

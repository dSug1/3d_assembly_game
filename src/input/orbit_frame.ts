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
  return turnToward(f, w.v, dir, s);
}

/** ⭐ The unit `a` turned about `dir` toward `b` (both square to it) by `share` of the angle between them. */
function turnToward(a: Vec3, b: Vec3, dir: Vec3, share: number): Vec3 {
  const ang = Math.atan2(dot(cross(a, b), dir), dot(a, b));
  return qRotate(qFromAxisAngle(dir, ang * share), a);
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

/** ⭐ The screen's up during a roll: from `from` to `to` about the view `dir` by `share` (0 … 1, eased). */
export function rollUp(from: Vec3, to: Vec3, dir: Vec3, share: number): Vec3 {
  const a = square(from, dir).v;
  const b = square(to, dir).v;
  if (b === null) return to;
  if (a === null) return b;
  const x = Math.min(1, Math.max(0, share));
  return turnToward(a, b, dir, x * x * (3 - 2 * x));
}

/** ⭐ A roll's share after `travelMm` more of the finger's travel over `spanMm` (0: at once). */
export function rollShare(share: number, travelMm: number, spanMm: number): number {
  return spanMm > 0 ? Math.min(1, share + Math.max(0, travelMm) / spanMm) : 1;
}

/** ⭐ With no finger on the glass a roll goes on by time: its whole in this (ms) — ⛔ a coast's switch held its roll half done until the next drag. */
export const ROLL_REST_MS = 300;

/** ⭐⭐ A switch of the face's frame waits for this share of its roll's travel since the last one — ⛔ at an edge the frames ping-ponged frame after frame. */
export const SWITCH_HOLD_SHARE = 0.5;

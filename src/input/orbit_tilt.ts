/**
 * ⭐⭐⭐ (2026-11-02, the owner: *"When the orbit gizmo reaches a horizontal face (or a face close to horizontal …), I would like to rotate the full orbit so
 * that the orbit replicates on the horizontal face what it does on the vertical face … the gizmo is always driven on a x-y system (as it is now on a
 * vertical hosting face), not a theta-radius polar system"* → *"1- yes 2- yes 3- yes 4- dy travel with a slider in CAMERA ORBIT AROUND CENTER"*) — **THE
 * ORBIT TILTED ONTO A HORIZONTAL FACE**. The orbit around the assembly keeps one "up"; its gizmo's two sections are read from it (the green the cut
 * square to it at the gizmo, the red the plane along the heading through it). On a face within 40° of horizontal (a top, a bottom; back below 50°) the
 * orbit's up is TIPPED 90° about the screen's horizontal axis — forward over a top (its up then points AWAY across it, the table view), backward under a
 * bottom — so the face is, to the orbit, a vertical face facing the camera: dx sideways across it, dy toward / away, each line on over its edges, the
 * pitch's pole at the middle of the front and back faces. Everything of the orbit's own (the carrier, the sections, the piece's direction, the camera's
 * offsets) is computed in that FRAME — the world mapped in by `tiltPointO` / `tiltDirO`, the answers back by `tiltPointW` / `tiltDirW`, about the
 * assembly's centre; nothing else reads it (the approach, the slide, the lock, the quads, the collision are the world's). Engine-free.
 */
import { cross, dot, normalize, qconj, qFromAxisAngle, qmul, qRotate, IDENTITY, type Quat, type Vec3 } from "../core/vec";

/** ⭐ The tilt: 0 none (a vertical face), 1 over a top, −1 under a bottom. */
export type TiltKind = -1 | 0 | 1;

/** ⭐ A face is HORIZONTAL within this angle of its normal to the vertical (°) — the tilt goes on; it comes off only past `TILT_OFF_DEG` (no flicker at 45°). */
export const TILT_ON_DEG = 40;
export const TILT_OFF_DEG = 50;

/** ⭐ The tilt the gizmo's face `n` asks for, from the one in force (`now`): on within `TILT_ON_DEG` of up (1) or down (−1), kept until past `TILT_OFF_DEG`. */
export function tiltWanted(n: Vec3 | null, now: TiltKind): TiltKind {
  if (n === null) return now;
  const l = Math.hypot(n[0], n[1], n[2]);
  if (!(l > 1e-12)) return now;
  const c = n[1] / l; // the cosine to the world's up
  const on = Math.cos((TILT_ON_DEG * Math.PI) / 180);
  const off = Math.cos((TILT_OFF_DEG * Math.PI) / 180);
  if (now === 1) return c >= off ? 1 : c <= -on ? -1 : 0;
  if (now === -1) return c <= -off ? -1 : c >= on ? 1 : 0;
  return c >= on ? 1 : c <= -on ? -1 : 0;
}

/**
 * ⭐ The tilt's rotation (the orbit's frame → the world): 90° about the horizontal axis square to `heading` (the camera's, flattened, toward the assembly)
 * — over a top the orbit's up goes to `heading` (away across the top), under a bottom to `−heading`; none: the identity. The face's normal then lies,
 * in the orbit's frame, along `−heading`: toward the camera, as a vertical face's does.
 */
export function tiltQuat(kind: TiltKind, heading: Vec3): Quat {
  if (kind === 0) return IDENTITY;
  const h = normalize([heading[0], 0, heading[2]]);
  if (h === null) return IDENTITY;
  const to: Vec3 = kind === 1 ? h : [-h[0], 0, -h[2]];
  const axis = normalize(cross([0, 1, 0], to));
  return axis === null ? IDENTITY : qFromAxisAngle(axis, Math.PI / 2);
}

/** ⭐ A direction from the orbit's frame to the world (`q` the tilt), and back. */
export function tiltDirW(q: Quat, d: Vec3): Vec3 {
  return qRotate(q, d);
}
export function tiltDirO(q: Quat, d: Vec3): Vec3 {
  return qRotate(qconj(q), d);
}
/** ⭐ A point from the orbit's frame to the world, about the assembly's centre `c`, and back. */
export function tiltPointW(q: Quat, c: Vec3, p: Vec3): Vec3 {
  const r = qRotate(q, [p[0] - c[0], p[1] - c[1], p[2] - c[2]]);
  return [c[0] + r[0], c[1] + r[1], c[2] + r[2]];
}
export function tiltPointO(q: Quat, c: Vec3, p: Vec3): Vec3 {
  const r = qRotate(qconj(q), [p[0] - c[0], p[1] - c[1], p[2] - c[2]]);
  return [c[0] + r[0], c[1] + r[1], c[2] + r[2]];
}

/**
 * ⭐ The orbit's angles (`yaw`, the ring parameter `v`: −90° at 0, level at ½, +90° at 1) of a direction `d` given IN ITS FRAME, the yaw kept nearest
 * `yaw0` — a tilt's switch re-bases the orbit on them, so the piece's direction in the world does not move (nothing swings: only the axes the next dx
 * and dy follow change).
 */
export function tiltAngles(d: Vec3, yaw0: number): { yaw: number; v: number } | null {
  const u = normalize(d);
  if (u === null) return null;
  const flat = Math.hypot(u[0], u[2]) > 1e-9;
  const ya = flat ? Math.atan2(u[2], u[0]) : yaw0;
  const yaw = yaw0 + Math.atan2(Math.sin(ya - yaw0), Math.cos(ya - yaw0));
  const p = Math.asin(Math.max(-1, Math.min(1, u[1])));
  return { yaw, v: Math.min(1, Math.max(0, (p / (Math.PI / 2) + 1) / 2)) };
}

/**
 * ⭐ THE SCREEN'S ROLL AT A SWITCH, over the drag's travel: the camera's up turned from the one it had (`fromUp`) to the new frame's (`toUp`) by `share`
 * (0 … 1, eased), both laid square to the view `dir`. ⭐ (*"4- dy travel with a slider"*) — the share is the finger's travel over `orbitTiltBlendMm`.
 */
export function tiltRollUp(fromUp: Vec3, toUp: Vec3, dir: Vec3, share: number): Vec3 {
  const s = Math.min(1, Math.max(0, share));
  const e = s * s * (3 - 2 * s);
  const flat = (u: Vec3): Vec3 | null => {
    const k = dot(u, dir);
    return normalize([u[0] - k * dir[0], u[1] - k * dir[1], u[2] - k * dir[2]]);
  };
  const a = flat(fromUp);
  const b = flat(toUp);
  if (b === null) return toUp;
  if (a === null) return b;
  // the turn about the view from a to b, its share
  const ang = Math.atan2(dot(cross(a, b), dir), dot(a, b));
  return qRotate(qFromAxisAngle(dir, ang * e), a);
}
/**
 * ⭐⭐⭐ (2026-11-02, the owner: *"some configurations where the orbit is stuck at some edge"*) — **THE FINGER'S AXES KEPT ACROSS A SWITCH**. The orbit's
 * direction moves, under a step of one angle, along `oldStep` (the world's, in the frame it leaves) and `newStep` (in the frame it enters); where they
 * point opposite ways that axis's SIGN flips, so the same finger goes on the same way in the world (⛔ re-expressed over a narrow top, *"dy up"* came back
 * up on the far face: under one drag the gizmo rocked over the top and back, 13 switches, the camera swinging with it). An axis with no direction there
 * (the yaw at a pole) keeps its sign.
 */
export function tiltSignAfter(sign: 1 | -1, oldStep: Vec3, newStep: Vec3): 1 | -1 {
  const a = Math.hypot(oldStep[0], oldStep[1], oldStep[2]);
  const b = Math.hypot(newStep[0], newStep[1], newStep[2]);
  if (!(a > 0.05 && b > 0.05)) return sign;
  return dot(oldStep, newStep) < 0 ? (sign === 1 ? -1 : 1) : sign;
}
/** ⭐ The orbit's direction's steps (the frame's own) per radian of pitch and of yaw at (`yaw`, `v`) — `orbitDir`'s derivatives. */
export function orbitDirSteps(yaw: number, v: number): { pitch: Vec3; yaw: Vec3 } {
  const p = (2 * Math.min(1, Math.max(0, v)) - 1) * (Math.PI / 2);
  return { pitch: [-Math.sin(p) * Math.cos(yaw), Math.cos(p), -Math.sin(p) * Math.sin(yaw)], yaw: [-Math.cos(p) * Math.sin(yaw), 0, Math.cos(p) * Math.cos(yaw)] };
}
/**
 * ⭐⭐ (2026-11-02) A switch of the face's frame waits for the roll it started to reach this share (half its travel): ⛔ at an edge the drop landed on the
 * other face after each switch and the frames ping-ponged frame after frame (the piece 40 px each time, measured).
 */
export const TILT_HOLD_SHARE = 0.5;
/** ⭐ The screen's up turned by more than this from the one before (rad) — over the top of the view, gravity's up reversed — is ROLLED over the travel. */
export const UP_FLIP_RAD = Math.PI / 3;
/** ⭐ The angle between two ups laid square to the view `u` (rad); π with either undefined. */
export function upTurn(a: Vec3, b: Vec3, u: Vec3): number {
  const f = (x: Vec3): Vec3 | null => {
    const k = dot(x, u);
    return normalize([x[0] - k * u[0], x[1] - k * u[1], x[2] - k * u[2]]);
  };
  const p = f(a);
  const q = f(b);
  if (p === null || q === null) return Math.PI;
  return Math.acos(Math.max(-1, Math.min(1, dot(p, q))));
}
/** ⭐ The roll's share after `travelMm` more of the finger's travel, over `spanMm` (0: at once). */
export function tiltRollShare(share: number, travelMm: number, spanMm: number): number {
  if (!(spanMm > 0)) return 1;
  return Math.min(1, share + Math.max(0, travelMm) / spanMm);
}

/**
 * ⭐⭐⭐ (2026-11-02, the owner: *"make sure you avoid gimbal lock in this implementation of the orbit tilt when the gizmo keeps being traveled"*) — **NO
 * POLE REACHED: THE ORBIT'S OWN FRAME RE-TILTED**. The orbit's angles (yaw, pitch) have two poles, where dx stops meaning anything and dy hits a stop (⛔
 * measured: down the painting's back face to its foot, the orbit stopped dead at the lower pole, the camera under the floor). Past `ANTI_POLE_RAD` of
 * pitch the frame the angles are read in (`q`, the orbit's — apart from the face's, which the sections read) is turned about the yaw's own axis at the
 * piece so the piece's direction lies on its equator again (the caller re-bases on it: nothing moves). `null` within it.
 */
export const ANTI_POLE_RAD = (60 * Math.PI) / 180;
export function antiPoleQuat(q: Quat, yaw: number, v: number): Quat | null {
  const p = (2 * Math.min(1, Math.max(0, v)) - 1) * (Math.PI / 2);
  if (!(Math.abs(p) > ANTI_POLE_RAD)) return null;
  const u = qRotate(q, [Math.cos(p) * Math.cos(yaw), Math.sin(p), Math.cos(p) * Math.sin(yaw)]);
  const axis = normalize(qRotate(q, [-Math.sin(yaw), 0, Math.cos(yaw)]));
  if (axis === null) return null;
  let best: Quat | null = null;
  let bestP = Infinity;
  for (const s of [1, -1]) {
    const c = qmul(qFromAxisAngle(axis, s * p), q);
    const pn = Math.abs(Math.asin(Math.max(-1, Math.min(1, qRotate(qconj(c), u)[1]))));
    if (pn < bestP) {
      bestP = pn;
      best = c;
    }
  }
  return best;
}

/**
 * ⭐⭐⭐ (2026-11-02, the owner: *"on a lot of occasions when i keep traveling the gizmo on one section, the camera view end up completely tilted until it
 * restores its verticality"*) — **THE SCREEN'S UP: GRAVITY'S, BUT LOOKING STEEPLY DOWN OR UP**: the world's up laid square to the view `u` while it is
 * well defined (the view more than 30° off the vertical: gravity straight down the screen); within 30° … 10° blended to the FACE's frame up (`faceUp` — over
 * a top the way away across it), within 10° that one; with neither defined, the one before (`prev`). ⛔ The tilted frame's own up everywhere: off a top the
 * world's vertical lay slanted on the screen.
 */
export function screenUpTarget(u: Vec3, faceUp: Vec3, prev: Vec3 | null): Vec3 {
  const flat = (a: Vec3): { v: Vec3 | null; n: number } => {
    const k = dot(a, u);
    const w: Vec3 = [a[0] - k * u[0], a[1] - k * u[1], a[2] - k * u[2]];
    const n = Math.hypot(w[0], w[1], w[2]);
    return { v: n > 1e-6 ? [w[0] / n, w[1] / n, w[2] / n] : null, n };
  };
  const w = flat([0, 1, 0]);
  const f = flat(faceUp);
  const pv = prev === null ? null : flat(prev).v;
  const fv = f.n > 0.1 ? f.v : pv;
  const s0 = Math.min(1, Math.max(0, (w.n - Math.sin((10 * Math.PI) / 180)) / (Math.sin((30 * Math.PI) / 180) - Math.sin((10 * Math.PI) / 180))));
  const s = s0 * s0 * (3 - 2 * s0);
  if (w.v === null || s <= 0) return fv ?? w.v ?? pv ?? [0, 1, 0];
  if (fv === null || s >= 1) return w.v;
  const ang = Math.atan2(dot(cross(fv, w.v), u), dot(fv, w.v));
  return qRotate(qFromAxisAngle(u, ang * s), fv);
}

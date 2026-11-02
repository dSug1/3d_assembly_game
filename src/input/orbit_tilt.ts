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
import { cross, dot, normalize, qconj, qFromAxisAngle, qRotate, IDENTITY, type Quat, type Vec3 } from "../core/vec";

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
/** ⭐ The roll's share after `travelMm` more of the finger's travel, over `spanMm` (0: at once). */
export function tiltRollShare(share: number, travelMm: number, spanMm: number): number {
  if (!(spanMm > 0)) return 1;
  return Math.min(1, share + Math.max(0, travelMm) / spanMm);
}

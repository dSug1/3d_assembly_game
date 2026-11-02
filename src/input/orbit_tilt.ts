/**
 * ⭐⭐⭐ (2026-11-02) **THE ORBIT'S OWN FRAME** — the one its angles (yaw, pitch) are read in, re-tilted before a pole (`antiPoleQuat`: no gimbal lock, a
 * continued dy goes on round). ⛔ (2026-11-02, *"Build the shell"*) the tilt onto a horizontal face (`tiltWanted`, `tiltQuat`, its switch, its roll, the
 * finger's signs kept across it, the screen's up by the face) is DELETED: the piece rides the shell (`orbit_shell.ts`) and the finger moves it along the
 * screen — no frame of the geometry's steers it any more.
 */
import { normalize, qconj, qFromAxisAngle, qmul, qRotate, type Quat, type Vec3 } from "../core/vec";

/** ⭐ A direction from the orbit's frame to the world (`q` the tilt), and back. */
export function tiltDirW(q: Quat, d: Vec3): Vec3 {
  return qRotate(q, d);
}
export function tiltDirO(q: Quat, d: Vec3): Vec3 {
  return qRotate(qconj(q), d);
}
/**
 * ⭐ The orbit's angles (`yaw`, the ring parameter `v`: −90° at 0, level at ½, +90° at 1) of a direction `d` given IN ITS FRAME, the yaw kept nearest
 * `yaw0` — a re-base of the frame keeps the piece's direction in the world (nothing moves).
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

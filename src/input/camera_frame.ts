/**
 * ⭐⭐⭐ prototype (2026-10-17, the Fable audit of `1.0.80-`) — **THE CAMERA'S FRAME, WHOLE**: the camera derived from the piece on the blended turn
 * (`rigFrameBetween`), and between rings 2 and 3 the semi-isometric HOLD (`input/waist_view.ts`) — one pure function, so the composition the screen shows
 * is the one the vectors measure (⛔ it lived in `render/camera_rig.ts`, where nothing could interrogate it).
 *
 * ⭐ The DIRECTION is a pure function of the orbit (the same wherever it is read); the UP is carried from the LAST FRAME's (`prev`): moved onto the new
 * view, then rolled toward the target the short way — never spinning round — by at most what the ORBIT'S TRAVEL allows (`ROLL_PER_V` per unit of the
 * ring, `ROLL_PER_YAW` per degree of dx), or `ROLL_PER_DIR` × the view's own turn when that is more (a jump), plus `ROLL_SETTLE_DEG_S` a second
 * (`rollLimitedUp`) (A1 — ⛔ passing near the vertical midway through a gizmo change, the target's up turned 15°–116° in one 0.25 mm step). ⛔ (the second
 * Fable audit's #1) bounded by the VIEW's turn alone it starved the designed swing — over the gizmo the view barely turns while the picture must roll half a
 * round: 126°–174° behind the target on faces tilted 50°–75°, unwinding over seconds; and the settle was per FRAME (5°/s on the tablet, 30°/s at 120 Hz). ⭐ The hold is evaluated on EACH END of a gizmo change, with that end's face, and blended at the share (A2 —
 * ⛔ the old face swapped for the new one at the first finger move: 8°–18°). ⭐ Ring 2's and ring 3's directions, and the turn's way between them, are read
 * off the camera's own PATH (A3), the hold faded where a ring's direction nears the normal (`waistPoleFade`). ⭐ The up's roll toward upright faded at the rings with
 * the direction (A5).
 * ⛔ ENGINE-FREE.
 */
import type { GestureConfig } from "./gestureConfig";
import type { CameraAngleOffset, OrbitAt } from "./follow_camera";
import { rigFrameBetween, type RigCameraFrame, type RigParams } from "./orbit_rig";
import type { Vec3 } from "../core/vec";

/** ⭐ The up's roll toward its target per degree of the view's own turn (`rollLimitedUp` — a jump of the view lets the up follow at once). */
export const ROLL_PER_DIR = 2;
/** ⭐ …or per unit of the ring parameter travelled (°): 51° per 0.25 mm of dy on `Scene_1` — ⭐ (2026-10-18) THE TOP ROLL's half-round over ±20° of
 * straight above peaks at ~39° a 0.25 mm step (⛔ 2 500: it capped the designed turn — the drawn up 15° behind). */
export const ROLL_PER_V = 8000;
/** ⭐ …or per unit of the top face pause's share (°) — ⭐ (2026-10-25) the camera's half-round roll in the pause, with headroom (⛔ the pause moves no ring: the roll crawled at the settle rate). */
export const ROLL_PER_PAUSE = 1440;
/** ⭐ …or per degree of dx (°/°). */
export const ROLL_PER_YAW = 2;
/** ⭐ …plus this much a SECOND (°), so a camera left still settles upright — whatever the frame rate. */
export const ROLL_SETTLE_DEG_S = 30;
/** ⭐ The frame time assumed when none is given (ms). */
const DEFAULT_DT_MS = 1000 / 60;

/** ⭐ The last frame drawn: its direction and up, and the orbit place it was drawn at (the travel since bounds the roll). */
export interface CameraFramePrev {
  readonly dir: Vec3;
  readonly up: Vec3;
  readonly cam?: OrbitAt | null;
}

/**
 * ⭐⭐⭐ The camera's frame: on the turn blended from `from` to `to` at the gizmo's share `s`, at the camera's orbit place `cam`, with the owner's offsets
 * `off`; `prev` the last frame drawn (`null`: none — the target's up as it is), `dtMs` the time since it.
 */
export function cameraFrameHeld(cfg: GestureConfig, from: RigParams, to: RigParams, s: number, cam: OrbitAt, off?: CameraAngleOffset, prev?: CameraFramePrev | null, dtMs?: number): RigCameraFrame {
  const target = targetFrame(cfg, from, to, s, cam, off);
  return prev ? { dir: target.dir, up: rollLimitedUp(prev, target.dir, target.up, cam, dtMs) } : target;
}

/**
 * ⭐⭐ The up carried from `prev` onto the view `dir` (the least turn), then rolled toward `target` (about `dir`, the short way) by at most the larger of
 * the orbit's travel since (`cam` against `prev.cam`: `ROLL_PER_V`, `ROLL_PER_YAW`) and `ROLL_PER_DIR` × the view's own turn, plus `ROLL_SETTLE_DEG_S` ×
 * `dtMs`. Degenerate inputs: the target.
 */
export function rollLimitedUp(prev: CameraFramePrev, dir: Vec3, target: Vec3, cam?: OrbitAt | null, dtMs: number = DEFAULT_DT_MS): Vec3 {
  const d = unitOf(dir);
  if (d === null) return target;
  const carried = onPlane(prev.up, d);
  const goal = onPlane(target, d);
  if (carried === null || goal === null) return target;
  const turned = Math.acos(Math.max(-1, Math.min(1, dotOf(unitOf(prev.dir) ?? d, d))));
  const travelDeg =
    cam && prev.cam
      ? ROLL_PER_V * Math.abs(cam.v - prev.cam.v) + ROLL_PER_YAW * ((Math.abs(wrapPi(cam.yaw - prev.cam.yaw)) * 180) / Math.PI) + ROLL_PER_PAUSE * Math.abs((cam.pause ?? 0) - (prev.cam.pause ?? 0))
      : 0;
  const allowed = Math.max(ROLL_PER_DIR * turned, (travelDeg * Math.PI) / 180) + (ROLL_SETTLE_DEG_S * Math.max(0, dtMs) * Math.PI) / 180 / 1000;
  const phi = Math.atan2(dotOf(crossOf(carried, goal), d), dotOf(carried, goal));
  if (Math.abs(phi) <= allowed) return goal;
  const a = Math.sign(phi) * allowed;
  const x = crossOf(d, carried);
  return [carried[0] * Math.cos(a) + x[0] * Math.sin(a), carried[1] * Math.cos(a) + x[1] * Math.sin(a), carried[2] * Math.cos(a) + x[2] * Math.sin(a)];
}

const wrapPi = (a: number): number => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
const dotOf = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const crossOf = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unitOf = (a: Vec3): Vec3 | null => {
  const n = Math.hypot(a[0], a[1], a[2]);
  return n > 1e-12 ? [a[0] / n, a[1] / n, a[2] / n] : null;
};
const onPlane = (u: Vec3, d: Vec3): Vec3 | null => {
  const k = dotOf(u, d);
  return unitOf([u[0] - k * d[0], u[1] - k * d[1], u[2] - k * d[2]]);
};

/** ⭐ The frame the orbit asks for (stateless) — the curve's own (⛔ 2026-10-19: the semi-isometric hold between rings 2 and 3 deleted). */
function targetFrame(cfg: GestureConfig, from: RigParams, to: RigParams, s: number, cam: OrbitAt, off?: CameraAngleOffset): RigCameraFrame {
  return rigFrameBetween(cfg, from, to, s, cam, off);
}

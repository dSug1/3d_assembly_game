/**
 * ⭐⭐⭐ prototype (2026-10-17, the Fable audit of `1.0.80-`) — **THE CAMERA'S FRAME, WHOLE**: the camera derived from the piece on the blended turn
 * (`rigFrameBetween`), and between rings 2 and 3 the semi-isometric HOLD (`input/waist_view.ts`) — one pure function, so the composition the screen shows
 * is the one the vectors measure (⛔ it lived in `render/camera_rig.ts`, where nothing could interrogate it).
 *
 * ⭐ The DIRECTION is a pure function of the orbit (the same wherever it is read); the UP is carried from the LAST FRAME's (`prev`): moved onto the new
 * view, then rolled toward the upright target by at most `ROLL_PER_DIR` times the angle the camera itself moved (`rollLimitedUp`) — a roll can never run
 * ahead of the camera, and never spins round: it takes the short way to the target (A1 — ⛔ passing near the vertical midway through a gizmo change, the
 * target's up turned 15°–116° in one 0.25 mm step, and blends of it only moved the jump). ⭐ The hold is evaluated on EACH END of a gizmo change, with that end's face, and blended at the share (A2 —
 * ⛔ the old face swapped for the new one at the first finger move: 8°–18°). ⭐ Ring 2's and ring 3's directions, and the turn's way between them, are read
 * off the camera's own PATH (A3), the hold faded where a ring's direction nears the normal (`waistPoleFade`). ⭐ The up's roll toward upright faded at the rings with
 * the direction (A5).
 * ⛔ ENGINE-FREE.
 */
import type { GestureConfig } from "./gestureConfig";
import type { CameraAngleOffset, OrbitAt } from "./follow_camera";
import { rigEnds, rigFrameBetween, rigPlace, waistV, type RigCameraFrame, type RigParams } from "./orbit_rig";
import { waistConeWeight, waistHoldDirection, waistPoleFade, waistPrefer, waistRings, waistShare } from "./waist_view";
import { slerpDir, uprightBlend } from "./hover";
import type { Vec3 } from "../core/vec";

/** ⭐ The waist's path is read in this many steps. */
export const WAIST_PATH_STEPS = 8;

/** ⭐ The up's roll toward its target per degree of the camera's own turn (`rollLimitedUp`). */
export const ROLL_PER_DIR = 2;
/** ⭐ …plus this much a frame (°), so a camera left still settles upright. */
export const ROLL_SETTLE_DEG = 0.25;

/** ⭐ The last frame drawn: its direction and up. */
export interface CameraFramePrev {
  readonly dir: Vec3;
  readonly up: Vec3;
}

/**
 * ⭐⭐⭐ The camera's frame: on the turn blended from `from` to `to` at the gizmo's share `s`, at the camera's orbit place `cam`, with the owner's offsets
 * `off`; `prev` the last frame drawn (`null`: none — the target's up as it is).
 */
export function cameraFrameHeld(cfg: GestureConfig, from: RigParams, to: RigParams, s: number, cam: OrbitAt, off?: CameraAngleOffset, prev?: CameraFramePrev | null): RigCameraFrame {
  const target = targetFrame(cfg, from, to, s, cam, off);
  return prev ? { dir: target.dir, up: rollLimitedUp(prev, target.dir, target.up) } : target;
}

/**
 * ⭐⭐ The up carried from `prev` onto the view `dir` (the least turn), then rolled toward `target` (about `dir`, the short way) by at most
 * `ROLL_PER_DIR` × the camera's own turn + `ROLL_SETTLE_DEG`. Degenerate inputs: the target.
 */
export function rollLimitedUp(prev: CameraFramePrev, dir: Vec3, target: Vec3): Vec3 {
  const d = unitOf(dir);
  if (d === null) return target;
  const carried = onPlane(prev.up, d);
  const goal = onPlane(target, d);
  if (carried === null || goal === null) return target;
  const turned = Math.acos(Math.max(-1, Math.min(1, dotOf(unitOf(prev.dir) ?? d, d))));
  const allowed = ROLL_PER_DIR * turned + (ROLL_SETTLE_DEG * Math.PI) / 180;
  const phi = Math.atan2(dotOf(crossOf(carried, goal), d), dotOf(carried, goal));
  if (Math.abs(phi) <= allowed) return goal;
  const a = Math.sign(phi) * allowed;
  const x = crossOf(d, carried);
  return [carried[0] * Math.cos(a) + x[0] * Math.sin(a), carried[1] * Math.cos(a) + x[1] * Math.sin(a), carried[2] * Math.cos(a) + x[2] * Math.sin(a)];
}

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

/** ⭐ The frame the orbit asks for (stateless): the base, and between rings 2 and 3 the hold. */
function targetFrame(cfg: GestureConfig, from: RigParams, to: RigParams, s: number, cam: OrbitAt, off?: CameraAngleOffset): RigCameraFrame {
  const base = rigFrameBetween(cfg, from, to, s, cam, off);
  const share = waistShare(cfg, cam.v);
  if (share === null) return base;
  // ⭐ (A2, A6) every face the turn is blended from, weighted — a tap mid-change carries the faces it was between (`rigEnds`)
  const ends = rigEnds(from, to, s);
  const vMid = waistV(cfg);
  const weights = ends.map(([r]) => {
    if (r.faced !== true || !r.normal) return 0;
    return waistConeWeight(rigPlace(cfg, r, cam.yaw, vMid, 1), r.normal, cfg.waistIsoConeDeg);
  });
  if (!weights.some((h) => h > 0)) return base;
  // ⭐ the camera's own path from ring 2 to ring 3 (directions, unheld)
  const path = waistPath(cfg, from, to, s, cam, off);
  const d2 = path[0]!;
  const d3 = path[path.length - 1]!;
  let dir: Vec3 | null = null;
  let hold = 0;
  let sum = 0;
  ends.forEach(([r, w], i) => {
    const h = weights[i]! * (weights[i]! > 0 ? waistPoleFade(r.normal!, d2, d3) : 0);
    let d = base.dir;
    if (h > 0) {
      const held = waistHoldDirection(rigPlace(cfg, r, cam.yaw, vMid, 1), r.normal!, d2, d3, share, waistPrefer(cfg, cam.yaw, r.beta), path);
      d = h < 1 ? slerpDir(base.dir, held, h) : held;
    }
    hold += w * h;
    sum += w;
    dir = dir === null ? d : slerpDir(dir, d, sum > 0 ? w / sum : 0);
  });
  const out = dir ?? base.dir;
  // ⭐ (A5) the roll toward upright faded with the direction — nothing at either ring, where the frame is the base's exactly (⛔ 12.9° of up at ring 3)
  return { dir: out, up: uprightBlend(base.up, out, hold * 4 * share * (1 - share)) };
}

/** ⭐ The camera's directions from ring 2 to ring 3 (unheld), ring 2's first and ring 3's last, in `WAIST_PATH_STEPS` steps. */
export function waistPath(cfg: GestureConfig, from: RigParams, to: RigParams, s: number, cam: OrbitAt, off: CameraAngleOffset | undefined): Vec3[] {
  const { v2, v3 } = waistRings(cfg);
  const out: Vec3[] = [];
  for (let i = 0; i <= WAIST_PATH_STEPS; i++) out.push(rigFrameBetween(cfg, from, to, s, { yaw: cam.yaw, v: v2 + ((v3 - v2) * i) / WAIST_PATH_STEPS }, off).dir);
  return out;
}

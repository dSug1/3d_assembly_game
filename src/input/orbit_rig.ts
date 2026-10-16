/**
 * ⭐⭐⭐ prototype — **THE RIG TURNED ONTO THE GIZMO'S FACE** (2026-10-16, the owner: *"The overall 2D curve (i.e. the smoothing 2D curve between the
 * ring orbits for the advance of the part on dy) is rotated so that between the 2nd and 3rd ring, the camera view is anti-aligned with the normal of the
 * face supporting the gizmo. Therefore, the script has to recalculate the 2D curve as well as the transforms of all the rings when the gizmo is moved."*
 * → *"build, fix the rotation at the camera's yaw when the gizmo moves, keep the camera offsets as they are right now … top faces: build what you
 * recommend (I want the principle of a plane movement halfway between rings 2 and 3 to be conserved)"*).
 *
 * ⭐⭐⭐ (2026-10-16, after two looks — *"the axis of each ring is the gravity axis (in such way, the camera is never upside down). dx orbits the piece on
 * the ring it is sitting on."* → *"build only your previous proposal"*) **THE TURNED CURVE ON LEVEL RINGS**:
 * * dy — the piece's place follows the 2D curve TURNED (`q`, the SHORTEST turn taking its direction halfway between rings 2 and 3 — `waistV` — at the
 *   camera's yaw when the gizmo moved, `yaw0`, onto the face's normal): `C(v) = q · orbitOffset(yaw0, v)`;
 * * the ring it sits on — a LEVEL circle (its axis the gravity's) of the ring's own radius `r(v)`, through `C(v)`, its centre BEYOND the piece as seen
 *   from the camera (`beta`: the outward heading — from the centre to the piece — is `yaw0 + beta`);
 * * dx — the piece around that ring: `P = centre + r(v) · u(yaw + beta)`.
 * ⭐ Unturned (`q` none, `beta` 0) it is `orbitOffset(yaw, v)` EXACTLY — the rig as it always was; a side face's turn is about the vertical, so its rings
 * are today's turned by a yaw. On a TOP face, halfway between rings 2 and 3 the piece sits 9 cm (× zoom) above the face on a 9 cm level circle: dx
 * slides it across the face (the plane movement), dy along the turned curve. The camera is UPRIGHT (`rigCameraAngles`): its heading turned by dx alone,
 * its tilt the curve's, folded — never past straight down, never upside down. ⛔ The rig's own axis (a wheel over a top face), dx as a yaw about the
 * gizmo's vertical (rings 1 and 4 merged) and the camera in the rig's frame (upside down past the crossing, then a roll the owner refused) are deleted.
 * ⛔ ENGINE-FREE. Shortest-arc is textbook (Shoemake 1985): no licence, no patent.
 */
import type { GestureConfig } from "./gestureConfig";
import { fourRingLayout, orbitOffset } from "./orbit";
import { mirroredPitchOffset, type CameraAngleOffset, type OrbitAt } from "./follow_camera";
import { IDENTITY, cross, dot, normalize, qFromAxisAngle, qRotate, type Quat, type Vec3 } from "../core/vec";

/** ⭐ The rig's turn: the rotation `q` fixed at the orbit's yaw `yaw0` (the gizmo's move), the rings' outward heading offset `beta`. */
export interface RigParams {
  readonly q: Quat;
  readonly yaw0: number;
  readonly beta: number;
}

/** ⭐ No turn: the rig as it always was (the boot, a respawn, no face). */
export const UNTURNED: RigParams = { q: IDENTITY, yaw0: 0, beta: 0 };

/**
 * ⭐ The ring parameter HALFWAY between rings 2 and 3 (numbered from the top): with four rings the middle of the waist's span (`fourRingLayout`'s
 * knots 1 and 2), with three the middle of the middle and bottom rings (0.25).
 */
export function waistV(cfg: GestureConfig): number {
  if (cfg.orbitLowerRingOn !== 1) return 0.25;
  const f = fourRingLayout(cfg);
  return (f.knots[1]! + f.knots[2]!) / 2 / f.total;
}

/**
 * ⭐ The shortest turn from `a` to `b` (unit or not); OPPOSITE vectors turn half a round about the vertical when `a` is not vertical (⛔ the generic
 * antiparallel axis would flip a side-facing rig over the top), else about x.
 */
export function rigArc(a: Vec3, b: Vec3): Quat {
  const u = normalize(a);
  const w = normalize(b);
  if (u === null || w === null) return IDENTITY;
  const d = Math.max(-1, Math.min(1, dot(u, w)));
  if (d > 1 - 1e-9) return IDENTITY;
  if (d < -1 + 1e-9) {
    const up: Vec3 = [0, 1, 0];
    const axis = normalize([up[0] - u[0] * u[1], up[1] - u[1] * u[1], up[2] - u[2] * u[1]]) ?? ([1, 0, 0] as Vec3);
    return qFromAxisAngle(axis, Math.PI);
  }
  return qFromAxisAngle(cross(u, w), Math.acos(d));
}

/** ⭐ The rig's rotation for a gizmo on a face of normal `normal`, fixed at the camera's yaw `yawRad` (the rig's own yaw parameter). */
export function rigRotationFor(cfg: GestureConfig, yawRad: number, normal: Vec3 | null): Quat {
  if (normal === null || normalize(normal) === null) return IDENTITY;
  return rigArc(orbitOffset(cfg, yawRad, waistV(cfg), 1).offsetM, normal);
}

/** ⭐ The level unit direction at the azimuth `a` (the orbit's own convention: x = cos, z = sin). */
const level = (a: number): Vec3 => [Math.cos(a), 0, Math.sin(a)];

/**
 * ⭐⭐ The rings' OUTWARD heading for a turn `q` fixed at `yaw0` — from a ring's centre to the piece: the turned radial direction, levelled; when the
 * turn stands it nearly straight up or down (a top / bottom face), the camera's side (`cameraSide`, the level direction from the gizmo to the camera),
 * so the centre lies beyond the piece as the camera sees it. Returned as `beta` (the heading is `yaw0 + beta`); unturned exactly 0.
 */
export function rigBetaFor(q: Quat, yaw0: number, cameraSide: Vec3): number {
  const t = qRotate(q, level(yaw0));
  if (Math.hypot(t[0], t[2]) > 0.35) return Math.atan2(t[2], t[0]) - yaw0;
  if (Math.hypot(cameraSide[0], cameraSide[2]) > 1e-9) return Math.atan2(cameraSide[2], cameraSide[0]) - yaw0;
  return 0;
}

/**
 * ⭐⭐⭐ THE PIECE'S PLACE (from the gizmo) at the orbit's yaw `yaw` and ring parameter `v`: on the level ring of radius `r(v)` through the turned
 * curve's point `C(v)` — `centre + r · u(yaw + beta)`, the centre `C − r · u(yaw0 + beta)`.
 */
export function rigPlace(cfg: GestureConfig, p: RigParams, yaw: number, v: number, zoom: number): Vec3 {
  const o = orbitOffset(cfg, p.yaw0, v, zoom).offsetM;
  const c = qRotate(p.q, o);
  const r = Math.hypot(o[0], o[2]);
  const a0 = level(p.yaw0 + p.beta);
  const a = level(yaw + p.beta);
  return [c[0] + r * (a[0] - a0[0]), c[1], c[2] + r * (a[2] - a0[2])];
}

/** ⭐ The camera's angles round the gizmo (azimuth, elevation) — `piece_orbit.ts`'s `AroundAngles`. */
export interface RigAngles {
  readonly az: number;
  readonly el: number;
}

/**
 * ⭐⭐⭐ THE CAMERA, UPRIGHT — its angles round the gizmo at the camera's orbit place `cam`: its HEADING `cam.yaw + beta` (turned by dx alone, ⛔ never
 * read off a position, so it cannot spin over the gizmo), its TILT the turned curve's at `cam.v` FOLDED (the elevation of `q · orbitOffset(yaw0, v)`
 * — on a top face it rises to straight down halfway and comes back on the same side); the owner's offsets as before — the yaw offset on the heading,
 * the pitch offset away from the level (`mirroredPitchOffset`) — clamped at ±89°. ⭐ Unturned it is `cameraOffset`'s angles exactly.
 */
export function rigCameraAngles(cfg: GestureConfig, p: RigParams, cam: OrbitAt, off: CameraAngleOffset = { yawRad: 0, pitchRad: 0 }): RigAngles {
  const lim = (89 * Math.PI) / 180;
  const c = qRotate(p.q, orbitOffset(cfg, p.yaw0, cam.v, 1).offsetM);
  const n = Math.hypot(c[0], c[1], c[2]);
  const e = n > 1e-12 ? Math.asin(Math.max(-1, Math.min(1, c[1] / n))) : 0;
  return { az: cam.yaw + p.beta + off.yawRad, el: Math.max(-lim, Math.min(lim, e + mirroredPitchOffset(e, off.pitchRad))) };
}

/** ⭐ The camera's offset from the gizmo at angles `a`, at the piece's distance (`boxOffset`) plus `radiusOffsetM` — `cameraOffset`'s rule. */
export function cameraOffsetAt(a: RigAngles, boxOffset: Vec3, radiusOffsetM: number): Vec3 {
  const d = Math.hypot(boxOffset[0], boxOffset[1], boxOffset[2]) + Math.max(0, radiusOffsetM);
  return [d * Math.cos(a.el) * Math.cos(a.az), d * Math.sin(a.el), d * Math.cos(a.el) * Math.sin(a.az)];
}

/** ⭐ The yaw whose ring place points the piece at `rel` (from the gizmo) at `v` — the rebase at the end of the orbit around the piece. */
export function rigYawToward(cfg: GestureConfig, p: RigParams, v: number, zoom: number, rel: Vec3): number {
  const o = orbitOffset(cfg, p.yaw0, v, zoom).offsetM;
  const c = qRotate(p.q, o);
  const r = Math.hypot(o[0], o[2]);
  const a0 = level(p.yaw0 + p.beta);
  const cx = c[0] - r * a0[0];
  const cz = c[2] - r * a0[2];
  if (Math.hypot(rel[0] - cx, rel[2] - cz) < 1e-9) return p.yaw0;
  return Math.atan2(rel[2] - cz, rel[0] - cx) - p.beta;
}

/** ⭐ Two places blended at the gizmo's share `s` (the old turn's and the new) — the rings swing over as the gizmo slides, never a jump. */
export function blendPlace(a: Vec3, b: Vec3, s: number): Vec3 {
  if (s >= 1) return b;
  return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s];
}

/** ⭐ Two camera angle pairs blended at `s`: the azimuth the short way round. */
export function blendAngles(a: RigAngles, b: RigAngles, s: number): RigAngles {
  if (s >= 1) return b;
  let d = b.az - a.az;
  d -= 2 * Math.PI * Math.round(d / (2 * Math.PI));
  return { az: a.az + d * s, el: a.el + (b.el - a.el) * s };
}

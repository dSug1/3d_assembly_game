/**
 * ⭐⭐⭐ prototype — **THE RIG TURNED ONTO THE GIZMO'S FACE** (2026-10-16, the owner: *"The overall 2D curve (i.e. the smoothing 2D curve between the
 * ring orbits for the advance of the part on dy) is rotated so that between the 2nd and 3rd ring, the camera view is anti-aligned with the normal of the
 * face supporting the gizmo. Therefore, the script has to recalculate the 2D curve as well as the transforms of all the rings when the gizmo is moved."*
 * → *"build, fix the rotation at the camera's yaw when the gizmo moves, keep the camera offsets as they are right now … top faces: build what you
 * recommend (I want the principle of a plane movement halfway between rings 2 and 3 to be conserved)"*).
 *
 * ⭐⭐⭐ (2026-10-16, after three looks — *"the axis of each ring is the gravity axis (in such way, the camera is never upside down). dx orbits the piece
 * on the ring it is sitting on."* → *"the ring 3 shall be in the opposite side of the gizmo from the ring 2 in the direction of the 2D curve, the 2D curve
 * shall aim at the gizmo at all time during the orbit"*) **THE TURNED CURVE, SWUNG ROUND THE GIZMO'S VERTICAL; THE CAMERA UPRIGHT**:
 * * dy — the piece's place follows the 2D curve TURNED (`q`, the SHORTEST turn taking its direction halfway between rings 2 and 3 — `waistV` — at the
 *   camera's yaw when the gizmo moved, `yaw0`, onto the face's normal): `C(v) = q · orbitOffset(yaw0, v)`;
 * * dx — the WHOLE turned curve swung round the vertical THROUGH THE GIZMO: `P = yawTurn(yaw − yaw0) · C(v)`. Every ring is a LEVEL circle about the
 *   gizmo's vertical (its axis the gravity's), the curve passes through the gizmo at every yaw, and ring 3 lies opposite ring 2 across the gizmo along
 *   the curve;
 * * the camera UPRIGHT (`rigCameraAngles`): its up the world's, its heading turned by dx alone, its tilt the curve's FOLDED — on the near side of the
 *   gizmo exactly behind the piece (its direction from the gizmo is the piece's), and past a top face's crossing folded back on its own side, never over
 *   the top: never upside down, nothing rolls.
 * ⭐ Unturned (`q` none, `beta` 0) it is `orbitOffset(yaw, v)` and `cameraOffset` EXACTLY — the rig as it always was; a side face's turn is about the
 * vertical, so its rings are today's turned by a yaw.
 * ⛔ Deleted on the way: the wheel about the turned rig's own axis; the camera in the rig's frame (its up turned — upside down past a top face's
 * crossing; a roll back to upright, refused); level rings with their OWN centres beyond the piece (the curve no longer aimed at the gizmo, the camera
 * was cut from the piece, and the solver's steps bounced the piece back and forth — each v step moved its ring's centre).
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

/** ⭐ The world turn that adds `deltaRad` to an orbit yaw: `orbitOffset(yaw + δ) = yawTurn(δ) · orbitOffset(yaw)` (about the world vertical). */
export function yawTurn(deltaRad: number): Quat {
  return qFromAxisAngle([0, 1, 0], -deltaRad);
}

/**
 * ⭐⭐ The camera's NEAR side for a turn `q` fixed at `yaw0` — the level heading from the gizmo toward the camera: the turned radial direction,
 * levelled; when the turn stands it nearly straight up or down (a top / bottom face), the camera's side (`cameraSide`, the level direction from the
 * gizmo to the camera). Returned as `beta` (the heading is `yaw0 + beta`); unturned exactly 0.
 */
export function rigBetaFor(q: Quat, yaw0: number, cameraSide: Vec3): number {
  const t = qRotate(q, level(yaw0));
  if (Math.hypot(t[0], t[2]) > 0.35) return Math.atan2(t[2], t[0]) - yaw0;
  if (Math.hypot(cameraSide[0], cameraSide[2]) > 1e-9) return Math.atan2(cameraSide[2], cameraSide[0]) - yaw0;
  return 0;
}

/**
 * ⭐⭐⭐ THE PIECE'S PLACE (from the gizmo) at the orbit's yaw `yaw` and ring parameter `v`: the turned curve's point `C(v)` swung round the gizmo's
 * vertical by dx — `yawTurn(yaw − yaw0) · q · orbitOffset(yaw0, v)`. Smooth in both (a rotation of the curve), so the solver's steps never jump.
 */
export function rigPlace(cfg: GestureConfig, p: RigParams, yaw: number, v: number, zoom: number): Vec3 {
  return qRotate(yawTurn(yaw - p.yaw0), qRotate(p.q, orbitOffset(cfg, p.yaw0, v, zoom).offsetM));
}

/**
 * ⭐⭐⭐ (2026-10-16, the owner: *"the camera does not follow the piece on the second half of the 2d curve"* → *"build C …"* → *"I don't like this
 * implementation: it looks like the piece does a Z-shape travel. build option B instead."*) — **THE SWING ROUND, BETWEEN RINGS 2 AND 3**: where the
 * turned curve passes OVER the gizmo (its level direction crosses to the far side — a top face; a side face never does), the camera's heading turns half
 * a round, smoothly (smoothstep), always the same way, over the stretch of rings 2 → 3 centred on the crossing — so past it the camera is behind the
 * piece again, upright. ⛔ C (a wider swing, its speed matched to the vertical crossing's) read as a Z-shape travel. `null`: no crossing, no swing.
 */
export interface RigSwing {
  /** The ring parameter where the curve crosses over the gizmo. */
  readonly vc: number;
  /** The swing's width in the ring parameter. */
  readonly w: number;
  /** The far side lies at v ABOVE the crossing (else below). */
  readonly farAbove: boolean;
}

const swingCache = new WeakMap<RigParams, { key: string; swing: RigSwing | null }>();

const ringKey = (cfg: GestureConfig): string =>
  [cfg.orbitLowerRingOn, cfg.orbitTopRadiusM, cfg.orbitTopHeightM, cfg.orbitMiddleRadiusM, cfg.orbitMiddleHeightM, cfg.orbitLowerRadiusM, cfg.orbitLowerHeightM, cfg.orbitBottomRadiusM, cfg.orbitBottomHeightM].join(",");

const smooth = (t: number): number => {
  const u = Math.min(1, Math.max(0, t));
  return u * u * (3 - 2 * u);
};

/** ⭐ The ring parameters of rings 2 and 3 (numbered from the top). */
function ring23(cfg: GestureConfig): [number, number] {
  if (cfg.orbitLowerRingOn !== 1) return [0.5, 0];
  const f = fourRingLayout(cfg);
  return [f.knots[2]! / f.total, f.knots[1]! / f.total];
}

/** ⭐ The rig's swing (`null` when its curve never passes over the gizmo) — cached per turn and ring set. */
export function rigSwing(cfg: GestureConfig, p: RigParams): RigSwing | null {
  const key = ringKey(cfg);
  const hit = swingCache.get(p);
  if (hit !== undefined && hit.key === key) return hit.swing;
  const swing = solveSwing(cfg, p);
  swingCache.set(p, { key, swing });
  return swing;
}

function solveSwing(cfg: GestureConfig, p: RigParams): RigSwing | null {
  const near = level(p.yaw0 + p.beta);
  const point = (v: number): Vec3 => qRotate(p.q, orbitOffset(cfg, p.yaw0, v, 1).offsetM);
  const side = (v: number): number => {
    const c = point(v);
    return c[0] * near[0] + c[2] * near[2];
  };
  const N = 400;
  let vc = -1;
  for (let i = 0; i < N && vc < 0; i++) {
    const a = i / N;
    const b = (i + 1) / N;
    if (side(a) > 0 !== side(b) > 0) {
      let lo = a;
      let hi = b;
      for (let k = 0; k < 40; k++) {
        const m = (lo + hi) / 2;
        if (side(m) > 0 === side(lo) > 0) lo = m;
        else hi = m;
      }
      vc = (lo + hi) / 2;
    }
  }
  if (vc < 0) return null;
  const farAbove = side(Math.min(1, vc + 1e-3)) <= 0;
  // ⭐⭐ (2026-10-16, the owner: *"it looks like the piece does a Z-shape travel. build option B instead."*) — the swing spans rings 2 → 3 exactly,
  // centred on the crossing (⛔ C: a width solved to the vertical crossing's speed, 11.3 mm in `Scene_1`, reaching past the rings — a Z-shape travel)
  const [v2, v3] = ring23(cfg);
  return { vc, w: Math.max(1e-6, Math.abs(v2 - v3)), farAbove };
}

/** ⭐ How far the camera's heading has swung round at `v` (0 on the near side, 1 behind the piece on the far side). */
export function rigSwingShare(cfg: GestureConfig, p: RigParams, v: number): number {
  const s = rigSwing(cfg, p);
  if (s === null) return 0;
  const t = smooth((v - (s.vc - s.w / 2)) / s.w);
  return s.farAbove ? t : 1 - t;
}

/** ⭐ The camera's angles round the gizmo (azimuth, elevation) — `piece_orbit.ts`'s `AroundAngles`. */
export interface RigAngles {
  readonly az: number;
  readonly el: number;
}

/**
 * ⭐⭐⭐ THE CAMERA, UPRIGHT — its angles round the gizmo at the camera's orbit place `cam`: its HEADING `cam.yaw + beta` (the near side, turned by dx
 * alone, ⛔ never read off a position, so it cannot spin over the gizmo), its TILT the turned curve's at `cam.v` FOLDED (the elevation of the piece's
 * own direction) — on the near side the camera's direction IS the piece's (behind it); past a top face's crossing it comes back down on the same side
 * (the piece beyond the gizmo); the owner's offsets as before — the yaw offset on the heading, the pitch offset away from the level
 * (`mirroredPitchOffset`) — clamped at ±89°. ⭐ Unturned it is `cameraOffset`'s angles exactly.
 */
export function rigCameraAngles(cfg: GestureConfig, p: RigParams, cam: OrbitAt, off: CameraAngleOffset = { yawRad: 0, pitchRad: 0 }): RigAngles {
  const lim = (89 * Math.PI) / 180;
  const c = qRotate(p.q, orbitOffset(cfg, p.yaw0, cam.v, 1).offsetM);
  const n = Math.hypot(c[0], c[1], c[2]);
  const e = n > 1e-12 ? Math.asin(Math.max(-1, Math.min(1, c[1] / n))) : 0;
  // ⭐⭐ (2026-10-16, *"build C"*) + the swing round over the crossing: half a round, always the same way
  const swing = Math.PI * rigSwingShare(cfg, p, cam.v);
  return { az: cam.yaw + p.beta + swing + off.yawRad, el: Math.max(-lim, Math.min(lim, e + mirroredPitchOffset(e, off.pitchRad))) };
}

/** ⭐ The camera's offset from the gizmo at angles `a`, at the piece's distance (`boxOffset`) plus `radiusOffsetM` — `cameraOffset`'s rule. */
export function cameraOffsetAt(a: RigAngles, boxOffset: Vec3, radiusOffsetM: number): Vec3 {
  const d = Math.hypot(boxOffset[0], boxOffset[1], boxOffset[2]) + Math.max(0, radiusOffsetM);
  return [d * Math.cos(a.el) * Math.cos(a.az), d * Math.sin(a.el), d * Math.cos(a.el) * Math.sin(a.az)];
}

/** ⭐ The yaw whose ring place points the piece at `rel` (from the gizmo) at `v` — the rebase at the end of the orbit around the piece. */
export function rigYawToward(cfg: GestureConfig, p: RigParams, v: number, zoom: number, rel: Vec3): number {
  const c = qRotate(p.q, orbitOffset(cfg, p.yaw0, v, zoom).offsetM);
  if (Math.hypot(c[0], c[2]) < 1e-9 || Math.hypot(rel[0], rel[2]) < 1e-9) return p.yaw0;
  // ⭐ yawTurn(δ) turns an azimuth a to a − (−δ)… i.e. adds δ to the orbit's yaw: the piece's azimuth less the curve point's at yaw0
  return p.yaw0 + Math.atan2(rel[2], rel[0]) - Math.atan2(c[2], c[0]);
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

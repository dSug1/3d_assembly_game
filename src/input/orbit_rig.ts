/**
 * ⭐⭐⭐ prototype — **THE RIG TURNED ONTO THE GIZMO'S FACE** (2026-10-16, the owner: *"The overall 2D curve (i.e. the smoothing 2D curve between the
 * ring orbits for the advance of the part on dy) is rotated so that between the 2nd and 3rd ring, the camera view is anti-aligned with the normal of the
 * face supporting the gizmo. Therefore, the script has to recalculate the 2D curve as well as the transforms of all the rings when the gizmo is moved."*
 * → *"build, fix the rotation at the camera's yaw when the gizmo moves, keep the camera offsets as they are right now … top faces: build what you
 * recommend (I want the principle of a plane movement halfway between rings 2 and 3 to be conserved)"*).
 *
 * ⭐ ONE ROTATION of the whole rig — every ring and the curve between them, turned together about the gizmo: each ring keeps its number, its radius
 * and its height above the gizmo IN THE RIG'S OWN FRAME; only where it stands in the world changes. It is the SHORTEST turn that takes the rig's
 * direction halfway between rings 2 and 3 (`waistV`), at the camera's yaw when the gizmo moved, onto the supporting face's normal — so a dy advance
 * at that yaw brings the piece in along the normal, the camera behind it looking at the face. A side face: a turn about the vertical (the rings stay
 * level); a top face: the rig tilted 90° (the rings stand up; dx turns the camera over and under). A rotation keeps every distance, so the clamps,
 * the zoom, the gap and the solver's budget are untouched.
 * ⛔ ENGINE-FREE. Shortest-arc and slerp are textbook (Shoemake 1985): no licence, no patent.
 */
import type { GestureConfig } from "./gestureConfig";
import { fourRingLayout, orbitOffset } from "./orbit";
import { mirroredPitchOffset, pitchOf, type CameraAngleOffset, type OrbitAt } from "./follow_camera";
import { IDENTITY, cross, dot, normalize, qFromAxisAngle, qRotate, qSlerp, type Quat, type Vec3 } from "../core/vec";

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

/** ⭐ A ring offset (the rig's own frame) carried into the world by the rig's rotation. */
export function rigOffset(rig: Quat, offsetM: Vec3): Vec3 {
  return qRotate(rig, offsetM);
}

/**
 * ⭐ The rig's rotation while the gizmo slides to its new place: from the rotation it had to the new one, at the gizmo's own blend share (the
 * orbit finger's travel), so the camera and the piece swing over with it — never a jump.
 */
export function rigAt(from: Quat, to: Quat, share: number): Quat {
  return share >= 1 ? to : qSlerp(from, to, share);
}

/**
 * ⭐⭐ (2026-10-16, the owner: *"keep the camera offsets as they are right now (that means disconnecting the offset from the 2D curve if they were
 * linked so that the offsets are the same in any 2D curve orientation)"*) — the camera's offset from the orbit centre (`cameraOffset`) on a TURNED
 * rig: the RING's direction is turned by the rig, then the owner's offsets are added in the WORLD — the yaw offset about the vertical, the pitch
 * offset to the elevation (mirrored by the ring's own pitch, as before: above the waist up, below it down), clamped at ±89°. ⭐ With no turn it is
 * `cameraOffset` exactly. ⛔ Turned with the rig, the offsets would have swung with it (a yaw offset about a tilted axis).
 */
export function rigCameraOffset(
  cfg: GestureConfig,
  rig: Quat,
  cam: OrbitAt,
  boxOffset: Vec3,
  off: CameraAngleOffset = { yawRad: 0, pitchRad: 0 },
  radiusOffsetM: number,
): Vec3 {
  const lim = (89 * Math.PI) / 180;
  const ringPitch = pitchOf(cfg, cam.v);
  const ring: Vec3 = [Math.cos(ringPitch) * Math.cos(cam.yaw), Math.sin(ringPitch), Math.cos(ringPitch) * Math.sin(cam.yaw)];
  const w = qRotate(rig, ring);
  const el0 = Math.asin(Math.max(-1, Math.min(1, w[1])));
  // ⭐ straight up or down the azimuth is the ring's own (turned) — never an undefined atan2
  const az0 = Math.hypot(w[0], w[2]) > 1e-9 ? Math.atan2(w[2], w[0]) : cam.yaw;
  const pitch = Math.max(-lim, Math.min(lim, el0 + mirroredPitchOffset(ringPitch, off.pitchRad)));
  const yaw = az0 + off.yawRad;
  const d = Math.hypot(boxOffset[0], boxOffset[1], boxOffset[2]) + Math.max(0, radiusOffsetM);
  return [d * Math.cos(pitch) * Math.cos(yaw), d * Math.sin(pitch), d * Math.cos(pitch) * Math.sin(yaw)];
}

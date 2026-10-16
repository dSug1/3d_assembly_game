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
 * ⭐⭐ (2026-10-16, after the owner's look) THE CAMERA RUNS IN THE RIG'S FRAME (`camera_rig.ts`'s `toRigSpace`): the camera code sees the rig as
 * designed, its answer is turned into the world and the camera's UP with it — so the waist's crossing on a top face is the vertical face's swing,
 * turned (⛔ with the world's up, a camera crossing straight over the gizmo flipped the picture: the *"very fast orbit"*), and the owner's camera
 * offsets are the same on the screen in any orientation of the curve.
 * ⛔ ENGINE-FREE. Shortest-arc and slerp are textbook (Shoemake 1985): no licence, no patent.
 */
import type { GestureConfig } from "./gestureConfig";
import { fourRingLayout, orbitOffset } from "./orbit";
import { IDENTITY, cross, dot, normalize, qFromAxisAngle, qmul, qRotate, qSlerp, type Quat, type Vec3 } from "../core/vec";

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
 * ⭐⭐ (2026-10-16, the owner: *"if I continue the dy input from attachment 1, at one point the scene passes upside down"* → *"build A"*) — how much of
 * the RIG'S UP the camera keeps at the ring parameter `v`: all of it between rings 2 and 3 (the crossing, the vertical face's swing turned), easing
 * (smoothstep) to NONE at rings 1 and 4 — over the WHOLE outer stretches, so the roll back to upright is as gentle as it can be. With three rings the
 * waist runs from the bottom ring, so only the top stretch rolls.
 */
export function rigUpWeight(cfg: GestureConfig, v: number): number {
  let lo: number;
  let hi: number;
  if (cfg.orbitLowerRingOn === 1) {
    const f = fourRingLayout(cfg);
    lo = f.knots[1]! / f.total;
    hi = f.knots[2]! / f.total;
  } else {
    lo = 0;
    hi = 0.5;
  }
  const s = (t: number): number => {
    const u = Math.min(1, Math.max(0, t));
    return u * u * (3 - 2 * u);
  };
  if (v > hi) return 1 - s(hi < 1 ? (v - hi) / (1 - hi) : 1);
  if (v < lo) return 1 - s(lo > 0 ? (lo - v) / lo : 1);
  return 1;
}

/**
 * ⭐⭐ (2026-10-16, *"build A"*) — the camera's UP: the rig's up (`rigUp`) rolled about the view (`view`) toward UPRIGHT (the world's vertical up on the
 * screen) by `1 − w` of the roll between them. ⭐ The roll's sense is fixed: its angle is read in (−90°, 270°], so the two ups OPPOSITE (a top face,
 * past the crossing) always roll the same way — ⛔ an angle read in (−180°, 180°] flips sign on a rounding there, and the picture would spin. With
 * the world's up along the view (straight down) there is nothing to roll toward: the rig's up.
 */
export function blendedUp(view: Vec3, rigUp: Vec3, w: number): Vec3 {
  const d = normalize(view);
  if (d === null) return rigUp;
  const proj = (u: Vec3): Vec3 | null => {
    const k = dot(u, d);
    return normalize([u[0] - k * d[0], u[1] - k * d[1], u[2] - k * d[2]]);
  };
  const r = proj(rigUp);
  if (r === null) return [0, 1, 0];
  const up = proj([0, 1, 0]);
  if (up === null || w >= 1) return r;
  let phi = Math.atan2(dot(cross(r, up), d), dot(r, up));
  if (phi <= -Math.PI / 2) phi += 2 * Math.PI;
  return qRotate(qFromAxisAngle(d, (1 - Math.max(0, w)) * phi), r);
}

/** ⭐ The world turn that adds `deltaRad` to an orbit yaw: `orbitOffset(yaw + δ) = yawTurn(δ) · orbitOffset(yaw)` (about the world vertical). */
export function yawTurn(deltaRad: number): Quat {
  return qFromAxisAngle([0, 1, 0], -deltaRad);
}

/**
 * ⭐⭐⭐ (2026-10-16, the owner: *"at position in attachment 2 the dy downwards triggers a very fast orbit of the camera … dx input controls a mix of yaw and pitch orbit of the piece and camera. This is not clear what the dx input does"* → *"I want the same as when the camera orbit between rings 2 and 3 when the face is vertical"*, *"Always yaw about vertical"*) — **dx YAWS ABOUT THE WORLD VERTICAL**: the rig's turn at the orbit's yaw `yaw`, for a turn `rig`
 * fixed at the yaw `yaw0` (the gizmo's move): `yawTurn(δ) · rig · yawTurn(−δ)`, δ = yaw − yaw0 — so a ring point lands at `yawTurn(δ) · rig ·
 * orbitOffset(yaw0, v)`: the TURNED CURVE swung round the vertical through the gizmo. ⭐ Unturned it is no turn at all (today's rig exactly); a side
 * face's turn is itself about the vertical, so nothing changes there; on a TOP face the waist stays straight above the face at every dx (dx spins
 * the view about the face's normal there). ⛔ It was the turned rig's own axis — on a top face a horizontal axis: dx wheeled the camera over the top.
 */
export function rigAtYaw(rig: Quat, yaw0: number, yaw: number): Quat {
  const d = yaw - yaw0;
  if (d === 0) return rig;
  return qmul(qmul(yawTurn(d), rig), yawTurn(-d));
}

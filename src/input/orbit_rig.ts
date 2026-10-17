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
import { waistRings } from "./waist_view";
import { mirroredPitchOffset, type CameraAngleOffset, type OrbitAt } from "./follow_camera";
import { IDENTITY, cross, dot, normalize, qFromAxisAngle, qmul, qRotate, qSlerp, type Quat, type Vec3 } from "../core/vec";

/** ⭐ The rig's turn: the rotation `q` fixed at the orbit's yaw `yaw0` (the gizmo's move), the rings' outward heading offset `beta`. */
export interface RigParams {
  readonly q: Quat;
  readonly yaw0: number;
  readonly beta: number;
  /** ⭐ (2026-10-17) turned onto a FACE (the gizmo set on one) — the slide view between rings 2 and 3 holds only then (`input/waist_view.ts`) */
  readonly faced?: boolean;
  /** ⭐ (2026-10-17) the face's normal as TAPPED (world) — the slide view's corner is kept in front of it (`frontSide`, `keepInFront`) */
  readonly normal?: Vec3 | null;
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
/** ⭐ (2026-10-16) the camera's up reads the swing's heading from this elevation of the piece (blended in fully at `SWING_FULL_RAD`). */
const SWING_FROM_RAD = (30 * Math.PI) / 180; // ⭐ (2026-10-17) between rings 2 and 3 (`waistGate`), or near the vertical anywhere (`STEEP_…`)
const SWING_FULL_RAD = (60 * Math.PI) / 180;
/** ⭐ (2026-10-17) outside rings 2 and 3 the swing's heading still takes over NEAR THE VERTICAL — from this elevation, fully at `STEEP_FULL_RAD`. */
const STEEP_FROM_RAD = (70 * Math.PI) / 180;
const STEEP_FULL_RAD = (85 * Math.PI) / 180;
const wrapPi = (a: number): number => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));

/** ⭐ The world turn that adds `deltaRad` to an orbit yaw: `orbitOffset(yaw + δ) = yawTurn(δ) · orbitOffset(yaw)` (about the world vertical). */
export function yawTurn(deltaRad: number): Quat {
  return qFromAxisAngle([0, 1, 0], -deltaRad);
}

/**
 * ⭐⭐ The camera's NEAR side for a turn `q` fixed at `yaw0` — the level heading from the gizmo toward the camera: the turned radial direction,
 * levelled; when the turn stands it nearly straight up or down (a top / bottom face), the camera's side (`cameraSide`, the level direction from the
 * gizmo to the camera). Returned as `beta` (the heading is `yaw0 + beta`); unturned exactly 0.
 */
export function rigBetaFor(q: Quat, yaw0: number, cameraSide: Vec3, preferBeta?: number): number {
  // ⭐⭐ (2026-10-16) the turned curve's OWN plane: its level line (the plane through the gizmo spanned by the turned radial and the turned vertical) —
  // ⛔ read off the camera's side, it carried the camera's yaw offset (7°) and tilted the up by 6.4° on a top face
  const nP = qRotate(q, cross(level(yaw0), [0, 1, 0]));
  const h = normalize([nP[2], 0, -nP[0]]);
  const t = qRotate(q, level(yaw0));
  const tl = Math.hypot(t[0], t[2]);
  // ⭐⭐ (2026-10-16) a preferred heading (the turn it comes from): the line's way NEARER it — the two ways only choose which way a swing turns, and
  // the nearer keeps a gizmo change from turning the near side half a round (⛔ midway the whole curve flipped near ↔ far: the up in one frame)
  if (h !== null && preferBeta !== undefined) {
    const b1 = Math.atan2(h[2], h[0]) - yaw0;
    const d1 = Math.abs(wrapPi(b1 - preferBeta));
    return d1 <= Math.PI / 2 ? b1 : b1 + Math.PI;
  }
  if (h !== null) {
    const towards: Vec3 = tl > 0.35 ? [t[0], 0, t[2]] : cameraSide;
    const sgn = h[0] * towards[0] + h[2] * towards[2] >= 0 ? 1 : -1;
    return Math.atan2(sgn * h[2], sgn * h[0]) - yaw0;
  }
  if (tl > 0.35) return Math.atan2(t[2], t[0]) - yaw0;
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
  /** ⭐ (2026-10-16) every stretch of the curve on the FAR side of the gizmo (ring parameter; the ends extended past 0 and 1). */
  readonly far: readonly (readonly [number, number])[];
}

const swingCache = new Map<string, RigSwing | null>();

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
  // ⭐ keyed by the turn's VALUES and the rings: a blended turn is a new object every frame
  const key = `${ringKey(cfg)}|${p.q.map((x) => x.toFixed(6)).join(",")}|${p.yaw0.toFixed(6)}|${p.beta.toFixed(6)}`;
  const hit = swingCache.get(key);
  if (hit !== undefined) return hit;
  const swing = solveSwing(cfg, p);
  if (swingCache.size > 256) swingCache.clear();
  swingCache.set(key, swing);
  return swing;
}

function solveSwing(cfg: GestureConfig, p: RigParams): RigSwing | null {
  const near = level(p.yaw0 + p.beta);
  const point = (v: number): Vec3 => qRotate(p.q, orbitOffset(cfg, p.yaw0, v, 1).offsetM);
  const side = (v: number): number => {
    const c = point(v);
    return c[0] * near[0] + c[2] * near[2];
  };
  // ⭐⭐ (2026-10-16, *"when I change the gizmo, the piece does some strange travels"*) EVERY crossing — midway through a gizmo change the turned curve
  // can start to pass over the gizmo in its middle, two crossings at once (⛔ the first alone made everything past it "far": the up flipped in a frame)
  const N = 400;
  const cross: number[] = [];
  for (let i = 0; i < N; i++) {
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
      cross.push((lo + hi) / 2);
    }
  }
  if (cross.length === 0) return null;
  const far: [number, number][] = [];
  const bounds = [-Infinity, ...cross, Infinity];
  for (let i = 0; i + 1 < bounds.length; i++) {
    const lo = bounds[i]!;
    const hi = bounds[i + 1]!;
    const mid = lo === -Infinity ? Math.max(0, hi - 1e-3) : hi === Infinity ? Math.min(1, lo + 1e-3) : (lo + hi) / 2;
    if (side(Math.min(1, Math.max(0, mid))) <= 0) far.push([lo, hi]);
  }
  const vc = cross[0]!;
  const farAbove = side(Math.min(1, vc + 1e-3)) <= 0;
  // ⭐⭐ (2026-10-16, the owner: *"it looks like the piece does a Z-shape travel. build option B instead."*) — the swing spans rings 2 → 3 exactly,
  // centred on the crossing (⛔ C: a width solved to the vertical crossing's speed, 11.3 mm in `Scene_1`, reaching past the rings — a Z-shape travel)
  const [v2, v3] = ring23(cfg);
  return { vc, w: Math.max(1e-6, Math.abs(v2 - v3)), farAbove, far };
}

/** ⭐ How far the camera's heading has swung round at `v` (0 on the near side, 1 behind the piece on the far side). */
export function rigSwingShare(cfg: GestureConfig, p: RigParams, v: number): number {
  const s = rigSwing(cfg, p);
  if (s === null) return 0;
  // ⭐⭐ (2026-10-16) the SMOOTHED far fraction of the window [v − w/2, v + w/2] (the smoothstep's density): one crossing — exactly the swing of
  // option B; a far stretch appearing midway through a gizmo change starts at zero width, so the share grows from zero — never a jump
  let share = 0;
  for (const [a, b] of s.far) share += smooth((b - v) / s.w + 0.5) - smooth((a - v) / s.w + 0.5);
  return Math.min(1, Math.max(0, share));
}

/** ⭐ The camera's angles round the gizmo (azimuth, elevation) — `piece_orbit.ts`'s `AroundAngles`. */
export interface RigAngles {
  readonly az: number;
  readonly el: number;
}

/** ⭐ The camera's direction (from the gizmo toward it, unit) and its UP. */
export interface RigCameraFrame {
  readonly dir: Vec3;
  readonly up: Vec3;
}

/** ⭐ (2026-10-17) 1 between rings 2 and 3, fading to 0 over `WAIST_GATE_FADE` of their span beyond them — the swing's heading's gate. */
const WAIST_GATE_FADE = 0.25;
export function waistGate(cfg: GestureConfig, v: number): number {
  const { v2, v3 } = waistRings(cfg);
  if (!(v2 > v3)) return 0;
  const out = Math.max(v - v2, v3 - v, 0) / (v2 - v3);
  return smooth(1 - out / WAIST_GATE_FADE);
}

/**
 * ⭐⭐⭐ (2026-10-16, the owner: *"there is still a Z-shape back and forth of the piece when the camera turns. Can you synchronize all movements so that this disappear ? Also, when I change the gizmo, the piece does some strange travels and most of the times the camera never catches the offset … with the piece traveling outside the screen during the orbit"*) — **THE CAMERA DERIVED FROM THE PIECE**: its direction from the gizmo IS the piece's own
 * (`place`, the piece's place at the camera's orbit place — the SAME turn the piece is placed with, blended or not), so whatever the piece does —
 * the crossing, a gizmo change, a slide — the camera follows it exactly (⛔ a heading and tilt of their own, blended apart from the piece's place: the
 * Z-shape, the piece lost off the screen). Its UP: upright (the world's vertical seen from the camera) everywhere but between rings 2 and 3 over a
 * crossing, where it turns half a round with the swing's heading (`rigSwingShare`) — the view turns, the camera stays on the piece. The owner's
 * offsets as ever: the pitch offset away from the level (`mirroredPitchOffset`, about the camera's right), the yaw offset about the world vertical;
 * clamped at ±89° outside the swing. ⭐ Unturned it is `cameraOffset`'s direction EXACTLY, its up the upright one.
 */
export function rigCameraFrame(cfg: GestureConfig, p: RigParams, cam: OrbitAt, place: Vec3, off: CameraAngleOffset = { yawRad: 0, pitchRad: 0 }, swingHeading?: number): RigCameraFrame {
  const lim = (89 * Math.PI) / 180;
  const d0 = normalize(place) ?? ([1, 0, 0] as Vec3);
  const e = Math.asin(Math.max(-1, Math.min(1, d0[1])));
  // the heading the up reads: the piece's OWN below 30° of elevation (the upright camera — robust, nothing to decide; a top face's rings 2 and 3 sit at 30°), the swing's above 60° (where
  // the upright camera's heading is undefined), blended between (⛔ the swing's everywhere: midway through a gizmo change its near / far split flipped)
  const hSwing = swingHeading ?? rigSwingHeading(cfg, p, cam);
  const flat = Math.hypot(d0[0], d0[2]);
  const hOwn = flat > 1e-9 ? Math.atan2(d0[2], d0[0]) : hSwing;
  // ⭐⭐ (2026-10-17, the owner: *"there is a strange mix of roll and jumps of camera positions when the gizmo is supported by a face which is on the right side,
  // back side, or bottom side of the assembly"*) — the swing's heading only BETWEEN RINGS 2 AND 3, where a crossing over the top happens (⛔ anywhere above 30°:
  // a crossing far out on the ring 4 stretch rolled a back face's picture, 12.5° a step at v 0.2; a narrower band squeezed the top crossing to a near-flip)
  // ⭐⭐ (2026-10-17, the owner: *"when I move the gizmo from the top face of piece 4 to the vertical front face of piece 10 and start dy approach from max
  // distance, at one point the camera does a 360 roll"*) — and NEAR THE VERTICAL everywhere (70°–85°): midway through a gizmo change the blended curve passes
  // over the gizmo outside rings 2 and 3, where the piece's own heading is undefined — it flipped half a round in two steps (110°, then 54°)
  // over the vertical; and the waist's band fades out over a quarter of the waist's span past rings 2 and 3 (⛔ cut at ring 3: a 26° snap of roll there, mid-change)
  const wz = Math.max(
    smooth((Math.abs(e) - STEEP_FROM_RAD) / (STEEP_FULL_RAD - STEEP_FROM_RAD)),
    smooth((Math.abs(e) - SWING_FROM_RAD) / (SWING_FULL_RAD - SWING_FROM_RAD)) * waistGate(cfg, cam.v),
  );
  // ⭐ (2026-10-17) the two headings blended as DIRECTIONS (⛔ the short way: passing half a round apart mid-change, it swapped sides — 92° of roll in one step)
  const heading = level(Math.atan2((1 - wz) * Math.sin(hOwn) + wz * Math.sin(hSwing), (1 - wz) * Math.cos(hOwn) + wz * Math.cos(hSwing)));
  const raw: Vec3 = [-Math.sin(e) * heading[0], Math.cos(e), -Math.sin(e) * heading[2]];
  const k = dot(raw, d0);
  const u0 = normalize([raw[0] - k * d0[0], raw[1] - k * d0[1], raw[2] - k * d0[2]]) ?? ([0, 1, 0] as Vec3);
  // the pitch offset: about the camera's right — toward its up raises it (outside the swing exactly the elevation's change, clamped at ±89°)
  let op = mirroredPitchOffset(e, off.pitchRad);
  if (wz <= 0) op = Math.max(-lim, Math.min(lim, e + op)) - e;
  const c = Math.cos(op);
  const sn = Math.sin(op);
  const d1: Vec3 = [c * d0[0] + sn * u0[0], c * d0[1] + sn * u0[1], c * d0[2] + sn * u0[2]];
  const u1: Vec3 = [c * u0[0] - sn * d0[0], c * u0[1] - sn * d0[1], c * u0[2] - sn * d0[2]];
  // the yaw offset: about the world vertical
  const t = yawTurn(off.yawRad);
  return { dir: qRotate(t, d1), up: qRotate(t, u1) };
}

/** ⭐ The camera's offset from the gizmo along `dir`, at the piece's distance (`boxOffset`) plus `radiusOffsetM` — `cameraOffset`'s rule. */
export function cameraOffsetAt(dir: Vec3, boxOffset: Vec3, radiusOffsetM: number): Vec3 {
  const d = Math.hypot(boxOffset[0], boxOffset[1], boxOffset[2]) + Math.max(0, radiusOffsetM);
  return [d * dir[0], d * dir[1], d * dir[2]];
}

/** ⭐ The yaw whose ring place points the piece at `rel` (from the gizmo) at `v` — the rebase at the end of the orbit around the piece. */
export function rigYawToward(cfg: GestureConfig, p: RigParams, v: number, zoom: number, rel: Vec3): number {
  const c = qRotate(p.q, orbitOffset(cfg, p.yaw0, v, zoom).offsetM);
  if (Math.hypot(c[0], c[2]) < 1e-9 || Math.hypot(rel[0], rel[2]) < 1e-9) return p.yaw0;
  // ⭐ yawTurn(δ) adds δ to the orbit's yaw: the piece's azimuth less the curve point's at yaw0
  return p.yaw0 + Math.atan2(rel[2], rel[0]) - Math.atan2(c[2], c[0]);
}

/**
 * ⭐⭐ (2026-10-16, the owner: *"there is still a Z-shape back and forth of the piece when the camera turns. Can you synchronize all movements so that this disappear ? Also, when I change the gizmo, the piece does some strange travels and most of the times the camera never catches the offset … with the piece traveling outside the screen during the orbit"*) — **THE TURN ITSELF BLENDED** at the gizmo's share `s`: the rotation slerped, the fixed yaw and the
 * heading the short way — every rig on the way is a real turned curve, so the piece swings over at its ring distance from the gizmo, and the piece and
 * the camera read the SAME blended turn. ⛔ The places blended in a straight line (a chord cutting through odd places) and the camera's angles apart.
 */
export function blendRig(a: RigParams, b: RigParams, s: number): RigParams {
  if (s >= 1) return b;
  if (s <= 0) return a;
  const q = qSlerp(a.q, b.q, s);
  const yaw0 = a.yaw0 + wrapPi(b.yaw0 - a.yaw0) * s;
  // ⭐ the near side ON the blended curve's own plane, the way nearer the blended heading — the near / far split stays clean all the way
  return { q, yaw0, beta: rigBetaFor(q, yaw0, [0, 0, 0], a.beta + wrapPi(b.beta - a.beta) * s) };
}

/**
 * ⭐⭐ (2026-10-16, the owner: *"when I change the gizmo, the piece does some strange travels"*) — the blend's share EASED every frame toward the gizmo's own (`centreBlend.progress`, which steps by the
 * finger's travel, ~3 % a pointer event): the turn swings over continuously (⛔ stepped, a piece metres from the gizmo jerked with the camera — 6 % of
 * the screen in one frame, headless). An exponential approach on the orbit's own smoothing time; at the target within 1e-4 it lands there.
 */
export function easeShare(cur: number, target: number, dtMs: number, tauMs: number): number {
  if (!(tauMs > 0) || !(dtMs > 0)) return target;
  const next = cur + (target - cur) * (1 - Math.exp(-dtMs / tauMs));
  return Math.abs(target - next) < 1e-4 ? target : next;
}

/**
 * ⭐⭐⭐ (2026-10-16, the owner: *"when I change the gizmo, the piece does some strange travels and most of the times the camera never catches the offset
 * … with the piece traveling outside the screen"*) — **THE NEW TURN, THE NEARER OF TWO**: fixed at the camera's yaw, two turns put the curve's halfway
 * direction on the face's normal — they differ in which half of the curve faces the camera The one that
 * (⛔ the opposite yaw is the same curve — the orbit's yaw swings it back: the second is the first then HALF A TURN ABOUT THE FACE'S NORMAL) — the one that
 * moves the piece LEAST from where it stands (`from`, at the orbit's place `yaw`, `v`) — so a gizmo change keeps the piece on its side (⛔ near ring 1 it
 * travelled over the top of the gizmo, nearly straight up, and the camera turned half a round in a few frames); dy then crosses between rings 2 and 3.
 * Its near side the way nearer the old one (`rigBetaFor`'s `preferBeta`).
 */
export function rigTurnFor(cfg: GestureConfig, yaw: number, v: number, normal: Vec3 | null, cameraSide: Vec3, from: RigParams): RigParams {
  const here = rigPlace(cfg, from, yaw, v, 1);
  let best: RigParams | null = null;
  let bestD = Infinity;
  const q1 = rigRotationFor(cfg, yaw, normal);
  const n = normal === null ? null : normalize(normal);
  for (const q of n === null ? [q1] : [q1, qmul(qFromAxisAngle(n, Math.PI), q1)]) {
    const cand: RigParams = { q, yaw0: yaw, beta: rigBetaFor(q, yaw, cameraSide, from.beta), faced: normal !== null, normal: normal === null ? null : normal };
    const at = rigPlace(cfg, cand, yaw, v, 1);
    const d = Math.hypot(at[0] - here[0], at[1] - here[1], at[2] - here[2]);
    if (d < bestD - 1e-9) {
      bestD = d;
      best = cand;
    }
  }
  return best!;
}

/** ⭐ The swing's heading at the camera's orbit place — the near side turned half a round over a crossing (`rigSwingShare`). */
export function rigSwingHeading(cfg: GestureConfig, p: RigParams, cam: OrbitAt): number {
  return cam.yaw + p.beta + Math.PI * rigSwingShare(cfg, p, cam.v);
}

/**
 * ⭐⭐⭐ (2026-10-16, *"when I change the gizmo, the piece does some strange travels"*) — **THE CAMERA'S FRAME THROUGH A GIZMO CHANGE**: the place on the
 * BLENDED turn (`blendRig`), the swing's heading taken on each END turn — where its near / far split is stable — and blended the short way at the share
 * (⛔ read off the blended turn, its split flipped midway — the up turned 132° in one step while the piece's heading moved 0.03°).
 */
export function rigFrameBetween(cfg: GestureConfig, a: RigParams, b: RigParams, s: number, cam: OrbitAt, off?: CameraAngleOffset): RigCameraFrame {
  const p = blendRig(a, b, s);
  const hb = rigSwingHeading(cfg, b, cam);
  const hs = s >= 1 ? hb : (() => { const ha = rigSwingHeading(cfg, a, cam); return ha + wrapPi(hb - ha) * Math.max(0, s); })();
  return rigCameraFrame(cfg, p, cam, rigPlace(cfg, p, cam.yaw, cam.v, 1), off, hs);
}

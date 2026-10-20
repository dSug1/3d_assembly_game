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
import { smoothstep01 as smooth, waistRings } from "./waist_view";
import { mirroredPitchOffset, type CameraAngleOffset, type OrbitAt } from "./follow_camera";
import { IDENTITY, cross, dot, normalize, qconj, qFromAxisAngle, qmul, qRotate, qSlerp, type Quat, type Vec3 } from "../core/vec";

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
  /** ⭐ (2026-10-16) every stretch of the curve on the FAR side of the gizmo (ring parameter; the ends extended past 0 and 1), ⭐ (2026-10-18) with the
   * top roll's width at each end (`topRollWidth`; an open end: any). */
  readonly far: readonly (readonly [number, number, number, number])[];
}

const swingCache = new Map<string, RigSwing | null>();

const ringKey = (cfg: GestureConfig): string =>
  [cfg.orbitLowerRingOn, cfg.orbitTopRadiusM, cfg.orbitTopHeightM, cfg.orbitMiddleRadiusM, cfg.orbitMiddleHeightM, cfg.orbitLowerRadiusM, cfg.orbitLowerHeightM, cfg.orbitBottomRadiusM, cfg.orbitBottomHeightM, cfg.topRollBandDeg].join(",");

/** ⭐ The unturned curve's pitch at `v` (its angle above the level, rad) — a turn keeps angles, so it is also the view's angle along the turned curve's plane. */
function curvePitch(cfg: GestureConfig, v: number): number {
  const o = orbitOffset(cfg, 0, Math.min(1, Math.max(0, v)), 1).offsetM;
  return Math.atan2(o[1], o[0]);
}

/**
 * ⭐⭐⭐ (2026-10-18, the owner: *"Isn't is possible to modify this camera movement so that there is no azimuth i.e. the vertical edges in the scene
 * assembly remain vertical in the screen view. To avoid having the scene upside down at the exit of the movement, the camera can also roll between ring 2
 * and ring 3"* → *"start building"*) — **THE TOP ROLL's WIDTH** at a crossing `vc`, in the ring parameter: the stretch over which the view turns
 * `±topRollBandDeg` about straight above (where the curve's pitch θ has turned B away on each side) — ⛔ the whole span of rings 2 → 3 (option B): the picture rolled all the
 * way, where vertical edges are long (164° → 20° against the curve's plane).
 */
export function topRollWidth(cfg: GestureConfig, vc: number): number {
  const band = (cfg.topRollBandDeg * Math.PI) / 180;
  const at = curvePitch(cfg, vc);
  // ⭐ on each side, where the pitch has turned the band away from the crossing's (bisection; the ring's end if it never does) — the window their mean, ×2
  const reach = (dir: number): number => {
    const end = dir > 0 ? 1 - vc : vc;
    if (!(end > 0) || Math.abs(curvePitch(cfg, vc + dir * end) - at) < band) return Math.max(end, 1e-4);
    let lo = 0;
    let hi = end;
    for (let k = 0; k < 40; k++) {
      const m = (lo + hi) / 2;
      if (Math.abs(curvePitch(cfg, vc + dir * m) - at) < band) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  };
  return Math.max(1e-4, reach(1) + reach(-1));
}


/** ⭐ (2026-10-17) the swing's heading counts fully on a curve coming within `90° − PEAK_FULL` of the vertical, not at all short of `PEAK_FROM` (`rigSwingNeed`). */
const PEAK_FROM_RAD = (75 * Math.PI) / 180;
const PEAK_FULL_RAD = (88 * Math.PI) / 180;
/** ⭐ The curve's pitch range is read at this many places (once per ring set — `pitchRange`). */
const PITCH_SAMPLES = 512;
const pitchCache = new Map<string, readonly [number, number]>();

/** ⭐ The range of the UNTURNED curve's pitch (its angle above the level, `orbitOffset`) over v ∈ [0, 1] — ⚠ not monotone (rings 2/3 sit steeper than 1/4). */
function pitchRange(cfg: GestureConfig): readonly [number, number] {
  const key = ringKey(cfg);
  const hit = pitchCache.get(key);
  if (hit !== undefined) return hit;
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i <= PITCH_SAMPLES; i++) {
    const o = orbitOffset(cfg, 0, i / PITCH_SAMPLES, 1).offsetM;
    const t = Math.atan2(o[1], o[0]);
    lo = Math.min(lo, t);
    hi = Math.max(hi, t);
  }
  const r = [lo, hi] as const;
  if (pitchCache.size > 64) pitchCache.clear();
  pitchCache.set(key, r);
  return r;
}

/**
 * ⭐⭐ (2026-10-17, the second Fable audit's #2) **THE TURNED CURVE'S PEAK ELEVATION, EXACT** (up or down, rad): the curve is planar — the level heading
 * `yaw0` and the vertical, turned by `q` — so with `a` the world's vertical seen unturned, `sin e(θ) = A·cos θ + B·sin θ = R·cos(θ − φ)` over the pitch range
 * (`pitchRange`): `R` itself if `φ` (or `φ + π`) falls inside it — the curve passes straight over (under) the gizmo — else the nearer end. ⛔ Sampled at 33
 * places, it missed the exact pass of a face tilted 65°–87° (read 0.00–0.87 of the need for a true 90°): the own heading's half-round flip entered the
 * camera — 177° in one step on a 75° face.
 */
export function rigPeakElevation(cfg: GestureConfig, p: RigParams): number {
  const a = qRotate(qconj(p.q), [0, 1, 0]);
  const h = level(p.yaw0);
  const A = a[0] * h[0] + a[2] * h[2];
  const B = a[1];
  const R = Math.hypot(A, B);
  if (!(R > 1e-12)) return 0;
  const phi = Math.atan2(B, A);
  const [lo, hi] = pitchRange(cfg);
  if (phi + Math.ceil((lo - phi) / Math.PI - 1e-12) * Math.PI <= hi + 1e-12) return Math.asin(Math.min(1, R));
  return Math.asin(Math.min(1, R * Math.max(Math.abs(Math.cos(lo - phi)), Math.abs(Math.cos(hi - phi)))));
}

/**
 * ⭐⭐ (2026-10-17, the owner: *"when I change the gizmo from an horizontal face to a vertical face, there is still this annoying jittery roll twice (at
 * ring 2 and ring 3) during a dy approach. I thought we had solved that issue."*) — **HOW MUCH THE CURVE NEEDS THE SWING**: by how near the vertical (up
 * or down) the turned curve comes anywhere (`rigPeakElevation` — the orbit's yaw swings it about the vertical, so its elevations are the turn's alone).
 * The swing turns the picture over a crossing; a curve that never comes near the vertical has none to turn for, and upright is continuous all along it
 * (⛔ midway through a top → vertical change the blended curve peaked at ~50°, and the up was pulled toward the top face's swing near ring 2 and again near
 * ring 3 — there and back twice, 8°–11° a frame).
 */
export function rigSwingNeed(cfg: GestureConfig, p: RigParams): number {
  return smooth((rigPeakElevation(cfg, p) - PEAK_FROM_RAD) / (PEAK_FULL_RAD - PEAK_FROM_RAD));
}

/**
 * ⭐⭐⭐ (2026-10-18, the owner: *"identify which of the faces of the frozen object the face supporting the gizmo projects the most … there are only 2 types
 * of 2D curve: for horizontal face or for gravity vertical face"* → *"if the face supporting the body projects equally to several faces of the frozen
 * object, select the vertical one"* → *"switch to gravity-only snapping"*) — **THE CURVE'S FACE, SNAPPED BY GRAVITY ONLY**: a gizmo face nearer horizontal
 * than vertical takes a horizontal face's curve (straight up or down); any other a vertical face's, turned toward the face's OWN horizontal direction —
 * only the TILT is snapped, never the heading, and nothing depends on a frozen body or the camera. A tie (45°) keeps the VERTICAL face. ⛔ Turned onto the
 * real normal, a face tilted 32° kept its curve on one side (the piece went over the gizmo and came back); ⛔ snapped to the floor's six faces, a face
 * turned about gravity (Piece1, 32°) got a curve up to 45° off its own direction. `null`: none.
 */
export function snapToGravity(n: Vec3 | null): Vec3 | null {
  const u = n === null ? null : normalize(n);
  if (u === null) return null;
  const h = Math.hypot(u[0], u[2]);
  if (Math.abs(u[1]) > h + 1e-9) return [0, u[1] > 0 ? 1 : -1, 0];
  return h > 1e-12 ? [u[0] / h, 0, u[2] / h] : null;
}

/** ⭐ The rig's swing (`null` when its curve never passes over the gizmo) — cached per turn and ring set. */
export function rigSwing(cfg: GestureConfig, p: RigParams): RigSwing | null {
  // ⭐ (2026-10-17, the second Fable audit) the same turn OBJECT first — the end turns persist frame to frame, and the value key cost 2 µs a read
  const rings = ringKey(cfg);
  const own = swingByTurn.get(p);
  if (own !== undefined && own.rings === rings) return own.swing;
  // ⭐ keyed by the turn's VALUES and the rings: a blended turn is a new object every frame
  const key = `${rings}|${p.q.map((x) => x.toFixed(6)).join(",")}|${p.yaw0.toFixed(6)}|${p.beta.toFixed(6)}`;
  let swing = swingCache.get(key);
  if (swing === undefined) {
    swing = solveSwing(cfg, p);
    if (swingCache.size > 256) swingCache.clear();
    swingCache.set(key, swing);
  }
  swingByTurn.set(p, { rings, swing });
  return swing;
}
const swingByTurn = new WeakMap<RigParams, { readonly rings: string; readonly swing: RigSwing | null }>();

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
  const far: [number, number, number, number][] = [];
  const bounds = [-Infinity, ...cross, Infinity];
  for (let i = 0; i + 1 < bounds.length; i++) {
    const lo = bounds[i]!;
    const hi = bounds[i + 1]!;
    const mid = lo === -Infinity ? Math.max(0, hi - 1e-3) : hi === Infinity ? Math.min(1, lo + 1e-3) : (lo + hi) / 2;
    if (side(Math.min(1, Math.max(0, mid))) <= 0) far.push([lo, hi, Number.isFinite(lo) ? topRollWidth(cfg, lo) : 1, Number.isFinite(hi) ? topRollWidth(cfg, hi) : 1]);
  }
  const vc = cross[0]!;
  const farAbove = side(Math.min(1, vc + 1e-3)) <= 0;
  // ⭐⭐⭐ (2026-10-18) THE TOP ROLL — the swing only within the band about straight above (`topRollWidth`), centred on the crossing; outside it the
  // camera is upright, in the curve's vertical plane (⛔ option B, 2026-10-16: spanning rings 2 → 3 — the picture rolled all the way)
  return { vc, w: topRollWidth(cfg, vc), farAbove, far };
}

/** ⭐ How far the camera's heading has swung round at `v` (0 on the near side, 1 behind the piece on the far side). */
export function rigSwingShare(cfg: GestureConfig, p: RigParams, v: number): number {
  const s = rigSwing(cfg, p);
  if (s === null) return 0;
  // ⭐⭐ (2026-10-16) the SMOOTHED far fraction of the window [v − w/2, v + w/2] (the smoothstep's density): one crossing — exactly the swing of
  // option B; a far stretch appearing midway through a gizmo change starts at zero width, so the share grows from zero — never a jump
  let share = 0;
  for (const [a, b, wa, wb] of s.far) share += smooth((b - v) / wb + 0.5) - smooth((a - v) / wa + 0.5);
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
 * crossing (faded past them, `waistGate`; ⭐ 2026-10-18 the half-round itself only within `topRollBandDeg` of straight above — THE TOP ROLL, `topRollWidth`)
 * and near the vertical (70°–85°, anywhere) — both only as far as the curve comes near the vertical at all
 * (`rigSwingNeed`) — where it turns with the swing's heading (`rigSwingShare`): the view turns, the camera stays on the piece (its roll rate bounded where
 * the screen draws it: `input/camera_frame.ts`). The owner's
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
  // over the gizmo outside rings 2 and 3, where the piece's own heading is undefined — it flipped half a round in two steps (110°, then 54°);
  // and the waist's band fades out over a quarter of the waist's span past rings 2 and 3 (⛔ cut at ring 3: a 26° snap of roll there, mid-change)
  // ⭐⭐ (2026-10-17) both only as far as the curve comes near the vertical at all (`rigSwingNeed`) — a curve with no crossing keeps the upright camera
  const wz =
    rigSwingNeed(cfg, p) *
    Math.max(smooth((Math.abs(e) - STEEP_FROM_RAD) / (STEEP_FULL_RAD - STEEP_FROM_RAD)), smooth((Math.abs(e) - SWING_FROM_RAD) / (SWING_FULL_RAD - SWING_FROM_RAD)) * waistGate(cfg, cam.v));
  // ⭐ (2026-10-17) the two headings blended as DIRECTIONS (⛔ the short way: passing half a round apart mid-change, it swapped sides — 92° of roll in one step)
  return frameAtHeading(e, d0, blendHeadings(hOwn, hSwing, wz), wz, off, lim);
}

/** ⭐ (2026-10-18) the owner's camera offsets fade out from this elevation of the view (up or down), gone at `OFFSET_GONE_RAD` — the top roll's plane. */
const OFFSET_FADE_RAD = (60 * Math.PI) / 180;
const OFFSET_GONE_RAD = (75 * Math.PI) / 180;

/**
 * ⭐⭐ (2026-10-18, the top roll) how much of the owner's yaw / pitch offsets the camera keeps at elevation `e`: all below 60°, none past 75° — looking
 * nearly straight down a sideways offset means nothing, and it took the camera out of the curve's vertical plane (≤ 2.1°: the "slight azimuth").
 */
export function offsetKeep(e: number): number {
  return 1 - smooth((Math.abs(e) - OFFSET_FADE_RAD) / (OFFSET_GONE_RAD - OFFSET_FADE_RAD));
}

function frameAtHeading(e: number, d0: Vec3, h: number, wz: number, offIn: CameraAngleOffset, lim: number): RigCameraFrame {
  const keep = offsetKeep(e);
  const off = keep >= 1 ? offIn : { yawRad: offIn.yawRad * keep, pitchRad: offIn.pitchRad * keep };
  const heading = level(h);
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
 * ⭐⭐ (2026-10-17, the second Fable audit — the open item) **THE GIZMO CHANGE ADVANCES BY THE TRAVEL THE SOLVER HONOURED**: the finger's travel this frame
 * (`fingerMm`, of it `mmX` on dx — the yaw — and `mmY` on dy — the ring), against the orbit's input (`input`, since the last frame) and the piece's solved
 * step (`solved`): all of it while the piece moved (or only waited on the work cap — it catches up); a blocked piece, the share of each axis it slid; a
 * relocation, none. ⛔ By the finger alone: the curve turned under a piece held against a part — relocated (*"the ring moved the piece into a part"*), or,
 * high over the assembly, the camera swept 10°–16° a frame once it was free.
 */
export function gizmoBlendTravel(
  fingerMm: number,
  mmX: number,
  mmY: number,
  input: { readonly yaw: number; readonly v: number },
  solved: { readonly yaw: number; readonly v: number },
  blocked: boolean | null,
  relocated: boolean,
): number {
  if (relocated || !(fingerMm > 0)) return 0;
  if (blocked !== true) return fingerMm;
  const share = (got: number, asked: number): number => (Math.abs(asked) < 1e-12 ? 1 : Math.min(1, Math.max(0, got / asked)));
  const full = Math.hypot(mmX, mmY);
  if (!(full > 0)) return 0;
  return (fingerMm * Math.hypot(mmX * share(solved.yaw, input.yaw), mmY * share(solved.v, input.v))) / full;
}

/**
 * ⭐⭐ (2026-10-16, the owner: *"when I change the gizmo, the piece does some strange travels"*) — the blend's share EASED every frame toward the gizmo's own (`centreBlend.progress`, which steps by the
 * travel the solver honoured — `gizmoBlendTravel` — ~3 % a pointer event): the turn swings over continuously (⛔ stepped, a piece metres from the gizmo jerked with the camera — 6 % of
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
    const cand: RigParams = { q, yaw0: yaw, beta: rigBetaFor(q, yaw, cameraSide, from.beta) };
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
  // ⭐ (2026-10-18, the top roll) the half-round turns toward the camera's yaw-offset side (today's sense at the owner's +2.5°; a negative offset, the other way)
  return cam.yaw + p.beta + (cfg.cameraYawOffsetDeg >= 0 ? 1 : -1) * Math.PI * rigSwingShare(cfg, p, cam.v);
}

/** ⭐ (2026-10-17) two headings blended at `s` as DIRECTIONS — the one rule for the camera's headings (⛔ the short way jumps 2π·s as they pass half a round apart). */
export function blendHeadings(ha: number, hb: number, s: number): number {
  const w = Math.min(1, Math.max(0, s));
  return Math.atan2((1 - w) * Math.sin(ha) + w * Math.sin(hb), (1 - w) * Math.cos(ha) + w * Math.cos(hb));
}

/**
 * ⭐⭐⭐ (2026-10-16, *"when I change the gizmo, the piece does some strange travels"*) — **THE CAMERA'S FRAME THROUGH A GIZMO CHANGE**: the place on the
 * BLENDED turn (`blendRig`), the swing's heading taken on each END turn — where its near / far split is stable — and blended at the share (as directions)
 * (⛔ read off the blended turn, its split flipped midway — the up turned 132° in one step while the piece's heading moved 0.03°).
 */
export function rigFrameBetween(cfg: GestureConfig, a: RigParams, b: RigParams, s: number, cam: OrbitAt, off?: CameraAngleOffset): RigCameraFrame {
  const curve = curveFrameBetween(cfg, a, b, s, cam, off);
  // ⭐⭐⭐ (2026-10-20) over a horizontal face: the camera's own curve (`topFaceRing`), as far as the turn is a horizontal face's
  // ⭐ each END turn's share, blended at the change's share — the ring fades in or out evenly over the gizmo change (⛔ the blended turn's own: it left the
  // horizontal in the first fifth of the change — the camera turned 12° a 0.25 mm step there, 7.5° without the ring)
  const ha = s >= 1 ? 0 : horizontalShare(cfg, a);
  const hb = s <= 0 ? 0 : horizontalShare(cfg, b);
  const hz = (1 - s) * ha + s * hb;
  if (hz <= 0) return curve;
  const knots = ringKnots(cfg);
  const v = Math.min(1, Math.max(0, cam.v));
  // ⭐ the camera's curve of each END turn, from its own curve's frames at rings 1, 3, 2 and 4 (⛔ on the blended curve: mid-change a waist ring passed straight
  // above and its azimuth spun the ring round) — turned at each of them onto the BLENDED curve's frame there, eased between: it meets the curve exactly there
  const blended = s >= 1 || s <= 0 ? null : knots.map((k) => curveFrameBetween(cfg, a, b, s, { yaw: cam.yaw, v: k }, off));
  const ringOf = (r: RigParams): Vec3 => {
    const at = knotFrames(cfg, r, cam.yaw, off, knots);
    const f = topFaceRing(cfg, at, knots, v, halfwayUp(cfg, r) >= 0 ? 1 : -1);
    if (blended === null) return f.dir;
    const { seg, u } = ringSegment(knots, v);
    return qRotate(qSlerp(rigArc(at[seg]!.dir, blended[seg]!.dir), rigArc(at[seg + 1]!.dir, blended[seg + 1]!.dir), smooth(u)), f.dir);
  };
  const ra = ha > 0 ? ringOf(a) : null;
  const rb = hb > 0 ? ringOf(b) : null;
  const rd = ra !== null && rb !== null ? mixUnit(ra, rb, (s * hb) / hz) : (ra ?? rb)!;
  if (hz >= 1) return { dir: rd, up: uprightUp(rd) }; // ⭐ upright (a turn onto the blended curve would tilt it)
  const dir = mixUnit(curve.dir, rd, hz);
  // ⭐ the up: the mixed view's upright one, rolled by the curve's own roll off upright (its top roll) scaled by what is left of the curve — an upright curve
  // mixes exactly upright (⛔ the two ups mixed as vectors: 1.7° off upright through rings 2 and 3 mid-change)
  const cu = uprightUp(curve.dir);
  const rho = Math.atan2(dot(cross(cu, curve.up), curve.dir), dot(cu, curve.up)) * (1 - hz);
  return { dir, up: qRotate(qFromAxisAngle(dir, rho), uprightUp(dir)) };
}

/** ⭐ The camera curve's knots: ring 1's end (0), the waist rings (`waistRings`, lower then higher), ring 4's end (1). */
function ringKnots(cfg: GestureConfig): readonly number[] {
  const { v2, v3 } = waistRings(cfg);
  return [0, Math.min(v2, v3), Math.max(v2, v3), 1];
}

/** ⭐ The knot segment `v` lies in (0: ring 1 → ring 3, 1: the waist, 2: ring 2 → ring 4) and how far along it (0 → 1). */
function ringSegment(knots: readonly number[], v: number): { seg: number; u: number } {
  const seg = v <= knots[1]! ? 0 : v < knots[2]! ? 1 : 2;
  const span = knots[seg + 1]! - knots[seg]!;
  return { seg, u: span > 1e-12 ? Math.min(1, Math.max(0, (v - knots[seg]!) / span)) : 1 };
}

/** ⭐ A turn's curve frames at the knots, kept for the last yaw and offsets asked (the turn governor asks many places a pointer event at one yaw). */
const knotMemo = new WeakMap<RigParams, { readonly key: string; readonly cfg: GestureConfig; readonly frames: readonly RigCameraFrame[] }>();
function knotFrames(cfg: GestureConfig, r: RigParams, yaw: number, off: CameraAngleOffset | undefined, knots: readonly number[]): readonly RigCameraFrame[] {
  const key = `${yaw}|${off?.yawRad ?? 0}|${off?.pitchRad ?? 0}|${knots.join(",")}|${ringKey(cfg)}|${cfg.cameraYawOffsetDeg}`;
  const m = knotMemo.get(r);
  if (m !== undefined && m.key === key && m.cfg === cfg) return m.frames;
  const frames = knots.map((k) => curveFrameBetween(cfg, r, r, 1, { yaw, v: k }, off));
  knotMemo.set(r, { key, cfg, frames });
  return frames;
}

/** ⭐ The curve's own frame on the turn blended at `s` (the swing's heading from each end turn — see `rigFrameBetween`). */
function curveFrameBetween(cfg: GestureConfig, a: RigParams, b: RigParams, s: number, cam: OrbitAt, off?: CameraAngleOffset): RigCameraFrame {
  const p = blendRig(a, b, s);
  const hb = rigSwingHeading(cfg, b, cam);
  // ⭐ (2026-10-17, the second Fable audit's #4) blended as DIRECTIONS, as `rigCameraFrame` blends its own (⛔ the short way: a 2π·s jump as the two crossed half a round apart — 43° a step at s 0.1)
  const hs = s >= 1 ? hb : blendHeadings(rigSwingHeading(cfg, a, cam), hb, s);
  return rigCameraFrame(cfg, p, cam, rigPlace(cfg, p, cam.yaw, cam.v, 1), off, hs);
}

/** ⭐ The vertical part of the turned curve's halfway direction (`waistV`) — +1 a top face's, −1 an underside's, 0 a vertical face's (dx keeps it). */
function halfwayUp(cfg: GestureConfig, p: RigParams): number {
  return normalize(qRotate(p.q, orbitOffset(cfg, p.yaw0, waistV(cfg), 1).offsetM))?.[1] ?? 0;
}

/**
 * ⭐ How much of a turn is a HORIZONTAL face's: all within 5° of straight up (or down), none past 15° — a face snapped by gravity is exactly one or the other;
 * a gizmo change fades the ring by its END turns' shares (`rigFrameBetween`); a turn tilted past 15° keeps the curve's frame and its top roll.
 */
const RING_FULL_COS = Math.cos((5 * Math.PI) / 180);
const RING_NONE_COS = Math.cos((15 * Math.PI) / 180);
export function horizontalShare(cfg: GestureConfig, p: RigParams): number {
  return smooth((Math.abs(halfwayUp(cfg, p)) - RING_NONE_COS) / (RING_FULL_COS - RING_NONE_COS));
}

/**
 * ⭐⭐⭐ (2026-10-20, the owner: *"The 2D curve for the horizontal hosting face has the camera rising up to the vertical of the gizmo during the travel between
 * ring 2 and ring 3 with dy input. Can you lower the camera and probably create a dedicated ring for the camera during this portion of the travel so the camera
 * view is lowered from the zenith … No change for the piece 2D curve, only for the camera on horizontal hosting face case."* → *"Build option A"* → *"instead,
 * can the 2D curve of the camera follow rings 1, ring midway (not ring 2 nor ring 3) , ring 4 ? This will avoid a sway of the piece between rings 2 and 3."*)
 * — **THE CAMERA'S OWN CURVE OVER A HORIZONTAL FACE**, from the curve's camera frames at the knots `at` (rings 1, 3, 2, 4 at `knots` 0, lower, higher, 1):
 * * its ANGLE ABOVE THE FACE through ring 1, the MIDWAY RING (`topFaceCameraRingDeg`, halfway between rings 3 and 2) and ring 4 — eased (smoothstep) from
 *   ring 1's to the midway ring's and on to ring 4's: no dip at rings 3 and 2 (⛔ 36° there, 50° between: the camera sank and rose — the piece swayed);
 * * its AZIMUTH the curve's camera's at each knot, HALF ROUND the gizmo between rings 3 and 2 the yaw offset's way (where the piece crosses over the top),
 *   eased (smoothstep: no turn at a knot);
 * `side` +1 above the face, −1 below. Upright: no roll, vertical edges vertical. A function of `v` alone: driven back it retraces itself (option A). Aimed at
 * the gizmo as ever (the piece stays near the screen's centre — 9–16 cm from it between rings 3 and 2, the camera 1.25 m farther off).
 */
export function topFaceRing(cfg: GestureConfig, at: readonly RigCameraFrame[], knots: readonly number[], v: number, side: number): RigCameraFrame {
  const az = (d: Vec3): number => Math.atan2(d[2], d[0]);
  const el = (d: Vec3): number => Math.asin(Math.max(-1, Math.min(1, d[1])));
  const { seg, u } = ringSegment(knots, v);
  const a0 = az(at[seg]!.dir);
  let da = az(at[seg + 1]!.dir) - a0;
  if (seg === 1) {
    da -= 2 * Math.PI * Math.floor(da / (2 * Math.PI)); // [0, 2π)
    if (cfg.cameraYawOffsetDeg < 0 && da > 0) da -= 2 * Math.PI; // ⭐ the yaw offset's way (as the top roll turned)
  } else da = wrapPi(da);
  const a = a0 + da * smooth(u);
  // ⭐ ring 1 → the midway ring → ring 4
  const vm = (knots[1]! + knots[2]!) / 2;
  const mid = (side * cfg.topFaceCameraRingDeg * Math.PI) / 180;
  const e0 = el(at[0]!.dir);
  const e3 = el(at[3]!.dir);
  const e = v <= vm ? e0 + (mid - e0) * smooth((v - knots[0]!) / (vm - knots[0]!)) : e3 + (mid - e3) * smooth((knots[3]! - v) / (knots[3]! - vm));
  const dir: Vec3 = [Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a)];
  return { dir, up: uprightUp(dir) };
}

/** ⭐ The upright up for a view `d` — the world's vertical laid square to it (straight up or down: +x's). */
function uprightUp(d: Vec3): Vec3 {
  return normalize([-d[1] * d[0], 1 - d[1] * d[1], -d[1] * d[2]]) ?? [1, 0, 0];
}

/** ⭐ Two unit vectors turned between at `w` along their arc (slerp — even in `w`; the second when opposite). */
function mixUnit(x: Vec3, y: Vec3, w: number): Vec3 {
  const c = Math.max(-1, Math.min(1, dot(x, y)));
  const th = Math.acos(c);
  if (th < 1e-9) return y;
  const sn = Math.sin(th);
  if (sn < 1e-9) return y;
  const ka = Math.sin((1 - w) * th) / sn;
  const kb = Math.sin(w * th) / sn;
  return normalize([ka * x[0] + kb * y[0], ka * x[1] + kb * y[1], ka * x[2] + kb * y[2]]) ?? y;
}

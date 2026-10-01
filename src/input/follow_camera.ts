/**
 * ⭐⭐ **THE CAMERA ORBITS AFTER THE GREEN BOX** (prototype, the owner, 2026-09-30): *"the inputs control the orbits of both
 * green box and camera — green box orbit as current — camera orbit: twice the radius and the height as green box orbit —
 * the camera orbits only if the green box has orbited beyond 15 degrees yaw amplitude and or 15 degrees pitch amplitude
 * vs. the camera orbit"*; *"the camera looks at the yellow target (orbit center)"*; and for the stop: *"the camera should
 * keep its speed and decrease the same way the green box did over the last degree the green box started to decrease
 * speed"* — *"when the box is still inside the leash, do not rotate the camera"*.
 *
 * ⭐ Two orbits about one centre. The BOX eases after the rig (`easeOrbit`). The CAMERA has its own (yaw, `v`), placed at
 * TWICE the rig's offset — twice the radius, twice the height. Per axis:
 * * **input MOVING — the LEASH**: while the box is within `leashRad` of the camera the camera stays; past it, it is dragged
 *   along, `leashRad` behind. Its speed is what that did.
 * * **input STOPPED — the GLIDE**: a camera at rest stays where it is. A MOVING camera keeps its speed `v₀` and brakes
 *   EXPONENTIALLY (the owner: *"build with the simplified exponential"*): time constant `τ = D / v₀`, `D` its distance to
 *   where the box ends — which covers exactly `D`, the speed continuous at the stop. ⛔ No fixed time: it follows from the
 *   speed and the distance.
 * ⭐ Yaw is compared the short way round; PITCH as the true angle `atan2(height, radius)` of each ring point — `v` is a ring
 * parameter, not an angle — and mapped back by bisection (the rings make it monotone).
 *
 * ⛔ ENGINE-FREE.
 */
import type { Vec3 } from "../core/vec";
import type { GestureConfig } from "./gestureConfig";
import { orbitOffset } from "./orbit";

/** One orbit position: yaw (radians) and the ring parameter `v` in [0, 1]. */
export interface OrbitAt {
  readonly yaw: number;
  readonly v: number;
}

/** ⭐ A camera glide on one axis: toward where the box ends, exponential with `tauMs = distance / v₀`. */
interface Glide {
  readonly dir: number;
  readonly distance: number;
  readonly travelled: number;
  readonly tauMs: number;
}

interface AxisState {
  /** The camera's speed on this axis, radians per ms, signed. */
  readonly vel: number;
  readonly movedAt: number;
  /** The input's (the raw rig's) angle last frame, and the box's. */
  readonly lastDriver: number;
  readonly lastBox: number;
  readonly glide: Glide | null;
}

export interface CameraOrbitState {
  readonly cam: OrbitAt;
  readonly yaw: AxisState;
  readonly pitch: AxisState;
  /** The camera's speed on each axis, radians per ms (pitch as the true angle). */
  readonly yawVel: number;
  readonly pitchVel: number;
}

export interface CameraOrbitParams {
  readonly leashRad: number;
  readonly settleDelayMs: number;
}

/** ⭐ The short way round, in (−π, π]. */
export function wrapPi(a: number): number {
  const t = ((((a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
  return t === -Math.PI ? Math.PI : t;
}

/** ⭐ The true pitch of a ring point: `atan2(height, radius)` (zoom does not change it). */
export function pitchOf(cfg: GestureConfig, v: number): number {
  const o = orbitOffset(cfg, 0, v, 1).offsetM;
  return Math.atan2(o[1], Math.hypot(o[0], o[2]));
}

/** ⭐ The ring parameter at a pitch — bisection over [0, 1], clamped to the rings. */
export function vForPitch(cfg: GestureConfig, pitch: number): number {
  let lo = 0;
  let hi = 1;
  const pLo = pitchOf(cfg, lo);
  const pHi = pitchOf(cfg, hi);
  const rising = pHi >= pLo;
  if (rising ? pitch <= pLo : pitch >= pLo) return lo;
  if (rising ? pitch >= pHi : pitch <= pHi) return hi;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const p = pitchOf(cfg, mid);
    if (rising ? p < pitch : p > pitch) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

const ease = (dtMs: number, tauMs: number): number => (tauMs > 0 ? 1 - Math.exp(-Math.max(0, dtMs) / tauMs) : 1);

function axisAt(angle: number, nowMs: number): AxisState {
  return { vel: 0, movedAt: nowMs, lastDriver: angle, lastBox: angle, glide: null };
}

/** ⭐ The camera orbit starts aligned with the box, at rest. */
export function cameraOrbitAt(box: OrbitAt, nowMs: number, cfg: GestureConfig): CameraOrbitState {
  const pitch = pitchOf(cfg, box.v);
  return { cam: box, yaw: axisAt(box.yaw, nowMs), pitch: axisAt(pitch, nowMs), yawVel: 0, pitchVel: 0 };
}

/** ⭐ One step of a glide, integrated EXACTLY: `s = D − (D − s)·e^(−dt/τ)`; within a millidegree it lands. */
function glideStep(g: Glide, dtMs: number): { glide: Glide | null; move: number; vel: number } {
  const left = g.distance - g.travelled;
  const leftAfter = left * Math.exp(-dtMs / g.tauMs);
  if (leftAfter < 2e-5) return { glide: null, move: g.dir * left, vel: 0 };
  return { glide: { ...g, travelled: g.distance - leftAfter }, move: g.dir * (left - leftAfter), vel: (g.dir * leftAfter) / g.tauMs };
}

/**
 * ⭐⭐ ONE AXIS, ONE FRAME. `gapToBox` / `gapToEnd`: signed, from the camera to the box and to where the box will end (the
 * input); `boxDelta`: the box's move this frame; `driverDelta`: the input's.
 */
function axisStep(
  a: AxisState,
  gapToBox: number,
  gapToEnd: number,
  driverDelta: number,
  boxAngle: number,
  driverAngle: number,
  nowMs: number,
  dtMs: number,
  p: CameraOrbitParams,
): { next: AxisState; move: number } {
  const movedAt = Math.abs(driverDelta) > 1e-9 ? nowMs : a.movedAt;
  const moving = movedAt === nowMs || nowMs - movedAt < p.settleDelayMs;
  const base = { movedAt, lastDriver: driverAngle, lastBox: boxAngle };
  if (dtMs <= 0) return { next: { ...a, ...base }, move: 0 };

  if (moving) {
    // ⭐ The LEASH. ⚠ Its speed is re-measured only on a frame the INPUT changed (or the leash moved the camera): a frame
    // inside the settle delay with no new input keeps the last speed, or the glide would find a camera "at rest".
    // ⛔ A camera pinned EXACTLY at the leash reads `leash + rounding`: under a nanoradian past it is no move at all.
    const move = Math.abs(gapToBox) > p.leashRad + 1e-9 ? gapToBox - Math.sign(gapToBox) * p.leashRad : 0;
    const vel = movedAt === nowMs || move !== 0 ? move / dtMs : a.vel;
    return { next: { ...base, vel, glide: null }, move };
  }

  let glide = a.glide;
  if (glide === null) {
    // ⭐ The owner: *"when the box is still inside the leash, do not rotate the camera"* — a camera at rest stays; so does
    // one heading away from where the box ends.
    if (Math.abs(a.vel) < 1e-9 || Math.sign(a.vel) !== Math.sign(gapToEnd) || Math.abs(gapToEnd) < 1e-9) {
      return { next: { ...base, vel: 0, glide: null }, move: 0 };
    }
    // ⭐ τ = D / v₀: the exponential that starts at the camera's speed covers exactly the distance.
    glide = { dir: Math.sign(gapToEnd), distance: Math.abs(gapToEnd), travelled: 0, tauMs: Math.abs(gapToEnd) / Math.abs(a.vel) };
  }
  const g = glideStep(glide, dtMs);
  return { next: { ...base, vel: g.vel, glide: g.glide }, move: g.move };
}

/**
 * ⭐ One frame: each axis leashed while the input drives it, gliding exponentially onto where the box ends once it stops.
 * @param driver What the INPUT drives — the raw rig. ⛔ Not the smoothed box: its ease creeps on after the finger stops.
 */
export function cameraOrbitStep(
  s: CameraOrbitState,
  box: OrbitAt,
  nowMs: number,
  dtMs: number,
  cfg: GestureConfig,
  p: CameraOrbitParams,
  driver: OrbitAt = box,
): CameraOrbitState {
  const y = axisStep(
    s.yaw,
    wrapPi(box.yaw - s.cam.yaw),
    wrapPi(driver.yaw - s.cam.yaw),
    wrapPi(driver.yaw - s.yaw.lastDriver),
    box.yaw,
    driver.yaw,
    nowMs,
    dtMs,
    p,
  );
  const pc = pitchOf(cfg, s.cam.v);
  const pb = pitchOf(cfg, box.v);
  const pd = pitchOf(cfg, driver.v);
  const q = axisStep(s.pitch, pb - pc, pd - pc, pd - s.pitch.lastDriver, pb, pd, nowMs, dtMs, p);
  return {
    cam: { yaw: s.cam.yaw + y.move, v: q.move === 0 ? s.cam.v : vForPitch(cfg, pc + q.move) },
    yaw: y.next,
    pitch: q.next,
    yawVel: y.next.vel,
    pitchVel: q.next.vel,
  };
}

/** ⭐ The camera's own offset from its orbit position, so the box does not hide the yellow target (the owner: *"Offset the
 * camera from green box so the user can see the yellow target"*), radians. */
export interface CameraAngleOffset {
  readonly yawRad: number;
  readonly pitchRad: number;
}

/**
 * ⭐⭐ The camera's offset from the orbit centre: at ITS orbit angles (yaw, and the true pitch of its ring point) plus the
 * owner's offsets, at TWICE THE BOX's current distance from the centre.
 * ⛔⛔ Not twice its OWN ring point (the first build): the rings are not a sphere — `Scene_1`'s middle ring is 1.0 m out,
 * its top ring 1.8 m and 0.55 m up — so a box pitching up moved from 1.50 to 2.79 m from the centre within a few degrees
 * while the lagging camera stayed near 3 m: the box came almost to the camera, and a 7° lag became an offset of 2.6
 * half-screens (measured, 2026-10-01) — off the top, while yaw (the distance never changes) stayed at 0.45. ⭐ At twice
 * the box's distance the box is always halfway, so a lag in pitch reads on screen like the same lag in yaw. When aligned
 * it is exactly *"twice the radius and the height"*.
 */
export function cameraOffset(cfg: GestureConfig, cam: OrbitAt, boxOffset: Vec3, off: CameraAngleOffset = { yawRad: 0, pitchRad: 0 }): Vec3 {
  const lim = (89 * Math.PI) / 180;
  const pitch = Math.max(-lim, Math.min(lim, pitchOf(cfg, cam.v) + off.pitchRad));
  const yaw = cam.yaw + off.yawRad;
  const d = 2 * Math.hypot(boxOffset[0], boxOffset[1], boxOffset[2]);
  return [d * Math.cos(pitch) * Math.cos(yaw), d * Math.sin(pitch), d * Math.cos(pitch) * Math.sin(yaw)];
}

/** ⭐ An orbit position with its zoom — what the green box eases along. */
export interface OrbitZoom extends OrbitAt {
  readonly zoom: number;
}

/**
 * ⭐⭐ **THE BOX EASES AFTER THE RIG** (the owner: *"why the movement of the camera is fluid while the movement of the green
 * box is jerky?"* — *"add it"*). The rig changes only when a pointer event arrives (~15–20 a second on the tablet, `D86`),
 * so a box placed straight on it jumps and holds; eased every frame toward it — yaw the short way, the ring parameter and
 * the zoom — it moves continuously, and stays on its orbit. ⚠ Cost: about `tauMs` of lag behind the finger.
 */
export function easeOrbit(cur: OrbitZoom, target: OrbitZoom, dtMs: number, tauMs: number): OrbitZoom {
  const k = ease(dtMs, tauMs);
  return {
    yaw: cur.yaw + wrapPi(target.yaw - cur.yaw) * k,
    v: cur.v + (target.v - cur.v) * k,
    zoom: cur.zoom * Math.pow(target.zoom / cur.zoom, k),
  };
}

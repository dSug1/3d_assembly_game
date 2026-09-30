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
 * * **input STOPPED — the GLIDE**: a camera at rest stays where it is. A MOVING camera keeps its speed and brakes with the
 *   BOX's own braking shape — recorded from the box's last speed peak, its smoothing tail predicted to the end — stretched
 *   over the camera's own distance to where the box ends. It lands there at zero speed. ⛔ No fixed time: it follows from
 *   the speed, the distance and how the finger stopped.
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

/** ⭐ The box's braking on one axis, from its last speed peak: distance travelled and speed at each frame (both ≥ 0). */
interface Braking {
  readonly dir: number;
  readonly peak: number;
  readonly s: readonly number[];
  readonly u: readonly number[];
}

/** ⭐ A camera glide on one axis: its braking shape (distance fraction → speed fraction), where it is, and toward where. */
interface Glide {
  readonly dir: number;
  readonly distance: number;
  readonly travelled: number;
  readonly v0: number;
  readonly xs: readonly number[];
  readonly ys: readonly number[];
}

interface AxisState {
  /** The camera's speed on this axis, radians per ms, signed. */
  readonly vel: number;
  readonly movedAt: number;
  /** The input's (the raw rig's) angle last frame, and the box's. */
  readonly lastDriver: number;
  readonly lastBox: number;
  readonly braking: Braking;
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

const NO_BRAKING: Braking = { dir: 0, peak: 0, s: [0], u: [0] };

function axisAt(angle: number, nowMs: number): AxisState {
  return { vel: 0, movedAt: nowMs, lastDriver: angle, lastBox: angle, braking: NO_BRAKING, glide: null };
}

/** ⭐ The camera orbit starts aligned with the box, at rest. */
export function cameraOrbitAt(box: OrbitAt, nowMs: number, cfg: GestureConfig): CameraOrbitState {
  const pitch = pitchOf(cfg, box.v);
  return { cam: box, yaw: axisAt(box.yaw, nowMs), pitch: axisAt(pitch, nowMs), yawVel: 0, pitchVel: 0 };
}

/** ⭐ Follow the box's braking: a new peak (or a reversal) restarts it; a slower frame extends it. */
function recordBraking(b: Braking, delta: number, dtMs: number): Braking {
  if (dtMs <= 0 || delta === 0) return b;
  const dir = Math.sign(delta);
  const u = Math.abs(delta) / dtMs;
  if (dir !== b.dir || u >= b.peak) return { dir, peak: u, s: [0], u: [u] };
  return { ...b, s: [...b.s, b.s[b.s.length - 1]! + Math.abs(delta)], u: [...b.u, u] };
}

/**
 * ⭐⭐ The BRAKING SHAPE — speed fraction against distance fraction — from the box's record plus its smoothing tail still to
 * run (`tail`: the box's distance to the input, which it covers slowing linearly to zero — an exponential ease's own
 * profile). Degenerate (no speed, no distance): a straight line from 1 to 0.
 */
function brakingShape(b: Braking, tail: number): { xs: number[]; ys: number[] } {
  const sLast = b.s[b.s.length - 1]!;
  const total = sLast + Math.max(0, tail);
  if (!(b.peak > 0) || !(total > 1e-12)) return { xs: [0, 1], ys: [1, 0] };
  const xs = b.s.map((s) => s / total);
  const ys = b.u.map((u) => u / b.peak);
  xs.push(1);
  ys.push(0);
  return { xs, ys };
}

/** Speed fraction at a distance fraction — piecewise linear. */
function shapeAt(xs: readonly number[], ys: readonly number[], x: number): number {
  if (x <= xs[0]!) return ys[0]!;
  for (let i = 1; i < xs.length; i++) {
    if (x <= xs[i]!) {
      const span = xs[i]! - xs[i - 1]!;
      const f = span > 0 ? (x - xs[i - 1]!) / span : 1;
      return ys[i - 1]! + (ys[i]! - ys[i - 1]!) * f;
    }
  }
  return ys[ys.length - 1]!;
}

/** ⭐ One step of a glide: the speed read off the shape at the MIDPOINT of the step; the last step lands. */
function glideStep(g: Glide, dtMs: number): { glide: Glide | null; move: number; vel: number } {
  const speed = (t: number) => g.v0 * shapeAt(g.xs, g.ys, t / g.distance);
  const v1 = speed(g.travelled);
  const mid = speed(Math.min(g.distance, g.travelled + 0.5 * v1 * dtMs));
  // ⚠ A shape that ends at zero speed is only approached; within a millidegree (or a stall) it lands.
  const step = Math.max(mid * dtMs, 0);
  const left = g.distance - g.travelled;
  if (step >= left || left < 2e-5 || mid < 1e-9) return { glide: null, move: g.dir * left, vel: 0 };
  return { glide: { ...g, travelled: g.travelled + step }, move: g.dir * step, vel: g.dir * mid };
}

/**
 * ⭐⭐ ONE AXIS, ONE FRAME. `gapToBox` / `gapToEnd`: signed, from the camera to the box and to where the box will end (the
 * input); `boxDelta`: the box's move this frame; `driverDelta`: the input's.
 */
function axisStep(
  a: AxisState,
  gapToBox: number,
  gapToEnd: number,
  boxDelta: number,
  driverDelta: number,
  boxAngle: number,
  driverAngle: number,
  nowMs: number,
  dtMs: number,
  p: CameraOrbitParams,
): { next: AxisState; move: number } {
  const braking = recordBraking(a.braking, boxDelta, dtMs);
  const movedAt = Math.abs(driverDelta) > 1e-9 ? nowMs : a.movedAt;
  const moving = movedAt === nowMs || nowMs - movedAt < p.settleDelayMs;
  const base = { movedAt, lastDriver: driverAngle, lastBox: boxAngle, braking };
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
    const shape = brakingShape(braking, Math.abs(gapToEnd - gapToBox));
    glide = { dir: Math.sign(gapToEnd), distance: Math.abs(gapToEnd), travelled: 0, v0: Math.abs(a.vel), ...shape };
  }
  const g = glideStep(glide, dtMs);
  return { next: { ...base, vel: g.vel, glide: g.glide }, move: g.move };
}

/**
 * ⭐ One frame: each axis leashed while the input drives it, gliding with the box's braking once it has stopped.
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
    wrapPi(box.yaw - s.yaw.lastBox),
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
  const q = axisStep(s.pitch, pb - pc, pd - pc, pb - s.pitch.lastBox, pd - s.pitch.lastDriver, pb, pd, nowMs, dtMs, p);
  return {
    cam: { yaw: s.cam.yaw + y.move, v: q.move === 0 ? s.cam.v : vForPitch(cfg, pc + q.move) },
    yaw: y.next,
    pitch: q.next,
    yawVel: y.next.vel,
    pitchVel: q.next.vel,
  };
}

/** ⭐ The camera's offset from the orbit centre: TWICE the rig's — twice the radius and the height. */
export function cameraOffset(cfg: GestureConfig, cam: OrbitAt, zoom: number): Vec3 {
  const o = orbitOffset(cfg, cam.yaw, cam.v, zoom).offsetM;
  return [o[0] * 2, o[1] * 2, o[2] * 2];
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

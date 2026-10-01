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
  /**
   * `"carry"`: a moving camera continues its speed, braking exponentially (`τ = D / v₀`). `"rest"`: a camera AT REST at a
   * release starts from zero speed — a critically damped spring, `s = D(1 − (1 + u)e^(−u))`, `u = t / τ` — so it neither
   * jumps to a speed nor overshoots. `elapsed` is its clock.
   */
  readonly kind: "carry" | "rest";
  readonly elapsed: number;
}

interface AxisState {
  /** The camera's speed on this axis, radians per ms, signed. */
  readonly vel: number;
  readonly movedAt: number;
  /** The input's (the raw rig's) angle last frame, and the box's. */
  readonly lastDriver: number;
  readonly lastBox: number;
  readonly glide: Glide | null;
  /** ⭐ A release asked this axis to realign — even a camera at rest inside the leash. Cleared once aligned or moving. */
  readonly aligning: boolean;
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
  /** ⭐ A release's catch-up from REST: the spring's time constant, ms. */
  readonly restTauMs: number;
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
  return { vel: 0, movedAt: nowMs, lastDriver: angle, lastBox: angle, glide: null, aligning: false };
}

/** ⭐ The camera orbit starts aligned with the box, at rest. */
export function cameraOrbitAt(box: OrbitAt, nowMs: number, cfg: GestureConfig): CameraOrbitState {
  const pitch = pitchOf(cfg, box.v);
  return { cam: box, yaw: axisAt(box.yaw, nowMs), pitch: axisAt(pitch, nowMs), yawVel: 0, pitchVel: 0 };
}

/** ⭐ One step of a glide, integrated EXACTLY: `s = D − (D − s)·e^(−dt/τ)`; within a millidegree it lands. */
function glideStep(g: Glide, dtMs: number): { glide: Glide | null; move: number; vel: number } {
  const left = g.distance - g.travelled;
  if (g.kind === "rest") {
    const elapsed = g.elapsed + dtMs;
    const u = elapsed / g.tauMs;
    const travelled = g.distance * (1 - (1 + u) * Math.exp(-u));
    if (g.distance - travelled < 2e-5) return { glide: null, move: g.dir * left, vel: 0 };
    return {
      glide: { ...g, travelled, elapsed },
      move: g.dir * (travelled - g.travelled),
      vel: (g.dir * g.distance * u * Math.exp(-u)) / g.tauMs,
    };
  }
  const leftAfter = left * Math.exp(-dtMs / g.tauMs);
  if (leftAfter < 2e-5) return { glide: null, move: g.dir * left, vel: 0 };
  return { glide: { ...g, travelled: g.distance - leftAfter }, move: g.dir * (left - leftAfter), vel: (g.dir * leftAfter) / g.tauMs };
}

/**
 * ⭐⭐ ONE AXIS, ONE FRAME. `gapToBox` / `gapToEnd`: signed, from the camera to the box and to where the box will end (the
 * input); `boxDelta`: the box's move this frame; `driverDelta`: the input's.
 */
/** ⭐ How fast a camera inside the leash sheds the speed it carries — an exponential time constant, ms. */
const COAST_MS = 80;

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
  /**
   * ⭐⭐ Is the FINGER driving this axis moving? — its own §1.1 verdict (`MotionTracker`: the deadband and the device-derived
   * rest window, `D86`). `null`: no finger drives the orbit (a reset, the demo, a pinch) — then the input's own change is read.
   * ⛔⛔ Read per FRAME, the input's change made every frame between two pointer events (they come every 47–68 ms on the
   * tablet, the frames every 16–40) an input that had STOPPED: the camera glided toward the box, the next event put it
   * back on the leash, stopped dead — at some speeds a steady drag made the box jitter (the owner, 2026-10-01).
   */
  fingerMoving: boolean | null,
  /**
   * ⭐⭐ The finger driving the orbit was LIFTED this frame (the owner, 2026-10-01: *"when the input touch/click is released,
   * the camera shall catch up to the original offset even if the green box is inside the camera leash range"*): this axis
   * realigns whatever its speed — from rest, a smooth spring (`restTauMs`).
   */
  released: boolean,
): { next: AxisState; move: number } {
  const changed = fingerMoving === null ? Math.abs(driverDelta) > 1e-9 : fingerMoving;
  const movedAt = changed ? nowMs : a.movedAt;
  const moving = movedAt === nowMs || nowMs - movedAt < p.settleDelayMs;
  const aligning = released || a.aligning;
  const base = { movedAt, lastDriver: driverAngle, lastBox: boxAngle, aligning };
  if (dtMs <= 0) return { next: { ...a, ...base }, move: 0 };

  if (moving && !released) {
    // ⭐ The LEASH. (A new input ends a realignment the release asked for.) ⛔ A camera pinned EXACTLY at the leash reads `leash + rounding`: under a nanoradian past it is no move.
    if (Math.abs(gapToBox) > p.leashRad + 1e-9) {
      const move = gapToBox - Math.sign(gapToBox) * p.leashRad;
      return { next: { ...base, aligning: false, vel: move / dtMs, glide: null }, move };
    }
    // ⭐⭐ Inside it, a camera still carrying SPEED — a glide the input interrupted, or the leash's own pull a moment ago —
    // SHEDS it (`COAST_MS`) instead of stopping dead (the owner: *"build the fix and polish"*); it never passes the box.
    const vel = a.vel * Math.exp(-dtMs / COAST_MS);
    if (Math.abs(vel) < 1e-7) return { next: { ...base, aligning: false, vel: 0, glide: null }, move: 0 };
    const move = vel * dtMs;
    if (move * gapToBox > 0 && Math.abs(move) >= Math.abs(gapToBox)) return { next: { ...base, aligning: false, vel: 0, glide: null }, move: gapToBox };
    return { next: { ...base, aligning: false, vel, glide: null }, move };
  }

  let glide = a.glide;
  if (Math.abs(gapToEnd) < 1e-9) return { next: { ...base, aligning: false, vel: 0, glide: null }, move: gapToEnd };
  if (glide === null) {
    const carrying = Math.abs(a.vel) >= 1e-9 && Math.sign(a.vel) === Math.sign(gapToEnd);
    if (carrying) {
      // ⭐ τ = D / v₀: the exponential that starts at the camera's speed covers exactly the distance.
      glide = { dir: Math.sign(gapToEnd), distance: Math.abs(gapToEnd), travelled: 0, tauMs: Math.abs(gapToEnd) / Math.abs(a.vel), kind: "carry", elapsed: 0 };
    } else if (aligning) {
      // ⭐ A release realigns even a camera at rest — from zero speed, a spring (no jump in speed).
      glide = { dir: Math.sign(gapToEnd), distance: Math.abs(gapToEnd), travelled: 0, tauMs: Math.max(1, p.restTauMs), kind: "rest", elapsed: 0 };
    } else {
      // ⭐ The owner: *"when the box is still inside the leash, do not rotate the camera"* — a camera at rest stays (until a
      // release); so does one heading away from where the box ends.
      return { next: { ...base, vel: 0, glide: null }, move: 0 };
    }
  }
  const g = glideStep(glide, dtMs);
  return { next: { ...base, aligning: g.glide === null ? false : aligning, vel: g.vel, glide: g.glide }, move: g.move };
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
  /** ⭐ The orbit FINGER's own verdict per axis (yaw ← its x, pitch ← its y); `null` when no finger drives the orbit. */
  finger: { readonly yaw: boolean; readonly pitch: boolean } | null = null,
  /** ⭐ The orbit finger was lifted THIS frame: both axes realign, even from rest inside the leash. */
  released = false,
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
    finger === null ? null : finger.yaw,
    released,
  );
  const pc = pitchOf(cfg, s.cam.v);
  const pb = pitchOf(cfg, box.v);
  const pd = pitchOf(cfg, driver.v);
  const q = axisStep(s.pitch, pb - pc, pd - pc, pd - s.pitch.lastDriver, pb, pd, nowMs, dtMs, p, finger === null ? null : finger.pitch, released);
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
 * owner's offsets, at the BOX's current distance from the centre PLUS `radiusOffsetM` (the owner, 2026-10-01: *"camera
 * orbit radius = green box orbit radius + radius offset"*; it replaces *twice the box's distance*, kept below as the record).
 * ⛔⛔ Not twice its OWN ring point (the first build): the rings are not a sphere — `Scene_1`'s middle ring is 1.0 m out,
 * its top ring 1.8 m and 0.55 m up — so a box pitching up moved from 1.50 to 2.79 m from the centre within a few degrees
 * while the lagging camera stayed near 3 m: the box came almost to the camera, and a 7° lag became an offset of 2.6
 * half-screens (measured, 2026-10-01) — off the top, while yaw (the distance never changes) stayed at 0.45. ⭐ At twice
 * the box's distance the box is always halfway, so a lag in pitch reads on screen like the same lag in yaw. ⭐ Kept by the
 * radius offset: the camera's distance follows the BOX's, so the box never comes near it, whatever the rings do.
 */
export function cameraOffset(
  cfg: GestureConfig,
  cam: OrbitAt,
  boxOffset: Vec3,
  off: CameraAngleOffset = { yawRad: 0, pitchRad: 0 },
  radiusOffsetM: number,
): Vec3 {
  const lim = (89 * Math.PI) / 180;
  const pitch = Math.max(-lim, Math.min(lim, pitchOf(cfg, cam.v) + off.pitchRad));
  const yaw = cam.yaw + off.yawRad;
  const d = Math.hypot(boxOffset[0], boxOffset[1], boxOffset[2]) + Math.max(0, radiusOffsetM);
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

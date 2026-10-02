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
import { orbitOffset, elevationGainScale } from "./orbit";

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
  void cfg; // ⭐ 2026-10-02: the pitch axis runs on the ring position `v` (`cameraOrbitStep`), so no angle is needed to start it
  return { cam: box, yaw: axisAt(box.yaw, nowMs), pitch: axisAt(box.v, nowMs), yawVel: 0, pitchVel: 0 };
}

/**
 * ⭐ The pitch LEASH (an angle) as a distance in ring position `v`, for a camera at `camV` behind a box at `boxV`: how far from the
 * box, toward the camera, the pitch first differs from the box's by `leashRad` — found on that stretch (bisection), so it is exact
 * whatever the rings' shape. ⭐ If the whole stretch stays within the leash, the camera is inside it: the stretch itself (plus a
 * hair). `0` for no leash.
 */
export function leashInV(cfg: GestureConfig, boxV: number, camV: number, leashRad: number): number {
  if (!(leashRad > 0)) return 0;
  const pb = pitchOf(cfg, boxV);
  const off = (v: number) => Math.abs(pitchOf(cfg, v) - pb);
  if (off(camV) <= leashRad) return Math.abs(boxV - camV) + 1e-9;
  let near = boxV; // within the leash
  let far = camV; // beyond it
  for (let i = 0; i < 50; i++) {
    const mid = (near + far) / 2;
    if (off(mid) < leashRad) near = mid;
    else far = mid;
  }
  return Math.abs(boxV - (near + far) / 2);
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
   * ⛔⛔ AND THE VERDICT ALONE IS NOT ENOUGH: the rig turns on the RAW finger, the verdict is DEADBANDED (3.5 mm per axis, at
   * ~5° of box yaw per mm). Inside the band the camera saw a still finger and stayed while the box turned ~18°; when the
   * band tripped, the leash pulled the camera ~15° in ONE frame (the owner, 2026-10-01: *"a big jump and the green box
   * recenters horizontally"* — at the top and bottom rings, where the box's radius is largest and nothing else moves).
   * ✅ So with a finger down, the axis is moving if the finger says so OR the input CHANGED within `holdMs` — the finger's
   * own rest window, which also bridges the gaps between pointer events.
   */
  fingerMoving: boolean | null,
  holdMs: number,
  /**
   * ⭐⭐ The finger driving the orbit was LIFTED this frame (the owner, 2026-10-01: *"when the input touch/click is released,
   * the camera shall catch up to the original offset even if the green box is inside the camera leash range"*): this axis
   * realigns whatever its speed — from rest, a smooth spring (`restTauMs`).
   */
  released: boolean,
): { next: AxisState; move: number } {
  const changed = Math.abs(driverDelta) > 1e-9 || fingerMoving === true;
  const movedAt = changed ? nowMs : a.movedAt;
  const window = fingerMoving === null ? p.settleDelayMs : Math.max(p.settleDelayMs, holdMs);
  const moving = movedAt === nowMs || nowMs - movedAt < window;
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
  finger: { readonly yaw: boolean; readonly pitch: boolean; readonly holdMs: number } | null = null,
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
    finger === null ? 0 : finger.holdMs,
    released,
  );
  // ⛔⛔ prototype (green box), 2026-10-02 (the owner: *"there is still a 'stair' effect at the transitions between rings"*): the
  // pitch axis runs on the RING POSITION `v`, not on the pitch ANGLE. ⛔ The angle is not monotone along the rings — on the waist it
  // rises to 34.06° at v = 0.70, then falls back to 31.5° — and `vForPitch`'s search assumed it was: the camera could not reach
  // any pitch above the top ring's 31.7°, clamped there, lagged the green piece by up to 2.4° even at leash 0, then snapped
  // back — the stair. `v` always moves one way. ⭐ The leash stays an ANGLE, converted to `v` EXACTLY on the stretch between the
  // camera and the box (`leashInV`).
  const leashV = leashInV(cfg, box.v, s.cam.v, p.leashRad);
  const q = axisStep(
    s.pitch,
    box.v - s.cam.v,
    driver.v - s.cam.v,
    driver.v - s.pitch.lastDriver,
    box.v,
    driver.v,
    nowMs,
    dtMs,
    { ...p, leashRad: leashV },
    finger === null ? null : finger.pitch,
    finger === null ? 0 : finger.holdMs,
    released,
  );
  return {
    cam: { yaw: s.cam.yaw + y.move, v: Math.min(1, Math.max(0, s.cam.v + q.move)) },
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

/**
 * ⭐⭐ prototype (green box) — **THE BOX IS SLOWER INSIDE THE LEASH** (the owner, 2026-10-01: *"reduce the gains while the green
 * box is within the leash zone because the green box is orbiting too fast, but maintain the orbit speed when it is beyond the
 * leash zone"*). Per axis, from how far the box is from the camera on that axis: `inside` with the box right in front of the
 * camera, ramped SMOOTHLY (smoothstep) to 1 at the leash edge and beyond. ⛔ Not a step at the edge — a gain that switched there
 * would lurch the box the moment the camera starts following. A leash of 0 has no inside: 1.
 */
export function leashGain(gapRad: number, leashRad: number, inside: number): number {
  if (!(leashRad > 0)) return 1;
  const t = Math.min(1, Math.abs(gapRad) / leashRad);
  return inside + (1 - inside) * t * t * (3 - 2 * t);
}

/** ⭐ Both axes' gains for the box's drag, from the box and the camera as they stand (yaw the short way, pitch in angle). */
export function boxDragGains(cfg: GestureConfig, box: OrbitAt, cam: OrbitAt, leashRad: number, inside: number): { yaw: number; pitch: number } {
  return {
    yaw: leashGain(wrapPi(box.yaw - cam.yaw), leashRad, inside),
    pitch: leashGain(pitchOf(cfg, box.v) - pitchOf(cfg, cam.v), leashRad, inside),
  };
}

/** ⭐ The green box's spring state: where it is, and how fast each channel moves (yaw rad/ms, `v` /ms, ln zoom /ms). */
export interface OrbitSpring {
  readonly at: OrbitZoom;
  readonly velYaw: number;
  readonly velV: number;
  readonly velLnZoom: number;
}

/** One critically damped channel: `x` relative to the target (0 is the target), its velocity, one step of `dt`. */
function springChannel(x: number, vel: number, dtMs: number, tauMs: number): { x: number; vel: number } {
  if (!(tauMs > 0)) return { x: 0, vel: 0 };
  const w = 1 / tauMs;
  const e = Math.exp(-w * dtMs);
  const t = (vel + w * x) * dtMs;
  return { x: (x + t) * e, vel: (vel - w * t) * e };
}

/**
 * ⭐⭐ prototype (green box) — **THE BOX FOLLOWS THE RIG ON A CRITICALLY DAMPED SPRING** (the owner, 2026-10-02: *"the camera lag
 * at 30 ms create jitter in the green box visualization. can you improve"*). ⛔ `easeOrbit` (one exponential) moves the box at a
 * speed that JUMPS at every pointer event — the rig steps once per event (47–68 ms on the tablet) — so its speed pulses at the
 * event rhythm. Pinned to the box (leash 0, no lag) the camera hid it; with a time lag, the gap box − camera is that speed × the
 * lag, and the box wobbled on the glass. ⭐ A critically damped spring has NO speed jump, so an event starts no pulse:
 * simulated on a steady drag (an event every 3–4 frames), the gap's ripple drops ~2.5–3× at every lag (30, 60, 150 ms) —
 * while a smoother CAMERA made it slightly WORSE (it only shows the box's pulse more faithfully). ⭐ `tauMs` is the spring's
 * time constant — `boxSmoothMs / 2`, the same response time the single exponential had. Yaw the short way; zoom in log space.
 */
export function springOrbit(s: OrbitSpring, target: OrbitZoom, dtMs: number, tauMs: number): OrbitSpring {
  const y = springChannel(wrapPi(s.at.yaw - target.yaw), s.velYaw, dtMs, tauMs);
  const v = springChannel(s.at.v - target.v, s.velV, dtMs, tauMs);
  const z = springChannel(Math.log(s.at.zoom / target.zoom), s.velLnZoom, dtMs, tauMs);
  return {
    at: { yaw: target.yaw + y.x, v: target.v + v.x, zoom: target.zoom * Math.exp(z.x) },
    velYaw: y.vel,
    velV: v.vel,
    velLnZoom: z.vel,
  };
}

/**
 * ⭐⭐ prototype (green box) — **THE CAMERA'S TIME LAG, ON TOP OF THE LEASH** (the owner, 2026-10-02: *"lag the camera orbit
 * behind the green piece orbit in whichever orbit direction … create time lag with slider on top of leash"*). The leash says
 * where the camera SHOULD be (`cameraOrbitStep`'s `cam`); the camera then EASES toward that, exponentially with time constant
 * `tauMs` (`cameraFollowMs`) — yaw the short way, in whichever direction it is moving. So a fast orbit opens a wider gap than
 * a slow one, and the gap closes by itself once the orbit stops. `tauMs = 0`: no lag, the camera is where the leash says.
 */
export function cameraLag(shown: OrbitAt, wanted: OrbitAt, dtMs: number, tauMs: number): OrbitAt {
  const k = ease(dtMs, tauMs);
  return { yaw: shown.yaw + wrapPi(wanted.yaw - shown.yaw) * k, v: shown.v + (wanted.v - shown.v) * k };
}

/**
 * ⭐ prototype (green box) — **HOW MANY DEGREES OF ORBIT ONE MILLIMETRE OF FINGER GIVES** (the owner, 2026-10-02: *"compute somewhere
 * the delta yaw and pitch orbit degrees that a delta x or delta y position input provides"*). The orbit drag (`orbitDragStep`)
 * turns `dx` mm into `dx × gainOrbitYaw × boxGainYaw` rad of YAW — the same anywhere on the rings — and `dy` mm into
 * `dy × gainOrbitElevation × boxGainPitch` of the RING PARAMETER `v`, whose PITCH (`pitchOf`) is not linear in `v`: so the pitch
 * rate is the slope there (a central difference; one-sided at a ring's end — the slope going back inward, the only way `v` can move). `gains` are the
 * inside-the-leash factors (`boxDragGains`; 1 with no leash). Degrees per mm of `|dx|` and per mm of `v` increase (a finger moving
 * DOWN on the glass, the box's inverted orbit): yaw positive; pitch SIGNED — ⚠ the pitch is not monotone along `Scene_1`'s waist
 * rings (it peaks at ±33.5° near v = 0.25 / 0.75 and comes back to ±31.7° at the outer rings), so near a ring's end the sign flips.
 */
export function orbitDegPerMm(
  cfg: GestureConfig,
  v: number,
  gains: { readonly yaw: number; readonly pitch: number } = { yaw: 1, pitch: 1 },
): { readonly yawDegPerMm: number; readonly pitchDegPerMm: number } {
  const DEG = 180 / Math.PI;
  const dvPerMm = cfg.gainOrbitElevation * elevationGainScale(cfg) * cfg.boxGainPitch * gains.pitch;
  const h = 1e-4;
  const lo = Math.max(0, v - h);
  const hi = Math.min(1, v + h);
  const slope = hi > lo ? (pitchOf(cfg, hi) - pitchOf(cfg, lo)) / (hi - lo) : 0;
  return {
    yawDegPerMm: cfg.gainOrbitYaw * cfg.boxGainYaw * gains.yaw * DEG,
    pitchDegPerMm: slope * dvPerMm * DEG,
  };
}

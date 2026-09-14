/**
 * WHEN THE SCENE SHOULD REACT — the trigger for the sympathetic sway, and how hard.
 *
 * ⭐⭐ The sway fires on a CHANGE OF INTENT, never on a schedule. Three of them:
 *
 *   1. the finger **starts or resumes** moving;
 *   2. the gesture **becomes a translation** — a second finger goes down mid-rotation;
 *   3. the drag **turns** by more than `swayTurnDeg`.
 *
 * ⛔ (3) IS THE ONE THAT WAS MISSING, and its absence is not obvious from the code: the
 * first trigger is `motionState`, which only falls back to `STATIONARY` after 150 ms
 * below 6 mm/s. A hand that reverses at speed never goes still, so a shaken object used
 * to nudge the scene ONCE and then drag it about in silence. ⚠ The owner found it by
 * finger: *"especially when there are rapid changes of direction it seems the effect is
 * not implemented."*
 *
 * ⛔⛔ THE DIRECTION IS SMOOTHED, OVER A STATED WINDOW. A turn measured between two
 * consecutive pointer samples is noise: at 0.761 mm of measured jitter and a 8 ms frame,
 * a finger held still produces direction reversals continuously, and the scene would
 * shake itself apart while nothing moved. ⚠ **Mistake shape 1** — a rate over the
 * shortest available baseline — which this project has now paid for four times.
 *
 * ⛔ ENGINE-FREE, and it decides nothing about what the sway looks like: it says WHEN and
 * HOW HARD, and `follow.ts`'s `impulseForPeak` says what that does.
 */
import { canon, qconj, qmul, type Quat, type Vec3 } from "../core/vec";
import { pxToMm } from "../core/units";
import type { ScreenFrame } from "./screen_rotate";
import type { Sample } from "./motion";

/**
 * The window the direction is measured ACROSS, in milliseconds.
 *
 * ⛔⛔ A DISPLACEMENT OVER A WINDOW, NOT A SMOOTHED VELOCITY. The first attempt smoothed
 * the per-sample velocity and it was hopeless: at 8 ms between samples, the measured
 * 0.761 mm of pointer noise IS ±95 mm/s of apparent speed, and no amount of smoothing
 * brings a random direction back. Measured — a finger held perfectly still fired **272
 * kicks** in 3 seconds. ⭐ Over 60 ms a deliberate 100 mm/s drag travels 6 mm while the
 * noise stays under a millimetre, and the direction is unambiguous. Same reasoning as
 * `roll.ts`'s span: state the baseline, and check the signal clears the noise.
 * ⚠ It is a trade against latency: longer resolves slower drags, and delays the
 * detection of a turn. 60 ms registers a reversal within about four frames.
 */
const DIRECTION_WINDOW_MS = 60;

/**
 * How far the finger must have travelled ACROSS that window before a direction is
 * claimed at all, as a multiple of the measured pointer noise.
 * ⚠ Below this the "direction" is the noise's, and a turn cannot be asserted.
 */
const MIN_TRAVEL_NOISE_MULTIPLE = 3;
// ⭐ MEASURED, not chosen. A finger held still while `motionState` is still reporting
// MOVING — reachable for up to 150 ms after a pause — fired this many false kicks over
// 10 s at the device's own noise: 2× → 23, **3× → 0**, and every larger multiple → 0.
// ⚠ The cost of raising it is the slowest drag that can still register a turn: 25 mm/s
// at 2×, 38 at 3×, 51 at 4×. 3 is the first that holds, and 38 mm/s is well below where
// the speed scaling bottoms out anyway.

export interface SwayKick {
  /** Unit direction on screen. ⚠ `y` grows DOWNWARD, the browser's convention. */
  readonly dirX: number;
  readonly dirY: number;
  /** The SMOOTHED finger speed at the moment of the kick, mm/s. */
  readonly speedMmPerS: number;
}

/**
 * How hard to kick, as a multiple of the slider's amplitude.
 *
 * ⭐⭐ THE OWNER'S REQUEST: *"slow translation shall trigger slow spring movement, rapid
 * translation shall trigger rapid spring movement."* Both fall out of ONE proportionality
 * — make the impulse proportional to the drag speed, as a viscous coupling would. The
 * excursion grows with speed, and because it still peaks at the same `τ`, the other
 * objects COVER THAT GROUND FASTER: a bigger sway and a quicker one, from one number.
 * ⚠ If the return should also take LESS TIME at speed, that is a second knob (scaling
 * `τ` down) and it is deliberately not built — one mechanism first, measured.
 *
 * ⛔ CLAMPED AT BOTH ENDS. ⚠ The ceiling was raised from ×3 to **×4.5** on the owner's
 * device judgement — a fast drag was not throwing the scene far enough to read as a
 * reaction. A flick can reach 2000 mm/s, sixteen times the reference, and
 * an unclamped coupling would fling the rest of the scene across the view; a crawl would
 * scale to nothing and read as the effect being broken.
 */
export const SWAY_SCALE_MIN = 0.3;
export const SWAY_SCALE_MAX = 4.5;

export function swayScale(speedMmPerS: number, referenceMmPerS: number): number {
  if (!(referenceMmPerS > 0) || !Number.isFinite(speedMmPerS)) return 1;
  const raw = Math.abs(speedMmPerS) / referenceMmPerS;
  return Math.min(SWAY_SCALE_MAX, Math.max(SWAY_SCALE_MIN, raw));
}

/**
 * WHERE THE OTHER OBJECTS GO — **the same way** the held object set off.
 *
 * ⚠ It went opposite for one build, on a request the owner then corrected: *"my mistake:
 * they shall translate in the same direction."* Recorded because the sign is the whole
 * character of the effect and there is no way to tell from the code which was meant —
 * alongside reads as the scene being carried along with the object, against would read
 * as it being displaced by it.
 *
 * ⛔⛔ AND IT IS A TRUE 3-VECTOR, NOT A SCREEN DIRECTION. Today rule 6 moves the
 * object in the camera's view plane, so the world direction is exactly
 * `right·dx + up·(−dy)` — but rules **6bis/6ter** translate along **depth** as well, and
 * when they arrive the sway must follow the REAL displacement, not its shadow on the
 * glass. ⭐ **This function is the one place that mapping lives**: give it the depth
 * component when there is one and everything downstream follows, because it already
 * returns a world vector rather than a pair of screen numbers.
 *
 * @param dirX,dirY the drag's unit direction on screen. ⚠ `y` grows DOWNWARD.
 * @param depth     travel along the camera's view axis, for the rules that will have it.
 *   ⛔ Not reachable yet and deliberately not left implicit: a caller that starts moving
 *   in depth gets the right answer by passing it, instead of silently getting a wrong one.
 */
export function swayWorldDirection(
  frame: ScreenFrame,
  dirX: number,
  dirY: number,
  depth = 0,
): Vec3 {
  const v: Vec3 = [
    frame.right[0] * dirX - frame.up[0] * dirY + frame.viewAxis[0] * depth,
    frame.right[1] * dirX - frame.up[1] * dirY + frame.viewAxis[1] * depth,
    frame.right[2] * dirX - frame.up[2] * dirY + frame.viewAxis[2] * depth,
  ];
  const len = Math.hypot(v[0], v[1], v[2]);
  // ⚠ No direction in a zero vector. A zero back, never a normalise-by-zero: one NaN
  // written into a position never washes out of the scene.
  if (!(len > 0)) return [0, 0, 0];
  // ⭐ THE SIGN. It is here and nowhere else, so there is exactly one place to look when
  // the effect reads backwards on the glass.
  return [v[0] / len, v[1] / len, v[2] / len];
}

/** Degrees between two screen directions. Both are assumed non-zero. */
export function turnDegrees(ax: number, ay: number, bx: number, by: number): number {
  const la = Math.hypot(ax, ay);
  const lb = Math.hypot(bx, by);
  if (!(la > 0) || !(lb > 0)) return 0;
  const cos = Math.min(1, Math.max(-1, (ax * bx + ay * by) / (la * lb)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/**
 * Watches one held object's finger and says when the scene should react.
 * ⚠ One per gesture: it carries the direction the last kick went in.
 */
export class SwayWatcher {
  /** Samples inside the window, oldest first. */
  private readonly window: Sample[] = [];
  private wasMoving = false;
  private wasTranslating = false;
  private kickedX = 0;
  private kickedY = 0;
  private hasKicked = false;
  /**
   * ⛔ A TRIGGER THAT HAS FIRED BUT NOT YET BEEN SPENT. The edges — started moving,
   * became a translation — land on a sample where there is not yet enough travel to
   * point a kick along. ⚠ Consuming the edge there loses it for ever, which is what the
   * first version did: the onset kick never fired at all.
   */
  private armed = false;

  /**
   * @param turnDeg how far the drag must swing before the scene reacts again.
   * @param noiseMm the measured pointer noise (`pointerNoiseMm`). ⭐ Passed in rather
   *   than assumed: it is a property of the glass, and it decides how much travel is
   *   needed before a direction means anything.
   */
  constructor(
    private readonly turnDeg: number,
    private readonly noiseMm: number,
  ) {}

  /**
   * Feed one sample.
   *
   * @param moving      the recognizer's own `MOVING` state — ⛔ never a speed test
   *   invented here, which would be a second definition of "moving" free to disagree
   *   with the one the rules use.
   * @param translating whether rule 6 is what this gesture is currently doing.
   * @returns the kick to fire, or `null`.
   */
  push(s: Sample, moving: boolean, translating: boolean): SwayKick | null {
    this.window.push(s);
    while (this.window.length > 1 && s.t - this.window[0]!.t > DIRECTION_WINDOW_MS) {
      this.window.shift();
    }

    if (moving && !this.wasMoving) this.armed = true;
    if (translating && !this.wasTranslating) this.armed = true;
    this.wasMoving = moving;
    this.wasTranslating = translating;

    if (!translating || !moving) return null;

    const first = this.window[0]!;
    const dtSec = (s.t - first.t) / 1000;
    if (!(dtSec > 0)) return null;
    const dxMm = pxToMm(s.x - first.x);
    const dyMm = pxToMm(s.y - first.y);
    const travel = Math.hypot(dxMm, dyMm);
    // ⛔ Not enough travel to tell a direction from the jitter. Say nothing.
    if (!(travel > MIN_TRAVEL_NOISE_MULTIPLE * this.noiseMm)) return null;

    const turned =
      this.hasKicked && turnDegrees(dxMm, dyMm, this.kickedX, this.kickedY) > this.turnDeg;
    if (!this.armed && !turned) return null;
    this.armed = false;

    // ⭐ The reference becomes the heading just fired, so one turn gives one kick
    // however long the finger then holds the new direction.
    this.kickedX = dxMm;
    this.kickedY = dyMm;
    this.hasKicked = true;
    return { dirX: dxMm / travel, dirY: dyMm / travel, speedMmPerS: travel / dtSec };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// THE SAME EFFECT FOR ROTATION.
//
// ⭐⭐ When the held object starts turning, or turns the OTHER way, the rest of the scene
// swings with it — as a BLOCK, rigidly, about the held object's own centre and about the
// axis it is turning on. ⛔ Rigidly means each object both ORBITS the pivot and spins on
// its own by the same angle; orbiting alone would shear the group, which reads as things
// sliding past each other rather than as one scene reacting.

/**
 * The rotation vector of `q` — axis × angle, radians. ⚠ Canonical first, so it is always
 * the SHORT way round: a 350° turn is a −10° turn, and nothing here should ever be told
 * the scene swung most of a revolution.
 */
export function rotationVector(q: Quat): Vec3 {
  const [w, x, y, z] = canon(q);
  const s = Math.sqrt(x * x + y * y + z * z);
  // ⛔ At the identity the axis is UNDEFINED, not small. Zero is the correct limit, and
  // it avoids the 0/0 — an object that is being tracked perfectly sits here every frame.
  if (s < 1e-12) return [0, 0, 0];
  const angle = 2 * Math.atan2(s, w);
  return [(x / s) * angle, (y / s) * angle, (z / s) * angle];
}

export interface SpinSwayKick {
  /** Unit axis the held object is turning about, world frame, right-handed. */
  readonly axis: Vec3;
  /** How fast it is turning, degrees per second, over the measured window. */
  readonly degPerS: number;
}

/**
 * The rotation window is LONGER than the translation one.
 * ⛔ Because rotation's noise is worse: pointer jitter reaches the pose multiplied by
 * `gainRotateFree`, so the device's measured 0.761 mm becomes about 3° of orientation
 * noise per sample. A 60 ms window would be asking a ~4° noise floor to resolve the 5°
 * a slow deliberate turn covers. ⚠ 100 ms costs a little latency on a reversal and buys
 * the signal-to-noise back.
 */
const SPIN_WINDOW_MS = 100;

export class SpinSwayWatcher {
  private readonly window: { q: Quat; t: number }[] = [];
  private wasTurning = false;
  private kicked: Vec3 = [0, 0, 0];
  private hasKicked = false;
  private armed = false;

  /**
   * @param turnDeg      how far the AXIS must swing before the scene reacts again. ⚠ A
   *   reversal is a 180° axis change, so anything under that catches a change of hand.
   * @param minTravelDeg how much the object must actually have turned across the window
   *   before a direction is claimed. ⭐ Derived by the caller from the MEASURED pointer
   *   noise and the rotation gain — it is a property of the glass, not a preference.
   */
  constructor(
    private readonly turnDeg: number,
    private readonly minTravelDeg: number,
  ) {}

  /**
   * @param q       the object's orientation this frame.
   * @param turning whether the gesture is currently rotating at all.
   */
  push(q: Quat, t: number, turning: boolean): SpinSwayKick | null {
    this.window.push({ q, t });
    while (this.window.length > 1 && t - this.window[0]!.t > SPIN_WINDOW_MS) {
      this.window.shift();
    }

    if (turning && !this.wasTurning) this.armed = true;
    this.wasTurning = turning;
    if (!turning) return null;

    const first = this.window[0]!;
    const dtSec = (t - first.t) / 1000;
    if (!(dtSec > 0)) return null;

    // The NET rotation across the window, not a sum of steps: a hand that wobbled out
    // and back has gone nowhere, and should not be read as having turned twice.
    const net = rotationVector(qmul(q, qconj(first.q)));
    const angle = Math.hypot(net[0], net[1], net[2]);
    const deg = (angle * 180) / Math.PI;
    if (!(deg > this.minTravelDeg)) return null;

    const axis: Vec3 = [net[0] / angle, net[1] / angle, net[2] / angle];
    const turned =
      this.hasKicked && turnDegrees3(axis, this.kicked) > this.turnDeg;
    if (!this.armed && !turned) return null;
    this.armed = false;

    this.kicked = axis;
    this.hasKicked = true;
    return { axis, degPerS: deg / dtSec };
  }
}

/** Degrees between two 3-vectors. ⚠ Zero for a zero vector, never a NaN. */
export function turnDegrees3(a: Vec3, b: Vec3): number {
  const la = Math.hypot(a[0], a[1], a[2]);
  const lb = Math.hypot(b[0], b[1], b[2]);
  if (!(la > 0) || !(lb > 0)) return 0;
  const cos = Math.min(1, Math.max(-1, (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (la * lb)));
  return (Math.acos(cos) * 180) / Math.PI;
}

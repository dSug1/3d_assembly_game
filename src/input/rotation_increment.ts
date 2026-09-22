/**
 * ⭐⭐⭐ **A ROTATION ENDS ON A MULTIPLE OF THE INCREMENT — and only its END does.**
 *
 * The owner, 2026-09-22 (the second formulation):
 *
 * > *"RotationIncrement = 0 : current build (no change). RotationIncrement = incrmt > 0: any
 * > rotation stops at a degree which is a multiple of the incrmt … (the equivalent of the
 * > mathematical modulo function). Slerp the rotation at the end so that there is no brutal
 * > hard stop at the end. … Make sure to keep the current setup for speed, smoothing, etc.
 * > Just make sure the end of the rotation is by increment."*
 *
 * ⛔⛔⛔ **AND THE FIRST FORMULATION WAS BUILT, DRIVEN AND REJECTED — the reason is the whole
 * design of this file.** That one quantised the rotation *as it happened*: every whole
 * increment was queued and played as its own slerped step, so a hand felt the accumulation.
 * ⚠ It also meant the body could only turn as fast as the queue drained, so a brisk drag ran
 * ahead of it and the object lagged the finger by the backlog — *"it creates too much lag in
 * the rotation vs. the finger movement"*. ⛔ No tuning could remove that: a mechanism that
 * plays N steps of a fixed shape cannot also follow a finger that outruns it.
 *
 * ⭐⭐ **SO NOTHING IS QUANTISED DURING THE DRAG ANY MORE.** The rotation is applied exactly as
 * the current build applies it — same gains, same deadband, same smoothing, same everything —
 * and this module contributes a single correction **when the gesture ends**, slerped so the
 * landing is not abrupt. ⚠ The lag is not reduced, it is **unreachable by construction**, which
 * is the distinction `METHOD` draws between a threshold and a shape.
 *
 * ⭐ `METHOD`: *when a rule needs a WINDOW to decide, suspect the QUESTION.* The first rule
 * needed a queue, a per-step duration and a drain, and every one of those was buying an answer
 * to *"how do I play N increments?"* — a question the second rule simply does not ask.
 *
 * ⛔ ENGINE-FREE, and the decision lives here rather than in `render/scene.ts`: the binding
 * lesson of 2026-09-19 is that *a rule written in `scene.ts` is a rule nothing can interrogate*.
 */
import { IDENTITY, qFromAxisAngle, qmul, type Quat, type Vec3 } from "../core/vec";

/**
 * ⭐⭐ The increment in radians, or `null` when the mechanism is **off**.
 *
 * ⛔ **`0` IS THE CURRENT BUILD, UNTOUCHED.** One slider carries the flag and the angle, which
 * is the idiom this project already uses for the approach swing and the orbit centre blend: a
 * mechanism whose off state is a slider position can be A/B'd by a hand *in the same minute on
 * the same scene* — the comparison that settled `D28` and `IN13`.
 *
 * ⛔ A negative or non-finite angle is **off**, never an absolute value: a modulo about a
 * negative step is not a thing anyone asked for, and inventing one would be the
 * substituted-quantity mistake in miniature.
 */
export function incrementRadians(deg: number): number | null {
  if (!Number.isFinite(deg) || deg <= 0) return null;
  return (deg * Math.PI) / 180;
}

/**
 * ⭐⭐⭐ **BACK TO THE LAST INCREMENT ALREADY CROSSED** — the signed angle to ADD to `totalRad`
 * so this gesture's turn sits on the nearest increment it has **already passed**.
 *
 * The owner, 2026-09-22, correcting the first build:
 *
 * > *"I want the object to rotate and if the delta position speed diminishes below a certain
 * > threshold, the quaternion is not rotated any further than the previous increment. The
 * > rotation shall be smoothly truncated to the nearest past increment, not slerp rotated
 * > towards an increment at the end of the rotation motion."*
 *
 * ⛔⛔⛔ **TRUNCATE, NOT ROUND — AND THE FIRST BUILD ROUNDED.** `Math.round` sends a 23° turn
 * FORWARD to 25°; the owner wants it back to 20°. ⭐ The difference is not a tolerance, it is a
 * direction: a rounded correction can carry the body somewhere the finger never took it, which
 * is the object moving on its own. Truncation can only ever give back ground the gesture
 * covered.
 *
 * ⚠ **TOWARD THE GESTURE'S START**, which is what *"past"* means here: `Math.trunc`, so +23°
 * goes to +20° and −23° goes to −20°. ⛔ `Math.floor` would send −23° to −25° — further out
 * than the finger ever went, and inverted relative to the positive case. That asymmetry is
 * invisible to any vector that only tests one sign, which is why both are tested.
 *
 * ⭐ The correction is therefore always **opposite to the turn** and strictly less than one
 * increment, so the retreat is short by construction.
 */
export function truncateCorrection(totalRad: number, incrementRad: number): number {
  // ⛔⛔ `Number.isFinite` ON THE INCREMENT TOO, AND A VECTOR CAUGHT ITS ABSENCE. `> 0` admits
  // `Infinity`, and `Math.trunc(x / Infinity) * Infinity` is `0 * Infinity` — **NaN**, which
  // would be composed into a quaternion and written to the body, where it never washes out.
  if (!Number.isFinite(totalRad) || !Number.isFinite(incrementRad) || incrementRad <= 0) {
    return 0;
  }
  return Math.trunc(totalRad / incrementRad) * incrementRad - totalRad;
}

/**
 * ⭐⭐⭐ **HOW SLOW COUNTS AS *AT REST*, IN THE DETENT'S OWN UNITS.**
 *
 * The owner, 2026-09-22: *"The threshold shall probably depend on the increment value (harder
 * to move 45 degree increment than 1 degree increment)."*
 *
 * ⛔⛔⛔ **A FIXED THRESHOLD IS WRONG BY A FACTOR OF NINE ACROSS THE SLIDER, AND HERE IS THE
 * ARITHMETIC.** One increment of rotation is a definite amount of finger travel:
 * `increment / gain`. At `gainRotateFree` = 0.07 rad/mm a **5°** detent is **1.25 mm** of
 * finger and a **45°** detent is **11.2 mm**. ⚠ Against §1.1's fixed 3.5 mm rest band that
 * makes the band about **three detents wide** at 5° and **a third of one** at 45° — so a brief
 * pause gives back at most 4° in the first case and up to **44°** in the second. ⭐ Same
 * threshold, opposite consequence: the coarser the detent, the more a twitch costs.
 *
 * ⭐⭐ **SO THE THRESHOLD IS A FRACTION OF ONE INCREMENT PER SECOND**, which scales by
 * construction and needs no table. `fraction = 1` means *slower than one increment a second*.
 *
 * ⚠⚠ **AND IT IS A RATE, WHICH IS THIS PROJECT'S FIRST MISTAKE SHAPE** — *a rate estimated
 * over the shortest available baseline*, which broke §1.1 three times. ⛔ Two things keep it
 * honest: the window is stated and is long enough to hold several samples, and the quantity
 * measured is the **demanded** rotation, which §1.1 has already deadbanded — a resting finger
 * emits exactly zero, so the noise floor is somebody else's problem and already solved.
 *
 * ⭐ PRIOR ART (`CONSTRAINTS` §10): fixed-increment angle snapping is decades old and
 * unencumbered (Blender, 3ds Max, AutoCAD); the *gravity well* is Bier & Stone's snap-dragging
 * (SIGGRAPH 1986, I3D 1990) and snap STRENGTH is treated in Baudisch et al., *Snap-and-go*
 * (CHI 2005). ⚠ **Coupling the rest threshold to the increment is NOT something I could find
 * published** — registered as a novel composite in `PROVENANCE.md`, for `SEC4`.
 */
export function restThresholdRadPerS(incrementRad: number, fraction: number): number {
  if (!Number.isFinite(incrementRad) || incrementRad <= 0) return 0;
  if (!Number.isFinite(fraction) || fraction <= 0) return 0;
  return incrementRad * fraction;
}

/**
 * ⚠ The window the rate is measured over. **Stated, not tuned.**
 *
 * ⛔ 100 ms holds about six samples at 60 Hz — enough that one late frame cannot decide a rest,
 * and short enough that a hand reads the detent as immediate. ⭐ It is deliberately NOT a
 * slider: `METHOD`'s *state the window, and check the signal clears the noise, BEFORE writing
 * the threshold* is satisfied by stating it once, and a second knob for one rule is what the
 * owner asked not to have.
 */
export const REST_WINDOW_MS = 100;

/**
 * ⭐⭐ **HOW FAST THE BODY IS BEING ASKED TO TURN**, over a trailing window.
 *
 * ⛔ It measures the DEMAND, not the body's pose: the pose is also moved by the retreat itself,
 * and a detector that watched it would see its own correction and call it motion. ⚠ That is the
 * *metric sharing an expression with its subject* trap, and it would latch.
 */
export class RotationSpeed<Id> {
  private readonly trail = new Map<Id, { t: number; rad: number }[]>();

  /** Record `radians` of demand at time `t`. ⚠ Sign is dropped: a reversal is still motion. */
  add(id: Id, t: number, radians: number): void {
    if (!Number.isFinite(radians) || !Number.isFinite(t) || radians === 0) return;
    const q = this.trail.get(id);
    if (q === undefined) this.trail.set(id, [{ t, rad: Math.abs(radians) }]);
    else q.push({ t, rad: Math.abs(radians) });
  }

  /**
   * Demanded rotation per second over the last {@link REST_WINDOW_MS}.
   *
   * ⛔⛔ **THE WINDOW IS THE DIVISOR, NOT THE SPAN OF THE SAMPLES IN IT.** Dividing by the
   * elapsed time between the first and last surviving sample is the defect §1.1 shipped twice:
   * as the finger stops, samples stop arriving, the span collapses and the computed rate
   * *rises* — so rest becomes unreachable exactly when it matters. ⭐ A fixed divisor makes a
   * silent window read zero, which is the honest answer.
   */
  speed(id: Id, now: number): number {
    const q = this.trail.get(id);
    if (q === undefined || q.length === 0) return 0;
    const cutoff = now - REST_WINDOW_MS;
    // ⛔ HALF-OPEN, `(now − window, now]`, and the boundary is chosen rather than inherited.
    // ⚠ `METHOD`: *a threshold the state machine PARKS ON will be compared at its exact value* —
    // a sample landing exactly on the cutoff happens whenever the clock is regular, which at a
    // fixed frame rate is always. ⭐ Dropping it makes *older than the window* mean exactly that.
    while (q.length > 0 && (q[0] as { t: number }).t <= cutoff) q.shift();
    if (q.length === 0) {
      this.trail.delete(id);
      return 0;
    }
    let sum = 0;
    for (const e of q) sum += e.rad;
    return (sum * 1000) / REST_WINDOW_MS;
  }

  /** ⚠ Forget this body — called when its gesture ends. */
  clear(id: Id): void {
    this.trail.delete(id);
  }
}

/** One axis this gesture has turned about, and by how much in total. */
interface AxisTotal {
  readonly axis: Vec3;
  radians: number;
}

/**
 * ⭐⭐⭐ **WHAT ONE GESTURE HAS ASKED FOR, PER AXIS** — the only state the rule needs.
 *
 * ⚠ **PER AXIS**, which is the owner's standing choice for this mechanism and `A11`'s reasoning
 * underneath it: a corridor along each axis in which the other contributes nothing, so a
 * nearly-horizontal drag ends on a yaw multiple without its pitch being dragged to one too.
 *
 * ⛔⛔ **THE AXIS IS LATCHED ON FIRST CONTACT AND NEVER RE-READ.** A gesture's yaw axis is the
 * world vertical it was pressed against; recomputing it per frame would let a camera orbit
 * mid-drag redefine what "this rotation" was about, and the correction would then land the body
 * on a multiple of an angle measured partly about one axis and partly about another. ⚠ That is
 * the *substituted quantity* shape, and it is invisible until someone orbits mid-gesture.
 */
export class RotationTally<Id> {
  private readonly byBody = new Map<Id, Map<string, AxisTotal>>();

  /**
   * Record that this gesture turned `id` by `radians` about `axis`.
   *
   * ⚠ Zero and non-finite contributions are dropped without creating an entry — an axis the
   * gesture never actually turned about must not acquire a correction of its own.
   */
  add(id: Id, axisName: string, axis: Vec3, radians: number): void {
    if (!Number.isFinite(radians) || radians === 0) return;
    let axes = this.byBody.get(id);
    if (axes === undefined) {
      axes = new Map<string, AxisTotal>();
      this.byBody.set(id, axes);
    }
    const cur = axes.get(axisName);
    if (cur === undefined) axes.set(axisName, { axis, radians });
    else cur.radians += radians;
  }

  /** ⚠ Diagnostics and the HUD — the total turn about one axis, in radians. */
  total(id: Id, axisName: string): number {
    return this.byBody.get(id)?.get(axisName)?.radians ?? 0;
  }

  /** ⚠ Has this gesture turned this body at all? */
  touched(id: Id): boolean {
    return (this.byBody.get(id)?.size ?? 0) > 0;
  }

  /**
   * ⭐⭐⭐ **TRUNCATE EVERY AXIS BACK TO THE INCREMENT IT LAST CROSSED**, and return the
   * world-frame rotation that does it — or `null` when there is nothing to give back.
   *
   * ⛔⛔ **IT REBASES THE TALLY AS IT GOES, AND THAT IS NOT BOOKKEEPING.** After the retreat
   * the gesture really has turned the truncated amount, so the totals must say so. ⚠ Leaving
   * them at the pre-truncation value would make the NEXT truncation measure from a turn the
   * body no longer has — and since this fires every time the finger rests, a drag with three
   * pauses would drift by three remainders. ⭐ The rest of the drag then accumulates from the
   * increment, which is what makes the detents land in the same places on the way back.
   *
   * ⛔ Composed on the LEFT, axis by axis, matching every other rotation in this codebase. On
   * the right it would be the body's own frame and would turn it about the wrong axes.
   *
   * ⚠ `null` rather than an identity quaternion when every correction is negligible, so the
   * caller can tell *nothing to do* from *a retreat that happens to be tiny* — starting an
   * animation to where the body already is would still cancel whatever else was in flight.
   */
  truncate(id: Id, incrementRad: number): Quat | null {
    const axes = this.byBody.get(id);
    if (axes === undefined || !(incrementRad > 0)) return null;
    let q: Quat = IDENTITY;
    let any = false;
    for (const entry of axes.values()) {
      const c = truncateCorrection(entry.radians, incrementRad);
      // ⚠ A microradian is not a retreat. The floor is well under a tenth of a degree, so it
      // cannot swallow anything a hand could see, and it stops float dust from starting an
      // animation after a gesture that ended exactly on an increment.
      if (Math.abs(c) < 1e-6) continue;
      q = qmul(qFromAxisAngle(entry.axis, c), q);
      entry.radians += c;
      any = true;
    }
    return any ? q : null;
  }

  /**
   * ⭐ Forget this body's gesture.
   *
   * ⚠ Called when the gesture ENDS, after the correction has been read. A tally that outlived
   * its gesture would make the NEXT one's correction a function of a turn nobody remembers
   * making — the same reason `A11`'s anchor is re-laid at each press.
   */
  clear(id: Id): void {
    this.byBody.delete(id);
  }
}

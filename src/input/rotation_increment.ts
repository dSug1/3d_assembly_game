/**
 * ⭐⭐⭐ **THE BODY IS ALWAYS ON AN INCREMENT. IT NEVER SITS BETWEEN TWO, SO IT NEVER COMES
 * BACK.**
 *
 * The owner, 2026-09-22, rejecting the third formulation:
 *
 * > *"the object rotates then rotates back in the reverse direction to snap the increment. This
 * > is not what I want: I want the object to stop to an increment and not rotate further if the
 * > delta position input becomes too weak."*
 *
 * ⛔⛔⛔ **FOUR FORMULATIONS, AND EACH ONE FAILED FOR A REASON THE NEXT HAD TO KEEP.** They are
 * kept here because the shape of the answer is only visible against them:
 *
 * 1. **Quantise the turn as it happens, playing every increment as its own slerped step.**
 *    ⛔ The body could only move as fast as the queue drained, so a brisk drag outran it —
 *    *"it creates too much lag in the rotation vs. the finger movement"*.
 * 2. **Rotate freely; round to the nearest multiple at the RELEASE.** ⛔ Rounding carried the
 *    body FORWARD, past where the finger ever took it.
 * 3. **Rotate freely; truncate back to the last increment when the finger rests.** ⛔ The body
 *    *"rotates then rotates back in the reverse direction"* — a correction is a reversal,
 *    however short, and a reversal is the thing a hand objects to.
 * 4. ✅ **Never leave an increment in the first place.**
 *
 * ⭐⭐ **THE INSIGHT IS THAT 1–3 ALL LET THE BODY REACH A POSE IT WAS NOT ALLOWED TO HOLD**, and
 * then argued about how to get it back. ⛔ If the pose is quantised at every instant there is
 * nothing to get back FROM: the body advances a whole increment when the demand crosses a
 * boundary, and otherwise holds exactly where it is. A weak input crosses nothing, so *"stop to
 * an increment and not rotate further"* is not a rule that has to fire — it is the default.
 *
 * ⭐⭐⭐ **AND IT IS NOT FORMULATION 1 AGAIN, WHICH IS THE THING TO UNDERSTAND BEFORE EDITING
 * THIS FILE.** That one queued the increments and played them in order, so its backlog grew
 * whenever the hand outran the animation. This one asks a different question every frame —
 * *which increment is the finger in NOW* — and goes straight there, skipping any number of
 * intermediates. ⚠ A backlog is unrepresentable: there is one target and it is always current.
 * ⭐ `METHOD`: *when a rule needs a WINDOW to decide, suspect the QUESTION.*
 *
 * ⚠ **WHAT IT COSTS, STATED**: the body advances in visible steps instead of tracking the
 * finger continuously. That is inherent to stopping on an increment, not a tuning failure — and
 * it is what a detent is.
 *
 * ⛔ ENGINE-FREE, and the decision lives here rather than in `render/scene.ts`: the binding
 * lesson of 2026-09-19 is that *a rule written in `scene.ts` is a rule nothing can interrogate*.
 */
import {
  IDENTITY,
  qAngle,
  qFromAxisAngle,
  qSlerp,
  qmul,
  type Quat,
  type Vec3,
} from "../core/vec";

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

/** One axis this gesture has turned about: what was asked for, and what has been given. */
interface AxisTotal {
  readonly axis: Vec3;
  /** Everything the gesture has demanded about this axis, unquantised. */
  demanded: number;
  /**
   * ⛔ What the body has actually been turned, which is always a whole number of increments.
   * ⚠ It only ever moves TOWARD `demanded`, never past it and never back.
   */
  applied: number;
}

/**
 * ⭐⭐⭐ **WHAT THE GESTURE HAS ASKED FOR, AND WHAT THE BODY HAS BEEN GIVEN** — per axis.
 *
 * ⚠ **PER AXIS**, which is the owner's standing choice for this mechanism and `A11`'s reasoning
 * underneath it: a corridor along each axis in which the other contributes nothing, so a
 * nearly-horizontal drag advances the yaw's detents without dragging the pitch through its own.
 *
 * ⛔⛔ **THE AXIS IS LATCHED ON FIRST CONTACT AND NEVER RE-READ.** A camera orbit mid-drag would
 * otherwise redefine what *this rotation* was about, and the increments would be counted partly
 * about one axis and partly about another. ⚠ Invisible until someone orbits mid-gesture.
 */
export class RotationTally<Id> {
  private readonly byBody = new Map<Id, Map<string, AxisTotal>>();

  /**
   * Record that this gesture has now asked for `radians` more about `axis`.
   *
   * ⚠ Zero and non-finite contributions are dropped without creating an entry — an axis the
   * gesture never turned about must not acquire detents of its own.
   */
  add(id: Id, axisName: string, axis: Vec3, radians: number): void {
    if (!Number.isFinite(radians) || radians === 0) return;
    let axes = this.byBody.get(id);
    if (axes === undefined) {
      axes = new Map<string, AxisTotal>();
      this.byBody.set(id, axes);
    }
    const cur = axes.get(axisName);
    if (cur === undefined) axes.set(axisName, { axis, demanded: radians, applied: 0 });
    else cur.demanded += radians;
  }

  /** ⚠ Diagnostics and the HUD — what has been demanded about one axis, in radians. */
  demanded(id: Id, axisName: string): number {
    return this.byBody.get(id)?.get(axisName)?.demanded ?? 0;
  }

  /** ⚠ Diagnostics and the HUD — what the body has actually been turned about one axis. */
  applied(id: Id, axisName: string): number {
    return this.byBody.get(id)?.get(axisName)?.applied ?? 0;
  }

  /** ⚠ Has this gesture turned this body at all? */
  touched(id: Id): boolean {
    return (this.byBody.get(id)?.size ?? 0) > 0;
  }

  /**
   * ⭐⭐⭐ **THE WORLD ROTATION THAT BRINGS THE BODY TO THE INCREMENT THE FINGER IS IN NOW** —
   * or `null` when it is already there.
   *
   * ⛔⛔ **`Math.trunc`, WHICH IS WHAT MAKES IT INCAPABLE OF OVERSHOOTING.** The target is the
   * last boundary the demand has actually CROSSED, so it can never exceed the demand and the
   * step is never a reversal. ⚠ `Math.round` would advance at the halfway point — carrying the
   * body past where the finger has been, which is formulation 2's defect. `Math.floor` would
   * break the negative direction, sending −23° to −25°: *an invariant tested on one axis is not
   * tested*, one sign over.
   *
   * ⭐⭐ **IT MAY JUMP SEVERAL INCREMENTS AT ONCE, AND THAT IS THE POINT.** A fast drag whose
   * demand has crossed four boundaries since the last frame advances four — in one step, not
   * four queued ones. ⛔ That is the whole difference from formulation 1, whose backlog was the
   * lag the owner rejected. There is one target here and it is always current.
   *
   * ⚠ `null` rather than an identity quaternion when nothing has been crossed, so the caller
   * can tell *nothing to do* from *a step that happens to be small* — starting an animation to
   * where the body already is would still cancel whatever else was in flight.
   */
  advance(id: Id, incrementRad: number): Quat | null {
    const axes = this.byBody.get(id);
    if (axes === undefined) return null;
    if (!Number.isFinite(incrementRad) || incrementRad <= 0) return null;
    let q: Quat = IDENTITY;
    let any = false;
    for (const entry of axes.values()) {
      const target = Math.trunc(entry.demanded / incrementRad) * incrementRad;
      const step = target - entry.applied;
      // ⚠ A microradian is not a detent. The floor is far under a tenth of a degree, so it can
      // never swallow a step a hand could see, and it stops float dust from starting animations.
      if (Math.abs(step) < 1e-6) continue;
      q = qmul(qFromAxisAngle(entry.axis, step), q);
      entry.applied = target;
      any = true;
    }
    return any ? q : null;
  }

  /**
   * ⭐ Forget this body's gesture.
   *
   * ⚠ Called when the gesture ENDS. A tally that outlived its gesture would make the next one's
   * detents fall in places decided by a turn nobody remembers making — the same reason `A11`'s
   * anchor is re-laid at each press.
   */
  clear(id: Id): void {
    this.byBody.delete(id);
  }
}

/**
 * ⭐⭐⭐ **HOW MUCH OF THE REMAINING DISTANCE TO COVER THIS FRAME** — an exponential approach.
 *
 * `1 − exp(−dt/τ)`, which is the standard smooth-damp and has three properties this needs:
 *
 * 1. ⭐⭐ **FRAME-RATE INDEPENDENT.** A bare `lerp(pose, target, 0.2)` per frame moves twice as
 *    far per second at 120 Hz as at 60. ⚠ This project ships on tablets whose frame rate is not
 *    a constant, and a feel that changes with it is not a feel anyone can tune.
 * 2. ⭐⭐⭐ **VELOCITY-CONTINUOUS, WHICH IS THE WHOLE REASON IT IS HERE.** The speed depends only
 *    on how far away the target is, so **changing the target mid-flight costs nothing** — there
 *    is no clock to restart and no curve to re-enter.
 * 3. ⭐ **A FARTHER TARGET MOVES FASTER**, in proportion. Four increments are covered about four
 *    times as fast as one, which is what a hand expects and what the previous animation got
 *    exactly backwards.
 *
 * ⛔⛔⛔ **THE DEFECT THIS REPLACES, device-reported 2026-09-22**: *"when I set increment to 45
 * degree and I rotate by one increment, the sway of other objects is bigger than if I move by
 * two or more increments. why?"* ⚠ The sway was telling the truth. The step used to be an
 * `easeInOut` over a fixed window, whose velocity is **zero at both ends**; every newly crossed
 * increment RESTARTED that curve at `t = 0`, so a body crossing several detents was relaunched
 * from a standstill again and again and never reached the fast middle. ⭐ One increment played
 * the whole curve and peaked near 525°/s; several kept stalling and crawled. ⛔ So *more*
 * increments moved the body *less*, and the sway — which scales with measured °/s — reported it
 * faithfully. ⭐⭐ `METHOD`: *a second symptom that contradicts your theory is worth more than a
 * third that confirms it.*
 *
 * @returns a fraction in `[0, 1]`; `0` when there is nothing to do or the input is unusable.
 */
export function approachFraction(dtMs: number, tauMs: number): number {
  if (!Number.isFinite(dtMs) || dtMs <= 0) return 0;
  // ⛔ A zero or unusable time constant means *arrive at once*, which is what `0` already means
  // for the camera reset and the alignment snap. ⚠ Not a refusal: it is a legitimate end of the
  // slider, and returning 0 instead would freeze the body short of its own detent.
  if (!Number.isFinite(tauMs) || tauMs <= 0) return 1;
  return 1 - Math.exp(-dtMs / tauMs);
}

/** ⚠ Within this of the target, the body is put ON it and the follower forgets it. */
const ARRIVED_RAD = 1e-4;

/**
 * ⭐⭐⭐ **THE BODY'S CHASE TOWARD ITS CURRENT DETENT** — one target per body, no clock.
 *
 * ⛔⛔ **IT REPLACED AN `AlignSnaps` FLIGHT, AND THE DIFFERENCE IS THE ABSENCE OF `t0`.** A
 * fixed-window animation has to be restarted to be retargeted, and restarting an eased curve
 * throws away the speed the body had. ⚠ Here the target is simply a different quaternion on the
 * next frame; nothing else changes, so nothing stalls.
 *
 * ⭐ It also cannot lag: the target is always the increment the finger is in, so a fast drag
 * that crosses four boundaries sets a target four increments away and the body covers it about
 * four times as fast. There is no queue to drain.
 */
export class RotationFollower<Id> {
  private readonly target = new Map<Id, Quat>();

  /**
   * Compose a world-frame `step` onto this body's target, seeding from `current` if the body
   * was not already chasing one.
   *
   * ⛔ Composed on the LEFT, matching every other rotation in this codebase — on the right it
   * would be the body's own frame and would turn it about the wrong axes.
   */
  push(id: Id, step: Quat, current: Quat): void {
    this.target.set(id, qmul(step, this.target.get(id) ?? current));
  }

  /** ⚠ Is this body chasing a detent? */
  has(id: Id): boolean {
    return this.target.has(id);
  }

  /** ⚠ Diagnostics and the HUD. */
  get size(): number {
    return this.target.size;
  }

  /** ⭐ Drop this body's chase where it stands — for every rule that takes the body away. */
  cancel(id: Id): void {
    this.target.delete(id);
  }

  /**
   * ⭐⭐ Advance every body one frame, and report the pose each must be given.
   *
   * ⛔ **IT LANDS EXACTLY.** An exponential never mathematically arrives, so within
   * `ARRIVED_RAD` the body is put ON the target and the entry is forgotten. ⚠ Without that the
   * follower would run for ever at a micro-radian a frame, and `has()` would never go false —
   * which other rules read to decide whether this mechanism is busy.
   */
  advance(
    dtMs: number,
    tauMs: number,
    current: (id: Id) => Quat | null,
    isAlive: (id: Id) => boolean = () => true,
  ): { id: Id; orientation: Quat; done: boolean }[] {
    const out: { id: Id; orientation: Quat; done: boolean }[] = [];
    // ⚠ Snapshot the keys: landing deletes, and deleting from a Map while iterating it is the
    // pattern that silently skips entries.
    for (const id of [...this.target.keys()]) {
      if (!isAlive(id)) {
        this.target.delete(id);
        continue;
      }
      const to = this.target.get(id);
      const from = current(id);
      if (to === undefined || from === null) continue;
      if (qAngle(qmul(to, [from[0], -from[1], -from[2], -from[3]])) <= ARRIVED_RAD) {
        this.target.delete(id);
        out.push({ id, orientation: to, done: true });
        continue;
      }
      out.push({ id, orientation: qSlerp(from, to, approachFraction(dtMs, tauMs)), done: false });
    }
    return out;
  }
}

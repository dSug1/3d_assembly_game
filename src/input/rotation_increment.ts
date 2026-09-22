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

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
 * ⭐⭐⭐ **THE MODULO, AS A CORRECTION**: the signed angle to ADD to `totalRad` so the gesture's
 * whole turn about this axis lands on the nearest multiple of `incrementRad`.
 *
 * ⛔ **NEAREST, NOT DOWNWARD.** `Math.round`, not `Math.floor`: a hand that has turned 44° with
 * a 45° increment means 45, and flooring would throw the turn away and spring the body back to
 * zero. ⚠ The correction is therefore at most half an increment in magnitude, which is also
 * what keeps the final slerp short enough to read as a settle rather than as a second gesture.
 *
 * ⭐ It is the correction and not the target, deliberately: the caller composes it as a WORLD
 * rotation onto whatever pose the body has actually reached, so nothing here needs to know the
 * body's orientation — and a correction of zero is exactly zero, not a slerp to where it
 * already is.
 */
export function snapCorrection(totalRad: number, incrementRad: number): number {
  // ⛔⛔ `Number.isFinite` ON THE INCREMENT TOO, AND A VECTOR CAUGHT ITS ABSENCE. `> 0` admits
  // `Infinity`, and `Math.round(x / Infinity) * Infinity` is `0 * Infinity` — **NaN**, which
  // would then be composed into a quaternion and written to the body's orientation, where it
  // never washes out. ⚠ `METHOD`: *a degenerate input must return null, never a default* —
  // and the degenerate input here is the one that looks most like a large legal value.
  if (!Number.isFinite(totalRad) || !Number.isFinite(incrementRad) || incrementRad <= 0) {
    return 0;
  }
  return Math.round(totalRad / incrementRad) * incrementRad - totalRad;
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
   * ⭐⭐ The world-frame rotation that lands **every** axis this gesture drove on a multiple of
   * `incrementRad` — or `null` when there is nothing worth animating.
   *
   * ⛔ Composed on the LEFT, axis by axis, matching every other rotation in this codebase. On
   * the right it would be the body's own frame and would turn it about the wrong axes: the sign
   * error with no symptom at the identity.
   *
   * ⚠ `null` rather than an identity quaternion when every correction is negligible, so the
   * caller can tell *nothing to do* from *a settle that happens to be tiny* — a slerp to where
   * the body already is would still cost a frame of animation and would still cancel whatever
   * else was in flight.
   */
  correction(id: Id, incrementRad: number): Quat | null {
    const axes = this.byBody.get(id);
    if (axes === undefined || !(incrementRad > 0)) return null;
    let q: Quat = IDENTITY;
    let any = false;
    for (const { axis, radians } of axes.values()) {
      const c = snapCorrection(radians, incrementRad);
      // ⚠ A microradian is not a settle. The floor is well under a tenth of a degree, so it
      // can never swallow a correction a hand could see, and it stops float dust from
      // starting an animation after a gesture that happened to end on a multiple exactly.
      if (Math.abs(c) < 1e-6) continue;
      q = qmul(qFromAxisAngle(axis, c), q);
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

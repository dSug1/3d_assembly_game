/**
 * §1.3 — THE GESTURE RECOGNIZER. One per touchpoint, with an explicit state machine
 * and A SINGLE COMMIT POINT.
 *
 * ⭐⭐ THIS IS WHAT MAKES THE DRAG RULES AND THE FLICK RULES SEPARABLE. Before it,
 * 2bis / 2ter / 2quater / 2quinte / 6bis / 6quater were independent per-frame
 * predicates, and since EVERY drag ends in a release, every drag could satisfy a
 * flick rule. They competed for the same gesture and the winner was arbitrary.
 *
 *     PRESSED ──(travel > moveEnterDistance)──> COMMITTED_CONTINUOUS ──> RELEASED
 *     PRESSED ──(release before that)──────────> TAP | DOUBLE_TAP | HOLD
 *
 * ⭐ PROVISIONAL MOTION AND ROLLBACK. The pose is snapshotted at press. While
 * COMMITTED_CONTINUOUS the continuous rule is applied LIVE and PROVISIONALLY. At
 * release the flick test runs: pass ⇒ the pose is RESTORED to the snapshot and a
 * discrete rule fires instead; fail ⇒ the provisional motion is kept and is final.
 *
 * ⛔ THE POSE TYPE IS OPAQUE ON PURPOSE. `3D1` has not built the object model yet,
 * and rollback does not need it — it needs snapshot/restore and nothing else. A
 * concrete pose type here would couple the recognizer to a half-built model, and
 * `tests/boundary.test.ts` would not catch that: it guards engine imports, not
 * premature coupling.
 *
 * ⚠ THE SNAPSHOT IS ALSO `IN6`'s UNDO ENTRY (§6: push before every discrete snap and
 * before every committed drag). Same object, different owner. Not wired here.
 *
 * ⛔ AND THE COMMIT THRESHOLD IS `MotionTracker`'s OWN `MOVING` TRANSITION, not a
 * second comparison against `moveEnterDistance`. One constant, one place — and more
 * than that, one IMPLEMENTATION: a re-derived commit test is a second opinion that
 * can silently disagree with the first.
 */
import { detectFlick, terminalSpeedPxPerS, trimBuffer, type Flick } from "./flick";
import type { GestureConfig } from "./gestureConfig";
import { MotionTracker, type MotionState, type Sample } from "./motion";
import { mmToPx, pxToMm } from "../core/units";

export type Phase = "PRESSED" | "COMMITTED_CONTINUOUS" | "RELEASED";

export type ReleaseKind =
  /** Released without committing, within `tapMaxDuration`. */
  | "TAP"
  /** A second TAP inside `doubleTapWindow` and `doubleTapSlop`. Rule 2septies. */
  | "DOUBLE_TAP"
  /** Released without committing, but held too long to be a tap. ⚠ Fires nothing. */
  | "HOLD"
  /** Committed, and the flick test passed at release. The pose was rolled back. */
  | "FLICK"
  /** Committed, flick test failed: the provisional motion stands. */
  | "CONTINUOUS_KEPT";

// ⛔ `ROLL_KEPT` WAS REMOVED FROM THIS UNION ON 2026-09-16. `A12` retired the circular roll,
// and leaving the kind producible let the detector **veto the flick test** — see `release`.
// ⚠ An unreachable variant is a trap, so it is deleted rather than documented as impossible.

/**
 * The discrete rule the release-time priority ladder selects. Exactly one may fire.
 * `NONE` means the provisional continuous motion stands.
 */
export type DiscreteRule = "2septies" | "6quater" | "2ter" | "2quater" | "NONE";

/**
 * What the ladder needs from the scene, as PLAIN DATA.
 *
 * ⛔ Supplied by the caller, never computed here: `AxisBtwFaces` needs the camera
 * projection, and this layer imports no engine. That is also why the directedness
 * arrives as a NUMBER the caller measured, not as a scene object to interrogate.
 */
export interface ReleaseContext {
  /** §6quater: two objects selected AND the other touchpoint is STATIONARY. */
  readonly mateContextAvailable: boolean;
  /**
   * §6quater directedness: the same purity ratio as §1.3, measured against the
   * SCREEN PROJECTION of `AxisBtwFaces`. `null` when there is no such axis.
   */
  readonly mateDirectionPurity: number | null;
  /** §2ter / §2quater: exactly one object is selected. */
  readonly singleObjectSelected: boolean;
}

export const NO_RELEASE_CONTEXT: ReleaseContext = {
  mateContextAvailable: false,
  mateDirectionPurity: null,
  singleObjectSelected: false,
};

export interface ReleaseVerdict {
  readonly kind: ReleaseKind;
  /** Only for `kind === "FLICK"`. */
  readonly flick: Flick | null;
  /** True when the pose was restored to the press snapshot. */
  readonly rolledBack: boolean;
  /** The one discrete rule permitted to fire. */
  readonly rule: DiscreteRule;
  /** Press → release, ms. */
  readonly durationMs: number;
  /**
   * The lift speed the flick test ACTUALLY MEASURED, mm/s — reported whether or not
   * it passed. ⭐ Without it, "the flick did not fire" is unfalsifiable on a device:
   * you cannot tell a finger that was too slow from an estimator that read zero, and
   * that ambiguity is exactly what made the first rollback build feel inconsistent.
   */
  readonly liftSpeedMmPerS: number;
}

/** Snapshot/restore for whatever the caller calls a pose. See the header. */

export interface PosePort<P> {
  snapshot(): P;
  restore(pose: P): void;
}

/**
 * §1.3 RELEASE-TIME PRIORITY. Exactly one discrete rule may fire:
 *
 *     6quater (mate flick, two-object context)
 *       > 2ter / 2quater (axis flick, single-object context)
 *       > none (keep the provisional continuous motion)
 *
 * ⭐ Pure, and exported, so the ladder is testable without a gesture at all.
 */
export function resolveDiscreteRule(
  kind: ReleaseKind,
  flick: Flick | null,
  ctx: ReleaseContext,
  cfg: GestureConfig,
): DiscreteRule {
  if (kind === "DOUBLE_TAP") return "2septies"; // §1.4 eviction; no flick involved
  if (kind !== "FLICK" || !flick) return "NONE";

  if (
    ctx.mateContextAvailable &&
    ctx.mateDirectionPurity !== null &&
    ctx.mateDirectionPurity >= cfg.mateDirectionPurity
  ) {
    return "6quater";
  }

  // ⚠ A mate context whose directedness FAILS falls through to the single-object
  // rules — it does not swallow the gesture. Otherwise a user with two objects
  // selected could never set a gravity anchor.
  if (!ctx.singleObjectSelected) return "NONE";
  // §2ter is the VERTICAL flick (gravity); §2quater the HORIZONTAL (world axis).
  return flick.axis === "VERTICAL" ? "2ter" : "2quater";
}

/**
 * Double-tap memory.
 *
 * ⛔ IT CANNOT LIVE IN THE RECOGNIZER. Two taps are two different pointer ids, so
 * the recognizer that saw the first is already gone when the second presses. One of
 * these is shared across every touchpoint.
 */
export class TapHistory {
  private last: Sample | null = null;

  constructor(private readonly cfg: GestureConfig) {}

  reset(): void {
    this.last = null;
  }

  /**
   * ⚠ Call with the PRESS sample of the tap and the time it was released: the
   * window is measured RELEASE-to-PRESS, and the slop between the two PRESS points.
   */
  record(press: Sample, releaseT: number): "TAP" | "DOUBLE_TAP" {
    const paired = this.pairsWithLast(press);
    this.last = { x: press.x, y: press.y, t: releaseT };
    if (paired) {
      // ⭐ Clear, so a third tap is a fresh TAP and not a second DOUBLE_TAP.
      this.last = null;
      return "DOUBLE_TAP";
    }
    return "TAP";
  }

  /**
   * ⭐⭐⭐ **WOULD THIS PRESS COMPLETE A DOUBLE TAP — asked NOW, on the way down?** (`A22`)
   *
   * > *"why a single tap followed by a rapid press (the equivalent of double tap where the
   * > final release is not done) doesn't trigger a switch to orange?"* — the owner, 2026-09-19
   *
   * ⛔⛔ **BECAUSE THE QUESTION WAS ONLY EVER ASKED AT THE RELEASE.** `record` is called with
   * the release time, so a second touch that is **pressed and held** never asked it at all —
   * and `D55` had moved the ALIGN to the press while leaving the mode SWITCH behind on the
   * release. ⚠ That is `D55`'s own rule applied to one half of the gesture and not the other.
   *
   * ⭐⭐ **IT IS A PEEK, AND IT MUTATES NOTHING.** The release still runs `record`, which is
   * what actually consumes the pair and clears the memory — two writers of one fact is the
   * shape this project forbids. ⛔ And it shares `pairsWithLast` with `record` rather than
   * restating the window and the slop, so the press and the release **cannot disagree** about
   * what a double tap is.
   *
   * ⚠ The window is measured RELEASE-to-PRESS, so holding the second touch down for a long
   * time does not change the answer: `record` will still say `DOUBLE_TAP` when it finally
   * lifts, exactly as this said when it landed.
   */
  wouldPair(press: Sample): boolean {
    return this.pairsWithLast(press);
  }

  /** ⛔ The one definition of *these two taps are a pair*. Shared, so it cannot drift. */
  private pairsWithLast(press: Sample): boolean {
    const prev = this.last;
    if (!prev) return false;
    const gap = press.t - prev.t;
    const apart = Math.hypot(press.x - prev.x, press.y - prev.y);
    return gap <= this.cfg.doubleTapWindow && apart <= mmToPx(this.cfg.doubleTapSlop);
  }
}

export class Recognizer<P> {
  private phase: Phase = "PRESSED";
  private readonly motion: MotionTracker;
  private buffer: Sample[] = [];
  private pressSample: Sample | null = null;
  private snapshot: P | null = null;

  constructor(
    private readonly cfg: GestureConfig,
    private readonly pose: PosePort<P>,
    private readonly taps: TapHistory,
  ) {
    this.motion = new MotionTracker(cfg);
  }

  /**
   * ⭐⭐ THE POSE AS IT WAS AT THE PRESS — `§6`'s UNDO ENTRY (`IN6`), and since the flick
   * rollback was retired (2026-09-16) it is the snapshot's ONLY owner.
   * ⛔ Exposed rather than left private: a field written and never read is dead weight the
   * compiler is right to flag, and the honest fix is to name the consumer that wants it.
   * ⚠ `null` before the press, and never restored by the recognizer itself any more.
   */
  get pressSnapshot(): P | null {
    return this.snapshot;
  }

  get currentPhase(): Phase {
    return this.phase;
  }

  /**
   * ⭐⭐ ADVANCE THE MOTION CLOCK WITHOUT A SAMPLE — call it every frame while this
   * touchpoint is down. ⛔ A still finger emits no `pointermove`, so without this the
   * motion state freezes at `MOVING` and never comes back. See `MotionTracker.tick`.
   * ⚠ It touches the motion state ONLY: no roll, no buffer, no phase. A tick is not an
   * event and must not be mistaken for one by anything downstream.
   */
  tick(nowMs: number): void {
    this.motion.tick(nowMs);
  }

  /**
   * ⭐⭐ THE DEADBANDED TRAVEL from the most recent sample, CSS pixels (A11).
   *
   * ⛔⛔ EVERY CONTINUOUS RULE MUST CONSUME THIS, never `s.x - prev.x`. The raw delta
   * carries the measured 0.761 mm of pointer noise on every sample, which is what turned a
   * held object while nobody was moving. ⭐ The deadband is applied ONCE, in §1.1, so the
   * rules cannot disagree about how much of a wobble counts.
   */
  get step(): { readonly dx: number; readonly dy: number } {
    return this.motion.step;
  }

  /**
   * ⭐⭐⭐ **THE FINGER'S SPEED RIGHT NOW, mm/s — WINDOWED, never a one-sample rate.**
   *
   * ⛔⛔ IT IS `terminalSpeedPxPerS`, THE SAME ESTIMATOR THE FLICK USES, and reusing it is the
   * whole point: a second definition of *how fast is this finger* would be free to disagree with
   * the one every other rule is judged by — and this project has the scar. §1.1 estimated speed
   * over **one sample pair**, so with the measured 0.761 mm of pointer noise a resting finger
   * read ~95 mm/s and `STATIONARY` was **unreachable for any real finger**, silently, from the
   * day the noise was measured. ⭐ `METHOD`'s mistake shape 1: *a rate estimated over too short
   * a baseline.*
   *
   * ⚠ `trimBuffer` first, so the window is the flick's own and not "whatever samples happen to
   * be in memory" — which would make the estimate depend on how long the gesture has run.
   */
  get speedMmPerS(): number {
    return pxToMm(terminalSpeedPxPerS(trimBuffer(this.buffer, this.cfg), this.cfg));
  }

  /**
   * ⭐⭐ **THE SPEED AS OF `nowMs`**, zero once this finger has been quiet for one window.
   * ⛔ The getter above ends its window at the LAST SAMPLE — correct at a release, and stale for
   * anything asking mid-gesture while nothing arrives (defect 70).
   */
  speedMmPerSAt(nowMs: number): number {
    return pxToMm(terminalSpeedPxPerS(trimBuffer(this.buffer, this.cfg, nowMs), this.cfg));
  }

  get motionState(): MotionState {
    return this.motion.current;
  }




  press(s: Sample): void {
    this.phase = "PRESSED";
    this.buffer = [s];
    this.pressSample = s;
    this.motion.reset();
    this.motion.push(s);
    // §1.3: "On PRESSED, the object's pose is snapshotted."
    this.snapshot = this.pose.snapshot();
  }

  /**
   * Feed a move sample. The caller applies the continuous rule for this touchpoint
   * on every frame the returned phase is `COMMITTED_CONTINUOUS` — provisionally.
   */
  move(s: Sample): Phase {
    if (this.phase === "RELEASED") return this.phase;
    this.buffer.push(s);
    this.buffer = trimBuffer(this.buffer, this.cfg);
    const motion = this.motion.push(s);

    if (this.phase === "PRESSED" && motion === "MOVING") {
      this.phase = "COMMITTED_CONTINUOUS";
      // ⛔ A drag between two taps is not a double-tap. Break the chain at the
      // commit point, which is the first moment we know this is not a tap.
      this.taps.reset();
    }
    // ⛔ COMMITTED_CONTINUOUS IS ONE-WAY until release. Returning to STATIONARY
    // mid-drag must not un-commit: the pose has already moved provisionally, and
    // a rule that switched back would strand it half-applied.
    if (this.phase === "COMMITTED_CONTINUOUS") {
      // ⛔⛔⛔ THE ROLL DETECTOR IS NO LONGER FED, AND THE REASON IS A DEFECT IT CAUSED.
      //
      // `A12` retired the circular roll as a one-touchpoint gesture and the detector was
      // left running — *"unused"*, the comment here said. ⚠ IT WAS NOT UNUSED: `release`
      // returned `ROLL_KEPT` whenever it committed, which **pre-empts the flick test**. A
      // hand rotating a cube sweeps arcs, so it committed routinely, and once `IN3`'s
      // 2ter/2quater went live a rotation flick pushed **nothing** — device-reported
      // 2026-09-16 as *"the face does not point up at rotation flick"* and *"no DOF
      // reduction at the first flick"*, unpredictably, because it depended on how curved
      // the drag happened to be.
      //
      // ⭐⭐ A RETIRED GESTURE THAT STILL OWNS A VERDICT IS NOT INERT. This project has now
      // met that shape three times in one day: the HUD line showing a retired quantity,
      // `secondTouchGraceMs` decayed into a slider that changed nothing, and this — the
      // worst of the three, because the other two only misinformed while this one silently
      // vetoed a live rule.
      // ⛔ `roll.ts` itself stays, with its 40 vectors: the day a circular roll comes back it
      // is what comes back. It simply is not wired to anything, and now that is TRUE.
    }
    return this.phase;
  }

  /**
   * ⭐⭐ AMENDMENT **A8** — WHEN A ROLL COMMITS, UNDO THE YAW/PITCH IT WAS MISTAKEN FOR.
   *
   * ⛔⛔ THE DEFECT THIS FIXES, FOUND BY FINGER: a circular sweep does not read as a roll
   * immediately. The detector needs `rollAngle` of arc before it will say so, and until
   * then §1.3 applies the continuous rule PROVISIONALLY — which is 2bis, yaw and pitch. So
   * the roll used to begin from a pose the user never asked for, and the result was not a
   * pure roll of the original orientation. ⚠ The owner: *"the user should want a roll from
   * the initial quaternion, especially to maintain the alignment on an axis."*
   *
   * ⭐ THE MECHANISM IS ALREADY IN THE SPEC. §1.3 defines provisional motion with rollback
   * — it simply only applied it at RELEASE, for the flick test. A roll committing mid-drag
   * is the same situation one transition earlier, and it takes the same answer.
   *
   * ⛔ IT REBASES TO THE FIT WINDOW'S START, **NOT** TO THE PRESS. A hand may drag in a
   * straight line and then begin to circle; that drag is a real yaw the user asked for, it
   * is not part of the evidence for a circle, and undoing it would be a second defect
   * wearing the first one's clothes.
   *
   * ⚠ The object therefore JUMPS at the commit — by the whole swept angle, which 2quinte
   * then applies from the rebased pose. That is not a glitch: it replaces exactly as much
   * unasked-for yaw/pitch with the roll the finger actually drew.
   */


  /**
   * ⭐⭐ ANOTHER RULE MOVED THIS OBJECT WHILE THIS TOUCHPOINT HELD IT STILL.
   *
   * ⛔⛔ A10 CREATED THIS SITUATION AND IT HAS NO PRECEDENT IN §1.3. Depth requires the
   * finger on the object to be STILL — which is, character for character, §1.3's own
   * precondition for a TAP and for a HOLD. So without this, every depth push would end in
   * a tap, and two pushes in quick succession would be a **DOUBLE-TAP**, which
   * `resolveDiscreteRule` maps to **2septies eviction**: a gesture that destroys the
   * user's constraint work, fired by a gesture that never touched a constraint.
   *
   * ⭐ The rule it follows is §1.3's own: a touchpoint whose gesture PRODUCED MOTION is
   * not a discrete gesture. It simply was not this touchpoint that supplied the motion.
   * ⚠ It does NOT commit the recognizer — nothing here rolls back, and the finger may
   * still go on to drag, roll or flick normally.
   */
  consumeAsMotion(): void {
    this.consumedFlag = true;
  }

  /** ⭐ Set by `consumeAsMotion`. See there for why a depth push must not be a tap. */
  private consumedFlag = false;

  release(s: Sample, ctx: ReleaseContext = NO_RELEASE_CONTEXT): ReleaseVerdict {
    const press = this.pressSample;
    const wasCommitted = this.phase === "COMMITTED_CONTINUOUS";
    this.buffer.push(s);
    this.phase = "RELEASED";
    const durationMs = press ? s.t - press.t : 0;
    const trimmed = trimBuffer(this.buffer, this.cfg);
    const liftSpeedMmPerS = pxToMm(terminalSpeedPxPerS(trimmed, this.cfg));

    if (!wasCommitted) {
      // Never committed: nothing moved, so there is nothing to roll back.
      // ⛔⛔ A GESTURE ANOTHER RULE CONSUMED IS NEVER A TAP. A10's depth push holds this
      // finger STILL on the object, which is exactly a tap's shape — and a DOUBLE_TAP here
      // resolves to 2septies, which evicts constraints the user never asked to lose.
      // ⚠ `HOLD` is the honest verdict: held, fired nothing, and `taps.reset()` below
      // makes sure it cannot be the first half of a double-tap either.
      const kind: ReleaseKind =
        !this.consumedFlag && press && durationMs <= this.cfg.tapMaxDuration
          ? this.taps.record(press, s.t)
          : "HOLD";
      if (kind === "HOLD") this.taps.reset();
      return {
        kind,
        flick: null,
        rolledBack: false,
        rule: resolveDiscreteRule(kind, null, ctx, this.cfg),
        durationMs,
        liftSpeedMmPerS,
      };
    }

    // ⛔⛔ §1.3's *"once roll is committed, the flick test is skipped"* IS GONE WITH THE
    // GESTURE IT PROTECTED (`A12`, and the defect above). ⚠ The old comment here said a
    // circular path *"fails the purity ratio anyway"* and that the explicit skip removed the
    // edge case *"rather than relying on that happening to hold"* — so removing the skip
    // means we now rely on exactly what that sentence distrusted.
    // ⭐ That is accepted deliberately, for two reasons: the gesture the skip existed to
    // protect no longer runs on this channel, and the case that actually matters — a
    // back-and-forth, whose every leg looks like a flick — is `A4`'s eviction shake, which
    // carries its own `suppressesFlick` for precisely this and lands with the wiring.
    // ⚠ **A DEVICE QUESTION, STATED**: can a strongly curved rotation drag now end in an
    // accidental alignment? The purity ratio is the only thing saying no.

    const flick = detectFlick(trimmed, this.cfg);
    if (!flick) {
      return {
        kind: "CONTINUOUS_KEPT",
        flick: null,
        rolledBack: false,
        rule: "NONE",
        durationMs,
        liftSpeedMmPerS,
      };
    }

    // ⛔⛔⛔ THE ROLLBACK IS GONE — OWNER, 2026-09-16, AND IT IS §1.3's ASSUMPTION THAT
    // EXPIRED, not its arithmetic.
    //
    // > *"a rotation followed by a flick was previously resetting the quaternion of the
    // > object: get rid of that if this conflicts with the alignment by flick."*
    //
    // ⭐⭐ §1.3 undid the provisional motion *"so a flick snaps from where the gesture
    // STARTED — the two never compose into a drag-then-snap the user did not ask for."*
    // ⛔ That sentence was written when a drag and a flick were **rival readings of one
    // gesture**: whichever won, the other's effect was unwanted. Two things retired it.
    // `A16` made rotation a MODE a hand chooses, so the drag is no longer a guess — it is
    // what the user asked for; and `D33` made the flick readable at the END of a drag, so
    // *drag-then-snap* became the normal gesture rather than an accident.
    //
    // ⭐⭐⭐ **A ROLLBACK IS ONLY HONEST WHEN THE MOTION IT UNDOES WAS PROVISIONAL.** Once
    // the same drag both rotates deliberately AND ends in a flick, restoring the press pose
    // throws away deliberate work — the defect the owner reported. ⚠ And the alignment
    // makes it moot: 2ter/2quater re-solve the stack from the CURRENT orientation, so the
    // constrained axis lands on its target either way and only the free DOF differs — by
    // exactly the rotation the hand performed on purpose.
    //
    // ⚠ `snapshot` STAYS and is still taken at every press: §6's undo (`IN6`) is the same
    // object with a different owner, and it is the one consumer that still wants it.
    // ⛔ `rolledBack` stays on the verdict as a permanent `false` rather than being deleted
    // — the HUD prints it, and a field that vanished would silently stop reporting.
    return {
      kind: "FLICK",
      flick,
      rolledBack: false,
      rule: resolveDiscreteRule("FLICK", flick, ctx, this.cfg),
      durationMs,
      liftSpeedMmPerS,
    };
  }
}

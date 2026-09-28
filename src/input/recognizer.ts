/**
 * §1.3 — THE GESTURE RECOGNIZER. One per touchpoint, with an explicit state machine
 * and A SINGLE COMMIT POINT.
 *
 * ⭐⭐ THIS IS WHAT MADE THE DRAG RULES AND THE FLICK RULES SEPARABLE. Before it, the
 * continuous and release-time rules were independent per-frame predicates, and since EVERY
 * drag ends in a release, every drag could satisfy a flick rule. ⛔ The flick rules
 * (2ter/2quater/6quater) are deleted since (`D110`); a committed drag now always ends KEPT.
 *
 *     PRESSED ──(MotionTracker says MOVING)──> COMMITTED_CONTINUOUS ──> RELEASED
 *     PRESSED ──(release before that)──────────> TAP | DOUBLE_TAP | HOLD
 *
 * ⭐ THE POSE IS SNAPSHOTTED AT PRESS. While COMMITTED_CONTINUOUS the continuous rule is
 * applied LIVE. ⛔ The release-time rollback (a passing flick test restored the snapshot) is
 * deleted — retired 2026-09-16, the flick itself with `D110`.
 *
 * ⛔ THE POSE TYPE IS OPAQUE ON PURPOSE. `3D1` had not built the object model yet,
 * and a snapshot does not need it — it needs snapshot/restore and nothing else. A
 * concrete pose type here would couple the recognizer to a half-built model, and
 * `tests/boundary.test.ts` would not catch that: it guards engine imports, not
 * premature coupling.
 *
 * ⚠ THE SNAPSHOT IS ALSO `IN6`'s UNDO ENTRY (§6: push before every discrete snap and
 * before every committed drag). Same object, different owner. Not wired here.
 *
 * ⛔ AND THE COMMIT THRESHOLD IS `MotionTracker`'s OWN `MOVING` TRANSITION, not a
 * second comparison of its own. ⚠ The diagram above said `moveEnterDistance` until
 * 2026-09-23 — a constant `A11` **deleted**, two lines above the sentence saying so.
 * ⭐ One constant, one place — and more
 * than that, one IMPLEMENTATION: a re-derived commit test is a second opinion that
 * can silently disagree with the first.
 */
import { terminalSpeedPxPerS, trimBuffer } from "./flick";
import type { GestureConfig } from "./gestureConfig";
import { MotionTracker, type MotionState, type Sample } from "./motion";
import { mmToPx, pxToMm } from "../core/units";

export type Phase = "PRESSED" | "COMMITTED_CONTINUOUS" | "RELEASED";

export type ReleaseKind =
  /** Released without committing, within `tapMaxDuration`. */
  | "TAP"
  /** A second TAP inside `doubleTapWindow` and `doubleTapSlop`. On a body: the undo (`D111`). */
  | "DOUBLE_TAP"
  /** Released without committing, but held too long to be a tap. ⚠ Fires nothing. */
  | "HOLD"
  /**
   * Committed: the motion stands. ⛔⛔ `"FLICK"` stood beside it until `D110` (the owner,
   * 2026-09-27: *"a flick now only resets rotation: i think we can remove this one"*) — the
   * detector, its verdict and its rules are deleted, not left dormant (defect 40: *a retired
   * gesture that still owns a verdict is not inert*).
   */
  | "CONTINUOUS_KEPT";

// ⛔ `ROLL_KEPT` WAS REMOVED FROM THIS UNION ON 2026-09-16. `A12` retired the circular roll,
// and leaving the kind producible let the detector **veto the flick test** (defect 40).
// ⚠ An unreachable variant is a trap, so it is deleted rather than documented as impossible.

export interface ReleaseVerdict {
  readonly kind: ReleaseKind;
  /** Press → release, ms. */
  readonly durationMs: number;
  /**
   * The lift speed at release, mm/s — a readout only since the flick test is deleted
   * (`D110`). ⭐ It was kept so a finger too slow and an estimator that read zero could be told
   * apart on a device.
   */
  readonly liftSpeedMmPerS: number;
}

/** Snapshot/restore for whatever the caller calls a pose. See the header. */

export interface PosePort<P> {
  snapshot(): P;
  restore(pose: P): void;
}

// ⛔⛔ `resolveDiscreteRule`, `DiscreteRule` and `ReleaseVerdict.rule` / `.rolledBack` are DELETED (audit
// 2026-09-27): the flick rules went with `D110`, the double-tap eviction ("2septies") with `D111`'s undo,
// and the rollback with 2026-09-16 — what was left only re-labelled the `kind`, or was always `false`.
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
   * (History: the press-time align is deleted — the TAP aligns since `D119` — and so is the
   * orange FOLLOW, `D106`; the peek still serves `D68`'s revert.)
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
    return (
      gap <= this.cfg.doubleTapWindow && apart <= mmToPx(this.cfg.doubleTapSlop)
    );
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
   * ⛔⛔ IT IS `terminalSpeedPxPerS`, THE SAME ESTIMATOR THE LIFT SPEED USES, and reusing it is the
   * whole point: a second definition of *how fast is this finger* would be free to disagree with
   * the one every other rule is judged by — and this project has the scar. §1.1 estimated speed
   * over **one sample pair**, so with the measured 0.761 mm of pointer noise a resting finger
   * read ~95 mm/s and `STATIONARY` was **unreachable for any real finger**, silently, from the
   * day the noise was measured. ⭐ `METHOD`'s mistake shape 1: *a rate estimated over too short
   * a baseline.*
   *
   * ⚠ `trimBuffer` first, so the window is `flickWindow` and not "whatever samples happen to
   * be in memory" — which would make the estimate depend on how long the gesture has run.
   */
  get speedMmPerS(): number {
    return pxToMm(
      terminalSpeedPxPerS(trimBuffer(this.buffer, this.cfg), this.cfg),
    );
  }

  /**
   * ⭐⭐ **THE SPEED AS OF `nowMs`**, zero once this finger has been quiet for one window.
   * ⛔ The getter above ends its window at the LAST SAMPLE — correct at a release, and stale for
   * anything asking mid-gesture while nothing arrives (defect 70).
   */
  speedMmPerSAt(nowMs: number): number {
    return pxToMm(
      terminalSpeedPxPerS(trimBuffer(this.buffer, this.cfg, nowMs), this.cfg),
    );
  }

  /** ⭐ The adaptive rest window this pointer derived, ms — for the readout. */
  get restMs(): number {
    return this.motion.restMs;
  }

  /** ⭐ The measured median interval between this pointer's events, ms. */
  get gapMedianMs(): number {
    return this.motion.gapMedianMs;
  }

  get motionState(): MotionState {
    return this.motion.current;
  }

  /** ⭐ The per-axis state (`A11`) — `D137`'s hold-pinch reads the holder's with the second finger's. */
  get axes(): { readonly x: MotionState; readonly y: MotionState } {
    return this.motion.axes;
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
   * on every frame the returned phase is `COMMITTED_CONTINUOUS`.
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
    // mid-drag must not un-commit: the pose has already moved, and a rule that switched
    // back would strand it half-applied.
    // ⛔ History (defect 40): the retired circular-roll detector was once still fed here, and its
    // `ROLL_KEPT` verdict silently vetoed the flick — *a retired gesture that still owns a verdict
    // is not inert*. The detector, `roll.ts` and the flick are all deleted now.
    return this.phase;
  }

  /**
   * ⭐⭐ ANOTHER RULE MOVED THIS OBJECT WHILE THIS TOUCHPOINT HELD IT STILL.
   *
   * ⛔⛔ A10 CREATED THIS SITUATION AND IT HAS NO PRECEDENT IN §1.3. Depth requires the
   * finger on the object to be STILL — which is, character for character, §1.3's own
   * precondition for a TAP and for a HOLD. So without this, every depth push would end in
   * a tap, and two pushes in quick succession would be a **DOUBLE-TAP** — on a body, the undo
   * (`D111`; it was `2septies` eviction until then): an action fired by a gesture that never
   * asked for it.
   *
   * ⭐ The rule it follows is §1.3's own: a touchpoint whose gesture PRODUCED MOTION is
   * not a discrete gesture. It simply was not this touchpoint that supplied the motion.
   * ⚠ It does NOT commit the recognizer — nothing here rolls back, and the finger may
   * still go on to drag or roll normally.
   */
  consumeAsMotion(): void {
    this.consumedFlag = true;
  }

  /** ⭐ Set by `consumeAsMotion`. See there for why a depth push must not be a tap. */
  private consumedFlag = false;

  release(s: Sample): ReleaseVerdict {
    const press = this.pressSample;
    const wasCommitted = this.phase === "COMMITTED_CONTINUOUS";
    this.buffer.push(s);
    this.phase = "RELEASED";
    const durationMs = press ? s.t - press.t : 0;
    const trimmed = trimBuffer(this.buffer, this.cfg);
    const liftSpeedMmPerS = pxToMm(terminalSpeedPxPerS(trimmed, this.cfg));

    if (!wasCommitted) {
      // Never committed: nothing moved.
      // ⛔⛔ A GESTURE ANOTHER RULE CONSUMED IS NEVER A TAP. A second finger's drive holds this
      // finger STILL on the object, which is exactly a tap's shape — and a DOUBLE_TAP here
      // would fire the undo (`D111`) the user never asked for.
      // ⚠ `HOLD` is the honest verdict: held, fired nothing, and `taps.reset()` below
      // makes sure it cannot be the first half of a double-tap either.
      const kind: ReleaseKind =
        !this.consumedFlag && press && durationMs <= this.cfg.tapMaxDuration
          ? this.taps.record(press, s.t)
          : "HOLD";
      if (kind === "HOLD") this.taps.reset();
      return {
        kind,
        durationMs,
        liftSpeedMmPerS,
      };
    }

    // ⛔⛔ `D110`: A COMMITTED GESTURE ENDS KEPT — there is no flick test left to run.
    return {
      kind: "CONTINUOUS_KEPT",
      durationMs,
      liftSpeedMmPerS,
    };
  }
}

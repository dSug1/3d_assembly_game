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
import { RollDetector } from "./roll";
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
  | "CONTINUOUS_KEPT"
  /** Committed to roll (2quinte). §1.3: the flick test is SKIPPED. */
  | "ROLL_KEPT";

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
  /** Signed accumulated roll at release, degrees. ⭐ Positive is CLOCKWISE on screen. */
  readonly rollDeg: number;
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
    const prev = this.last;
    this.last = { x: press.x, y: press.y, t: releaseT };
    if (!prev) return "TAP";
    const gap = press.t - prev.t;
    const apart = Math.hypot(press.x - prev.x, press.y - prev.y);
    if (gap <= this.cfg.doubleTapWindow && apart <= mmToPx(this.cfg.doubleTapSlop)) {
      // ⭐ Clear, so a third tap is a fresh TAP and not a second DOUBLE_TAP.
      this.last = null;
      return "DOUBLE_TAP";
    }
    return "TAP";
  }
}

export class Recognizer<P> {
  private phase: Phase = "PRESSED";
  private readonly motion: MotionTracker;
  private readonly roll: RollDetector;
  private buffer: Sample[] = [];
  private pressSample: Sample | null = null;
  private snapshot: P | null = null;

  constructor(
    private readonly cfg: GestureConfig,
    private readonly pose: PosePort<P>,
    private readonly taps: TapHistory,
  ) {
    this.motion = new MotionTracker(cfg);
    this.roll = new RollDetector(cfg);
  }

  get currentPhase(): Phase {
    return this.phase;
  }

  get motionState(): MotionState {
    return this.motion.current;
  }

  /** ⭐ Signed, positive CLOCKWISE on screen. Read for the on-device readout. */
  get rollDeg(): number {
    return this.roll.accumulatedDeg;
  }

  get rollCommitted(): boolean {
    return this.roll.committed;
  }

  /**
   * ⭐ The 1€-filtered roll angle — what the object should actually be rotated BY.
   * `rollDeg` stays raw because the COMMIT threshold reads it and must not be lagged.
   */
  get rollSmoothedDeg(): number {
    return this.roll.smoothedDeg;
  }

  press(s: Sample): void {
    this.phase = "PRESSED";
    this.buffer = [s];
    this.pressSample = s;
    this.motion.reset();
    this.motion.push(s);
    this.roll.reset();
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
    if (this.phase === "COMMITTED_CONTINUOUS") this.roll.push(s);
    return this.phase;
  }

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
      const kind: ReleaseKind =
        press && durationMs <= this.cfg.tapMaxDuration
          ? this.taps.record(press, s.t)
          : "HOLD";
      if (kind === "HOLD") this.taps.reset();
      return {
        kind,
        flick: null,
        rolledBack: false,
        rule: resolveDiscreteRule(kind, null, ctx, this.cfg),
        rollDeg: this.roll.accumulatedDeg,
        durationMs,
        liftSpeedMmPerS,
      };
    }

    // §1.3: "Once roll is committed, the flick test is skipped for that touchpoint."
    // ⭐ A circular path fails the purity ratio anyway; the explicit skip removes
    // the edge case rather than relying on that happening to hold.
    if (this.roll.committed) {
      return {
        kind: "ROLL_KEPT",
        flick: null,
        rolledBack: false,
        rule: "NONE",
        rollDeg: this.roll.accumulatedDeg,
        durationMs,
        liftSpeedMmPerS,
      };
    }

    const flick = detectFlick(trimmed, this.cfg);
    if (!flick) {
      return {
        kind: "CONTINUOUS_KEPT",
        flick: null,
        rolledBack: false,
        rule: "NONE",
        rollDeg: this.roll.accumulatedDeg,
        durationMs,
        liftSpeedMmPerS,
      };
    }

    // ⭐⭐ THE ROLLBACK. The provisional motion is undone before the discrete rule
    // is applied, so a flick snaps from where the gesture STARTED — the two never
    // compose into a drag-then-snap the user did not ask for.
    if (this.snapshot !== null) this.pose.restore(this.snapshot);
    return {
      kind: "FLICK",
      flick,
      rolledBack: true,
      rule: resolveDiscreteRule("FLICK", flick, ctx, this.cfg),
      rollDeg: this.roll.accumulatedDeg,
      durationMs,
      liftSpeedMmPerS,
    };
  }
}

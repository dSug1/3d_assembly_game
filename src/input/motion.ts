/**
 * §1.1 — THE MOTION STATE, AS A **POSITION DEADBAND**.
 *
 * ⭐⭐⭐ THE OWNER'S MODEL, 2026-09-15, AND IT REPLACES THREE GENERATIONS OF THIS FILE:
 *
 * > *"I think there is an error in the definition of stationary: stationary should mean a
 * > deadband around the touchpoint position (independently of the time). Check how Unity
 * > defines deadband on delta position and how it catches up once delta position crosses
 * > the deadband."*
 *
 * ⭐ Unity's stick and axis deadzone processors do exactly this: input below the dead
 * radius reads as **zero**, and beyond it the value is **rescaled from zero** rather than
 * passed through — so the output leaves rest CONTINUOUSLY instead of stepping by the whole
 * dead radius the moment it is crossed. ⛔ That second half is the part everyone forgets,
 * and without it a deadband is a jump traded for a jump.
 *
 * ## The model, in full
 *
 * An ANCHOR trails the finger at exactly one dead radius. Every sample:
 *
 * * **inside the radius** → the finger is `STATIONARY` and emits **nothing**;
 * * **outside it** → emit the excess `d − band` along the direction of travel, and drag
 *   the anchor up so it trails at exactly `band` again.
 *
 * ⭐⭐ THREE PROPERTIES FALL OUT, AND EACH ONE ANSWERS A DEFECT THIS PROJECT SHIPPED:
 *
 * 1. **It is TIME-FREE.** `stillSpeed` and `stillTime` are gone. A hand reported the cost
 *    of the old time-based settle directly: *"when I switch from x/y to depth translation,
 *    even if I make ample movement with the second touchpoint finger, there is no depth
 *    translation for a while and then suddenly the depth translation is triggered."* That
 *    was ~900 ms of settle timer. It is now **one sample**.
 * 2. **Emitted travel is EXACT.** Summed over a drag it is the true travel minus one dead
 *    radius, once — not minus a radius per sample, and not with a step at the crossing.
 *    ⭐ This IS amendment A9's deadband, so `dx`/`dy` need no second one: the jitter that
 *    turned a held object while nobody moved is removed at the source, for every rule at
 *    once.
 * 3. **A slow drag survives.** Displacement ACCUMULATES against a stationary anchor, so a
 *    finger creeping at 0.3 mm per sample still covers its full distance — it simply
 *    arrives a few samples later. ⛔ A deadband that re-centres on the finger whenever it
 *    is inside the radius loses that travel completely, which is the trap in A9's dossier.
 *
 * ## ⚠ THE ONE TIME TERM THAT SURVIVES, AND EXACTLY WHY
 *
 * ⛔⛔ A PURE POSITION DEADBAND CHATTERS AT ITS OWN BOUNDARY, and it is structural rather
 * than a tuning problem: while the finger moves, the anchor is dragged to sit **exactly on
 * the boundary**. When the finger then stops, it is sitting at `d = band` — and the
 * measured 0.761 mm of pointer noise straddles that line, so roughly half of all samples
 * read "outside" and the state flickers. ⚠ A bigger radius does not help; the anchor
 * follows it out.
 *
 * ⭐ So `restConfirmMs` confirms only the TRANSITION BACK to `STATIONARY`: the finger must
 * emit nothing for that long. ⛔ It is **not** a settle timer and it is not on the path the
 * owner complained about — leaving `STATIONARY` is still instantaneous, and the emitted
 * delta never waits for it. ⚠ It is small on purpose (a tenth of the old settle), and it
 * has a slider.
 *
 * ## What this replaced, kept because each one explains the current shape
 *
 * ⛔ §1.1's own *"accumulated travel since the last STATIONARY frame"* is unusable: the
 * path length of a jittering finger is a random walk, so it grows without bound and every
 * resting touchpoint eventually reads MOVING. Measured on the first test run — a finger
 * oscillating ±0.5 px crossed a 5.7 px threshold in under half a second.
 *
 * ⛔ Then an instantaneous speed test, which could not see a SLOW PERSISTENT CREEP.
 *
 * ⛔⛔ Then a speed over ONE SAMPLE PAIR — mistake shape 1, in the file that defines
 * *moving*: `0.761 mm / 8 ms` is ~95 mm/s of apparent speed AT REST against a 6 mm/s
 * threshold, so `STATIONARY` was **unreachable for any real finger**.
 *
 * ⭐⭐ THE SHAPE REPEATS, AND IT IS THE CARRIED LESSON: **every quantity §1.1 names is
 * defined on an ideal pointer, and a real one has noise.** A displacement deadband is the
 * first formulation here that is robust by construction rather than by a threshold chosen
 * to sit above a measurement.
 */
import { mmToPx } from "../core/units";
import { validateGestureConfig, type GestureConfig } from "./gestureConfig";

export type MotionState = "STATIONARY" | "MOVING";

export interface Sample {
  /** CSS pixels. */
  readonly x: number;
  readonly y: number;
  /** Milliseconds, monotonic. */
  readonly t: number;
}

/**
 * What one sample produced: the state, and the DEADBANDED travel to act on.
 *
 * ⛔ `dx`/`dy` are what a rule must consume — never `s.x - prev.x`. They are zero inside
 * the dead radius and, outside it, the excess only. See the header.
 */
export interface MotionStep {
  readonly state: MotionState;
  /** Deadbanded travel this sample, CSS pixels. Zero while `STATIONARY`. */
  readonly dx: number;
  readonly dy: number;
}

const ZERO_STEP = { dx: 0, dy: 0 } as const;

export class MotionTracker {
  private state: MotionState = "STATIONARY";
  /**
   * The dead radius' centre. ⛔ It TRAILS the finger at exactly one radius while moving —
   * it is not the press point and not the last sample.
   */
  private anchor: Sample | null = null;
  /** When the finger last emitted nothing. `null` while it is emitting. */
  private restingSinceMs: number | null = null;
  private lastStep: { dx: number; dy: number } = ZERO_STEP;

  constructor(private readonly cfg: GestureConfig) {
    // ⭐ Every cross-tunable consistency rule lives in ONE place, and every
    // Recognizer builds one of these. See `validateGestureConfig` for the rules.
    validateGestureConfig(cfg);
  }

  get current(): MotionState {
    return this.state;
  }

  /** ⭐ The deadbanded travel from the most recent `push`. See `MotionStep`. */
  get step(): { readonly dx: number; readonly dy: number } {
    return this.lastStep;
  }

  reset(): void {
    this.state = "STATIONARY";
    this.anchor = null;
    this.restingSinceMs = null;
    this.lastStep = ZERO_STEP;
  }

  push(s: Sample): MotionState {
    this.lastStep = ZERO_STEP;
    if (this.anchor === null) {
      this.anchor = s;
      this.restingSinceMs = s.t;
      return this.state;
    }

    const ex = s.x - this.anchor.x;
    const ey = s.y - this.anchor.y;
    const d = Math.hypot(ex, ey);
    const band = mmToPx(this.cfg.motionDeadbandMm);

    if (d <= band) {
      // ⭐ Inside the dead radius: nothing happened, and the anchor does NOT move.
      // ⛔ Re-centring it here would destroy a slow drag — displacement has to be allowed
      // to ACCUMULATE against a fixed point, or a finger creeping below one radius per
      // sample would travel for ever and emit nothing.
      this.restingSinceMs ??= s.t;
      if (
        this.state === "MOVING" &&
        s.t - this.restingSinceMs >= this.cfg.restConfirmMs
      ) {
        this.state = "STATIONARY";
        // ⭐ Re-centre ON the finger at the moment rest is confirmed, so the next drag is
        // measured from where it actually came to rest — and so the boundary chatter this
        // confirmation exists to absorb cannot start again immediately.
        this.anchor = s;
      }
      return this.state;
    }

    // ⭐⭐ OUTSIDE: emit the EXCESS ONLY, along the direction of travel. `d - band` leaves
    // zero continuously, which is the half of a deadband that stops it from being a jump
    // traded for a jump.
    const over = d - band;
    const ux = ex / d;
    const uy = ey / d;
    this.lastStep = { dx: ux * over, dy: uy * over };
    // ⭐ Drag the anchor up so it trails at exactly one radius again. Summed over a whole
    // drag the emitted travel is therefore the true travel minus ONE radius — not one per
    // sample, which is what makes slow and fast drags cover the same ground.
    this.anchor = { x: s.x - ux * band, y: s.y - uy * band, t: s.t };
    this.restingSinceMs = null;
    this.state = "MOVING";
    return this.state;
  }
}

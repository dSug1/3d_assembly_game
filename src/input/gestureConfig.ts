/**
 * EVERY TUNABLE, AS PLAIN DATA. ⛔ No engine types, no imports from the renderer.
 *
 * ⭐⭐ ONE CONSTANT LIVES IN EXACTLY ONE PLACE. Carried rule (`L1`): when a tuning
 * value existed in both a debug tool and production, the two silently drifted. The
 * debug sliders must write THESE fields; nothing may keep its own copy.
 *
 * ⛔ ALL DISTANCES ARE MILLIMETRES ON THE PHYSICAL SCREEN (`core/units.ts`), never
 * pixels. All angles are DEGREES. All times are MILLISECONDS.
 *
 * ⚠ NOT ONE OF THESE NUMBERS IS MEASURED YET. They are starting points so the build
 * runs, and every one is a `MEASURE` row in the queue. Do not quote them as if they
 * were derived — the previous project's most expensive constant was borrowed from
 * another row's derivation and inherited that row's question, not just its number.
 */
export interface GestureConfig {
  // ── §1.1 motion states, hysteretic ──────────────────────────────────────
  /** mm/s below which a touchpoint counts as resting. */
  stillSpeed: number;
  /** ms it must stay there before STATIONARY latches. */
  stillTime: number;
  /** mm of accumulated travel to enter MOVING. */
  moveEnterDistance: number;
  /**
   * mm. The EXCURSION BOUND during settle candidacy: once speed drops below
   * `stillSpeed`, the finger must stay within this of where it slowed down, for
   * the whole `stillTime`, before STATIONARY latches.
   * ⛔ Must be < moveEnterDistance or the state chatters.
   * ⛔⛔ AND `stillSpeed * stillTime` must EXCEED it, or it can never bind --
   * asserted in MotionTracker's constructor. See motion.ts.
   */
  moveExitDistance: number;

  // ── §1.2 gains ──────────────────────────────────────────────────────────
  /** Metres. Translation gains scale by cameraDistance / this. */
  referenceCameraDistance: number;
  gainRotateFree: number;
  gainRotateConstrained: number;
  gainRoll: number;
  gainTranslateScreen: number;
  gainTranslateAxis: number;
  gainTranslateDepth: number;
  gainTranslateMutual: number;

  // ── §1.3 the recognizer ─────────────────────────────────────────────────
  /** ms of motion buffer the flick test reads. */
  flickWindow: number;
  /** mm/s at lift, below which it is a drag that stopped — never a flick. */
  flickLiftSpeed: number;
  /**
   * ms. The trailing window the LIFT SPEED is averaged over.
   * ⛔⛔ NOT THE LAST SAMPLE PAIR. A browser emits `pointerup` at whatever position
   * and time it likes — very often repeating the last `pointermove` coordinates —
   * and a two-sample estimator reads that as a dead stop and throws the flick away.
   * Device-confirmed as the cause of inconsistent rollback. See flick.ts.
   */
  flickLiftWindow: number;
  /** mm of travel within the window. */
  flickDistance: number;
  /** max(|dx|,|dy|) / (min(|dx|,|dy|) + eps). One ratio, no undefined wedge. */
  flickPurity: number;
  /** degrees of accumulated signed angle to commit to roll. */
  rollAngle: number;
  /** mm. Below this the path curls too tightly to be a deliberate roll. */
  rollRadiusMin: number;
  /** mm. Above this the path is too straight to be a roll at all. */
  rollRadiusMax: number;

  // ── §1.3 taps ──────────────────────────────────────────────────
  // ⭐ NOT IN THE SPEC, AND §1.4 DOES NOT WORK WITHOUT THEM. §1.4 / rule 2septies
  // make a double-tap the ONLY way a constraint is ever evicted, and §1.3's state
  // machine stops at TAP. Recorded in `Claude/10_INPUT_TOUCH/INDEX.md`.

  /**
   * ms. A press released LATER than this, having never moved, is a HOLD -- not a
   * TAP. ⛔ §1.3 bounds TAP only by distance, so without this a finger resting for
   * ten seconds and lifting is a tap, and two of those clear a constraint stack.
   */
  tapMaxDuration: number;
  /** ms from the first tap's RELEASE to the second tap's PRESS. */
  doubleTapWindow: number;
  /** mm between the two taps' press points. */
  doubleTapSlop: number;

  // ── §1.4 constraints ────────────────────────────────────────────────────
  evictOnOverflow: boolean;
  matePriorityOverAnchor: boolean;

  // ── §2 / §4 rules ───────────────────────────────────────────────────────
  /** degrees of device tilt below which the orbit ignores it. */
  tiltDeadband: number;
  /** §1: the barycentre candidate set grows as 2^N − N − 1. Cap it. */
  maxBarycenterCandidates: number;
  /** §6bis A/B. "rotated" is the spec's default; "direct" is the comparison arm. */
  axisMappingMode: "rotated" | "direct";
  /** §6quater directedness, against the screen projection of AxisBtwFaces. */
  mateDirectionPurity: number;

  // ── mate geometry ───────────────────────────────────────────────────────
  /** ⛔ NEGATIVE. A mate is anti-parallel; see core/mate_connector.ts. */
  mateFacingCos: number;
  /** Residual at which a mate breaks — metres and radians, judged separately. */
  mateBreakLinear: number;
  mateBreakAngular: number;
}

export const DEFAULT_CONFIG: GestureConfig = {
  stillSpeed: 6,
  // ⚠ MOVED 80 -> 150 by IN1, and it is NOT a measurement. `stillSpeed * stillTime`
  // must exceed `moveExitDistance` or the exit threshold can never bind: 6 mm/s x
  // 80 ms = 0.48 mm against a 0.8 mm bound made it decorative. A placeholder moved
  // to make another placeholder reachable. IN5 measures both.
  stillTime: 150,
  moveEnterDistance: 1.5,
  moveExitDistance: 0.8,

  referenceCameraDistance: 0.6,
  gainRotateFree: 1,
  gainRotateConstrained: 0.6,
  gainRoll: 1,
  gainTranslateScreen: 1,
  gainTranslateAxis: 1,
  gainTranslateDepth: 1,
  gainTranslateMutual: 0.5,

  flickWindow: 120,
  flickLiftSpeed: 250,
  // ⚠ Placeholder, like every number here. Long enough to span several pointer
  // samples at 60-120 Hz, short enough to still mean "at lift". IN5 measures it.
  flickLiftWindow: 40,
  flickDistance: 6,
  flickPurity: 2.5,
  rollAngle: 60,
  rollRadiusMin: 4,
  rollRadiusMax: 40,

  tapMaxDuration: 250,
  doubleTapWindow: 300,
  doubleTapSlop: 8,

  evictOnOverflow: false,
  matePriorityOverAnchor: false,

  tiltDeadband: 2,
  maxBarycenterCandidates: 8,
  axisMappingMode: "rotated",
  mateDirectionPurity: 2,

  mateFacingCos: -0.85,
  mateBreakLinear: 0.02,
  mateBreakAngular: 0.35,
};

/**
 * ⭐⭐ EVERY CONSISTENCY RULE BETWEEN TUNABLES, IN ONE PLACE.
 *
 * ⛔ A config can be individually plausible and jointly impossible, and when it is,
 * the threshold that cannot bind simply does nothing while `IN5` goes off and
 * measures it. `METHOD`: a guard that turns a broken state into silence is worse
 * than a failure. Each rule here depends on TWO numbers, which is exactly why no
 * single-value vector catches it.
 *
 * Called from `MotionTracker`'s constructor, which every `Recognizer` builds.
 */
export function validateGestureConfig(cfg: GestureConfig): void {
  if (cfg.moveEnterDistance <= cfg.moveExitDistance) {
    throw new Error(
      "moveEnterDistance must exceed moveExitDistance, or the motion state chatters.",
    );
  }
  // Motion held below `stillSpeed` for `stillTime` cannot cover more ground than
  // their product, so below it the exit distance is decorative in EVERY wiring.
  const reachableMm = (cfg.stillSpeed * cfg.stillTime) / 1000;
  if (reachableMm <= cfg.moveExitDistance) {
    throw new Error(
      `moveExitDistance (${cfg.moveExitDistance} mm) can never bind: motion held ` +
        `below stillSpeed (${cfg.stillSpeed} mm/s) for stillTime (${cfg.stillTime} ms) ` +
        `covers at most ${reachableMm.toFixed(3)} mm. Raise stillTime or lower moveExitDistance.`,
    );
  }
  if (cfg.flickLiftWindow > cfg.flickWindow) {
    throw new Error(
      `flickLiftWindow (${cfg.flickLiftWindow} ms) exceeds flickWindow ` +
        `(${cfg.flickWindow} ms): the lift-speed window would read samples the ` +
        "motion buffer has already discarded.",
    );
  }
}

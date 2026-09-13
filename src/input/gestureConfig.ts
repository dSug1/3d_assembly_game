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
  /** mm to fall back out. ⛔ Must be < moveEnterDistance or the state chatters. */
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
  /** mm of travel within the window. */
  flickDistance: number;
  /** max(|dx|,|dy|) / (min(|dx|,|dy|) + eps). One ratio, no undefined wedge. */
  flickPurity: number;
  /** degrees of accumulated signed angle to commit to roll. */
  rollAngle: number;
  rollRadiusMin: number;
  rollRadiusMax: number;

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
  stillTime: 80,
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
  flickDistance: 6,
  flickPurity: 2.5,
  rollAngle: 60,
  rollRadiusMin: 4,
  rollRadiusMax: 40,

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

/**
 * TUNABLE OVERRIDES FROM A URL QUERY STRING — so a number can be changed ON THE
 * DEVICE, by finger, without a rebuild.
 *
 * ⭐⭐ THIS EXISTS BECAUSE "EDIT THE CONFIG AND REDEPLOY" IS NOT A DEVICE TEST.
 * Every threshold in `gestureConfig.ts` is a placeholder awaiting `IN5`, and `IN5` is
 * a device procedure: the 1€ filter's own paper prescribes *"set beta to 0, lower
 * minCutoff until slow jitter is acceptable, then raise beta until fast movement
 * stops lagging"* — three A/B comparisons that are worthless if each one costs an
 * edit, a build and a redeploy. The owner asked, reasonably, how they were supposed
 * to A/B a filter at all.
 *
 *     http://localhost:5173/?rollAngle=45&rollFilterBeta=0
 *
 * ⛔⛔ IT DOES NOT CREATE A SECOND CONFIG. It returns ONE `GestureConfig` that
 * everything then uses, so `one constant, one place` still holds — the carried rule
 * `L1`, where a tuning value living in both a debug tool and production silently
 * drifted apart. ⭐ And `validateGestureConfig` still runs on the result, so a
 * query string cannot smuggle in a config the code would refuse from a file.
 *
 * ⚠ Engine-free and string-in: it takes a query string, never a browser object, so
 * `tests/boundary.test.ts` stays satisfied and this is testable headlessly.
 */
import { DEFAULT_CONFIG, validateGestureConfig, type GestureConfig } from "./gestureConfig";

/** What a parse produced, including what it refused and why. */
export interface ConfigOverrideResult {
  readonly config: GestureConfig;
  /** `name=value` for each override actually applied, in query order. */
  readonly applied: readonly string[];
  /**
   * Human-readable complaints. ⭐ SURFACED, NEVER SWALLOWED: a typo'd key that is
   * silently ignored means testing a value that was never in force, and then
   * recording the result as a measurement. `METHOD`: a guard that turns a mistake
   * into silence is worse than a failure.
   */
  readonly rejected: readonly string[];
}

/** The keys that may be overridden: every numeric tunable, and nothing else. */
const NUMERIC_KEYS = Object.freeze(
  (Object.keys(DEFAULT_CONFIG) as (keyof GestureConfig)[]).filter(
    (k) => typeof DEFAULT_CONFIG[k] === "number",
  ),
);

/**
 * ⛔⛔ **A MALFORMED PERCENT-ESCAPE IS DATA, NOT A CRASH.** `decodeURIComponent("%E0")`
 * throws `URIError`, and this parser runs inside the scene's constructor — so one mangled
 * character in a pasted link produced a **blank page**. ⚠ A URL is untrusted input by
 * definition: it is shortened, re-typed and rewritten by chat clients before it reaches a
 * tablet. ⭐ Undecodable text is reported verbatim instead, which is also more useful: the
 * hand can see what arrived.
 */
function safeDecode(raw: string): string | null {
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}

/**
 * ⚠ `search` is the raw query string, with or without its leading `?`.
 * Unknown keys are REPORTED, not ignored — including ones that exist in the config
 * but are not numeric, so `axisMappingMode=direct` fails loudly rather than quietly.
 *
 * ⛔⛔⛔ **AND THE RESULT IS VALIDATED HERE, WHICH IT WAS NOT UNTIL 2026-09-17.**
 * `validateGestureConfig` ran in `MotionTracker`'s constructor — and a `MotionTracker` is
 * built **per press**, not at boot. So a config-breaking URL value booted a normal-looking
 * scene and then threw on **every single press**, with an empty HUD and nothing on the glass:
 * the application was dead and said nothing. ⭐ Found by audit; the vector that covered this
 * path had *asserted the throw* and called the override *"accepted"*.
 *
 * ⭐⭐ **TWO PHASES, AND THE SECOND ONE EXISTS ONLY TO NAME THE OFFENDER.** Several rules in
 * the validator are RELATIONS between two tunables — `motionDeadbandMm` against
 * `pointerNoiseMm`, the lift window against the motion window — so a pair that is only legal
 * together must be applied together. ⛔ Validating after each key in turn would refuse the
 * first of the pair and make the order of a query string load-bearing, which is exactly the
 * kind of invisible rule this project keeps paying for. ⭐ So: try the whole set; if it
 * validates, done. Only if it does not does the one-at-a-time pass run, and then purely to say
 * WHICH value cannot stand and WHY.
 */
export function parseConfigOverrides(
  base: GestureConfig,
  search: string,
): ConfigOverrideResult {
  const applied: string[] = [];
  const rejected: string[] = [];
  const out: Record<string, unknown> = { ...base };

  /** ⭐ The syntactically good pairs, in the order they were written. */
  const candidates: { key: string; value: number }[] = [];

  const query = search.startsWith("?") ? search.slice(1) : search;
  for (const pair of query.split("&")) {
    if (pair === "") continue;
    const eq = pair.indexOf("=");
    if (eq < 0) {
      rejected.push(`${safeDecode(pair) ?? pair}: no value`);
      continue;
    }
    const key = safeDecode(pair.slice(0, eq));
    const raw = safeDecode(pair.slice(eq + 1));
    if (key === null || raw === null) {
      // ⚠ Reported with the RAW text, because the decoded form is what could not be produced.
      rejected.push(`${pair}: not valid percent-encoding`);
      continue;
    }
    // ⚠ Cache-busting and other unrelated parameters are common on this URL; they
    // are not mistakes and must not be reported as ones.
    if (key === "cb" || key === "t") continue;
    if (!(NUMERIC_KEYS as readonly string[]).includes(key)) {
      rejected.push(`${key}: not an overridable tunable`);
      continue;
    }
    const value = Number(raw);
    // ⛔ `Number("")` is 0 and `Number(" ")` is 0. An empty value is a typo, not a
    // request for zero, and zero is a meaningful setting for several of these.
    if (raw.trim() === "" || !Number.isFinite(value)) {
      rejected.push(`${key}=${raw}: not a finite number`);
      continue;
    }
    candidates.push({ key, value });
  }

  const reason = (e: unknown): string => (e instanceof Error ? e.message : String(e));

  // ⭐ PHASE 1 — the whole set at once, so tunables that are only legal TOGETHER survive.
  for (const { key, value } of candidates) out[key] = value;
  try {
    validateGestureConfig(out as unknown as GestureConfig);
    for (const { key, value } of candidates) applied.push(`${key}=${value}`);
    return { config: out as unknown as GestureConfig, applied, rejected };
  } catch {
    // ⚠ Fall through. The set is bad; phase 2 finds out which part of it.
  }

  // ⭐⭐ PHASE 2 — rebuild from the base, keeping every value that leaves the config VALID.
  // ⛔ One bad key must not cost the good ones in the same URL: the device loop A/Bs several
  // numbers at a time, and losing the whole query silently would mean a session measuring a
  // set of values that was never in force.
  for (const k of Object.keys(out)) delete out[k];
  Object.assign(out, base);
  for (const { key, value } of candidates) {
    const previous = out[key];
    out[key] = value;
    try {
      validateGestureConfig(out as unknown as GestureConfig);
      applied.push(`${key}=${value}`);
    } catch (e) {
      out[key] = previous;
      rejected.push(`${key}=${value}: ${reason(e)}`);
    }
  }

  return { config: out as unknown as GestureConfig, applied, rejected };
}

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
import { DEFAULT_CONFIG, type GestureConfig } from "./gestureConfig";

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
 * ⚠ `search` is the raw query string, with or without its leading `?`.
 * Unknown keys are REPORTED, not ignored — including ones that exist in the config
 * but are not numeric, so `axisMappingMode=direct` fails loudly rather than quietly.
 */
export function parseConfigOverrides(
  base: GestureConfig,
  search: string,
): ConfigOverrideResult {
  const applied: string[] = [];
  const rejected: string[] = [];
  const out: Record<string, unknown> = { ...base };

  const query = search.startsWith("?") ? search.slice(1) : search;
  for (const pair of query.split("&")) {
    if (pair === "") continue;
    const eq = pair.indexOf("=");
    if (eq < 0) {
      rejected.push(`${decodeURIComponent(pair)}: no value`);
      continue;
    }
    const key = decodeURIComponent(pair.slice(0, eq));
    const raw = decodeURIComponent(pair.slice(eq + 1));
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
    out[key] = value;
    applied.push(`${key}=${value}`);
  }

  return { config: out as unknown as GestureConfig, applied, rejected };
}

/**
 * GOLDEN VECTORS — URL tunable overrides.
 *
 * ⭐⭐ THIS EXISTS SO A NUMBER CAN BE A/B'd ON THE DEVICE. Every threshold in
 * `gestureConfig.ts` is an `IN5` placeholder, and `IN5` is a device procedure — the
 * 1€ paper's own tuning recipe is three A/B comparisons, which are worthless if each
 * costs an edit, a build and a redeploy.
 *
 * ⛔ The important vectors here are the REFUSALS. A typo'd key that is silently
 * ignored means a session spent testing a value that was never in force, and then
 * recording the result as a measurement.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { parseConfigOverrides } from "../src/input/config_override";
import { MotionTracker } from "../src/input/motion";

describe("URL tunable overrides", () => {
  it("applies a numeric override and reports it", () => {
    const r = parseConfigOverrides(DEFAULT_CONFIG, "?gainRotateFree=45");
    expect(r.config.gainRotateFree).toBe(45);
    expect(r.applied).toEqual(["gainRotateFree=45"]);
    expect(r.rejected).toEqual([]);
  });

  it("applies several, and leaves everything else alone", () => {
    const r = parseConfigOverrides(DEFAULT_CONFIG, "gainRotateFree=45&gainRollDrag=0");
    expect(r.config.gainRotateFree).toBe(45);
    expect(r.config.gainRollDrag).toBe(0);
    expect(r.config.gainTranslateScreen).toBe(DEFAULT_CONFIG.gainTranslateScreen);
  });

  it("⭐ ZERO is a legitimate value, not an absent one", () => {
    // ⛔ `gainRollDrag=0` is exactly the setting the 1€ paper's procedure starts
    // from. A parser that treated 0 as missing would make the recipe untestable.
    expect(parseConfigOverrides(DEFAULT_CONFIG, "?gainRollDrag=0").config.gainRollDrag).toBe(0);
  });

  it("⛔ REFUSES an unknown key, loudly", () => {
    const r = parseConfigOverrides(DEFAULT_CONFIG, "?rollAngel=45");
    expect(r.applied).toEqual([]);
    expect(r.rejected[0]).toMatch(/rollAngel/);
  });

  it("⛔ REFUSES a non-numeric tunable rather than mangling it", () => {
    const r = parseConfigOverrides(DEFAULT_CONFIG, "?axisMappingMode=direct");
    expect(r.rejected.length).toBe(1);
    expect(r.config.axisMappingMode).toBe(DEFAULT_CONFIG.axisMappingMode);
  });

  it("⛔ REFUSES an empty value — it is a typo, not a request for zero", () => {
    // `Number("")` is 0, which would silently set a tunable to zero.
    const r = parseConfigOverrides(DEFAULT_CONFIG, "?gainRotateFree=");
    expect(r.applied).toEqual([]);
    expect(r.config.gainRotateFree).toBe(DEFAULT_CONFIG.gainRotateFree);
  });

  it("⛔ REFUSES a non-number", () => {
    expect(parseConfigOverrides(DEFAULT_CONFIG, "?gainRotateFree=fast").applied).toEqual([]);
  });

  it("ignores the cache-busting parameters this URL routinely carries", () => {
    const r = parseConfigOverrides(DEFAULT_CONFIG, "?cb=7&t=123");
    expect(r.rejected).toEqual([]);
    expect(r.applied).toEqual([]);
  });

  it("an empty query changes nothing", () => {
    expect(parseConfigOverrides(DEFAULT_CONFIG, "").config).toEqual(DEFAULT_CONFIG);
  });

  it("⛔⛔ the result still faces validateGestureConfig", () => {
    // A query string must not be able to smuggle in a config the code would refuse
    // from a file. `MotionTracker` validates, and every `Recognizer` builds one.
    // ⚠ A11 left ONE motion threshold, so the smuggled value is a dead radius BELOW the
    // measured noise floor — which makes STATIONARY unreachable and must be refused.
    const r = parseConfigOverrides(DEFAULT_CONFIG, "?motionDeadbandMm=0.5");
    expect(r.applied.length, "the override must actually be accepted first").toBe(1);
    expect(() => new MotionTracker(r.config)).toThrow(/STATIONARY is unreachable/);
  });
});

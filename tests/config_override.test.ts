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

  it("⛔⛔ AN OVERRIDE THE VALIDATOR REFUSES IS REJECTED *HERE*, NOT THROWN LATER", () => {
    // ⛔⛔⛔ **THIS VECTOR USED TO PIN THE DEFECT.** It read `expect(r.applied.length).toBe(1)`
    // — *"the override must actually be accepted first"* — and then asserted that building a
    // `MotionTracker` throws. ⭐ Both halves were true, and together they described a **blank
    // application**: nothing validates the boot config, so `?motionDeadbandMm=0.5` booted
    // happily and then threw inside the pointer handler on **every single press**, with
    // nothing on the glass and nothing in the HUD to say why. ⚠ A hand would read that as
    // *"the app is dead"*, which is the most expensive report this project can receive.
    // ⭐⭐ `METHOD`: *a vector that asserts a throw is a vector that has decided the throw is
    // acceptable.* This one had decided it on a path the user reaches from a URL.
    const r = parseConfigOverrides(DEFAULT_CONFIG, "?motionDeadbandMm=0.5");
    expect(r.applied, "a config-breaking value is not applied").toEqual([]);
    expect(r.rejected.join(" ")).toMatch(/motionDeadbandMm/);
    expect(r.rejected.join(" "), "and the REASON must reach the HUD").toMatch(
      /STATIONARY is unreachable/,
    );
    // ⭐ The base value survives, so the session boots and is usable.
    expect(r.config.motionDeadbandMm).toBe(DEFAULT_CONFIG.motionDeadbandMm);
    expect(() => new MotionTracker(r.config)).not.toThrow();
  });

  it("⛔⛔ a MALFORMED percent-escape is rejected, and does not take the boot down", () => {
    // ⛔ `decodeURIComponent("%E0")` throws `URIError`. It was called unguarded, inside the
    // scene's constructor — so one malformed character in a shared link produced a blank page
    // whose only trace was `main.ts`'s error box. ⚠ A URL is user input from an untrusted
    // source by definition: it is pasted, shortened, re-typed and mangled by chat clients.
    const r = parseConfigOverrides(DEFAULT_CONFIG, "?motionDeadbandMm=%E0");
    expect(r.applied).toEqual([]);
    expect(r.rejected.length).toBe(1);
    expect(r.config).toEqual(DEFAULT_CONFIG);
  });

  it("⛔ a malformed escape in the KEY is rejected the same way", () => {
    const r = parseConfigOverrides(DEFAULT_CONFIG, "?%E0=3");
    expect(r.applied).toEqual([]);
    expect(r.rejected.length).toBe(1);
  });

  it("⛔ and a malformed bare pair with no `=` does not throw either", () => {
    const r = parseConfigOverrides(DEFAULT_CONFIG, "?%E0");
    expect(r.applied).toEqual([]);
    expect(r.rejected.length).toBe(1);
  });

  it("⭐⭐ TWO overrides that are only valid TOGETHER are both applied", () => {
    // ⛔⛔ THE ORDERING TRAP, AND WHY THE FIX IS TWO-PHASE. Validating after each key in turn
    // would refuse `motionDeadbandMm=0.5` here — it is below 3× the DEFAULT noise — even though
    // the very next key makes it legal. ⭐ So the whole set is tried FIRST, and the one-at-a-time
    // pass runs only when that fails, purely to name the offender.
    const r = parseConfigOverrides(DEFAULT_CONFIG, "?motionDeadbandMm=0.5&pointerNoiseMm=0.1");
    expect(r.rejected).toEqual([]);
    expect(r.config.motionDeadbandMm).toBe(0.5);
    expect(r.config.pointerNoiseMm).toBe(0.1);
    expect(() => new MotionTracker(r.config)).not.toThrow();
  });

  it("⭐ and the order they are written in does not decide it", () => {
    const r = parseConfigOverrides(DEFAULT_CONFIG, "?pointerNoiseMm=0.1&motionDeadbandMm=0.5");
    expect(r.rejected).toEqual([]);
    expect(r.config.motionDeadbandMm).toBe(0.5);
  });

  it("⛔⛔ ONE bad key does not cost the GOOD ones in the same URL", () => {
    // ⚠ The device loop is A/B by URL: losing a whole query because one value was refused
    // would mean a session testing a set of numbers that was never in force.
    const r = parseConfigOverrides(DEFAULT_CONFIG, "?gainRotateFree=45&motionDeadbandMm=0.5");
    expect(r.config.gainRotateFree).toBe(45);
    expect(r.config.motionDeadbandMm).toBe(DEFAULT_CONFIG.motionDeadbandMm);
    expect(r.applied).toEqual(["gainRotateFree=45"]);
    expect(r.rejected.length).toBe(1);
  });
});

/**
 * ⛔⛔⛔ **THE TUNABLES THAT BREAK THE PRODUCT WHEN THEY GO NEGATIVE.**
 *
 * ⭐ Found by audit 2026-09-17. `validateGestureConfig` carried rules for the numbers whose
 * *relationships* matter — the noise floor, the ring heights, the lift window — and none at all
 * for the plain durations, so `?tapMaxDuration=-1` made **every tap a HOLD** and the mode toggle
 * unreachable, with a green suite and no message. ⚠ Each one below is reachable from a URL.
 */
describe("⛔⛔ durations and noise cannot be negative or zero", () => {
  const bad: ReadonlyArray<readonly [string, number, RegExp]> = [
    ["tapMaxDuration", -1, /tapMaxDuration/],
    ["tapMaxDuration", 0, /tapMaxDuration/],
    ["doubleTapWindow", -1, /doubleTapWindow/],
    ["restConfirmMs", -1, /restConfirmMs/],
    ["flickLiftWindow", 0, /flickLiftWindow/],
    ["flickWindow", 0, /flickWindow/],
    // ⛔⛔ ZERO NOISE IS THE DANGEROUS ONE: every noise-relative rule in this validator is a
    // MULTIPLE of it, so `pointerNoiseMm=0` silently admits `motionDeadbandMm=0` and
    // `evictShakeLegMm=0` — one URL parameter disabling three guards at once.
    ["pointerNoiseMm", 0, /pointerNoiseMm/],
    ["pointerNoiseMm", -1, /pointerNoiseMm/],
    ["motionDeadbandMm", 0, /motionDeadbandMm|pointerNoise/],
  ];

  for (const [key, value, pattern] of bad) {
    it(`⛔ REFUSES ${key}=${value}`, () => {
      const r = parseConfigOverrides(DEFAULT_CONFIG, `?${key}=${value}`);
      expect(r.applied, `${key}=${value} must not be applied`).toEqual([]);
      expect(r.rejected.join(" ")).toMatch(pattern);
      expect(() => new MotionTracker(r.config)).not.toThrow();
    });
  }
});

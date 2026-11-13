/**
 * ⭐ (2026-11-13, the owner: "make a slider in the LEVEL so the player can chose its mix of blue") — `core/lighting.ts` `backgroundMix`: the scene's
 * own background with a share of `Scene_1`'s night blue. Each claim shown to fail on its counter-example.
 */
import { describe, expect, it } from "vitest";
import { NIGHT_BLUE, backgroundMix } from "../src/core/lighting";
import { SCENE_1 } from "../src/content/scene_1";
import { SCENE_2 } from "../src/content/scene_2";
import { DEFAULT_CONFIG, validateGestureConfig } from "../src/input/gestureConfig";

const close = (a: readonly number[], b: readonly number[]) => a.every((v, i) => Math.abs(v - b[i]!) < 1e-9);

describe("the background's night-blue share", () => {
  it("the night blue IS Scene_1's background (read, not a second colour)", () => {
    expect(NIGHT_BLUE).toEqual(SCENE_1.lighting!.background);
  });

  it("0 % = the scene's own; 100 % = the night blue; 50 % halfway, channel by channel", () => {
    const base = SCENE_2.lighting!.background;
    expect(close(backgroundMix(base, 0), base)).toBe(true);
    expect(close(backgroundMix(base, 100), NIGHT_BLUE)).toBe(true);
    expect(close(backgroundMix(base, 50), base.map((v, i) => (v + NIGHT_BLUE[i]!) / 2))).toBe(true);
    // the counter-example: 95 % is NOT the scene's own
    expect(close(backgroundMix(base, 95), base)).toBe(false);
  });

  it("out of range is clamped; the slider's default leaves the scene's own background; its range refused past 95", () => {
    const base = SCENE_2.lighting!.background;
    expect(close(backgroundMix(base, -10), base)).toBe(true);
    expect(close(backgroundMix(base, 150), NIGHT_BLUE)).toBe(true);
    expect(DEFAULT_CONFIG.backgroundBluePct).toBe(0);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, backgroundBluePct: 100 })).toThrow(/backgroundBluePct/);
  });
});

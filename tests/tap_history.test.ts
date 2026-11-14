/**
 * ⭐ THE DOUBLE-TAP MEMORY (`TapHistory`, `input/recognizer.ts`) — tested directly since the per-touchpoint `Recognizer` that fed it was deleted
 * (2026-11-14, CL1). Its rules are the ones `recognizer.test.ts` carried: the window RELEASE-to-PRESS, the slop between the two PRESS points, a
 * third tap fresh, `wouldPair` the same question as `record` asked on the way down. ⭐ The put-down's double tap (`PICK_AND_PLACE.md` §3) reads it.
 */
import { describe, expect, it } from "vitest";
import { TapHistory } from "../src/input/recognizer";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";
import { mmToPx } from "../src/core/units";

const cfg = DEFAULT_CONFIG;
const W = cfg.doubleTapWindow;
const slopPx = mmToPx(cfg.doubleTapSlop);

describe("the double-tap memory", () => {
  it("one tap is a TAP; a second within the window and the slop is a DOUBLE_TAP", () => {
    const t = new TapHistory(cfg);
    expect(t.record({ x: 100, y: 100, t: 0 }, 80)).toBe("TAP");
    expect(t.record({ x: 101, y: 100, t: 80 + W - 1 }, 80 + W + 60)).toBe("DOUBLE_TAP");
  });

  it("⛔ a third tap is a fresh TAP, not a second DOUBLE_TAP", () => {
    const t = new TapHistory(cfg);
    t.record({ x: 100, y: 100, t: 0 }, 50);
    expect(t.record({ x: 100, y: 100, t: 100 }, 150)).toBe("DOUBLE_TAP");
    expect(t.record({ x: 100, y: 100, t: 200 }, 250)).toBe("TAP");
  });

  it("⛔ too far apart in TIME — two TAPs (the window is RELEASE-to-PRESS)", () => {
    const t = new TapHistory(cfg);
    t.record({ x: 100, y: 100, t: 0 }, 500);
    expect(t.record({ x: 100, y: 100, t: 500 + W + 1 }, 500 + W + 50)).toBe("TAP");
    // ⭐ counter-example: the same second press one ms inside the window pairs
    const u = new TapHistory(cfg);
    u.record({ x: 100, y: 100, t: 0 }, 500);
    expect(u.record({ x: 100, y: 100, t: 500 + W }, 500 + W + 50)).toBe("DOUBLE_TAP");
  });

  it("⛔ too far apart in SPACE — two TAPs", () => {
    const t = new TapHistory(cfg);
    t.record({ x: 100, y: 100, t: 0 }, 50);
    expect(t.record({ x: 100 + slopPx + 1, y: 100, t: 100 }, 150)).toBe("TAP");
  });

  it("⭐ `wouldPair` answers on the way down what `record` answers on the way up — and mutates nothing", () => {
    const t = new TapHistory(cfg);
    t.record({ x: 100, y: 100, t: 0 }, 50);
    const press = { x: 100, y: 100, t: 120 };
    expect(t.wouldPair(press)).toBe(true);
    expect(t.wouldPair(press)).toBe(true);
    expect(t.record(press, 200)).toBe("DOUBLE_TAP");
    expect(new TapHistory(cfg).wouldPair(press)).toBe(false);
  });

  it("`reset` forgets the last tap", () => {
    const t = new TapHistory(cfg);
    t.record({ x: 100, y: 100, t: 0 }, 50);
    t.reset();
    expect(t.record({ x: 100, y: 100, t: 100 }, 150)).toBe("TAP");
  });
});

import { describe, expect, it } from "vitest";
import { formatDrawState, type DrawState } from "../src/core/frame_meter";

/**
 * ⭐⭐ (2026-11-15) THE HUD's `draw` LINE — the owner's phone showed a black scene and `frame —` after eight minutes: the meter drops every interval over
 * a second, so a stalled loop, a lost context and a canvas of no size all read the same. Each of them is now SAID, and marked.
 */
const OK: DrawState = { frames: 1234, lastIntervalMs: 16.7, longFrames: 0, cssW: 414, cssH: 800, bufW: 828, bufH: 1600, contextLost: false, lost: 0, restored: 0, glError: 0 };

describe("the HUD's draw line (formatDrawState)", () => {
  it("a healthy device: every number, nothing marked", () => {
    expect(formatDrawState(OK)).toBe("gl ok · frames 1234 · last 17ms (long 0) · 414×800 → 828×1600");
  });
  it("an interval over a second is SHOWN and marked — the meter itself drops it", () => {
    const s = formatDrawState({ ...OK, lastIntervalMs: 1650, longFrames: 12 });
    expect(s).toContain("last ⛔1650ms (long 12)");
  });
  it("a canvas or a drawing buffer of no size is marked", () => {
    expect(formatDrawState({ ...OK, cssH: 0 })).toContain("· ⛔414×0 → 828×1600");
    expect(formatDrawState({ ...OK, bufW: 0 })).toContain("· ⛔414×800 → 0×1600");
  });
  it("a lost context is marked, with how often it was lost and restored", () => {
    expect(formatDrawState({ ...OK, contextLost: true, lost: 1 })).toMatch(/^gl ⛔LOST \(lost 1, back 0\) · frames/);
    expect(formatDrawState({ ...OK, lost: 2, restored: 2 })).toMatch(/^gl ok \(lost 2, back 2\) · frames/);
  });
  it("a WebGL error is printed in hex; no context to ask reads —; no second call yet reads —", () => {
    expect(formatDrawState({ ...OK, glError: 0x505 })).toMatch(/^gl ok ⛔err 0x505 · frames/);
    expect(formatDrawState({ ...OK, contextLost: null })).toMatch(/^gl — · frames/);
    expect(formatDrawState({ ...OK, lastIntervalMs: null })).toContain("last —");
  });
});

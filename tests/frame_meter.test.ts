/**
 * GOLDEN VECTORS — **the frame meter** (the owner, 2026-09-28: *"the scene_01 interactions are much
 * slower than the scene_0"*): the median and the slow tail of recent frame intervals.
 */
import { describe, expect, it } from "vitest";
import { FrameMeter, formatFrameStats } from "@core/frame_meter";
import { DEFAULT_CONFIG, validateGestureConfig } from "@input/gestureConfig";

describe("⭐⭐ FrameMeter — the median and the p95 of recent frames", () => {
  it("⭐ nothing measured → null, never a made-up number", () => {
    expect(new FrameMeter().stats()).toBeNull();
    expect(formatFrameStats(null)).toBe("—");
  });

  it("⭐⭐ the TAIL is reported, not averaged away: 1 slow frame in 10 moves the p95, not the median", () => {
    const m = new FrameMeter(100);
    for (let i = 0; i < 90; i++) m.push(16);
    for (let i = 0; i < 10; i++) m.push(50);
    const s = m.stats()!;
    expect(s.medianMs).toBe(16);
    expect(s.p95Ms).toBe(50);
    expect(s.n).toBe(100);
  });

  it("⭐ the window is bounded: old frames leave it", () => {
    const m = new FrameMeter(10);
    for (let i = 0; i < 10; i++) m.push(100);
    for (let i = 0; i < 10; i++) m.push(20);
    expect(m.stats()).toEqual({ medianMs: 20, p95Ms: 20, n: 10 });
  });

  it("⛔ a PAUSE is not a frame: a hidden tab's 5 s gap is dropped, as are nonsense intervals", () => {
    const m = new FrameMeter(10, 1000);
    for (let i = 0; i < 5; i++) m.push(16);
    m.push(5000);
    m.push(NaN);
    m.push(0);
    m.push(-3);
    expect(m.stats()).toEqual({ medianMs: 16, p95Ms: 16, n: 5 });
  });

  it("⭐ the shadow switch is a validated tunable: on by default, 0 or 1 only", () => {
    expect(DEFAULT_CONFIG.shadowsOn).toBe(1);
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, shadowsOn: 0 })).not.toThrow();
    expect(() => validateGestureConfig({ ...DEFAULT_CONFIG, shadowsOn: 0.5 })).toThrow(/shadowsOn/);
  });

  it("the HUD's words", () => {
    expect(formatFrameStats({ medianMs: 20, p95Ms: 41, n: 120 })).toBe("20ms (50 fps) · p95 41ms · n=120");
  });
});

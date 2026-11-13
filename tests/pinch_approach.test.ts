// ⭐⭐⭐ (2026-11-13, the owner: *"simplify the two finger approach on mobile phone: it is currently difficult to latch the two finger approach: propose
// something simpler (for example, use the pinch input for the approach on mobile phone)"* → *"build A"*) THE PINCH IS THE APPROACH: around the assembly
// two fingers spread apart bring the piece IN, pinched together take it OUT; latched as soon as their separation moves past the deadband from where they
// landed, whatever else they do — nothing to classify. ⛔ Before: `twoFingerKind` judged the first move once (common motion the approach, relative the
// pinch zoom) and a real swipe's wobble often fell on the pinch side, which then held for the whole gesture. RED against `601cc85` (no `pinchLatched`,
// `separationMm`, `pinchApproachDyMm`, `approachPinchGain`; the approach the two fingers' mean dy).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { pinchApproachDyMm, pinchLatched, separationMm } from "../src/input/assembly_orbit";
import { DEFAULT_CONFIG } from "../src/input/gestureConfig";

const code = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8").replace(/\s+/g, " ");
const DB = DEFAULT_CONFIG.motionDeadbandMm;

/** the handler's rule replayed on a stream of the two fingers' places (mm): the approach's dy inputs it would send */
function replay(frames: [readonly [number, number], readonly [number, number]][], gain = 1): { latchedAt: number | null; dys: number[] } {
  const sep0 = separationMm(frames[0]![0], frames[0]![1]);
  let sep: number | null = null;
  let latchedAt: number | null = null;
  const dys: number[] = [];
  frames.forEach(([a, b], i) => {
    const s = separationMm(a, b);
    if (latchedAt === null) {
      if (!pinchLatched(sep0, s, DB)) return;
      latchedAt = i;
      sep = s; // ⭐ re-anchored: no jump by the deadband
      return;
    }
    dys.push(pinchApproachDyMm(sep!, s, gain));
    sep = s;
  });
  return { latchedAt, dys };
}

describe("⭐⭐⭐ the pinch is the approach (2026-11-13)", () => {
  it("the separation (mm); latched past the deadband either way; spread = IN (finger-up's sign), pinched = OUT, × the gain", () => {
    expect(separationMm([0, 0], [30, 40])).toBe(50);
    expect(pinchLatched(50, 50 + DB + 0.01, DB)).toBe(true);
    expect(pinchLatched(50, 50 - DB - 0.01, DB)).toBe(true);
    expect(pinchLatched(50, 50 + DB, DB)).toBe(false);
    expect(pinchApproachDyMm(50, 60, 1)).toBe(-10);
    expect(pinchApproachDyMm(60, 50, 1)).toBe(10);
    expect(pinchApproachDyMm(50, 60, 2)).toBe(-20);
  });

  it("a spread latches within its first few millimetres and drives the approach by exactly the spread after the latch — no jump by the deadband", () => {
    const frames: [readonly [number, number], readonly [number, number]][] = [];
    for (let i = 0; i <= 20; i++) frames.push([[50 - i, 80 + 0.3 * Math.sin(i)], [90 + i, 82 - 0.3 * Math.sin(i)]]); // 2 mm a frame, a little wobble
    const r = replay(frames);
    expect(r.latchedAt).not.toBeNull();
    expect(r.latchedAt!).toBeLessThanOrEqual(3);
    const total = r.dys.reduce((s, d) => s + d, 0);
    const sepAt = (i: number) => separationMm(frames[i]![0], frames[i]![1]);
    expect(total).toBeCloseTo(-(sepAt(20) - sepAt(r.latchedAt!)), 9); // IN by the spread made after the latch
    expect(Math.max(...r.dys.map(Math.abs))).toBeLessThan(4.5); // every step a frame's own spread
  });

  it("a two-finger SWIPE (common motion, the fingers' gap kept within the deadband) moves nothing — the drag no longer approaches", () => {
    const frames: [readonly [number, number], readonly [number, number]][] = [];
    for (let i = 0; i <= 30; i++) frames.push([[40, 100 - 2 * i], [80 + 1.5 * Math.sin(i / 3), 100 - 2 * i + 1.5 * Math.cos(i / 3)]]);
    expect(replay(frames).latchedAt).toBeNull();
  });

  it("the gain's default and its slider; validated", () => {
    expect(DEFAULT_CONFIG.approachPinchGain).toBe(1);
    expect(code("render/tuning_menu.ts")).toContain('"approachPinchGain", 0.1, 5, 0.1)');
    expect(code("input/gestureConfig.ts")).toContain("if (!(cfg.approachPinchGain > 0 && cfg.approachPinchGain <= 10)) throw");
  });

  it("wired: around the assembly two real fingers latch on the separation (from where they landed), then each move sends the separation's change; a tapped approach undone; either finger lifting ends it", () => {
    const h = code("render/hold_wiring.ts");
    expect(h).toContain("if (h.base === undefined || h.base === null) h.base = { approach: st.approach, sep0: sep, sep: null }; if (!pinchLatched(h.base.sep0, sep, st.cfg.motionDeadbandMm)) return h.mode; h.base.sep = sep; h.mode = \"APPROACH\";");
    expect(h).toContain("if (h.base.sep !== null) approachInput(st, pinchApproachDyMm(h.base.sep, sep, st.cfg.approachPinchGain)); h.base.sep = sep;");
    expect(h).toContain('if (mode !== h.mode && h.mode === "APPROACH" && h.base) st.approach = h.base.approach;');
    expect(h).toContain('if (h.mode === "APPROACH") { approachRelease(st); st.hold = null;');
    // ⭐ the desktop's key (ALT / CTRL) has no position: never a pinch — A + drag is its approach
    expect(h.indexOf("if (h.second === MOUSE_SECOND_ID) {")).toBeLessThan(h.indexOf("pinchLatched("));
    expect(code("render/hold_wiring.ts")).not.toMatch(/twoFingerKind\(/); // named in its history comment only
    expect(code("input/assembly_orbit.ts")).not.toMatch(/export function twoFingerKind/);
  });
});

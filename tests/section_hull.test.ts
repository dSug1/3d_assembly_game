/**
 * ⭐⭐ THE SECTION LINES' SAMPLES (2026-11-02) — `input/section_hull.ts`, what is left of the gizmo's carrier on the section's hull: ⛔⛔⛔ the carrier is
 * DELETED by Step 4c-bis (2026-11-04 — the gizmo a function of the orbit's angles, `input/face_map.ts`, `tests/face_map.test.ts`); its vectors stand at
 * `da020af`.
 */
import { describe, expect, it } from "vitest";

describe("⭐⭐ the section lines' samples (what is left of the carrier, 2026-11-04 Step 4c-bis)", () => {
  it("⭐⭐⭐ THE SECTIONS DRAWN THROUGH THE GIZMO (2026-11-02, *\"build it (option A, symetric)\"*): fixed samples, the gizmo inserted — moved, nothing else moves", async () => {
    const H = await import("../src/input/section_hull");
    expect(H.sectionFixed).toBeDefined(); // ⛔ the old: the carrier REPLACED the nearest red sample (the kink hopped), the green started at the carrier (every point slid)
    const red = H.sectionFixed(0.6, 63, false);
    expect(red.length).toBe(63);
    expect(red[0]).toBe(0);
    expect(red[62]).toBeCloseTo(0.6, 12);
    const loop = H.sectionFixed(2, 96, true);
    expect(loop.length).toBe(96);
    expect(loop[0]).toBe(0);
    expect(loop[95]).toBeCloseTo(2 - 2 / 96, 12); // closed: no repeat of the start
    // the gizmo inserted where it falls; moved along, the fixed samples are the same and only its slot changes
    const i1 = H.insertIndex(red, 0.3141), i2 = H.insertIndex(red, 0.3199);
    expect(red[i1 - 1]!).toBeLessThanOrEqual(0.3141);
    expect(red[i1]!).toBeGreaterThan(0.3141);
    expect(i2 - i1).toBeLessThanOrEqual(1);
    expect(H.insertIndex(red, -1)).toBe(0);
    expect(H.insertIndex(red, 5)).toBe(63);
  });
  it("⭐⭐ the gizmo's vertex never left alone: cut off on both sides (across a jump), the nearer neighbour joined anyway", async () => {
    const H = await import("../src/input/section_hull");
    expect(H.gizmoJoins(true, false, 1, 9)).toEqual([true, false]); // the line's own rule where it joins
    expect(H.gizmoJoins(false, false, 0.03, 0.05)).toEqual([true, false]); // ⛔ the old rule: both cut — the ring 30 mm off the drawn red
    expect(H.gizmoJoins(false, false, 0.05, 0.03)).toEqual([false, true]);
  });
});
